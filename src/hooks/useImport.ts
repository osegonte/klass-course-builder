import { supabase } from '../lib/supabase'

// ─── Curriculum import (subjects → topics → subtopics) ────────────────────────

export async function importCurriculum(json: string): Promise<{
  inserted: number
  errors: string[]
}> {
  const data = JSON.parse(json)
  let inserted = 0
  const errors: string[] = []

  for (const subject of data.subjects ?? []) {
    const { data: subjectRow, error: subjectErr } = await supabase
      .from('cs_structure')
      .upsert({
        type: 'subject',
        name: subject.name,
        external_id: subject.external_id,
        subject_id: null,
        parent_id: null,
        objectives: null,
        order: subject.order ?? 0,
        source: data.source ?? 'unknown',
        is_active: true,
      }, { onConflict: 'external_id' })
      .select('id')
      .single()

    if (subjectErr || !subjectRow) {
      errors.push(`Subject "${subject.name}": ${subjectErr?.message}`)
      continue
    }

    // Self-reference subject_id
    await supabase
      .from('cs_structure')
      .update({ subject_id: subjectRow.id })
      .eq('id', subjectRow.id)

    inserted++

    for (const topic of subject.topics ?? []) {
      const { data: topicRow, error: topicErr } = await supabase
        .from('cs_structure')
        .upsert({
          type: 'topic',
          name: topic.name,
          external_id: topic.external_id,
          subject_id: subjectRow.id,
          parent_id: subjectRow.id,
          objectives: topic.objectives ?? [],
          order: topic.order ?? 0,
          source: data.source ?? 'unknown',
          is_active: true,
        }, { onConflict: 'external_id' })
        .select('id')
        .single()

      if (topicErr || !topicRow) {
        errors.push(`Topic "${topic.name}": ${topicErr?.message}`)
        continue
      }

      inserted++

      for (const subtopic of topic.subtopics ?? []) {
        const { error: subtopicErr } = await supabase
          .from('cs_structure')
          .upsert({
            type: 'subtopic',
            name: subtopic.name,
            external_id: subtopic.external_id,
            subject_id: subjectRow.id,
            parent_id: topicRow.id,
            objectives: null,
            order: subtopic.order ?? 0,
            source: data.source ?? 'unknown',
            is_active: true,
          }, { onConflict: 'external_id' })

        if (subtopicErr) {
          errors.push(`Subtopic "${subtopic.name}": ${subtopicErr.message}`)
        } else {
          inserted++
        }
      }
    }
  }

  return { inserted, errors }
}

// ─── Question import (receive questions FROM an external app) ──────────────────
// If a question references a subtopic that doesn't exist in cs_structure yet,
// we auto-scaffold the minimal subject/topic/subtopic rows so nothing is lost.
// The user can do a full curriculum import later to enrich those rows.

export interface QuestionImportSummary {
  total: number
  scaffolded: number  // structure rows auto-created because they didn't exist yet
  errors: string[]
}

async function ensureStructureRow(params: {
  type: 'subject' | 'topic' | 'subtopic'
  external_id: string
  name: string
  subject_id: string | null
  parent_id: string | null
  source: string
}): Promise<string | null> {
  // Check if it already exists
  const { data: existing } = await supabase
    .from('cs_structure')
    .select('id')
    .eq('external_id', params.external_id)
    .single()

  if (existing) return existing.id

  // Create it as a scaffold row
  const { data: created, error } = await supabase
    .from('cs_structure')
    .insert({
      type: params.type,
      name: params.name,
      external_id: params.external_id,
      subject_id: params.subject_id,
      parent_id: params.parent_id,
      objectives: null,
      order: 0,
      source: params.source,
      is_active: true,
      is_scaffold: true,  // marks it as auto-created, not from a full curriculum import
    })
    .select('id')
    .single()

  if (error) return null
  return created?.id ?? null
}

export async function importQuestions(json: string): Promise<QuestionImportSummary> {
  const data = JSON.parse(json)
  const questions = data.questions ?? []
  const source = data.source ?? 'unknown'
  const errors: string[] = []
  let scaffolded = 0

  // Cache scaffold results so we don't re-insert for every question
  const scaffoldCache = new Map<string, { subtopicId: string; subjectId: string }>()

  for (const q of questions) {
    let subtopicId: string | null = null
    let subjectId: string | null = null

    const cacheKey = q.subtopic_external_id
    if (cacheKey && scaffoldCache.has(cacheKey)) {
      const cached = scaffoldCache.get(cacheKey)!
      subtopicId = cached.subtopicId
      subjectId = cached.subjectId
    } else if (q.subtopic_external_id) {
      // Ensure subject scaffold
      let resolvedSubjectId: string | null = null
      if (q.subject_external_id) {
        resolvedSubjectId = await ensureStructureRow({
          type: 'subject',
          external_id: q.subject_external_id,
          name: q.subject_name || 'Unknown Subject',
          subject_id: null,
          parent_id: null,
          source,
        })
        if (resolvedSubjectId) {
          // Self-reference subject_id
          await supabase
            .from('cs_structure')
            .update({ subject_id: resolvedSubjectId })
            .eq('id', resolvedSubjectId)
          scaffolded++
        }
      }

      // Ensure topic scaffold
      let resolvedTopicId: string | null = null
      if (q.topic_external_id) {
        resolvedTopicId = await ensureStructureRow({
          type: 'topic',
          external_id: q.topic_external_id,
          name: q.topic_name || 'Unknown Topic',
          subject_id: resolvedSubjectId,
          parent_id: resolvedSubjectId,
          source,
        })
        if (resolvedTopicId) scaffolded++
      }

      // Ensure subtopic scaffold
      subtopicId = await ensureStructureRow({
        type: 'subtopic',
        external_id: q.subtopic_external_id,
        name: q.subtopic_name || 'Unknown Subtopic',
        subject_id: resolvedSubjectId,
        parent_id: resolvedTopicId,
        source,
      })
      if (subtopicId) scaffolded++
      subjectId = resolvedSubjectId

      if (subtopicId) {
        scaffoldCache.set(cacheKey, { subtopicId, subjectId: subjectId ?? '' })
      }
    }

    const { error } = await supabase.from('cs_draft_questions').upsert({
      id: q.external_question_id ?? crypto.randomUUID(),
      subtopic_id: subtopicId,
      subject_id: subjectId,
      type: q.type ?? 'mcq',
      question_text: q.question_text ?? '',
      options: q.options ?? [],
      correct_answer: q.correct_answer ?? '',
      hint: q.hint ?? '',
      status: 'draft',
      question_order: 0,
    }, { onConflict: 'id' })

    if (error) errors.push(`"${q.question_text?.slice(0, 40)}...": ${error.message}`)
  }

  return { total: questions.length, scaffolded, errors }
}
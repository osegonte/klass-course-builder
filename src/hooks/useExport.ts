import { supabase } from '../lib/supabase'

export interface ExportQuestion {
  external_question_id: string
  subject_external_id: string | null
  subtopic_external_id: string | null
  subject_name: string
  topic_name: string
  subtopic_name: string
  type: string
  question_text: string
  options: { id: string; text: string }[]
  correct_answer: string
  hint: string
}

export async function exportReadyQuestions(): Promise<{
  json: string
  filename: string
  count: number
}> {
  // Load all ready draft questions
  const { data: drafts, error } = await supabase
    .from('cs_draft_questions')
    .select('*')
    .eq('status', 'ready')

  if (error) throw new Error(error.message)
  if (!drafts || drafts.length === 0) throw new Error('No questions marked as ready.')

  // Load all relevant cs_structure rows to get names + external_ids
  const subtopicIds = [...new Set(drafts.map(d => d.subtopic_id))]
  const { data: structureRows } = await supabase
    .from('cs_structure')
    .select('id, type, name, external_id, parent_id, subject_id')
    .in('id', subtopicIds)

  // Build lookup maps
  const subtopicMap = new Map<string, any>()
  const idMap = new Map<string, any>()

  for (const row of structureRows ?? []) {
    idMap.set(row.id, row)
    if (row.type === 'subtopic') subtopicMap.set(row.id, row)
  }

  // Load topic and subject rows we need
  const parentIds = [...new Set((structureRows ?? []).map(r => r.parent_id).filter(Boolean))]
  const subjectIds = [...new Set((structureRows ?? []).map(r => r.subject_id).filter(Boolean))]
  const extraIds = [...new Set([...parentIds, ...subjectIds])]

  if (extraIds.length > 0) {
    const { data: extraRows } = await supabase
      .from('cs_structure')
      .select('id, type, name, external_id, parent_id, subject_id')
      .in('id', extraIds)
    for (const row of extraRows ?? []) idMap.set(row.id, row)
  }

  const questions: ExportQuestion[] = drafts.map(d => {
    const subtopic = idMap.get(d.subtopic_id)
    const topic = subtopic ? idMap.get(subtopic.parent_id) : null
    const subject = subtopic ? idMap.get(subtopic.subject_id) : null

    return {
      external_question_id: d.id,
      subject_external_id: subject?.external_id ?? null,
      subtopic_external_id: subtopic?.external_id ?? null,
      subject_name: subject?.name ?? '',
      topic_name: topic?.name ?? '',
      subtopic_name: subtopic?.name ?? '',
      type: d.type,
      question_text: d.question_text,
      options: d.options ?? [],
      correct_answer: d.correct_answer,
      hint: d.hint ?? '',
    }
  })

  const payload = {
    source: 'klass-studio',
    exported_at: new Date().toISOString(),
    questions,
  }

  // Mark all as exported
  const ids = drafts.map(d => d.id)
  await supabase
    .from('cs_draft_questions')
    .update({ status: 'exported' })
    .in('id', ids)

  const date = new Date().toISOString().split('T')[0]
  return {
    json: JSON.stringify(payload, null, 2),
    filename: `klass-questions-${date}.json`,
    count: questions.length,
  }
}

export function downloadJSON(json: string, filename: string) {
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
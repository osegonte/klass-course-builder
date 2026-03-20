import { supabase } from '../lib/supabase'
import type { ExportFormat } from '../types/content'

export interface ExportQuestion {
  klass_question_id: string
  subtopic_name: string
  topic_name: string
  subject_name: string
  type: string
  question_text: string
  options: { id: string; text: string }[]
  correct_answer: string
  hint: string
}

export async function exportQuestions(
  subjectId: string,
  topicId: string | null,
  format: ExportFormat,
  consumerName?: string
): Promise<{ json: string; filename: string; count: number }> {

  // Load ready questions
  let query = supabase
    .from('questions')
    .select(`
      id, type, question_text, options, correct_answer, hint, status,
      subtopic_id,
      subtopics (
        name, topic_id,
        topics ( name )
      ),
      subjects ( name )
    `)
    .eq('subject_id', subjectId)
    .eq('status', 'ready')
    .eq('is_mock_question', false)

  if (topicId) {
    // Filter by topic via subtopics join — fetch subtopic ids for this topic first
    const { data: subs } = await supabase
      .from('subtopics')
      .select('id')
      .eq('topic_id', topicId)
    const subIds = (subs ?? []).map(s => s.id)
    if (subIds.length === 0) throw new Error('No subtopics found for this topic.')
    query = query.in('subtopic_id', subIds)
  }

  const { data: rows, error } = await query
  if (error) throw new Error(error.message)
  if (!rows || rows.length === 0) throw new Error('No questions marked as ready.')

  const questions: ExportQuestion[] = rows.map((r: any) => ({
    klass_question_id: r.id,
    subject_name: r.subjects?.name ?? '',
    topic_name: (r.subtopics as any)?.topics?.name ?? '',
    subtopic_name: (r.subtopics as any)?.name ?? '',
    type: r.type,
    question_text: r.question_text,
    options: r.options ?? [],
    correct_answer: r.correct_answer,
    hint: r.hint ?? '',
  }))

  const payload = {
    source: 'klass-studio',
    format,
    exported_at: new Date().toISOString(),
    questions,
  }

  // Log export
  await supabase.from('consumer_exports').insert({
    subject_id: subjectId,
    topic_id: topicId ?? null,
    format,
    consumer_name: consumerName ?? null,
    question_count: questions.length,
  })

  // Mark as exported
  const ids = rows.map((r: any) => r.id)
  await supabase.from('questions').update({ status: 'exported' }).in('id', ids)

  const date = new Date().toISOString().split('T')[0]
  return {
    json: JSON.stringify(payload, null, 2),
    filename: `klass-export-${date}.json`,
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
import { useState, useEffect, useCallback } from 'react'
import { supabase, serviceClient } from '../lib/supabase'
import type { Question } from '../types/content'

// KLASS draft questions live in cs_draft_questions (KLASS-only)
// When exported, they get written to cs_questions (Jamsulator reads this)

function rowToQuestion(row: any): Question {
  return {
    id: row.id,
    type: row.type,
    questionText: row.question_text,
    options: row.options ?? [],
    correctAnswer: row.correct_answer,
    hint: row.hint ?? '',
    status: row.status,
    order: row.question_order,
  }
}

export function useQuestions(subtopicId: string, subjectId?: string) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!subtopicId) return
    const { data, error } = await supabase
      .from('cs_draft_questions')
      .select('*')
      .eq('subtopic_id', subtopicId)
      .order('question_order')
    if (!error && data) setQuestions(data.map(rowToQuestion))
    setLoading(false)
  }, [subtopicId])

  useEffect(() => { fetch() }, [fetch])

  const addQuestion = async (q: Question) => {
    await supabase.from('cs_draft_questions').insert({
      id: q.id,
      subtopic_id: subtopicId,
      subject_id: subjectId ?? null,
      type: q.type,
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      hint: q.hint,
      status: 'draft',
      question_order: q.order,
    })
    await fetch()
  }

  const updateQuestion = async (q: Question) => {
    await supabase.from('cs_draft_questions').update({
      type: q.type,
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      hint: q.hint,
      status: q.status,
      question_order: q.order,
    }).eq('id', q.id)
    setQuestions(prev => prev.map(p => p.id === q.id ? q : p))
  }

  const deleteQuestion = async (id: string) => {
    await supabase.from('cs_draft_questions').delete().eq('id', id)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  // Mark a single draft question as ready
  const markReady = async (id: string) => {
    await supabase.from('cs_draft_questions').update({ status: 'ready' }).eq('id', id)
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, status: 'ready' } : q))
  }

  // Export one question to cs_questions (Jamsulator picks it up)
  const exportQuestion = async (q: Question) => {
    if (!subjectId) return
    await serviceClient.from('cs_questions').insert({
      subtopic_id: subtopicId,
      subject_id: subjectId,
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      hint: q.hint,
      type: q.type,
      status: 'ready',
    })
    // Mark draft as exported
    await supabase.from('cs_draft_questions').update({ status: 'exported' }).eq('id', q.id)
    setQuestions(prev => prev.map(p => p.id === q.id ? { ...p, status: 'exported' } : p))
  }

  // Export all ready questions at once
  const exportAllReady = async () => {
    const ready = questions.filter(q => q.status === 'ready')
    for (const q of ready) await exportQuestion(q)
  }

  return {
    questions,
    loading,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    markReady,
    exportQuestion,
    exportAllReady,
    refetch: fetch,
  }
}
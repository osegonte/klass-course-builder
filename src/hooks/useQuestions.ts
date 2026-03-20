import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Question } from '../types/content'

function rowToQuestion(row: any): Question {
  return {
    id: row.id,
    subtopicId: row.subtopic_id ?? undefined,
    subjectId: row.subject_id ?? undefined,
    type: row.type,
    questionText: row.question_text,
    options: row.options ?? [],
    correctAnswer: row.correct_answer,
    hint: row.hint ?? '',
    imageUrl: row.image_url ?? undefined,
    status: row.status,
    isMockQuestion: row.is_mock_question ?? false,
    order: row.question_order,
  }
}

// Questions attached to a specific subtopic (course questions)
export function useQuestions(subtopicId: string) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!subtopicId) return
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subtopic_id', subtopicId)
      .order('question_order')
    if (!error && data) setQuestions(data.map(rowToQuestion))
    setLoading(false)
  }, [subtopicId])

  useEffect(() => { fetch() }, [fetch])

  const addQuestion = async (q: Question) => {
    await supabase.from('questions').insert({
      id: q.id,
      subtopic_id: subtopicId,
      subject_id: q.subjectId ?? null,
      type: q.type,
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      hint: q.hint,
      status: 'draft',
      is_mock_question: false,
      question_order: q.order,
    })
    await fetch()
  }

  const updateQuestion = async (q: Question) => {
    await supabase.from('questions').update({
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
    await supabase.from('questions').delete().eq('id', id)
    setQuestions(prev => prev.filter(q => q.id !== id))
  }

  const markReady = async (id: string) => {
    await supabase.from('questions').update({ status: 'ready' }).eq('id', id)
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, status: 'ready' as const } : q))
  }

  const markExported = async (ids: string[]) => {
    await supabase.from('questions').update({ status: 'exported' }).in('id', ids)
    setQuestions(prev => prev.map(q => ids.includes(q.id) ? { ...q, status: 'exported' as const } : q))
  }

  return { questions, loading, addQuestion, updateQuestion, deleteQuestion, markReady, markExported, refetch: fetch }
}

// Standalone mock exam questions (not tied to a subtopic)
export function useMockQuestions(subjectId: string) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!subjectId) return
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('is_mock_question', true)
      .order('created_at', { ascending: false })
    if (!error && data) setQuestions(data.map(rowToQuestion))
    setLoading(false)
  }, [subjectId])

  useEffect(() => { fetch() }, [fetch])

  const addMockQuestion = async (q: Omit<Question, 'id' | 'isMockQuestion'>) => {
    const { data, error } = await supabase.from('questions').insert({
      subject_id: subjectId,
      subtopic_id: null,
      type: q.type,
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      hint: q.hint,
      status: 'draft',
      is_mock_question: true,
      question_order: 0,
    }).select().single()
    if (!error && data) setQuestions(prev => [rowToQuestion(data), ...prev])
  }

  return { questions, loading, addMockQuestion, refetch: fetch }
}

// Topic-level questions (for course intro)
export function useTopicQuestions(topicId: string) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!topicId) return
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)
      .is('subtopic_id', null)
      .order('question_order')
    if (!error && data) setQuestions(data.map(rowToQuestion))
    setLoading(false)
  }, [topicId])

  useEffect(() => { fetch() }, [fetch])

  const addQuestion = async (q: Question) => {
    await supabase.from('questions').insert({
      id: q.id,
      topic_id: topicId,
      subtopic_id: null,
      subject_id: q.subjectId ?? null,
      type: q.type,
      question_text: q.questionText,
      options: q.options,
      correct_answer: q.correctAnswer,
      hint: q.hint,
      status: 'draft',
      is_mock_question: false,
      question_order: q.order,
    })
    await fetch()
  }

  return { questions, loading, addQuestion, refetch: fetch }
}
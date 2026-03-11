import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Question } from '../types/content'

export function useQuestions(topicId: string) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadQuestions()
  }, [topicId])

  const loadQuestions = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('questions')
      .select('*')
      .eq('topic_id', topicId)
      .order('question_order', { ascending: true })

    if (!error && data) {
      setQuestions(data.map(row => ({
        id: row.id,
        type: row.type,
        questionText: row.question_text,
        options: row.options || [],
        correctAnswer: row.correct_answer,
        explanation: row.explanation,
        imageUrl: row.image_url,
        order: row.question_order,
      })))
    }
    setLoading(false)
  }

  const addQuestion = async (question: Question) => {
    setQuestions(prev => [...prev, question])

    const { error } = await supabase
      .from('questions')
      .insert({
        id: question.id,
        topic_id: topicId,
        type: question.type,
        question_text: question.questionText,
        options: question.options,
        correct_answer: question.correctAnswer,
        explanation: question.explanation,
        image_url: question.imageUrl,
        question_order: question.order,
      })

    if (error) {
      console.error('Failed to save question:', error.message)
      setQuestions(prev => prev.filter(q => q.id !== question.id))
    }
  }

  const updateQuestion = async (updated: Question) => {
    setQuestions(prev => prev.map(q => q.id === updated.id ? updated : q))

    const { error } = await supabase
      .from('questions')
      .update({
        type: updated.type,
        question_text: updated.questionText,
        options: updated.options,
        correct_answer: updated.correctAnswer,
        explanation: updated.explanation,
        image_url: updated.imageUrl,
        question_order: updated.order,
      })
      .eq('id', updated.id)

    if (error) console.error('Failed to update question:', error.message)
  }

  const deleteQuestion = async (id: string) => {
    setQuestions(prev => prev.filter(q => q.id !== id))

    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete question:', error.message)
      loadQuestions()
    }
  }

  return { questions, loading, addQuestion, updateQuestion, deleteQuestion }
}
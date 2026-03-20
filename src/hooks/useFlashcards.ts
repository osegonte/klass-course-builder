import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { Flashcard } from '../types/content'

function rowToFlashcard(row: any): Flashcard {
  return { id: row.id, front: row.front, back: row.back, order: row.card_order }
}

export function useFlashcards(subtopicId: string) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!subtopicId) return
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('subtopic_id', subtopicId)
      .order('card_order')
    if (!error && data) setFlashcards(data.map(rowToFlashcard))
    setLoading(false)
  }, [subtopicId])

  useEffect(() => { fetch() }, [fetch])

  const addFlashcard = async (card: Flashcard) => {
    await supabase.from('flashcards').insert({
      id: card.id, subtopic_id: subtopicId, front: card.front, back: card.back, card_order: card.order,
    })
    await fetch()
  }

  const updateFlashcard = async (card: Flashcard) => {
    await supabase.from('flashcards').update({ front: card.front, back: card.back, card_order: card.order }).eq('id', card.id)
    setFlashcards(prev => prev.map(c => c.id === card.id ? card : c))
  }

  const deleteFlashcard = async (id: string) => {
    await supabase.from('flashcards').delete().eq('id', id)
    setFlashcards(prev => prev.filter(c => c.id !== id))
  }

  return { flashcards, loading, addFlashcard, updateFlashcard, deleteFlashcard, refetch: fetch }
}

// Topic-level flashcards (for course intro)
export function useTopicFlashcards(topicId: string) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!topicId) return
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('topic_id', topicId)
      .is('subtopic_id', null)
      .order('card_order')
    if (!error && data) setFlashcards(data.map(rowToFlashcard))
    setLoading(false)
  }, [topicId])

  useEffect(() => { fetch() }, [fetch])

  const addFlashcard = async (card: Flashcard) => {
    await supabase.from('flashcards').insert({
      id: card.id, topic_id: topicId, subtopic_id: null,
      front: card.front, back: card.back, card_order: card.order,
    })
    await fetch()
  }

  const updateFlashcard = async (card: Flashcard) => {
    await supabase.from('flashcards').update({ front: card.front, back: card.back, card_order: card.order }).eq('id', card.id)
    setFlashcards(prev => prev.map(c => c.id === card.id ? card : c))
  }

  const deleteFlashcard = async (id: string) => {
    await supabase.from('flashcards').delete().eq('id', id)
    setFlashcards(prev => prev.filter(c => c.id !== id))
  }

  return { flashcards, loading, addFlashcard, updateFlashcard, deleteFlashcard, refetch: fetch }
}
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Flashcard } from '../types/content'

export function useFlashcards(topicId: string) {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFlashcards()
  }, [topicId])

  const loadFlashcards = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('flashcards')
      .select('*')
      .eq('topic_id', topicId)
      .order('card_order', { ascending: true })

    if (!error && data) {
      setFlashcards(data.map(row => ({
        id: row.id,
        front: row.front,
        back: row.back,
        order: row.card_order,
      })))
    }
    setLoading(false)
  }

  const addFlashcard = async (card: Flashcard) => {
    setFlashcards(prev => [...prev, card])

    const { error } = await supabase
      .from('flashcards')
      .insert({
        id: card.id,
        topic_id: topicId,
        front: card.front,
        back: card.back,
        card_order: card.order,
      })

    if (error) {
      console.error('Failed to save flashcard:', error.message)
      setFlashcards(prev => prev.filter(c => c.id !== card.id))
    }
  }

  const updateFlashcard = async (updated: Flashcard) => {
    setFlashcards(prev => prev.map(c => c.id === updated.id ? updated : c))

    const { error } = await supabase
      .from('flashcards')
      .update({
        front: updated.front,
        back: updated.back,
        card_order: updated.order,
      })
      .eq('id', updated.id)

    if (error) console.error('Failed to update flashcard:', error.message)
  }

  const deleteFlashcard = async (id: string) => {
    setFlashcards(prev => prev.filter(c => c.id !== id))

    const { error } = await supabase
      .from('flashcards')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete flashcard:', error.message)
      loadFlashcards()
    }
  }

  return { flashcards, loading, addFlashcard, updateFlashcard, deleteFlashcard }
}
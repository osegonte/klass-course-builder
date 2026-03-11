import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Placement {
  id: string
  questionId: string
  blockId: string
  placementType: string
}

export function usePlacements(topicId: string) {
  const [placements, setPlacements] = useState<Placement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadPlacements()
  }, [topicId])

  const loadPlacements = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('question_placements')
      .select('*')
      .eq('topic_id', topicId)

    if (!error && data) {
      setPlacements(data.map(row => ({
        id: row.id,
        questionId: row.question_id,
        blockId: row.block_id,
        placementType: row.placement_type,
      })))
    }
    setLoading(false)
  }

  const addPlacement = async (questionId: string, blockId: string) => {
    const existing = placements.find(p => p.questionId === questionId)
    if (existing) {
      await updatePlacement(existing.id, blockId)
      return
    }

    const newPlacement: Placement = {
      id: crypto.randomUUID(),
      questionId,
      blockId,
      placementType: 'inline',
    }

    setPlacements(prev => [...prev, newPlacement])

    const { error } = await supabase
      .from('question_placements')
      .insert({
        id: newPlacement.id,
        topic_id: topicId,
        question_id: questionId,
        block_id: blockId,
        placement_type: 'inline',
      })

    if (error) {
      console.error('Failed to save placement:', error.message)
      setPlacements(prev => prev.filter(p => p.id !== newPlacement.id))
    }
  }

  const updatePlacement = async (id: string, blockId: string) => {
    setPlacements(prev => prev.map(p => p.id === id ? { ...p, blockId } : p))

    const { error } = await supabase
      .from('question_placements')
      .update({ block_id: blockId })
      .eq('id', id)

    if (error) console.error('Failed to update placement:', error.message)
  }

  const removePlacement = async (questionId: string) => {
    const placement = placements.find(p => p.questionId === questionId)
    if (!placement) return

    setPlacements(prev => prev.filter(p => p.questionId !== questionId))

    const { error } = await supabase
      .from('question_placements')
      .delete()
      .eq('id', placement.id)

    if (error) {
      console.error('Failed to remove placement:', error.message)
      loadPlacements()
    }
  }

  return { placements, loading, addPlacement, removePlacement }
}
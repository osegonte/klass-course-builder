import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface Placement {
  id: string
  subtopicId: string
  questionId: string
  afterBlockId: string | null
}

export function usePlacements(subtopicId: string) {
  const [placements, setPlacements] = useState<Placement[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!subtopicId) return
    setLoading(true)
    const { data, error } = await supabase
      .from('question_placements')
      .select('*')
      .eq('subtopic_id', subtopicId)
    if (!error && data) {
      setPlacements(data.map(row => ({
        id: row.id,
        subtopicId: row.subtopic_id,
        questionId: row.question_id,
        afterBlockId: row.after_block_id ?? null,
      })))
    }
    setLoading(false)
  }, [subtopicId])

  useEffect(() => { fetch() }, [fetch])

  const addPlacement = async (questionId: string, afterBlockId: string | null) => {
    const existing = placements.find(p => p.questionId === questionId)
    if (existing) {
      await updatePlacement(existing.id, afterBlockId)
      return
    }
    const { data, error } = await supabase
      .from('question_placements')
      .insert({ subtopic_id: subtopicId, question_id: questionId, after_block_id: afterBlockId })
      .select()
      .single()
    if (!error && data) {
      setPlacements(prev => [...prev, {
        id: data.id, subtopicId, questionId, afterBlockId,
      }])
    }
  }

  const updatePlacement = async (id: string, afterBlockId: string | null) => {
    await supabase.from('question_placements').update({ after_block_id: afterBlockId }).eq('id', id)
    setPlacements(prev => prev.map(p => p.id === id ? { ...p, afterBlockId } : p))
  }

  const removePlacement = async (questionId: string) => {
    const placement = placements.find(p => p.questionId === questionId)
    if (!placement) return
    await supabase.from('question_placements').delete().eq('id', placement.id)
    setPlacements(prev => prev.filter(p => p.questionId !== questionId))
  }

  return { placements, loading, addPlacement, removePlacement, refetch: fetch }
}
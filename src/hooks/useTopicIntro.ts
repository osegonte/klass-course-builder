import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CSTopicIntro } from '../types/content'

function rowToIntro(row: any): CSTopicIntro {
  return {
    id:               row.id,
    topicId:          row.topic_id,
    overview:         row.overview         ?? '',
    whyItMatters:     row.why_it_matters   ?? '',
    prerequisites:    row.prerequisites    ?? '',
    sourceTextbook:   row.source_textbook  ?? '',
    sourceTranscript: row.source_transcript ?? '',
    sourceExtra:      row.source_extra     ?? '',
    isComplete:       row.is_complete      ?? false,
    updatedAt:        row.updated_at,
  }
}

export function useTopicIntro(topicId: string) {
  const [intro,   setIntro]   = useState<CSTopicIntro | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)

  const fetch = useCallback(async () => {
    if (!topicId) return
    setLoading(true)
    const { data } = await supabase
      .from('topic_intros')
      .select('*')
      .eq('topic_id', topicId)
      .maybeSingle()
    setIntro(data ? rowToIntro(data) : null)
    setLoading(false)
  }, [topicId])

  useEffect(() => { fetch() }, [fetch])

  const save = async (updates: {
    overview?:         string
    whyItMatters?:     string
    prerequisites?:    string
    sourceTextbook?:   string
    sourceTranscript?: string
    sourceExtra?:      string
    objectives?:       string[]
    isComplete?:       boolean
  }) => {
    if (!topicId) return false
    setSaving(true)

    const payload: any = {
      topic_id:         topicId,
      overview:         updates.overview         ?? intro?.overview         ?? '',
      why_it_matters:   updates.whyItMatters     ?? intro?.whyItMatters     ?? '',
      prerequisites:    updates.prerequisites    ?? intro?.prerequisites    ?? '',
      source_textbook:  updates.sourceTextbook   ?? intro?.sourceTextbook   ?? '',
      source_transcript:updates.sourceTranscript ?? intro?.sourceTranscript ?? '',
      source_extra:     updates.sourceExtra      ?? intro?.sourceExtra      ?? '',
      is_complete:      updates.isComplete       ?? intro?.isComplete       ?? false,
    }

    // Save objectives to both topic_intros and topics table
    if (updates.objectives !== undefined) {
      payload.objectives = updates.objectives
      // Also sync to topics.objectives for quick access
      await supabase
        .from('topics')
        .update({ objectives: updates.objectives, description: payload.overview })
        .eq('id', topicId)
    }

    const { data, error } = await supabase
      .from('topic_intros')
      .upsert(payload, { onConflict: 'topic_id' })
      .select()
      .single()

    if (!error && data) {
      setIntro({ ...rowToIntro(data), })
    }
    setSaving(false)
    return !error
  }

  const markComplete = async () => {
    const saved = await save({ isComplete: true })
    if (saved) {
      await supabase.from('topics').update({ intro_complete: true }).eq('id', topicId)
    }
    return saved
  }

  return { intro, loading, saving, save, markComplete, refetch: fetch }
}

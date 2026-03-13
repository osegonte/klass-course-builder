// Topic-level intro blocks — stored in cs_content_blocks with level='topic'
// These appear before chapter 1, setting the stage for the whole course.

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface TopicIntro {
  id: string
  topic_id: string
  subject_id: string
  overview: string
  why_it_matters: string
  prerequisites: string
  // Source materials stored at topic level — subtopics can inherit these
  source_transcript: string
  source_textbook: string
  source_extra: string
  updated_at: string
}

const EMPTY_INTRO = (topicId: string, subjectId: string): Omit<TopicIntro, 'updated_at'> => ({
  id: crypto.randomUUID(),
  topic_id: topicId,
  subject_id: subjectId,
  overview: '',
  why_it_matters: '',
  prerequisites: '',
  source_transcript: '',
  source_textbook: '',
  source_extra: '',
})

export function useTopicIntro(topicId: string, subjectId: string) {
  const [intro, setIntro] = useState<TopicIntro | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!topicId) return
    setLoading(true)
    supabase
      .from('cs_topic_intros')
      .select('*')
      .eq('topic_id', topicId)
      .maybeSingle()
      .then(({ data }) => {
        setIntro(data ?? null)
        setLoading(false)
      })
  }, [topicId])

  const save = async (updates: Partial<TopicIntro>) => {
    setSaving(true)
    const payload = {
      ...EMPTY_INTRO(topicId, subjectId),
      ...intro,
      ...updates,
      topic_id: topicId,
      subject_id: subjectId,
      updated_at: new Date().toISOString(),
    }
    const { data, error } = await supabase
      .from('cs_topic_intros')
      .upsert(payload, { onConflict: 'topic_id' })
      .select()
      .single()
    if (!error && data) setIntro(data)
    setSaving(false)
  }

  return { intro, loading, saving, save }
}
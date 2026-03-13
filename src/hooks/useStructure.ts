import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface CSStructureRow {
  id: string
  type: 'subject' | 'topic' | 'subtopic'
  name: string
  parent_id: string | null
  subject_id: string | null
  objectives: string[] | null
  external_id: string
  source: string
  order: number
  is_active: boolean
  is_scaffold: boolean
  created_at: string
  updated_at: string
}

// ─── Subjects (= KLASS "projects") ────────────────────────────────────────────

export function useSubjects() {
  const [subjects, setSubjects] = useState<CSStructureRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('cs_structure')
      .select('*')
      .eq('type', 'subject')
      .eq('is_active', true)
      .order('order')
    if (!error && data) setSubjects(data)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()

    const channel = supabase
      .channel('cs-structure-subjects')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cs_structure' }, () => {
        fetch()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetch])

  return { subjects, loading, refetch: fetch }
}

// ─── Topics under a subject ────────────────────────────────────────────────────

export function useTopicsFromStructure(subjectId: string) {
  const [topics, setTopics] = useState<CSStructureRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!subjectId) return
    const { data, error } = await supabase
      .from('cs_structure')
      .select('*')
      .eq('type', 'topic')
      .eq('subject_id', subjectId)
      .eq('is_active', true)
      .order('order')
    if (!error && data) setTopics(data)
    setLoading(false)
  }, [subjectId])

  useEffect(() => {
    fetch()

    const channel = supabase
      .channel(`cs-structure-topics-${subjectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cs_structure' }, () => {
        fetch()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetch, subjectId])

  return { topics, loading, refetch: fetch }
}

// ─── Single topic row ──────────────────────────────────────────────────────────

export function useTopicRow(topicId: string) {
  const [topic, setTopic] = useState<CSStructureRow | null>(null)

  useEffect(() => {
    if (!topicId) return
    supabase
      .from('cs_structure')
      .select('*')
      .eq('id', topicId)
      .single()
      .then(({ data }) => { if (data) setTopic(data) })
  }, [topicId])

  return { topic }
}

// ─── Subtopics under a topic ───────────────────────────────────────────────────

export function useSubtopicsFromStructure(topicId: string) {
  const [subtopics, setSubtopics] = useState<CSStructureRow[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!topicId) return
    const { data, error } = await supabase
      .from('cs_structure')
      .select('*')
      .eq('type', 'subtopic')
      .eq('parent_id', topicId)
      .eq('is_active', true)
      .order('order')
    if (!error && data) setSubtopics(data)
    setLoading(false)
  }, [topicId])

  useEffect(() => {
    fetch()

    const channel = supabase
      .channel(`cs-structure-subtopics-${topicId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cs_structure' }, () => {
        fetch()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetch, topicId])

  return { subtopics, loading, refetch: fetch }
}

// ─── Single subtopic row ───────────────────────────────────────────────────────

export function useSubtopicRow(subtopicId: string) {
  const [subtopic, setSubtopic] = useState<CSStructureRow | null>(null)

  useEffect(() => {
    if (!subtopicId) return
    supabase
      .from('cs_structure')
      .select('*')
      .eq('id', subtopicId)
      .single()
      .then(({ data }) => { if (data) setSubtopic(data) })
  }, [subtopicId])

  return { subtopic }
}
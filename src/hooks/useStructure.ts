import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { CSSubject, CSTopic, CSSubtopic } from '../types/content'

// ─── Subjects ─────────────────────────────────────────────────────────────────

function rowToSubject(row: any): CSSubject {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    isActive:   row.is_active,
    isPriority: row.is_priority ?? false,
    createdAt:  row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useSubjects() {
  const [subjects, setSubjects] = useState<CSSubject[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('is_active', true)
      .order('name')
    if (error) {
      console.error('subjects fetch error:', error.message)
      setLoading(false)
      return
    }
    if (data) setSubjects(data.map(rowToSubject))
    setLoading(false)
  }, [])

  useEffect(() => {
    fetch()

    // Re-fetch when auth state changes (session may not be ready on first render)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => { fetch() })

    const channel = supabase
      .channel('subjects-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subjects' }, fetch)
      .subscribe()

    return () => {
      subscription.unsubscribe()
      supabase.removeChannel(channel)
    }
  }, [fetch])

  const createSubject = async (name: string, description?: string) => {
    const { data, error } = await supabase
      .from('subjects')
      .insert({ name, description: description ?? null })
      .select()
      .single()
    if (!error && data) {
      const subject = rowToSubject(data)
      setSubjects(prev => [...prev, subject].sort((a, b) => a.name.localeCompare(b.name)))
      return subject
    }
    return null
  }

  return { subjects, loading, refetch: fetch, createSubject }
}

export function useSubject(subjectId: string) {
  const [subject, setSubject] = useState<CSSubject | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!subjectId) return
    supabase
      .from('subjects')
      .select('*')
      .eq('id', subjectId)
      .single()
      .then(({ data }) => {
        if (data) setSubject(rowToSubject(data))
        setLoading(false)
      })
  }, [subjectId])

  return { subject, loading }
}

// ─── Topics ───────────────────────────────────────────────────────────────────

function rowToTopic(row: any): CSTopic {
  return {
    id: row.id,
    subjectId: row.subject_id,
    name: row.name,
    description: row.description ?? undefined,
    status: row.status,
    introComplete: row.intro_complete,
    objectives: row.objectives ?? [],
    topicOrder: row.topic_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useTopics(subjectId: string) {
  const [topics, setTopics] = useState<CSTopic[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!subjectId) return
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('subject_id', subjectId)
      .order('topic_order')
    if (!error && data) setTopics(data.map(rowToTopic))
    setLoading(false)
  }, [subjectId])

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel(`topics-${subjectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'topics' }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetch, subjectId])

  const createTopic = async (name: string, description?: string) => {
    const maxOrder = topics.length > 0 ? Math.max(...topics.map(t => t.topicOrder)) : -1
    const { data, error } = await supabase
      .from('topics')
      .insert({ subject_id: subjectId, name, description: description ?? null, topic_order: maxOrder + 1 })
      .select()
      .single()
    if (!error && data) {
      const topic = rowToTopic(data)
      setTopics(prev => [...prev, topic])
      return topic
    }
    return null
  }

  const updateTopicStatus = async (topicId: string, status: CSTopic['status']) => {
    await supabase.from('topics').update({ status }).eq('id', topicId)
    setTopics(prev => prev.map(t => t.id === topicId ? { ...t, status } : t))
  }

  return { topics, loading, refetch: fetch, createTopic, updateTopicStatus }
}

export function useTopicRow(topicId: string) {
  const [topic, setTopic] = useState<CSTopic | null>(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!topicId) return
    const { data } = await supabase.from('topics').select('*').eq('id', topicId).single()
    if (data) setTopic(rowToTopic(data))
    setLoading(false)
  }, [topicId])

  useEffect(() => { fetch() }, [fetch])

  return { topic, loading, refetch: fetch }
}

// ─── Subtopics ────────────────────────────────────────────────────────────────

function rowToSubtopic(row: any): CSSubtopic {
  return {
    id: row.id,
    topicId: row.topic_id,
    subjectId: row.subject_id,
    name: row.name,
    description: row.description ?? undefined,
    objectives: row.objectives ?? [],
    subtopicOrder: row.subtopic_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useSubtopics(topicId: string) {
  const [subtopics, setSubtopics] = useState<CSSubtopic[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!topicId) return
    const { data, error } = await supabase
      .from('subtopics')
      .select('*')
      .eq('topic_id', topicId)
      .order('subtopic_order')
    if (!error && data) setSubtopics(data.map(rowToSubtopic))
    setLoading(false)
  }, [topicId])

  useEffect(() => {
    fetch()
    const channel = supabase
      .channel(`subtopics-${topicId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subtopics' }, fetch)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetch, topicId])

  const createSubtopic = async (name: string, subjectId: string) => {
    const maxOrder = subtopics.length > 0 ? Math.max(...subtopics.map(s => s.subtopicOrder)) : -1
    const { data, error } = await supabase
      .from('subtopics')
      .insert({ topic_id: topicId, subject_id: subjectId, name, subtopic_order: maxOrder + 1 })
      .select()
      .single()
    if (!error && data) {
      const subtopic = rowToSubtopic(data)
      setSubtopics(prev => [...prev, subtopic])
      return subtopic
    }
    return null
  }

  const deleteSubtopic = async (id: string) => {
    await supabase.from('subtopics').delete().eq('id', id)
    setSubtopics(prev => prev.filter(s => s.id !== id))
  }

  return { subtopics, loading, refetch: fetch, createSubtopic, deleteSubtopic }
}

export function useSubtopicRow(subtopicId: string) {
  const [subtopic, setSubtopic] = useState<CSSubtopic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!subtopicId) return
    supabase
      .from('subtopics').select('*').eq('id', subtopicId).single()
      .then(({ data }) => {
        if (data) setSubtopic(rowToSubtopic(data))
        setLoading(false)
      })
  }, [subtopicId])

  return { subtopic, loading }
}

// ─── Subtopic overview (overview, objectives, prerequisites) ──────────────────

export function useSubtopicOverview(subtopicId: string) {
  const [saving, setSaving] = useState(false)

  const save = async (data: { overview: string; objectives: string[] }) => {
    if (!subtopicId) return
    setSaving(true)
    await supabase
      .from('subtopics')
      .update({
        overview:   data.overview,
        objectives: data.objectives,
      })
      .eq('id', subtopicId)
    setSaving(false)
  }

  return { saving, save }
}
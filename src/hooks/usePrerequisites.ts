import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface PrerequisiteTag {
  id: string
  topicId: string
  requiresTopicId: string
  requiresTopicName: string
  requiresSubjectName: string
  note?: string
}

export function usePrerequisites(topicId: string) {
  const [prereqs, setPrereqs]   = useState<PrerequisiteTag[]>([])
  const [loading, setLoading]   = useState(true)

  const fetch = useCallback(async () => {
    if (!topicId) return
    const { data, error } = await supabase
      .from('topic_prerequisites')
      .select(`
        id, topic_id, requires_topic_id, note,
        topics!topic_prerequisites_requires_topic_id_fkey (
          name,
          subjects ( name )
        )
      `)
      .eq('topic_id', topicId)

    if (!error && data) {
      setPrereqs(data.map((row: any) => ({
        id:                  row.id,
        topicId:             row.topic_id,
        requiresTopicId:     row.requires_topic_id,
        requiresTopicName:   row.topics?.name ?? 'Unknown',
        requiresSubjectName: row.topics?.subjects?.name ?? '',
        note:                row.note ?? undefined,
      })))
    }
    setLoading(false)
  }, [topicId])

  useEffect(() => { fetch() }, [fetch])

  const addPrerequisite = async (requiresTopicId: string, note?: string) => {
    // Prevent duplicates
    if (prereqs.find(p => p.requiresTopicId === requiresTopicId)) return

    const { error } = await supabase
      .from('topic_prerequisites')
      .insert({ topic_id: topicId, requires_topic_id: requiresTopicId, note: note ?? null })

    if (!error) await fetch()
  }

  const removePrerequisite = async (id: string) => {
    await supabase.from('topic_prerequisites').delete().eq('id', id)
    setPrereqs(prev => prev.filter(p => p.id !== id))
  }

  return { prereqs, loading, addPrerequisite, removePrerequisite, refetch: fetch }
}

// Search all topics for the picker — excludes current topic
export async function searchTopics(query: string, excludeTopicId: string) {
  if (!query.trim()) return []
  const { data, error } = await supabase
    .from('topics')
    .select('id, name, subjects ( name )')
    .ilike('name', `%${query}%`)
    .neq('id', excludeTopicId)
    .limit(8)

  if (error || !data) return []
  return data.map((row: any) => ({
    id:          row.id,
    name:        row.name,
    subjectName: row.subjects?.name ?? '',
  }))
}
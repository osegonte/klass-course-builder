import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export interface Topic {
  id: string
  title: string
  subject: string
  status: string
}

export function useTopic(topicId: string) {
  const [topic, setTopic] = useState<Topic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTopic()
  }, [topicId])

  const loadTopic = async () => {
    const { data, error } = await supabase
      .from('topics')
      .select('*')
      .eq('id', topicId)
      .single()

    if (!error && data) {
      setTopic({
        id: data.id,
        title: data.title,
        subject: data.subject,
        status: data.status,
      })
    }
    setLoading(false)
  }

  const publish = async () => {
    const { error } = await supabase
      .from('topics')
      .update({ status: 'published' })
      .eq('id', topicId)

    if (!error) {
      setTopic(prev => prev ? { ...prev, status: 'published' } : prev)
    }
  }

  const unpublish = async () => {
    const { error } = await supabase
      .from('topics')
      .update({ status: 'draft' })
      .eq('id', topicId)

    if (!error) {
      setTopic(prev => prev ? { ...prev, status: 'draft' } : prev)
    }
  }

  return { topic, loading, publish, unpublish }
}
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export interface SubtopicAssignment {
  id: string
  subtopicId: string
  teacherId: string
  teacherName: string
  status: 'in_progress' | 'complete'
  claimedAt: string
  completedAt?: string
}

// All assignments for a topic — used to show lock state across all subtopics
export function useTopicAssignments(topicId: string) {
  const [assignments, setAssignments] = useState<SubtopicAssignment[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!topicId) return
    // Get all subtopic IDs for this topic first
    const { data: subtopics } = await supabase
      .from('subtopics')
      .select('id')
      .eq('topic_id', topicId)

    if (!subtopics || subtopics.length === 0) { setLoading(false); return }

    const subtopicIds = subtopics.map(s => s.id)

    const { data, error } = await supabase
      .from('subtopic_assignments')
      .select(`
        id, subtopic_id, teacher_id, status, claimed_at, completed_at,
        teachers ( display_name )
      `)
      .in('subtopic_id', subtopicIds)

    if (!error && data) {
      setAssignments(data.map((row: any) => ({
        id: row.id,
        subtopicId: row.subtopic_id,
        teacherId: row.teacher_id,
        teacherName: row.teachers?.display_name ?? 'Unknown',
        status: row.status,
        claimedAt: row.claimed_at,
        completedAt: row.completed_at ?? undefined,
      })))
    }
    setLoading(false)
  }, [topicId])

  useEffect(() => { fetch() }, [fetch])

  return { assignments, loading, refetch: fetch }
}

// Claim a subtopic — only allowed if:
// 1. It's not already claimed by someone else
// 2. The previous subtopic (by order) is complete or doesn't exist
export async function claimSubtopic(
  subtopicId: string,
  teacherId: string,
  allSubtopics: { id: string; subtopicOrder: number }[],
  assignments: SubtopicAssignment[]
): Promise<{ success: boolean; reason?: string }> {

  // Already assigned?
  const existing = assignments.find(a => a.subtopicId === subtopicId)
  if (existing) {
    if (existing.teacherId === teacherId) return { success: false, reason: 'You already claimed this subtopic.' }
    return { success: false, reason: `Locked by ${existing.teacherName}.` }
  }

  // Find this subtopic's order
  const current = allSubtopics.find(s => s.id === subtopicId)
  if (!current) return { success: false, reason: 'Subtopic not found.' }

  // Find the previous subtopic by order
  const sorted = [...allSubtopics].sort((a, b) => a.subtopicOrder - b.subtopicOrder)
  const currentIndex = sorted.findIndex(s => s.id === subtopicId)

  if (currentIndex > 0) {
    const previous = sorted[currentIndex - 1]
    const prevAssignment = assignments.find(a => a.subtopicId === previous.id)
    if (!prevAssignment || prevAssignment.status !== 'complete') {
      return {
        success: false,
        reason: 'Complete the previous subtopic first before claiming this one.',
      }
    }
  }

  // Claim it
  const { error } = await supabase
    .from('subtopic_assignments')
    .insert({ subtopic_id: subtopicId, teacher_id: teacherId, status: 'in_progress' })

  if (error) return { success: false, reason: error.message }
  return { success: true }
}

// Mark a subtopic assignment as complete
export async function completeSubtopic(
  subtopicId: string,
  teacherId: string
): Promise<{ success: boolean; reason?: string }> {
  const { error } = await supabase
    .from('subtopic_assignments')
    .update({ status: 'complete', completed_at: new Date().toISOString() })
    .eq('subtopic_id', subtopicId)
    .eq('teacher_id', teacherId)

  if (error) return { success: false, reason: error.message }
  return { success: true }
}
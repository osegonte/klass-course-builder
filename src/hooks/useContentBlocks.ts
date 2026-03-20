import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import type { ContentBlock } from '../types/content'

function rowToBlock(row: any): ContentBlock {
  return {
    id: row.id,
    type: row.type,
    title: row.title ?? '',
    body: row.body ?? '',
    analogy: row.analogy ?? undefined,
    breakdown: row.breakdown ?? undefined,
    diagramPrompt: row.diagram_prompt ?? undefined,
    steps: row.steps ?? undefined,
    questionId: row.question_id ?? undefined,
    flashcardId: row.flashcard_id ?? undefined,
    order: row.block_order,
  }
}

function useBlocks(filter: { subtopic_id?: string; topic_id?: string }) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [loading, setLoading] = useState(true)
  const key = filter.subtopic_id ?? filter.topic_id ?? ''

  const fetch = useCallback(async () => {
    if (!key) return
    let q = supabase.from('content_blocks').select('*').order('block_order')
    if (filter.subtopic_id) q = q.eq('subtopic_id', filter.subtopic_id)
    else if (filter.topic_id) q = q.eq('topic_id', filter.topic_id)
    const { data, error } = await q
    if (!error && data) setBlocks(data.map(rowToBlock))
    setLoading(false)
  }, [key])

  useEffect(() => { fetch() }, [fetch])

  const addBlock = async (block: ContentBlock) => {
    await supabase.from('content_blocks').insert({
      id: block.id,
      subtopic_id: filter.subtopic_id ?? null,
      topic_id: filter.topic_id ?? null,
      type: block.type,
      title: block.title,
      body: block.body,
      analogy: block.analogy ?? null,
      breakdown: block.breakdown ?? null,
      diagram_prompt: block.diagramPrompt ?? null,
      steps: block.steps ?? null,
      question_id: block.questionId ?? null,
      flashcard_id: block.flashcardId ?? null,
      block_order: block.order,
    })
    await fetch()
  }

  const updateBlock = async (block: ContentBlock) => {
    await supabase.from('content_blocks').update({
      type: block.type,
      title: block.title,
      body: block.body,
      analogy: block.analogy ?? null,
      breakdown: block.breakdown ?? null,
      diagram_prompt: block.diagramPrompt ?? null,
      steps: block.steps ?? null,
      question_id: block.questionId ?? null,
      flashcard_id: block.flashcardId ?? null,
      block_order: block.order,
    }).eq('id', block.id)
    setBlocks(prev => prev.map(b => b.id === block.id ? block : b))
  }

  const deleteBlock = async (id: string) => {
    await supabase.from('content_blocks').delete().eq('id', id)
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  const reorderBlocks = async (reordered: ContentBlock[]) => {
    setBlocks(reordered)
    for (const block of reordered) {
      await supabase.from('content_blocks').update({ block_order: block.order }).eq('id', block.id)
    }
  }

  return { blocks, loading, addBlock, updateBlock, deleteBlock, reorderBlocks, refetch: fetch }
}

// Subtopic-level blocks (existing usage)
export function useContentBlocks(subtopicId: string) {
  return useBlocks({ subtopic_id: subtopicId })
}

// Topic-level blocks (for course intro)
export function useTopicContentBlocks(topicId: string) {
  return useBlocks({ topic_id: topicId })
}
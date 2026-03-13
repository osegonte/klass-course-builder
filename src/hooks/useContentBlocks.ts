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
    steps: row.steps ?? undefined,
    questionId: row.question_id ?? undefined,
    flashcardId: row.flashcard_id ?? undefined,
    order: row.block_order,
  }
}

export function useContentBlocks(subtopicId: string, subjectId?: string) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    if (!subtopicId) return
    const { data, error } = await supabase
      .from('cs_content_blocks')
      .select('*')
      .eq('subtopic_id', subtopicId)
      .order('block_order')
    if (!error && data) setBlocks(data.map(rowToBlock))
    setLoading(false)
  }, [subtopicId])

  useEffect(() => { fetch() }, [fetch])

  const addBlock = async (block: ContentBlock) => {
    await supabase.from('cs_content_blocks').insert({
      id: block.id,
      subtopic_id: subtopicId,
      subject_id: subjectId ?? null,
      type: block.type,
      title: block.title,
      body: block.body,
      analogy: block.analogy ?? null,
      breakdown: block.breakdown ?? null,
      steps: block.steps ?? null,
      question_id: block.questionId ?? null,
      flashcard_id: block.flashcardId ?? null,
      block_order: block.order,
    })
    await fetch()
  }

  const updateBlock = async (block: ContentBlock) => {
    await supabase.from('cs_content_blocks').update({
      type: block.type,
      title: block.title,
      body: block.body,
      analogy: block.analogy ?? null,
      breakdown: block.breakdown ?? null,
      steps: block.steps ?? null,
      question_id: block.questionId ?? null,
      flashcard_id: block.flashcardId ?? null,
      block_order: block.order,
    }).eq('id', block.id)
    setBlocks(prev => prev.map(b => b.id === block.id ? block : b))
  }

  const deleteBlock = async (id: string) => {
    await supabase.from('cs_content_blocks').delete().eq('id', id)
    setBlocks(prev => prev.filter(b => b.id !== id))
  }

  return { blocks, loading, addBlock, updateBlock, deleteBlock }
}
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { ContentBlock } from '../types/content'

export function useContentBlocks(topicId: string) {
  const [blocks, setBlocks] = useState<ContentBlock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBlocks()
  }, [topicId])

  const loadBlocks = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('content_blocks')
      .select('*')
      .eq('topic_id', topicId)
      .order('block_order', { ascending: true })

    if (!error && data) {
      setBlocks(data.map(row => ({
        id: row.id,
        type: row.type,
        title: row.title,
        body: row.body,
        analogy: row.analogy,
        breakdown: row.breakdown,
        steps: row.steps,
        order: row.block_order,
      })))
    } else if (error) {
      console.error('Failed to load blocks:', error.message)
    }

    setLoading(false)
  }

  const addBlock = async (block: ContentBlock) => {
    // Add to UI immediately
    setBlocks(prev => [...prev, block])

    const { error } = await supabase
      .from('content_blocks')
      .insert({
        id: block.id,
        topic_id: topicId,
        type: block.type,
        title: block.title,
        body: block.body,
        analogy: block.analogy,
        breakdown: block.breakdown,
        steps: block.steps,
        block_order: block.order,
      })

    if (error) {
      console.error('Failed to save block:', error.message)
      // Roll back if DB failed
      setBlocks(prev => prev.filter(b => b.id !== block.id))
    }
  }

  const updateBlock = async (updated: ContentBlock) => {
    // Update UI immediately
    setBlocks(prev => prev.map(b => b.id === updated.id ? updated : b))

    const { error } = await supabase
      .from('content_blocks')
      .update({
        type: updated.type,
        title: updated.title,
        body: updated.body,
        analogy: updated.analogy,
        breakdown: updated.breakdown,
        steps: updated.steps,
        block_order: updated.order,
      })
      .eq('id', updated.id)

    if (error) {
      console.error('Failed to update block:', error.message)
    }
  }

  const deleteBlock = async (id: string) => {
    // Remove from UI immediately
    setBlocks(prev => prev.filter(b => b.id !== id))

    const { error } = await supabase
      .from('content_blocks')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Failed to delete block:', error.message)
      // Reload if delete failed
      loadBlocks()
    }
  }

  return { blocks, loading, addBlock, updateBlock, deleteBlock }
}
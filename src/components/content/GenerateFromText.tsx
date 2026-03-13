import { useState } from 'react'
import { Sparkles, X, Loader2 } from 'lucide-react'
import { generateBlocksFromText } from '../../lib/anthropic'
import type { ContentBlock } from '../../types/content'

interface Props {
  onGenerate: (blocks: ContentBlock[]) => void
  onClose: () => void
  existingCount: number
}

export default function GenerateFromText({ onGenerate, onClose, existingCount }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGenerate = async () => {
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const raw = await generateBlocksFromText(text)
      const blocks: ContentBlock[] = raw.map((item: any, index: number) => ({
        id: crypto.randomUUID(),
        type: item.type,
        title: item.title || '',
        body: item.body || '',
        analogy: item.analogy || undefined,
        breakdown: item.breakdown || undefined,
        steps: item.steps
          ? item.steps.map((s: any) => ({ id: crypto.randomUUID(), expression: s.expression, talkingPoint: s.talkingPoint }))
          : item.type === 'example' ? [] : undefined,
        order: existingCount + index,
      }))
      onGenerate(blocks)
    } catch (err: any) {
      setError(err.message || 'Something went wrong.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-lg p-5 w-[560px] shadow-lg flex flex-col gap-4" onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-gray-500" />
            <h3 className="text-sm font-semibold text-gray-900">Generate from Text</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={15} /></button>
        </div>

        <p className="text-xs text-gray-500">
          Paste raw textbook or lecture content. Claude will extract and structure it into content blocks.
        </p>

        <textarea
          className="w-full text-sm text-gray-900 placeholder-gray-300 border border-gray-200 rounded p-3 outline-none resize-none min-h-[180px] focus:border-gray-400 transition-colors"
          placeholder="Paste source material here..."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={loading}
        />

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-400">Blocks appended after existing content</p>
          <div className="flex gap-2">
            <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!text.trim() || loading}
              className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-1.5 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
            >
              {loading ? <><Loader2 size={12} className="animate-spin" />Generating...</> : <><Sparkles size={12} />Generate</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
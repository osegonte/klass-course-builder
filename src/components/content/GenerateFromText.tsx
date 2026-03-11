import { useState } from 'react'
import { Sparkles, X, Loader2 } from 'lucide-react'
import { generateBlocksFromText } from '../../lib/deepseek'
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
      setError(err.message || 'Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-[600px] flex flex-col gap-4"
        onClick={e => e.stopPropagation()}
      >

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-purple-400" />
            <h3 className="text-white font-semibold">Generate from Text</h3>
          </div>
          <button onClick={onClose} className="text-gray-600 hover:text-gray-400">
            <X size={16} />
          </button>
        </div>

        <p className="text-gray-500 text-sm">
          Paste in raw textbook content, lecture notes, or any source material. DeepSeek will extract and structure it into content blocks automatically.
        </p>

        {/* Text Input */}
        <textarea
          className="w-full bg-gray-800 text-white text-sm rounded-lg p-4 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[200px]"
          placeholder="Paste your textbook text, notes, or any source material here..."
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={loading}
        />

        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-600">
            Blocks will be appended after your existing content
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!text.trim() || loading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Generate Blocks
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
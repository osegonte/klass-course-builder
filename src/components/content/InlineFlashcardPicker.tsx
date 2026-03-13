import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Flashcard } from '../../types/content'

interface Props {
  flashcards: Flashcard[]
  onPickExisting: (flashcardId: string) => void
  onCreateNew: () => void
  onClose: () => void
}

export default function InlineFlashcardPicker({ flashcards, onPickExisting, onCreateNew, onClose }: Props) {
  const [mode, setMode] = useState<'pick' | 'create'>('pick')

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-lg p-5 w-[440px] max-h-[80vh] flex flex-col shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Add Flashcard Block</h3>

        <div className="flex gap-1.5 mb-4">
          {(['pick', 'create'] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 py-1.5 rounded text-xs font-medium border transition-colors ${
                mode === m ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:border-gray-400'
              }`}
            >
              {m === 'pick' ? 'Pick Existing' : 'Create New'}
            </button>
          ))}
        </div>

        {mode === 'pick' && (
          <div className="flex flex-col gap-1.5 overflow-y-auto">
            {flashcards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-400 mb-2">No flashcards yet.</p>
                <button onClick={() => setMode('create')} className="text-xs text-gray-600 underline">Create one</button>
              </div>
            ) : (
              flashcards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => onPickExisting(card.id)}
                  className="flex items-start gap-3 p-3 rounded border border-gray-200 hover:border-gray-400 text-left transition-colors"
                >
                  <span className="text-xs text-gray-400 shrink-0 mt-0.5">#{index + 1}</span>
                  <div>
                    <p className="text-sm text-gray-700">{card.front || 'Untitled card'}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{card.back}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {mode === 'create' && (
          <div className="py-2">
            <p className="text-xs text-gray-400 mb-3">A new blank flashcard will be added to this subtopic.</p>
            <button
              onClick={onCreateNew}
              className="flex items-center gap-2 w-full p-3 rounded border border-gray-200 hover:border-gray-400 transition-colors"
            >
              <Plus size={13} className="text-gray-400" />
              <span className="text-sm text-gray-700">Create New Flashcard</span>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
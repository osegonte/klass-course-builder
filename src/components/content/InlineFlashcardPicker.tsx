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
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-[480px] max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>

        <h3 className="text-white font-semibold mb-4">Add Flashcard Block</h3>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode('pick')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'pick'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Pick from Bank
          </button>
          <button
            onClick={() => setMode('create')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'create'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Create New
          </button>
        </div>

        {/* Pick from Bank */}
        {mode === 'pick' && (
          <div className="flex flex-col gap-2 overflow-y-auto">
            {flashcards.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 text-sm mb-3">No flashcards in bank yet.</p>
                <button
                  onClick={() => setMode('create')}
                  className="text-purple-400 text-sm hover:text-purple-300"
                >
                  Create one instead
                </button>
              </div>
            ) : (
              flashcards.map((card, index) => (
                <button
                  key={card.id}
                  onClick={() => onPickExisting(card.id)}
                  className="flex items-start gap-3 p-3 rounded-lg border border-gray-800 hover:border-purple-500/50 hover:bg-purple-500/5 text-left transition-colors"
                >
                  <span className="text-xs text-gray-600 mt-0.5 shrink-0">#{index + 1}</span>
                  <div>
                    <p className="text-sm text-gray-300">{card.front || 'Untitled flashcard'}</p>
                    <p className="text-xs text-gray-600 mt-0.5 truncate">{card.back}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {/* Create New */}
        {mode === 'create' && (
          <div className="flex flex-col gap-4 pt-2">
            <p className="text-xs text-gray-500">A new flashcard will be created and added to your bank.</p>
            <button
              onClick={onCreateNew}
              className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-3 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Create New Flashcard
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
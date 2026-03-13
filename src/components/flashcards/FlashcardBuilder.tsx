import { Plus, Trash2 } from 'lucide-react'
import type { Flashcard } from '../../types/content'
import { useFlashcards } from '../../hooks/useFlashcards'

interface Props { subtopicId: string; subjectId: string }

export default function FlashcardBuilder({ subtopicId, subjectId }: Props) {
  const { flashcards, loading, addFlashcard, updateFlashcard, deleteFlashcard } = useFlashcards(subtopicId, subjectId)

  const handleAdd = async () => {
    await addFlashcard({ id: crypto.randomUUID(), front: '', back: '', order: flashcards.length })
  }

  const update = (id: string, fields: Partial<Flashcard>) => {
    const card = flashcards.find(c => c.id === id)
    if (card) updateFlashcard({ ...card, ...fields })
  }

  if (loading) return <div className="flex items-center justify-center h-48"><p className="text-sm text-gray-400">Loading...</p></div>

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">

      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Flashcards</h2>
          <p className="text-xs text-gray-500 mt-0.5">Key concept recall cards for this subtopic.</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
        >
          <Plus size={13} />
          Add Card
        </button>
      </div>

      {flashcards.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded p-12 text-center">
          <p className="text-sm text-gray-500 mb-4">No flashcards yet.</p>
          <button
            onClick={handleAdd}
            className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors mx-auto"
          >
            <Plus size={13} />
            Add First Card
          </button>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {flashcards.map((card, index) => (
          <div key={card.id} className="bg-white border border-gray-200 rounded overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-stone-50">
              <span className="text-xs text-gray-400">Card {index + 1}</span>
              <button onClick={() => deleteFlashcard(card.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                <Trash2 size={13} />
              </button>
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              <div className="p-4">
                <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Front</p>
                <textarea
                  className="w-full text-sm text-gray-900 placeholder-gray-300 outline-none resize-none min-h-[80px] bg-transparent"
                  placeholder="Term or concept..."
                  value={card.front}
                  onChange={e => update(card.id, { front: e.target.value })}
                />
              </div>
              <div className="p-4">
                <p className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wide">Back</p>
                <textarea
                  className="w-full text-sm text-gray-900 placeholder-gray-300 outline-none resize-none min-h-[80px] bg-transparent"
                  placeholder="Definition or answer..."
                  value={card.back}
                  onChange={e => update(card.id, { back: e.target.value })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {flashcards.length > 0 && (
        <button
          onClick={handleAdd}
          className="mt-4 w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-gray-500 text-gray-400 hover:text-gray-600 text-xs py-3 rounded transition-colors"
        >
          <Plus size={13} />
          Add Card
        </button>
      )}
    </div>
  )
}
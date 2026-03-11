import { useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import type { Flashcard } from '../../types/content'
import { useFlashcards } from '../../hooks/useFlashcards'

export default function FlashcardBuilder() {
  const { topicId } = useParams<{ topicId: string }>()
  const { flashcards, loading, addFlashcard, updateFlashcard, deleteFlashcard } = useFlashcards(topicId!)

  const handleAdd = async () => {
    const newCard: Flashcard = {
      id: crypto.randomUUID(),
      front: '',
      back: '',
      order: flashcards.length,
    }
    await addFlashcard(newCard)
  }

  const update = (id: string, fields: Partial<Flashcard>) => {
    const card = flashcards.find(c => c.id === id)
    if (card) updateFlashcard({ ...card, ...fields })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">

      <div className="mb-8">
        <h2 className="text-white text-xl font-semibold">Flashcard Builder</h2>
        <p className="text-gray-500 text-sm mt-1">
          Create flashcards for key concepts. Students use these to reinforce memory.
        </p>
      </div>

      {flashcards.length === 0 && (
        <div className="border border-dashed border-gray-800 rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <div className="text-gray-600 text-sm mb-4">No flashcards yet. Add your first one.</div>
          <button
            onClick={handleAdd}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            <Plus size={16} />
            Add First Flashcard
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {flashcards.map((card, index) => (
          <div key={card.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">

            {/* Card Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
              <span className="text-xs text-gray-600">Card {index + 1}</span>
              <div className="flex-1" />
              <button
                onClick={() => deleteFlashcard(card.id)}
                className="text-gray-600 hover:text-red-400 transition-colors"
              >
                <Trash2 size={15} />
              </button>
            </div>

            {/* Card Body */}
            <div className="p-4 grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 font-medium">Front</label>
                <textarea
                  className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[100px]"
                  placeholder="Term, concept, or question..."
                  value={card.front}
                  onChange={e => update(card.id, { front: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs text-gray-500 font-medium">Back</label>
                <textarea
                  className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[100px]"
                  placeholder="Definition, answer, or explanation..."
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
          className="mt-6 w-full flex items-center justify-center gap-2 border border-dashed border-gray-800 hover:border-purple-500 text-gray-600 hover:text-purple-400 text-sm py-3 rounded-xl transition-colors"
        >
          <Plus size={16} />
          Add Flashcard
        </button>
      )}

    </div>
  )
}
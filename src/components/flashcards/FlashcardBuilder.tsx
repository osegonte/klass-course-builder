import { Plus, Trash2 } from 'lucide-react'
import type { Flashcard } from '../../types/content'
import { useFlashcards } from '../../hooks/useFlashcards'

interface Props { subtopicId: string }

export default function FlashcardBuilder({ subtopicId }: Props) {
  const { flashcards, loading, addFlashcard, updateFlashcard, deleteFlashcard } = useFlashcards(subtopicId)

  const handleAdd = async () => {
    await addFlashcard({ id: crypto.randomUUID(), front: '', back: '', order: flashcards.length })
  }

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-base font-semibold text-gray-900">Flashcards</h2>
          <p className="text-xs text-gray-500 mt-0.5">Front and back revision cards for this subtopic.</p>
        </div>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 transition-colors"
        >
          <Plus size={12} /> Add Card
        </button>
      </div>

      {flashcards.length === 0 && (
        <div className="border border-dashed border-gray-300 rounded p-10 text-center">
          <p className="text-sm text-gray-500 mb-1">No flashcards yet.</p>
          <p className="text-xs text-gray-400 mb-5">Add front/back revision cards for key concepts.</p>
          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 mx-auto"
          >
            <Plus size={12} /> Add Card
          </button>
        </div>
      )}

      <div className="flex flex-col gap-4">
        {flashcards.map((card, i) => (
          <FlashcardRow
            key={card.id}
            card={card}
            index={i}
            onChange={updateFlashcard}
            onDelete={deleteFlashcard}
          />
        ))}
      </div>
    </div>
  )
}

function FlashcardRow({ card, index, onChange, onDelete }: {
  card: Flashcard
  index: number
  onChange: (c: Flashcard) => void
  onDelete: (id: string) => void
}) {
  const inputClass = "w-full text-sm text-gray-900 placeholder-gray-300 border border-gray-200 rounded p-2.5 outline-none focus:border-gray-500 resize-none bg-white"

  return (
    <div className="border border-gray-200 rounded bg-white overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2.5 bg-stone-50 border-b border-gray-100">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Card {index + 1}</span>
        <button type="button" onClick={() => onDelete(card.id)} className="text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>
      <div className="grid grid-cols-2 gap-0 divide-x divide-gray-100">
        <div className="p-4 flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Front</label>
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Term, concept, or question…"
            value={card.front}
            onChange={e => onChange({ ...card, front: e.target.value })}
          />
        </div>
        <div className="p-4 flex flex-col gap-1">
          <label className="text-xs text-gray-400 uppercase tracking-wide">Back</label>
          <textarea
            className={inputClass}
            rows={3}
            placeholder="Definition, answer, or explanation…"
            value={card.back}
            onChange={e => onChange({ ...card, back: e.target.value })}
          />
        </div>
      </div>
    </div>
  )
}
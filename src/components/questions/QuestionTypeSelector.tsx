import type { QuestionType } from '../../types/content'

const types: { type: QuestionType; label: string; description: string }[] = [
  { type: 'mcq', label: 'MCQ', description: 'Multiple choice, one correct answer' },
  { type: 'truefalse', label: 'True / False', description: 'Simple true or false question' },
  { type: 'fillingap', label: 'Fill in the Gap', description: 'Student fills in a missing word' },
  { type: 'multiselect', label: 'Multi-select', description: 'Multiple correct answers' },
]

interface Props {
  onSelect: (type: QuestionType) => void
  onClose: () => void
}

export default function QuestionTypeSelector({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-[420px]" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-semibold mb-4">Add Question</h3>
        <div className="flex flex-col gap-2">
          {types.map(({ type, label, description }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 hover:border-purple-500/50 hover:bg-purple-500/5 text-left transition-colors"
            >
              <div>
                <div className="text-white text-sm font-medium">{label}</div>
                <div className="text-gray-500 text-xs mt-0.5">{description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
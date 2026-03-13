import type { QuestionType } from '../../types/content'

const types: { type: QuestionType; label: string; description: string }[] = [
  { type: 'mcq', label: 'MCQ', description: 'Multiple choice, one correct answer' },
  { type: 'truefalse', label: 'True / False', description: 'Simple true or false' },
  { type: 'fillingap', label: 'Fill in the Gap', description: 'Student fills a missing word' },
  { type: 'multiselect', label: 'Multi-select', description: 'Multiple correct answers' },
]

interface Props {
  onSelect: (type: QuestionType) => void
  onClose: () => void
}

export default function QuestionTypeSelector({ onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-lg p-5 w-[360px] shadow-lg" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Question Type</h3>
        <div className="flex flex-col gap-1.5">
          {types.map(({ type, label, description }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className="flex items-center gap-3 p-3 rounded border border-gray-200 hover:border-gray-400 hover:bg-stone-50 text-left transition-colors"
            >
              <div>
                <div className="text-sm font-medium text-gray-800">{label}</div>
                <div className="text-xs text-gray-400 mt-0.5">{description}</div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
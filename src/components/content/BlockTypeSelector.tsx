import type { BlockType } from '../../types/content'

const blockTypes: { type: BlockType; label: string; description: string; group: string }[] = [
  { type: 'definition',  label: 'Definition',  description: 'Define a concept clearly',           group: 'content' },
  { type: 'explanation', label: 'Explanation', description: 'Explain with context or analogy',    group: 'content' },
  { type: 'formula',     label: 'Formula',     description: 'LaTeX-rendered formula',             group: 'content' },
  { type: 'example',     label: 'Example',     description: 'Step-by-step worked example',        group: 'content' },
  { type: 'table',       label: 'Table',       description: 'Comparison or reference table',      group: 'content' },
  { type: 'keypoint',    label: 'Key Point',   description: 'Critical thing to remember',         group: 'content' },
  { type: 'note',        label: 'Note',        description: 'Extra context or caution',           group: 'content' },
  { type: 'diagram',     label: 'Diagram',     description: 'Visual diagram with description',    group: 'content' },
  { type: 'question',    label: 'Question',    description: 'Inline question from bank',          group: 'interactive' },
  { type: 'flashcard',   label: 'Flashcard',   description: 'Inline flashcard for recall',        group: 'interactive' },
]

interface Props {
  onSelect: (type: BlockType) => void
  onClose:  () => void
}

export default function BlockTypeSelector({ onSelect, onClose }: Props) {
  const contentBlocks     = blockTypes.filter(b => b.group === 'content')
  const interactiveBlocks = blockTypes.filter(b => b.group === 'interactive')

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white border border-gray-200 rounded-lg p-5 w-[480px] shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Add Block</h3>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
        </div>

        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Content</p>
        <div className="grid grid-cols-2 gap-1.5 mb-4">
          {contentBlocks.map(({ type, label, description }) => (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className="border border-gray-200 rounded p-3 text-left hover:border-gray-900 hover:bg-stone-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-800">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{description}</div>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Interactive</p>
        <div className="grid grid-cols-2 gap-1.5">
          {interactiveBlocks.map(({ type, label, description }) => (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className="border border-gray-200 rounded p-3 text-left hover:border-gray-900 hover:bg-stone-50 transition-colors"
            >
              <div className="text-sm font-medium text-gray-800">{label}</div>
              <div className="text-xs text-gray-400 mt-0.5">{description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
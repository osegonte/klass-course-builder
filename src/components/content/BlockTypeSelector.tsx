import type { BlockType } from '../../types/content'

const blockTypes: { type: BlockType; label: string; description: string; color: string; group: string }[] = [
  { type: 'definition', label: 'Definition', description: 'Define a concept clearly', color: 'bg-purple-500/10 border-purple-500/30 text-purple-300', group: 'content' },
  { type: 'explanation', label: 'Explanation', description: 'Explain intuitively with scenarios', color: 'bg-purple-400/10 border-purple-400/20 text-purple-400', group: 'content' },
  { type: 'formula', label: 'Formula', description: 'Formula with breakdown', color: 'bg-gray-800 border-gray-600 text-gray-300', group: 'content' },
  { type: 'example', label: 'Example', description: 'Step by step worked example', color: 'bg-gray-700/30 border-gray-600/30 text-gray-300', group: 'content' },
  { type: 'keypoint', label: 'Key Point', description: 'Critical thing to remember', color: 'bg-purple-300/10 border-purple-300/20 text-purple-300', group: 'content' },
  { type: 'note', label: 'Note', description: 'Extra context or warning', color: 'bg-gray-800/50 border-gray-700 text-gray-500', group: 'content' },
  { type: 'question', label: 'Question', description: 'Inline question from bank or new', color: 'bg-purple-600/10 border-purple-600/30 text-purple-300', group: 'interactive' },
  { type: 'flashcard', label: 'Flashcard', description: 'Inline flashcard for quick recall', color: 'bg-gray-600/10 border-gray-600/30 text-gray-300', group: 'interactive' },
]

interface Props {
  onSelect: (type: BlockType) => void
  onClose: () => void
}

export default function BlockTypeSelector({ onSelect, onClose }: Props) {
  const contentBlocks = blockTypes.filter(b => b.group === 'content')
  const interactiveBlocks = blockTypes.filter(b => b.group === 'interactive')

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-[500px]" onClick={e => e.stopPropagation()}>
        
        <h3 className="text-white font-semibold mb-4">Add Block</h3>

        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Content</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {contentBlocks.map(({ type, label, description, color }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`border rounded-lg p-3 text-left hover:opacity-90 transition-opacity ${color}`}
            >
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs opacity-70 mt-0.5">{description}</div>
            </button>
          ))}
        </div>

        <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Interactive</p>
        <div className="grid grid-cols-2 gap-2">
          {interactiveBlocks.map(({ type, label, description, color }) => (
            <button
              key={type}
              onClick={() => onSelect(type)}
              className={`border rounded-lg p-3 text-left hover:opacity-90 transition-opacity ${color}`}
            >
              <div className="font-medium text-sm">{label}</div>
              <div className="text-xs opacity-70 mt-0.5">{description}</div>
            </button>
          ))}
        </div>

      </div>
    </div>
  )
}
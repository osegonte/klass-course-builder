import { useState } from 'react'
import { Trash2, Plus, X } from 'lucide-react'
import type { ContentBlock, ExampleStep, Question, Flashcard } from '../../types/content'

interface Props {
  block: ContentBlock
  question?: Question
  flashcard?: Flashcard
  onChange: (updated: ContentBlock) => void
  onDelete: (id: string) => void
}

const blockColors: Record<string, string> = {
  definition: 'border-purple-500/30',
  explanation: 'border-purple-400/20',
  formula: 'border-gray-500/30',
  example: 'border-gray-400/20',
  keypoint: 'border-purple-300/20',
  note: 'border-gray-600/30',
  question: 'border-purple-600/40',
  flashcard: 'border-gray-500/20',
}

const blockLabels: Record<string, string> = {
  definition: 'Definition',
  explanation: 'Explanation',
  formula: 'Formula',
  example: 'Example',
  keypoint: 'Key Point',
  note: 'Note',
  question: 'Question',
  flashcard: 'Flashcard',
}

const blockBadgeColors: Record<string, string> = {
  definition: 'bg-purple-500/20 text-purple-300',
  explanation: 'bg-purple-400/10 text-purple-400',
  formula: 'bg-gray-700 text-gray-300',
  example: 'bg-gray-600/30 text-gray-300',
  keypoint: 'bg-purple-300/10 text-purple-300',
  note: 'bg-gray-800 text-gray-500',
  question: 'bg-purple-600/20 text-purple-300',
  flashcard: 'bg-gray-700 text-gray-400',
}

export default function ContentBlockCard({ block, question, flashcard, onChange, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const update = (fields: Partial<ContentBlock>) => {
    onChange({ ...block, ...fields })
  }

  const addStep = () => {
    const newStep: ExampleStep = {
      id: crypto.randomUUID(),
      expression: '',
      talkingPoint: '',
    }
    update({ steps: [...(block.steps || []), newStep] })
  }

  const updateStep = (id: string, fields: Partial<ExampleStep>) => {
    update({
      steps: (block.steps || []).map(s => s.id === id ? { ...s, ...fields } : s)
    })
  }

  const deleteStep = (id: string) => {
    update({ steps: (block.steps || []).filter(s => s.id !== id) })
  }

  return (
    <div className={`bg-gray-900 border ${blockColors[block.type]} rounded-xl overflow-hidden`}>

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${blockBadgeColors[block.type]}`}>
          {blockLabels[block.type]}
        </span>
        <span className="flex-1 text-sm text-gray-400 truncate">
          {block.type === 'question'
            ? (question?.questionText || 'Question block')
            : block.type === 'flashcard'
            ? (flashcard?.front || 'Flashcard block')
            : (block.title || `New ${blockLabels[block.type]}...`)
          }
        </span>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-600 hover:text-gray-400 text-xs"
        >
          {collapsed ? 'Expand' : 'Collapse'}
        </button>
        <button
          onClick={() => onDelete(block.id)}
          className="text-gray-600 hover:text-red-400 transition-colors"
        >
          <Trash2 size={15} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 flex flex-col gap-4">

          {/* Definition */}
          {block.type === 'definition' && (
            <>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                placeholder="Term or concept name..."
                value={block.title}
                onChange={e => update({ title: e.target.value })}
              />
              <textarea
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[80px]"
                placeholder="Clear, precise definition..."
                value={block.body}
                onChange={e => update({ body: e.target.value })}
              />
              <textarea
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[60px]"
                placeholder="Analogy to make it stick (optional)..."
                value={block.analogy || ''}
                onChange={e => update({ analogy: e.target.value })}
              />
            </>
          )}

          {/* Explanation */}
          {block.type === 'explanation' && (
            <>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                placeholder="Title for this explanation..."
                value={block.title}
                onChange={e => update({ title: e.target.value })}
              />
              <textarea
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[100px]"
                placeholder="Explain intuitively — use scenarios, real-world examples..."
                value={block.body}
                onChange={e => update({ body: e.target.value })}
              />
            </>
          )}

          {/* Formula */}
          {block.type === 'formula' && (
            <>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                placeholder="Formula name..."
                value={block.title}
                onChange={e => update({ title: e.target.value })}
              />
              <textarea
                className="w-full bg-gray-800 text-white text-sm font-mono rounded-lg p-3 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[60px]"
                placeholder="The formula itself, e.g. x = (-b ± √(b²-4ac)) / 2a"
                value={block.body}
                onChange={e => update({ body: e.target.value })}
              />
              <textarea
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[80px]"
                placeholder="Break down each variable and what it means..."
                value={block.breakdown || ''}
                onChange={e => update({ breakdown: e.target.value })}
              />
            </>
          )}

          {/* Example */}
          {block.type === 'example' && (
            <>
              <input
                className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                placeholder="Example title or problem statement..."
                value={block.title}
                onChange={e => update({ title: e.target.value })}
              />
              <div className="flex flex-col gap-3">
                {(block.steps || []).map((step, index) => (
                  <div key={step.id} className="bg-gray-800 rounded-lg p-3 border border-gray-700 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Step {index + 1}</span>
                      <button
                        onClick={() => deleteStep(step.id)}
                        className="text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <X size={13} />
                      </button>
                    </div>
                    <input
                      className="w-full bg-gray-900 text-white text-sm font-mono rounded-md p-2 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                      placeholder="Expression or equation for this step..."
                      value={step.expression}
                      onChange={e => updateStep(step.id, { expression: e.target.value })}
                    />
                    <input
                      className="w-full bg-gray-900 text-white text-sm rounded-md p-2 placeholder-gray-600 outline-none border border-gray-700 focus:border-gray-500"
                      placeholder="Talking point — explain what's happening here..."
                      value={step.talkingPoint}
                      onChange={e => updateStep(step.id, { talkingPoint: e.target.value })}
                    />
                  </div>
                ))}
                <button
                  onClick={addStep}
                  className="flex items-center gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                >
                  <Plus size={14} />
                  Add Step
                </button>
              </div>
            </>
          )}

          {/* Key Point */}
          {block.type === 'keypoint' && (
            <textarea
              className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[80px]"
              placeholder="The single most important thing to remember here..."
              value={block.body}
              onChange={e => update({ body: e.target.value })}
            />
          )}

          {/* Note */}
          {block.type === 'note' && (
            <textarea
              className="w-full bg-gray-800 text-white text-sm rounded-lg p-3 placeholder-gray-600 outline-none resize-none border border-gray-700 focus:border-gray-500 min-h-[80px]"
              placeholder="Extra context, warnings, or side notes..."
              value={block.body}
              onChange={e => update({ body: e.target.value })}
            />
          )}

          {/* Question Block */}
          {block.type === 'question' && (
            <div className="flex flex-col gap-3">
              {question ? (
                <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs text-purple-400 uppercase tracking-wide">{question.type}</span>
                  </div>
                  <p className="text-sm text-white">
                    {question.questionText || 'Question text not set yet — edit in Questions tab'}
                  </p>
                  {question.options.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1">
                      {question.options.map(opt => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full border shrink-0 ${
                            question.correctAnswer === opt.id
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-gray-600'
                          }`} />
                          <span className="text-xs text-gray-400">{opt.text || 'Option not set'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {question.explanation && (
                    <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-700">
                      {question.explanation}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Question not found in bank.</p>
              )}
            </div>
          )}

          {/* Flashcard Block */}
          {block.type === 'flashcard' && (
            <div className="flex flex-col gap-3">
              {flashcard ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-500 mb-1">Front</p>
                    <p className="text-sm text-white">{flashcard.front || 'Front not set yet'}</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-500 mb-1">Back</p>
                    <p className="text-sm text-white">{flashcard.back || 'Back not set yet'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">Flashcard not found in bank.</p>
              )}
            </div>
          )}

        </div>
      )}
    </div>
  )
}
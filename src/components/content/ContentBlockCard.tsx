import { useState } from 'react'
import { Trash2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ContentBlock, ExampleStep, Question, Flashcard } from '../../types/content'

interface Props {
  block: ContentBlock
  question?: Question
  flashcard?: Flashcard
  onChange: (updated: ContentBlock) => void
  onDelete: (id: string) => void
}

const blockLabels: Record<string, string> = {
  definition: 'Definition', explanation: 'Explanation', formula: 'Formula',
  example: 'Example', keypoint: 'Key Point', note: 'Note',
  question: 'Question', flashcard: 'Flashcard',
}

const inputClass = "w-full text-sm text-gray-900 placeholder-gray-300 border border-gray-200 rounded p-2.5 outline-none focus:border-gray-400 transition-colors resize-none bg-white"

export default function ContentBlockCard({ block, question, flashcard, onChange, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false)
  const update = (fields: Partial<ContentBlock>) => onChange({ ...block, ...fields })

  const addStep = () => {
    const newStep: ExampleStep = { id: crypto.randomUUID(), expression: '', talkingPoint: '' }
    update({ steps: [...(block.steps || []), newStep] })
  }

  const updateStep = (id: string, fields: Partial<ExampleStep>) =>
    update({ steps: (block.steps || []).map(s => s.id === id ? { ...s, ...fields } : s) })

  const deleteStep = (id: string) =>
    update({ steps: (block.steps || []).filter(s => s.id !== id) })

  return (
    <div className="bg-white border border-gray-200 rounded overflow-hidden">

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-100 bg-stone-50">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-widest w-20 shrink-0">
          {blockLabels[block.type]}
        </span>
        <span className="flex-1 text-sm text-gray-400 truncate">
          {block.type === 'question' ? (question?.questionText || 'Question block')
            : block.type === 'flashcard' ? (flashcard?.front || 'Flashcard block')
            : (block.title || `Untitled ${blockLabels[block.type]}`)}
        </span>
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-300 hover:text-gray-500 transition-colors">
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        <button onClick={() => onDelete(block.id)} className="text-gray-300 hover:text-red-400 transition-colors">
          <Trash2 size={13} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 flex flex-col gap-3">

          {block.type === 'definition' && (
            <>
              <input className={inputClass} placeholder="Term or concept name..." value={block.title} onChange={e => update({ title: e.target.value })} />
              <textarea className={inputClass} placeholder="Clear, precise definition..." value={block.body} onChange={e => update({ body: e.target.value })} rows={3} />
              <textarea className={inputClass} placeholder="Analogy (optional)..." value={block.analogy || ''} onChange={e => update({ analogy: e.target.value })} rows={2} />
            </>
          )}

          {block.type === 'explanation' && (
            <>
              <input className={inputClass} placeholder="Title for this explanation..." value={block.title} onChange={e => update({ title: e.target.value })} />
              <textarea className={inputClass} placeholder="Explain intuitively with real-world context..." value={block.body} onChange={e => update({ body: e.target.value })} rows={4} />
            </>
          )}

          {block.type === 'formula' && (
            <>
              <input className={inputClass} placeholder="Formula name..." value={block.title} onChange={e => update({ title: e.target.value })} />
              <textarea className={`${inputClass} font-mono`} placeholder="The formula, e.g. x = (-b ± √(b²-4ac)) / 2a" value={block.body} onChange={e => update({ body: e.target.value })} rows={2} />
              <textarea className={inputClass} placeholder="Break down each variable..." value={block.breakdown || ''} onChange={e => update({ breakdown: e.target.value })} rows={3} />
            </>
          )}

          {block.type === 'example' && (
            <>
              <input className={inputClass} placeholder="Example title or problem..." value={block.title} onChange={e => update({ title: e.target.value })} />
              <div className="flex flex-col gap-2">
                {(block.steps || []).map((step, index) => (
                  <div key={step.id} className="border border-gray-200 rounded p-3 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">Step {index + 1}</span>
                      <button onClick={() => deleteStep(step.id)} className="text-gray-300 hover:text-red-400"><X size={12} /></button>
                    </div>
                    <input className={inputClass} placeholder="Expression for this step..." value={step.expression} onChange={e => updateStep(step.id, { expression: e.target.value })} />
                    <input className={inputClass} placeholder="Explain what's happening here..." value={step.talkingPoint} onChange={e => updateStep(step.id, { talkingPoint: e.target.value })} />
                  </div>
                ))}
                <button onClick={addStep} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                  <Plus size={12} />Add Step
                </button>
              </div>
            </>
          )}

          {(block.type === 'keypoint' || block.type === 'note') && (
            <textarea className={inputClass} placeholder={block.type === 'keypoint' ? 'The single most important thing to remember...' : 'Extra context, warnings, or side notes...'} value={block.body} onChange={e => update({ body: e.target.value })} rows={3} />
          )}
          {block.type === 'diagram' && (
            <div className="flex flex-col gap-2">
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center bg-stone-50">
                <p className="text-xs font-medium text-gray-500 mb-1">📐 Diagram Placeholder</p>
                <p className="text-xs text-gray-400 leading-relaxed">{block.body}</p>
              </div>
              {block.diagramPrompt && (
                <div className="bg-amber-50 border border-amber-100 rounded px-3 py-2">
                  <p className="text-xs font-medium text-amber-700 mb-1">Drawing instructions</p>
                  <p className="text-xs text-amber-600 leading-relaxed">{block.diagramPrompt}</p>
                </div>
              )}
              <button className="text-xs text-gray-400 hover:text-gray-600 border border-dashed border-gray-200 rounded py-2 transition-colors">
                + Upload diagram image
              </button>
            </div>
          )}

          {block.type === 'question' && (
            question ? (
              <div className="border border-gray-200 rounded p-3">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{question.type}</p>
                <p className="text-sm text-gray-800">{question.questionText || 'Question not set yet'}</p>
                {question.options.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {question.options.map(opt => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full border shrink-0 ${question.correctAnswer === opt.id ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`} />
                        <span className="text-xs text-gray-500">{opt.text || 'Option not set'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : <p className="text-sm text-gray-400">Question not found.</p>
          )}

          {block.type === 'flashcard' && (
            flashcard ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded p-3">
                  <p className="text-xs text-gray-400 mb-1">Front</p>
                  <p className="text-sm text-gray-800">{flashcard.front || 'Not set'}</p>
                </div>
                <div className="border border-gray-200 rounded p-3">
                  <p className="text-xs text-gray-400 mb-1">Back</p>
                  <p className="text-sm text-gray-800">{flashcard.back || 'Not set'}</p>
                </div>
              </div>
            ) : <p className="text-sm text-gray-400">Flashcard not found.</p>
          )}

        </div>
      )}
    </div>
  )
}
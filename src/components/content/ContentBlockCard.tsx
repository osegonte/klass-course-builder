import { useState, useEffect } from 'react'
import { Trash2, Plus, X, ChevronDown, ChevronUp } from 'lucide-react'
import type { ContentBlock, ExampleStep, Question, Flashcard, TableData } from '../../types/content'
import katex from 'katex'
import 'katex/dist/katex.min.css'

interface Props {
  block: ContentBlock
  question?: Question
  flashcard?: Flashcard
  onChange: (updated: ContentBlock) => void
  onDelete: (id: string) => void
}

const BLOCK_LABEL: Record<string, string> = {
  definition:  'Definition',
  explanation: 'Explanation',
  formula:     'Formula',
  example:     'Example',
  keypoint:    'Key Point',
  note:        'Note',
  table:       'Table',
  diagram:     'Diagram',
  question:    'Question',
  flashcard:   'Flashcard',
}

const BLOCK_ACCENT: Record<string, string> = {
  definition:  'bg-purple-50  border-purple-100',
  explanation: 'bg-blue-50    border-blue-100',
  formula:     'bg-amber-50   border-amber-100',
  example:     'bg-green-50   border-green-100',
  keypoint:    'bg-yellow-50  border-yellow-100',
  note:        'bg-stone-50   border-stone-200',
  table:       'bg-slate-50   border-slate-200',
  diagram:     'bg-teal-50    border-teal-100',
  question:    'bg-orange-50  border-orange-100',
  flashcard:   'bg-pink-50    border-pink-100',
}

const BLOCK_LABEL_COLOR: Record<string, string> = {
  definition:  'text-purple-600',
  explanation: 'text-blue-600',
  formula:     'text-amber-700',
  example:     'text-green-700',
  keypoint:    'text-yellow-700',
  note:        'text-gray-500',
  table:       'text-slate-600',
  diagram:     'text-teal-700',
  question:    'text-orange-700',
  flashcard:   'text-pink-700',
}

const input = "w-full text-sm text-gray-900 placeholder-gray-300 border border-gray-200 rounded p-2.5 outline-none focus:border-gray-500 transition-colors bg-white"
const ta    = `${input} resize-none`

function FormulaPreview({ latex }: { latex: string }) {
  const [html, setHtml]   = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!latex.trim()) { setHtml(''); setError(''); return }
    try {
      setHtml(katex.renderToString(latex, { displayMode: true, throwOnError: true }))
      setError('')
    } catch (e: any) {
      setError(e.message ?? 'Invalid LaTeX')
      setHtml('')
    }
  }, [latex])

  if (!latex.trim()) return null
  if (error) return <p className="text-xs text-red-500 mt-1 font-mono">{error}</p>
  return (
    <div
      className="border border-amber-100 rounded p-3 bg-white overflow-x-auto"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}

export default function ContentBlockCard({ block, question, flashcard, onChange, onDelete }: Props) {
  const [collapsed, setCollapsed] = useState(false)

  const update = (fields: Partial<ContentBlock>) => onChange({ ...block, ...fields })

  const addStep = () => {
    const s: ExampleStep = { id: crypto.randomUUID(), expression: '', talkingPoint: '' }
    update({ steps: [...(block.steps ?? []), s] })
  }
  const updateStep = (id: string, fields: Partial<ExampleStep>) =>
    update({ steps: (block.steps ?? []).map(s => s.id === id ? { ...s, ...fields } : s) })
  const deleteStep = (id: string) =>
    update({ steps: (block.steps ?? []).filter(s => s.id !== id) })

  const preview =
    block.type === 'question'  ? (question?.questionText  || 'Question block')  :
    block.type === 'flashcard' ? (flashcard?.front         || 'Flashcard block') :
    (block.title || `Untitled ${BLOCK_LABEL[block.type] ?? block.type}`)

  const accent      = BLOCK_ACCENT[block.type]      ?? 'bg-stone-50 border-stone-200'
  const labelColor  = BLOCK_LABEL_COLOR[block.type] ?? 'text-gray-500'

  return (
    <div className="bg-white border border-gray-200 rounded overflow-hidden">

      {/* Header */}
      <div className={`flex items-center gap-3 px-4 py-2.5 border-b ${accent}`}>
        <span className={`text-xs font-semibold uppercase tracking-widest shrink-0 w-24 ${labelColor}`}>
          {BLOCK_LABEL[block.type] ?? block.type}
        </span>
        <span className="flex-1 text-sm text-gray-500 truncate">{preview}</span>
        <button
          type="button"
          onClick={() => setCollapsed(v => !v)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(block.id)}
          className="text-gray-300 hover:text-red-400 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 flex flex-col gap-3">

          {/* DEFINITION */}
          {block.type === 'definition' && (<>
            <input    className={input} placeholder="Term or concept name…"      value={block.title}          onChange={e => update({ title: e.target.value })} />
            <textarea className={ta}    placeholder="Clear, precise definition…" value={block.body}           onChange={e => update({ body: e.target.value })}  rows={3} />
            <textarea className={ta}    placeholder="Analogy (optional)…"        value={block.analogy ?? ''}  onChange={e => update({ analogy: e.target.value })} rows={2} />
          </>)}

          {/* EXPLANATION */}
          {block.type === 'explanation' && (<>
            <input    className={input} placeholder="Title for this explanation…"              value={block.title}         onChange={e => update({ title: e.target.value })} />
            <textarea className={ta}    placeholder="Explain with real-world context…"          value={block.body}          onChange={e => update({ body: e.target.value })}  rows={4} />
            <textarea className={ta}    placeholder="Analogy (optional)…"                       value={block.analogy ?? ''} onChange={e => update({ analogy: e.target.value })} rows={2} />
          </>)}

          {/* FORMULA */}
          {block.type === 'formula' && (<>
            <input className={input} placeholder="Formula name, e.g. Quadratic Formula" value={block.title} onChange={e => update({ title: e.target.value })} />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">LaTeX expression</label>
              <textarea
                className={`${ta} font-mono text-xs`}
                placeholder="e.g.  x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a}"
                value={block.body}
                onChange={e => update({ body: e.target.value })}
                rows={2}
              />
              <p className="text-xs text-gray-400">Preview renders below as you type.</p>
            </div>
            <FormulaPreview latex={block.body} />
            <textarea className={ta} placeholder="Break down each variable…" value={block.breakdown ?? ''} onChange={e => update({ breakdown: e.target.value })} rows={3} />
          </>)}

          {/* EXAMPLE */}
          {block.type === 'example' && (<>
            <input className={input} placeholder="Example title or problem…" value={block.title} onChange={e => update({ title: e.target.value })} />
            <div className="flex flex-col gap-2">
              {(block.steps ?? []).map((step, i) => (
                <div key={step.id} className="border border-gray-200 rounded p-3 flex flex-col gap-2 bg-stone-50">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium">Step {i + 1}</span>
                    <button type="button" onClick={() => deleteStep(step.id)} className="text-gray-300 hover:text-red-400"><X size={12} /></button>
                  </div>
                  <input className={input} placeholder="Expression or equation for this step…" value={step.expression}   onChange={e => updateStep(step.id, { expression: e.target.value })} />
                  <input className={input} placeholder="Explain what's happening here…"         value={step.talkingPoint} onChange={e => updateStep(step.id, { talkingPoint: e.target.value })} />
                </div>
              ))}
              <button type="button" onClick={addStep} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors py-1">
                <Plus size={12} /> Add Step
              </button>
            </div>
          </>)}

          {/* KEY POINT */}
          {block.type === 'keypoint' && (
            <textarea className={ta} placeholder="The single most important thing to remember…" value={block.body} onChange={e => update({ body: e.target.value })} rows={3} />
          )}

          {/* NOTE */}
          {block.type === 'note' && (
            <textarea className={ta} placeholder="Extra context, warnings, or side notes…" value={block.body} onChange={e => update({ body: e.target.value })} rows={3} />
          )}


          {/* TABLE */}
          {block.type === 'table' && (
            <TableEditor
              data={block.steps ? (block.steps as unknown as TableData) : { headers: ['Column 1', 'Column 2'], rows: [['', '']] }}
              onChange={tableData => update({ steps: tableData as unknown as typeof block.steps })}
            />
          )}

          {/* DIAGRAM */}
          {block.type === 'diagram' && (<>
            <input className={input} placeholder="Diagram title, e.g. Structure of a Plant Cell" value={block.title} onChange={e => update({ title: e.target.value })} />
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Description</label>
              <textarea className={ta} placeholder="Describe what this diagram shows…" value={block.body} onChange={e => update({ body: e.target.value })} rows={2} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Drawing instructions</label>
              <textarea
                className={ta}
                placeholder="Describe how to draw or render this diagram…"
                value={block.diagramPrompt ?? ''}
                onChange={e => update({ diagramPrompt: e.target.value })}
                rows={4}
              />
            </div>
            <div className="border-2 border-dashed border-teal-200 rounded p-8 text-center bg-teal-50">
              <p className="text-xs font-medium text-teal-600">{block.title || 'Diagram'}</p>
              {block.body && <p className="text-xs text-teal-500 mt-1">{block.body}</p>}
              <p className="text-xs text-teal-400 mt-3">Renders in student view</p>
            </div>
          </>)}

          {/* QUESTION */}
          {block.type === 'question' && (
            question ? (
              <div className="border border-gray-200 rounded p-3 bg-stone-50">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">{question.type}</p>
                <p className="text-sm text-gray-800 font-medium">{question.questionText || 'Question text not set'}</p>
                {question.options.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1">
                    {question.options.map(opt => (
                      <div key={opt.id} className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full border shrink-0 ${question.correctAnswer === opt.id ? 'bg-gray-900 border-gray-900' : 'border-gray-300'}`} />
                        <span className="text-xs text-gray-600">{opt.text || 'Option not set'}</span>
                      </div>
                    ))}
                  </div>
                )}
                {question.hint && <p className="text-xs text-gray-400 mt-2 italic">Hint: {question.hint}</p>}
              </div>
            ) : <p className="text-sm text-gray-400 p-2">Question not found.</p>
          )}

          {/* FLASHCARD */}
          {block.type === 'flashcard' && (
            flashcard ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="border border-gray-200 rounded p-3 bg-stone-50">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Front</p>
                  <p className="text-sm text-gray-800">{flashcard.front || 'Not set'}</p>
                </div>
                <div className="border border-gray-200 rounded p-3 bg-stone-50">
                  <p className="text-xs text-gray-400 mb-1 uppercase tracking-wide">Back</p>
                  <p className="text-sm text-gray-800">{flashcard.back || 'Not set'}</p>
                </div>
              </div>
            ) : <p className="text-sm text-gray-400 p-2">Flashcard not found.</p>
          )}

        </div>
      )}
    </div>
  )
}

// ── Table Editor ──────────────────────────────────────────────────────────────

function TableEditor({ data, onChange }: { data: TableData; onChange: (d: TableData) => void }) {
  const updateHeader = (i: number, val: string) => {
    const headers = [...data.headers]
    headers[i] = val
    onChange({ ...data, headers })
  }

  const updateCell = (r: number, c: number, val: string) => {
    const rows = data.rows.map(row => [...row])
    rows[r][c] = val
    onChange({ ...data, rows })
  }

  const addColumn = () => {
    onChange({
      headers: [...data.headers, `Column ${data.headers.length + 1}`],
      rows: data.rows.map(row => [...row, '']),
    })
  }

  const addRow = () => {
    onChange({ ...data, rows: [...data.rows, data.headers.map(() => '')] })
  }

  const removeRow = (r: number) => {
    onChange({ ...data, rows: data.rows.filter((_, i) => i !== r) })
  }

  const removeColumn = (c: number) => {
    onChange({
      headers: data.headers.filter((_, i) => i !== c),
      rows: data.rows.map(row => row.filter((_, i) => i !== c)),
    })
  }

  const cellClass = "text-xs text-gray-800 border border-gray-200 px-2 py-1.5 outline-none focus:border-gray-500 bg-white w-full"

  return (
    <div className="flex flex-col gap-2 overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <thead>
          <tr>
            {data.headers.map((h, c) => (
              <th key={c} className="border border-gray-300 bg-stone-50 p-0 relative group">
                <input
                  className="text-xs font-semibold text-gray-700 bg-stone-50 border-0 px-2 py-1.5 outline-none w-full focus:bg-white"
                  value={h}
                  onChange={e => updateHeader(c, e.target.value)}
                  placeholder={`Column ${c + 1}`}
                />
                {data.headers.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeColumn(c)}
                    className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all"
                  >
                    <X size={10} />
                  </button>
                )}
              </th>
            ))}
            <th className="w-6 border border-gray-200 bg-stone-50">
              <button type="button" onClick={addColumn} className="w-full h-full flex items-center justify-center text-gray-400 hover:text-gray-700 py-1.5">
                <Plus size={11} />
              </button>
            </th>
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, r) => (
            <tr key={r} className="group">
              {row.map((cell, c) => (
                <td key={c} className="border border-gray-200 p-0">
                  <input className={cellClass} value={cell} onChange={e => updateCell(r, c, e.target.value)} placeholder="..." />
                </td>
              ))}
              <td className="border border-gray-200 w-6">
                <button
                  type="button"
                  onClick={() => removeRow(r)}
                  className="w-full h-full flex items-center justify-center text-gray-300 hover:text-red-400 opacity-0 group-hover:opacity-100 py-1.5"
                >
                  <X size={10} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        type="button"
        onClick={addRow}
        className="self-start flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors"
      >
        <Plus size={11} /> Add row
      </button>
    </div>
  )
}
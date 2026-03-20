import { useState } from 'react'
import { Sparkles, Check, X, Loader2, AlertCircle, TriangleAlert } from 'lucide-react'
import { generateQuestions } from '../../lib/anthropic'
import type { CourseGenerationParams, GeneratedQuestion } from '../../lib/anthropic'
import { parseMarkdownToBlocks, validateParsedBlocks } from '../../lib/markdownParser'
import type { ContentBlock, Question } from '../../types/content'

interface Props {
  params:             Omit<CourseGenerationParams, 'sourceTextbook' | 'sourceTranscript' | 'sourceExtra'>
  onAcceptBlocks:     (blocks: Omit<ContentBlock, 'id' | 'order'>[]) => Promise<void>
  onAcceptQuestions?: (questions: Omit<Question, 'id' | 'order'>[]) => Promise<void>
  onClose:            () => void
}

type Step = 'paste' | 'generating_questions' | 'review' | 'done'

export default function GenerateCourse({ params, onAcceptBlocks, onAcceptQuestions, onClose }: Props) {
  const [step,    setStep]    = useState<Step>('paste')
  const [error,   setError]   = useState<string | null>(null)
  const [saving,  setSaving]  = useState(false)

  const [markdown,       setMarkdown]       = useState('')
  const [parsedBlocks,   setParsedBlocks]   = useState<Omit<ContentBlock, 'id' | 'order'>[]>([])
  const [warnings,       setWarnings]       = useState<string[]>([])
  const [generatedQs,    setGeneratedQs]    = useState<GeneratedQuestion[]>([])
  const [acceptedBlocks, setAcceptedBlocks] = useState<Set<number>>(new Set())
  const [acceptedQs,     setAcceptedQs]     = useState<Set<number>>(new Set())

  // Parse markdown locally — no API call
  const handleParse = async () => {
    setError(null)
    if (!markdown.trim()) { setError('Paste your ChatGPT notes before continuing.'); return }

    const blocks  = parseMarkdownToBlocks(markdown)
    const { valid, warnings: w } = validateParsedBlocks(blocks)

    if (!valid) {
      setError('Could not find any blocks. Make sure your ChatGPT output uses ## DEFINITION:, ## EXPLANATION:, etc. as headings.')
      return
    }

    setParsedBlocks(blocks)
    setWarnings(w)
    setAcceptedBlocks(new Set(blocks.map((_, i) => i)))

    // Generate questions via Claude (small focused call — reliable)
    setStep('generating_questions')
    try {
      const contentSummary = blocks
        .filter(b => b.type !== 'question' && b.type !== 'flashcard')
        .map(b => `${b.title}: ${b.body}`)
        .join('\n')
        .slice(0, 2000)

      const qs = await generateQuestions(
        { ...params, level: params.level ?? 'subtopic' },
        contentSummary,
        4
      )
      setGeneratedQs(qs)
      setAcceptedQs(new Set(qs.map((_, i) => i)))
    } catch {
      // Questions failing is non-fatal — continue without them
      setGeneratedQs([])
    }

    setStep('review')
  }

  const handleSave = async () => {
    setSaving(true)
    setError(null)
    try {
      const blocksToSave = parsedBlocks.filter((_, i) => acceptedBlocks.has(i))
      await onAcceptBlocks(blocksToSave)

      if (onAcceptQuestions && acceptedQs.size > 0) {
        const qsToSave = generatedQs
          .filter((_, i) => acceptedQs.has(i))
          .map(q => ({
            subtopicId:     undefined,
            subjectId:      undefined,
            type:           q.type as Question['type'],
            questionText:   q.question_text,
            options:        q.options,
            correctAnswer:  q.correct_answer,
            hint:           q.hint,
            status:         'draft' as const,
            isMockQuestion: false,
          }))
        await onAcceptQuestions(qsToSave)
      }
      setStep('done')
    } catch (e: any) {
      setError(e.message ?? 'Failed to save.')
    }
    setSaving(false)
  }

  const toggleBlock = (i: number) =>
    setAcceptedBlocks(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })
  const toggleQ = (i: number) =>
    setAcceptedQs(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s })

  const BLOCK_ACCENT: Record<string, string> = {
    definition:  'text-purple-600',
    explanation: 'text-blue-600',
    formula:     'text-amber-700',
    example:     'text-green-700',
    table:       'text-slate-600',
    keypoint:    'text-yellow-700',
    note:        'text-gray-500',
    diagram:     'text-teal-700',
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col" style={{ maxHeight: '90vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={15} className="text-gray-600" />
            <span className="text-sm font-semibold text-gray-900">
              Build {params.level === 'topic' ? 'Course' : 'Subtopic'} — {params.name}
            </span>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={15} />
          </button>
        </div>

        {/* Step pills */}
        <div className="px-6 py-2.5 border-b border-gray-100 bg-stone-50 shrink-0 flex items-center gap-2">
          {(['paste', 'review', 'done'] as const).map((s, i) => {
            const labels = { paste: '1. Paste notes', review: '2. Review blocks', done: '3. Saved' }
            const isActive = step === s || (step === 'generating_questions' && s === 'review')
            const isPast   = ['paste', 'review', 'done'].indexOf(step) > i
            return (
              <span key={s} className={`text-xs px-2 py-0.5 rounded-full ${
                isActive ? 'bg-gray-900 text-white' :
                isPast   ? 'bg-gray-100 text-gray-500' : 'text-gray-300'
              }`}>
                {labels[s]}
              </span>
            )
          })}
        </div>

        {/* Error */}
        {error && (
          <div className="mx-6 mt-3 flex items-start gap-2 bg-red-50 border border-red-200 rounded p-3 shrink-0">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* PASTE */}
          {step === 'paste' && (
            <div className="p-6 flex flex-col gap-4">
              <div className="bg-stone-50 border border-gray-200 rounded p-3 flex flex-col gap-1">
                <p className="text-xs font-medium text-gray-700">How this works</p>
                <p className="text-xs text-gray-500">
                  1. In the Overview panel, click <strong>Get ChatGPT Prompt</strong> and copy it.<br />
                  2. Paste it into ChatGPT Pro and let it generate the course notes.<br />
                  3. Copy the ChatGPT output and paste it below.
                </p>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-600">ChatGPT output</label>
                <textarea
                  className="w-full text-xs text-gray-800 font-mono border border-gray-200 rounded p-3 resize-none focus:outline-none focus:border-gray-500 bg-white"
                  rows={18}
                  placeholder={`Paste your ChatGPT notes here. They should look like:\n\n## DEFINITION: Laws of Indices\nWhen multiplying powers...\nANALOGY: Like counting groups at a market...\n\n## FORMULA: Multiplication Law\na^m x a^n = a^(m+n)\nBREAKDOWN: a = base, m and n = exponents\n\n## EXAMPLE: Simplify 2³ × 2⁴\nSTEP 1: 2³ × 2⁴ -- same base, add exponents\nSTEP 2: 2^(3+4) = 2⁷ -- evaluate\nSTEP 3: 2⁷ = 128 -- final answer`}
                  value={markdown}
                  onChange={e => setMarkdown(e.target.value)}
                />
              </div>

              <button
                type="button"
                onClick={handleParse}
                disabled={!markdown.trim()}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-sm py-2.5 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <Sparkles size={13} />
                Parse into Blocks
              </button>
            </div>
          )}

          {/* GENERATING QUESTIONS */}
          {step === 'generating_questions' && (
            <div className="p-12 flex flex-col items-center gap-3">
              <Loader2 size={24} className="text-gray-400 animate-spin" />
              <p className="text-sm text-gray-500">Generating questions from your content…</p>
              <p className="text-xs text-gray-400">Parsed {parsedBlocks.length} blocks. Generating questions now.</p>
            </div>
          )}

          {/* REVIEW */}
          {step === 'review' && (
            <div className="p-6 flex flex-col gap-4">

              {/* Warnings */}
              {warnings.length > 0 && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded p-3">
                  <TriangleAlert size={14} className="text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-xs font-medium text-amber-800 mb-1">Heads up</p>
                    {warnings.map((w, i) => <p key={i} className="text-xs text-amber-700">{w}</p>)}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-700">
                  {parsedBlocks.length} blocks parsed from your notes
                </p>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setAcceptedBlocks(new Set(parsedBlocks.map((_, i) => i)))} className="text-xs text-gray-500 hover:text-gray-900">All</button>
                  <button type="button" onClick={() => setAcceptedBlocks(new Set())} className="text-xs text-gray-500 hover:text-gray-900">None</button>
                </div>
              </div>

              {/* Blocks */}
              <div className="flex flex-col gap-2">
                {parsedBlocks.map((block, i) => (
                  <div
                    key={i}
                    className={`border rounded overflow-hidden ${acceptedBlocks.has(i) ? 'border-gray-200 bg-white' : 'border-gray-100 bg-stone-50 opacity-50'}`}
                  >
                    <div className="flex items-center gap-3 px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => toggleBlock(i)}
                        className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center ${
                          acceptedBlocks.has(i) ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'
                        }`}
                      >
                        {acceptedBlocks.has(i) && <Check size={10} className="text-white" />}
                      </button>
                      <span className={`text-xs font-semibold uppercase tracking-wide w-24 shrink-0 ${BLOCK_ACCENT[block.type] ?? 'text-gray-500'}`}>
                        {block.type}
                      </span>
                      <span className="text-sm text-gray-800 flex-1 truncate">{block.title || '(untitled)'}</span>
                    </div>
                    {block.body && (
                      <p className="px-10 pb-2.5 text-xs text-gray-500 line-clamp-2">{block.body}</p>
                    )}
                  </div>
                ))}
              </div>

              {/* Questions */}
              {generatedQs.length > 0 && onAcceptQuestions && (
                <>
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <p className="text-xs font-medium text-gray-700">{generatedQs.length} questions generated</p>
                    <div className="flex gap-3">
                      <button type="button" onClick={() => setAcceptedQs(new Set(generatedQs.map((_, i) => i)))} className="text-xs text-gray-500 hover:text-gray-900">All</button>
                      <button type="button" onClick={() => setAcceptedQs(new Set())} className="text-xs text-gray-500 hover:text-gray-900">None</button>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    {generatedQs.map((q, i) => (
                      <div key={i} className={`border rounded p-3 flex items-start gap-3 ${acceptedQs.has(i) ? 'border-gray-200 bg-white' : 'border-gray-100 bg-stone-50 opacity-50'}`}>
                        <button
                          type="button"
                          onClick={() => toggleQ(i)}
                          className={`w-4 h-4 rounded border shrink-0 flex items-center justify-center mt-0.5 ${acceptedQs.has(i) ? 'bg-gray-900 border-gray-900' : 'border-gray-300 bg-white'}`}
                        >
                          {acceptedQs.has(i) && <Check size={10} className="text-white" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800">{q.question_text}</p>
                          <div className="mt-1 flex flex-col gap-0.5">
                            {q.options.map(opt => (
                              <p key={opt.id} className={`text-xs ${q.correct_answer === opt.id ? 'text-green-700 font-medium' : 'text-gray-500'}`}>
                                {opt.id}. {opt.text}
                              </p>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* Save */}
              <div className="pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || acceptedBlocks.size === 0}
                  className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white text-sm py-3 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors font-medium"
                >
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  {saving
                    ? 'Saving…'
                    : `Save ${acceptedBlocks.size} block${acceptedBlocks.size !== 1 ? 's' : ''}${acceptedQs.size > 0 && onAcceptQuestions ? ` + ${acceptedQs.size} question${acceptedQs.size !== 1 ? 's' : ''}` : ''}`
                  }
                </button>
              </div>
            </div>
          )}

          {/* DONE */}
          {step === 'done' && (
            <div className="p-12 flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Check size={18} className="text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-900">Saved successfully</p>
              <p className="text-xs text-gray-500">
                {acceptedBlocks.size} block{acceptedBlocks.size !== 1 ? 's' : ''} added to the course.
              </p>
              <button type="button" onClick={onClose} className="mt-3 text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700">
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
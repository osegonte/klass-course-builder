import { useState } from 'react'
import { Sparkles, Loader2, ChevronRight, Edit3, Check, AlertTriangle, Image } from 'lucide-react'
import SourcesPanel, { type Sources } from './SourcesPanel'
import { preprocessSources, generateLesson, type GeneratedBlock } from '../../lib/anthropic'
import type { ContentBlock } from '../../types/content'

interface Props {
  subtopicName: string
  topicName: string
  subjectName?: string
  objectives: string[]
  topicSources?: Sources
  chapterNumber?: number
  totalChapters?: number
  onAcceptBlocks: (blocks: Omit<ContentBlock, 'id' | 'order'>[]) => void
  onClose: () => void
}

type Step = 'sources' | 'preparing' | 'review-notes' | 'generating' | 'review-blocks' | 'done'

export default function AILessonGenerator({
  subtopicName, topicName, subjectName, objectives, topicSources, chapterNumber, totalChapters, onAcceptBlocks, onClose
}: Props) {

  const [step, setStep] = useState<Step>('sources')
  const [sources, setSources] = useState<Sources>(
    topicSources ?? { transcript: '', textbook: '', extra: '' }
  )
  const [cleanNotes, setCleanNotes] = useState('')
  const [generatedBlocks, setGeneratedBlocks] = useState<GeneratedBlock[]>([])
  const [error, setError] = useState('')

  const hasAnySources = sources.transcript.trim() || sources.textbook.trim() || sources.extra.trim()

  // ── Pass 1: Prepare sources ──────────────────────────────────────────────────
  const handlePrepareSources = async () => {
    setError('')
    setStep('preparing')
    try {
      const notes = await preprocessSources({
        level: 'subtopic',
        name: subtopicName,
        topicName,
        subjectName,
        objectives,
        chapterNumber,
        totalChapters,
        sourceTranscript: sources.transcript || undefined,
        sourceTextbook: sources.textbook || undefined,
        sourceExtra: sources.extra || undefined,
      })
      setCleanNotes(notes)
      setStep('review-notes')
    } catch (err: any) {
      setError(err.message)
      setStep('sources')
    }
  }

  // ── Pass 2: Generate lesson blocks ───────────────────────────────────────────
  const handleGenerateLesson = async () => {
    setError('')
    setStep('generating')
    try {
      const blocks = await generateLesson({
        level: 'subtopic',
        name: subtopicName,
        topicName,
        subjectName,
        objectives,
        chapterNumber,
        totalChapters,
      }, cleanNotes)
      setGeneratedBlocks(blocks)
      setStep('review-blocks')
    } catch (err: any) {
      setError(err.message)
      setStep('review-notes')
    }
  }

  // ── Accept all blocks into ContentBuilder ────────────────────────────────────
  const handleAccept = () => {
    const mapped = generatedBlocks.map(b => ({
      type: b.type as ContentBlock['type'],
      title: b.title,
      body: b.body,
      analogy: b.analogy ?? undefined,
      breakdown: b.breakdown ?? undefined,
      steps: b.steps?.map(s => ({ ...s, id: crypto.randomUUID() })) ?? undefined,
      diagramPrompt: b.diagramPrompt ?? undefined,
    }))
    onAcceptBlocks(mapped)
    setStep('done')
  }

  const removeBlock = (index: number) => {
    setGeneratedBlocks(blocks => blocks.filter((_, i) => i !== index))
  }

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="border border-gray-200 rounded bg-white overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-stone-50">
        <div className="flex items-center gap-2">
          <Sparkles size={13} className="text-gray-500" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">AI Lesson Generator</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Step indicator */}
          {['sources', 'review-notes', 'review-blocks'].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${
                step === s ? 'bg-gray-900' :
                ['review-notes', 'review-blocks', 'done'].indexOf(step) > ['sources', 'review-notes', 'review-blocks'].indexOf(s)
                  ? 'bg-gray-400' : 'bg-gray-200'
              }`} />
              {i < 2 && <ChevronRight size={10} className="text-gray-200" />}
            </div>
          ))}
          <button onClick={onClose} className="text-xs text-gray-400 hover:text-gray-600 ml-2">✕</button>
        </div>
      </div>

      <div className="p-4">

        {error && (
          <div className="flex items-center gap-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded px-3 py-2 mb-4">
            <AlertTriangle size={12} />
            {error}
          </div>
        )}

        {/* ── Step 1: Add sources ───────────────────────────────────────────── */}
        {step === 'sources' && (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-gray-500 pb-2 border-b border-gray-100">
              <p className="font-medium text-gray-700 mb-1">Step 1 — Add your source materials</p>
              <p>Paste a YouTube transcript, textbook pages, or your own notes. The AI will clean them up first before generating the lesson — so don't worry about messy formatting.</p>
            </div>

            {/* Objectives preview */}
            {objectives.length > 0 && (
              <div className="bg-stone-50 border border-gray-100 rounded px-3 py-2">
                <p className="text-xs font-medium text-gray-500 mb-1.5">Objectives for {subtopicName}</p>
                <ul className="flex flex-col gap-1">
                  {objectives.map((o, i) => (
                    <li key={i} className="text-xs text-gray-600 flex gap-1.5">
                      <span className="text-gray-300 shrink-0">–</span>
                      {o}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {topicSources && (sources.transcript || sources.textbook || sources.extra) && (
              <p className="text-xs text-gray-400 bg-stone-50 border border-gray-100 rounded px-3 py-2">
                Sources pre-loaded from the topic level. Add subtopic-specific materials below or use as-is.
              </p>
            )}
            <SourcesPanel sources={sources} onChange={setSources} />

            <div className="flex justify-end">
              <button
                onClick={handlePrepareSources}
                disabled={!hasAnySources}
                className="flex items-center gap-2 text-sm bg-gray-900 text-white px-5 py-2 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <Sparkles size={13} />
                Prepare sources
              </button>
            </div>
          </div>
        )}

        {/* ── Preparing (loading) ───────────────────────────────────────────── */}
        {step === 'preparing' && (
          <div className="flex flex-col items-center py-10 gap-3">
            <Loader2 size={20} className="animate-spin text-gray-400" />
            <p className="text-sm text-gray-600 font-medium">Reading your sources…</p>
            <p className="text-xs text-gray-400 text-center max-w-sm">
              Extracting concepts, removing filler, and organising clean notes for {subtopicName}.
            </p>
          </div>
        )}

        {/* ── Step 2: Review clean notes ────────────────────────────────────── */}
        {step === 'review-notes' && (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-gray-500 pb-2 border-b border-gray-100">
              <p className="font-medium text-gray-700 mb-1">Step 2 — Review the cleaned notes</p>
              <p>The AI has extracted and structured your source material. Read through it — edit anything that looks wrong, fill in any [GAP] flags, then generate the lesson.</p>
            </div>

            <div className="relative">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Edit3 size={11} className="text-gray-400" />
                <span className="text-xs text-gray-400">Editable — make changes before generating</span>
              </div>
              <textarea
                value={cleanNotes}
                onChange={e => setCleanNotes(e.target.value)}
                className="w-full min-h-[280px] border border-gray-200 rounded p-4 text-sm text-gray-800 outline-none focus:border-gray-400 transition-colors resize-none leading-relaxed font-mono bg-white"
              />
            </div>

            <div className="flex items-center justify-between">
              <button
                onClick={() => setStep('sources')}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                ← Back to sources
              </button>
              <button
                onClick={handleGenerateLesson}
                disabled={!cleanNotes.trim()}
                className="flex items-center gap-2 text-sm bg-gray-900 text-white px-5 py-2 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                <Sparkles size={13} />
                Generate lesson
              </button>
            </div>
          </div>
        )}

        {/* ── Generating (loading) ──────────────────────────────────────────── */}
        {step === 'generating' && (
          <div className="flex flex-col items-center py-10 gap-3">
            <Loader2 size={20} className="animate-spin text-gray-400" />
            <p className="text-sm text-gray-600 font-medium">Building the lesson…</p>
            <p className="text-xs text-gray-400 text-center max-w-sm">
              Breaking down {subtopicName} into definitions, explanations, examples, and diagram placeholders.
            </p>
          </div>
        )}

        {/* ── Step 3: Review generated blocks ──────────────────────────────── */}
        {step === 'review-blocks' && (
          <div className="flex flex-col gap-4">
            <div className="text-xs text-gray-500 pb-2 border-b border-gray-100">
              <p className="font-medium text-gray-700 mb-1">Step 3 — Review the lesson blocks</p>
              <p>Remove any blocks you don't want. Accept to add them all to the content builder where you can edit each one individually.</p>
            </div>

            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-1">
              {generatedBlocks.map((block, i) => (
                <div
                  key={i}
                  className={`border rounded p-3 flex items-start gap-3 group ${
                    block.type === 'diagram'
                      ? 'border-gray-300 bg-gray-50 border-dashed'
                      : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {block.type === 'diagram' && (
                        <Image size={11} className="text-gray-400 shrink-0" />
                      )}
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${
                        block.type === 'diagram'
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {block.type}
                      </span>
                      <span className="text-xs font-medium text-gray-800 truncate">{block.title}</span>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">{block.body}</p>
                    {block.type === 'diagram' && block.diagramPrompt && (
                      <p className="text-xs text-gray-400 mt-1 italic line-clamp-1">
                        Instructions: {block.diagramPrompt}
                      </p>
                    )}
                    {block.analogy && (
                      <p className="text-xs text-gray-400 mt-1">Analogy: {block.analogy}</p>
                    )}
                    {block.steps && block.steps.length > 0 && (
                      <p className="text-xs text-gray-400 mt-1">{block.steps.length} worked steps</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeBlock(i)}
                    className="text-gray-200 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 shrink-0 mt-0.5"
                    title="Remove block"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-400">
                {generatedBlocks.length} blocks · {generatedBlocks.filter(b => b.type === 'diagram').length} diagram placeholders
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep('review-notes')}
                  className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  ← Regenerate
                </button>
                <button
                  onClick={handleAccept}
                  disabled={generatedBlocks.length === 0}
                  className="flex items-center gap-2 text-sm bg-gray-900 text-white px-5 py-2 rounded hover:bg-gray-700 disabled:opacity-40 transition-colors"
                >
                  <Check size={13} />
                  Accept {generatedBlocks.length} blocks
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Done ─────────────────────────────────────────────────────────── */}
        {step === 'done' && (
          <div className="flex flex-col items-center py-8 gap-3">
            <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center">
              <Check size={14} className="text-white" />
            </div>
            <p className="text-sm text-gray-700 font-medium">Lesson added to content builder</p>
            <p className="text-xs text-gray-400 text-center">
              Each block is now individually editable. Diagram placeholders show where to add images.
            </p>
            <button
              onClick={onClose}
              className="text-xs text-gray-500 hover:text-gray-700 mt-2 transition-colors"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
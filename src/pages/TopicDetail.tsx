import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight, Sparkles, Loader2, Check, BookOpen } from 'lucide-react'
import { useTopicRow, useSubtopicsFromStructure } from '../hooks/useStructure'
import { useTopicIntro } from '../hooks/useTopicIntro'
import { supabase } from '../lib/supabase'
import { buildFullSystemPrompt } from '../lib/professorKlass'
import SourcesPanel, { type Sources } from '../components/content/SourcesPanel'
import type { CSStructureRow } from '../hooks/useStructure'

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages'

function useSubjectRow(subjectId: string | null) {
  const [subject, setSubject] = useState<CSStructureRow | null>(null)
  useEffect(() => {
    if (!subjectId) return
    supabase.from('cs_structure').select('*').eq('id', subjectId).single()
      .then(({ data }) => { if (data) setSubject(data) })
  }, [subjectId])
  return { subject }
}

async function generateTopicIntro(params: {
  topicName: string
  subjectName: string
  objectives: string[]
  subtopicNames: string[]
  sources: Sources
}): Promise<{ overview: string; why_it_matters: string; prerequisites: string }> {
  const { topicName, subjectName, objectives, subtopicNames, sources } = params

  const sourceParts: string[] = []
  if (sources.transcript.trim()) sourceParts.push(`=== YOUTUBE TRANSCRIPT ===\n${sources.transcript}`)
  if (sources.textbook.trim()) sourceParts.push(`=== TEXTBOOK EXTRACT ===\n${sources.textbook}`)
  if (sources.extra.trim()) sourceParts.push(`=== ADDITIONAL NOTES ===\n${sources.extra}`)
  const sourceBlock = sourceParts.length > 0
    ? `\n\nSOURCE MATERIALS:\n${sourceParts.join('\n\n')}`
    : ''

  const response = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': import.meta.env.VITE_ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: buildFullSystemPrompt(subjectName),
      messages: [{
        role: 'user',
        content: `Write a course introduction for the following topic.

Subject: ${subjectName}
Topic: ${topicName}
Learning Objectives: ${objectives.length > 0 ? objectives.join('; ') : 'Not specified'}
Chapters in this course: ${subtopicNames.join(', ')}${sourceBlock}

Return ONLY valid JSON with exactly these three fields:

{
  "overview": "2-3 sentences. What is this topic about and what will the student be able to do by the end? Start with something that makes the student want to learn this. Make it feel relevant, not textbook.",
  "why_it_matters": "1-2 sentences. Why does this topic matter in the real world or in exams? Give a concrete hook — something a Nigerian student can relate to.",
  "prerequisites": "1-2 sentences. What should the student already know before starting? Be specific — name actual concepts, not just 'basic maths'."
}

Be concise. Every word should earn its place. Write as Professor KLASS would — warm, direct, expert.`
      }],
    }),
  })

  if (!response.ok) throw new Error(`API error: ${response.status}`)
  const data = await response.json()
  const text: string = data.content[0].text
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) return JSON.parse(match[0])
    throw new Error('Failed to parse response')
  }
}

// ── Topic Intro Editor ────────────────────────────────────────────────────────

interface IntroEditorProps {
  topicName: string
  subjectName: string
  objectives: string[]
  subtopicNames: string[]
  topicId: string
  subjectId: string
}

function TopicIntroEditor({ topicName, subjectName, objectives, subtopicNames, topicId, subjectId }: IntroEditorProps) {
  const { intro, saving, save } = useTopicIntro(topicId, subjectId)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState('')
  const [localOverview, setLocalOverview] = useState('')
  const [localWhy, setLocalWhy] = useState('')
  const [localPre, setLocalPre] = useState('')
  const [sources, setSources] = useState<Sources>({ transcript: '', textbook: '', extra: '' })
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (intro) {
      setLocalOverview(intro.overview)
      setLocalWhy(intro.why_it_matters)
      setLocalPre(intro.prerequisites)
      setSources({
        transcript: intro.source_transcript ?? '',
        textbook: intro.source_textbook ?? '',
        extra: intro.source_extra ?? '',
      })
    }
  }, [intro])

  const handleChange = (field: 'overview' | 'why' | 'pre', value: string) => {
    if (field === 'overview') setLocalOverview(value)
    if (field === 'why') setLocalWhy(value)
    if (field === 'pre') setLocalPre(value)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      save({
        overview: field === 'overview' ? value : localOverview,
        why_it_matters: field === 'why' ? value : localWhy,
        prerequisites: field === 'pre' ? value : localPre,
        source_transcript: sources.transcript,
        source_textbook: sources.textbook,
        source_extra: sources.extra,
      })
    }, 1200)
  }

  const handleGenerate = async () => {
    setError('')
    setGenerating(true)
    try {
      const result = await generateTopicIntro({ topicName, subjectName, objectives, subtopicNames, sources })
      setLocalOverview(result.overview)
      setLocalWhy(result.why_it_matters)
      setLocalPre(result.prerequisites)
      await save({
        overview: result.overview,
        why_it_matters: result.why_it_matters,
        prerequisites: result.prerequisites,
        source_transcript: sources.transcript,
        source_textbook: sources.textbook,
        source_extra: sources.extra,
      })
    } catch (err: any) {
      setError(err.message)
    }
    setGenerating(false)
  }

  const hasContent = localOverview || localWhy || localPre

  return (
    <div className="border border-gray-200 rounded bg-white overflow-hidden mb-8">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-stone-50">
        <div className="flex items-center gap-2">
          <BookOpen size={12} className="text-gray-400" />
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Course Introduction</span>
          {saving && <Loader2 size={10} className="animate-spin text-gray-300" />}
          {!saving && hasContent && <Check size={10} className="text-gray-300" />}
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded transition-colors border ${
            generating
              ? 'opacity-50 border-gray-200 text-gray-400'
              : hasContent
              ? 'border-gray-300 text-gray-500 hover:border-gray-400'
              : 'border-gray-900 bg-gray-900 text-white hover:bg-gray-700'
          }`}
        >
          {generating
            ? <><Loader2 size={11} className="animate-spin" />Generating…</>
            : <><Sparkles size={11} />{hasContent ? 'Regenerate' : 'AI Generate'}</>
          }
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 text-xs text-red-500 bg-red-50 border-b border-red-100">{error}</div>
      )}

      <div className="p-4 border-b border-gray-100">
        <SourcesPanel
          sources={sources}
          onChange={s => {
            setSources(s)
            save({
              overview: localOverview,
              why_it_matters: localWhy,
              prerequisites: localPre,
              source_transcript: s.transcript,
              source_textbook: s.textbook,
              source_extra: s.extra,
            })
          }}
        />
      </div>

      <div className="divide-y divide-gray-100">
        {[
          {
            field: 'overview' as const,
            label: 'Overview',
            value: localOverview,
            placeholder: 'What is this topic about? What will the student be able to do by the end? Make it feel relevant and worth learning.',
            rows: 3,
          },
          {
            field: 'why' as const,
            label: 'Why it matters',
            value: localWhy,
            placeholder: 'Why does this topic matter in real life or in exams? Give a concrete hook.',
            rows: 2,
          },
          {
            field: 'pre' as const,
            label: 'Prerequisites',
            value: localPre,
            placeholder: 'What should the student already know before starting? Be specific — name actual concepts.',
            rows: 2,
          },
        ].map(({ field, label, value, placeholder, rows }) => (
          <div key={field} className="px-4 py-3">
            <p className="text-xs font-medium text-gray-500 mb-1.5">{label}</p>
            <textarea
              value={value}
              onChange={e => handleChange(field, e.target.value)}
              placeholder={placeholder}
              rows={rows}
              className="w-full text-sm text-gray-800 placeholder-gray-300 outline-none resize-none leading-relaxed bg-transparent"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Main TopicDetail page ─────────────────────────────────────────────────────

export default function TopicDetail() {
  const { projectId, topicId } = useParams<{ projectId: string; topicId: string }>()
  const navigate = useNavigate()
  const { topic } = useTopicRow(topicId!)
  const { subtopics, loading } = useSubtopicsFromStructure(topicId!)
  const { subject } = useSubjectRow(topic?.subject_id ?? null)

  const subtopicNames = subtopics.map(s => s.name)

  return (
    <div className="min-h-screen bg-stone-50">

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate(`/project/${projectId}`)} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">KLASS Studio</span>
        {subject && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <button onClick={() => navigate(`/project/${projectId}`)} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
              {subject.name}
            </button>
          </>
        )}
        {topic && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-sm text-gray-700 font-medium truncate max-w-[200px]">{topic.name}</span>
          </>
        )}
      </header>

      <div className="max-w-2xl mx-auto py-12 px-6">

        {/* Topic header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs text-gray-400 uppercase tracking-widest font-medium">{subject?.name}</span>
          </div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-3">{topic?.name ?? '…'}</h2>
          {topic?.objectives && topic.objectives.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topic.objectives.map((obj, i) => (
                <span key={i} className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{obj}</span>
              ))}
            </div>
          )}
        </div>

        {/* Course intro editor */}
        {topic && subject && !loading && (
          <TopicIntroEditor
            topicName={topic.name}
            subjectName={subject.name}
            objectives={topic.objectives ?? []}
            subtopicNames={subtopicNames}
            topicId={topicId!}
            subjectId={topic.subject_id!}
          />
        )}

        {/* Chapters */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            Chapters · {subtopics.length}
          </span>
        </div>

        {loading && (
          <div className="border border-gray-200 rounded bg-white divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="px-5 py-4 flex items-center gap-4">
                <div className="w-4 h-2.5 bg-gray-100 rounded animate-pulse" />
                <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!loading && subtopics.length === 0 && (
          <div className="bg-white border border-gray-200 rounded p-10 text-center">
            <p className="text-sm text-gray-500">No chapters found.</p>
            <p className="text-xs text-gray-400 mt-1">Re-import curriculum if subtopics are missing.</p>
          </div>
        )}

        {!loading && subtopics.length > 0 && (
          <div className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded bg-white overflow-hidden">
            {subtopics.map((sub, index) => (
              <button
                key={sub.id}
                onClick={() => navigate(`/project/${projectId}/topic/${topicId}/subtopic/${sub.id}/content`)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors text-left group"
              >
                <span className="text-xs text-gray-300 w-6 shrink-0 tabular-nums font-mono">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{sub.name}</p>
                </div>
                <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
              </button>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
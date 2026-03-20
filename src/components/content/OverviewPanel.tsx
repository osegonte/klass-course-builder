import { useState } from 'react'
import { Plus, X, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react'
import PrerequisiteTags from './PrerequisiteTags'
import { buildChatGPTPrompt } from '../../lib/chatgptPrompt'

export interface OverviewData {
  overview:   string
  objectives: string[]
}

interface Props {
  data:         OverviewData
  onSave:       (data: OverviewData) => Promise<void>
  topicId:      string
  topicName:    string
  subjectName?: string
  context?:     'topic' | 'subtopic'
}

export default function OverviewPanel({ data, onSave, topicId, topicName, subjectName, context = 'topic' }: Props) {
  const [open,       setOpen]       = useState(true)
  const [overview,   setOverview]   = useState(data.overview)
  const [objectives, setObjectives] = useState<string[]>(
    data.objectives.length > 0 ? data.objectives : ['']
  )
  const [saving,   setSaving]   = useState(false)
  const [copied,   setCopied]   = useState(false)

  const isTopic = context === 'topic'

  const handleSave = async () => {
    setSaving(true)
    await onSave({ overview, objectives: objectives.filter(o => o.trim() !== '') })
    setSaving(false)
  }

  const handleCopyPrompt = async () => {
    const prompt = buildChatGPTPrompt({
      level:       context,
      name:        topicName,
      topicName,
      subjectName,
      overview,
      objectives:  objectives.filter(o => o.trim()),
    })
    await navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const addObjective    = () => setObjectives(prev => [...prev, ''])
  const updateObjective = (i: number, val: string) =>
    setObjectives(prev => prev.map((o, idx) => idx === i ? val : o))
  const removeObjective = (i: number) =>
    setObjectives(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div className="border border-gray-200 rounded bg-white overflow-hidden mb-6">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-stone-50 border-b border-gray-100">
        <div>
          <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-widest">
            {isTopic ? 'Course Overview' : 'Subtopic Overview'}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">Shown to students before the content begins.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyPrompt}
            title="Copy a tailored ChatGPT prompt to generate course notes"
            className="flex items-center gap-1.5 text-xs border border-gray-200 text-gray-600 px-2.5 py-1 rounded hover:border-gray-900 hover:text-gray-900 transition-colors"
          >
            {copied ? <Check size={11} className="text-green-600" /> : <Copy size={11} />}
            {copied ? 'Copied!' : 'Get ChatGPT Prompt'}
          </button>
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="p-4 flex flex-col gap-5">

          {/* Overview */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-600">
              {isTopic ? 'What is this course about?' : 'What does this subtopic cover?'}
            </label>
            <textarea
              rows={3}
              className="w-full text-sm text-gray-900 placeholder-gray-300 border border-gray-200 rounded p-2.5 outline-none focus:border-gray-500 transition-colors resize-none bg-white"
              placeholder={isTopic
                ? 'A brief description of the course — what students will study and why it matters.'
                : 'A focused description of this subtopic.'
              }
              value={overview}
              onChange={e => setOverview(e.target.value)}
              onBlur={handleSave}
            />
          </div>

          {/* Objectives */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-600">
              Learning Objectives
              <span className="text-gray-400 font-normal ml-1">— By the end of this, students should be able to…</span>
            </label>
            <div className="flex flex-col gap-1.5">
              {objectives.map((obj, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 shrink-0 w-4">{i + 1}.</span>
                  <input
                    type="text"
                    className="flex-1 text-sm text-gray-900 placeholder-gray-300 border border-gray-200 rounded p-2 outline-none focus:border-gray-500 transition-colors bg-white"
                    placeholder="e.g. Identify the main organelles of a cell"
                    value={obj}
                    onChange={e => updateObjective(i, e.target.value)}
                    onBlur={handleSave}
                  />
                  {objectives.length > 1 && (
                    <button
                      type="button"
                      onClick={() => { removeObjective(i); handleSave() }}
                      className="text-gray-300 hover:text-red-400 transition-colors shrink-0"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={addObjective}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition-colors self-start mt-1"
            >
              <Plus size={12} /> Add objective
            </button>
          </div>

          {/* Tooltip explaining the ChatGPT workflow */}
          {!overview.trim() && (
            <div className="bg-blue-50 border border-blue-100 rounded p-3">
              <p className="text-xs text-blue-700 font-medium mb-1">How to build this course quickly</p>
              <p className="text-xs text-blue-600">
                1. Fill in the overview and objectives above.<br />
                2. Click "Get ChatGPT Prompt" — it generates a tailored prompt.<br />
                3. Paste it into ChatGPT Pro and get structured course notes.<br />
                4. Paste those notes into the Generate tool and Claude builds the blocks.
              </p>
            </div>
          )}

          {/* Prerequisites */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-gray-600">
              Prerequisites
              <span className="text-gray-400 font-normal ml-1">— Students should complete these courses first</span>
            </label>
            <PrerequisiteTags topicId={topicId} />
          </div>

          {saving && <p className="text-xs text-gray-400">Saving…</p>}
        </div>
      )}
    </div>
  )
}
import { useState } from 'react'
import { Youtube, BookOpen, FileText, ChevronDown, ChevronUp, X } from 'lucide-react'

export interface Sources {
  transcript: string
  textbook: string
  extra: string
}

interface Props {
  sources: Sources
  onChange: (sources: Sources) => void
}

type Tab = 'transcript' | 'textbook' | 'extra'

const tabs: { id: Tab; icon: any; label: string; placeholder: string }[] = [
  {
    id: 'transcript',
    icon: Youtube,
    label: 'YouTube Transcript',
    placeholder: `Paste a raw YouTube transcript here.\n\nTip: Open the video on YouTube → click the three dots below the video → "Show transcript" → copy all the text and paste it here.\n\nDon't worry about cleaning it up — that happens automatically in the next step.`,
  },
  {
    id: 'textbook',
    icon: BookOpen,
    label: 'Textbook Pages',
    placeholder: `Paste the relevant textbook text here.\n\nYou can copy directly from a PDF, or type out the key sections. Focus on the pages that cover this specific subtopic.`,
  },
  {
    id: 'extra',
    icon: FileText,
    label: 'Additional Notes',
    placeholder: `Any other context you want the AI to use — your own notes, worked examples, teacher's guide excerpts, past paper questions, etc.`,
  },
]

export default function SourcesPanel({ sources, onChange }: Props) {
  const [open, setOpen] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('transcript')

  const activeTabData = tabs.find(t => t.id === activeTab)!
  const filledCount = [sources.transcript, sources.textbook, sources.extra].filter(s => s.trim().length > 0).length

  const handleChange = (value: string) => {
    onChange({ ...sources, [activeTab]: value })
  }

  const clearTab = () => onChange({ ...sources, [activeTab]: '' })

  return (
    <div className="border border-gray-200 rounded bg-white overflow-hidden">

      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-widest text-gray-500">Sources</span>
          {filledCount > 0 && (
            <span className="text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded">
              {filledCount} added
            </span>
          )}
        </div>
        {open ? <ChevronUp size={13} className="text-gray-400" /> : <ChevronDown size={13} className="text-gray-400" />}
      </button>

      {open && (
        <div className="border-t border-gray-100">

          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            {tabs.map(tab => {
              const filled = sources[tab.id].trim().length > 0
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                    activeTab === tab.id
                      ? 'border-gray-900 text-gray-900'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  <tab.icon size={11} />
                  {tab.label}
                  {filled && (
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Text area */}
          <div className="relative">
            <textarea
              value={sources[activeTab]}
              onChange={e => handleChange(e.target.value)}
              placeholder={activeTabData.placeholder}
              className="w-full min-h-[180px] p-4 text-sm text-gray-800 placeholder-gray-300 outline-none resize-none font-mono leading-relaxed bg-white"
            />
            {sources[activeTab].trim().length > 0 && (
              <button
                onClick={clearTab}
                className="absolute top-3 right-3 text-gray-300 hover:text-gray-500 transition-colors"
                title="Clear"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Word count */}
          {sources[activeTab].trim().length > 0 && (
            <div className="px-4 py-2 border-t border-gray-100 text-right">
              <span className="text-xs text-gray-300">
                {sources[activeTab].trim().split(/\s+/).length.toLocaleString()} words
              </span>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
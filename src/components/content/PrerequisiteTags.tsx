import { useState, useEffect, useRef } from 'react'
import { X, Search, ChevronRight } from 'lucide-react'
import { usePrerequisites, searchTopics } from '../../hooks/usePrerequisites'

interface Props {
  topicId: string
}

interface TopicResult {
  id: string
  name: string
  subjectName: string
}

export default function PrerequisiteTags({ topicId }: Props) {
  const { prereqs, loading, addPrerequisite, removePrerequisite } = usePrerequisites(topicId)

  const [query,    setQuery]    = useState('')
  const [results,  setResults]  = useState<TopicResult[]>([])
  const [searching,setSearching]= useState(false)
  const [showDrop, setShowDrop] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShowDrop(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Search as you type
  useEffect(() => {
    if (!query.trim()) { setResults([]); setShowDrop(false); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const res = await searchTopics(query, topicId)
      setResults(res)
      setShowDrop(true)
      setSearching(false)
    }, 250)
    return () => clearTimeout(timer)
  }, [query, topicId])

  const handleSelect = async (topic: TopicResult) => {
    await addPrerequisite(topic.id)
    setQuery('')
    setResults([])
    setShowDrop(false)
  }

  return (
    <div className="flex flex-col gap-2">

      {/* Existing tags */}
      {!loading && prereqs.length === 0 && (
        <p className="text-xs text-gray-400 italic">
          No prerequisites needed — this course is self-contained.
        </p>
      )}

      {!loading && prereqs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {prereqs.map(p => (
            <div
              key={p.id}
              className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-full px-3 py-1 text-xs text-gray-700 group"
            >
              <span className="text-gray-400 text-xs">{p.requiresSubjectName}</span>
              <ChevronRight size={10} className="text-gray-300" />
              <span className="font-medium">{p.requiresTopicName}</span>
              <button
                type="button"
                onClick={() => removePrerequisite(p.id)}
                className="text-gray-300 hover:text-red-400 transition-colors ml-0.5 opacity-0 group-hover:opacity-100"
              >
                <X size={11} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative" ref={ref}>
        <div className="flex items-center gap-2 border border-gray-200 rounded px-3 py-2 bg-white focus-within:border-gray-500 transition-colors">
          <Search size={12} className="text-gray-400 shrink-0" />
          <input
            type="text"
            className="flex-1 text-sm text-gray-900 placeholder-gray-300 outline-none bg-transparent"
            placeholder="Search for a topic to add as prerequisite…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => results.length > 0 && setShowDrop(true)}
          />
          {searching && <span className="text-xs text-gray-400">Searching…</span>}
        </div>

        {/* Dropdown */}
        {showDrop && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 overflow-hidden">
            {results.map(topic => (
              <button
                key={topic.id}
                type="button"
                onClick={() => handleSelect(topic)}
                className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-stone-50 transition-colors border-b border-gray-100 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{topic.name}</p>
                  <p className="text-xs text-gray-400">{topic.subjectName}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {showDrop && query.trim() && results.length === 0 && !searching && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded shadow-lg z-20 px-3 py-3">
            <p className="text-xs text-gray-400">No topics found for "{query}"</p>
          </div>
        )}
      </div>
    </div>
  )
}
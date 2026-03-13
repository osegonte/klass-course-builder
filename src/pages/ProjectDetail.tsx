import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { useTopicsFromStructure } from '../hooks/useStructure'
import { supabase } from '../lib/supabase'
import type { CSStructureRow } from '../hooks/useStructure'

function useSubjectRow(subjectId: string) {
  const [subject, setSubject] = useState<CSStructureRow | null>(null)
  useEffect(() => {
    if (!subjectId) return
    supabase.from('cs_structure').select('*').eq('id', subjectId).single()
      .then(({ data }) => { if (data) setSubject(data) })
  }, [subjectId])
  return { subject }
}

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>()
  const navigate = useNavigate()
  const { subject } = useSubjectRow(projectId!)
  const { topics, loading } = useTopicsFromStructure(projectId!)

  return (
    <div className="min-h-screen bg-stone-50">

      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="text-gray-400 hover:text-gray-700 transition-colors">
          <ArrowLeft size={16} />
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">KLASS Studio</span>
        {subject && (
          <>
            <div className="w-px h-4 bg-gray-200" />
            <span className="text-sm text-gray-700 font-medium">{subject.name}</span>
          </>
        )}
      </header>

      <div className="max-w-2xl mx-auto py-12 px-6">

        <div className="mb-8 pb-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">{subject?.name ?? '...'}</h2>
          <p className="text-sm text-gray-500 mt-1">Select a topic to view its subtopics.</p>
        </div>

        {loading && (
          <div className="border border-gray-200 rounded bg-white divide-y divide-gray-100">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="px-5 py-4">
                <div className="h-3 w-48 bg-gray-100 rounded animate-pulse mb-1.5" />
                <div className="h-2.5 w-32 bg-gray-100 rounded animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {!loading && topics.length === 0 && (
          <div className="bg-white border border-gray-200 rounded p-10 text-center">
            <p className="text-sm text-gray-500">No topics found for this subject.</p>
            <p className="text-xs text-gray-400 mt-1">Re-sync from Jamsulator if topics are missing.</p>
          </div>
        )}

        {!loading && topics.length > 0 && (
          <div className="flex flex-col divide-y divide-gray-100 border border-gray-200 rounded bg-white overflow-hidden">
            {topics.map((topic, index) => (
              <button
                key={topic.id}
                onClick={() => navigate(`/project/${projectId}/topic/${topic.id}`)}
                className="flex items-center gap-4 px-5 py-4 hover:bg-stone-50 transition-colors text-left group"
              >
                <span className="text-xs text-gray-300 w-5 shrink-0 tabular-nums">{index + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{topic.name}</p>
                  {topic.objectives && topic.objectives.length > 0 && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {topic.objectives.slice(0, 2).join(' · ')}
                      {topic.objectives.length > 2 && ` +${topic.objectives.length - 2}`}
                    </p>
                  )}
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
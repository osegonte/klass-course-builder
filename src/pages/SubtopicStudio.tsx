import { useState, useEffect } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
import { BookOpen, HelpCircle, Layers, CheckSquare, ArrowLeft } from 'lucide-react'
import { useTopicRow, useSubtopicRow } from '../hooks/useStructure'
import { supabase } from '../lib/supabase'
import ContentBuilder from '../components/content/ContentBuilder'
import QuestionBuilder from '../components/questions/QuestionBuilder'
import FlashcardBuilder from '../components/flashcards/FlashcardBuilder'
import ReviewPublish from '../components/review/ReviewPublish'

const tools = [
  { icon: BookOpen, label: 'Content', path: 'content' },
  { icon: HelpCircle, label: 'Questions', path: 'questions' },
  { icon: Layers, label: 'Flashcards', path: 'flashcards' },
  { icon: CheckSquare, label: 'Review', path: 'review' },
]

export default function SubtopicStudio() {
  const navigate = useNavigate()
  const location = useLocation()
  const { projectId, topicId, subtopicId } = useParams<{
    projectId: string
    topicId: string
    subtopicId: string
  }>()

  const { topic } = useTopicRow(topicId!)
  const { subtopic } = useSubtopicRow(subtopicId!)

  // subjectId = projectId (cs_structure.id where type='subject')
  const subjectId = projectId!

  const [subjectName, setSubjectName] = useState<string | undefined>(undefined)
  useEffect(() => {
    if (!subjectId) return
    supabase.from('cs_structure').select('name').eq('id', subjectId).single()
      .then(({ data }) => { if (data) setSubjectName(data.name) })
  }, [subjectId])
  const base = `/project/${projectId}/topic/${topicId}/subtopic/${subtopicId}`
  const goTo = (path: string) => navigate(`${base}/${path}`)

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 shrink-0">
        <button
          onClick={() => navigate(`/project/${projectId}/topic/${topicId}`)}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">KLASS</span>
        {topic && (
          <>
            <span className="text-gray-300">/</span>
            <button
              onClick={() => navigate(`/project/${projectId}/topic/${topicId}`)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors truncate max-w-[120px]"
            >
              {topic.name}
            </button>
          </>
        )}
        {subtopic && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
              {subtopic.name}
            </span>
          </>
        )}
        <div className="ml-auto text-xs text-gray-300">autosaved</div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* Icon sidebar */}
        <aside className="w-11 bg-white border-r border-gray-200 flex flex-col items-center py-4 gap-1 shrink-0">
          {tools.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname.includes(`/${path}`)
            return (
              <button
                key={path}
                onClick={() => goTo(path)}
                title={label}
                className={`w-8 h-8 rounded flex items-center justify-center transition-colors group relative
                  ${isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-400 hover:bg-gray-100 hover:text-gray-700'
                  }`}
              >
                <Icon size={15} />
                <span className="absolute left-10 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {label}
                </span>
              </button>
            )
          })}
        </aside>

        <main className="flex-1 overflow-y-auto bg-stone-50">
          <Routes>
            <Route path="content"   element={<ContentBuilder   subtopicId={subtopicId!} subjectId={subjectId} topicId={topicId} subjectName={subjectName} />} />
            <Route path="questions" element={<QuestionBuilder  subtopicId={subtopicId!} subjectId={subjectId} />} />
            <Route path="flashcards" element={<FlashcardBuilder subtopicId={subtopicId!} subjectId={subjectId} />} />
            <Route path="review"    element={<ReviewPublish    subtopicId={subtopicId!} subjectId={subjectId} />} />
            <Route index element={<Navigate to="content" replace />} />
          </Routes>
        </main>

      </div>
    </div>
  )
}
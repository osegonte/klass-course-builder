import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom'
import { BookOpen, HelpCircle, Layers, CheckSquare, ArrowLeft, AlignLeft } from 'lucide-react'
import { useTopicRow, useSubtopicRow, useSubject } from '../hooks/useStructure'
import ContentBuilder from '../components/content/ContentBuilder'
import QuestionBuilder from '../components/questions/QuestionBuilder'
import FlashcardBuilder from '../components/flashcards/FlashcardBuilder'
import PlacementBuilder from '../components/placement/PlacementBuilder'
import ReviewPublish from '../components/review/ReviewPublish'

const tools = [
  { icon: BookOpen,    label: 'Content',    path: 'content' },
  { icon: HelpCircle,  label: 'Questions',  path: 'questions' },
  { icon: Layers,      label: 'Flashcards', path: 'flashcards' },
  { icon: AlignLeft,   label: 'Placements', path: 'placements' },
  { icon: CheckSquare, label: 'Review',     path: 'review' },
]

export default function SubtopicStudio() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { subjectId, topicId, subtopicId } = useParams<{
    subjectId: string
    topicId:   string
    subtopicId: string
  }>()

  const { subject } = useSubject(subjectId!)
  const { topic }   = useTopicRow(topicId!)
  const { subtopic } = useSubtopicRow(subtopicId!)

  const base      = `/subject/${subjectId}/topic/${topicId}/subtopic/${subtopicId}`
  const goTo      = (path: string) => navigate(`${base}/${path}`)
  const activeTab = location.pathname.split('/').pop()

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3 shrink-0">
        <button
          type="button"
          onClick={() => navigate(`/subject/${subjectId}/topic/${topicId}`)}
          className="text-gray-400 hover:text-gray-700 transition-colors"
        >
          <ArrowLeft size={15} />
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">KLASS</span>
        {subject && (
          <>
            <span className="text-gray-300">/</span>
            <button
              type="button"
              onClick={() => navigate(`/subject/${subjectId}`)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors truncate max-w-[80px]"
            >
              {subject.name}
            </button>
          </>
        )}
        {topic && (
          <>
            <span className="text-gray-300">/</span>
            <button
              type="button"
              onClick={() => navigate(`/subject/${subjectId}/topic/${topicId}`)}
              className="text-xs text-gray-400 hover:text-gray-600 transition-colors truncate max-w-[110px]"
            >
              {topic.name}
            </button>
          </>
        )}
        {subtopic && (
          <>
            <span className="text-gray-300">/</span>
            <span className="text-xs font-medium text-gray-700 truncate max-w-[130px]">{subtopic.name}</span>
          </>
        )}
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-1 shrink-0">
        {tools.map(({ icon: Icon, label, path }) => {
          const active = activeTab === path
          return (
            <button
              key={path}
              type="button"
              onClick={() => goTo(path)}
              className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium transition-colors border-b-2 -mb-px ${
                active
                  ? 'text-gray-900 border-gray-900'
                  : 'text-gray-400 border-transparent hover:text-gray-700'
              }`}
            >
              <Icon size={13} />
              {label}
            </button>
          )
        })}
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="content"    element={<ContentBuilder   subtopicId={subtopicId!} subjectId={subjectId!} topicId={topicId} subjectName={subject?.name} />} />
          <Route path="questions"  element={<QuestionBuilder  subtopicId={subtopicId!} />} />
          <Route path="flashcards" element={<FlashcardBuilder subtopicId={subtopicId!} />} />
          <Route path="placements" element={<PlacementBuilder subtopicId={subtopicId!} />} />
          <Route path="review"     element={<ReviewPublish    subtopicId={subtopicId!} topicId={topicId!} subjectId={subjectId!} />} />
          <Route path="*"          element={<Navigate to="content" replace />} />
        </Routes>
      </div>
    </div>
  )
}
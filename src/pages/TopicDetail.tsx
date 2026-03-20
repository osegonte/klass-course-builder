import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, ChevronRight, BookOpen, Layers, User, Lock, CheckCircle } from 'lucide-react'
import { useSubject, useTopicRow, useSubtopics } from '../hooks/useStructure'
import { useAuth } from '../hooks/useAuth'
import { useTopicContentBlocks } from '../hooks/useContentBlocks'
import { useTopicQuestions as useQuestions } from '../hooks/useQuestions'
import { useTopicFlashcards as useFlashcards } from '../hooks/useFlashcards'
import { useTopicIntro } from '../hooks/useTopicIntro'
import { useTopicAssignments, claimSubtopic, completeSubtopic } from '../hooks/useAssignments'
import ContentBlockCard from '../components/content/ContentBlockCard'
import BlockTypeSelector from '../components/content/BlockTypeSelector'
import InlineQuestionPicker from '../components/content/InlineQuestionPicker'
import InlineFlashcardPicker from '../components/content/InlineFlashcardPicker'
import OverviewPanel from '../components/content/OverviewPanel'
import GenerateCourse from '../components/content/GenerateCourse'
import type { ContentBlock, BlockType, QuestionType, Question } from '../types/content'
import { Sparkles } from 'lucide-react'



type Tab = 'intro' | 'subtopics'

export default function TopicDetail() {
  const navigate = useNavigate()
  const { subjectId, topicId } = useParams<{ subjectId: string; topicId: string }>()

  const { user } = useAuth()
  const CURRENT_TEACHER_ID   = user?.id ?? ''
  const CURRENT_TEACHER_NAME = user?.user_metadata?.display_name ?? user?.email ?? 'Teacher'

  const { subject }                                                = useSubject(subjectId!)
  const { topic }                                                  = useTopicRow(topicId!)
  const { subtopics, loading: subtopicsLoading, createSubtopic }  = useSubtopics(topicId!)
  const { assignments, refetch: refetchAssignments }              = useTopicAssignments(topicId!)
  const { intro, save: saveIntro }                                = useTopicIntro(topicId!)

  const { blocks, loading: blocksLoading, addBlock, updateBlock, deleteBlock } = useTopicContentBlocks(topicId!)
  const { questions, addQuestion }  = useQuestions(topicId!)
  const { flashcards, addFlashcard } = useFlashcards(topicId!)

  // Intro gate: subtopics unlock once at least one content block exists in intro
  const introHasBlocks = blocks.length > 0

  const [tab, setTab]                         = useState<Tab>('intro')
  const [newSubtopicName, setNewSubtopicName] = useState('')
  const [addingSubtopic, setAddingSubtopic]   = useState(false)
  const [showSelector, setShowSelector]       = useState(false)
  const [showQPicker, setShowQPicker]         = useState(false)
  const [showFPicker, setShowFPicker]         = useState(false)
  const [showGenerate, setShowGenerate]       = useState(false)
  const [claimingId, setClaimingId]           = useState<string | null>(null)
  const [feedback, setFeedback]               = useState<{ id: string; msg: string } | null>(null)

  // Save topic overview (uses topic_intros table)
  const handleSaveOverview = async (data: { overview: string; objectives: string[] }) => {
    await saveIntro({
      overview:   data.overview,
      objectives: data.objectives,
    })
  }

  // AI accept handlers
  const handleAcceptBlocks = async (incoming: Omit<ContentBlock, 'id' | 'order'>[]) => {
    for (let i = 0; i < incoming.length; i++) {
      await addBlock({ ...incoming[i], id: crypto.randomUUID(), order: blocks.length + i } as ContentBlock)
    }
  }

  const handleAcceptQuestions = async (incoming: Omit<Question, 'id' | 'order'>[]) => {
    for (let i = 0; i < incoming.length; i++) {
      await addQuestion({ ...incoming[i], id: crypto.randomUUID(), order: questions.length + i } as Question)
    }
  }

  // Block builder
  const handleSelectType = (type: BlockType) => {
    setShowSelector(false)
    if (type === 'question')  { setShowQPicker(true);  return }
    if (type === 'flashcard') { setShowFPicker(true);  return }
    createBlock(type)
  }

  const createBlock = async (type: BlockType, extra?: Partial<ContentBlock>) => {
    await addBlock({
      id: crypto.randomUUID(), type, title: '', body: '',
      order: blocks.length,
      steps: type === 'example' ? [] : undefined,
      ...extra,
    } as ContentBlock)
  }

  const handlePickQuestion = async (questionId: string) => {
    await createBlock('question', { questionId })
    setShowQPicker(false)
  }

  const handleNewQuestion = async (type: QuestionType) => {
    const q = {
      id: crypto.randomUUID(), type, questionText: '',
      options: type === 'mcq' || type === 'multiselect'
        ? [{ id: crypto.randomUUID(), text: '' }, { id: crypto.randomUUID(), text: '' }]
        : [],
      correctAnswer: '', hint: '', status: 'draft' as const,
      isMockQuestion: false, order: questions.length,
    }
    await addQuestion(q)
    await createBlock('question', { questionId: q.id })
    setShowQPicker(false)
  }

  const handlePickFlashcard = async (flashcardId: string) => {
    await createBlock('flashcard', { flashcardId })
    setShowFPicker(false)
  }

  const handleNewFlashcard = async () => {
    const card = { id: crypto.randomUUID(), front: '', back: '', order: flashcards.length }
    await addFlashcard(card)
    await createBlock('flashcard', { flashcardId: card.id })
    setShowFPicker(false)
  }

  // Subtopics
  const handleAddSubtopic = async () => {
    if (!newSubtopicName.trim() || !subjectId) return
    setAddingSubtopic(true)
    await createSubtopic(newSubtopicName.trim(), subjectId)
    setNewSubtopicName('')
    setAddingSubtopic(false)
  }

  const handleClaim = async (subtopicId: string) => {
    setClaimingId(subtopicId)
    const sorted = [...subtopics].sort((a, b) => a.subtopicOrder - b.subtopicOrder)
    const result = await claimSubtopic(subtopicId, CURRENT_TEACHER_ID, sorted, assignments)
    if (result.success) {
      await refetchAssignments()
      navigate(`/subject/${subjectId}/topic/${topicId}/subtopic/${subtopicId}/content`)
    } else {
      setFeedback({ id: subtopicId, msg: result.reason ?? 'Could not claim.' })
      setTimeout(() => setFeedback(null), 3000)
    }
    setClaimingId(null)
  }

  const handleComplete = async (subtopicId: string) => {
    await completeSubtopic(subtopicId, CURRENT_TEACHER_ID)
    await refetchAssignments()
  }

  const sorted = [...subtopics].sort((a, b) => a.subtopicOrder - b.subtopicOrder)

  function getState(subtopicId: string, index: number) {
    const a = assignments.find(x => x.subtopicId === subtopicId)
    if (a) {
      if (a.status === 'complete')            return { status: 'complete'     as const, who: a.teacherName }
      if (a.teacherId === CURRENT_TEACHER_ID) return { status: 'mine'         as const, who: CURRENT_TEACHER_NAME }
      return                                         { status: 'locked_other' as const, who: a.teacherName }
    }
    if (index === 0) return { status: 'open' as const }
    const prev  = sorted[index - 1]
    const prevA = assignments.find(x => x.subtopicId === prev.id)
    if (!prevA || prevA.status !== 'complete') return { status: 'blocked' as const }
    return { status: 'open' as const }
  }

  return (
    <div className="min-h-screen bg-stone-50">

      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-3">
        <button type="button" onClick={() => navigate(`/subject/${subjectId}`)} className="text-gray-400 hover:text-gray-700">
          <ArrowLeft size={15} />
        </button>
        <div className="w-px h-4 bg-gray-200" />
        <span className="text-xs font-semibold tracking-widest uppercase text-gray-400">KLASS</span>
        {subject && (<>
          <span className="text-gray-300">/</span>
          <button type="button" onClick={() => navigate(`/subject/${subjectId}`)} className="text-xs text-gray-400 hover:text-gray-600 truncate max-w-[100px]">
            {subject.name}
          </button>
        </>)}
        {topic && (<>
          <span className="text-gray-300">/</span>
          <span className="text-xs font-medium text-gray-700 truncate max-w-[160px]">{topic.name}</span>
        </>)}
      </header>

      {/* Tab bar */}
      <div className="bg-white border-b border-gray-200 px-6 flex gap-1">
        {([
          { id: 'intro',     icon: BookOpen, label: 'Course Intro' },
          { id: 'subtopics', icon: Layers,   label: introHasBlocks ? 'Subtopics' : 'Subtopics (locked)'   },
        ] as const).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            disabled={id === 'subtopics' && !introHasBlocks}
            className={`flex items-center gap-1.5 px-3 py-3 text-xs font-medium border-b-2 -mb-px transition-colors ${
              id === 'subtopics' && !introHasBlocks ? 'text-gray-300 border-transparent cursor-not-allowed' :
              tab === id ? 'text-gray-900 border-gray-900' : 'text-gray-400 border-transparent hover:text-gray-700'
            }`}
          >
            <Icon size={13} />
            {label}
          </button>
        ))}
      </div>

      {/* ── INTRO TAB ──────────────────────────────────────────── */}
      {tab === 'intro' && (
        <div className="max-w-2xl mx-auto py-10 px-6">

          {/* Overview panel */}
          <OverviewPanel
            context="topic"
            topicId={topicId!}
            topicName={topic?.name ?? ''}
            subjectName={subject?.name}
            data={{
              overview:   intro?.overview   ?? topic?.description ?? '',
              objectives: [],
            }}
            onSave={handleSaveOverview}
          />

          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Course Content Blocks</h2>
              <p className="text-xs text-gray-500 mt-0.5">Build the full course intro using blocks.</p>
            </div>
            <button
              type="button"
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:border-gray-900 hover:text-gray-900 transition-colors"
            >
              <Sparkles size={12} />
              Generate with AI
            </button>
          </div>

          {!blocksLoading && blocks.length === 0 && (
            <div className="border border-dashed border-gray-300 rounded p-12 text-center mb-4">
              <p className="text-sm text-gray-500 mb-1">No intro blocks yet.</p>
              <p className="text-xs text-gray-400 mb-6">Build manually or let Professor KLASS generate the course introduction.</p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowSelector(true)}
                  className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-4 py-2 rounded hover:bg-gray-700 transition-colors"
                >
                  <Plus size={13} /> Add Block
                </button>
                <button
                  type="button"
                  onClick={() => setShowGenerate(true)}
                  className="flex items-center gap-1.5 text-xs border border-gray-300 text-gray-600 px-4 py-2 rounded hover:border-gray-400 transition-colors"
                >
                  <Sparkles size={12} /> Generate with AI
                </button>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {blocks.map(block => (
              <ContentBlockCard
                key={block.id}
                block={block}
                question={block.questionId   ? questions.find(q => q.id === block.questionId)   : undefined}
                flashcard={block.flashcardId ? flashcards.find(f => f.id === block.flashcardId) : undefined}
                onChange={updateBlock}
                onDelete={deleteBlock}
              />
            ))}
          </div>

          {blocks.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSelector(true)}
              className="mt-4 w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 hover:border-gray-500 text-gray-400 hover:text-gray-600 text-xs py-3 rounded transition-colors"
            >
              <Plus size={13} /> Add Block
            </button>
          )}
        </div>
      )}

      {/* ── SUBTOPICS TAB ─────────────────────────────────────── */}
      {tab === 'subtopics' && (
        <div className="max-w-2xl mx-auto py-10 px-6">
          {!introHasBlocks && (
            <div className="border border-amber-200 bg-amber-50 rounded p-4 mb-6 flex items-start gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-amber-800">Complete the Course Intro first</p>
                <p className="text-xs text-amber-700 mt-0.5">Add at least one content block to the Course Intro before adding subtopics. The intro is the foundation students see before any deep-dive.</p>
              </div>
            </div>
          )}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div>
              <h2 className="text-base font-semibold text-gray-900">Subtopics</h2>
              <p className="text-xs text-gray-500 mt-0.5">Claim a subtopic to start building. Complete it to unlock the next.</p>
            </div>
          </div>

          {!subtopicsLoading && (
            <div className="flex flex-col gap-2 mb-4">
              {sorted.length === 0 && (
                <div className="border border-dashed border-gray-300 rounded p-10 text-center">
                  <p className="text-sm text-gray-400">No subtopics yet. Add one below.</p>
                </div>
              )}
              {sorted.map((subtopic, index) => {
                const state = getState(subtopic.id, index)
                const fb    = feedback?.id === subtopic.id ? feedback.msg : null
                return (
                  <div
                    key={subtopic.id}
                    className={`bg-white border rounded p-4 flex items-center justify-between gap-3 ${
                      state.status === 'locked_other' || state.status === 'blocked' ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {state.status === 'complete'     && <CheckCircle size={14} className="text-green-500 shrink-0" />}
                      {state.status === 'mine'         && <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />}
                      {state.status === 'locked_other' && <Lock size={14} className="text-gray-400 shrink-0" />}
                      {state.status === 'blocked'      && <Lock size={14} className="text-gray-300 shrink-0" />}
                      {state.status === 'open'         && <div className="w-2 h-2 rounded-full bg-gray-300 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{subtopic.name}</p>
                        {'who' in state && state.who && (
                          <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                            <User size={10} />{state.who}{state.status === 'mine' ? ' (you)' : ''}
                          </p>
                        )}
                        {fb && <p className="text-xs text-red-500 mt-0.5">{fb}</p>}
                        {state.status === 'blocked' && <p className="text-xs text-gray-400 mt-0.5">Complete the previous subtopic first</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {state.status === 'open' && (
                        <button
                          type="button"
                          onClick={() => handleClaim(subtopic.id)}
                          disabled={claimingId === subtopic.id}
                          className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded hover:bg-gray-700 disabled:opacity-40"
                        >
                          {claimingId === subtopic.id ? 'Claiming…' : 'Claim & Build'}
                        </button>
                      )}
                      {state.status === 'mine' && (<>
                        <button
                          type="button"
                          onClick={() => navigate(`/subject/${subjectId}/topic/${topicId}/subtopic/${subtopic.id}/content`)}
                          className="text-xs border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:border-gray-500"
                        >
                          Continue
                        </button>
                        <button
                          type="button"
                          onClick={() => handleComplete(subtopic.id)}
                          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700"
                        >
                          Mark Done
                        </button>
                      </>)}
                      {state.status === 'complete' && (
                        <button
                          type="button"
                          onClick={() => navigate(`/subject/${subjectId}/topic/${topicId}/subtopic/${subtopic.id}/content`)}
                          className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600"
                        >
                          View <ChevronRight size={12} />
                        </button>
                      )}
                      {state.status === 'locked_other' && <span className="text-xs text-gray-400">Locked</span>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex gap-2">
            <input
              className="flex-1 border border-gray-200 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 bg-white"
              placeholder="New subtopic name…"
              value={newSubtopicName}
              onChange={e => setNewSubtopicName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAddSubtopic()}
            />
            <button
              type="button"
              onClick={handleAddSubtopic}
              disabled={!newSubtopicName.trim() || addingSubtopic}
              className="flex items-center gap-1.5 text-xs bg-gray-900 text-white px-3 py-2 rounded hover:bg-gray-700 disabled:opacity-40 shrink-0"
            >
              <Plus size={12} />
              {addingSubtopic ? 'Adding…' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      {showSelector && <BlockTypeSelector onSelect={handleSelectType} onClose={() => setShowSelector(false)} />}
      {showQPicker && (
        <InlineQuestionPicker
          questions={questions}
          onPickExisting={handlePickQuestion}
          onCreateNew={handleNewQuestion}
          onClose={() => setShowQPicker(false)}
        />
      )}
      {showFPicker && (
        <InlineFlashcardPicker
          flashcards={flashcards}
          onPickExisting={handlePickFlashcard}
          onCreateNew={handleNewFlashcard}
          onClose={() => setShowFPicker(false)}
        />
      )}
      {showGenerate && (
        <GenerateCourse
          params={{
            level:        'topic',
            name:         topic?.name    ?? '',
            topicName:    topic?.name    ?? '',
            subjectName:  subject?.name,
            overview:     intro?.overview ?? '',
            objectives:   [],
          }}
          onAcceptBlocks={handleAcceptBlocks}
          onAcceptQuestions={handleAcceptQuestions}
          onClose={() => setShowGenerate(false)}
        />
      )}
    </div>
  )
}
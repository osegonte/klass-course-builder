import { useContentBlocks } from '../../hooks/useContentBlocks'
import { useQuestions } from '../../hooks/useQuestions'
import { usePlacements } from '../../hooks/usePlacements'

interface Props { subtopicId: string }

const BLOCK_LABELS: Record<string, string> = {
  definition:  'Definition',
  explanation: 'Explanation',
  formula:     'Formula',
  example:     'Example',
  keypoint:    'Key Point',
  note:        'Note',
  diagram:     'Diagram',
}

export default function PlacementBuilder({ subtopicId }: Props) {
  const { blocks,     loading: blocksLoading     } = useContentBlocks(subtopicId)
  const { questions,  loading: questionsLoading  } = useQuestions(subtopicId)
  const { placements, loading: placementsLoading, addPlacement, removePlacement } = usePlacements(subtopicId)

  const loading = blocksLoading || questionsLoading || placementsLoading

  if (loading) return (
    <div className="flex items-center justify-center h-48">
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  )

  if (questions.length === 0) return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <EmptyState message="No questions yet. Build questions first, then come back to place them." />
    </div>
  )

  if (blocks.length === 0) return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <EmptyState message="No content blocks yet. Build content first, then come back to place questions." />
    </div>
  )

  return (
    <div className="max-w-2xl mx-auto py-10 px-6">
      <div className="mb-6">
        <h2 className="text-sm font-semibold text-gray-900">Question Placement</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Choose which content block each question appears after in the student flow.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((question, index) => {
          const placement = placements.find(p => p.questionId === question.id)
          const placedBlock = placement?.afterBlockId
            ? blocks.find(b => b.id === placement.afterBlockId)
            : null

          return (
            <div key={question.id} className="bg-white border border-gray-200 rounded p-4 flex flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-400">Q{index + 1}</span>
                    <span className="text-xs text-gray-400 uppercase tracking-wide">{question.type}</span>
                  </div>
                  <p className="text-sm text-gray-800 truncate">{question.questionText || 'Untitled question'}</p>
                </div>

                <select
                  className="border border-gray-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-gray-900 shrink-0"
                  value={placement?.afterBlockId ?? ''}
                  onChange={e => {
                    if (e.target.value === '') removePlacement(question.id)
                    else addPlacement(question.id, e.target.value)
                  }}
                >
                  <option value="">Not placed</option>
                  <option value="__top__">At the very start</option>
                  {blocks
                    .filter(b => !['question', 'flashcard'].includes(b.type))
                    .map(block => (
                      <option key={block.id} value={block.id}>
                        After: {block.title || BLOCK_LABELS[block.type] || block.type}
                      </option>
                    ))
                  }
                </select>
              </div>

              {placement && (
                <p className="text-xs text-gray-400 border-t border-gray-100 pt-2">
                  {placedBlock
                    ? <>Appears after <span className="font-medium text-gray-600">{placedBlock.title || BLOCK_LABELS[placedBlock.type]}</span></>
                    : 'Appears at the very start'
                  }
                </p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-gray-300 rounded p-10 text-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  )
}
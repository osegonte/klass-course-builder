import { useParams } from 'react-router-dom'
import { useContentBlocks } from '../../hooks/useContentBlocks'
import { useQuestions } from '../../hooks/useQuestions'
import { usePlacements } from '../../hooks/usePlacements'

const blockLabels: Record<string, string> = {
  definition: 'Definition',
  explanation: 'Explanation',
  formula: 'Formula',
  example: 'Example',
  keypoint: 'Key Point',
  note: 'Note',
}

const blockColors: Record<string, string> = {
  definition: 'text-purple-300',
  explanation: 'text-purple-400',
  formula: 'text-gray-300',
  example: 'text-gray-300',
  keypoint: 'text-purple-300',
  note: 'text-gray-500',
}

export default function PlacementBuilder() {
  const { topicId } = useParams<{ topicId: string }>()
  const { blocks, loading: blocksLoading } = useContentBlocks(topicId!)
  const { questions, loading: questionsLoading } = useQuestions(topicId!)
  const { placements, loading: placementsLoading, addPlacement, removePlacement } = usePlacements(topicId!)

  const loading = blocksLoading || questionsLoading || placementsLoading

  const getPlacementForQuestion = (questionId: string) => {
    return placements.find(p => p.questionId === questionId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-600 text-sm">Loading...</div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="mb-8">
          <h2 className="text-white text-xl font-semibold">Question Placement</h2>
          <p className="text-gray-500 text-sm mt-1">Pin questions to content blocks to control when students see them.</p>
        </div>
        <div className="border border-dashed border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-600 text-sm">No questions yet. Build your questions first then come back to place them.</p>
        </div>
      </div>
    )
  }

  if (blocks.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-8 px-6">
        <div className="mb-8">
          <h2 className="text-white text-xl font-semibold">Question Placement</h2>
          <p className="text-gray-500 text-sm mt-1">Pin questions to content blocks to control when students see them.</p>
        </div>
        <div className="border border-dashed border-gray-800 rounded-xl p-12 text-center">
          <p className="text-gray-600 text-sm">No content blocks yet. Build your content first then come back to place questions.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-6">

      <div className="mb-8">
        <h2 className="text-white text-xl font-semibold">Question Placement</h2>
        <p className="text-gray-500 text-sm mt-1">
          For each question, choose which content block it appears after.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {questions.map((question, index) => {
          const placement = getPlacementForQuestion(question.id)

          return (
            <div key={question.id} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start gap-4">

                {/* Question info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-gray-600">Q{index + 1}</span>
                    <span className="text-xs text-gray-600 uppercase tracking-wide">{question.type}</span>
                  </div>
                  <p className="text-sm text-gray-300 truncate">
                    {question.questionText || 'Untitled question'}
                  </p>
                </div>

                {/* Block selector */}
                <div className="flex items-center gap-2 shrink-0">
                  <select
                    className="bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700 outline-none focus:border-gray-500"
                    value={placement?.blockId || ''}
                    onChange={e => {
                      if (e.target.value === '') {
                        removePlacement(question.id)
                      } else {
                        addPlacement(question.id, e.target.value)
                      }
                    }}
                  >
                    <option value="">Not placed</option>
                    {blocks.map(block => (
                      <option key={block.id} value={block.id}>
                        After: {block.title || blockLabels[block.type]}
                      </option>
                    ))}
                  </select>

                  {placement && (
                    <span className="text-xs text-purple-400 whitespace-nowrap">Placed</span>
                  )}
                </div>

              </div>

              {/* Show which block it's placed after */}
              {placement && (
                <div className="mt-3 pt-3 border-t border-gray-800">
                  {(() => {
                    const block = blocks.find(b => b.id === placement.blockId)
                    return block ? (
                      <p className="text-xs text-gray-600">
                        Appears after{' '}
                        <span className={`font-medium ${blockColors[block.type]}`}>
                          {block.title || blockLabels[block.type]}
                        </span>
                        {' '}({blockLabels[block.type]})
                      </p>
                    ) : null
                  })()}
                </div>
              )}

            </div>
          )
        })}
      </div>

    </div>
  )
}
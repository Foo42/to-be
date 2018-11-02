import { TodoTree, TreeNode } from '../..'
import { Dict } from '../../../dict'
import { scoreDueDate } from './scoreDueDate'
import { scoreContexts } from './scoreContexts'
import { scaleScore } from './scaleScore'
import { scoreImportance } from './scoreImportance'
import { Todo } from '../../../todo'

export function compositeScore (tagWeights: Dict<number>, contextWeights: Dict<number>) {
  return function inner<PrevSummaryT> (node: TodoTree<PrevSummaryT>) {

    const scoreComponents: Dict<number> = {}
    const compositeImportanceScore = scoreImportance<PrevSummaryT>(tagWeights, node, scoreComponents)
    const compositeUrgencyScore = scoreUrgency<PrevSummaryT>(node, scoreComponents, contextWeights)

    const importanceScoreWeight = 1
    const weightedCompositeImportanceScore = scaleScore(compositeImportanceScore, importanceScoreWeight)

    const urgencyScoreWeight = 1
    const weightedCompositeUrgencyScore = scaleScore(compositeUrgencyScore, urgencyScoreWeight)
    const compositeScore = weightedCompositeImportanceScore * weightedCompositeUrgencyScore

    scoreComponents.compositeImportanceScore = compositeImportanceScore
    scoreComponents.weightedCompositeImportanceScore = weightedCompositeImportanceScore
    scoreComponents.compositeUrgencyScore = compositeUrgencyScore
    scoreComponents.weightedCompositeUrgencyScore = weightedCompositeUrgencyScore
    return { compositeScore, scoreComponents }
  }
}

function scoreUrgency<PrevSummaryT> (node: TreeNode<Todo, PrevSummaryT>, scoreComponentsDebug: Dict<number>, contextWeights: Dict<number>) {
  const baseUrgency = 1

  const dueDateScore = scoreDueDate(node.dueDate)
  scoreComponentsDebug.dueDateScore = dueDateScore
  const dueDateScoreWeight = 1
  const weightedDueDateScore = scaleScore(dueDateScore, dueDateScoreWeight)
  scoreComponentsDebug.weightedDueDateScore = weightedDueDateScore

  const contextSpecificityScore = scoreContexts(node.contexts, contextWeights)
  scoreComponentsDebug.contextSpecificityScore = contextSpecificityScore
  const contextSpecificityScoreWeight = 1
  const weightedContextSpecificityScore = scaleScore(contextSpecificityScore, contextSpecificityScoreWeight)
  scoreComponentsDebug.weightedContextSpecificityScore = weightedContextSpecificityScore

  const compositeUrgencyScore = baseUrgency * weightedDueDateScore * weightedContextSpecificityScore
  return compositeUrgencyScore
}

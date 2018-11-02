import { TreeNode } from '../..'
import { Dict } from '../../../dict'
import { scoreTags } from './scoreTags'
import { scaleScore } from './scaleScore'
import { Todo } from '../../../todo'
export function scoreImportance<PrevSummaryT> (tagWeights: Dict<number>, node: TreeNode<Todo, PrevSummaryT>, scoreComponentsDebug: Dict<number>) {
  const tagScore = scoreTags(tagWeights, node.tags)
  const tagScoreWeight = 1
  const baseImportance = 1
  const weightedTagScore = scaleScore(tagScore, tagScoreWeight)
  scoreComponentsDebug.tagScore = tagScore
  scoreComponentsDebug.weightedTagScore = weightedTagScore
  const compositeImportanceScore = baseImportance * weightedTagScore
  return compositeImportanceScore
}

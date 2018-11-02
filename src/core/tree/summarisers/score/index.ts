import { TodoTree } from '../..'
import { flatMap, assign, max } from 'lodash'
import { Dict } from '../../../dict'
import { Todo } from '../../../todo'
import { compositeScore } from './compositeScore'

export interface ScoreSummary {
  compositeScore: number
  scoreComponents: Dict<number>
}

function getScoreSummary<PrevSummaryT> (node: TodoTree<PrevSummaryT & ScoreSummary>): number {
  return node.summary.compositeScore
}
function setScoreSummary (compositeScore: number, scoreComponents: Dict<number>): ScoreSummary {
  return { compositeScore, scoreComponents }
}
export function summariseScores (tagWeights: Dict<number>, contextWeights: Dict<number>) {
  const scoreNode = compositeScore(tagWeights, contextWeights)
  return function summariser<PrevSummaryT> (todos: TodoTree<PrevSummaryT>): TodoTree<PrevSummaryT & ScoreSummary> {
    const childrenWithSummaries = todos.children
      .map(summariser)

    const maxChildScore = max(childrenWithSummaries.map(getScoreSummary)) || 0
    const { compositeScore: ownScore, scoreComponents } = scoreNode(todos)
    const finalScore = max([ownScore, maxChildScore]) || 0

    const ownSummary: (PrevSummaryT & ScoreSummary) = assign({}, todos.summary, setScoreSummary(finalScore, { ...scoreComponents, ownScore, maxChildScore }))

    return { ...todos, summary: ownSummary, children: childrenWithSummaries }
  }
}

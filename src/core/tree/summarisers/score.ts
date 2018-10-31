import { TodoTree } from '..'
import { flatMap, assign, max } from 'lodash'
import { Dict } from '../../dict'
import { Tag, Todo } from '../../todo'

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
function determineScore (tagWeights: Dict<number>, contextWeights: Dict<number>) {
  const st = scoreTags(tagWeights)
  return function inner<PrevSummaryT> (node: TodoTree<PrevSummaryT>) {
    const tagScore = st(node.tags)

    const tagScoreWeight = 1

    const baseImportance = 1
    const compositeImportanceScore = baseImportance * scaleScore(tagScore, tagScoreWeight)
    const importanceScoreWeight = 1

    const baseUrgency = 1
    const dueDateScore = scoreDueDate(node.dueDate)
    const dueDateScoreWeight = 1
    const contextSpecificityScore = scoreContexts(node.contexts, contextWeights)
    const contextSpecificityScoreWeight = 1
    const compositeUrgencyScore = baseUrgency * scaleScore(dueDateScore, dueDateScoreWeight) * scaleScore(contextSpecificityScore, contextSpecificityScoreWeight)
    const urgencyScoreWeight = 1
    const compositeScore = scaleScore(compositeImportanceScore, importanceScoreWeight) * scaleScore(compositeUrgencyScore, urgencyScoreWeight)

    const scoreComponents = {
      tagScore,
      compositeImportanceScore,
      dueDateScore,
      compositeUrgencyScore
    }
    return { compositeScore, scoreComponents }
  }
}

export function summariseScores (tagWeights: Dict<number>, contextWeights: Dict<number>) {
  const scoreNode = determineScore(tagWeights, contextWeights)
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

export function scoreTags (tagWeights: Dict<number>) {
  return function scorer (tags: Tag[]): number {
    const weights = tags.map(tag => tagWeights[tag.name] || 1)
    const product = weights.reduce((prod, weight) => prod * weight, 1)
    return product
  }
}

export function scoreDueDate (dueDate?: Date): number {
  if (dueDate === undefined) {
    return 1
  }
  const factor = 1 / 2
  const factorLifeInDays = 7

  const dayInMs = 60_000 * 60 * 24
  const timeRemaining = dueDate.getTime() - Date.now()
  const daysRemaining = Math.floor(timeRemaining / dayInMs)

  return Math.pow(factor, (daysRemaining / factorLifeInDays)) + 1
}

export function scoreContexts (contexts: string[], contextWeights: Dict<number>) {
  const defaultContextWeight = 1.1
  return contexts
    .map(context => contextWeights[context] || defaultContextWeight)
    .reduce((product, score) => product * score, 1)
}

function scaleScore (score: number, weight: number): number {
  return ((score - 1) * weight) + 1
}

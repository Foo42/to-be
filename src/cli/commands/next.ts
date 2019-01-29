import { Todo } from '../../core/todo'
import { loadActionsFromFile, buildStateFromActions } from '../../file/load'
import { Dict } from '../parser/configParser'
import { keyBy } from 'lodash'
import { isIncomplete, isLeaf, allContextsActive, notBlocked, noLongerThan } from '../../core/filters'
import { isString } from 'util'
import { buildTodoTree, deepFilterAll, deepSortAll, TreeNode } from '../../core/tree'
import { summariseActionableTasksWithin } from '../../core/tree/summarisers/actionableWithin'
import { summariseDueDates } from '../../core/tree/summarisers/dueDates'
import { dueSoonest, sortByHighestWeightTagWithin } from '../../core/sorters'
import { renderTodoTree } from '../renderers'
import { summariseTagsWithin } from '../../core/tree/summarisers/tagsWithin'
import { sortBy } from '../../core/sorters/multiLevel'
import { Config } from '../config/types'
import { noConflict } from 'bluebird'
import { summariseScores } from '../../core/tree/summarisers/score'
import { scoredSorterDesc } from '../../core/sorters/scored'
import { intersectionOf } from '../../core/filters/intersection'

interface Flags {
  availableTime?: number,
  sort: string
}
function parseFlags (flags: Dict<any>): Flags {
  const timeString = flags['available-time']
  const sort = flags['sort'] || 'scored'
  if (!isString(sort)) {
    throw new Error('bad sort flag')
  }
  if (isString(timeString) && isString(sort)) {
    const minutes = parseInt(timeString, 10)
    return {
      availableTime: minutes,
      sort
    }
  }
  return { sort }
}

export const showNext = (todoFilePath: string, loadConfig: () => Promise<Config>, activeContexts: string[]) => async (parsed: { flags: Dict<any> }) => {
  const config = await loadConfig()
  const flags = parseFlags(parsed.flags)

  const allTodos: Todo[] = await loadActionsFromFile(todoFilePath).then(buildStateFromActions)
  const rawTrees = buildTodoTree(allTodos)

  const isActionableNow = isActionableNowGiven(allTodos, activeContexts, flags)

  const sorted = flags.sort === 'scored' ? sortedAndFilteredByScore(rawTrees, isActionableNow, config) : sortedAndFilteredByLayer(rawTrees, isActionableNow, config)

  console.log(`${flags.sort} Sorted:`)
  console.log(renderTodoTree(sorted))
  return
}

function sortedAndFilteredByScore (rawTrees: TreeNode<Todo, {}>[], isActionableNow: (todo: Todo) => boolean, config: Config) {
  const fullTrees = rawTrees.map(tree => summariseActionableTasksWithin(tree, isActionableNow))
  const withoutInactionableBranches = deepFilterAll(fullTrees, (tree) => !tree.complete && tree.summary.actionableWithin > 0)
  const augmentedActionableTrees = withoutInactionableBranches
    .map(summariseDueDates)
    .map(summariseTagsWithin)
    .map(summariseScores(config.tagWeights, config.contextWeights))
  const scoreSorted = deepSortAll(augmentedActionableTrees, scoredSorterDesc(node => node.summary.compositeScore))
  return scoreSorted
}

function sortedAndFilteredByLayer (rawTrees: TreeNode<Todo, {}>[], isActionableNow: (todo: Todo) => boolean, config: Config) {
  const fullTrees = rawTrees.map(tree => summariseActionableTasksWithin(tree, isActionableNow))
  const withoutInactionableBranches = deepFilterAll(fullTrees, (tree) => !tree.complete && tree.summary.actionableWithin > 0)
  const augmentedActionableTrees = withoutInactionableBranches
    .map(summariseDueDates)
    .map(summariseTagsWithin)
    .map(summariseScores(config.tagWeights, config.contextWeights))

  const tagWeights = config.tagWeights
  const sorter = sortBy(dueSoonest).thenBy(sortByHighestWeightTagWithin(tagWeights))
  const sorted = deepSortAll(augmentedActionableTrees, sorter.sort)
  return sorted
}

function isActionableNowGiven (allTodos: Todo[], activeContexts: string[], flags: Flags) {
  const todoDict = keyBy(allTodos, 'id')
  const isComplete = (id: string) => (todoDict[id] || { complete: true }).complete
  const conditions = [
    isIncomplete,
    isLeaf,
    (todo: Todo) => allContextsActive(todo, activeContexts),
    notBlocked(isComplete)
  ]
  if (flags.availableTime) {
    conditions.push(noLongerThan(flags.availableTime))
  }
  const isActionableNow = intersectionOf(...conditions)
  return isActionableNow
}

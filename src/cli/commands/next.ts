import { Todo } from '../../core/todo'
import { loadActionsFromFile, buildStateFromActions } from '../../file/load'
import { Dict } from '../parser/configParser'
import { keyBy } from 'lodash'
import { isIncomplete, isLeaf, allContextsActive, notBlocked, noLongerThan, intersectionOf } from '../../core/filters'
import { isString } from 'util'
import { buildTodoTree, deepFilterAll, deepSortAll } from '../../core/tree'
import { summariseActionableTasksWithin } from '../../core/tree/summarisers/actionableWithin'
import { SummariseDueDates } from '../../core/tree/summarisers/dueDates'
import { dueSoonest, sortByHighestWeightTagWithin } from '../../core/sorters'
import { renderTodoTree } from '../renderers'
import { summariseTagsWithin } from '../../core/tree/summarisers/tagsWithin'
import { sortBy } from '../../core/sorters/multiLevel'
import { Config } from '../../core/config/types'
import { noConflict } from 'bluebird'

interface Flags {
  availableTime?: number
}
function parseFlags (flags: Dict<any>): Flags {
  const timeString = flags['available-time']
  if (isString(timeString)) {
    const minutes = parseInt(timeString, 10)
    return {
      availableTime: minutes
    }
  }
  return {}
}

export const showNext = (todoFilePath: string, loadConfig: () => Promise<Config>, activeContexts: string[]) => async (parsed: { flags: Dict<any> }) => {
  const config = await loadConfig()
  const flags = parseFlags(parsed.flags)

  const allTodos: Todo[] = await loadActionsFromFile(todoFilePath).then(buildStateFromActions)

  const isActionableNow = isActionableNowGiven(allTodos, activeContexts, flags)

  const fullTrees = buildTodoTree(allTodos)
    .map(tree => summariseActionableTasksWithin(tree, isActionableNow))

  const withoutInactionableBranches = deepFilterAll(fullTrees, (tree) => !tree.complete && tree.summary.actionableWithin > 0)

  const augmentedActionableTrees =
    withoutInactionableBranches
      .map(SummariseDueDates)
      .map(summariseTagsWithin)

  const tagWeights = config.tagWeights
  const sorter = sortBy(dueSoonest).thenBy(sortByHighestWeightTagWithin(tagWeights))
  const sorted = deepSortAll(augmentedActionableTrees, sorter.sort)

  return console.log(renderTodoTree(sorted))
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

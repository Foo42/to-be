import { Todo } from '../../core/todo'
import { loadActionsFromFile, buildStateFromActions } from '../../file/load'
import { Dict } from '../parser/configParser'
import { keyBy } from 'lodash'
import { isIncomplete, isLeaf, allContextsActive, notBlocked, noLongerThan, intersectionOf } from '../../core/filters'
import { isString } from 'util'
import { buildTodoTree, deepFilterAll, deepSortAll } from '../../core/tree'
import { summariseActionableTasksWithin } from '../../core/tree/summarisers/actionableWithin'
import { SummariseDueDates } from '../../core/tree/summarisers/dueDates'
import { dueSoonest } from '../../core/sorters'
import { renderTodoTree } from '../renderers'

export const showNext = (todoFilePath: string, activeContexts: string[]) => async ({ flags }: {flags: Dict<any>}) => {
  const allTodos: Todo[] = await loadActionsFromFile(todoFilePath).then(buildStateFromActions)

  const todoDict = keyBy(allTodos, 'id')
  const isComplete = (id: string) => (todoDict[id] || { complete: true }).complete

  const conditions = [
    isIncomplete,
    isLeaf,
    (todo: Todo) => allContextsActive(todo, activeContexts),
    notBlocked(isComplete)
  ]
  const timeString = flags['available-time']
  if (isString(timeString)) {
    const minutes = parseInt(timeString, 10)
    conditions.push(noLongerThan(minutes))
  }
  const isActionableNow = intersectionOf(...conditions)

  const fullTrees = buildTodoTree(allTodos)
    .map(tree => summariseActionableTasksWithin(tree, isActionableNow))

  const filteredTrees = deepFilterAll(fullTrees, (tree) => !tree.complete && tree.summary.actionableWithin > 0)
  const sorted = deepSortAll(filteredTrees.map(SummariseDueDates), dueSoonest)
  return console.log(renderTodoTree(sorted))
}

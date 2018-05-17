import { TodoTree } from '..'
import { Predicate } from '../../predicate'
import { Todo } from '../../todo'
import { sumBy } from 'lodash'

export interface ActionableWithinSummary {
  actionableWithin: number
}
export function summariseActionableTasksWithin<PrevSummaryT> (todos: TodoTree<PrevSummaryT>, isActionable: Predicate<Todo>): TodoTree<PrevSummaryT & ActionableWithinSummary> {
  const selfCount = isActionable(todos) ? 1 : 0
  const summarisedChildren = todos.children.map(child => summariseActionableTasksWithin(child, isActionable))

  const actionableWithinSummary: ActionableWithinSummary = { actionableWithin: selfCount + sumBy(summarisedChildren, child => child.summary.actionableWithin) }
  const summary = Object.assign({}, todos.summary, actionableWithinSummary)

  return Object.assign({}, todos, { children: summarisedChildren }, { summary })
}

import { Todo } from './todo'
import { groupBy, Dictionary, partition, assign, flatMap, sumBy } from 'lodash'
import { Predicate } from './predicate'

export type TreeNode<T, SummaryT = undefined> = T & {children: TreeNode<T, SummaryT>[], summary: SummaryT}
export type TodoTree<SummaryT = undefined> = TreeNode<Todo, SummaryT>

function prepNode (todo: Todo, childrenByParent: Dictionary<Todo[]>): TodoTree {
  const children = childrenByParent[todo.id] || []
  return { ...todo, children: children.map(child => prepNode(child, childrenByParent)), summary: undefined }
}

export function buildTodoTree (todos: Todo[]): TodoTree[] {
  const [withParents, withoutParents] = partition(todos, todo => todo.parentTaskId)
  const childrenByParent = groupBy(withParents, todo => todo.parentTaskId)

  return withoutParents.map(todo => prepNode(todo, childrenByParent))
}

export interface DueDateSummary {
  dueDates: Date[]
}

export function SummariseDueDates<PrevSummaryT> (todos: TodoTree<PrevSummaryT>): TodoTree<PrevSummaryT & DueDateSummary> {
  const childrenWithSummaries = todos.children
      .map(SummariseDueDates)

  const combinedDueDates = flatMap(childrenWithSummaries, child => child.summary.dueDates)

  if (todos.dueDate) {
    combinedDueDates.push(todos.dueDate)
  }
  const ownSummary: (PrevSummaryT & DueDateSummary) = assign({}, todos.summary, { dueDates: combinedDueDates })
  return { ...todos, summary: ownSummary, children: childrenWithSummaries }
}

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

export type Sorter<T> = (a: T, b: T) => number
export function deepSort<T> (todos: TodoTree<T>, sorter: Sorter<TodoTree<T>>): TodoTree<T> {
  const sortedChildren = todos.children.map(todo => deepSort(todo, sorter)).sort(sorter)
  return { ...todos, children: sortedChildren }
}

export function deepSortAll<T> (trees: TodoTree<T>[], sorter: Sorter<TodoTree<T>>): TodoTree<T>[] {
  return trees.map(tree => deepSort(tree, sorter)).sort(sorter)
}

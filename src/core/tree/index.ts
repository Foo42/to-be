import { Todo, Tag } from '../todo'
import { groupBy, Dictionary, partition, assign, flatMap, sumBy, keyBy } from 'lodash'
import { Predicate } from '../predicate'
import { Dict } from '../../cli/parser/configParser'

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

export type Sorter<T> = (a: T, b: T) => number
export function deepSort<T> (todos: TodoTree<T>, sorter: Sorter<TodoTree<T>>): TodoTree<T> {
  const sortedChildren = todos.children.map(todo => deepSort(todo, sorter)).sort(sorter)
  return { ...todos, children: sortedChildren }
}

export function deepSortAll<T> (trees: TodoTree<T>[], sorter: Sorter<TodoTree<T>>): TodoTree<T>[] {
  return trees.map(tree => deepSort(tree, sorter)).sort(sorter)
}

export function deepFilter<T> (todos: TodoTree<T>, filter: Predicate<TodoTree<T>>): TodoTree<T> {
  const filteredChildren = deepFilterAll(todos.children, filter)
  return { ...todos, children: filteredChildren }
}
export function deepFilterAll<T> (todos: TodoTree<T>[], filter: Predicate<TodoTree<T>>): TodoTree<T>[] {
  return todos.filter(filter).map(child => deepFilter(child, filter))
}

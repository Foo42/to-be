import { Todo } from './todo'
import { groupBy, Dictionary, partition } from 'lodash'

export type TreeNode<T> = T & {children: TreeNode<T>[]}

function prepNode(todo: Todo, childrenByParent: Dictionary<Todo[]>): TreeNode<Todo> {
  const children = childrenByParent[todo.id] || []
  return {...todo, children: children.map(child => prepNode(child, childrenByParent))}
}

export function buildTodoTree(todos: Todo[]): TreeNode<Todo>[]{
  const [withParents, withoutParents] = partition(todos, todo => todo.parentTaskId)
  const childrenByParent = groupBy(withParents, todo => todo.parentTaskId)

  return withoutParents.map(todo => prepNode(todo, childrenByParent))
}
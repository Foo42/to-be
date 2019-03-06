import { Todo } from '../todo'
import { isUndefined } from 'util'
import { Predicate } from '../predicate'
import { TodoTree } from '../tree'

export function isIncomplete (todo: Todo): boolean {
  return !todo.complete
}

export function isNotDeleted (todo: Todo): boolean {
  return !todo.deleted
}

export function allowAnyTodo (todo: Todo): true {
  return true
}

export function allContextsActive (todo: Todo, activeContexts: string[]): boolean {
  const required = todo.contexts.map(context => context.toLowerCase())
  return required.every(context => activeContexts.includes(context))
}

export function noLongerThan (timeInMinutes: number) {
  return (todo: Todo) => isUndefined(todo.estimateMinutes) || todo.estimateMinutes <= timeInMinutes
}

export type FilterFunc = (todo: Todo) => boolean

export type IsTaskCompleteFunc = (id: string) => boolean

export const isBlockedUntilFutureDate = (todo: Todo): boolean => {
  return todo.blockedUntil !== undefined && todo.blockedUntil > new Date()
}

export const notBlocked = (isComplete: IsTaskCompleteFunc) => (todo: Todo) => {
  const notBlockedByOtherTask = todo.blockingTaskIds.length === 0 || todo.blockingTaskIds.every(isComplete)
  return notBlockedByOtherTask && !isBlockedUntilFutureDate(todo)
}

export function isLeaf (todo: Todo | TodoTree) {
  if ('children' in todo && todo.children.length > 0) {
    return false
  }
  return true
}

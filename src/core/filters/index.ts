import { Todo } from '../todo'
import { isUndefined } from 'util'

export function isIncomplete (todo: Todo): boolean {
  return !todo.complete
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

export const intersectionOf = (...filters: FilterFunc[]) => (todo: Todo) => {
  return filters.every(filter => filter(todo))
}

export type IsTaskCompleteFunc = (id: string) => boolean
export const notBlocked = (isComplete: IsTaskCompleteFunc) => (todo: Todo) => {
  return todo.blockingTaskIds.length === 0 || todo.blockingTaskIds.every(isComplete)
}

import { Todo } from '../todo'

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

export type FilterFunc = (todo: Todo) => boolean

export const intersectionOf = (...filters: FilterFunc[]) => (todo: Todo) => {
  return filters.every(filter => filter(todo))
}

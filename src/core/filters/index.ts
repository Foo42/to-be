import { Todo } from '../todo'

export function isIncomplete (todo: Todo): boolean {
  return !todo.complete
}

export function allowAnyTodo (todo: Todo): true {
  return true
}

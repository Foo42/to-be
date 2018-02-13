import { TodoUpdate } from './actions'
import { Todo } from './todo'

export function applyUpdate (original: Todo, action: TodoUpdate): Todo {
  switch (action.type) {
    case 'changeTitle':
      return { ...original, title: action.title }

    case 'markCompleted':
      return { ...original, complete: true }

    default:
      return original
  }
}

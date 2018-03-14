import { TodoUpdate } from './actions'
import { Todo } from './todo'

export function applyUpdate (original: Todo, action: TodoUpdate): Todo {
  switch (action.type) {
    case 'changeTitle':
      return { ...original, title: action.title }

    case 'markCompleted':
      return { ...original, complete: true }

    case 'addContexts':
      return { ...original, contexts: [...original.contexts, ...action.additionalContexts] }

    case 'setEstimate':
      return { ...original, estimateMinutes: action.minutes }

    case 'setParentTask':
      return { ...original, parentTaskId: action.parentTaskId }

    default:
      const x: never = action
      throw new Error('unsupported updated type')
  }
}

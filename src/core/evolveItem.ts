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

    case 'addTags':
      return { ...original, tags: [...original.tags, ...action.tags] }

    case 'setDueDate':
      return { ...original, dueDate: action.dueDate }

    case 'addNote':
      return { ...original, notes: [...original.notes, action.note] }

    case 'addBlockingTask':
      return { ...original, blockingTaskIds: [...original.blockingTaskIds, action.taskId] }

    case 'markDeleted':
      if (action.reason) {
        return { ...original, deleted: { reason: action.reason } }
      }
      return { ...original, deleted: {} }

    case 'setBlockedUntil':
      return { ...original, blockedUntil: action.date }

    case 'clearBlockedUntil':
      return { ...original, blockedUntil: undefined }

    case 'addWaitingOn':
      return { ...original, waitingOn: [...original.waitingOn, ...action.waitingOn] }

    case 'removeWaitingOn':
      return { ...original, waitingOn: original.waitingOn.filter(waitingOn => !action.waitingOn.find(toRemove => toRemove.name === waitingOn.name)) }

    default:
      const x: never = action
      throw new Error('unsupported updated type')
  }
}

import { Todo, parseNote, Note } from './todo'
import { Dict, isDict, ensureDate } from '../util/deserialising'
import { isString, isArray, isNumber, isDate } from 'util'

export type ChangeTitle = {
  type: 'changeTitle'
  title: string
}
export const changeTitle = (title: string): ChangeTitle => ({ type: 'changeTitle', title })

export type MarkCompleted = {
  type: 'markCompleted'
}
export const markCompleted = (): MarkCompleted => ({ type: 'markCompleted' })

export type MarkDeleted = {
  type: 'markDeleted'
  reason?: string
}
export const markDeleted = (reason?: string): MarkDeleted => ({ type: 'markDeleted', reason })

export type AddContexts = {
  type: 'addContexts'
  additionalContexts: string[]
}
export const addContexts = (additionalContexts: string[]): AddContexts => ({ type: 'addContexts', additionalContexts })

export type SetEstimate = {
  type: 'setEstimate'
  minutes: number
}
export const setEstimate = (minutes: number): SetEstimate => ({ type: 'setEstimate', minutes })

export type SetParentTask = {
  type: 'setParentTask'
  parentTaskId: string
}
export const setParentTask = (parentTaskId: string): SetParentTask => ({ type: 'setParentTask', parentTaskId })

export type AddTags = {
  type: 'addTags'
  tags: {name: string}[]
}
export const addTags = (tags: {name: string}[]): AddTags => ({ type: 'addTags', tags })

export interface SetDueDate {
  type: 'setDueDate'
  dueDate: Date
}
export const setDueDate = (dueDate: Date): SetDueDate => ({ type: 'setDueDate', dueDate })

export interface AddNote {
  type: 'addNote'
  note: {
    textMarkdown: string
  }
}
export const addNote = (note: Note): AddNote => ({ type: 'addNote', note })

export interface AddBlockingTask {
  type: 'addBlockingTask'
  taskId: string
}
export const addBlockingTask = (blockingTaskId: string): AddBlockingTask => ({ type: 'addBlockingTask', taskId: blockingTaskId })

export interface SetBlockedUntil {
  type: 'setBlockedUntil'
  date: Date
}
export const setBlockedUntil = (date: Date): SetBlockedUntil => ({ type: 'setBlockedUntil', date })

export interface ClearBlockedUntil {
  type: 'clearBlockedUntil'
}
export const clearBlockedUntil = (): ClearBlockedUntil => ({ type: 'clearBlockedUntil' })

export function deserialiseTodoUpdate (raw: Dict<any>): TodoUpdate {
  const type = raw.type
  if (!isString(type)) {
    throw new Error('malformed list action. Missing type')
  }
  switch (type) {
    case 'changeTitle': {
      if (!isString(raw.title)) {
        throw new Error('Malformed changeTitle update. Missing or mis-typed field "title"')
      }
      return {
        type,
        title: raw.title
      }
    }
    case 'markCompleted': {
      return {
        type
      }
    }

    case 'markDeleted': {
      const update = {
        type
      }
      if (isString(raw.reason)) {
        return { ...update, reason: raw.reason }
      }
      return update
    }

    case 'addContexts': {
      const rawAdditionalContexts = raw.additionalContexts
      if (!isArray(rawAdditionalContexts)) {
        throw new Error('Malformed addContext. Missing of mis-typed field "additionalContexts"')
      }
      const additionalContexts = rawAdditionalContexts.map(rawContext => {
        if (isString(rawContext)) {
          return rawContext
        }
        throw new Error('non-string context')
      })
      return {
        type,
        additionalContexts
      }
    }

    case 'addTags': {
      const rawTags = raw.tags
      if (!isArray(rawTags)) {
        throw new Error('Malformed addTags. Missing or mis-typed field "tags"')
      }
      const newTags = rawTags.map(rawTag => {
        if (!isDict(rawTag)) {
          throw new Error('Malformed tag in array')
        }
        const rawTagName = rawTag.name
        if (isString(rawTagName)) {
          return { name: rawTagName }
        }
        throw new Error('non-string tag name in array')
      })
      return addTags(newTags)
    }

    case 'setEstimate': {
      const rawMinutes = raw.minutes
      if (!isNumber(rawMinutes)) {
        throw new Error('Malformed setEstimate update. Missing or mis-typed field "minutes"')
      }
      return setEstimate(rawMinutes)
    }

    case 'setParentTask': {
      const { parentTaskId } = raw
      if (!isString(parentTaskId)) {
        throw new Error('Malformed setParentTask update. Missing or mis-typed field "parentTaskId"')
      }
      return setParentTask(parentTaskId)
    }

    case 'setDueDate': {
      const dueDate = ensureDate(raw.dueDate)
      return setDueDate(dueDate)
    }

    case 'addNote': {
      const { note } = raw
      if (!isDict(note)) {
        throw new Error('Malformed addNote update. Missing or mis-typed field "note"')
      }
      return addNote(parseNote(note))
    }

    case 'addBlockingTask': {
      const { taskId } = raw
      if (!isString(taskId)) {
        throw new Error('Malformed addNote update. Missing or mis-typed field "taskId"')
      }
      return addBlockingTask(taskId)
    }

    case 'setBlockedUntil': {
      const date = ensureDate(raw.date)
      return setBlockedUntil(date)
    }

    case 'clearBlockedUntil': {
      return clearBlockedUntil()
    }

    default:
      throw new Error(`Malformed todo update type: '${type}'`)
  }
}

export type TodoUpdate = ChangeTitle | MarkCompleted | AddContexts | SetEstimate | SetParentTask | AddTags | SetDueDate | AddNote | AddBlockingTask | MarkDeleted | SetBlockedUntil | ClearBlockedUntil

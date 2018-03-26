import { Todo } from './todo'
import { Dict, isDict } from '../util/deserialising'
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
      const rawDueDate = raw.dueDate
      if (isDate(rawDueDate)) {
        return setDueDate(rawDueDate)
      }
      if (isString(rawDueDate)) {
        const dueDate = new Date(rawDueDate)
        if (!isNaN(dueDate.getTime())) {
          return setDueDate(dueDate)
        }
        throw new Error('Malformed setDueDate update. Bad date string in field "dueDate"')
      }
      throw new Error('Malformed setDueDate update. Missing or mis-typed field "dueDate".' + typeof(rawDueDate))
    }

    default:
      throw new Error(`Malformed todo update type: '${type}'`)
  }
}

export type TodoUpdate = ChangeTitle | MarkCompleted | AddContexts | SetEstimate | SetParentTask | AddTags | SetDueDate

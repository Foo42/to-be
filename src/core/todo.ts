import { isString, isBoolean, isDate, isUndefined, isArray, isNumber } from 'util'
import { Dict } from '../util/deserialising'

export interface Todo {
  id: string
  title: string
  complete: boolean
  createdAt: Date
  contexts: string[]
  estimateMinutes?: number
  parentTaskId?: string
}

function parseContexts (rawContexts: any): string[] {
  if (isUndefined(rawContexts)) {
    return []
  }
  if (!isArray(rawContexts)) {
    throw new Error('malformed contexts')
  }
  return (rawContexts).map(rawContext => {
    if (isString(rawContext)) {
      return rawContext
    }
    throw new Error('malformed context')
  })
}

export function deserialiseTodo (raw: Dict<any>): Todo {
  const { id, title, complete, createdAt, contexts, estimateMinutes, parentTaskId } = raw
  if (!isString(id)) {
    throw new Error('missing or malformed id')
  }
  if (!isString(title)) {
    throw new Error('missing or malformed title')
  }
  if (!isBoolean(complete)) {
    throw new Error('missing or malformed complete')
  }
  if (!isString(createdAt) && !isDate(createdAt)) {
    throw new Error('missing or malformed createdAt')
  }
  if (!isUndefined(estimateMinutes) && !isNumber(estimateMinutes)) {
    throw new Error('mis-typed field "estimateMinutes". Should be numeric.')
  }
  if (!isUndefined(parentTaskId) && !isString(parentTaskId)) {
    throw new Error('mis-typed field "parentTaskId". Should be string.')
  }

  const parsedCreatedAt = isDate(createdAt) ? createdAt : new Date(Date.parse(createdAt))
  return {
    id,
    title,
    complete,
    createdAt: parsedCreatedAt,
    contexts: parseContexts(contexts),
    estimateMinutes,
    parentTaskId
  }
}

export function todo (id: string, title: string): Todo {
  return {
    id,
    title,
    complete: false,
    createdAt: new Date(),
    contexts: [],
    estimateMinutes: undefined,
    parentTaskId: undefined
  }
}

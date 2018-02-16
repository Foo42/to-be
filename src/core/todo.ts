import { isString, isBoolean, isDate, isUndefined, isArray } from 'util'
import { Dict } from '../util/deserialising'

export interface Todo {
  id: string
  title: string
  complete: boolean
  createdAt: Date
  contexts: string[]
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
  const { id, title, complete, createdAt, contexts } = raw
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

  const parsedCreatedAt = isDate(createdAt) ? createdAt : new Date(Date.parse(createdAt))
  return {
    id,
    title,
    complete,
    createdAt: parsedCreatedAt,
    contexts: parseContexts(contexts)
  }
}

export function todo (id: string, title: string): Todo {
  return {
    id,
    title,
    complete: false,
    createdAt: new Date(),
    contexts: []
  }
}

import { isString, isBoolean, isDate } from 'util'
import { Dict } from '../util/deserialising'

export interface Todo {
  id: string
  title: string
  complete: boolean
  createdAt: Date
}

export function deserialiseTodo (raw: Dict<any>): Todo {
  const { id, title, complete, createdAt } = raw
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
    createdAt: parsedCreatedAt
  }
}

export function todo (id: string, title: string): Todo {
  return {
    id,
    title,
    complete: false,
    createdAt: new Date()
  }
}

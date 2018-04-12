import * as Guid from 'guid'
import { isString, isBoolean, isDate, isUndefined, isArray, isNumber } from 'util'
import { Dict, isDict } from '../util/deserialising'

export interface Todo {
  id: string
  title: string
  complete: boolean
  createdAt: Date
  contexts: string[]
  tags: {name: string}[]
  notes: {textMarkdown: string}[]
  estimateMinutes?: number
  parentTaskId?: string
  dueDate?: Date
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

export interface Note {
  textMarkdown: string
}
export function parseNote (rawNote: Dict<any>): Note {
  const { textMarkdown } = rawNote
  if (!isString(textMarkdown)) {
    throw new Error('Malformed note. Missing or mis-typed field "textMarkdown"')
  }
  return { textMarkdown }
}

function parseArray<T> (raw: any[], parseItem: (item: Dict<any>) => T): T[] {
  return raw.map(rawItem => {
    if (!isDict(rawItem)) {
      throw new Error('Item is not dict')
    }
    return parseItem(rawItem)
  })
}

function parseTags (rawTags: any): {name: string}[] {
  if (isUndefined(rawTags)) {
    return []
  }
  if (!isArray(rawTags)) {
    throw new Error('malformed tags')
  }
  return (rawTags).map(rawTag => {
    if (!isDict(rawTag)) {
      throw new Error('Malformed tag in array')
    }
    const rawTagName = rawTag.name
    if (isString(rawTagName)) {
      return { name: rawTagName }
    }
    throw new Error('malformed tag')
  })
}

function parseDate (rawDate: string): Date {
  const date = new Date(rawDate)
  if (isNaN(date.getTime())) {
    throw new Error('Bad date string: ' + rawDate)
  }
  return date
}

export function deserialiseTodo (raw: Dict<any>): Todo {
  const { id, title, complete, createdAt, contexts, estimateMinutes, parentTaskId, tags, dueDate, notes= [] } = raw
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
  if (!isUndefined(dueDate) && !isDate(dueDate)) {
    throw new Error('mis-typed field "dueDate". Should be Date.')
  }
  if (!isArray(notes)) {
    throw new Error('mis-typed field "notes". Should be array.')
  }

  const parsedCreatedAt = isDate(createdAt) ? createdAt : new Date(Date.parse(createdAt))
  return {
    id,
    title,
    complete,
    createdAt: parsedCreatedAt,
    contexts: parseContexts(contexts),
    tags: parseTags(tags),
    notes: parseArray(notes, parseNote),
    estimateMinutes,
    parentTaskId,
    dueDate: dueDate
  }
}

export function todo (id: string, title: string): Todo {
  return {
    id,
    title,
    complete: false,
    createdAt: new Date(),
    contexts: [],
    tags: [],
    notes: [],
    estimateMinutes: undefined,
    parentTaskId: undefined,
    dueDate: undefined
  }
}

export function generateId () {
  return Guid.raw()
}

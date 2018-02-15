import { Todo, deserialiseTodo } from './todo'
import { TodoUpdate, deserialiseTodoUpdate } from './actions'
import { isString, isObject, isUndefined, isDate } from 'util'
import { Dict, isDict, ensureDate } from '../util/deserialising'

export interface AddToList {
  type: 'addToList',
  item: Todo
  time: Date
}
export const addToList = (item: Todo): AddToList => ({ type: 'addToList', item, time: new Date() })

export interface UpdateItemInList {
  type: 'updateItem'
  id: string
  update: TodoUpdate
  time: Date
}
export const updateItemInList = (id: string, update: TodoUpdate): UpdateItemInList => ({ type: 'updateItem', id, update, time: new Date() })

export function deserialiseListAction (raw: Dict<any>): ListAction {
  const type = raw.type
  const item = raw.item
  const rawTime = raw.time
  if (!isString(type)) {
    throw new Error('malformed list action. Missing or mistyped field "type"')
  }
  if (! isDict(rawTime)) {
    throw new Error('malformed list action. Missing or mistyped field "time"')
  }
  const time = ensureDate(rawTime)
  switch (type) {
    case 'addToList': {
      if (!isDict(item)) {
        throw new Error('malformed addToListAction. missing item')
      }
      return {
        type,
        item: deserialiseTodo(item),
        time
      }
    }
    case 'updateItem': {
      const { id, update } = raw
      if (!isString(id)) {
        throw new Error('malformed updateItem action. missing or mistyped field "id"')
      }
      if (!isDict(update)) {
        throw new Error('malformed updateItem action. missing or mistyped field "update"')
      }
      return {
        type,
        time,
        id: id,
        update: deserialiseTodoUpdate(update)
      }
    }
    default:
      throw new Error(`Unsupported type: '${type}'`)
  }
}

export type ListAction = AddToList | UpdateItemInList

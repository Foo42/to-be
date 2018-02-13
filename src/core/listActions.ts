import { Todo, deserialiseTodo } from './todo'
import { TodoUpdate, deserialiseTodoUpdate } from './actions'
import { isString, isObject } from 'util'
import { Dict, isDict } from '../util/deserialising'

export interface AddToList {
  type: 'addToList',
  item: Todo
}
export const addToList = (item: Todo): AddToList => ({ type: 'addToList', item })

export interface UpdateItemInList {
  type: 'updateItem'
  id: string
  update: TodoUpdate
}
export const updateItemInList = (id: string, update: TodoUpdate): UpdateItemInList => ({ type: 'updateItem', id, update })

export function deserialiseListAction (raw: Dict<any>): ListAction {
  const type = raw.type
  const item = raw.item
  if (!isString(type)) {
    throw new Error('malformed list action. Missing type')
  }
  switch (type) {
    case 'addToList': {
      if (!isDict(item)) {
        throw new Error('malformed addToListAction. missing item')
      }
      return {
        type,
        item: deserialiseTodo(item)
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
        id: id,
        update: deserialiseTodoUpdate(update)
      }
    }
    default:
      throw new Error(`Unsupported type: '${type}'`)
  }
}

export type ListAction = AddToList | UpdateItemInList

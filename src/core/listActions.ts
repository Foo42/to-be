import { Todo } from "./todo";
import { TodoUpdate } from "./actions";

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
export const updateItemInList = (id: string, update: TodoUpdate): UpdateItemInList => ({ type: 'updateItem', id, update})


export type ListAction = AddToList | UpdateItemInList


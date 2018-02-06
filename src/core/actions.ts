import { Todo } from "./todo";

export type ChangeTitle = {
  type: 'changeTitle'
  title: string
}
export const changeTitle = (title: string):ChangeTitle => ({type: 'changeTitle', title})

export type TodoUpdate = ChangeTitle

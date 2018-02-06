import { Todo } from "./todo";

export type ChangeTitle = {
  type: 'changeTitle'
  title: string
}
export const changeTitle = (title: string):ChangeTitle => ({type: 'changeTitle', title})

export type MarkCompleted = {
  type: 'markCompleted'
}
export const markCompleted = ():MarkCompleted => ({type: 'markCompleted'})

export type TodoUpdate = ChangeTitle | MarkCompleted

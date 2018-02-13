import { Todo } from './todo'
import { Dict } from '../util/deserialising'
import { isString } from 'util'

export type ChangeTitle = {
  type: 'changeTitle'
  title: string
}
export const changeTitle = (title: string): ChangeTitle => ({ type: 'changeTitle', title })

export type MarkCompleted = {
  type: 'markCompleted'
}
export const markCompleted = (): MarkCompleted => ({ type: 'markCompleted' })

export function deserialiseTodoUpdate (raw: Dict<any>): TodoUpdate {
  const type = raw.type
  if (! isString(type)) {
    throw new Error('malformed list action. Missing type')
  }
  switch (type) {
    case 'changeTitle': {
      if (! isString(raw.title)) {
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

    default:
      throw new Error(`Malformed todo update type: '${type}'`)
  }
}

export type TodoUpdate = ChangeTitle | MarkCompleted

import { Tag, Todo } from '../todo'
import { isEqual } from 'lodash'

export const hasTag = (targetTag: Tag) => (todo: Todo) => {
  const found = todo.tags.find(tag => isEqual(tag, targetTag))
  return found !== undefined
}

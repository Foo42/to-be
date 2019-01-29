import { FilterFunc } from '.'
import { Todo } from '../todo'

export const intersectionOf = (...filters: FilterFunc[]) => (todo: Todo) => {
  return filters.every(filter => filter(todo))
}

import { FilterFunc } from '.'
import { Todo } from '../todo'

export const unionOf = (...filters: FilterFunc[]) => (todo: Todo) => {
  return filters.some(filter => filter(todo))
}

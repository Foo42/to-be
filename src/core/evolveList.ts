import { ListAction } from './listActions'
import { Todo } from './todo'
import { applyUpdate } from './evolveItem'

export function applyListAction (original: Todo[], action: ListAction): Todo[] {
  switch (action.type) {
    case 'addToList':
      return [...original, action.item]

    case 'updateItem':
      return original.map(item => {
        if (item.id === action.id) {
          return applyUpdate(item, action.update)
        }
        return item
      })
    default:
      throw new Error('unsupported update')
  }
}

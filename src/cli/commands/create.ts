import { addToList } from '../../core/listActions'
import { appendActionToFile } from '../../file/save'
import { quickAddParse } from '../quickAdd'
import { ParsedArgs } from '../parser/inputParser'
import { todoIdPicker, todoFilePath, showTreeFromFile } from '../index'

export async function createCommand (options: ParsedArgs) {
  const parent = await (options.flags['sub-task'] ? todoIdPicker('parent todo') : Promise.resolve(''))
  const toAdd = quickAddParse(options.allSubCommands.title as string)
  if (parent) {
    toAdd.parentTaskId = parent
  }
  const update = addToList(toAdd)
  return appendActionToFile(update, todoFilePath)
    .then(() => showTreeFromFile(todoFilePath))
    .catch(console.error)
}

import { writeFile, appendFile } from 'fs-extra'
import { ListAction } from '../core/listActions'
import { dump } from 'js-yaml'

export function saveActionsToYamlString (actions: ListAction[]): string {
  return dump(actions, { skipInvalid: true })
}

export function saveActionsToFile (actions: ListAction[], filePath: string): Promise<void> {
  return writeFile(filePath, saveActionsToYamlString(actions), 'utf8')
}

export function appendActionToFile (action: ListAction, filePath: string): Promise<void> {
  const text = saveActionsToYamlString([action])
  console.log('appending to', filePath, text)
  return appendFile(filePath, text, { encoding: 'utf8' })
}

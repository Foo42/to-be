import { writeFile } from 'fs-extra'
import { ListAction } from '../core/listActions'
import { safeDump } from 'js-yaml'

export function saveActionsToYamlString (actions: ListAction[]): string {
  return safeDump(actions)
}

export function saveActionsToFile (actions: ListAction[], filePath: string): Promise<void> {
  return writeFile(filePath, saveActionsToYamlString(actions))
}

import { applyListAction } from '../core/evolveList'
import { ListAction, deserialiseListAction } from '../core/listActions'
import { Todo } from '../core/todo'
import { readFile } from 'fs-extra'
import { load } from 'js-yaml'
import { isArray } from 'util'
import { isNotDeleted } from '../core/filters'

export function buildStateFromActions (actions: ListAction[]): Todo[] {
  return actions.reduce(applyListAction, []).filter(isNotDeleted)
}

export function loadActionsFromYamlString (yaml: string): ListAction[] {
  const loaded = load(yaml)
  if (isArray(loaded)) {
    return loaded.map(deserialiseListAction)
  }
  throw new Error('invalid yaml. contents not an array')
}

export function loadActionsFromFile (filePath: string) {
  return readFile(filePath, 'utf8')
    .then(loadActionsFromYamlString)
}

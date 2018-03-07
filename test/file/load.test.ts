import * as path from 'path'
import { loadActionsFromFile, buildStateFromActions, loadActionsFromYamlString } from '../../src/file/load'
import { expect } from 'chai'
import { toASCII } from 'punycode'
import { safeDump } from 'js-yaml'
import { addToList, updateItemInList } from '../../src/core/listActions'
import { todo } from '../../src/core/todo'
import { markCompleted, setEstimate } from '../../src/core/actions'
import { saveActionsToFile, saveActionsToYamlString } from '../../src/file/save'

describe('loadFromFile', () => {
  it('loads todos from a yaml file of serialised actions', () => {
    return loadActionsFromFile(path.join(__dirname, 'fixtures', 'simple.actions.yml'))
      .then(buildStateFromActions)
      .then((todos) => {
        expect(todos.length).to.eql(1)
        expect(todos[0]).to.deep.include({ title: 'hello world' })
      })
  })
  it('can reconstruct todos from serialised action streams', () => {
    const actions = [
      addToList(todo('abc', 'this is a todo')),
      updateItemInList('abc', setEstimate(5)),
      updateItemInList('abc', markCompleted())
    ]
    const serialised = saveActionsToYamlString(actions)
    const deserialisedActions = loadActionsFromYamlString(serialised)
    expect(deserialisedActions).to.deep.equal(actions, 'Actions did not deserialise to the original state')
    const todos = buildStateFromActions(deserialisedActions)
    expect(todos[0]).to.deep.include({ id: 'abc', complete: true, estimateMinutes: 5 })
  })
})

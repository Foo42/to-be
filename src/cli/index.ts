import * as commander from 'commander'
import { addToList } from '../core/listActions'
import { todo } from '../core/todo'
import { writeFileSync, appendFileSync } from 'fs'
import { appendActionToFile } from '../file/save'
import { loadActionsFromFile, buildStateFromActions } from '../file/load'
import * as path from 'path'

const defaultFilePath = path.join(process.cwd(), 'todo.log.yml')
const todoFilePath = process.env.TODO_FILE || defaultFilePath

commander
  .command('create <title>')
  .action((title: string) => {
    console.log('creating todo:', title)
    const id = new Date().getTime().toString()
    const update = addToList(todo(id, title))
    appendActionToFile(update, defaultFilePath)
      .then(() => loadActionsFromFile(defaultFilePath))
      .then(actions => buildStateFromActions(actions))
      .then(console.log)
      .catch(console.error)
  })

commander.parse(process.argv)

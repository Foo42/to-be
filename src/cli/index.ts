import * as commander from 'commander'
import { addToList, updateItemInList } from '../core/listActions'
import { todo, Todo } from '../core/todo'
import { writeFileSync, appendFileSync } from 'fs'
import { appendActionToFile } from '../file/save'
import { loadActionsFromFile, buildStateFromActions } from '../file/load'
import * as path from 'path'
import { markCompleted } from '../core/actions'

const defaultFilePath = path.join(process.cwd(), 'todo.log.yml')
const todoFilePath = process.env.TODO_FILE || defaultFilePath

commander
  .command('create <title>')
  .action((title: string) => {
    console.log('creating todo:', title)
    const id = new Date().getTime().toString()
    const update = addToList(todo(id, title))
    appendActionToFile(update, todoFilePath)
      .then(() => showListFromFile(todoFilePath))
      .catch(console.error)
  })

commander
  .command('list')
  .action(() => showListFromFile(todoFilePath))

commander
  .command('done <id>')
  .action((id: string) => {
    const update = updateItemInList(id, markCompleted())
    appendActionToFile(update, todoFilePath)
      .then(() => showListFromFile(todoFilePath))
      .catch(console.error)
  })

function showListFromFile (todoFilePath: string) {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(renderTodoList)
    .then(console.log)
    .catch(console.error)
}

function renderTodoList (todos: Todo[]): string {
  return todos.map((todo) => `${todo.id}: [${todo.complete ? 'x' : ' '}] "${todo.title}"`).join('\n')
}

commander.parse(process.argv)

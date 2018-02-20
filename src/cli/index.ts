import * as commander from 'commander'
import { addToList, updateItemInList } from '../core/listActions'
import { todo, Todo } from '../core/todo'
import { writeFileSync, appendFileSync } from 'fs'
import { appendActionToFile } from '../file/save'
import { loadActionsFromFile, buildStateFromActions } from '../file/load'
import * as path from 'path'
import { markCompleted, addContexts } from '../core/actions'
import { allowAnyTodo, isIncomplete } from '../core/filters/index'
import { isUndefined } from 'util'
import * as readline from 'readline'
import * as Guid from 'guid'

const defaultFilePath = path.join(process.cwd(), 'todo.log.yml')
const todoFilePath = process.env.TODO_FILE || defaultFilePath

commander
  .command('create <title>')
  .action((title: string) => {
    console.log('creating todo:', title)
    const id = Guid.raw()
    const update = addToList(todo(id, title))
    appendActionToFile(update, todoFilePath)
      .then(() => showListFromFile(todoFilePath))
      .catch(console.error)
  })

commander
  .command('list')
  .action(() => showListFromFile(todoFilePath))

commander
  .command('done [<id>]')
  .action((id: string | undefined) => {
    console.log('id', id, typeof (id))
    const gettingId = id ? Promise.resolve(id) : userIdPicker()
    gettingId.then(id => {
      console.log(`${id} marked as done`)
      const update = updateItemInList(id, markCompleted())
      return appendActionToFile(update, todoFilePath)
    })
      .then(() => showListFromFile(todoFilePath))
      .catch(console.error)
  })

commander
  .command('edit add-context [<context>] [<id>]')
  .action((context: string | undefined, id: string | undefined) => {
    console.log('in context add')
    console.log('id', id, typeof (id))
    console.log('context', context, typeof (context))
    const gettingId = id ? Promise.resolve(id) : userIdPicker()
    const gettingContext = gettingId.then(() => promptInput('Context to add'))
    Promise.all([gettingId, gettingContext]).then(([id, context]) => {
      const update = updateItemInList(id, addContexts([context]))
      return appendActionToFile(update, todoFilePath)
    })
  })

function promptInput(question: string): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    })
    rl.question(question + ': ', (answer) => {
      rl.close()
      return resolve(answer)
    })
  })
}

function userIdPicker(): Promise<string> {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(isIncomplete))
    .then(todos => {
      console.log(renderTodoList(todos, true))
      return todos
    })
    .then(todos => {
      return promptInput('number').then(answer => {
        const n = parseInt(answer)
        const todo = todos[n]
        if (todo) {
          return Promise.resolve(todo.id)
        }
        return Promise.reject(new Error('Bad selection ' + n))
      })
    })
}

function showListFromFile(todoFilePath: string, filter = isIncomplete) {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(filter))
    .then(renderTodoList)
    .then(console.log)
    .catch(console.error)
}

function renderTodoList(todos: Todo[], showNumbers = false): string {
  const renderNumber = (i: number) => showNumbers ? `#${i} ` : ''
  return todos.map((todo, i) => {
    const contexts = todo.contexts.map(context => `@${context}`).join(', ')
    const doneIndicator = `[${todo.complete ? 'x' : ' '}]`
    return `${renderNumber(i)}${todo.id}: ${doneIndicator} "${todo.title}" ${contexts}`
  }).join('\n')
}

commander.parse(process.argv)

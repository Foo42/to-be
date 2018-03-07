require('source-map-support/register')
import { Commander } from './parser'
import { addToList, updateItemInList } from '../core/listActions'
import { todo, Todo } from '../core/todo'
import { writeFileSync, appendFileSync } from 'fs'
import { appendActionToFile } from '../file/save'
import { loadActionsFromFile, buildStateFromActions } from '../file/load'
import * as path from 'path'
import { markCompleted, addContexts, changeTitle, setEstimate } from '../core/actions'
import { allowAnyTodo, isIncomplete, intersectionOf, allContextsActive } from '../core/filters/index'
import { isUndefined } from 'util'
import * as readline from 'readline'
import * as Guid from 'guid'

const defaultFilePath = path.join(process.cwd(), 'todo.log.yml')
const todoFilePath = process.env.TODO_FILE || defaultFilePath
const activeContexts = (process.env.ACTIVE_CONTEXTS ? process.env.ACTIVE_CONTEXTS.split(',') : []).map(context => context.trim().toLowerCase())

const defaultFilter = intersectionOf(isIncomplete, (todo) => allContextsActive(todo, activeContexts))

const commander = new Commander()

commander
  .command('create <title>')
  .action((options) => {
    const title = options.allSubCommands.title as string
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
  .action((options) => {
    const id = options.allSubCommands.id
    console.log('id', id, typeof (id))
    const gettingId = id ? Promise.resolve(id) : userIdPicker()
    return gettingId.then(id => {
      console.log(`${id} marked as done`)
      const update = updateItemInList(id, markCompleted())
      return appendActionToFile(update, todoFilePath)
    })
      .then(() => showListFromFile(todoFilePath))
  })

commander
  .command('edit set-title [<title>] [<id>]')
  .action((options) => {
    const { title, id } = options.allSubCommands
    const gettingId = id ? Promise.resolve(id) : userIdPicker()
    const gettingTitle = title ? Promise.resolve(title) : gettingId.then(() => promptInput('New title'))
    return Promise.all([gettingId, gettingTitle]).then(([id, title]) => {
      const update = updateItemInList(id, changeTitle(title))
      return appendActionToFile(update, todoFilePath)
    })
  })

commander
  .command('edit add-context [<context>] [<id>]')
  .action((options) => {
    const { id, context } = options.allSubCommands
    console.log(`in add-context. context: ${context}, id: ${id}`)
    const gettingId = id ? Promise.resolve(id) : userIdPicker()
    const gettingContext = gettingId.then(() => promptInput('Context to add'))
    return Promise.all([gettingId, gettingContext]).then(([id, context]) => {
      const update = updateItemInList(id, addContexts([context]))
      return appendActionToFile(update, todoFilePath)
    })
  })


commander
  .command('edit set-estimate [<estimate>] [<id>]')
  .action((options) => {
    const { estimate, id } = options.allSubCommands
    const gettingId = id ? Promise.resolve(id) : userIdPicker()
    const gettingEstimate = estimate ? Promise.resolve(estimate) : gettingId.then(() => promptInput('Estimate in minutes'))
    return Promise.all([gettingId, gettingEstimate]).then(([id, estimateString]) => {
      const estimateInMinutes = parseInt(estimateString)
      const update = updateItemInList(id, setEstimate(estimateInMinutes))
      return appendActionToFile(update, todoFilePath)
    })
  })



function promptInput (question: string): Promise<string> {
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

function userIdPicker (): Promise<string> {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(isIncomplete))
    .then(todos => {
      console.log(renderTodoList(todos, true))
      return todos
    })
    .then(todos => {
      return promptInput('number').then(answer => {
        const n = parseInt(answer, 10)
        const todo = todos[n]
        if (todo) {
          return Promise.resolve(todo.id)
        }
        return Promise.reject(new Error('Bad selection ' + n))
      })
    })
}

function showListFromFile (todoFilePath: string, filter = defaultFilter) {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(filter))
    .then(renderTodoList)
    .then(console.log)
    .catch(console.error)
}

function renderTodoList (todos: Todo[], showNumbers = false): string {
  const renderNumber = (i: number) => showNumbers ? `#${i} ` : ''
  return todos.map((todo, i) => {
    const parts: string[] = []
    if(showNumbers){
      parts.push(`#${i}`)
    }
    parts.push(`[${todo.complete ? 'x' : ' '}]`)
    parts.push(todo.title)
    if(todo.contexts.length){
      parts.push(todo.contexts.map(context => `@${context}`).join(', '))
    }
    if(todo.estimateMinutes){
      parts.push(`[${todo.estimateMinutes} mins]`)
    }
    return parts.join(' ')
  }).join('\n')
}

commander.parseArgv(process.argv)

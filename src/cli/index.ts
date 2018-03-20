require('source-map-support/register')
import { Commander } from './parser'
import { addToList, updateItemInList } from '../core/listActions'
import { todo, Todo } from '../core/todo'
import { writeFileSync, appendFileSync } from 'fs'
import { appendActionToFile } from '../file/save'
import { loadActionsFromFile, buildStateFromActions } from '../file/load'
import * as path from 'path'
import { markCompleted, addContexts, changeTitle, setEstimate, setParentTask } from '../core/actions'
import { allowAnyTodo, isIncomplete, intersectionOf, allContextsActive, noLongerThan } from '../core/filters/index'
import { isUndefined, isString } from 'util'
import * as readline from 'readline'
import * as Guid from 'guid'
import { NOTFOUND } from 'dns';
import { TreeNode, buildTodoTree } from '../core/tree';
import { flatMap } from 'lodash';

const defaultFilePath = path.join(process.cwd(), 'todo.log.yml')
const todoFilePath = process.env.TODO_FILE || defaultFilePath
const activeContexts = (process.env.ACTIVE_CONTEXTS ? process.env.ACTIVE_CONTEXTS.split(',') : []).map(context => context.trim().toLowerCase())

const defaultFilter = intersectionOf(isIncomplete, (todo) => allContextsActive(todo, activeContexts))

const commander = new Commander()

commander
  .command('create <title>')
  .option('sub-task')
  .action(async (options) => {
    const parent = await (options.flags['sub-task'] ? todoIdPicker('parent todo') : Promise.resolve(''))
    const title = options.allSubCommands.title as string
    console.log('creating todo:', title)
    const id = Guid.raw()
    const toAdd = todo(id, title)
    if(parent){
      toAdd.parentTaskId = parent
    }
    const update = addToList(toAdd)
    appendActionToFile(update, todoFilePath)
      .then(() => showTreeFromFile(todoFilePath))
      .catch(console.error)
  })

commander
  .command('tree')
  .option('filter', true)
  .action(({ flags }) => {
    let filter = defaultFilter
    if(flags.filter === 'all'){
      filter = allowAnyTodo
    }
    return showTreeFromFile(todoFilePath, filter)
  })

commander
  .command('list [<viewName>]')
  .option('available-time', true)
  .action(({ flags }) => {
    let filter = defaultFilter
    const timeString = flags['available-time']
    if (isString(timeString)) {
      const minutes = parseInt(timeString, 10)
      console.log(`Exluding tasks with estimates longer than ${minutes} minutes`)
      filter = intersectionOf(defaultFilter, noLongerThan(minutes))
    }
    return showTreeFromFile(todoFilePath, filter)
  })

commander
  .command('done [<id>]')
  .action((options) => {
    const id = options.allSubCommands.id
    console.log('id', id, typeof (id))
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
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
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
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
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
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
    const gettingId = id ? Promise.resolve(id) : todoIdPicker()
    const gettingEstimate = estimate ? Promise.resolve(estimate) : gettingId.then(() => promptInput('Estimate in minutes'))
    return Promise.all([gettingId, gettingEstimate]).then(([id, estimateString]) => {
      const estimateInMinutes = parseInt(estimateString, 10)
      const update = updateItemInList(id, setEstimate(estimateInMinutes))
      return appendActionToFile(update, todoFilePath)
    })
  })

commander
  .command('edit set-parent [<parent>] [<id>]')
  .action((options) => {
    const { parent, id } = options.allSubCommands
    const gettingId = id ? Promise.resolve(id) : todoIdPicker('target todo (the child)')
    const gettingParentId = parent ? Promise.resolve(parent) : gettingId.then(() => todoIdPicker('parent todo'))
    return Promise.all([gettingId, gettingParentId]).then(([id, parentId]) => {
      const update = updateItemInList(id, setParentTask(parentId))
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

function todoIdPicker(prompt = 'number'): Promise<string> {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(isIncomplete))
    .then(todos => buildTodoTree(todos))
    .then(todos => {
      console.log(renderTodoTree(todos, true))
      return todos
    })
    .then(todos => {
      return promptInput(prompt).then(answer => {
        const address = answer.split('.').map(part => parseInt(part, 10))
        const siblings = address.slice(0,-1).reduce((list: TreeNode<Todo>[], i: number) => {
          return list[i].children
        }, todos) || todos
        const todo = siblings[address[address.length-1]]
        return Promise.resolve(todo.id)
      })
    })
}

function showListFromFile(todoFilePath: string, filter = defaultFilter) {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(filter))
    .then(renderTodoList)
    .then(console.log)
    .catch(console.error)
}

function showTreeFromFile(todoFilePath: string, filter = defaultFilter) {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(filter))
    .then(todos => buildTodoTree(todos))
    .then(renderTodoTree)
    .then(console.log)
    .catch(console.error)
}

function renderTodoList(todos: Todo[], showNumbers = false): string {
  return todos.map((todo, i) => {
    const prefix = showNumbers ?  `#${i}` : ''
    return renderTodo(todo, prefix)
  }).join('\n')
}

function preRenderTodoTree(todos: TreeNode<Todo>[], currentIndent = '', numberingPrefix = ''): string[] {
  const indentUnit = '  '
  return flatMap(todos, (todo, i) => {
    const prefix = `${currentIndent}${numberingPrefix? (numberingPrefix + i) : ''}`
    const numberingPrefixForSubTree = numberingPrefix? prefix+'.' : ''
    return [renderTodo(todo, prefix), ...preRenderTodoTree(todo.children, currentIndent + indentUnit, numberingPrefixForSubTree)]
  })
}
function renderTodoTree(todos: TreeNode<Todo>[], showNumbers = false): string {
  return preRenderTodoTree(todos, '', showNumbers? '#' : '').join('\n')
}

function renderTodo(todo: Todo, prefix?: string): string {
  const parts: string[] = []
  if(prefix){
    parts.push(prefix)
  }
  parts.push(`[${todo.complete ? 'x' : ' '}]`)
  parts.push(todo.title)
  if (todo.contexts.length) {
    parts.push(todo.contexts.map(context => `@${context}`).join(', '))
  }
  if (todo.estimateMinutes) {
    parts.push(`[${todo.estimateMinutes} mins]`)
  }
  return parts.join(' ')

}

commander.parseArgv(process.argv)

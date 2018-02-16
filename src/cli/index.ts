import * as commander from 'commander'
import { addToList, updateItemInList } from '../core/listActions'
import { todo, Todo } from '../core/todo'
import { writeFileSync, appendFileSync } from 'fs'
import { appendActionToFile } from '../file/save'
import { loadActionsFromFile, buildStateFromActions } from '../file/load'
import * as path from 'path'
import { markCompleted } from '../core/actions'
import { allowAnyTodo, isIncomplete } from '../core/filters/index'
import { isUndefined } from 'util';
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
      console.log('you chose', id)
      const update = updateItemInList(id, markCompleted())
      return appendActionToFile(update, todoFilePath)
    })
      .then(() => showListFromFile(todoFilePath))
      .catch(console.error)
  })


function userIdPicker(): Promise<string> {
  return loadActionsFromFile(todoFilePath)
    .then(buildStateFromActions)
    .then(todos => todos.filter(isIncomplete))
    .then(todos => {
      console.log(renderTodoList(todos, true))
      return todos
    })
    .then(todos => {
      return new Promise<string>((resolve, reject) => {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout
        });
        rl.question('number: ', (answer) => {
          rl.close()
          const n = parseInt(answer)
          const todo = todos[n]
          if(todo){
            return resolve(todo.id)
          }
          return reject(new Error('Bad selection ' + n))
        })
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
  return todos.map((todo, i) => `${renderNumber(i)}${todo.id}: [${todo.complete ? 'x' : ' '}] "${todo.title}"`).join('\n')
}

commander.parse(process.argv)

import { Todo, todo, generateId } from '../core/todo'

export function quickAddParse (input: string): Todo {
  const [title, dataSection] = input.split(';')
  const data = (dataSection || '').split(/\s/)
  const contexts = data.filter(s => s.startsWith('@')).map(s => s.substring(1))
  const tags = data.filter(s => s.startsWith('#')).map(s => ({ name: s.substring(1) }))
  const dueDate = extractDueDate(data)
  const estimateMinutes = extractEstimate(data)

  return {
    ...todo(generateId(), title),
    contexts,
    tags,
    dueDate,
    estimateMinutes
  }
}

function extractDueDate (parts: string[]): Date | undefined {
  const found = parts.find(s => s.startsWith('due='))
  if (!found) {
    return undefined
  }
  const dateString = found.split('=')[1]
  const date = new Date(dateString)
  if (isNaN(date.getTime())) {
    throw new Error('Date parse error')
  }
  return date
}

function extractEstimate (parts: string[]): number | undefined {
  const found = parts.find(s => s.startsWith('t='))
  if (!found) {
    return undefined
  }
  const timeString = found.split('=')[1]
  const minutes = parseInt(timeString, 10)
  return minutes
}

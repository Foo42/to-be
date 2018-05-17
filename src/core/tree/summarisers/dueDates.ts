import { TodoTree } from '..'
import { flatMap, assign } from 'lodash'

export interface DueDateSummary {
  dueDates: Date[]
}

export function SummariseDueDates<PrevSummaryT> (todos: TodoTree<PrevSummaryT>): TodoTree<PrevSummaryT & DueDateSummary> {
  const childrenWithSummaries = todos.children
      .map(SummariseDueDates)

  const combinedDueDates = flatMap(childrenWithSummaries, child => child.summary.dueDates)

  if (todos.dueDate) {
    combinedDueDates.push(todos.dueDate)
  }
  const ownSummary: (PrevSummaryT & DueDateSummary) = assign({}, todos.summary, { dueDates: combinedDueDates })
  return { ...todos, summary: ownSummary, children: childrenWithSummaries }
}

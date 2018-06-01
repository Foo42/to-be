import { Dict } from '../../../cli/parser/configParser'
import { Tag } from '../../todo'
import { TodoTree } from '..'
import { keyBy } from 'lodash'

export interface TagsWithinSummary {
  tagsWithin: Dict<Tag>
}
export function summariseTagsWithin<PrevSummaryT> (todos: TodoTree<PrevSummaryT>): TodoTree<PrevSummaryT & TagsWithinSummary> {
  const summarisedChildren = todos.children.map(summariseTagsWithin)
  const tagsFromChildren = summarisedChildren.map(child => child.summary.tagsWithin).reduce((acc, item) => ({ ...acc, ...item }), {} as Dict<Tag>)
  const tagsFromSelf = keyBy(todos.tags, 'name')
  const combined = { ...tagsFromSelf, ...tagsFromChildren }
  const summary = Object.assign({}, todos.summary, { tagsWithin: combined })
  return Object.assign({}, todos, { children: summarisedChildren }, { summary })
}

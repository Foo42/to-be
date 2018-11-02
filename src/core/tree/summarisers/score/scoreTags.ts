import { Dict } from '../../../dict'
import { Tag } from '../../../todo'

export function scoreTags (tagWeights: Dict<number>, tags: Tag[]): number {
  const weights = tags.map(tag => tagWeights[tag.name] || 1)
  const product = weights.reduce((prod, weight) => prod * weight, 1)
  return product
}

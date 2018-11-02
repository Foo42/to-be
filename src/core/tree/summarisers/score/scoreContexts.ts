import { Dict } from '../../../dict'
export function scoreContexts (contexts: string[], contextWeights: Dict<number>) {
  const defaultContextWeight = 1.1
  return contexts
    .map(context => contextWeights[context] || defaultContextWeight)
    .reduce((product, score) => product * score, 1)
}

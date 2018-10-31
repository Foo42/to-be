import { Dict } from '../../cli/parser/configParser'

export interface Config {
  tagWeights: Dict<number>
  contextWeights: Dict<number>
}

import { Config } from './types'

const defaults: Config = {
  tagWeights: {},
  contextWeights: {}
}

export const getDefaults = () => defaults

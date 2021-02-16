import { readFile } from 'fs-extra'
import { Config } from './types'
import { safeLoad } from 'js-yaml'
import { isDict } from '../../util/deserialising'
import { Dict } from '../../cli/parser/configParser'
import { map, mapValues } from 'lodash'
import { isNumber } from 'util'

export function dictToConfig (raw: Dict<any>): Config {
  const { tagWeights, contextWeights = {} } = raw
  if (!isDict(tagWeights)) {
    throw new Error('No tag weights dict in config')
  }
  const mappedTagWeights = mapValues(tagWeights, (weight) => {
    if (!isNumber(weight)) {
      throw new Error('tag weight must be a number')
    }
    return weight
  })

  if (!isDict(contextWeights)) {
    throw new Error('mis-typed contextWeights field in config')
  }
  const mappedContextWeights = mapValues(contextWeights, (weight) => {
    if (!isNumber(weight)) {
      throw new Error('context weight must be a number')
    }
    return weight
  })
  return { tagWeights: mappedTagWeights, contextWeights: mappedContextWeights }
}

export function loadConfigFromYamlString (yaml: string): Config {
  const loaded = safeLoad(yaml)
  if (isDict(loaded)) {
    return dictToConfig(loaded)
  }
  throw new Error('invalid yaml. contents not an array')
}

export function loadConfigFromFile (filePath: string): Promise<Config> {
  console.info('Loading config from:',filePath)
  return readFile(filePath, 'utf8')
    .then(loadConfigFromYamlString)
    .then(loaded => {
      return loaded
    })
}

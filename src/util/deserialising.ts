import { isObject, isDate, isString, isNumber } from 'util'

export interface Dict<T> {
  [key: string]: T
}

export function isDict (x: any): x is Dict<any> {
  if (isObject(x)) {
    return true
  }
  return false
}

export function ensureDate (rawDate: any): Date {
  if (isDate(rawDate)) {
    return rawDate
  }
  if (isNumber(rawDate)) {
    return new Date(rawDate)
  }
  if (isString(rawDate)) {
    return new Date(rawDate)
  }
  throw new Error('Malformed date')
}
// export type Stringable = {
//   toString(): string
// }

// export type WithT<T extends string> = Dict<any> & {T: string}

// export function requiresStringField<T extends string>(raw: Dict<any>, name: T): WithT<T> {
//   const field = raw[name.toString()]
//   if(typeof field !== 'string'){
//     throw new Error('missing field ' + name.toString())
//   }
//   return raw;
// }

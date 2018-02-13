import { isObject } from 'util'

export interface Dict<T> {
  [key: string]: T
}

export function isDict (x: any): x is Dict<any> {
  if (isObject(x)) {
    return true
  }
  return false
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

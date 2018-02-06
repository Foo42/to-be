export interface Todo {
    id: string
    title: string
    complete: boolean
}

export function todo(id: string, title: string): Todo {
  return {
    id,
    title,
    complete: false
  }
}

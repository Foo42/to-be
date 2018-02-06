export interface Todo {
    id: string
    title: string
}

export function todo(id: string, title: string): Todo {
  return {
    id,
    title
  }
}

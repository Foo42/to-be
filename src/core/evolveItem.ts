import { TodoUpdate } from "./actions";
import { Todo } from "./todo";

export function applyUpdate(original: Todo, action: TodoUpdate): Todo {
  return {...original, title: action.title}
}

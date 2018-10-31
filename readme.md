# To-Be

To list management customised to how *I* want to work to help be *do* what I need to, to *be* where I want to be.

## Idea
### Principles
* Cross platform. I need to be able to work on my todos on laptop, or mobile
* Offline & online. I need to be able to work offline but have things synced and accessible online
* Extensible. I want todos to be accessible to additional services I might chose to create such that I can access and process them in novel ways.



### Things to Capture
* title
* notes
* contexts
* Projects
    * Suggest implement as a task with child tasks.
* Dependencies. Capture dependencies on other tasks, people, and dates. Tasks with no dependencies are automatically next actions. Tasks who's dependencies are fulfilled can be flagged for review, or automatically become next actions
* Time estimates.
* reminders
* due dates
* Date created
* History? Need to think about how to capture this. Do we want to capture an event log as a primary data structure? Implementatin note: yaml is possibly well suited for an append only log since it does not require any closing (or opening) tags for an array
* Composable contexts and filters.
* value tags for categorising the value realised

### Views
Want views to support the primary gtd activities
#### Next Actions
Show things which can be done now, prioritised as best as possible with sufficient context to understand them.

##### Style
Probably needs to be a tree view for best context.

##### Filtering
Display a todo if it, or any of it's children, match the current filter.
Would filter with active contexts and possibly prompt for available time if not passed.

##### Sorting
Sort by:
1. Due date
2. Possibly Explicit priority?
3. Possibly preferred tags?
4. Possibly Number of matched contexts?

## Useage

### Installing
Create an alias in your bash_profile or equivalent along the lines of:
`alias todo='node ~/code/to-be/build/src/cli/index.js'`
Optionally set currently active contexts using `ACTIVE_CONTEXTS` environment variable, possibly using script such as:
`alias todo='ACTIVE_CONTEXTS=$(context.sh) node ~/code/to-be/build/src/cli/index.js'`

### View todos
`todo list`

Optionally filter out todos with an estimate greater than your available time with `--available-time` flag. For example to exclude todos estimated to take longer than 30 minutes use the command `todo list --available-time 30`

### Create Todos

`todo create 'this is a todo; @home #example-tag t=10 due=2020-10-20'`

The command to create a todo is `todo create` this requires a single argument which is the todo's title. Tags, contexts, due date and time estimates can optionally be specified following a semicolon folowing the syntax shown in the example above.

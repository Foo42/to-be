# Design Log

## Delegation
We want a way to capture delegation of tasks such that they are not presented as "Next Items" but are not lost. In addition it would be good to have some way of resurfacing these tasks when they need chasing.

### Delegated view
We should provide filters for delegated tasks, potentially with options for how to treat "over due" delegated tasks and past chasing ones.

### Chase Up
The degree of involvement we have with a task post-delegation depends on our relationship to the result. If we had been given the task, and then pass on full responsibility to another, then we have little need or desire to follow up. The task is essentially closed. On the other hand, if we are still ultimately responsible, or invested in the result, we have interest in ensuring the work is proceeding. As such we might want to make one or more check ins on the progress of the task. Our tooling should support us with this.

We delegate a task to X and choose to set a follow up duration, say 5 days. After this time, we essentially have a new "task" to follow up. There may be context restrictions to performing this chase up, as with other tasks.

Perhaps we should model the chase up as a full on task, one with a dead period before which it is inactionable?

In what ways is a chase up task like a "real" task?
* We may only be able to perform it in certain contexts and when we have a certain amount of time meaning we may with to filter on these attributes as we do another task.
* We may want to modify contexts and estimates after creation
* In terms of task trees it makes sense for it to sit below, (or along side) the delegated task in that completing a chase up is an activity in the service of whatever project the original task is part of.

In what ways is a chase up task different to a "real" task?.
* It doesn't make sense to be able to move it to another part of the task hierarchy.
* The logic for whether it is actionable would be different to other tasks. Normally, children of a blocked task would be inactionable, however, a chase up should be actionable.
* It is auto-generated.

### Waiting On
[This post](https://facilethings.com/blog/en/delegation) makes the point that delegation is just a special case of the more general sitation of "waiting on" someone. We might be waiting on materials from someone else before we are able to perform a task, or we may have delegated a task, and are thus "waiting on" the other party to complete the task entirely. Either way it is blocked for us, but still our responsibilitiy. One difference however is whether the time estimate of a task thus blocked should be considered as work still to be done at some point. In the case of a waiting on someone without delegation, we sitll have to perform the work after the task is unblocked. In the case of deletation, our only time commitment is in chasing.


### AutoGeneration
We need some way of specifying the chaser schedule when we mark the task as "waiting on"/delegated (and some way to change this). This is likely to be more than a single entry. We will want option to chase at 3 days, then be reminded again after this. If we permit an option, either at delegation time or after to add a chase, we could either generate (some sort of) task at that point, along with a dead period, or store some sort of specification for creating a task at that that time. If we store a specification we need ways of editing it which we don't currently have. We would need a way for changes in the log to reference it. If we go with the first option however we can use the existing editing commands to affect it.

#### Real-Task with Dead Period
* Implement "blocked until" feature which prevents a task as being actionable until after a certain date
* Implement a new property on tasks of `waitingOn: string`
* Implement a cli command to delegate a task. This would:
  * Set `waitingOn` of delegated task (via an action added to the log)
  * (optionally) Create a new task which is the child of the delegated task with a title of "Chase up with {name}" and a `blockedUntil` time

Advantages:
- New `SetWaitingOn` action just sets a single field on task. Simple.
- Chase up mechanism is all implemented by clients using generic actions. Nothing locking us in to this approach. Easy to go back.

Disadvantages:
- Clients have to know to display the chase up actino even though the parent is "blocked"
  - Actually, isn't this how it works already? What do we do about actionable children of an inactionable task? In a sense you can only really block a leaf task, since the others are not directly actionable anyway if they have been broken down.
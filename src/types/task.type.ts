export type CreateTaskPayload = {
  boardId: string
  columnId: string
  title: string
  description: string
  startDate: string | null
  dueDate: string | null
  members: string[]
  estimate: number | null
  priority: number
  labels: string[]
  complexity: number
  dependencies: string[]
  checklist: any[]
  links: any[]
  blockers: string[]
  goal: string | null
  sprint: string | null
  attachments: string[]
  position: string
}

export interface TaskState {
  tasks: Task[]
  loading: boolean
  error: string | null
}

export interface Task {
  _id: string
  taskId: string
  title: string
  description: string
  board: string
}

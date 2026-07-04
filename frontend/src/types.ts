export interface Task {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  dueDate: string | null;
}

export interface Task {
  id: number;
  title: string;
  completed: boolean;
  createdAt: string;
  dueDate: string | null;
}

export interface User {
  id: number;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

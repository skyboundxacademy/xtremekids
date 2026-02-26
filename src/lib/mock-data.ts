
export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  category: string;
}

export interface Task {
  id: string;
  title: string;
  points: number;
  type: 'daily' | 'weekly';
  createdAt?: any;
}

export interface Quiz {
  id: string;
  title: string;
  questions: any[];
}

// All hardcoded mock data has been deleted.
// The app now relies exclusively on real Firestore data.
export const mockLessons: Lesson[] = [];
export const mockTasks: Task[] = [];
export const mockQuizzes: Quiz[] = [];

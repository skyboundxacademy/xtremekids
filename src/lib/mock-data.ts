
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

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

// All hardcoded data removed to use real Firestore collections.
export const mockLessons: Lesson[] = [];
export const mockTasks: Task[] = [];
export const mockQuizzes: Quiz[] = [];

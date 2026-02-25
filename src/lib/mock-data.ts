export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl: string;
  category: 'Space' | 'Nature' | 'Science' | 'Art';
}

export interface Task {
  id: string;
  title: string;
  points: number;
  completed: boolean;
  type: 'daily' | 'weekly';
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

export const mockLessons: Lesson[] = [
  {
    id: '1',
    title: 'Adventures in Space',
    description: 'Learn about the shiny planets in our solar system!',
    content: 'Space is huge! There are eight planets orbiting our Sun. Earth is where we live, and Mars is called the Red Planet because of its rusty dust.',
    imageUrl: 'https://picsum.photos/seed/space/400/300',
    category: 'Space'
  },
  {
    id: '2',
    title: 'Friendly Forest Friends',
    description: 'Meet the animals that live in the deep green woods.',
    content: 'The forest is home to many animals like bears, foxes, and deer. Bears love honey and sleeping all winter!',
    imageUrl: 'https://picsum.photos/seed/animals/400/300',
    category: 'Nature'
  }
];

export const mockTasks: Task[] = [
  { id: '1', title: 'Read 1 Lesson', points: 50, completed: false, type: 'daily' },
  { id: '2', title: 'Complete 1 Quiz', points: 100, completed: true, type: 'daily' },
  { id: '3', title: 'Explore the Lab', points: 30, completed: false, type: 'weekly' }
];

export const mockQuizzes: Quiz[] = [
  {
    id: 'q1',
    title: 'Planet Explorer Quiz',
    questions: [
      {
        question: 'Which planet is called the Red Planet?',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 1
      },
      {
        question: 'How many planets orbit our Sun?',
        options: ['7', '9', '8', '10'],
        correctAnswer: 2
      }
    ]
  }
];
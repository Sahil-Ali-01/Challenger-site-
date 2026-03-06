export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number; // index
  explanation: string;
}

export const MOCK_QUESTIONS: Question[] = [
  {
    id: '1',
    category: 'javascript',
    question: 'What is the output of `console.log(typeof NaN)`?',
    options: ['"number"', '"NaN"', '"undefined"', '"object"'],
    correctAnswer: 0,
    explanation: 'In JavaScript, `NaN` (Not-a-Number) is a special value that belongs to the `number` type. This is one of those quirks of the language!'
  },
  {
    id: '2',
    category: 'javascript',
    question: 'Which method is used to add an element at the beginning of an array?',
    options: ['push()', 'pop()', 'shift()', 'unshift()'],
    correctAnswer: 3,
    explanation: '`unshift()` adds one or more elements to the beginning of an array and returns the new length of the array. `push()` adds to the end.'
  },
  {
    id: '3',
    category: 'python',
    question: 'Which of the following is used to define a block of code in Python?',
    options: ['Brackets', 'Parentheses', 'Indentation', 'Semicolons'],
    correctAnswer: 2,
    explanation: 'Python uses indentation to define code blocks, unlike many other languages that use curly braces `{}`.'
  },
  {
    id: '4',
    category: 'system design',
    question: 'What does "Horizontal Scaling" mean?',
    options: [
      'Adding more RAM to a single server',
      'Adding more servers to your pool of resources',
      'Optimizing code performance',
      'Increasing the clock speed of the CPU'
    ],
    correctAnswer: 1,
    explanation: 'Horizontal scaling (scaling out) means adding more machines into your pool of resources. Vertical scaling (scaling up) means adding more power (CPU, RAM) to an existing machine.'
  }
];

export const CATEGORIES = [
  'Programming',
  'JavaScript',
  'Python',
  'AI',
  'Computer Science',
  'Aptitude',
  'System Design'
];

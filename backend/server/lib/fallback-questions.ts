import { Question } from "@shared/api";

/**
 * 50 diverse programming/CS fallback questions used when AI is unavailable or times out.
 * Covers: JavaScript, Python, Algorithms, System Design, General CS.
 */
export const FALLBACK_QUESTIONS: Question[] = [
  // === JAVASCRIPT ===
  {
    id: 'fq-js-1',
    category: 'javascript',
    question: 'What is the output of `typeof NaN` in JavaScript?',
    options: ['"number"', '"NaN"', '"undefined"', '"object"'],
    correctAnswer: 0,
    explanation: 'NaN is paradoxically of type "number" in JavaScript.'
  },
  {
    id: 'fq-js-2',
    category: 'javascript',
    question: 'Which method creates a shallow copy of an array?',
    options: ['array.copy()', 'array.slice()', 'array.splice()', 'array.clone()'],
    correctAnswer: 1,
    explanation: '`Array.prototype.slice()` with no arguments returns a shallow copy of the array.'
  },
  {
    id: 'fq-js-3',
    category: 'javascript',
    question: 'What does the `===` operator check in JavaScript?',
    options: ['Value only', 'Type only', 'Value and type', 'Reference equality'],
    correctAnswer: 2,
    explanation: '`===` is the strict equality operator; it checks both value and type without type coercion.'
  },
  {
    id: 'fq-js-4',
    category: 'javascript',
    question: 'Which of the following correctly declares a block-scoped variable?',
    options: ['var x = 1', 'let x = 1', 'global x = 1', 'scope x = 1'],
    correctAnswer: 1,
    explanation: '`let` provides block scope, unlike `var` which is function-scoped.'
  },
  {
    id: 'fq-js-5',
    category: 'javascript',
    question: 'What is a closure in JavaScript?',
    options: [
      'A function with no parameters',
      'A function that retains access to its outer scope after the outer function has returned',
      'A way to close a browser window',
      'An object constructor method'
    ],
    correctAnswer: 1,
    explanation: 'A closure gives a function persistent access to variables from its enclosing lexical scope.'
  },
  {
    id: 'fq-js-6',
    category: 'javascript',
    question: 'Which array method returns a new array with elements that pass a test?',
    options: ['map()', 'find()', 'filter()', 'reduce()'],
    correctAnswer: 2,
    explanation: '`filter()` returns a new array containing all elements for which the callback returns true.'
  },
  {
    id: 'fq-js-7',
    category: 'javascript',
    question: 'What is the purpose of `Promise.all()`?',
    options: [
      'Run promises sequentially',
      'Resolve when the first promise resolves',
      'Resolve when all promises resolve, reject if any rejects',
      'Ignore rejected promises'
    ],
    correctAnswer: 2,
    explanation: '`Promise.all()` waits for all promises to resolve; if any rejects, the whole call rejects.'
  },
  {
    id: 'fq-js-8',
    category: 'javascript',
    question: 'What does the spread operator (`...`) do in JavaScript?',
    options: [
      'Spreads error messages',
      'Expands an iterable into individual elements',
      'Creates a deep copy of an object',
      'Defines a rest parameter in functions'
    ],
    correctAnswer: 1,
    explanation: 'The spread operator expands iterables (arrays, strings) or object properties into individual items.'
  },
  {
    id: 'fq-js-9',
    category: 'javascript',
    question: 'Which event fires when the DOM is fully parsed but before images/stylesheets load?',
    options: ['load', 'DOMContentLoaded', 'ready', 'parse'],
    correctAnswer: 1,
    explanation: '`DOMContentLoaded` fires once the HTML is fully parsed; `load` waits for all resources.'
  },
  {
    id: 'fq-js-10',
    category: 'javascript',
    question: 'How do you prevent a function from being called multiple times rapidly (debouncing)?',
    options: [
      'Using setTimeout to delay each call and clear the previous timer on each new call',
      'Using setInterval',
      'Using async/await',
      'Using event.stopPropagation()'
    ],
    correctAnswer: 0,
    explanation: 'Debouncing delays a function call and resets the delay each time the function is called again.'
  },

  // === PYTHON ===
  {
    id: 'fq-py-1',
    category: 'python',
    question: 'Which keyword is used to define a function in Python?',
    options: ['function', 'func', 'def', 'define'],
    correctAnswer: 2,
    explanation: 'Python uses the `def` keyword to define functions.'
  },
  {
    id: 'fq-py-2',
    category: 'python',
    question: 'What is a Python list comprehension?',
    options: [
      'A way to import lists from other modules',
      'A concise way to create lists using a for-loop inside brackets',
      'A built-in list sorting method',
      'A type hint for list variables'
    ],
    correctAnswer: 1,
    explanation: 'List comprehensions like `[x*2 for x in range(5)]` offer a compact syntax for generating lists.'
  },
  {
    id: 'fq-py-3',
    category: 'python',
    question: 'Which of the following Python data types is immutable?',
    options: ['list', 'dict', 'set', 'tuple'],
    correctAnswer: 3,
    explanation: 'Tuples are immutable — you cannot change their elements after creation.'
  },
  {
    id: 'fq-py-4',
    category: 'python',
    question: 'What does `*args` mean in a Python function signature?',
    options: [
      'Multiplies arguments',
      'Accepts any number of positional arguments as a tuple',
      'Accepts keyword arguments only',
      'Marks arguments as optional'
    ],
    correctAnswer: 1,
    explanation: '`*args` collects extra positional arguments into a tuple inside the function.'
  },
  {
    id: 'fq-py-5',
    category: 'python',
    question: 'How do you open a file safely in Python (auto-closing it)?',
    options: ['open("file.txt")', 'with open("file.txt") as f:', 'file.open("file.txt")', 'import file; file.open()'],
    correctAnswer: 1,
    explanation: 'The `with` statement is a context manager that automatically closes the file when done.'
  },
  {
    id: 'fq-py-6',
    category: 'python',
    question: 'What is the output of `bool([])` in Python?',
    options: ['True', 'False', 'None', 'Error'],
    correctAnswer: 1,
    explanation: 'An empty list is falsy in Python; `bool([])` evaluates to `False`.'
  },
  {
    id: 'fq-py-7',
    category: 'python',
    question: 'Which module is used for regular expressions in Python?',
    options: ['regex', 're', 'regexp', 'pattern'],
    correctAnswer: 1,
    explanation: 'The built-in `re` module provides regular expression operations in Python.'
  },
  {
    id: 'fq-py-8',
    category: 'python',
    question: 'What does the `enumerate()` function do in Python?',
    options: [
      'Returns the length of an iterable',
      'Iterates and yields (index, value) pairs',
      'Sorts an iterable by index',
      'Converts a list to a dictionary'
    ],
    correctAnswer: 1,
    explanation: '`enumerate()` adds a counter to an iterable, yielding tuples of (index, element).'
  },
  {
    id: 'fq-py-9',
    category: 'python',
    question: 'What is a Python decorator?',
    options: [
      'A function that modifies or wraps another function',
      'A CSS-style class attribute',
      'A way to declare class methods',
      'A built-in Python string formatter'
    ],
    correctAnswer: 0,
    explanation: 'Decorators are functions that take another function as input and extend or modify its behavior.'
  },
  {
    id: 'fq-py-10',
    category: 'python',
    question: 'What is the difference between `deepcopy` and `copy` in Python?',
    options: [
      'No difference',
      '`deepcopy` recursively copies all nested objects; `copy` only copies the top-level structure',
      '`copy` is faster and creates a complete independent duplicate',
      '`deepcopy` only works on lists'
    ],
    correctAnswer: 1,
    explanation: '`copy.copy()` is a shallow copy; `copy.deepcopy()` recursively duplicates all nested objects.'
  },

  // === ALGORITHMS & DATA STRUCTURES ===
  {
    id: 'fq-al-1',
    category: 'algorithms',
    question: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(n²)', 'O(log n)', 'O(1)'],
    correctAnswer: 2,
    explanation: 'Binary search halves the search space each step, giving O(log n) complexity.'
  },
  {
    id: 'fq-al-2',
    category: 'algorithms',
    question: 'Which data structure uses LIFO (Last In, First Out)?',
    options: ['Queue', 'Stack', 'Heap', 'Linked List'],
    correctAnswer: 1,
    explanation: 'A stack follows LIFO — the last element pushed is the first one popped.'
  },
  {
    id: 'fq-al-3',
    category: 'algorithms',
    question: 'What is the worst-case time complexity of quicksort?',
    options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'],
    correctAnswer: 2,
    explanation: 'Quicksort degrades to O(n²) when the pivot is always the smallest or largest element (e.g., already sorted input).'
  },
  {
    id: 'fq-al-4',
    category: 'algorithms',
    question: 'What data structure does BFS (Breadth-First Search) use?',
    options: ['Stack', 'Queue', 'Heap', 'Tree'],
    correctAnswer: 1,
    explanation: 'BFS uses a queue to explore nodes level by level.'
  },
  {
    id: 'fq-al-5',
    category: 'algorithms',
    question: 'What is dynamic programming?',
    options: [
      'Programming with dynamic types',
      'Breaking a problem into overlapping subproblems and storing results to avoid recomputation',
      'A runtime code compilation technique',
      'A UI animation technique'
    ],
    correctAnswer: 1,
    explanation: 'Dynamic programming solves complex problems by breaking them into simpler overlapping subproblems and caching results (memoization or tabulation).'
  },
  {
    id: 'fq-al-6',
    category: 'algorithms',
    question: 'What is the time complexity of accessing an element in a hash map?',
    options: ['O(n)', 'O(log n)', 'O(1) average', 'O(n²)'],
    correctAnswer: 2,
    explanation: 'Hash maps provide O(1) average-case lookup due to direct key-based hashing.'
  },
  {
    id: 'fq-al-7',
    category: 'algorithms',
    question: 'Which sorting algorithm is stable AND has O(n log n) guaranteed time complexity?',
    options: ['Quicksort', 'Heapsort', 'Merge sort', 'Bubble sort'],
    correctAnswer: 2,
    explanation: 'Merge sort is stable and guarantees O(n log n) in all cases, unlike quicksort or heapsort.'
  },
  {
    id: 'fq-al-8',
    category: 'algorithms',
    question: 'What is a balanced binary search tree?',
    options: [
      'A tree where every node has exactly two children',
      'A BST where the height difference between subtrees is bounded, ensuring O(log n) operations',
      'A tree stored in an array',
      'A BST with no duplicate values'
    ],
    correctAnswer: 1,
    explanation: 'Balanced BSTs (like AVL or Red-Black trees) keep the height O(log n) to guarantee efficient operations.'
  },
  {
    id: 'fq-al-9',
    category: 'algorithms',
    question: 'What is the space complexity of recursion?',
    options: ['O(1)', 'O(log n)', 'O(n) — proportional to call stack depth', 'O(n²)'],
    correctAnswer: 2,
    explanation: 'Each recursive call consumes stack frame space, so space complexity is O(depth), typically O(n).'
  },
  {
    id: 'fq-al-10',
    category: 'algorithms',
    question: 'Which algorithm finds the shortest path in a weighted graph with non-negative edges?',
    options: ["Bellman-Ford", "DFS", "Dijkstra's algorithm", "Prim's algorithm"],
    correctAnswer: 2,
    explanation: "Dijkstra's algorithm greedily finds shortest paths from a source vertex in graphs with non-negative edge weights."
  },

  // === SYSTEM DESIGN ===
  {
    id: 'fq-sd-1',
    category: 'system design',
    question: 'What does the CAP theorem state?',
    options: [
      'Consistency, Availability, and Partition tolerance: you can only guarantee two at a time',
      'Capacity, Availability, and Performance: pick two',
      'Caching, API design, and Persistence',
      'You must have all three: Consistency, Availability, and Partition tolerance'
    ],
    correctAnswer: 0,
    explanation: 'CAP theorem: in a distributed system, you can only guarantee Consistency, Availability, OR Partition tolerance — never all three simultaneously.'
  },
  {
    id: 'fq-sd-2',
    category: 'system design',
    question: 'What is horizontal scaling?',
    options: [
      'Adding more RAM/CPU to an existing server',
      'Adding more servers to handle increased load',
      'Splitting a database into multiple tables',
      'Increasing network bandwidth'
    ],
    correctAnswer: 1,
    explanation: 'Horizontal scaling (scaling out) adds more machines; vertical scaling (scaling up) upgrades existing machines.'
  },
  {
    id: 'fq-sd-3',
    category: 'system design',
    question: 'What is a CDN (Content Delivery Network)?',
    options: [
      'A type of database',
      'A distributed network of servers that delivers content from locations close to the user',
      'A server load balancer',
      'A network security firewall'
    ],
    correctAnswer: 1,
    explanation: 'CDNs cache static assets at edge servers globally to reduce latency for end users.'
  },
  {
    id: 'fq-sd-4',
    category: 'system design',
    question: 'What is database sharding?',
    options: [
      'Backing up a database',
      'Encrypting database columns',
      'Horizontally partitioning data across multiple database instances',
      'Combining multiple tables into one'
    ],
    correctAnswer: 2,
    explanation: 'Sharding splits large datasets across multiple database nodes to distribute load and improve scalability.'
  },
  {
    id: 'fq-sd-5',
    category: 'system design',
    question: 'What is an API Gateway?',
    options: [
      'A type of REST API',
      'A server that acts as the single entry point for client requests, routing to backend microservices',
      'A database connection pool',
      'A frontend caching layer'
    ],
    correctAnswer: 1,
    explanation: 'An API Gateway handles routing, authentication, rate limiting, and load balancing for microservice architectures.'
  },
  {
    id: 'fq-sd-6',
    category: 'system design',
    question: 'What is eventual consistency in distributed systems?',
    options: [
      'Data is always immediately consistent across all nodes',
      'Data will become consistent across all nodes given enough time without new updates',
      'Some data is permanently inconsistent',
      'Consistency is handled by the client'
    ],
    correctAnswer: 1,
    explanation: 'Eventually consistent systems allow temporary inconsistency but guarantee that all nodes converge to the same value over time.'
  },
  {
    id: 'fq-sd-7',
    category: 'system design',
    question: 'What is the purpose of a message queue?',
    options: [
      'To store user messages in a chat app',
      'To decouple services and enable asynchronous communication',
      'To cache database query results',
      'To balance HTTP requests'
    ],
    correctAnswer: 1,
    explanation: 'Message queues (e.g., RabbitMQ, Kafka) decouple producers from consumers, enabling async processing and buffering spikes.'
  },
  {
    id: 'fq-sd-8',
    category: 'system design',
    question: 'What is a load balancer?',
    options: [
      'A tool that compresses network traffic',
      'A system that distributes incoming network traffic across multiple servers',
      'A database replication mechanism',
      'A caching proxy'
    ],
    correctAnswer: 1,
    explanation: 'Load balancers distribute requests across servers to prevent any single server from becoming a bottleneck.'
  },
  {
    id: 'fq-sd-9',
    category: 'system design',
    question: 'What is the difference between SQL and NoSQL databases?',
    options: [
      'SQL is faster than NoSQL in all cases',
      'SQL uses structured tables with schemas; NoSQL uses flexible document/key-value/graph models',
      'NoSQL cannot store relationships',
      'SQL databases cannot scale horizontally'
    ],
    correctAnswer: 1,
    explanation: 'SQL databases enforce structured schemas and support ACID transactions; NoSQL databases sacrifice some consistency for flexibility and scale.'
  },
  {
    id: 'fq-sd-10',
    category: 'system design',
    question: 'What is rate limiting?',
    options: [
      'Limiting database row count',
      'Controlling the number of requests a client can make in a given time window',
      'Restricting server CPU usage',
      'Limiting file upload size'
    ],
    correctAnswer: 1,
    explanation: 'Rate limiting protects APIs from abuse and overload by capping requests per user/IP within a time window.'
  },

  // === GENERAL PROGRAMMING / CS ===
  {
    id: 'fq-cs-1',
    category: 'programming',
    question: 'What does REST stand for?',
    options: [
      'Remote Execution State Transfer',
      'Representational State Transfer',
      'Resource Endpoint Service Technology',
      'Real-time Event Streaming Technology'
    ],
    correctAnswer: 1,
    explanation: 'REST (Representational State Transfer) is an architectural style for designing networked applications using HTTP.'
  },
  {
    id: 'fq-cs-2',
    category: 'programming',
    question: 'What is the difference between a process and a thread?',
    options: [
      'No difference — they are the same',
      'A process is an independent execution unit with its own memory; a thread is a lighter unit within a process sharing memory',
      'A thread is heavier than a process',
      'Threads cannot share data'
    ],
    correctAnswer: 1,
    explanation: 'Processes are independent with isolated memory; threads within the same process share memory and are lighter weight.'
  },
  {
    id: 'fq-cs-3',
    category: 'programming',
    question: 'What is the purpose of version control systems like Git?',
    options: [
      'To compile code faster',
      'To track changes in code over time and enable collaboration',
      'To run automated tests',
      'To deploy applications'
    ],
    correctAnswer: 1,
    explanation: 'Version control systems track code history, allow branching/merging, and enable multiple developers to collaborate.'
  },
  {
    id: 'fq-cs-4',
    category: 'programming',
    question: 'What is an API?',
    options: [
      'A programming language',
      'A set of rules/interfaces that allows software components to communicate',
      'A database management system',
      'A type of server hardware'
    ],
    correctAnswer: 1,
    explanation: 'An API (Application Programming Interface) defines how software components interact and exchange data.'
  },
  {
    id: 'fq-cs-5',
    category: 'programming',
    question: 'What does OOP stand for and what is its main concept?',
    options: [
      'Open Object Protocol — network communication',
      'Object-Oriented Programming — organizing code around objects that bundle data and behavior',
      'Ordered Output Processing — how compilers work',
      'Optional Output Parameters — function design'
    ],
    correctAnswer: 1,
    explanation: 'OOP organizes software around objects (instances of classes) that combine state (data) and behavior (methods).'
  },
  {
    id: 'fq-cs-6',
    category: 'programming',
    question: 'What is SQL injection?',
    options: [
      'A technique to speed up SQL queries',
      'A security vulnerability where malicious SQL code is inserted into input to manipulate a database',
      'A method of connecting to a database',
      'A SQL query optimization strategy'
    ],
    correctAnswer: 1,
    explanation: 'SQL injection exploits unsanitized user input to inject malicious SQL, potentially exposing or corrupting database data.'
  },
  {
    id: 'fq-cs-7',
    category: 'programming',
    question: 'What is the purpose of caching?',
    options: [
      'To permanently store data',
      'To temporarily store frequently accessed data closer to the requester to reduce latency',
      'To encrypt sensitive information',
      'To compress files'
    ],
    correctAnswer: 1,
    explanation: 'Caching stores copies of expensive-to-compute or frequently-read data for fast retrieval, reducing load on databases or APIs.'
  },
  {
    id: 'fq-cs-8',
    category: 'programming',
    question: 'What does SOLID stand for in software engineering?',
    options: [
      'Single, Open, Liskov, Interface, Dependency — five OOP design principles',
      'Scalable, Open, Layered, Integrated, Distributed',
      'Simple, Observable, Lazy, Immutable, Decoupled',
      'Synchronized, Ordered, Linked, Independent, Distributed'
    ],
    correctAnswer: 0,
    explanation: 'SOLID: Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion — key OOP principles.'
  },
  {
    id: 'fq-cs-9',
    category: 'programming',
    question: 'What is a race condition?',
    options: [
      'A performance benchmark for code',
      'A bug where the outcome depends on the non-deterministic ordering of concurrent operations',
      'A competitive programming concept',
      'A network latency issue'
    ],
    correctAnswer: 1,
    explanation: 'Race conditions occur in concurrent programs when multiple threads access shared data simultaneously and the result depends on execution order.'
  },
  {
    id: 'fq-cs-10',
    category: 'programming',
    question: 'What is the difference between compiled and interpreted languages?',
    options: [
      'Compiled languages are always faster',
      'Compiled languages are translated to machine code before execution; interpreted languages are translated line by line at runtime',
      'Interpreted languages cannot handle errors',
      'There is no practical difference today'
    ],
    correctAnswer: 1,
    explanation: 'Compiled languages (e.g., C, Go) produce machine code ahead of time; interpreted languages (e.g., Python, JavaScript) translate code during execution.'
  }
];

/** Returns a shuffled random selection of `count` questions from the fallback pool. */
export function getRandomFallbackQuestions(count: number): Question[] {
  const shuffled = [...FALLBACK_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

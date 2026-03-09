import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─── Helpers ──────────────────────────────────────────────────────────────────
const pick    = arr => arr[Math.floor(Math.random() * arr.length)];
const rand    = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const shuffle = arr => [...arr].sort(() => Math.random() - 0.5);

/** Returns a Date N days in the past at a random time */
const daysAgo = n => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(rand(7, 22), rand(0, 59), rand(0, 59), 0);
  return d;
};

/** Returns a Date between minDays and maxDays ago */
const randPast = (minDays, maxDays) => daysAgo(rand(minDays, maxDays));

const upsertSubject = (id, examId, title, icon, order) =>
  prisma.subject.upsert({ where: { id }, update: {}, create: { id, examId, title, icon, order } });

const upsertChapter = (id, subjectId, title, order, description = '') =>
  prisma.chapter.upsert({ where: { id }, update: {}, create: { id, subjectId, title, order, description } });

const upsertTopic = (id, chapterId, title, content, order, estimatedMins = 45) =>
  prisma.topic.upsert({ where: { id }, update: {}, create: { id, chapterId, title, content, order, estimatedMins } });

async function main() {
  console.log('🌱 Seeding database…');

  // ══════════════════════════════════════════════════════════════════════════
  //  USERS
  // ══════════════════════════════════════════════════════════════════════════
  const adminPw   = await bcrypt.hash('Admin@123',   10);
  const studentPw = await bcrypt.hash('Student@123', 10);

  await prisma.user.upsert({
    where:  { email: 'admin@examprep.com' },
    update: {},
    create: {
      name: 'Admin User', email: 'admin@examprep.com',
      password: adminPw, role: 'ADMIN',
      createdAt: randPast(180, 365),
    },
  });

  // [name, email, targetExam, hoursPerDay, daysUntilExam, joinedDaysAgo, lastActiveDaysAgo]
  const studentDefs = [
    ['Alice Chen',        'alice@example.com',       'exam-sde',      3, 120,  10,  0],
    ['Bob Kumar',         'bob@example.com',         'exam-backend',  5,  80, 180,  1],
    ['Charlie Park',      'charlie@example.com',     'exam-devops',   4, 200,  45,  0],
    ['Diana Sharma',      'diana@example.com',       'exam-sde',      2, 150,  90,  2],
    ['Ethan Brown',       'ethan@example.com',       'exam-frontend', 4, 100,  30,  1],
    ['Fiona Nair',        'fiona@example.com',       'exam-devops',   3, 180, 120,  3],
    ['George Thomas',     'george@example.com',      'exam-backend',  4,  90, 160,  0],
    ['Hannah Singh',      'hannah@example.com',      'exam-sde',      5, 100,  20,  1],
    ['Ivan Petrov',       'ivan@example.com',        'exam-ui',       3, 160,  75,  2],
    ['Jasmine Verma',     'jasmine@example.com',     'exam-frontend', 4, 110,  50,  0],
    ['Kevin Mehta',       'kevin@example.com',       'exam-sde',      3, 130, 200,  4],
    ['Laura Joshi',       'laura@example.com',       'exam-ui',       6,  70, 140,  1],
    ['Manish Rao',        'manish@example.com',      'exam-devops',   4, 160,  60,  3],
    ['Nina Patel',        'nina@example.com',        'exam-frontend', 3, 140,  35,  0],
    ['Oscar Iyer',        'oscar@example.com',       'exam-sde',      5,  85, 110,  2],
    ['Priya Gupta',       'priya@example.com',       'exam-backend',  4, 100,  25,  1],
    ['Rahul Mishra',      'rahul@example.com',       'exam-devops',   3, 140, 170,  0],
    ['Sneha Pillai',      'sneha@example.com',       'exam-sde',      2, 220,  80,  5],
    ['Tanvir Ahmed',      'tanvir@example.com',      'exam-frontend', 4, 115,  40,  1],
    ['Uma Bose',          'uma@example.com',         'exam-ui',       3, 190, 130,  2],
    ['Vikram Sinha',      'vikram@example.com',      'exam-backend',  4, 115,  95,  0],
    ['Wren Kulkarni',     'wren@example.com',        'exam-sde',      6,  55, 210,  6],
    ['Xuan Li',           'xuan@example.com',        'exam-frontend', 4, 120,  15,  0],
    ['Yash Banerjee',     'yash@example.com',        'exam-devops',   5,  95, 155,  3],
    ['Zara Chatterjee',   'zara@example.com',        'exam-ui',       3, 175,  65,  1],
    ['Arjun Tiwari',      'arjun@student.com',       'exam-sde',      4, 105,  55,  0],
    ['Bharat Kapoor',     'bharat@student.com',      'exam-backend',  3, 145, 100,  2],
    ['Chirag Malhotra',   'chirag@student.com',      'exam-devops',   5,  88, 190,  4],
    ['Deepika Anand',     'deepika@student.com',     'exam-frontend', 4, 125,  70,  1],
    ['Farhan Sheikh',     'farhan@student.com',      'exam-sde',      2, 195,  85,  0],
    ['Gauri Mehta',       'gauri@student.com',       'exam-ui',       4, 108,  42,  2],
    ['Harsh Trivedi',     'harsh@student.com',       'exam-devops',   3, 170, 175,  5],
    ['Ishita Bhatia',     'ishita@student.com',      'exam-frontend', 4,  98,  28,  1],
    ['Jayesh Pandey',     'jayesh@student.com',      'exam-sde',      5,  78, 115,  0],
    ['Kavya Nambiar',     'kavya@student.com',       'exam-ui',       4, 130,  52,  3],
    ['Lokesh Yadav',      'lokesh@student.com',      'exam-backend',  4, 135, 145,  1],
    ['Meena Krishnan',    'meena@student.com',       'exam-frontend', 2, 185,  88,  2],
    ['Nikhil Dutta',      'nikhil@student.com',      'exam-sde',      5,  92,  33,  0],
    ['Omkar Desai',       'omkar@student.com',       'exam-devops',   4, 122, 105,  4],
    ['Prakash Hegde',     'prakash@student.com',     'exam-backend',  4, 118,  48,  1],
    ['Qureshi Adnan',     'adnan@student.com',       'exam-ui',       6,  72, 220,  7],
    ['Rekha Subramaniam', 'rekha@student.com',       'exam-sde',      3, 155,  62,  2],
    ['Suresh Nair',       'suresh@student.com',      'exam-frontend', 4, 142, 135,  0],
    ['Tanvi Oberoi',      'tanvi@student.com',       'exam-devops',   5,  82,  22,  1],
    ['Uday Puri',         'uday@student.com',        'exam-backend',  2, 230, 195,  8],
    ['Vanessa D\'Souza',  'vanessa@student.com',     'exam-sde',      4, 112,  38,  0],
    ['Wasim Khan',        'wasim@student.com',       'exam-ui',       5,  90, 165,  3],
    ['Ximena Jose',       'ximena@student.com',      'exam-frontend', 5,  88,  18,  1],
    ['Yogesh Pawar',      'yogesh@student.com',      'exam-devops',   4, 122,  92,  2],
    ['Zubin Mistry',      'zubin@student.com',       'exam-sde',      3, 158, 125,  0],
  ];

  const students = [];
  for (const [name, email, targetExam, hoursPerDay, daysUntilExam, joinedDaysAgo, lastActiveDaysAgo] of studentDefs) {
    const examDate  = new Date();
    examDate.setDate(examDate.getDate() + daysUntilExam);
    const createdAt = daysAgo(joinedDaysAgo);

    const s = await prisma.user.upsert({
      where:  { email },
      update: { targetExam, hoursPerDay, examDate },
      create: { name, email, password: studentPw, role: 'STUDENT', targetExam, hoursPerDay, examDate, createdAt },
    });
    students.push({ ...s, lastActiveDaysAgo });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  EXAMS
  // ══════════════════════════════════════════════════════════════════════════
  const sdeExam = await prisma.exam.upsert({
    where:  { id: 'exam-sde' }, update: {},
    create: { id: 'exam-sde', title: 'SDE Interview Prep',
      description: 'Comprehensive prep for Software Development Engineer interviews at top tech companies.',
      category: 'Engineering', isActive: true },
  });

  const frontendExam = await prisma.exam.upsert({
    where:  { id: 'exam-frontend' }, update: {},
    create: { id: 'exam-frontend', title: 'Frontend Developer',
      description: 'Master HTML, CSS, JavaScript, React, and modern frontend architecture for interviews.',
      category: 'Engineering', isActive: true },
  });

  const backendExam = await prisma.exam.upsert({
    where:  { id: 'exam-backend' }, update: {},
    create: { id: 'exam-backend', title: 'Backend Developer',
      description: 'Cover REST APIs, databases, system design, Node.js, and cloud fundamentals.',
      category: 'Engineering', isActive: true },
  });

  const uiExam = await prisma.exam.upsert({
    where:  { id: 'exam-ui' }, update: {},
    create: { id: 'exam-ui', title: 'UI/UX Designer',
      description: 'Design principles, user research, Figma, accessibility, and product thinking.',
      category: 'Design', isActive: true },
  });

  const devopsExam = await prisma.exam.upsert({
    where:  { id: 'exam-devops' }, update: {},
    create: { id: 'exam-devops', title: 'DevOps Engineer',
      description: 'CI/CD, Docker, Kubernetes, cloud platforms, IaC, and SRE fundamentals.',
      category: 'Engineering', isActive: true },
  });

  // ══════════════════════════════════════════════════════════════════════════
  //  SDE — Subjects / Chapters / Topics
  // ══════════════════════════════════════════════════════════════════════════
  const sdeDsa = await upsertSubject('sde-dsa', 'exam-sde', 'Data Structures & Algorithms', '📊', 1);
  const sdeSd  = await upsertSubject('sde-sd',  'exam-sde', 'System Design',                '🏗️', 2);
  const sdeBeh = await upsertSubject('sde-beh', 'exam-sde', 'Behavioral & HR',               '🤝', 3);

  await upsertChapter('sde-ch1', 'sde-dsa', 'Arrays & Strings',    1, 'Fundamental array and string problems');
  await upsertChapter('sde-ch2', 'sde-dsa', 'Trees & Graphs',      2, 'Binary trees, BSTs, and graph traversal');
  await upsertChapter('sde-ch3', 'sde-dsa', 'Dynamic Programming', 3, 'Memoization and tabulation');
  await upsertChapter('sde-ch4', 'sde-sd',  'Scalability Basics',  1, 'Load balancers, caching, CDN');
  await upsertChapter('sde-ch5', 'sde-sd',  'Databases at Scale',  2, 'Sharding, replication, CAP theorem');
  await upsertChapter('sde-ch6', 'sde-beh', 'STAR Method',         1, 'Structuring behavioral answers');
  await upsertChapter('sde-ch7', 'sde-beh', 'Leadership & Conflict',2,'Handling disagreements and leading teams');

  const sdeTopics = await Promise.all([
    upsertTopic('sde-t1',  'sde-ch1', 'Two Pointers Technique',  'Use two pointers moving toward each other or in same direction.', 1, 40),
    upsertTopic('sde-t2',  'sde-ch1', 'Sliding Window',           'Fixed and variable-size window patterns.',                       2, 45),
    upsertTopic('sde-t3',  'sde-ch1', 'Prefix Sums',             'Cumulative sums for range queries.',                             3, 35),
    upsertTopic('sde-t4',  'sde-ch2', 'Binary Search Trees',     'Insertion, deletion, and traversal in BSTs.',                   1, 50),
    upsertTopic('sde-t5',  'sde-ch2', 'BFS & DFS',               'Breadth-first and depth-first graph traversals.',               2, 55),
    upsertTopic('sde-t6',  'sde-ch3', 'Fibonacci & Memoization', 'Top-down DP with caching.',                                     1, 40),
    upsertTopic('sde-t7',  'sde-ch3', 'Knapsack Problems',       '0/1 knapsack and variations.',                                  2, 60),
    upsertTopic('sde-t8',  'sde-ch4', 'Load Balancing',          'Round-robin, consistent hashing, and health checks.',           1, 50),
    upsertTopic('sde-t9',  'sde-ch5', 'Database Sharding',       'Horizontal partitioning strategies.',                           1, 55),
    upsertTopic('sde-t10', 'sde-ch6', 'Tell Me About Yourself',  'Crafting a 90-second professional intro.',                      1, 30),
    upsertTopic('sde-t11', 'sde-ch7', 'Handling Disagreements',  'Using STAR to frame conflict resolution stories.',               1, 35),
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  //  FRONTEND — Subjects / Chapters / Topics
  // ══════════════════════════════════════════════════════════════════════════
  const feCore  = await upsertSubject('fe-core',  'exam-frontend', 'Core Web Technologies', '🌐', 1);
  const feReact = await upsertSubject('fe-react', 'exam-frontend', 'React & Modern JS',     '⚛️', 2);
  const fePer   = await upsertSubject('fe-perf',  'exam-frontend', 'Performance & Testing', '🚀', 3);

  await upsertChapter('fe-ch1', 'fe-core',  'HTML & Accessibility', 1, 'Semantic HTML, ARIA, WCAG');
  await upsertChapter('fe-ch2', 'fe-core',  'CSS Fundamentals',     2, 'Box model, flexbox, grid');
  await upsertChapter('fe-ch3', 'fe-react', 'React Hooks',          1, 'useState, useEffect, custom hooks');
  await upsertChapter('fe-ch4', 'fe-react', 'State Management',     2, 'Context, Redux, Zustand');
  await upsertChapter('fe-ch5', 'fe-perf',  'Web Performance',      1, 'LCP, FID, CLS, lazy loading');
  await upsertChapter('fe-ch6', 'fe-perf',  'Testing Strategies',   2, 'Unit, integration, E2E tests');

  const feTopics = await Promise.all([
    upsertTopic('fe-t1',  'fe-ch1', 'Semantic HTML5',        'Elements and their meaning: article, section, aside, nav.',    1, 35),
    upsertTopic('fe-t2',  'fe-ch1', 'WCAG Accessibility',    'ARIA roles, keyboard navigation, and contrast ratios.',        2, 45),
    upsertTopic('fe-t3',  'fe-ch2', 'Flexbox Layout',        'Main axis, cross axis, flex-grow/shrink/basis.',               1, 40),
    upsertTopic('fe-t4',  'fe-ch2', 'CSS Grid',              'fr units, grid-template-areas, auto-placement.',               2, 45),
    upsertTopic('fe-t5',  'fe-ch3', 'useState & useEffect',  'State updates, deps array, cleanup functions.',                1, 50),
    upsertTopic('fe-t6',  'fe-ch3', 'Custom Hooks',          'Extracting reusable logic into custom hooks.',                 2, 45),
    upsertTopic('fe-t7',  'fe-ch4', 'Context API',           'createContext, Provider, useContext patterns.',                1, 40),
    upsertTopic('fe-t8',  'fe-ch5', 'Core Web Vitals',       'LCP < 2.5s, FID < 100ms, CLS < 0.1 targets.',                1, 40),
    upsertTopic('fe-t9',  'fe-ch6', 'React Testing Library', 'render, fireEvent, getByRole, async queries.',                1, 50),
    upsertTopic('fe-t10', 'fe-ch6', 'Cypress E2E',           'cy.visit, cy.get, cy.intercept, best practices.',              2, 55),
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  //  BACKEND — Subjects / Chapters / Topics
  // ══════════════════════════════════════════════════════════════════════════
  const beApi = await upsertSubject('be-api', 'exam-backend', 'API Design',     '🔌', 1);
  const beDb  = await upsertSubject('be-db',  'exam-backend', 'Databases',       '🗄️', 2);
  const beSec = await upsertSubject('be-sec', 'exam-backend', 'Security & Auth', '🔐', 3);

  await upsertChapter('be-ch1', 'be-api', 'REST Principles',        1, 'HTTP methods, status codes, HATEOAS');
  await upsertChapter('be-ch2', 'be-api', 'GraphQL Fundamentals',   2, 'Schema, resolvers, queries, mutations');
  await upsertChapter('be-ch3', 'be-db',  'SQL & Indexing',         1, 'Joins, indexes, query optimization');
  await upsertChapter('be-ch4', 'be-db',  'NoSQL Databases',        2, 'MongoDB, Redis, use-case selection');
  await upsertChapter('be-ch5', 'be-sec', 'Authentication',         1, 'JWT, OAuth2, sessions');
  await upsertChapter('be-ch6', 'be-sec', 'Common Vulnerabilities', 2, 'OWASP Top 10, input validation');

  const beTopics = await Promise.all([
    upsertTopic('be-t1',  'be-ch1', 'HTTP Methods & Status Codes', 'GET, POST, PUT, PATCH, DELETE and when to use each.',  1, 40),
    upsertTopic('be-t2',  'be-ch1', 'RESTful Resource Design',     'Naming conventions, versioning, pagination.',           2, 45),
    upsertTopic('be-t3',  'be-ch2', 'GraphQL vs REST',             'When to use GraphQL, N+1 problem, DataLoader.',         1, 50),
    upsertTopic('be-t4',  'be-ch3', 'SQL Joins & Subqueries',      'INNER, LEFT, RIGHT joins; correlated subqueries.',      1, 55),
    upsertTopic('be-t5',  'be-ch3', 'Database Indexing',           'B-tree, composite indexes, covering indexes.',          2, 50),
    upsertTopic('be-t6',  'be-ch4', 'MongoDB Schema Design',       'Embedding vs referencing, aggregation pipelines.',      1, 45),
    upsertTopic('be-t7',  'be-ch4', 'Redis Caching Patterns',      'Cache-aside, write-through, TTL strategies.',           2, 40),
    upsertTopic('be-t8',  'be-ch5', 'JWT Authentication',          'Access tokens, refresh tokens, blacklisting.',          1, 50),
    upsertTopic('be-t9',  'be-ch5', 'OAuth2 & OpenID Connect',     'Authorization code flow, PKCE, scopes.',                2, 55),
    upsertTopic('be-t10', 'be-ch6', 'OWASP Top 10',               'Injection, XSS, CSRF, broken auth, and fixes.',          1, 60),
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  //  UI/UX — Subjects / Chapters / Topics
  // ══════════════════════════════════════════════════════════════════════════
  const uiPrinc    = await upsertSubject('ui-princ',    'exam-ui', 'Design Principles',   '🎨', 1);
  const uiResearch = await upsertSubject('ui-research', 'exam-ui', 'User Research',        '🔍', 2);
  const uiTools    = await upsertSubject('ui-tools',    'exam-ui', 'Tools & Prototyping',  '🛠️', 3);

  await upsertChapter('ui-ch1', 'ui-princ',    'Visual Design',          1, 'Typography, colour, hierarchy');
  await upsertChapter('ui-ch2', 'ui-princ',    'Interaction Design',     2, 'Affordances, feedback, mapping');
  await upsertChapter('ui-ch3', 'ui-research', 'Research Methods',       1, 'Interviews, surveys, usability tests');
  await upsertChapter('ui-ch4', 'ui-research', 'Personas & Journey Maps',2, 'Synthesising research into artefacts');
  await upsertChapter('ui-ch5', 'ui-tools',    'Figma',                  1, 'Components, auto layout, variants');
  await upsertChapter('ui-ch6', 'ui-tools',    'Design Systems',         2, 'Tokens, component libraries');

  const uiTopics = await Promise.all([
    upsertTopic('ui-t1',  'ui-ch1', 'Typography Fundamentals', 'Type scale, leading, tracking, pairing fonts.',        1, 40),
    upsertTopic('ui-t2',  'ui-ch1', 'Colour Theory & Contrast','Hue, saturation, WCAG AA/AAA contrast ratios.',        2, 40),
    upsertTopic('ui-t3',  'ui-ch2', 'Gestalt Principles',      'Proximity, similarity, closure, and figure-ground.',   1, 45),
    upsertTopic('ui-t4',  'ui-ch2', 'Microinteractions',       'Triggers, rules, feedback, loops and modes.',          2, 35),
    upsertTopic('ui-t5',  'ui-ch3', 'Usability Testing',       'Moderated vs unmoderated, think-aloud protocol.',      1, 50),
    upsertTopic('ui-t6',  'ui-ch3', 'UX Surveys & Analytics',  'SUS, NPS, heat maps, funnel analysis.',                2, 45),
    upsertTopic('ui-t7',  'ui-ch4', 'User Personas',           'Goal-directed vs proto-personas.',                     1, 40),
    upsertTopic('ui-t8',  'ui-ch5', 'Figma Auto Layout',       'Spacing, padding, fill/hug/fixed sizing modes.',       1, 50),
    upsertTopic('ui-t9',  'ui-ch6', 'Design Tokens',           'Colour, spacing, typography tokens and theming.',      1, 45),
    upsertTopic('ui-t10', 'ui-ch6', 'Component Variants',      'Variant properties, interactive components in Figma.', 2, 45),
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  //  DEVOPS — Subjects / Chapters / Topics
  // ══════════════════════════════════════════════════════════════════════════
  const doContainers = await upsertSubject('do-containers', 'exam-devops', 'Containers & Orchestration', '🐳', 1);
  const doCicd       = await upsertSubject('do-cicd',       'exam-devops', 'CI/CD & Pipelines',          '⚙️', 2);
  const doCloud      = await upsertSubject('do-cloud',      'exam-devops', 'Cloud & Infrastructure',     '☁️', 3);

  await upsertChapter('do-ch1', 'do-containers', 'Docker',             1, 'Images, containers, registries');
  await upsertChapter('do-ch2', 'do-containers', 'Kubernetes',         2, 'Pods, deployments, services');
  await upsertChapter('do-ch3', 'do-cicd',       'Pipeline Design',    1, 'Stages, gates, artefacts');
  await upsertChapter('do-ch4', 'do-cicd',       'GitHub Actions',     2, 'Workflows, runners, secrets');
  await upsertChapter('do-ch5', 'do-cloud',      'AWS Fundamentals',   1, 'EC2, S3, RDS, IAM, VPC');
  await upsertChapter('do-ch6', 'do-cloud',      'IaC with Terraform', 2, 'Providers, resources, state');

  const doTopics = await Promise.all([
    upsertTopic('do-t1',  'do-ch1', 'Docker Images & Containers', 'Layered FS, Dockerfile best practices, multi-stage builds.', 1, 50),
    upsertTopic('do-t2',  'do-ch1', 'Docker Networking',          'Bridge, host, overlay networks; port mapping.',              2, 40),
    upsertTopic('do-t3',  'do-ch2', 'K8s Pods & Deployments',     'ReplicaSets, rolling updates, rollbacks.',                   1, 55),
    upsertTopic('do-t4',  'do-ch2', 'K8s Services & Ingress',     'ClusterIP, NodePort, LoadBalancer, Ingress controllers.',    2, 55),
    upsertTopic('do-t5',  'do-ch3', 'CI/CD Pipeline Patterns',    'Trunk-based dev, blue-green, canary deployments.',           1, 50),
    upsertTopic('do-t6',  'do-ch4', 'GitHub Actions Workflows',   'on: triggers, jobs, steps, matrix builds.',                  1, 45),
    upsertTopic('do-t7',  'do-ch5', 'AWS Core Services',          'EC2 instance types, S3 storage classes, RDS Multi-AZ.',      1, 60),
    upsertTopic('do-t8',  'do-ch5', 'AWS IAM & Security',         'Roles, policies, least-privilege, STS.',                     2, 50),
    upsertTopic('do-t9',  'do-ch6', 'Terraform Basics',           'init, plan, apply, state management, modules.',              1, 55),
    upsertTopic('do-t10', 'do-ch6', 'Terraform Modules',          'Reusable modules, remote state, workspaces.',                2, 50),
  ]);

  // ══════════════════════════════════════════════════════════════════════════
  //  QUESTIONS
  // ══════════════════════════════════════════════════════════════════════════
  const questions = [
    // ── SDE ──────────────────────────────────────────────────────────────
    { id:'q-sde-1',  examId:'exam-sde', topicId:'sde-t1', subjectId:'sde-dsa', difficulty:'EASY',
      text:'What is the time complexity of the two-pointer technique on a sorted array?',
      options:{A:'O(n²)',B:'O(n log n)',C:'O(n)',D:'O(1)'}, answer:'C',
      explanation:'Each pointer moves at most n steps, giving O(n) total.' },
    { id:'q-sde-2',  examId:'exam-sde', topicId:'sde-t1', subjectId:'sde-dsa', difficulty:'MEDIUM',
      text:'Which problem is best solved with the two-pointer approach?',
      options:{A:'Finding a pair summing to target in a sorted array',B:'Finding the maximum subarray sum',C:'Counting inversions',D:'Finding all permutations'}, answer:'A',
      explanation:'Two pointers work best on sorted arrays to find pairs efficiently.' },
    { id:'q-sde-3',  examId:'exam-sde', topicId:'sde-t1', subjectId:'sde-dsa', difficulty:'HARD',
      text:'In the 3-sum problem, what is the optimised time complexity using two pointers?',
      options:{A:'O(n)',B:'O(n log n)',C:'O(n²)',D:'O(n³)'}, answer:'C',
      explanation:'Sort O(n log n) + for each element run two-pointer O(n) = O(n²) total.' },
    { id:'q-sde-4',  examId:'exam-sde', topicId:'sde-t2', subjectId:'sde-dsa', difficulty:'EASY',
      text:'What type of problem does a fixed-size sliding window solve?',
      options:{A:'Finding max/min/sum over k consecutive elements',B:'Sorting elements',C:'Graph traversal',D:'Tree balancing'}, answer:'A',
      explanation:'Fixed windows slide across arrays to track stats over k elements in O(n).' },
    { id:'q-sde-5',  examId:'exam-sde', topicId:'sde-t4', subjectId:'sde-dsa', difficulty:'EASY',
      text:'What traversal of a BST produces elements in sorted order?',
      options:{A:'Pre-order',B:'Post-order',C:'In-order',D:'Level-order'}, answer:'C',
      explanation:'In-order (left → root → right) yields sorted output from a BST.' },
    { id:'q-sde-6',  examId:'exam-sde', topicId:'sde-t5', subjectId:'sde-dsa', difficulty:'EASY',
      text:'Which data structure does BFS use?',
      options:{A:'Stack',B:'Queue',C:'Heap',D:'Set'}, answer:'B',
      explanation:'BFS uses a queue (FIFO) to explore nodes level by level.' },
    { id:'q-sde-7',  examId:'exam-sde', topicId:'sde-t5', subjectId:'sde-dsa', difficulty:'MEDIUM',
      text:'BFS finds the shortest path in which type of graph?',
      options:{A:'Weighted directed',B:'Unweighted undirected',C:'Negative weight',D:'Sparse DAG'}, answer:'B',
      explanation:'BFS guarantees shortest path only in unweighted graphs.' },
    { id:'q-sde-8',  examId:'exam-sde', topicId:'sde-t5', subjectId:'sde-dsa', difficulty:'HARD',
      text:'Time complexity of DFS on a graph with V vertices and E edges?',
      options:{A:'O(V)',B:'O(E)',C:'O(V + E)',D:'O(V × E)'}, answer:'C',
      explanation:'DFS visits every vertex and edge exactly once: O(V + E).' },
    { id:'q-sde-9',  examId:'exam-sde', topicId:'sde-t7', subjectId:'sde-dsa', difficulty:'MEDIUM',
      text:'In the 0/1 knapsack problem, what does "0/1" mean?',
      options:{A:'Items can be split',B:'Each item is either taken or not',C:'Only 0 or 1 items exist',D:'Values are binary'}, answer:'B',
      explanation:'Each item must be fully included or excluded — no fractions.' },
    { id:'q-sde-10', examId:'exam-sde', topicId:'sde-t7', subjectId:'sde-dsa', difficulty:'HARD',
      text:'Space-optimised 0/1 knapsack DP runs in what space complexity?',
      options:{A:'O(n²)',B:'O(n × W)',C:'O(W)',D:'O(n)'}, answer:'C',
      explanation:'Using a 1D array and iterating backwards reduces space to O(W).' },
    // ── Frontend ─────────────────────────────────────────────────────────
    { id:'q-fe-1',  examId:'exam-frontend', topicId:'fe-t1', subjectId:'fe-core', difficulty:'EASY',
      text:'Which HTML element represents a self-contained piece of content?',
      options:{A:'<section>',B:'<article>',C:'<aside>',D:'<div>'}, answer:'B',
      explanation:'<article> is for independent, self-contained content like a blog post.' },
    { id:'q-fe-2',  examId:'exam-frontend', topicId:'fe-t2', subjectId:'fe-core', difficulty:'MEDIUM',
      text:'What is the minimum contrast ratio for normal text under WCAG AA?',
      options:{A:'2.5:1',B:'3:1',C:'4.5:1',D:'7:1'}, answer:'C',
      explanation:'WCAG AA requires 4.5:1 for normal text, 3:1 for large text.' },
    { id:'q-fe-3',  examId:'exam-frontend', topicId:'fe-t3', subjectId:'fe-core', difficulty:'EASY',
      text:'In flexbox, which property controls spacing along the main axis?',
      options:{A:'align-items',B:'justify-content',C:'align-content',D:'flex-direction'}, answer:'B',
      explanation:'justify-content distributes space along the main axis.' },
    { id:'q-fe-4',  examId:'exam-frontend', topicId:'fe-t4', subjectId:'fe-core', difficulty:'MEDIUM',
      text:'What does the CSS Grid value "fr" represent?',
      options:{A:'Fixed ratio',B:'Fractional unit of available space',C:'Font-relative unit',D:'Frame unit'}, answer:'B',
      explanation:'fr is a fractional unit dividing remaining space proportionally.' },
    { id:'q-fe-5',  examId:'exam-frontend', topicId:'fe-t5', subjectId:'fe-react', difficulty:'EASY',
      text:'When does useEffect run by default (no dependency array)?',
      options:{A:'Only on mount',B:'Only on unmount',C:'After every render',D:'Never'}, answer:'C',
      explanation:'Without a dependency array, useEffect runs after every render.' },
    { id:'q-fe-6',  examId:'exam-frontend', topicId:'fe-t5', subjectId:'fe-react', difficulty:'MEDIUM',
      text:'What does the cleanup function returned from useEffect do?',
      options:{A:'Runs before the next effect or unmount',B:'Runs only on unmount',C:'Runs before every render',D:'Cancels all state updates'}, answer:'A',
      explanation:'The cleanup runs before the next effect execution and on unmount.' },
    { id:'q-fe-7',  examId:'exam-frontend', topicId:'fe-t7', subjectId:'fe-react', difficulty:'MEDIUM',
      text:'What problem does the Context API solve?',
      options:{A:'Async data fetching',B:'Prop drilling',C:'Route management',D:'DOM manipulation'}, answer:'B',
      explanation:'Context lets you pass data through the tree without prop drilling.' },
    { id:'q-fe-8',  examId:'exam-frontend', topicId:'fe-t8', subjectId:'fe-perf', difficulty:'MEDIUM',
      text:'What is the "good" threshold for Largest Contentful Paint (LCP)?',
      options:{A:'Under 1 second',B:'Under 2.5 seconds',C:'Under 4 seconds',D:'Under 5 seconds'}, answer:'B',
      explanation:'Google defines a good LCP as 2.5 seconds or less.' },
    { id:'q-fe-9',  examId:'exam-frontend', topicId:'fe-t9', subjectId:'fe-perf', difficulty:'EASY',
      text:'Which React Testing Library query should you prefer for accessibility?',
      options:{A:'getByTestId',B:'getByClassName',C:'getByRole',D:'getByIndex'}, answer:'C',
      explanation:'getByRole mirrors how assistive technology accesses elements.' },
    { id:'q-fe-10', examId:'exam-frontend', topicId:'fe-t4', subjectId:'fe-core', difficulty:'HARD',
      text:'How do you place an item in row 2, spanning columns 1–3 in CSS Grid?',
      options:{A:'grid-area: 2 / 1 / 3 / 3',B:'grid-area: 2 / 1 / 3 / 4',C:'grid-column: 1 / 3; grid-row: 2',D:'grid-column: 1 / span 3; grid-row: 2'}, answer:'D',
      explanation:'grid-column: 1 / span 3 spans 3 columns; grid-row: 2 places it in row 2.' },
    // ── Backend ──────────────────────────────────────────────────────────
    { id:'q-be-1',  examId:'exam-backend', topicId:'be-t1', subjectId:'be-api', difficulty:'EASY',
      text:'Which HTTP method is idempotent but NOT safe?',
      options:{A:'GET',B:'POST',C:'PUT',D:'DELETE'}, answer:'C',
      explanation:'PUT is idempotent (same result repeated) but changes state, so not safe.' },
    { id:'q-be-2',  examId:'exam-backend', topicId:'be-t1', subjectId:'be-api', difficulty:'MEDIUM',
      text:'What HTTP status code means "resource created successfully"?',
      options:{A:'200',B:'201',C:'204',D:'202'}, answer:'B',
      explanation:'201 Created is the correct response for a successful POST that creates a resource.' },
    { id:'q-be-3',  examId:'exam-backend', topicId:'be-t2', subjectId:'be-api', difficulty:'MEDIUM',
      text:'What is the recommended way to version a REST API?',
      options:{A:'Query param: ?version=1',B:'URL path: /api/v1/',C:'Header: X-API-Version: 1',D:'Request body field'}, answer:'B',
      explanation:'URL path versioning (/v1/) is the most widely adopted and visible approach.' },
    { id:'q-be-4',  examId:'exam-backend', topicId:'be-t4', subjectId:'be-db', difficulty:'EASY',
      text:'Which JOIN returns only rows with matching values in both tables?',
      options:{A:'LEFT JOIN',B:'RIGHT JOIN',C:'INNER JOIN',D:'FULL OUTER JOIN'}, answer:'C',
      explanation:'INNER JOIN returns the intersection — rows present in both tables.' },
    { id:'q-be-5',  examId:'exam-backend', topicId:'be-t5', subjectId:'be-db', difficulty:'MEDIUM',
      text:'What type of index stores all queried columns, avoiding a table lookup?',
      options:{A:'Partial index',B:'Covering index',C:'Clustered index',D:'Bitmap index'}, answer:'B',
      explanation:'A covering index satisfies a query entirely from the index without touching the table.' },
    { id:'q-be-6',  examId:'exam-backend', topicId:'be-t8', subjectId:'be-sec', difficulty:'EASY',
      text:'What are the three parts of a JWT?',
      options:{A:'Header, Payload, Signature',B:'Key, Value, Hash',C:'Issuer, Subject, Audience',D:'Token, Secret, Expiry'}, answer:'A',
      explanation:'JWTs consist of Base64URL-encoded Header.Payload.Signature.' },
    { id:'q-be-7',  examId:'exam-backend', topicId:'be-t10', subjectId:'be-sec', difficulty:'MEDIUM',
      text:'Which OWASP attack injects malicious code into a database query?',
      options:{A:'XSS',B:'CSRF',C:'SQL Injection',D:'SSRF'}, answer:'C',
      explanation:'SQL Injection manipulates database queries via unsanitised user input.' },
    { id:'q-be-8',  examId:'exam-backend', topicId:'be-t3', subjectId:'be-api', difficulty:'HARD',
      text:'What is the N+1 problem in GraphQL?',
      options:{A:'Sending N+1 concurrent requests',B:'Each item in a list triggers an extra database query',C:'Pagination returning N+1 results',D:'Resolver nesting beyond depth 1'}, answer:'B',
      explanation:'Each list item triggers a separate DB call. DataLoader solves this by batching.' },
    { id:'q-be-9',  examId:'exam-backend', topicId:'be-t7', subjectId:'be-db', difficulty:'MEDIUM',
      text:'In cache-aside (lazy loading) pattern, when is the cache populated?',
      options:{A:'On every write to the DB',B:'On application startup',C:'On a cache miss',D:'On a scheduled job'}, answer:'C',
      explanation:'Cache-aside populates the cache only when data is requested and not found (miss).' },
    { id:'q-be-10', examId:'exam-backend', topicId:'be-t9', subjectId:'be-sec', difficulty:'HARD',
      text:'In OAuth2 Authorization Code flow with PKCE, what does the code_verifier protect against?',
      options:{A:'Token expiry',B:'Replay attacks',C:'Authorization code interception',D:'Scope escalation'}, answer:'C',
      explanation:'PKCE ensures that even if the auth code is intercepted, it cannot be exchanged without the verifier.' },
    // ── UI/UX ────────────────────────────────────────────────────────────
    { id:'q-ui-1',  examId:'exam-ui', topicId:'ui-t1', subjectId:'ui-princ', difficulty:'EASY',
      text:'What term describes visible size difference between text elements to show importance?',
      options:{A:'Kerning',B:'Leading',C:'Type hierarchy',D:'Tracking'}, answer:'C',
      explanation:'Type hierarchy uses size, weight, and colour to rank visual importance.' },
    { id:'q-ui-2',  examId:'exam-ui', topicId:'ui-t2', subjectId:'ui-princ', difficulty:'MEDIUM',
      text:'WCAG AAA requires a contrast ratio of at least:',
      options:{A:'3:1',B:'4.5:1',C:'7:1',D:'10:1'}, answer:'C',
      explanation:'WCAG AAA requires 7:1 for normal text, a stricter standard than AA.' },
    { id:'q-ui-3',  examId:'exam-ui', topicId:'ui-t3', subjectId:'ui-princ', difficulty:'EASY',
      text:'Which Gestalt principle explains why items placed close together are perceived as a group?',
      options:{A:'Similarity',B:'Continuity',C:'Proximity',D:'Closure'}, answer:'C',
      explanation:'The Gestalt principle of proximity: nearby objects are seen as related.' },
    { id:'q-ui-4',  examId:'exam-ui', topicId:'ui-t5', subjectId:'ui-research', difficulty:'MEDIUM',
      text:'What is the "think-aloud" protocol in usability testing?',
      options:{A:'Users write feedback after testing',B:'Users verbalize thoughts while completing tasks',C:'Researcher talks during the session',D:'Automated voice recording analysis'}, answer:'B',
      explanation:'Think-aloud captures users\' real-time cognitive process during task completion.' },
    { id:'q-ui-5',  examId:'exam-ui', topicId:'ui-t8', subjectId:'ui-tools', difficulty:'EASY',
      text:'In Figma Auto Layout, what does "hug contents" mean for a frame?',
      options:{A:'Frame has fixed dimensions',B:'Frame fills the parent container',C:'Frame shrinks to fit its contents',D:'Frame clips overflow'}, answer:'C',
      explanation:'"Hug contents" makes the frame size itself to wrap tightly around its children.' },
    { id:'q-ui-6',  examId:'exam-ui', topicId:'ui-t9', subjectId:'ui-tools', difficulty:'MEDIUM',
      text:'What is the primary purpose of design tokens in a design system?',
      options:{A:'Store component code',B:'Define reusable style values (colours, spacing)',C:'Generate documentation',D:'Track version history'}, answer:'B',
      explanation:'Design tokens are named values for shared styles, enabling consistent theming.' },
    { id:'q-ui-7',  examId:'exam-ui', topicId:'ui-t4', subjectId:'ui-princ', difficulty:'MEDIUM',
      text:'What are the four components of a microinteraction?',
      options:{A:'Trigger, Rules, Feedback, Loops & Modes',B:'Input, Process, Output, Error',C:'State, Action, Transition, End',D:'Start, Middle, End, Loop'}, answer:'A',
      explanation:'Dan Saffer\'s model: Trigger → Rules → Feedback → Loops & Modes.' },
    { id:'q-ui-8',  examId:'exam-ui', topicId:'ui-t7', subjectId:'ui-research', difficulty:'MEDIUM',
      text:'What distinguishes a proto-persona from a research-based persona?',
      options:{A:'Proto-personas use real data',B:'Proto-personas are hypothesis-based, not from research',C:'Proto-personas include demographic data only',D:'Proto-personas are validated by users'}, answer:'B',
      explanation:'Proto-personas are created from assumptions when research hasn\'t been done yet.' },
    // ── DevOps ───────────────────────────────────────────────────────────
    { id:'q-do-1',  examId:'exam-devops', topicId:'do-t1', subjectId:'do-containers', difficulty:'EASY',
      text:'What is the correct command to build a Docker image from a Dockerfile?',
      options:{A:'docker run -build',B:'docker build -t myapp .',C:'docker create myapp',D:'docker image run .'}, answer:'B',
      explanation:'docker build -t tags the image with a name; the . specifies the build context.' },
    { id:'q-do-2',  examId:'exam-devops', topicId:'do-t1', subjectId:'do-containers', difficulty:'MEDIUM',
      text:'What is the benefit of multi-stage Docker builds?',
      options:{A:'Run multiple containers simultaneously',B:'Reduce final image size by excluding build tools',C:'Enable parallel layer downloads',D:'Support multiple base OS layers'}, answer:'B',
      explanation:'Multi-stage builds copy only necessary artefacts, keeping the final image lean.' },
    { id:'q-do-3',  examId:'exam-devops', topicId:'do-t3', subjectId:'do-containers', difficulty:'EASY',
      text:'What is the smallest deployable unit in Kubernetes?',
      options:{A:'Container',B:'Node',C:'Pod',D:'Deployment'}, answer:'C',
      explanation:'A Pod is the smallest unit — it wraps one or more containers.' },
    { id:'q-do-4',  examId:'exam-devops', topicId:'do-t4', subjectId:'do-containers', difficulty:'MEDIUM',
      text:'Which Kubernetes Service type exposes a service internally within the cluster only?',
      options:{A:'NodePort',B:'LoadBalancer',C:'ExternalName',D:'ClusterIP'}, answer:'D',
      explanation:'ClusterIP is the default type — only accessible within the cluster.' },
    { id:'q-do-5',  examId:'exam-devops', topicId:'do-t5', subjectId:'do-cicd', difficulty:'MEDIUM',
      text:'In a blue-green deployment, what does "green" represent?',
      options:{A:'The old production environment',B:'The new version being deployed',C:'The staging environment',D:'Canary traffic percentage'}, answer:'B',
      explanation:'Blue is live production; green is the new version. Traffic switches after validation.' },
    { id:'q-do-6',  examId:'exam-devops', topicId:'do-t7', subjectId:'do-cloud', difficulty:'EASY',
      text:'What does AWS IAM stand for?',
      options:{A:'Internet Access Manager',B:'Identity and Access Management',C:'Internal Application Monitor',D:'Integrated Auth Module'}, answer:'B',
      explanation:'IAM controls who can access AWS resources and what actions they can perform.' },
    { id:'q-do-7',  examId:'exam-devops', topicId:'do-t9', subjectId:'do-cloud', difficulty:'MEDIUM',
      text:'What does "terraform plan" do?',
      options:{A:'Creates infrastructure immediately',B:'Shows what changes Terraform will make without applying them',C:'Validates syntax only',D:'Destroys existing resources'}, answer:'B',
      explanation:'terraform plan is a dry run showing the diff between current and desired state.' },
    { id:'q-do-8',  examId:'exam-devops', topicId:'do-t9', subjectId:'do-cloud', difficulty:'HARD',
      text:'What happens to Terraform state when two people run "terraform apply" simultaneously without locking?',
      options:{A:'Both succeed independently',B:'State file corruption or conflict',C:'Terraform auto-merges changes',D:'The second apply always wins'}, answer:'B',
      explanation:'Without state locking (e.g., S3 + DynamoDB), concurrent applies can corrupt state.' },
    { id:'q-do-9',  examId:'exam-devops', topicId:'do-t6', subjectId:'do-cicd', difficulty:'MEDIUM',
      text:'In GitHub Actions, what does a matrix strategy allow?',
      options:{A:'Running a job across multiple OS or dependency versions',B:'Deploying to multiple cloud providers',C:'Triggering multiple workflows simultaneously',D:'Sharing secrets between repositories'}, answer:'A',
      explanation:'Matrix builds run the same job with different combinations of variables (e.g., node versions).' },
    { id:'q-do-10', examId:'exam-devops', topicId:'do-t8', subjectId:'do-cloud', difficulty:'HARD',
      text:'What is the principle of least privilege in AWS IAM?',
      options:{A:'Grant all permissions by default and remove as needed',B:'Grant only the permissions required to perform a task',C:'Use root credentials for admin tasks',D:'Share IAM roles across all services'}, answer:'B',
      explanation:'PoLP minimises security risk by granting only the minimum necessary permissions.' },
  ];

  for (const q of questions) {
    await prisma.question.upsert({ where: { id: q.id }, update: {}, create: q });
  }

  // ══════════════════════════════════════════════════════════════════════════
  //  ACTIVITY: Streaks, study sessions, progress, test sessions
  // ══════════════════════════════════════════════════════════════════════════

  const subjectsByExam = {
    'exam-sde':      [sdeDsa, sdeSd, sdeBeh],
    'exam-frontend': [feCore, feReact, fePer],
    'exam-backend':  [beApi, beDb, beSec],
    'exam-ui':       [uiPrinc, uiResearch, uiTools],
    'exam-devops':   [doContainers, doCicd, doCloud],
  };

  const topicsByExam = {
    'exam-sde':      sdeTopics,
    'exam-frontend': feTopics,
    'exam-backend':  beTopics,
    'exam-ui':       uiTopics,
    'exam-devops':   doTopics,
  };

  const questionIdsByExam = {
    'exam-sde':      ['q-sde-1','q-sde-2','q-sde-3','q-sde-4','q-sde-5','q-sde-6','q-sde-7','q-sde-8','q-sde-9','q-sde-10'],
    'exam-frontend': ['q-fe-1','q-fe-2','q-fe-3','q-fe-4','q-fe-5','q-fe-6','q-fe-7','q-fe-8','q-fe-9','q-fe-10'],
    'exam-backend':  ['q-be-1','q-be-2','q-be-3','q-be-4','q-be-5','q-be-6','q-be-7','q-be-8','q-be-9','q-be-10'],
    'exam-ui':       ['q-ui-1','q-ui-2','q-ui-3','q-ui-4','q-ui-5','q-ui-6','q-ui-7','q-ui-8'],
    'exam-devops':   ['q-do-1','q-do-2','q-do-3','q-do-4','q-do-5','q-do-6','q-do-7','q-do-8','q-do-9','q-do-10'],
  };

  for (const student of students) {
    const examId   = student.targetExam ?? 'exam-sde';
    const subjects = subjectsByExam[examId] ?? subjectsByExam['exam-sde'];
    const topics   = topicsByExam[examId]   ?? topicsByExam['exam-sde'];
    const qIds     = questionIdsByExam[examId] ?? questionIdsByExam['exam-sde'];

    // ── Streak (lastActiveDate = past date based on student config) ──────
    const lastActive    = daysAgo(student.lastActiveDaysAgo);
    const streakLength  = rand(1, 30);
    await prisma.streak.upsert({
      where:  { userId: student.id },
      update: { currentStreak: streakLength, longestStreak: streakLength + rand(0,10), lastActiveDate: lastActive },
      create: { userId: student.id, currentStreak: streakLength, longestStreak: streakLength + rand(0,10), lastActiveDate: lastActive },
    });

    // ── Study sessions spread across past 30 days ────────────────────────
    const sessionCount = rand(4, 12);
    for (let i = 0; i < sessionCount; i++) {
      await prisma.studySession.create({
        data: {
          userId:      student.id,
          subjectId:   pick(subjects).id,
          date:        randPast(1, 30),
          durationMins: rand(20, 120),
        },
      });
    }

    // ── UserProgress ─────────────────────────────────────────────────────
    const shuffled       = shuffle(topics);
    const completedCount = rand(1, Math.min(4, shuffled.length));
    for (let i = 0; i < shuffled.length; i++) {
      const status = i < completedCount ? 'COMPLETED'
                   : i < completedCount + 2 ? 'IN_PROGRESS'
                   : 'NOT_STARTED';
      await prisma.userProgress.upsert({
        where:  { userId_topicId: { userId: student.id, topicId: shuffled[i].id } },
        update: { status, updatedAt: randPast(1, 20) },
        create: { userId: student.id, topicId: shuffled[i].id, status, updatedAt: randPast(1, 20) },
      });
    }

    // ── One completed test session ────────────────────────────────────────
    const shuffledQ = shuffle(qIds);
    const testQIds  = shuffledQ.slice(0, Math.min(5, shuffledQ.length));
    const qs        = await prisma.question.findMany({ where: { id: { in: testQIds } }, select: { id: true, answer: true } });
    const score     = rand(40, 100);
    const startedAt = randPast(2, 14);
    const submitted = new Date(startedAt.getTime() + rand(300, 1800) * 1000);

    const ts = await prisma.testSession.create({
      data: {
        userId: student.id, examId,
        totalQuestions: testQIds.length, questionIds: testQIds,
        status: 'COMPLETED', score,
        startedAt, submittedAt: submitted,
        timeTakenSecs: rand(300, 1800),
      },
    });

    for (const q of qs) {
      const correct = Math.random() < score / 100;
      const answer  = correct ? q.answer : pick(['A','B','C','D'].filter(x => x !== q.answer));
      await prisma.testAnswer.create({
        data: { sessionId: ts.id, questionId: q.id, selectedAnswer: answer, isCorrect: correct },
      });
    }
  }

  console.log(`✅ Seed complete — 1 admin + ${students.length} students, 5 exams`);
  console.log('   Admin:   admin@examprep.com / Admin@123');
  console.log('   Student: alice@example.com  / Student@123');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

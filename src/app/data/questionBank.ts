/**
 * Curated Manual Question Bank
 * Each domain exposes a maximum of 20 questions per difficulty level.
 */

import type { Question } from './questions';
import { getDomainById as getDomainConfigById } from './domains.config';
import { MAX_QUESTIONS_PER_LEVEL } from './manualInterview.config';

type QuestionSeed = Omit<Question, 'expectedAnswer'> & { expectedAnswer?: string };

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

type FocusArea = {
  title: string;
  keywords: string[];
  expectedAnswer: string;
};

const DOMAIN_WORD_SPLIT_PATTERN = /[,/+]/;
const GENERIC_ROLE_TERMS = new Set([
  'administrator',
  'analyst',
  'architect',
  'consultant',
  'designer',
  'developer',
  'engineer',
  'executive',
  'lead',
  'manager',
  'officer',
  'planner',
  'specialist',
  'technician',
]);

const GENERATED_FOCUS_AREAS: Record<DifficultyLevel, FocusArea[]> = {
  beginner: [
    { title: 'core purpose', keywords: ['purpose', 'use case', 'role'], expectedAnswer: 'what it is, why it matters, and where it is used' },
    { title: 'basic workflow', keywords: ['workflow', 'steps', 'process'], expectedAnswer: 'the main steps in a basic workflow and how they fit together' },
    { title: 'foundational concepts', keywords: ['fundamentals', 'basics', 'concepts'], expectedAnswer: 'the core concepts a beginner must understand' },
    { title: 'key components', keywords: ['components', 'parts', 'modules'], expectedAnswer: 'the major parts involved and what each one does' },
    { title: 'practical usage', keywords: ['usage', 'implementation', 'example'], expectedAnswer: 'a simple example of how it is used in practice' },
    { title: 'best practices', keywords: ['best practices', 'guidelines', 'standards'], expectedAnswer: 'basic best practices and common mistakes to avoid' },
    { title: 'problem solving', keywords: ['problem solving', 'issues', 'debugging'], expectedAnswer: 'the common problems it solves and how to approach them' },
    { title: 'data flow', keywords: ['data flow', 'input', 'output'], expectedAnswer: 'how information moves through the process from input to output' },
    { title: 'tooling', keywords: ['tools', 'setup', 'environment'], expectedAnswer: 'what tools or setup are typically needed and why' },
    { title: 'real-world relevance', keywords: ['business value', 'impact', 'real world'], expectedAnswer: 'how the concept creates value in real projects or business scenarios' },
  ],
  intermediate: [
    { title: 'design trade-offs', keywords: ['trade-offs', 'choices', 'constraints'], expectedAnswer: 'the main trade-offs, constraints, and how to choose the right approach' },
    { title: 'performance', keywords: ['performance', 'optimization', 'latency'], expectedAnswer: 'how performance is affected and what optimizations are commonly used' },
    { title: 'scalability', keywords: ['scalability', 'growth', 'throughput'], expectedAnswer: 'how the approach behaves as usage grows and how to scale it' },
    { title: 'debugging strategy', keywords: ['debugging', 'troubleshooting', 'diagnostics'], expectedAnswer: 'a practical debugging strategy and what signals or logs to inspect' },
    { title: 'testing', keywords: ['testing', 'validation', 'quality'], expectedAnswer: 'how to test it and validate correctness or quality' },
    { title: 'security', keywords: ['security', 'risk', 'protection'], expectedAnswer: 'the security considerations, risks, and mitigation techniques' },
    { title: 'maintainability', keywords: ['maintainability', 'refactor', 'readability'], expectedAnswer: 'how to keep the solution maintainable as the codebase grows' },
    { title: 'integration', keywords: ['integration', 'dependencies', 'communication'], expectedAnswer: 'how it integrates with surrounding systems or dependencies' },
    { title: 'monitoring', keywords: ['monitoring', 'metrics', 'observability'], expectedAnswer: 'what should be monitored and which metrics matter most' },
    { title: 'failure handling', keywords: ['failure', 'fallback', 'recovery'], expectedAnswer: 'common failure modes and how to recover or degrade gracefully' },
  ],
  advanced: [
    { title: 'architecture', keywords: ['architecture', 'system design', 'components'], expectedAnswer: 'the architecture decisions, components involved, and why the design works' },
    { title: 'distributed systems', keywords: ['distributed', 'consistency', 'coordination'], expectedAnswer: 'how the concept behaves in distributed environments and the trade-offs involved' },
    { title: 'resilience', keywords: ['resilience', 'availability', 'fault tolerance'], expectedAnswer: 'how to keep the system resilient, available, and fault tolerant' },
    { title: 'cost efficiency', keywords: ['cost', 'efficiency', 'resource usage'], expectedAnswer: 'how to optimize cost and resource usage without sacrificing quality' },
    { title: 'advanced optimization', keywords: ['optimization', 'bottlenecks', 'profiling'], expectedAnswer: 'where bottlenecks appear and how to optimize them using evidence' },
    { title: 'governance', keywords: ['governance', 'compliance', 'standards'], expectedAnswer: 'what governance or compliance concerns apply and how to address them' },
    { title: 'migration strategy', keywords: ['migration', 'rollout', 'backward compatibility'], expectedAnswer: 'a migration or rollout plan that manages risk and compatibility' },
    { title: 'incident response', keywords: ['incident', 'response', 'recovery'], expectedAnswer: 'how to diagnose incidents, recover safely, and prevent repeat failures' },
    { title: 'leadership decisions', keywords: ['leadership', 'stakeholders', 'prioritization'], expectedAnswer: 'how to explain the decision to stakeholders and prioritize the right solution' },
    { title: 'future-proofing', keywords: ['future-proofing', 'extensibility', 'roadmap'], expectedAnswer: 'how to make the solution extensible and ready for future needs' },
  ],
};

function formatKeywordList(keywords: string[]) {
  if (keywords.length === 1) return keywords[0];
  if (keywords.length === 2) return `${keywords[0]} and ${keywords[1]}`;
  return `${keywords.slice(0, -1).join(', ')}, and ${keywords[keywords.length - 1]}`;
}

function createExpectedAnswer(question: QuestionSeed) {
  if (question.expectedAnswer) return question.expectedAnswer;

  const keyConcepts = formatKeywordList(question.keywords.slice(0, 4));
  return `A strong answer should directly explain ${question.text
    .replace(/\?$/, '')
    .toLowerCase()} and cover ${keyConcepts}.`;
}

function finalizeQuestions(questions: QuestionSeed[]): Question[] {
  return questions.slice(0, MAX_QUESTIONS_PER_LEVEL).map((question) => {
    const concepts = uniqueStrings([
      ...question.keywords,
      ...question.text
        .replace(/[^\w+#.\s-]/g, ' ')
        .split(' ')
        .map((token) => token.trim().toLowerCase())
        .filter((token) => token.length > 4),
    ]).slice(0, 10);

    return {
      ...question,
      concepts,
      expectedAnswer: createExpectedAnswer(question),
      weightedKeywords: question.keywords.map((term, index) => ({
        term,
        weight: index < 2 ? 1.5 : 1,
      })),
    };
  });
}

function extractDomainSkills(domainId: string) {
  const domainConfig = getDomainConfigById(domainId);
  const descriptionTokens = domainConfig?.description
    .split(DOMAIN_WORD_SPLIT_PATTERN)
    .map((token) => token.trim())
    .filter(Boolean);
  const nameTokens = domainConfig?.name
    .split(' ')
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !GENERIC_ROLE_TERMS.has(token.toLowerCase())) || [];
  const descriptionTokenLookup = new Set((descriptionTokens || []).map((token) => token.toLowerCase()));
  const specificNameTokens = nameTokens.filter((token) => {
    const normalizedToken = token.toLowerCase();
    return !Array.from(descriptionTokenLookup).some((descriptionToken) =>
      descriptionToken.includes(normalizedToken),
    );
  });

  return uniqueStrings([
    ...(descriptionTokens || []),
    ...specificNameTokens,
    domainConfig?.name || domainId,
  ]).slice(0, 6);
}

function uniqueStrings(values: string[]) {
  return Array.from(
    new Set(
      values.map((value) => value.trim()).filter(Boolean),
    ),
  );
}

// Frontend Developer - curated source set; finalizeQuestions exposes the first 20 per level.
export const frontendQuestions = {
  beginner: finalizeQuestions([
    // HTML Basics (10 questions)
    { id: 'fe-b-1', text: 'What is HTML and what is its purpose in web development?', keywords: ['markup', 'structure', 'elements', 'tags', 'web'], expectedLength: 50 },
    { id: 'fe-b-2', text: 'Explain the difference between <div> and <span> tags.', keywords: ['block', 'inline', 'container', 'element'], expectedLength: 40 },
    { id: 'fe-b-3', text: 'What is the purpose of semantic HTML tags?', keywords: ['meaning', 'accessibility', 'SEO', 'readability'], expectedLength: 45 },
    { id: 'fe-b-4', text: 'How do you create a hyperlink in HTML?', keywords: ['anchor', 'href', 'link', 'tag'], expectedLength: 35 },
    { id: 'fe-b-5', text: 'What are HTML forms and how do they work?', keywords: ['input', 'submit', 'data', 'action', 'method'], expectedLength: 50 },
    { id: 'fe-b-6', text: 'Explain the purpose of the <meta> tag.', keywords: ['metadata', 'charset', 'viewport', 'description'], expectedLength: 40 },
    { id: 'fe-b-7', text: 'What is the difference between HTML and XHTML?', keywords: ['strict', 'syntax', 'closing', 'rules'], expectedLength: 45 },
    { id: 'fe-b-8', text: 'How do you add images to a webpage?', keywords: ['img', 'src', 'alt', 'attribute'], expectedLength: 35 },
    { id: 'fe-b-9', text: 'What are HTML attributes?', keywords: ['properties', 'values', 'customize', 'elements'], expectedLength: 40 },
    { id: 'fe-b-10', text: 'Explain the difference between <head> and <body> tags.', keywords: ['metadata', 'content', 'visible', 'document'], expectedLength: 45 },
    
    // CSS Basics (15 questions)
    { id: 'fe-b-11', text: 'What is CSS and why is it used?', keywords: ['styling', 'presentation', 'design', 'layout'], expectedLength: 40 },
    { id: 'fe-b-12', text: 'Explain the difference between class and id in CSS.', keywords: ['selector', 'unique', 'multiple', 'styling'], expectedLength: 40 },
    { id: 'fe-b-13', text: 'What is the box model in CSS?', keywords: ['margin', 'padding', 'border', 'content'], expectedLength: 50 },
    { id: 'fe-b-14', text: 'How do you center a div horizontally?', keywords: ['margin', 'auto', 'flexbox', 'centering'], expectedLength: 40 },
    { id: 'fe-b-15', text: 'What is the difference between padding and margin?', keywords: ['space', 'inside', 'outside', 'border'], expectedLength: 40 },
    { id: 'fe-b-16', text: 'How do you include CSS in an HTML file?', keywords: ['inline', 'internal', 'external', 'link', 'style'], expectedLength: 45 },
    { id: 'fe-b-17', text: 'What are CSS selectors?', keywords: ['target', 'elements', 'class', 'id', 'tag'], expectedLength: 40 },
    { id: 'fe-b-18', text: 'Explain the display property in CSS.', keywords: ['block', 'inline', 'flex', 'grid', 'none'], expectedLength: 45 },
    { id: 'fe-b-19', text: 'What is the position property in CSS?', keywords: ['static', 'relative', 'absolute', 'fixed', 'sticky'], expectedLength: 50 },
    { id: 'fe-b-20', text: 'How do you change the background color of an element?', keywords: ['background-color', 'property', 'color', 'value'], expectedLength: 35 },
    { id: 'fe-b-21', text: 'What are CSS pseudo-classes?', keywords: ['hover', 'active', 'focus', 'state', 'selector'], expectedLength: 40 },
    { id: 'fe-b-22', text: 'Explain z-index in CSS.', keywords: ['stacking', 'order', 'layer', 'positioning'], expectedLength: 40 },
    { id: 'fe-b-23', text: 'What is the float property?', keywords: ['wrap', 'text', 'left', 'right', 'clear'], expectedLength: 40 },
    { id: 'fe-b-24', text: 'How do you make text bold in CSS?', keywords: ['font-weight', 'bold', 'property'], expectedLength: 30 },
    { id: 'fe-b-25', text: 'What are CSS units?', keywords: ['px', 'em', 'rem', '%', 'vh', 'vw'], expectedLength: 40 },
    
    // JavaScript Basics (25 questions)
    { id: 'fe-b-26', text: 'What are the basic data types in JavaScript?', keywords: ['string', 'number', 'boolean', 'object', 'undefined', 'null'], expectedLength: 40 },
    { id: 'fe-b-27', text: 'What is the difference between let, const, and var?', keywords: ['scope', 'reassign', 'hoisting', 'block'], expectedLength: 60 },
    { id: 'fe-b-28', text: 'What is a JavaScript function?', keywords: ['reusable', 'block', 'parameters', 'return'], expectedLength: 40 },
    { id: 'fe-b-29', text: 'Explain what an array is in JavaScript.', keywords: ['collection', 'elements', 'indexed', 'data structure'], expectedLength: 40 },
    { id: 'fe-b-30', text: 'What is an object in JavaScript?', keywords: ['key', 'value', 'properties', 'methods'], expectedLength: 40 },
    { id: 'fe-b-31', text: 'How do you add a comment in JavaScript?', keywords: ['single', 'multi', 'line', 'comment'], expectedLength: 30 },
    { id: 'fe-b-32', text: 'What is the purpose of console.log()?', keywords: ['debugging', 'output', 'print', 'console'], expectedLength: 35 },
    { id: 'fe-b-33', text: 'Explain the if statement in JavaScript.', keywords: ['condition', 'true', 'false', 'execute'], expectedLength: 40 },
    { id: 'fe-b-34', text: 'What is a for loop?', keywords: ['iteration', 'repeat', 'counter', 'condition'], expectedLength: 40 },
    { id: 'fe-b-35', text: 'What is the DOM?', keywords: ['document', 'object', 'model', 'tree', 'HTML'], expectedLength: 45 },
    { id: 'fe-b-36', text: 'How do you select an element by ID in JavaScript?', keywords: ['getElementById', 'document', 'selector'], expectedLength: 35 },
    { id: 'fe-b-37', text: 'What is an event in JavaScript?', keywords: ['action', 'click', 'listener', 'handler'], expectedLength: 40 },
    { id: 'fe-b-38', text: 'How do you add an event listener?', keywords: ['addEventListener', 'element', 'event', 'callback'], expectedLength: 40 },
    { id: 'fe-b-39', text: 'What is the difference between == and ===?', keywords: ['equality', 'type', 'coercion', 'strict'], expectedLength: 45 },
    { id: 'fe-b-40', text: 'Explain null and undefined.', keywords: ['absence', 'value', 'declared', 'initialized'], expectedLength: 40 },
    { id: 'fe-b-41', text: 'What are template literals?', keywords: ['backticks', 'string', 'interpolation', 'multiline'], expectedLength: 40 },
    { id: 'fe-b-42', text: 'What is the typeof operator?', keywords: ['type', 'check', 'data', 'operator'], expectedLength: 35 },
    { id: 'fe-b-43', text: 'How do you create a variable in JavaScript?', keywords: ['var', 'let', 'const', 'declare'], expectedLength: 35 },
    { id: 'fe-b-44', text: 'What is string concatenation?', keywords: ['combine', 'join', 'strings', 'plus'], expectedLength: 35 },
    { id: 'fe-b-45', text: 'Explain the break statement.', keywords: ['loop', 'exit', 'terminate', 'control'], expectedLength: 35 },
    { id: 'fe-b-46', text: 'What is the continue statement?', keywords: ['skip', 'iteration', 'loop', 'next'], expectedLength: 35 },
    { id: 'fe-b-47', text: 'How do you convert a string to a number?', keywords: ['parseInt', 'parseFloat', 'Number', 'conversion'], expectedLength: 40 },
    { id: 'fe-b-48', text: 'What is NaN in JavaScript?', keywords: ['not', 'number', 'invalid', 'result'], expectedLength: 35 },
    { id: 'fe-b-49', text: 'Explain the Math object.', keywords: ['mathematical', 'operations', 'methods', 'built-in'], expectedLength: 40 },
    { id: 'fe-b-50', text: 'What is the purpose of the return statement?', keywords: ['function', 'output', 'value', 'exit'], expectedLength: 40 },
  ]),
  
  intermediate: finalizeQuestions([
    // Advanced JavaScript (20 questions)
    { id: 'fe-i-1', text: 'Explain the concept of closures in JavaScript.', keywords: ['function', 'scope', 'lexical', 'encapsulation', 'private'], expectedLength: 70 },
    { id: 'fe-i-2', text: 'What are JavaScript promises and how do they work?', keywords: ['asynchronous', 'resolve', 'reject', 'then', 'catch'], expectedLength: 70 },
    { id: 'fe-i-3', text: 'Explain async/await in JavaScript.', keywords: ['asynchronous', 'promise', 'syntax', 'await', 'async'], expectedLength: 65 },
    { id: 'fe-i-4', text: 'What is the event loop in JavaScript?', keywords: ['asynchronous', 'callback', 'queue', 'stack', 'non-blocking'], expectedLength: 70 },
    { id: 'fe-i-5', text: 'Explain the concept of hoisting.', keywords: ['declaration', 'initialization', 'scope', 'var', 'function'], expectedLength: 60 },
    { id: 'fe-i-6', text: 'What is the this keyword?', keywords: ['context', 'object', 'method', 'binding'], expectedLength: 60 },
    { id: 'fe-i-7', text: 'Explain arrow functions and their differences from regular functions.', keywords: ['syntax', 'this', 'lexical', 'binding', 'concise'], expectedLength: 65 },
    { id: 'fe-i-8', text: 'What are JavaScript modules?', keywords: ['import', 'export', 'encapsulation', 'reusable'], expectedLength: 60 },
    { id: 'fe-i-9', text: 'Explain destructuring in JavaScript.', keywords: ['extract', 'array', 'object', 'syntax', 'assignment'], expectedLength: 60 },
    { id: 'fe-i-10', text: 'What is the spread operator?', keywords: ['expand', 'array', 'object', 'copy', 'merge'], expectedLength: 55 },
    { id: 'fe-i-11', text: 'Explain the rest parameter.', keywords: ['arguments', 'array', 'function', 'variable'], expectedLength: 55 },
    { id: 'fe-i-12', text: 'What are higher-order functions?', keywords: ['function', 'argument', 'return', 'callback'], expectedLength: 60 },
    { id: 'fe-i-13', text: 'Explain map, filter, and reduce.', keywords: ['array', 'methods', 'transformation', 'iteration'], expectedLength: 70 },
    { id: 'fe-i-14', text: 'What is event bubbling and capturing?', keywords: ['propagation', 'DOM', 'parent', 'child', 'phases'], expectedLength: 65 },
    { id: 'fe-i-15', text: 'How does prototypal inheritance work?', keywords: ['prototype', 'chain', 'inheritance', 'object'], expectedLength: 70 },
    { id: 'fe-i-16', text: 'What are generators in JavaScript?', keywords: ['function', 'yield', 'iterator', 'pause'], expectedLength: 65 },
    { id: 'fe-i-17', text: 'Explain the concept of currying.', keywords: ['partial', 'application', 'function', 'arguments'], expectedLength: 60 },
    { id: 'fe-i-18', text: 'What is memoization?', keywords: ['cache', 'optimization', 'performance', 'results'], expectedLength: 55 },
    { id: 'fe-i-19', text: 'Explain the call, apply, and bind methods.', keywords: ['this', 'context', 'arguments', 'binding'], expectedLength: 70 },
    { id: 'fe-i-20', text: 'What is the difference between shallow and deep copy?', keywords: ['reference', 'value', 'nested', 'clone'], expectedLength: 65 },
    
    // React Fundamentals (15 questions)
    { id: 'fe-i-21', text: 'What is the virtual DOM and how does React use it?', keywords: ['performance', 'reconciliation', 'diffing', 'efficient', 'update'], expectedLength: 80 },
    { id: 'fe-i-22', text: 'What is the purpose of React hooks?', keywords: ['state', 'functional', 'lifecycle', 'reusable'], expectedLength: 70 },
    { id: 'fe-i-23', text: 'Explain useState hook.', keywords: ['state', 'component', 'update', 'setter'], expectedLength: 60 },
    { id: 'fe-i-24', text: 'What is useEffect and when do you use it?', keywords: ['side effects', 'lifecycle', 'dependencies', 'cleanup'], expectedLength: 70 },
    { id: 'fe-i-25', text: 'Explain props in React.', keywords: ['properties', 'parent', 'child', 'data', 'immutable'], expectedLength: 60 },
    { id: 'fe-i-26', text: 'What is component composition?', keywords: ['reusable', 'combine', 'children', 'hierarchy'], expectedLength: 65 },
    { id: 'fe-i-27', text: 'Explain controlled vs uncontrolled components.', keywords: ['state', 'form', 'value', 'ref'], expectedLength: 70 },
    { id: 'fe-i-28', text: 'What is the Context API?', keywords: ['state', 'global', 'prop drilling', 'provider'], expectedLength: 65 },
    { id: 'fe-i-29', text: 'Explain useContext hook.', keywords: ['context', 'consumer', 'provider', 'state'], expectedLength: 60 },
    { id: 'fe-i-30', text: 'What is useRef and its use cases?', keywords: ['reference', 'DOM', 'mutable', 'persist'], expectedLength: 65 },
    { id: 'fe-i-31', text: 'Explain the component lifecycle.', keywords: ['mounting', 'updating', 'unmounting', 'phases'], expectedLength: 70 },
    { id: 'fe-i-32', text: 'What are React fragments?', keywords: ['wrapper', 'DOM', 'group', 'elements'], expectedLength: 55 },
    { id: 'fe-i-33', text: 'Explain keys in React lists.', keywords: ['unique', 'identifier', 'reconciliation', 'performance'], expectedLength: 60 },
    { id: 'fe-i-34', text: 'What is prop drilling and how to avoid it?', keywords: ['passing', 'props', 'context', 'nested'], expectedLength: 65 },
    { id: 'fe-i-35', text: 'How do you handle forms in React?', keywords: ['controlled', 'state', 'onChange', 'submit'], expectedLength: 70 },
    
    // CSS Advanced & Responsive Design (15 questions)
    { id: 'fe-i-36', text: 'Explain the difference between responsive and adaptive design.', keywords: ['flexible', 'breakpoints', 'media queries', 'fluid'], expectedLength: 60 },
    { id: 'fe-i-37', text: 'What is Flexbox and how does it work?', keywords: ['layout', 'flexible', 'container', 'items', 'direction'], expectedLength: 70 },
    { id: 'fe-i-38', text: 'Explain CSS Grid layout.', keywords: ['two-dimensional', 'rows', 'columns', 'template'], expectedLength: 65 },
    { id: 'fe-i-39', text: 'What are media queries?', keywords: ['responsive', 'breakpoints', 'screen', 'device'], expectedLength: 60 },
    { id: 'fe-i-40', text: 'Explain CSS variables (custom properties).', keywords: ['reusable', 'values', 'dynamic', 'root'], expectedLength: 60 },
    { id: 'fe-i-41', text: 'What is the CSS specificity?', keywords: ['priority', 'selector', 'importance', 'cascade'], expectedLength: 60 },
    { id: 'fe-i-42', text: 'Explain CSS transitions.', keywords: ['animation', 'property', 'duration', 'timing'], expectedLength: 55 },
    { id: 'fe-i-43', text: 'What are CSS animations?', keywords: ['keyframes', 'animation', 'movement', 'transform'], expectedLength: 60 },
    { id: 'fe-i-44', text: 'Explain the difference between absolute and relative positioning.', keywords: ['position', 'parent', 'context', 'offset'], expectedLength: 65 },
    { id: 'fe-i-45', text: 'What is mobile-first design?', keywords: ['approach', 'small', 'progressive', 'enhancement'], expectedLength: 55 },
    { id: 'fe-i-46', text: 'Explain CSS preprocessors.', keywords: ['Sass', 'Less', 'variables', 'nesting', 'compile'], expectedLength: 60 },
    { id: 'fe-i-47', text: 'What is the BEM methodology?', keywords: ['naming', 'convention', 'block', 'element', 'modifier'], expectedLength: 60 },
    { id: 'fe-i-48', text: 'Explain CSS-in-JS.', keywords: ['styled', 'components', 'JavaScript', 'dynamic'], expectedLength: 60 },
    { id: 'fe-i-49', text: 'What is critical CSS?', keywords: ['above-fold', 'inline', 'performance', 'loading'], expectedLength: 55 },
    { id: 'fe-i-50', text: 'How do you optimize CSS for performance?', keywords: ['minify', 'reduce', 'specificity', 'unused'], expectedLength: 65 },
  ]),
  
  advanced: finalizeQuestions([
    // Performance Optimization (15 questions)
    { id: 'fe-a-1', text: 'How would you optimize the performance of a React application?', keywords: ['memoization', 'lazy loading', 'code splitting', 'virtualization', 'bundle'], expectedLength: 100 },
    { id: 'fe-a-2', text: 'Explain React.memo and when to use it.', keywords: ['memoization', 'pure', 'component', 're-render', 'optimization'], expectedLength: 85 },
    { id: 'fe-a-3', text: 'What is useMemo and useCallback?', keywords: ['memoization', 'dependencies', 'optimization', 'recompute'], expectedLength: 85 },
    { id: 'fe-a-4', text: 'How does code splitting work in React?', keywords: ['dynamic', 'import', 'lazy', 'suspense', 'bundle'], expectedLength: 85 },
    { id: 'fe-a-5', text: 'Explain lazy loading of components.', keywords: ['on-demand', 'performance', 'bundle', 'suspense'], expectedLength: 75 },
    { id: 'fe-a-6', text: 'What is tree shaking?', keywords: ['dead code', 'elimination', 'unused', 'optimization'], expectedLength: 70 },
    { id: 'fe-a-7', text: 'How do you implement virtual scrolling?', keywords: ['large', 'lists', 'performance', 'viewport', 'render'], expectedLength: 85 },
    { id: 'fe-a-8', text: 'Explain the critical rendering path and how to optimize it.', keywords: ['DOM', 'CSSOM', 'render tree', 'paint', 'composite'], expectedLength: 100 },
    { id: 'fe-a-9', text: 'What are Web Workers and when would you use them?', keywords: ['threads', 'background', 'performance', 'blocking'], expectedLength: 80 },
    { id: 'fe-a-10', text: 'How does the browser event loop work?', keywords: ['call stack', 'queue', 'microtasks', 'macrotasks', 'asynchronous'], expectedLength: 90 },
    { id: 'fe-a-11', text: 'Explain browser caching strategies.', keywords: ['cache', 'headers', 'service worker', 'storage', 'optimization'], expectedLength: 85 },
    { id: 'fe-a-12', text: 'What is the difference between throttling and debouncing?', keywords: ['rate', 'limit', 'delay', 'performance', 'events'], expectedLength: 80 },
    { id: 'fe-a-13', text: 'How do you measure web performance?', keywords: ['lighthouse', 'metrics', 'FCP', 'LCP', 'CLS', 'FID'], expectedLength: 85 },
    { id: 'fe-a-14', text: 'Explain image optimization techniques.', keywords: ['compression', 'format', 'lazy loading', 'responsive', 'WebP'], expectedLength: 80 },
    { id: 'fe-a-15', text: 'What is prefetching and preloading?', keywords: ['resource', 'hints', 'optimization', 'loading', 'priority'], expectedLength: 75 },
    
    // Advanced React & State Management (15 questions)
    { id: 'fe-a-16', text: 'Explain server-side rendering (SSR) and its benefits.', keywords: ['SEO', 'initial load', 'hydration', 'performance'], expectedLength: 90 },
    { id: 'fe-a-17', text: 'What is static site generation (SSG)?', keywords: ['build', 'pre-render', 'HTML', 'performance'], expectedLength: 80 },
    { id: 'fe-a-18', text: 'How does Next.js handle routing?', keywords: ['file-based', 'pages', 'dynamic', 'navigation'], expectedLength: 75 },
    { id: 'fe-a-19', text: 'Explain Redux and its core principles.', keywords: ['state', 'actions', 'reducers', 'store', 'predictable'], expectedLength: 85 },
    { id: 'fe-a-20', text: 'What is the difference between Redux and Context API?', keywords: ['scale', 'performance', 'middleware', 'complexity'], expectedLength: 85 },
    { id: 'fe-a-21', text: 'Explain React Query and its benefits.', keywords: ['server state', 'caching', 'synchronization', 'mutations'], expectedLength: 85 },
    { id: 'fe-a-22', text: 'What is Zustand and how does it differ from Redux?', keywords: ['lightweight', 'simple', 'hooks', 'state management'], expectedLength: 80 },
    { id: 'fe-a-23', text: 'How do you handle error boundaries in React?', keywords: ['catch', 'errors', 'fallback', 'component'], expectedLength: 75 },
    { id: 'fe-a-24', text: 'Explain custom hooks and their benefits.', keywords: ['reusable', 'logic', 'stateful', 'composition'], expectedLength: 80 },
    { id: 'fe-a-25', text: 'What is the useReducer hook?', keywords: ['state', 'complex', 'actions', 'reducer', 'dispatch'], expectedLength: 75 },
    { id: 'fe-a-26', text: 'How do you implement authentication in React?', keywords: ['JWT', 'token', 'protected', 'routes', 'context'], expectedLength: 85 },
    { id: 'fe-a-27', text: 'Explain React Suspense and Concurrent Mode.', keywords: ['loading', 'async', 'rendering', 'priority'], expectedLength: 85 },
    { id: 'fe-a-28', text: 'What are React portals?', keywords: ['render', 'outside', 'DOM', 'hierarchy', 'modal'], expectedLength: 70 },
    { id: 'fe-a-29', text: 'How do you test React components?', keywords: ['Jest', 'testing library', 'unit', 'integration'], expectedLength: 80 },
    { id: 'fe-a-30', text: 'Explain the composition pattern in React.', keywords: ['children', 'props', 'reusable', 'flexible'], expectedLength: 75 },
    
    // Advanced Web Technologies (20 questions)
    { id: 'fe-a-31', text: 'What is Progressive Web App (PWA)?', keywords: ['offline', 'service worker', 'manifest', 'installable'], expectedLength: 80 },
    { id: 'fe-a-32', text: 'Explain service workers.', keywords: ['background', 'cache', 'offline', 'proxy', 'network'], expectedLength: 85 },
    { id: 'fe-a-33', text: 'What is IndexedDB?', keywords: ['browser', 'database', 'storage', 'NoSQL', 'offline'], expectedLength: 75 },
    { id: 'fe-a-34', text: 'How do WebSockets work?', keywords: ['bidirectional', 'real-time', 'connection', 'server'], expectedLength: 80 },
    { id: 'fe-a-35', text: 'Explain CORS and how to handle it.', keywords: ['cross-origin', 'security', 'headers', 'policy'], expectedLength: 80 },
    { id: 'fe-a-36', text: 'What is Content Security Policy (CSP)?', keywords: ['security', 'XSS', 'headers', 'resources'], expectedLength: 75 },
    { id: 'fe-a-37', text: 'How do you implement OAuth authentication?', keywords: ['authorization', 'third-party', 'token', 'flow'], expectedLength: 85 },
    { id: 'fe-a-38', text: 'Explain GraphQL and its advantages.', keywords: ['query', 'API', 'flexible', 'schema', 'types'], expectedLength: 85 },
    { id: 'fe-a-39', text: 'What is the Intersection Observer API?', keywords: ['visibility', 'lazy loading', 'scroll', 'viewport'], expectedLength: 75 },
    { id: 'fe-a-40', text: 'How do you implement infinite scrolling?', keywords: ['pagination', 'load', 'scroll', 'observer'], expectedLength: 75 },
    { id: 'fe-a-41', text: 'Explain Web Components.', keywords: ['custom', 'elements', 'shadow DOM', 'reusable'], expectedLength: 80 },
    { id: 'fe-a-42', text: 'What is Shadow DOM?', keywords: ['encapsulation', 'isolated', 'styles', 'scope'], expectedLength: 70 },
    { id: 'fe-a-43', text: 'How do you handle file uploads?', keywords: ['FormData', 'multipart', 'progress', 'validation'], expectedLength: 75 },
    { id: 'fe-a-44', text: 'Explain drag and drop API.', keywords: ['draggable', 'events', 'dataTransfer', 'interaction'], expectedLength: 75 },
    { id: 'fe-a-45', text: 'What is the Canvas API?', keywords: ['drawing', 'graphics', '2D', 'rendering'], expectedLength: 70 },
    { id: 'fe-a-46', text: 'How do you implement animations using CSS and JavaScript?', keywords: ['requestAnimationFrame', 'transitions', 'keyframes', 'performance'], expectedLength: 85 },
    { id: 'fe-a-47', text: 'Explain the Fetch API and its advantages.', keywords: ['HTTP', 'requests', 'promises', 'modern', 'XMLHttpRequest'], expectedLength: 80 },
    { id: 'fe-a-48', text: 'What is webpack and how does it work?', keywords: ['bundler', 'modules', 'loaders', 'plugins', 'build'], expectedLength: 85 },
    { id: 'fe-a-49', text: 'Explain Vite and its advantages over webpack.', keywords: ['build tool', 'fast', 'ESM', 'HMR', 'development'], expectedLength: 85 },
    { id: 'fe-a-50', text: 'How do you implement accessibility in web applications?', keywords: ['ARIA', 'semantic', 'keyboard', 'screen reader', 'WCAG'], expectedLength: 90 },
  ]),
};

const GENERATED_PROMPT_BUILDERS: Record<
  DifficultyLevel,
  Array<(domainName: string, skill: string, focus: FocusArea) => string>
> = {
  beginner: [
    (domainName, skill, focus) =>
      `What is ${skill} and how does it support ${domainName} work in terms of ${focus.title}?`,
    (domainName, skill, focus) =>
      `Why is ${skill} important for a ${domainName}, especially when learning ${focus.title}?`,
    (domainName, skill, focus) =>
      `Explain a beginner-friendly example of using ${skill} in ${domainName} work with focus on ${focus.title}.`,
    (domainName, skill, focus) =>
      `What should a new ${domainName} understand first about ${skill} when thinking about ${focus.title}?`,
    (domainName, skill, focus) =>
      `How would you describe ${skill} to someone starting in ${domainName}, with emphasis on ${focus.title}?`,
  ],
  intermediate: [
    (domainName, skill, focus) =>
      `How would you handle ${focus.title} when working with ${skill} as a ${domainName}?`,
    (domainName, skill, focus) =>
      `Explain the main trade-offs of using ${skill} in ${domainName} projects, especially around ${focus.title}.`,
    (domainName, skill, focus) =>
      `Describe an intermediate-level scenario where ${skill} becomes important for ${focus.title} in ${domainName}.`,
    (domainName, skill, focus) =>
      `What problems can appear with ${skill} in ${domainName} work, and how would you approach ${focus.title}?`,
    (domainName, skill, focus) =>
      `How do experienced ${domainName}s improve ${focus.title} when building with ${skill}?`,
  ],
  advanced: [
    (domainName, skill, focus) =>
      `Design an advanced approach for ${focus.title} when ${skill} is a critical part of a ${domainName} system.`,
    (domainName, skill, focus) =>
      `What architectural decisions matter most for ${focus.title} when scaling ${skill} in ${domainName} work?`,
    (domainName, skill, focus) =>
      `Explain how you would lead a high-impact ${domainName} solution involving ${skill} with focus on ${focus.title}.`,
    (domainName, skill, focus) =>
      `What advanced risks and trade-offs do you consider for ${focus.title} when ${skill} is used in production ${domainName} environments?`,
    (domainName, skill, focus) =>
      `How would you future-proof a ${domainName} solution built around ${skill}, particularly regarding ${focus.title}?`,
  ],
};

function getQuestionPrefix(domainId: string) {
  const compactId = domainId.replace(/[^a-z]/gi, '');
  return compactId.slice(0, 3).toLowerCase() || 'qst';
}

function getExpectedLengthForLevel(level: DifficultyLevel) {
  if (level === 'beginner') return 50;
  if (level === 'intermediate') return 70;
  return 90;
}

function generateDomainQuestions(
  domainId: string,
  count: number,
  level: DifficultyLevel,
): Question[] {
  const domainConfig = getDomainConfigById(domainId);
  const domainName = domainConfig?.name || domainId;
  const skills = extractDomainSkills(domainId);
  const focusAreas = GENERATED_FOCUS_AREAS[level];
  const promptBuilders = GENERATED_PROMPT_BUILDERS[level];
  const prefix = getQuestionPrefix(domainId);

  const questions: Question[] = [];

  for (let index = 0; index < count; index += 1) {
    const skill = skills[index % skills.length] || domainName;
    const focus = focusAreas[Math.floor(index / Math.max(skills.length, 1)) % focusAreas.length];
    const promptBuilder =
      promptBuilders[
        Math.floor(index / Math.max(skills.length * focusAreas.length, 1)) %
          promptBuilders.length
      ];

    const keywords = uniqueStrings([
      skill.toLowerCase(),
      domainName.toLowerCase(),
      ...focus.keywords,
    ]);

    questions.push({
      id: `${prefix}-${level[0]}-${index + 1}`,
      text: promptBuilder(domainName, skill, focus),
      keywords,
      concepts: uniqueStrings([skill, domainName, focus.title, ...focus.keywords]).slice(0, 10),
      weightedKeywords: keywords.map((term, keywordIndex) => ({
        term,
        weight: keywordIndex < 2 ? 1.5 : 1,
      })),
      expectedAnswer: `A strong answer should explain ${skill} in the context of ${domainName} and cover ${focus.expectedAnswer}.`,
      expectedLength: getExpectedLengthForLevel(level),
    });
  }

  return questions;
}

function generateDomainQuestionBank(domainId: string) {
  return {
    beginner: generateDomainQuestions(domainId, MAX_QUESTIONS_PER_LEVEL, 'beginner'),
    intermediate: generateDomainQuestions(domainId, MAX_QUESTIONS_PER_LEVEL, 'intermediate'),
    advanced: generateDomainQuestions(domainId, MAX_QUESTIONS_PER_LEVEL, 'advanced'),
  };
}

const generatedQuestionBankCache = new Map<string, ReturnType<typeof generateDomainQuestionBank>>();

// Backend Developer - Generated question bank with domain-specific metadata
export const backendQuestions = generateDomainQuestionBank('backend-dev');

// Export question banks for explicit domains
export const questionBanks: Record<string, ReturnType<typeof generateDomainQuestionBank> | typeof frontendQuestions> = {
  'frontend-dev': frontendQuestions,
  'backend-dev': backendQuestions,
};

// Helper function to get questions for a domain and difficulty
export function getQuestionsForDomain(
  domainId: string,
  difficulty: 'beginner' | 'intermediate' | 'advanced'
): Question[] {
  const bank = questionBanks[domainId];
  if (bank?.[difficulty]) {
    return bank[difficulty];
  }

  if (!generatedQuestionBankCache.has(domainId)) {
    generatedQuestionBankCache.set(domainId, generateDomainQuestionBank(domainId));
  }

  return generatedQuestionBankCache.get(domainId)![difficulty];
}

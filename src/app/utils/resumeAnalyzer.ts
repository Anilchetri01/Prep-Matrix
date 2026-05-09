/**
 * AI-powered Resume Analyzer
 * Analyzes resumes based on selected domain and provides personalized suggestions
 */

import type { ResumeAnalysis, ResumeSuggestion } from '../types';
import { DOMAINS } from '../data/questions';

// Domain-specific skill requirements - using actual domain IDs from questions.ts
const DOMAIN_SKILLS: Record<string, string[]> = {
  'frontend-dev': ['React', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'Vue', 'Angular', 'Webpack', 'Redux', 'Tailwind'],
  'backend-dev': ['Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'REST API', 'GraphQL', 'Docker', 'AWS', 'PostgreSQL'],
  'fullstack-dev': ['React', 'Node.js', 'JavaScript', 'TypeScript', 'MongoDB', 'SQL', 'REST API', 'Docker', 'AWS', 'Git'],
  'data-analyst': ['Python', 'SQL', 'Excel', 'Tableau', 'Power BI', 'R', 'Statistics', 'Data Visualization', 'Pandas', 'NumPy'],
  'ai-ml': ['Python', 'TensorFlow', 'PyTorch', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'Scikit-learn', 'Keras', 'Neural Networks'],
  'devops': ['Docker', 'Kubernetes', 'CI/CD', 'Jenkins', 'AWS', 'Azure', 'Terraform', 'Ansible', 'Linux', 'Git'],
  'mobile-dev': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS', 'Android', 'Firebase', 'REST API', 'Git', 'Mobile UI'],
  'ui-ux': ['Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator', 'Prototyping', 'User Research', 'Wireframing', 'Design Systems'],
  'product-manager': ['Agile', 'Scrum', 'JIRA', 'Product Strategy', 'User Stories', 'Roadmapping', 'Analytics', 'Communication', 'Stakeholder Management'],
  'hr-manager': ['Recruitment', 'HR Management', 'Employee Relations', 'Performance Management', 'HRIS', 'Communication', 'Onboarding'],
  'cybersecurity': ['Network Security', 'Penetration Testing', 'SIEM', 'Firewall', 'Vulnerability Assessment', 'Encryption', 'Compliance'],
  'cloud-architect': ['AWS', 'Azure', 'GCP', 'Terraform', 'Kubernetes', 'Docker', 'Serverless', 'Cloud Architecture', 'Networking'],
  'blockchain-dev': ['Solidity', 'Ethereum', 'Smart Contracts', 'Web3', 'Cryptography', 'DeFi', 'Blockchain Architecture', 'NFT'],
  'game-dev': ['Unity', 'Unreal Engine', 'C++', 'C#', 'Game Design', '3D Modeling', 'Physics', 'Graphics Programming', 'Animation'],
  'digital-marketing': ['SEO', 'SEM', 'Google Analytics', 'Social Media', 'Content Marketing', 'Email Marketing', 'PPC', 'Marketing Strategy'],
  'business-analyst': ['Requirements Gathering', 'Data Analysis', 'SQL', 'Excel', 'Business Process', 'Documentation', 'Stakeholder Management'],
  'network-engineer': ['Networking', 'TCP/IP', 'Cisco', 'Routing', 'Switching', 'VPN', 'Firewall', 'Network Security', 'Troubleshooting'],
  'db-admin': ['SQL', 'Database Design', 'Performance Tuning', 'Backup', 'Recovery', 'PostgreSQL', 'MySQL', 'Oracle', 'MongoDB'],
  'qa-tester': ['Testing', 'Automation', 'Selenium', 'Jest', 'Test Cases', 'Bug Tracking', 'Quality Assurance', 'API Testing'],
  'sales-manager': ['Sales Strategy', 'CRM', 'Salesforce', 'Negotiation', 'Client Relations', 'Revenue Growth', 'Team Management'],
};

// Common keywords for resume analysis
const SOFT_SKILLS = [
  'communication', 'leadership', 'teamwork', 'problem solving', 'critical thinking',
  'collaboration', 'adaptability', 'time management', 'creativity', 'presentation'
];

const ACTION_VERBS = [
  'developed', 'implemented', 'designed', 'created', 'built', 'managed', 'led',
  'improved', 'optimized', 'achieved', 'delivered', 'architected', 'deployed'
];

/**
 * Analyze resume content and provide domain-specific feedback
 */
export function analyzeResume(content: string, domainId: string, domainName: string): ResumeAnalysis {
  const contentLower = content.toLowerCase();
  const domain = DOMAINS.find(d => d.id === domainId);
  const requiredSkills = DOMAIN_SKILLS[domainId] || [];
  
  // Find skills present in resume
  const skillsFound: string[] = [];
  const skillsNeeded: string[] = [];
  
  requiredSkills.forEach(skill => {
    if (contentLower.includes(skill.toLowerCase())) {
      skillsFound.push(skill);
    } else {
      skillsNeeded.push(skill);
    }
  });

  // Find soft skills
  const softSkillsFound = SOFT_SKILLS.filter(skill => 
    contentLower.includes(skill.toLowerCase())
  );

  // Check for action verbs
  const actionVerbsUsed = ACTION_VERBS.filter(verb => 
    contentLower.includes(verb)
  );

  // Determine experience level
  const experienceLevel = determineExperienceLevel(content);

  // Calculate overall score
  const overallScore = calculateScore({
    skillsFound: skillsFound.length,
    totalSkills: requiredSkills.length,
    softSkillsFound: softSkillsFound.length,
    actionVerbsUsed: actionVerbsUsed.length,
    contentLength: content.length,
    hasEmail: /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i.test(content),
    hasPhone: /\d{3}[-.]?\d{3}[-.]?\d{4}/.test(content),
    hasEducation: contentLower.includes('education') || contentLower.includes('degree'),
    hasExperience: contentLower.includes('experience') || contentLower.includes('work'),
  });

  // Generate strengths
  const strengths: string[] = [];
  if (skillsFound.length > requiredSkills.length * 0.6) {
    strengths.push(`Strong technical skill set with ${skillsFound.length} relevant skills for ${domainName}`);
  }
  if (softSkillsFound.length >= 3) {
    strengths.push(`Good demonstration of soft skills including ${softSkillsFound.slice(0, 3).join(', ')}`);
  }
  if (actionVerbsUsed.length >= 5) {
    strengths.push('Effective use of action verbs to describe achievements');
  }
  if (content.length > 1000) {
    strengths.push('Comprehensive resume with detailed information');
  }

  // Generate weaknesses
  const weaknesses: string[] = [];
  if (skillsFound.length < requiredSkills.length * 0.4) {
    weaknesses.push(`Limited technical skills for ${domainName} role - only ${skillsFound.length} of ${requiredSkills.length} key skills found`);
  }
  if (softSkillsFound.length < 2) {
    weaknesses.push('Insufficient demonstration of soft skills and interpersonal abilities');
  }
  if (actionVerbsUsed.length < 3) {
    weaknesses.push('Could use more action verbs to describe accomplishments');
  }
  if (content.length < 500) {
    weaknesses.push('Resume appears too brief - consider adding more detail about your experience');
  }

  // Generate suggestions
  const suggestions = generateSuggestions(domainId, domainName, skillsNeeded, softSkillsFound, actionVerbsUsed, content);

  return {
    overallScore,
    strengths: strengths.length > 0 ? strengths : ['Resume uploaded successfully'],
    weaknesses: weaknesses.length > 0 ? weaknesses : ['No major weaknesses detected'],
    suggestions,
    skillsFound,
    skillsNeeded: skillsNeeded.slice(0, 10), // Top 10 missing skills
    experienceLevel,
    analyzedAt: Date.now(),
  };
}

/**
 * Determine experience level based on content
 */
function determineExperienceLevel(content: string): 'entry' | 'mid' | 'senior' | 'expert' {
  const contentLower = content.toLowerCase();
  
  // Count years of experience mentions
  const yearMatches = content.match(/(\d+)\+?\s*years?/gi) || [];
  const maxYears = yearMatches.reduce((max, match) => {
    const num = parseInt(match);
    return num > max ? num : max;
  }, 0);

  // Check for leadership indicators
  const hasLeadership = /lead|senior|principal|architect|manager|director|head of/i.test(content);
  const hasManagement = /managed|led team|supervised|mentored/i.test(content);
  
  if (maxYears >= 10 || (hasLeadership && hasManagement)) {
    return 'expert';
  } else if (maxYears >= 5 || hasLeadership) {
    return 'senior';
  } else if (maxYears >= 2 || contentLower.includes('experience')) {
    return 'mid';
  }
  return 'entry';
}

/**
 * Calculate overall resume score
 */
function calculateScore(factors: {
  skillsFound: number;
  totalSkills: number;
  softSkillsFound: number;
  actionVerbsUsed: number;
  contentLength: number;
  hasEmail: boolean;
  hasPhone: boolean;
  hasEducation: boolean;
  hasExperience: boolean;
}): number {
  let score = 0;

  // Technical skills (40 points)
  if (factors.totalSkills > 0) {
    score += (factors.skillsFound / factors.totalSkills) * 40;
  } else {
    score += 20; // Default if no skills defined for domain
  }

  // Soft skills (15 points)
  score += Math.min(factors.softSkillsFound * 3, 15);

  // Action verbs (10 points)
  score += Math.min(factors.actionVerbsUsed * 1.5, 10);

  // Content length (10 points)
  if (factors.contentLength > 2000) score += 10;
  else if (factors.contentLength > 1000) score += 7;
  else if (factors.contentLength > 500) score += 5;

  // Contact info (10 points)
  if (factors.hasEmail) score += 5;
  if (factors.hasPhone) score += 5;

  // Structure (15 points)
  if (factors.hasEducation) score += 7;
  if (factors.hasExperience) score += 8;

  return Math.min(Math.round(score), 100);
}

/**
 * Generate personalized suggestions based on analysis
 */
function generateSuggestions(
  domainId: string,
  domainName: string,
  skillsNeeded: string[],
  softSkillsFound: string[],
  actionVerbsUsed: string[],
  content: string
): ResumeSuggestion[] {
  const suggestions: ResumeSuggestion[] = [];
  const contentLower = content.toLowerCase();

  // Skills suggestions
  if (skillsNeeded.length > 0) {
    suggestions.push({
      category: 'skills',
      priority: 'high',
      title: 'Add Missing Technical Skills',
      description: `Consider adding these key skills for ${domainName}: ${skillsNeeded.slice(0, 5).join(', ')}. Include projects or certifications that demonstrate these abilities.`,
      icon: '🎯',
    });
  }

  // Communication skills
  if (softSkillsFound.length < 3) {
    suggestions.push({
      category: 'skills',
      priority: 'high',
      title: 'Improve Communication Skills Demonstration',
      description: 'Highlight soft skills like communication, leadership, and teamwork. Include examples of presentations, team collaborations, or client interactions.',
      icon: '💬',
    });
  }

  // Action verbs
  if (actionVerbsUsed.length < 5) {
    suggestions.push({
      category: 'content',
      priority: 'medium',
      title: 'Use More Action Verbs',
      description: 'Start bullet points with strong action verbs like "developed," "implemented," "designed," or "optimized" to showcase your achievements.',
      icon: '⚡',
    });
  }

  // Quantifiable achievements
  if (!/\d+%|\$\d+|saved|increased|improved by/.test(content)) {
    suggestions.push({
      category: 'content',
      priority: 'high',
      title: 'Add Quantifiable Achievements',
      description: 'Include metrics and numbers to demonstrate impact. For example: "Improved performance by 30%" or "Managed a team of 5 developers."',
      icon: '📊',
    });
  }

  // Projects section
  if (!contentLower.includes('project')) {
    suggestions.push({
      category: 'experience',
      priority: 'high',
      title: 'Add Projects Section',
      description: `Include relevant ${domainName} projects you've worked on. Describe the technologies used, your role, and the outcomes achieved.`,
      icon: '🚀',
    });
  }

  // Certifications
  if (!contentLower.includes('certification') && !contentLower.includes('certified')) {
    suggestions.push({
      category: 'skills',
      priority: 'medium',
      title: 'Consider Adding Certifications',
      description: `Professional certifications relevant to ${domainName} can strengthen your profile. Consider industry-recognized certifications in your field.`,
      icon: '🏆',
    });
  }

  // Format suggestions
  if (content.length < 800) {
    suggestions.push({
      category: 'format',
      priority: 'medium',
      title: 'Expand Resume Content',
      description: 'Your resume appears brief. Consider adding more details about your responsibilities, achievements, and impact in previous roles.',
      icon: '📝',
    });
  }

  // Keywords for ATS
  suggestions.push({
    category: 'keywords',
    priority: 'medium',
    title: 'Optimize for ATS (Applicant Tracking Systems)',
    description: `Ensure your resume includes industry keywords for ${domainName}. Use standard section headings like "Experience," "Education," and "Skills."`,
    icon: '🔍',
  });

  // Domain-specific suggestions
  const domainSpecificSuggestion = getDomainSpecificSuggestion(domainId, domainName, content);
  if (domainSpecificSuggestion) {
    suggestions.push(domainSpecificSuggestion);
  }

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return suggestions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}

/**
 * Get domain-specific suggestions
 */
function getDomainSpecificSuggestion(domainId: string, domainName: string, content: string): ResumeSuggestion | null {
  const contentLower = content.toLowerCase();

  const domainSuggestions: Record<string, ResumeSuggestion> = {
    'frontend-dev': {
      category: 'experience',
      priority: 'high',
      title: 'Showcase UI/UX Projects',
      description: 'Include links to live projects or portfolio. Highlight responsive design, accessibility, and performance optimization work.',
      icon: '🎨',
    },
    'backend-dev': {
      category: 'skills',
      priority: 'high',
      title: 'Highlight System Design Experience',
      description: 'Emphasize your experience with scalable architectures, database optimization, and API design. Include system complexity you\'ve handled.',
      icon: '⚙️',
    },
    'data-analyst': {
      category: 'experience',
      priority: 'high',
      title: 'Demonstrate Data-Driven Impact',
      description: 'Highlight specific insights you\'ve generated and their business impact. Include experience with data visualization and reporting tools.',
      icon: '📈',
    },
    'product-manager': {
      category: 'content',
      priority: 'high',
      title: 'Emphasize Product Impact',
      description: 'Showcase product launches, user growth metrics, and cross-functional team leadership. Highlight your strategic thinking and stakeholder management.',
      icon: '📱',
    },
  };

  return domainSuggestions[domainId] || null;
}

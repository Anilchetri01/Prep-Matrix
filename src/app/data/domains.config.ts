/**
 * Universal career domain catalog for Manual Interview Mode.
 *
 * Domain configs stay lightweight; the question bank generator expands each
 * domain into exactly 20 beginner, 20 intermediate, and 20 advanced questions.
 */

export type DomainCategory =
  | 'technology'
  | 'ai-careers'
  | 'business-management'
  | 'finance-commerce'
  | 'marketing-sales'
  | 'healthcare'
  | 'education'
  | 'government-public-sector'
  | 'hospitality-tourism'
  | 'media-communication'
  | 'legal'
  | 'engineering'
  | 'creative-design'
  | 'operations-support';

export interface DomainConfig {
  id: string;
  name: string;
  icon: string;
  category: DomainCategory;
  description: string;
}

export const DOMAIN_CATEGORIES = [
  { id: 'all', label: 'All Careers', icon: 'ALL' },
  { id: 'technology', label: 'Technology', icon: 'TECH' },
  { id: 'ai-careers', label: 'AI Careers', icon: 'AI' },
  { id: 'business-management', label: 'Business & Management', icon: 'BIZ' },
  { id: 'finance-commerce', label: 'Finance & Commerce', icon: 'FIN' },
  { id: 'marketing-sales', label: 'Marketing & Sales', icon: 'MKT' },
  { id: 'healthcare', label: 'Healthcare', icon: 'HLTH' },
  { id: 'education', label: 'Education', icon: 'EDU' },
  { id: 'government-public-sector', label: 'Government & Public Sector', icon: 'GOV' },
  { id: 'hospitality-tourism', label: 'Hospitality & Tourism', icon: 'HOSP' },
  { id: 'media-communication', label: 'Media & Communication', icon: 'MEDIA' },
  { id: 'legal', label: 'Legal', icon: 'LAW' },
  { id: 'engineering', label: 'Engineering', icon: 'ENG' },
  { id: 'creative-design', label: 'Creative & Design', icon: 'ART' },
  { id: 'operations-support', label: 'Operations & Support', icon: 'OPS' },
] as const;

export const DOMAIN_CONFIGS: DomainConfig[] = [
  // Technology
  { id: 'frontend-dev', name: 'Frontend Developer', icon: 'FE', category: 'technology', description: 'HTML, CSS, JavaScript, TypeScript, React, accessibility, browser performance' },
  { id: 'react-dev', name: 'React Developer', icon: 'RX', category: 'technology', description: 'React, hooks, state management, component design, testing, performance' },
  { id: 'backend-dev', name: 'Backend Developer', icon: 'BE', category: 'technology', description: 'Node.js, Python, Java, REST APIs, authentication, caching, databases' },
  { id: 'fullstack-dev', name: 'Full Stack Developer', icon: 'FS', category: 'technology', description: 'Frontend, backend, databases, API design, deployment, product delivery' },
  { id: 'mobile-android', name: 'Android Developer', icon: 'AD', category: 'technology', description: 'Kotlin, Java, Android SDK, Jetpack, Material Design, app lifecycle' },
  { id: 'mobile-ios', name: 'iOS Developer', icon: 'iOS', category: 'technology', description: 'Swift, SwiftUI, UIKit, Xcode, app lifecycle, App Store delivery' },
  { id: 'mobile-flutter', name: 'Flutter Developer', icon: 'FL', category: 'technology', description: 'Dart, Flutter, widgets, state management, cross-platform mobile apps' },
  { id: 'mobile-react-native', name: 'React Native Developer', icon: 'RN', category: 'technology', description: 'React Native, JavaScript, native modules, navigation, mobile performance' },
  { id: 'dsa', name: 'Data Structures & Algorithms', icon: 'DS', category: 'technology', description: 'Arrays, strings, trees, graphs, dynamic programming, complexity analysis' },
  { id: 'system-design', name: 'System Design', icon: 'SD', category: 'technology', description: 'Architecture, scalability, distributed systems, reliability, trade-offs' },
  { id: 'devops', name: 'DevOps Engineer', icon: 'DO', category: 'technology', description: 'CI/CD, Docker, Kubernetes, Linux, observability, infrastructure automation' },
  { id: 'cloud-engineer', name: 'Cloud Engineer', icon: 'CL', category: 'technology', description: 'AWS, Azure, GCP, IAM, networking, compute, storage, cloud architecture' },
  { id: 'cybersecurity', name: 'Cybersecurity Specialist', icon: 'CS', category: 'technology', description: 'Application security, network security, IAM, threat modeling, incident response' },
  { id: 'qa-automation', name: 'QA / Automation Engineer', icon: 'QA', category: 'technology', description: 'Manual testing, test automation, Selenium, Playwright, API testing, CI quality gates' },
  { id: 'database-sql', name: 'Database Engineer (SQL)', icon: 'SQL', category: 'technology', description: 'PostgreSQL, MySQL, indexing, query optimization, transactions, schema design' },
  { id: 'database-nosql', name: 'Database Engineer (NoSQL)', icon: 'NSQ', category: 'technology', description: 'MongoDB, Redis, DynamoDB, document models, key-value stores, data modeling' },
  { id: 'networking', name: 'Network Engineer', icon: 'NW', category: 'technology', description: 'TCP/IP, DNS, routing, firewalls, VPNs, troubleshooting, network security' },
  { id: 'operating-systems', name: 'Operating Systems', icon: 'OS', category: 'technology', description: 'Processes, threads, memory, scheduling, Linux, filesystems, concurrency' },
  { id: 'sre', name: 'Site Reliability Engineer (SRE)', icon: 'SRE', category: 'technology', description: 'Reliability, SLIs, SLOs, incident response, observability, automation, capacity planning' },
  { id: 'platform-engineer', name: 'Platform Engineer', icon: 'PE', category: 'technology', description: 'Internal developer platforms, Kubernetes, CI/CD, infrastructure as code, golden paths' },
  { id: 'embedded-systems-engineer', name: 'Embedded Systems Engineer', icon: 'EMB', category: 'technology', description: 'C, C++, microcontrollers, RTOS, firmware, sensors, hardware interfaces' },
  { id: 'game-developer', name: 'Game Developer', icon: 'GAME', category: 'technology', description: 'Unity, Unreal Engine, gameplay systems, physics, rendering, optimization, C# and C++' },
  { id: 'ar-vr-developer', name: 'AR/VR Developer', icon: 'ARVR', category: 'technology', description: 'Augmented reality, virtual reality, 3D interaction, spatial computing, Unity, Unreal' },
  { id: 'bi-developer', name: 'BI Developer', icon: 'BI', category: 'technology', description: 'Power BI, Tableau, SQL, data modeling, dashboards, reporting, KPI design' },
  { id: 'erp-consultant', name: 'ERP Consultant', icon: 'ERP', category: 'technology', description: 'ERP implementation, SAP, Oracle, business processes, configuration, user adoption' },
  { id: 'salesforce-developer', name: 'Salesforce Developer', icon: 'SF', category: 'technology', description: 'Apex, Lightning Web Components, Salesforce flows, CRM customization, integrations' },

  // AI careers and data
  { id: 'data-analyst', name: 'Data Analyst', icon: 'DA', category: 'ai-careers', description: 'SQL, Excel, dashboards, statistics, data cleaning, insights, visualization' },
  { id: 'data-scientist', name: 'Data Scientist', icon: 'DSC', category: 'ai-careers', description: 'Python, statistics, experiments, feature engineering, machine learning, model evaluation' },
  { id: 'ml-engineer', name: 'Machine Learning Engineer', icon: 'ML', category: 'ai-careers', description: 'ML pipelines, model training, deployment, monitoring, TensorFlow, PyTorch, MLOps' },
  { id: 'ai-engineer', name: 'AI Engineer', icon: 'AI', category: 'ai-careers', description: 'LLMs, NLP, computer vision, prompt engineering, evaluation, AI application architecture' },
  { id: 'data-engineer', name: 'Data Engineer', icon: 'DE', category: 'ai-careers', description: 'ETL, data pipelines, Spark, Airflow, data warehouses, streaming, data quality' },
  { id: 'prompt-engineer', name: 'Prompt Engineer', icon: 'PR', category: 'ai-careers', description: 'Prompt design, evaluation, LLM behavior, tool use, guardrails, structured outputs' },
  { id: 'ai-content-strategist', name: 'AI Content Strategist', icon: 'AIC', category: 'ai-careers', description: 'AI-assisted content workflows, editorial strategy, brand voice, human review, analytics' },
  { id: 'ai-automation-specialist', name: 'AI Automation Specialist', icon: 'AIA', category: 'ai-careers', description: 'Workflow automation, agents, APIs, no-code tools, process mapping, governance' },
  { id: 'generative-ai-engineer', name: 'Generative AI Engineer', icon: 'GAI', category: 'ai-careers', description: 'LLM apps, RAG, embeddings, vector databases, evaluation, safety, deployment' },
  { id: 'mlops-engineer', name: 'MLOps Engineer', icon: 'MLO', category: 'ai-careers', description: 'Model deployment, monitoring, CI/CD for ML, feature stores, drift detection, reproducibility' },

  // Business and management
  { id: 'product-manager', name: 'Product Manager', icon: 'PM', category: 'business-management', description: 'Product strategy, discovery, roadmaps, metrics, stakeholder management, prioritization' },
  { id: 'project-manager', name: 'Project Manager', icon: 'PJM', category: 'business-management', description: 'Agile, Scrum, planning, risk management, delivery tracking, team coordination' },
  { id: 'business-analyst', name: 'Business Analyst', icon: 'BA', category: 'business-management', description: 'Requirements, process mapping, stakeholder analysis, documentation, acceptance criteria' },
  { id: 'hr-manager', name: 'HR Manager', icon: 'HR', category: 'business-management', description: 'Recruitment, employee relations, HR policy, performance management, compliance' },
  { id: 'customer-success-manager', name: 'Customer Success Manager', icon: 'CSM', category: 'business-management', description: 'Customer onboarding, adoption, retention, renewals, health scores, account growth' },
  { id: 'talent-acquisition-specialist', name: 'Talent Acquisition Specialist', icon: 'TA', category: 'business-management', description: 'Sourcing, screening, interview coordination, employer branding, hiring analytics' },
  { id: 'management-consultant', name: 'Management Consultant', icon: 'MC', category: 'business-management', description: 'Problem solving, strategy, market analysis, operating models, client presentations' },
  { id: 'startup-founder', name: 'Entrepreneur / Startup Founder', icon: 'ST', category: 'business-management', description: 'Business models, fundraising, product-market fit, go-to-market, leadership, operations' },
  { id: 'business-development-executive', name: 'Business Development Executive', icon: 'BD', category: 'business-management', description: 'Lead generation, partnerships, sales strategy, negotiation, market expansion, CRM' },

  // Finance and commerce
  { id: 'financial-analyst', name: 'Financial Analyst', icon: 'FA', category: 'finance-commerce', description: 'Financial modeling, budgeting, forecasting, valuation, reporting, variance analysis' },
  { id: 'accountant', name: 'Accountant', icon: 'AC', category: 'finance-commerce', description: 'Accounting principles, reconciliations, financial statements, tax basics, controls' },
  { id: 'chartered-accountant', name: 'Chartered Accountant', icon: 'CA', category: 'finance-commerce', description: 'Audit, taxation, financial reporting, compliance, accounting standards, advisory' },
  { id: 'investment-banker', name: 'Investment Banker', icon: 'IB', category: 'finance-commerce', description: 'Valuation, M&A, capital markets, pitch books, financial modeling, due diligence' },
  { id: 'auditor', name: 'Auditor', icon: 'AUD', category: 'finance-commerce', description: 'Internal audit, external audit, controls testing, risk assessment, evidence, reporting' },
  { id: 'tax-consultant', name: 'Tax Consultant', icon: 'TAX', category: 'finance-commerce', description: 'Tax planning, direct tax, indirect tax, compliance, filings, advisory, documentation' },
  { id: 'financial-planner', name: 'Financial Planner', icon: 'FP', category: 'finance-commerce', description: 'Personal finance, retirement planning, insurance, investments, risk profiling, client advice' },

  // Marketing and sales
  { id: 'digital-marketing-specialist', name: 'Digital Marketing Specialist', icon: 'DM', category: 'marketing-sales', description: 'SEO, SEM, social media, email marketing, analytics, campaign optimization' },
  { id: 'seo-specialist', name: 'SEO Specialist', icon: 'SEO', category: 'marketing-sales', description: 'Technical SEO, on-page SEO, keyword research, link building, analytics, content strategy' },
  { id: 'sales-executive', name: 'Sales Executive', icon: 'SE', category: 'marketing-sales', description: 'Prospecting, qualification, discovery, negotiation, CRM, pipeline management' },
  { id: 'social-media-manager', name: 'Social Media Manager', icon: 'SMM', category: 'marketing-sales', description: 'Social strategy, content calendars, community management, analytics, platform trends' },

  // Healthcare
  { id: 'doctor', name: 'Doctor', icon: 'DR', category: 'healthcare', description: 'Patient diagnosis, clinical reasoning, treatment planning, ethics, communication, emergency care' },
  { id: 'nurse', name: 'Nurse', icon: 'NR', category: 'healthcare', description: 'Patient care, vital signs, medication administration, infection control, triage, documentation' },
  { id: 'pharmacist', name: 'Pharmacist', icon: 'PH', category: 'healthcare', description: 'Medication safety, drug interactions, dispensing, patient counseling, inventory, compliance' },
  { id: 'medical-lab-technician', name: 'Medical Lab Technician', icon: 'MLT', category: 'healthcare', description: 'Sample collection, lab testing, quality control, biosafety, reporting, equipment handling' },
  { id: 'physiotherapist', name: 'Physiotherapist', icon: 'PT', category: 'healthcare', description: 'Rehabilitation, mobility assessment, exercise therapy, pain management, patient education' },
  { id: 'hospital-administrator', name: 'Hospital Administrator', icon: 'HA', category: 'healthcare', description: 'Hospital operations, patient flow, staffing, compliance, healthcare quality, budgeting' },

  // Education
  { id: 'school-teacher', name: 'School Teacher', icon: 'TCH', category: 'education', description: 'Lesson planning, classroom management, pedagogy, assessment, child development, parent communication' },
  { id: 'lecturer', name: 'Lecturer', icon: 'LEC', category: 'education', description: 'Higher education teaching, lectures, curriculum, assessment, student mentoring, academic integrity' },
  { id: 'professor', name: 'Professor', icon: 'PROF', category: 'education', description: 'Teaching, research, publications, academic leadership, supervision, grants, curriculum design' },
  { id: 'academic-counselor', name: 'Academic Counselor', icon: 'ACN', category: 'education', description: 'Student guidance, career planning, academic advising, counseling ethics, progress tracking' },

  // Government and public sector
  { id: 'civil-services', name: 'Civil Services', icon: 'CIV', category: 'government-public-sector', description: 'Governance, public policy, administration, ethics, current affairs, citizen services' },
  { id: 'banking-exams', name: 'Banking Exams', icon: 'BNK', category: 'government-public-sector', description: 'Banking awareness, quantitative aptitude, reasoning, financial products, customer service' },
  { id: 'railway-jobs', name: 'Railway Jobs', icon: 'RLY', category: 'government-public-sector', description: 'Railway operations, safety, technical aptitude, public service, logistics, regulations' },
  { id: 'defense-services', name: 'Defense Services', icon: 'DEF', category: 'government-public-sector', description: 'Leadership, discipline, national security, physical readiness, strategy, ethics' },
  { id: 'public-administration', name: 'Public Administration', icon: 'PAD', category: 'government-public-sector', description: 'Policy implementation, public finance, governance, service delivery, accountability' },

  // Hospitality and tourism
  { id: 'hotel-manager', name: 'Hotel Manager', icon: 'HM', category: 'hospitality-tourism', description: 'Guest experience, hotel operations, staff management, revenue, housekeeping, service recovery' },
  { id: 'chef', name: 'Chef', icon: 'CHF', category: 'hospitality-tourism', description: 'Food preparation, kitchen operations, menu planning, hygiene, costing, team coordination' },
  { id: 'travel-consultant', name: 'Travel Consultant', icon: 'TRV', category: 'hospitality-tourism', description: 'Travel planning, itinerary design, bookings, customer needs, visas, destination knowledge' },
  { id: 'event-manager', name: 'Event Manager', icon: 'EVT', category: 'hospitality-tourism', description: 'Event planning, vendors, budgeting, logistics, risk management, client coordination' },

  // Media and communication
  { id: 'journalist', name: 'Journalist', icon: 'JRN', category: 'media-communication', description: 'Reporting, research, interviewing, fact-checking, media ethics, writing, deadlines' },
  { id: 'public-relations-specialist', name: 'Public Relations Specialist', icon: 'PR', category: 'media-communication', description: 'Media relations, reputation management, press releases, crisis communication, stakeholder messaging' },
  { id: 'news-anchor', name: 'News Anchor', icon: 'NA', category: 'media-communication', description: 'Broadcast communication, live reporting, editorial judgment, interviewing, voice modulation' },

  // Legal
  { id: 'legal-advisor', name: 'Legal Advisor', icon: 'LA', category: 'legal', description: 'Contracts, legal risk, regulatory compliance, policy advice, negotiation, documentation' },
  { id: 'corporate-lawyer', name: 'Corporate Lawyer', icon: 'CLW', category: 'legal', description: 'Corporate law, contracts, mergers, governance, compliance, due diligence, negotiation' },
  { id: 'legal-consultant', name: 'Legal Consultant', icon: 'LC', category: 'legal', description: 'Legal advisory, risk assessment, contracts, regulatory interpretation, client counseling' },
  { id: 'compliance-officer', name: 'Compliance Officer', icon: 'CO', category: 'legal', description: 'Regulatory compliance, internal controls, audits, policies, risk mitigation, reporting' },

  // Engineering
  { id: 'mechanical-engineer', name: 'Mechanical Engineer', icon: 'ME', category: 'engineering', description: 'Mechanical design, thermodynamics, manufacturing, CAD, maintenance, quality, safety' },
  { id: 'civil-engineer', name: 'Civil Engineer', icon: 'CE', category: 'engineering', description: 'Structural design, construction management, surveying, materials, safety, project planning' },
  { id: 'electrical-engineer', name: 'Electrical Engineer', icon: 'EE', category: 'engineering', description: 'Electrical circuits, power systems, protection, control systems, safety, maintenance' },
  { id: 'electronics-communication-engineer', name: 'Electronics & Communication Engineer', icon: 'ECE', category: 'engineering', description: 'Electronics, communication systems, signals, embedded basics, networking, circuit design' },
  { id: 'production-engineer', name: 'Production Engineer', icon: 'PE', category: 'engineering', description: 'Manufacturing processes, production planning, lean, process improvement, quality, safety' },
  { id: 'quality-engineer', name: 'Quality Engineer', icon: 'QE', category: 'engineering', description: 'Quality systems, root cause analysis, inspections, process control, ISO standards, CAPA' },

  // Creative and design
  { id: 'ui-ux-designer', name: 'UI/UX Designer', icon: 'UX', category: 'creative-design', description: 'User research, Figma, design systems, prototyping, usability testing, accessibility' },
  { id: 'graphic-designer', name: 'Graphic Designer', icon: 'GD', category: 'creative-design', description: 'Visual design, typography, branding, layout, Adobe tools, creative briefs' },
  { id: 'content-writer', name: 'Content Writer', icon: 'CW', category: 'creative-design', description: 'Writing, editing, SEO content, brand voice, research, content planning, audience fit' },
  { id: 'video-editor', name: 'Video Editor', icon: 'VE', category: 'creative-design', description: 'Editing workflows, storytelling, pacing, color, audio, Premiere Pro, DaVinci Resolve' },
  { id: 'motion-designer', name: 'Motion Designer', icon: 'MD', category: 'creative-design', description: 'Motion graphics, animation principles, After Effects, storyboarding, visual effects' },

  // Operations and support
  { id: 'operations-manager', name: 'Operations Manager', icon: 'OM', category: 'operations-support', description: 'Process optimization, SOPs, resource planning, operational metrics, team leadership' },
  { id: 'tech-support', name: 'Technical Support Engineer', icon: 'TS', category: 'operations-support', description: 'Troubleshooting, ticketing, logs, escalation, customer communication, IT support' },
  { id: 'supply-chain-analyst', name: 'Supply Chain Analyst', icon: 'SC', category: 'operations-support', description: 'Demand planning, inventory analysis, logistics metrics, procurement, supply chain optimization' },
  { id: 'blockchain', name: 'Blockchain Developer', icon: 'BC', category: 'technology', description: 'Web3, smart contracts, Solidity, consensus, wallets, security, decentralized applications' },
];

export function getDomainsByCategory(category: string): DomainConfig[] {
  if (category === 'all') return DOMAIN_CONFIGS;
  return DOMAIN_CONFIGS.filter((domain) => domain.category === category);
}

export function getDomainById(id: string): DomainConfig | undefined {
  return DOMAIN_CONFIGS.find((domain) => domain.id === id);
}

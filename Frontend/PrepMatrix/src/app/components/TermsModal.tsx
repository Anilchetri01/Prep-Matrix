import React from 'react';
import {
  AlertTriangle,
  Ban,
  Brain,
  Cloud,
  Copyright,
  FileText,
  LockKeyhole,
  Mail,
  RefreshCw,
  ShieldCheck,
  Upload,
  UserCircle,
  X,
} from 'lucide-react';
import { APP_NAME } from '../constants/branding';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface TermsSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  body: React.ReactNode;
}

const CONTACT_EMAIL = 'prepmatrix07@gmail.com';
const LAST_UPDATED = 'May 2026';

const sections: TermsSection[] = [
  {
    title: 'Introduction',
    icon: FileText,
    body: (
      <>
        <p>
          {APP_NAME} is an AI-powered interview preparation platform designed to help users practice interviews,
          review performance, analyze resumes, and build confidence across multiple career domains.
        </p>
        <p>
          These Terms of Service govern your access to and use of {APP_NAME}. By creating an account, signing in,
          or using the platform, you agree to follow these Terms.
        </p>
      </>
    ),
  },
  {
    title: 'User Accounts',
    icon: UserCircle,
    body: (
      <>
        <p>
          You may create an account using email and password authentication or sign in with supported third-party
          authentication methods such as Google OAuth.
        </p>
        <ul>
          <li>You are responsible for keeping your login credentials secure.</li>
          <li>You must provide accurate account information and keep it reasonably up to date.</li>
          <li>You are responsible for activity that occurs through your account.</li>
          <li>You should notify us if you believe your account has been accessed without permission.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Acceptable Use',
    icon: Ban,
    body: (
      <>
        <p>{APP_NAME} must be used for lawful interview preparation, learning, and career-readiness purposes.</p>
        <ul>
          <li>Do not attempt to hack, disrupt, reverse engineer, overload, or bypass platform protections.</li>
          <li>Do not abuse AI features, submit harmful prompts, or use the service to generate unlawful content.</li>
          <li>Do not scrape, crawl, harvest, or automate access to platform data without permission.</li>
          <li>Do not impersonate others, upload deceptive content, or interfere with another user's experience.</li>
          <li>Do not submit malicious files, spam, or content that is abusive, discriminatory, or illegal.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'AI Features Disclaimer',
    icon: Brain,
    body: (
      <>
        <p>
          {APP_NAME} provides AI-assisted interview practice, response feedback, scoring, analytics, and learning
          suggestions. AI-generated outputs are dynamic and may vary between sessions.
        </p>
        <ul>
          <li>AI feedback is guidance-based and may not always be complete, accurate, or suitable for every role.</li>
          <li>Scores and evaluations are preparation aids, not certified assessments or hiring recommendations.</li>
          <li>You should use independent judgment and additional resources when making career decisions.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Resume Analysis Disclaimer',
    icon: Upload,
    body: (
      <>
        <p>
          Resume Analysis helps users review uploaded resumes for educational and career-preparation purposes.
          You are responsible for the content you upload and for ensuring you have the right to submit it.
        </p>
        <ul>
          <li>Do not upload resumes or documents containing information you are not authorized to share.</li>
          <li>Avoid uploading highly sensitive personal, financial, medical, or confidential information.</li>
          <li>Resume feedback is informational and should not be treated as a guarantee of job placement.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Privacy And Data Usage',
    icon: LockKeyhole,
    body: (
      <>
        <p>
          {APP_NAME} uses authentication and database services to operate account login, profile management,
          interview history, resume analysis, analytics, leaderboard features, and candidate discovery.
        </p>
        <ul>
          <li>Authentication may be handled through Supabase Auth and Google OAuth where supported.</li>
          <li>Profile data may include your name, email address, avatar, skills, and platform preferences.</li>
          <li>Interview sessions, resume analysis records, scores, and usage analytics may be stored for your account.</li>
          <li>Access controls are used to help ensure private account data is available only to authorized users.</li>
        </ul>
      </>
    ),
  },
  {
    title: 'Intellectual Property',
    icon: Copyright,
    body: (
      <>
        <p>
          PrepMatrix branding, interface designs, platform workflows, question structures, documentation, and
          protected platform assets belong to {APP_NAME} or its licensors.
        </p>
        <p>
          You retain ownership of content you submit, such as resume files and interview responses. You grant
          {APP_NAME} permission to process that content as needed to provide the service.
        </p>
      </>
    ),
  },
  {
    title: 'Service Availability',
    icon: Cloud,
    body: (
      <>
        <p>
          {APP_NAME} may evolve over time. Features, designs, data structures, AI behavior, limits, and supported
          domains may be updated, modified, suspended, or discontinued.
        </p>
        <p>
          We aim to provide a reliable experience, but the platform may occasionally be unavailable due to
          maintenance, infrastructure changes, provider outages, or unexpected technical issues.
        </p>
      </>
    ),
  },
  {
    title: 'Limitation Of Liability',
    icon: ShieldCheck,
    body: (
      <>
        <p>
          {APP_NAME} is provided on an "as is" and "as available" basis. To the maximum extent permitted by law,
          we disclaim warranties regarding uninterrupted access, error-free operation, or the accuracy of AI
          feedback, scores, resume analysis, or platform recommendations.
        </p>
        <p>
          {APP_NAME} is not liable for career outcomes, hiring decisions, lost data, service interruptions, or
          damages arising from your use of or inability to use the platform.
        </p>
      </>
    ),
  },
  {
    title: 'Termination',
    icon: AlertTriangle,
    body: (
      <>
        <p>
          We may suspend, restrict, or remove access to accounts that violate these Terms, misuse the service,
          compromise platform security, or create risk for other users.
        </p>
        <p>
          Misuse includes abusive behavior, unauthorized access attempts, harmful automation, policy violations,
          or repeated activity that disrupts the platform.
        </p>
      </>
    ),
  },
  {
    title: 'Updates To Terms',
    icon: RefreshCw,
    body: (
      <>
        <p>
          These Terms may be updated from time to time to reflect new features, legal requirements, security
          practices, or platform changes.
        </p>
        <p>
          Continued use of {APP_NAME} after updated Terms are posted means you accept the revised Terms.
        </p>
      </>
    ),
  },
  {
    title: 'Contact Information',
    icon: Mail,
    body: (
      <p>
        For questions about these Terms, contact{' '}
        <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-300 dark:hover:text-indigo-200">
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    ),
  },
];

export function TermsModal({ isOpen, onClose }: TermsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm" />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-title"
        className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-950"
      >
        <header className="flex flex-col gap-4 border-b border-slate-200 bg-slate-50 px-5 py-5 dark:border-slate-800 dark:bg-slate-900/80 sm:flex-row sm:items-start sm:justify-between sm:px-7">
          <div className="flex gap-3">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/20">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-600 dark:text-indigo-300">
                Legal
              </p>
              <h2 id="terms-title" className="mt-1 text-xl font-bold text-slate-950 dark:text-white sm:text-2xl">
                Terms of Service
              </h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                {APP_NAME} platform terms. Last updated {LAST_UPDATED}.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Terms of Service"
            className="absolute right-4 top-4 rounded-xl p-2 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white sm:static"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-7">
          <div className="grid gap-4">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <article
                  key={section.title}
                  className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/60 sm:p-5"
                >
                  <div className="flex gap-3">
                    <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-indigo-600 dark:bg-slate-800 dark:text-indigo-300">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-slate-950 dark:text-white">{section.title}</h3>
                      <div className="mt-2 space-y-3 text-sm leading-6 text-slate-700 dark:text-slate-300 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1.5">
                        {section.body}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 bg-white px-5 py-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row sm:px-7">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-900 sm:flex-1"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition hover:translate-y-[-1px] hover:shadow-indigo-500/30 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-950 sm:flex-1"
          >
            I Have Read And Agree
          </button>
        </footer>
      </section>
    </div>
  );
}

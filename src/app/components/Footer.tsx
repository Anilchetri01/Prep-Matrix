import React, { useState } from 'react';
import emailjs from '@emailjs/browser';
import { CheckCircle2, Github, Linkedin, Mail, MapPin, Send, XCircle } from 'lucide-react';

import { APP_NAME, APP_TAGLINE } from '../constants/branding';
import { AppLogo } from './AppLogo';

const CONTACT_EMAIL = 'prepmatrix07@gmail.com';

const teamMembers = [
  {
    name: 'Anil Chetri',
    role: 'Full Stack Developer',
    github: 'https://github.com/Anilchetri01',
    linkedin: 'https://www.linkedin.com/feed/',
  },
  {
    name: 'Keshab Thakur',
    role: 'Full Stack Developer',
    github: 'https://github.com/keshabthakur935',
    linkedin: 'https://www.linkedin.com/in/keshab-thakur-a00972353',
  },
  {
    name: 'Masruf Ali',
    role: 'Full Stack Developer',
    github: 'https://github.com/Masruf-Ali',
    linkedin: 'https://www.linkedin.com/in/masruf-ali-09739835a/',
  },
];

export function Footer() {
  const [formData, setFormData] = useState({
    email: '',
    message: '',
    name: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!formData.message.trim()) {
      newErrors.message = 'Message is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const serviceId = 'service_ity2tkc';
      const templateId = 'template_o917511';
      const publicKey = 'IelSj4qTjRselKe8k';

      await emailjs.send(
        serviceId,
        templateId,
        {
          from_email: formData.email,
          from_name: formData.name,
          message: formData.message,
          reply_to: CONTACT_EMAIL,
          to_name: `${APP_NAME} Team`,
        },
        publicKey,
      );

      setSubmitStatus('success');
      setFormData({ email: '', message: '', name: '' });
      setErrors({});
      window.setTimeout(() => setSubmitStatus('idle'), 5000);
    } catch (error) {
      console.error('EmailJS Error:', error);
      setSubmitStatus('error');
      window.setTimeout(() => setSubmitStatus('idle'), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((previousData) => ({ ...previousData, [name]: value }));

    if (errors[name]) {
      setErrors((previousErrors) => ({ ...previousErrors, [name]: '' }));
    }
  };

  const inputBaseClass =
    'w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 outline-none transition focus:ring-2 dark:bg-gray-950 dark:text-white';

  return (
    <footer className="mt-auto border-t border-gray-200 bg-white/95 dark:border-gray-800 dark:bg-gray-950/95">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1.1fr_1fr_1.15fr] lg:px-8">
        <section>
          <div className="flex items-center gap-3">
            <AppLogo variant="dark" className="h-9 w-9 shrink-0" />
            <div>
              <p className="text-base font-bold text-gray-950 dark:text-white">{APP_NAME}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300">
                {APP_TAGLINE}
              </p>
            </div>
          </div>

          <p className="mt-3 max-w-sm text-sm leading-5 text-gray-600 dark:text-gray-400">
            AI-powered preparation across 97+ professional career domains.
          </p>

          <div className="mt-4 space-y-2">
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-2 text-sm text-gray-600 transition-colors hover:text-indigo-600 dark:text-gray-400 dark:hover:text-indigo-300"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <Mail className="h-3.5 w-3.5" />
              </span>
              <span className="break-all">{CONTACT_EMAIL}</span>
            </a>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                <MapPin className="h-3.5 w-3.5" />
              </span>
              <span>India</span>
            </div>
          </div>
        </section>

        <section>
          <h4 className="text-sm font-bold text-gray-950 dark:text-white">Project Team</h4>
          <ul className="mt-3 space-y-2.5">
            {teamMembers.map((member) => (
              <li key={member.name} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {member.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{member.role}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <a
                    href={member.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${member.name} on GitHub`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition hover:bg-gray-900 hover:text-white dark:bg-white/5 dark:text-gray-300 dark:hover:bg-white dark:hover:text-gray-950"
                  >
                    <Github className="h-3.5 w-3.5" />
                  </a>
                  <a
                    href={member.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${member.name} on LinkedIn`}
                    className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-600 transition hover:bg-blue-600 hover:text-white dark:bg-white/5 dark:text-gray-300"
                  >
                    <Linkedin className="h-3.5 w-3.5" />
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between gap-3">
            <h4 className="text-sm font-bold text-gray-950 dark:text-white">Contact Us</h4>
            <span className="hidden text-xs text-gray-500 dark:text-gray-400 sm:inline">
              Quick project inquiry
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-2">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <input
                  type="text"
                  name="name"
                  placeholder="Name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`${inputBaseClass} ${
                    errors.name
                      ? 'border-red-300 focus:ring-red-500 dark:border-red-700'
                      : 'border-gray-300 focus:border-indigo-400 focus:ring-indigo-500/30 dark:border-gray-800'
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.name}</p>}
              </div>

              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`${inputBaseClass} ${
                    errors.email
                      ? 'border-red-300 focus:ring-red-500 dark:border-red-700'
                      : 'border-gray-300 focus:border-indigo-400 focus:ring-indigo-500/30 dark:border-gray-800'
                  }`}
                />
                {errors.email && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.email}</p>}
              </div>
            </div>

            <div>
              <textarea
                name="message"
                placeholder="Message"
                rows={2}
                value={formData.message}
                onChange={handleChange}
                className={`${inputBaseClass} resize-none ${
                  errors.message
                    ? 'border-red-300 focus:ring-red-500 dark:border-red-700'
                    : 'border-gray-300 focus:border-indigo-400 focus:ring-indigo-500/30 dark:border-gray-800'
                }`}
              />
              {errors.message && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.message}</p>}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm transition hover:from-indigo-700 hover:to-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Sending
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Send Message
                </>
              )}
            </button>

            {submitStatus === 'success' && (
              <div className="flex items-center gap-2 rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700 dark:bg-green-900/20 dark:text-green-300">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                <span>Message sent successfully.</span>
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
                <XCircle className="h-3.5 w-3.5 shrink-0" />
                <span>Failed to send. Please try again.</span>
              </div>
            )}
          </form>
        </section>
      </div>

      <div className="border-t border-gray-200 px-4 py-3 dark:border-gray-800">
        <p className="text-center text-xs text-gray-500 dark:text-gray-400">
          © 2026 {APP_NAME} — Academic Project
        </p>
      </div>
    </footer>
  );
}

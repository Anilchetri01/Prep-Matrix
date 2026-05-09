import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { Dashboard } from './pages/Dashboard';
import { ManualMode } from './pages/ManualMode';
import { Interview } from './pages/Interview';
import { Results } from './pages/Results';
import { InterviewHistory } from './pages/InterviewHistory';
import { Leaderboard } from './pages/Leaderboard';
import { Profile } from './pages/Profile';
import { AdminPanel } from './pages/AdminPanel';
import { ResumeAnalysis } from './pages/ResumeAnalysis';
import { Candidates } from './pages/Candidates';
import { LoadingSpinner } from './components/LoadingSpinner';
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute';

const AIInterview = lazy(() => import('./pages/AIInterview'));
const AIInterviewSessionDetail = lazy(() => import('./pages/AIInterviewSessionDetail'));

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/signup',
    element: <Signup />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/manual-mode',
    element: (
      <ProtectedRoute>
        <ManualMode />
      </ProtectedRoute>
    ),
  },
  {
    path: '/interview',
    element: (
      <ProtectedRoute>
        <Interview />
      </ProtectedRoute>
    ),
  },
  {
    path: '/interview/:id',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner fullPage message="Loading interview details..." />}>
          <AIInterviewSessionDetail />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/results/:id',
    element: (
      <ProtectedRoute>
        <Results />
      </ProtectedRoute>
    ),
  },
  {
    path: '/history',
    element: (
      <ProtectedRoute>
        <InterviewHistory />
      </ProtectedRoute>
    ),
  },
  {
    path: '/ai-mode',
    element: (
      <ProtectedRoute>
        <Suspense fallback={<LoadingSpinner fullPage message="Loading AI Mode..." />}>
          <AIInterview />
        </Suspense>
      </ProtectedRoute>
    ),
  },
  {
    path: '/ai-interview',
    element: <Navigate to="/ai-mode" replace />,
  },
  {
    path: '/resume-analysis',
    element: (
      <ProtectedRoute>
        <ResumeAnalysis />
      </ProtectedRoute>
    ),
  },
  {
    path: '/resume',
    element: <Navigate to="/resume-analysis" replace />,
  },
  {
    path: '/leaderboard',
    element: (
      <ProtectedRoute>
        <Leaderboard />
      </ProtectedRoute>
    ),
  },
  {
    path: '/candidates',
    element: (
      <ProtectedRoute>
        <Candidates />
      </ProtectedRoute>
    ),
  },
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <Profile />
      </ProtectedRoute>
    ),
  },
  {
    path: '/admin',
    element: (
      <AdminRoute>
        <AdminPanel />
      </AdminRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
]);

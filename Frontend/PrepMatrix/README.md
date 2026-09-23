# PrepMatrix - Frontend Application

PrepMatrix is a modern, high-performance web application designed for comprehensive interview preparation featuring both **Manual Practice** and **AI-Driven Dynamic Interviews**.

## Tech Stack

- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Routing**: [React Router 7](https://reactrouter.com/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **UI Primitives**: Radix UI Primitives, Lucide Icons, Sonner Toaster
- **State & Backend**: [Supabase JS Client](https://supabase.com/) (`@supabase/supabase-js`)
- **AI Engine**: Google Gemini API (`gemini-2.5-flash`) via local & serverless proxy
- **PDF Generation & Parsing**: jsPDF, pdfjs-dist

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your Supabase project credentials and Google Gemini API key.

### 3. Run Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`.

### 4. Build for Production
```bash
npm run build
```

### 5. Utility & Test Scripts
- Validate question bank integrity:
  ```bash
  npm run validate:manual-questions
  ```
- Run mobile swipe drawer gesture tests:
  ```bash
  npm run test:gestures
  ```

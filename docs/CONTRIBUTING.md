# Contributing to AfterClass

## Project Overview

AfterClass is a tuition management platform that enables teachers to create and manage tuition spaces, track attendance, conduct quizzes, and manage fee payments. Students can join tuitions, view classes, submit doubts, and pay fees.

## Tech Stack

- **Frontend**: React 19, React Router 7
- **Build Tool**: Vite 7
- **State Management**: Redux Toolkit
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS 4
- **Forms**: React Hook Form + Zod validation
- **Package Manager**: npm

## Getting Started

### Prerequisites

- Node.js 18+
- npm
- Supabase project (for local development)

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd after-class
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

---

## Folder Structure

```
src/
├── assets/              # Static assets (logos, images)
├── components/          # Reusable React components
│   ├── auth/            # Auth-specific layouts (AuthLayout)
│   ├── class-detail/    # Class detail page components
│   ├── dashboard/       # Dashboard components
│   │   ├── student/     # Student dashboard features
│   │   └── teacher/    # Teacher dashboard features
│   ├── payments/        # Payment-related components
│   ├── profile/         # Profile page components
│   └── tuition-detail/  # Tuition detail page components
├── lib/                 # Core library files
│   ├── supabase.js      # Supabase client initialization
│   ├── store.js         # Redux store configuration
│   ├── AuthContext.jsx  # Auth context provider
│   └── authSlice.js     # Redux slice for authentication
├── pages/               # Page-level components (routes)
├── schemas/            # Zod validation schemas
├── utilities/           # Utility functions (error handlers)
├── App.jsx              # Main app with routing
├── main.jsx             # Entry point
└── index.css            # Global styles (Tailwind imports)
```

---

## Code Conventions

### Component Structure

Components follow this pattern:

```jsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { someSchema } from '../../../schemas/some.schema';

function ComponentName({ prop1, onAction }) {
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(someSchema),
  });

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      // Supabase queries inline
      const { error } = await supabase.from('table').select('*');
      if (error) throw error;
      toast.success('Success!');
    } catch (err) {
      toast.error('Error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="...">
      {/* JSX */}
    </div>
  );
}

export default ComponentName;
```

### File Naming

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `CreateTuitionModal.jsx` |
| Pages | PascalCase | `TeacherDashboard.jsx` |
| Schemas | camelCase + .schema.js | `tuition.schema.js` |
| Utilities | camelCase | `errorHandler.js` |
| Redux slices | camelCase | `authSlice.js` |

### Supabase Queries

Queries are written inline within components, not in separate hooks:

```javascript
// Good - inline in component
const { data } = await supabase.from('profiles').select('*').eq('id', user.id);

// Avoid - creating separate query files (unless reusable across components)
```

### State Management

- **Redux**: Only for global authentication state (`authSlice.js`)
- **Local state**: `useState` for component-specific state
- **Context**: `AuthContext` for auth-related helpers

### Imports

Use relative paths with consistent depth:
```javascript
// From a nested component
import { supabase } from '../../../lib/supabase';
import { tuitionSchema } from '../../../schemas/tuition.schema';

// From a page component
import { supabase } from '../lib/supabase';
```

### Form Validation

All forms use React Hook Form + Zod. Schemas go in `src/schemas/`:

```javascript
import { z } from 'zod';

export const exampleSchema = z.object({
  fieldName: z.string().min(1, 'Error message'),
});
```

---

## Adding a New Feature

### Step 1: Create the Component

Create a new file in the appropriate `components/` subfolder:

```jsx
// src/components/feature/NewFeature.jsx
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { newFeatureSchema } from '../../schemas/newFeature.schema';

function NewFeature({ someProp }) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (data) => {
    setLoading(true);
    try {
      const { error } = await supabase.from('some_table').insert(data);
      if (error) throw error;
      toast.success('Action successful');
    } catch (err) {
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  return <div>...</div>;
}

export default NewFeature;
```

### Step 2: Add Route (if needed)

Add route in `src/App.jsx`:

```jsx
import NewFeature from './pages/NewFeature';

// Inside Router component:
<Route path="/new-feature" element={
  <PrivateRoute>
    <NewFeature />
  </PrivateRoute>
} />
```

### Step 3: Add Supabase Query

Add database operations inline in the component:

```javascript
const { data, error } = await supabase
  .from('table')
  .select('column1, column2, relation!inner(column)')
  .eq('filter_column', value);
```

### Step 4: Add RLS Policy

Run the SQL directly in Supabase SQL Editor:

```sql
ALTER TABLE public.some_table ENABLE ROW LEVEL SECURITY;

CREATE POLICY "description" ON public.some_table
  FOR SELECT USING (condition);
```

See [SECURITY.md](./SECURITY.md) for RLS policy guidelines.

### Step 5: Test

1. Run `npm run lint` to check for errors
2. Test the feature in development
3. Build with `npm run build`

---

## Branch & Commit Conventions

### Branches

- `main` - Production-ready code
- `feature/description` - New features
- `fix/description` - Bug fixes
- `refactor/description` - Code improvements

### Commits

Use [Conventional Commits](https://www.conventionalcommits.org/):

| Type | Use For |
|------|---------|
| `feat:` | New features |
| `fix:` | Bug fixes |
| `refactor:` | Code improvements without feature changes |
| `chore:` | Build process, tooling, dependencies |
| `docs:` | Documentation only |
| `style:` | Formatting, no code change |

Examples:
```
feat: add quiz attempt tracking
fix: resolve attendance mark issue
chore: update npm dependencies
docs: add API reference
refactor: student dashboard queries
```

### Commit Message Format

```
<type>: <description>

[optional body]
```

---

## What NOT to Do

### Security

- **Never use service_role key** in frontend code — only use anon key
- **Never commit `.env`** or any file with secrets — it's already in `.gitignore`
- **Never disable RLS** in production — all tables must have policies
- **Never expose user data** in console.log statements in production

### Code Quality

- **Don't skip ESLint** — run `npm run lint` before committing
- **Don't use console.log for debugging** in production — remove or wrap in conditionals
- **Don't skip validation** — always use Zod schemas for form inputs
- **Don't hardcode values** — use constants or environment variables

### Git

- **Don't push directly to `main`** — use feature branches and PRs
- **Don't force push** to shared branches

---

## Testing Checklist

Before submitting a PR:

- [ ] `npm run lint` passes with no errors
- [ ] `npm run build` succeeds
- [ ] New features have RLS policies
- [ ] No secrets in committed files
- [ ] Form validation works correctly
- [ ] Error states are handled gracefully
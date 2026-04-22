# Security

This document explains the security model used in AfterClass, covering authentication, database access control, and vulnerability reporting.

---

## Authentication

AfterClass uses [Supabase Auth](https://supabase.com/docs/guides/auth) for all authentication flows.

- **Email + Password** — standard signup/login
- **Google OAuth** — one-click login via Google account
- All sessions are JWT-based and managed by Supabase
- The frontend never handles or stores passwords

---

## Row Level Security (RLS)

Every table in the database has RLS enabled. This means even if someone has the Supabase anon key, they can only access data that belongs to them.

### Access Model

| Role | What they can access |
|------|---------------------|
| **Teacher** | Their own tuition spaces, all members/classes/quizzes/payments within those tuitions |
| **Student** | Tuitions they are enrolled in, their own attendance/attempts/payments/doubts |
| **Anyone** | Nothing — all tables are locked by default |

### Policy Summary by Table

| Table | Teacher Access | Student Access |
|-------|---------------|----------------|
| `profiles` | Own profile only | Own profile only |
| `tuition_spaces` | Full CRUD on own tuitions | Read enrolled tuitions |
| `tuition_members` | View/remove members in own tuitions | View own memberships |
| `classes` | Full CRUD in own tuitions | Read only |
| `class_attendance` | Full CRUD in own tuitions | View own attendance |
| `announcements` | Full CRUD in own tuitions | Read only |
| `discussion_messages` | Read/write in own tuitions | Read/write in enrolled tuitions |
| `doubts` | Read all + reply in own tuitions | Post and view own doubts |
| `quizzes` | Full CRUD in own tuitions | Read only |
| `questions` | Full CRUD on own quizzes | Read only |
| `options` | Full CRUD on own quizzes | Read only |
| `quiz_attempts` | View attempts on own quizzes | View and create own attempts |
| `answers` | View answers on own quizzes | Submit and view own answers |
| `fees_payments` | Full CRUD in own tuitions | View own + request payment |
| `student_fees` | Full CRUD in own tuitions | View own fee details |
| `resources` | Upload + delete in own tuitions | View + upload in enrolled tuitions |
| `teacher_payment_details` | Full CRUD on own details | Read teacher's payment info |

### Recursion Prevention

To prevent infinite recursion between `tuition_spaces` and `tuition_members` policies, a `SECURITY DEFINER` helper function is used:

```sql
CREATE OR REPLACE FUNCTION public.is_tuition_member(t_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tuition_members
    WHERE tuition_id = t_id
    AND user_id = auth.uid()
  );
$$;
```

This function bypasses the RLS check on `tuition_members` when called from within a `tuition_spaces` policy, breaking the circular dependency.

---

## Frontend Security

- The Supabase `anon` key is safe to expose on the frontend — it is restricted by RLS policies
- The `service_role` key is **never** used on the frontend — it bypasses all RLS
- All environment variables are prefixed with `VITE_` and documented in [ENVIRONMENT.md](./ENVIRONMENT.md)
- Debug `console.log` statements are removed from production builds
- A Content Security Policy (CSP) is set via meta tag in `index.html`

---

## What is NOT in This Repo

- `.env` files — never committed, listed in `.gitignore`
- Supabase `service_role` key — never used in frontend code
- Any user data, payment details, or personal information

---

## Reporting a Vulnerability

If you discover a security vulnerability in AfterClass, please report it responsibly.

**Do not open a public GitHub issue for security vulnerabilities.**

Instead, report it via email at: `prashivgoyal1504@gmail.com`

Please include:
- A description of the vulnerability
- Steps to reproduce it
- Potential impact
- Any suggested fix if you have one

You can expect a response within **72 hours**. We take all reports seriously and will credit researchers who report valid vulnerabilities.
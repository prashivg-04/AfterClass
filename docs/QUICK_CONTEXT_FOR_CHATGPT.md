# AfterClass — Quick Context (For ChatGPT)

This file provides quick project context so a new ChatGPT conversation can continue development without re-explaining everything.

---

## 🧠 Project Idea

AfterClass is a SaaS-style web application designed for tuition teachers and students.

Core concept:

Tuition Space → Daily Classes → Attendance → (Quiz later)

Teacher creates classes after tuition sessions so students can review activity from home.

---

## ⚙️ Tech Stack

Frontend:

- React (JSX)
- React Router

Backend:

- No custom backend (Supabase-first architecture)

Database:

- Supabase (PostgreSQL)
- Row Level Security (RLS)

---

## 👥 Roles

### Teacher

- Creates tuition spaces
- Creates daily classes
- Selects predefined topics
- Marks student attendance

### Student

- Joins tuition spaces
- Views classes
- Sees attendance status (read-only)

---

## 🧱 Core Architecture

Hierarchy:

User
↓
Dashboard (role-based)
↓
Tuition Space
↓
Classes (daily sessions)
↓
Attendance + Quiz (placeholder)

---

## 🗂️ Main Routes

Teacher:

- /dashboard/teacher
- /dashboard/teacher/tuition/:tuitionId
- /dashboard/teacher/tuition/:tuitionId/class/:classId

Student:

- /dashboard/student
- /dashboard/student/tuition/:tuitionId
- /dashboard/student/tuition/:tuitionId/class/:classId

---

## 🧩 Database Tables (Current)

### profiles

- id
- full_name
- role
- created_at
- updated_at

### tuition_spaces

- id
- name
- created_by

### tuition_members

- user_id
- tuition_id
- role_in_tuition

### classes

- id
- tuition_id
- name
- topics (text[])
- created_by
- created_at

### class_attendance

- class_id
- student_id (references profiles)
- status (present / absent)

---

## ✅ Current Features Working

- Authentication (signup/login/email confirmation)
- Role selection onboarding
- Protected routes
- Teacher dashboard (create tuition)
- Student dashboard (join tuition)
- Tuition workspace
- Class creation (teacher)
- Class list (teacher + student)
- Class detail page
- Attendance marking (teacher)
- Attendance viewing (student)

---

## 📌 Key Decisions

- Supabase-first (no custom backend yet)
- Shared class detail view with role-based logic
- Hardcoded topics for now
- Class = daily teaching session
- Attendance stored per class per student

---

## 🚀 Next Planned Steps

- Improve class experience UI
- Build quiz system (manual first)
- Replace UUID join with invite code
- Teacher insights / attendance stats
- Later: AI quiz generation

---

## ⚠️ Development Rules

- Keep architecture simple.
- Avoid overengineering.
- Build features incrementally.
- Keep Supabase schema aligned with code.

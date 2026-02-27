# AfterClass — Next Steps Roadmap

This file tracks the planned development direction after the currently implemented features.

---

## 🚀 Current State

Implemented:

- Authentication (signup, login, email confirmation)
- Role onboarding (teacher / student)
- Teacher & Student dashboards
- Tuition creation (teacher)
- Tuition join (student)
- Tuition workspace
- Classes system
- Class detail view
- Attendance marking (teacher)
- Attendance viewing (student)

---

## 🎯 Immediate Next Steps (High Priority)

### 1️⃣ Improve Class Experience (UI polish)

- Better class layout consistency.
- Cleaner topic tags.
- Attendance UX improvements.

---

### 2️⃣ Quiz Placeholder → Real Quiz System

Goal:

- Teacher generates or creates quiz for a class.
- Students attempt quiz inside class.

Initial version:

- Manual quiz creation.
- No AI yet.

---

### 3️⃣ Invite System (Replace UUID Join)

Current:

- Students join via tuition UUID.

Next:

- Human-friendly invite code or join link.

---

### 4️⃣ Teacher Insights (Basic Analytics)

Examples:

- Attendance percentage per student.
- Number of classes attended.

---

## 🧠 Later (Medium Priority)

### Topic System Upgrade

Current:

- Hardcoded topics.

Future:

- Tuition-level predefined topic library.

---

### Quiz Intelligence (Future AI Phase)

- AI-generated quiz from class topics.
- Teacher reviews before publishing.

---

## 🌙 Long-Term Vision

AfterClass should become:

Teacher workflow:

- Create tuition
- Create daily class
- Select topics
- Mark attendance
- Generate quiz

Student workflow:

- View classes
- See attendance
- Attempt quizzes
- Track progress

---

## ⚠️ Important Rules

- Do not introduce backend yet.
- Keep Supabase-first architecture.
- Build features in small working increments.
- Avoid overengineering.

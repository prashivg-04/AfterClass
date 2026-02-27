# Current Features Status

This document outlines the strict implementation status of features within the application, separating fully functional features from UI placeholders.

## 1. Authentication

- [x] Signup
- [x] Login
- [x] Email confirmation handling
- [x] Role selection

## 2. Dashboards

### Teacher Dashboard

- [x] Create new tuition
- [x] View owned tuitions list
- [ ] Dashboard statistics (Total Students, Active Batches, Quizzes Created are UI placeholders)
- [ ] Recent Activity feed (UI placeholder data)

### Student Dashboard

- [x] Join tuition via ID
- [x] View joined tuitions list
- [ ] Dashboard statistics (Assigned Quizzes, Completed Quizzes, Average Score are UI placeholders)
- [ ] Upcoming Tasks feed (UI placeholder data)

## 3. Tuition System

- [x] Create tuition
- [x] Join tuition
- [x] Tuition navigation (Routing)
- [x] View enrolled students list (Teacher only)
- [ ] Tuition Overview tab statistics (Currently hardcoded to 0)
- [ ] Topics tab (UI placeholder)
- [ ] Quizzes tab (UI placeholder)

## 4. Classes System

- [x] Create class
- [x] View classes list
- [x] Class detail view header/info
- [ ] Class detail quiz placeholder (UI placeholder)

## 5. Attendance

- [x] Teacher attendance marking (Present/Absent toggle and lock)
- [x] Student attendance viewing (View own status)

## 6. Routing & Access

- [x] Protected routes (Redirect to login if unauthenticated)
- [x] Role-based views (Dynamic rendering of components based on profile role)

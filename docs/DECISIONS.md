# Architecture & Product Decisions

## 1. Supabase-First Architecture

- **What was chosen**: The application operates entirely as a Single Page Application (React) communicating directly with a Supabase PostgreSQL backend via `@supabase/supabase-js`.
- **Why**: Eliminates the need for a dedicated Node.js middle-tier or REST API. Functions like Authentication (SignUp/Login), session management, and CRUD operations are securely handled client-side using native Supabase methods.
- **Impact**: Rapid development cycle, lower infrastructure complexity, but requires careful implementation of PostgreSQL Row Level Security (RLS) policies in production to prevent unintended data access by power-users inspecting network requests.

## 2. Shared Component with Role-Based Behavior

- **What was chosen**: Core detail views (like `TuitionDetail.jsx` and `ClassDetail.jsx`) are universally shared between Teacher and Student routes. They determine what to render via a `role` prop passed down from the React Router configuration.
- **Why**: Prevents massive code duplication. Rather than maintaining `/components/teacher/ClassDetail` and `/components/student/ClassDetail`, the single component dictates access control inline (e.g., `isTeacher = role === 'Teacher'`).
- **Impact**: Easier maintainability for generic UI elements (headers, layout wrappers). However, components can become complex over time if the feature gap between Teacher and Student views widens significantly.

## 3. Strict Workspace Boundaries (Tuitions)

- **What was chosen**: All actionable domain entities (classes, enrolled students, attendance) strictly live underneath the boundary of a `tuition_spaces` entity.
- **Why**: Models real-world tutoring logic where a teacher operates isolated "Batches" or "Spaces" (e.g. "Grade 10 Biology"). A student joining via an ID grants them scoped access purely to that environment.
- **Impact**: Safe data isolation. A user logged in as a student can never accidentally fetch global classes; they must first join a tuition and navigate down its hierarchy.

## 4. Classes as Discrete Sessions

- **What was chosen**: "Classes" are treated conceptually as individual, daily teaching units (e.g., "Monday's Lecture") rather than persistent subjects.
- **Why**: Supports the core attendance looping functionality. Attendance must be marked per specific event/session. This structural decision aligns with the `class_attendance` junction table logic.
- **Impact**: Requires teachers to continuously generate new `classes` entities to log new attendance events, ensuring historical logging without mutating previous records.

## 5. Explicit "Lockable" Attendance

- **What was chosen**: The `class_attendance` table utilizes an explicit `locked` boolean and relies on `upsert` queries.
- **Why**: Allows optimistic UI updates for Teachers marking attendance rapidly. Once marked, the database locks the row to false-prevent accidental tampering while supporting fallback conflict resolution (`onConflict: 'class_id,student_id'`).
- **Impact**: Ensures data integrity after an operational session concludes, while granting the UI speed and responsiveness so a Teacher can rapidly click through a 30-person roster.

## 6. Hardcoded Component Topics

- **What was chosen**: Currently, class topics (`TOPIC_OPTIONS` in `ClassesTab.jsx`) are statically hardcoded arrays in the frontend codebase.
- **Why**: Serves as a rapid initialization strategy to prove out the filtering/tagging UI concepts without requiring complex relational topic-association tables.
- **Impact**: Limits dynamic scalability. The application will eventually need a database-driven tagging schema as teachers demand custom or subject-specific topics outside the hardcoded array.

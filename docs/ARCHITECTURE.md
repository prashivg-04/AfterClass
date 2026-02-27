# System Architecture

## 1. High-Level Architecture

AfterClass is a Single Page Application (SPA) built with React. The architecture is heavily client-centric, connecting directly to a Supabase backend for all authentication and database interactions.

The system relies on a **Role-Based Workspace Architecture**. The application structurally divides itself based on whether a user is authenticated as a `Teacher` or a `Student`. A user's role dictates the available dashboard layout, accessible routes, and the operations they can perform on core domain entities like Tuitions and Classes.

The concept of a "Tuition Space" acts as the central boundary or workspace. All entities like classes, students, and attendance records exist strictly within the boundaries of a specific Tuition Space.

## 2. Routing Structure

The application uses React Router DOM for client-side routing. Navigation is protected by a `ProtectedRoute` wrapper component which ensures an active session exists before allowing access to user-specific views.

- **Main Routes**:
  - `/` (Home): Landing page.
  - `/login`: User authentication login.
  - `/signup`: New user registration.
  - `/role-selection`: Interstitial step post-signup forcing a user to select their permanent role (Teacher vs Student) before accessing the application.

- **Teacher Routes**:
  - `/dashboard/teacher`: The main workspace displaying all tuitions the teacher manages.
  - `/dashboard/teacher/tuition/:tuitionId`: Detailed view of a specific tuition (displays students, classes, etc.).
  - `/dashboard/teacher/tuition/:tuitionId/class/:classId`: The granular view of a specific class session to mark attendance.

- **Student Routes**:
  - `/dashboard/student`: The main workspace displaying tuitions the student has successfully joined.
  - `/dashboard/student/tuition/:tuitionId`: The student's view of a tuition (displays only classes, topics, quizzes).
  - `/dashboard/student/tuition/:tuitionId/class/:classId`: The student's granular view of the class, restricted to viewing their own attendance status.

## 3. Core Domain Model

The conceptual hierarchy follows a strictly nested permissions and container model:

**User** (Authenticated entity via Supabase Auth)
  ↳ **Role** (Determines Dashboard layout: Teacher vs Student)
      ↳ **Tuition** (The primary learning container/workspace)
          ↳ **Classes** (Specific sessions within the Tuition)
              ↳ **Attendance** (Granular status records of students per class session)

## 4. Component Architecture

The component structure is organized to promote reusability across roles while still isolating role-specific logic:

- **Layouts**:
  - `AuthLayout`: Wrappers for Login/Signup/Role views.
  - `DashboardLayout`: A shared wrapper component that takes a `role` prop to render respective sidebars/navigation for the authenticated user, wrapping the main content area.
- **Role-Specific Views (Pages)**:
  - `TeacherDashboard.jsx`: Exclusive logic for creating and listing managed tuitions.
  - `StudentDashboard.jsx`: Exclusive logic for submitting join codes and listing enrolled tuitions.
- **Shared / Dual-Behavior Views (Pages)**:
  - `TuitionDetail.jsx`: Rendered dynamically based on the accessing role. Uses the `role` prop to either show or hide the "Students" management tab and related statistics.
  - `ClassDetail.jsx`: Dynamically renders either the Teacher's mass-attendance toggle table or the Student's single personal attendance indicator.
  - `ClassesTab.jsx`: Rendered inside the Tuition Detail view. Conditionally shows the "Create Class" form only for Teachers.

## 5. Data Flow Overview

The frontend communicates directly with Supabase, effectively turning the React layer into a thick client.

- **Supabase Integration**: Data fetching and mutation happen directly inside `useEffect` blocks or event handlers within the components via `@supabase/supabase-js`. The application does not rely on a dedicated state management library (like Redux or Zustand); instead, it manages local state per-component using standard React `useState`.
- **Auth Flow**: Users sign up or log in using email/password via Supabase Auth. The `ProtectedRoute` component listens to session changes (`onAuthStateChange`) to trigger loading states or redirects to `/login`.
- **Role Onboarding Flow**:
  1. User signs up via `/signup` -> Supabase generic user is created.
  2. Directed to `/role-selection` to set a custom profile.
  3. `profiles` table is upserted with either `teacher` or `student`.
  4. Subsequent logins verify this `role` value to correctly route them to either the Teacher or Student dashboards.

## 6. Design Decisions

- **Shared Dynamic Views**: Instead of completely splitting the UI between `/teacher/tuition/*` and `/student/tuition/*` codebase paths, the app aggressively reuses `TuitionDetail.jsx` and `ClassDetail.jsx`. It passes a `role` prop down from the router to evaluate conditional blocks (e.g., `isTeacher = role === 'Teacher'`). This keeps the visual styling cohesive and reduces duplication for shared components like the class item row or the main headers.
- **Role-Based Behavior**: Security/Logic constraints for UI elements (like whether the user can mark attendance or just view it) are inferred locally based on the layout's role prop.
- **Workspace-based Architecture**: The concept of a "Tuition" acts as a hard boundary. Students and Classes do not exist globally; everything revolves around first defining or locating the Tuition ID to navigate deeper into the domain tree.

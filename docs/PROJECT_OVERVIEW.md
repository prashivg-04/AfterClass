# AfterClass - Project Overview

## 1. Project Overview

AfterClass is an educational management platform designed to connect teachers and students in dedicated learning spaces. It provides a centralized hub for managing tuitions, classes, students, and attendance, streamlining the administrative tasks of running educational batches or tutoring sessions.

## 2. Core Concept & Workflow

The application operates on a role-based system separating users into **Teachers** and **Students**.

- **Teachers** are administrators who can create "Tuition Spaces", view analytics, and manage the student roster and classes within those spaces.
- **Students** join these Tuition Spaces using a specific ID provided by the teacher, granting them access to their classes, upcoming tasks, and personal attendance records.

## 3. Currently Implemented Features

Based on the existing codebase, the following features are actively implemented and functional:

- **Authentication**: User sign up, log in, and session management.
- **Role Assignment**: First-time users are prompted to select their role (Teacher or Student), which is permanently saved to their profile.
- **Teacher Dashboard**:
  - Create new Tuition Spaces.
  - View a list of created tuitions.
  - Summary statistics (Students, Active Batches, Quizzes).
- **Student Dashboard**:
  - Join a Tuition Space using a unique Tuition ID.
  - View a list of successfully joined tuitions.
  - Summary statistics (Assigned/Completed Quizzes, Average Score, Upcoming Tasks).
- **Tuition Details Space**:
  - **Overview**: High-level metrics for the tuition.
  - **Students Tab (Teacher Only)**: View enrolled students and their join dates.
  - **Classes Tab**: View classes associated with the tuition.
  - **Topics & Quizzes Tabs**: (Currently UI placeholders).
- **Class Details & Attendance**:
  - View class information (name and topics).
  - **Teacher View**: List of all enrolled students with the ability to mark attendance (`Present` or `Absent`). Attendance is locked after submission.
  - **Student View**: View personal attendance status for the specific class.

## 4. High-Level User Flows

### Teacher Flow

1. **Onboarding**: User creates an account and selects the "Teacher" role.
2. **Dashboard**: User is redirected to the Teacher Dashboard.
3. **Tuition Creation**: Teacher creates a new Tuition Space (e.g., "Math Grade 10").
4. **Distribution**: Teacher shares the generated Tuition ID with their students.
5. **Management**: Teacher clicks on a Tuition to view details, see enrolled students, manage classes, and mark student attendance per class.

### Student Flow

1. **Onboarding**: User creates an account and selects the "Student" role.
2. **Dashboard**: User is redirected to the Student Dashboard.
3. **Joining**: Student enters a given Tuition ID in the "Join a Tuition" form.
4. **Accessing Content**: Student clicks on the joined Tuition to view their classes.
5. **Class Participation**: Student navigates to a specific class to check their attendance status and view other class details.

## 5. Current Tech Stack

- **Frontend Framework**: React 19
- **Routing**: React Router DOM 7
- **Styling**: Tailwind CSS 4
- **Build Tool**: Vite
- **Backend/Database/Auth**: Supabase (via `@supabase/supabase-js`)

## 6. Current Project Status

- **What is Working**: The core framework of the application is functional. This includes Supabase Authentication, complete routing with protected routes, role initialization, and the database relationships for creating tuitions, joining tuitions, traversing into class details, and marking/locking attendance.
- **Pending/Incomplete**: Several features visible in the UI are currently placeholders or read-only mock data. This includes:
  - Dashboard Activity Feeds & Statistics (hardcoded numbers in both Teacher and Student dashboards).
  - Quiz and Topic management (UI tabs exist but show "Coming soon" or "No topics yet").
  - The actual creation logic for internal Classes under a Tuition might require further implementation flesh-out, though viewing them and their attendance lists operates via the database.

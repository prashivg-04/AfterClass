# Database Schema

## 1. Database Overview

The application uses Supabase as its backend-as-a-service, leveraging its PostgreSQL database. The frontend interacts directly with the database using the `@supabase/supabase-js` client. The application schema focuses on managing users (profiles), learning spaces (tuitions), class structures, and attendance records. All relationships rely on UUIDs provided by Supabase's internal auth table (`auth.users.id`) and standard primary keys.

## 2. Tables

### `profiles`

- **Purpose**: Extends the default Supabase `auth.users` system to store application-specific user data, such as their full name and their chosen platform role.
- **Columns**:
  - `id` (UUID): Primary key, corresponds directly to `auth.users.id`.
  - `full_name` (Text): The displaying name of the user.
  - `role` (Text): The platform role of the user (either `'teacher'` or `'student'`).
  - `updated_at` (Timestamptz): Timestamp of the last profile update.
- **Relationships**:
  - `id` references `auth.users` (Supabase generic auth table).
- **Who uses it**: Both Teacher and Student flows, plus System auth.
- **Where it is used**:
  - `Signup.jsx` / `RoleSelection.jsx` to set initial user profile and role.
  - `TuitionDetail.jsx` and `ClassDetail.jsx` by the Teacher to fetch human-readable names of their students.

### `tuition_spaces`

- **Purpose**: Represents a distinct learning space or "batch" created by a teacher. Students can join this space.
- **Columns**:
  - `id` (UUID): Primary key. Serves as the unique join code that students enter.
  - `name` (Text): The visible name of the tuition (e.g., "Math Grade 10").
  - `created_by` (UUID): The user ID of the teacher who created this space.
  - `created_at` (Timestamptz): Timestamp of when the tuition was created.
- **Relationships**:
  - `created_by` references `auth.users.id` (Teacher).
- **Who uses it**: Primary focus for both Teacher and Student.
- **Where it is used**:
  - `TeacherDashboard.jsx` (Teacher creates new tuitions and views owned tuitions).
  - `StudentDashboard.jsx` (Student looks up the tuition by ID to join it).
  - `TuitionDetail.jsx` (Displays main tuition data).

### `tuition_members`

- **Purpose**: A junction table mapping users to tuition spaces, defining exactly who belongs to which tuition and what their context-specific role is inside it.
- **Columns**:
  - `id` (UUID or BigInt): Primary key.
  - `user_id` (UUID): The user joining the tuition.
  - `tuition_id` (UUID): The tuition they are joining.
  - `role_in_tuition` (Text): Their role specifically inside the space (`'teacher'` or `'student'`).
  - `created_at` (Timestamptz): Timestamp representing when the user joined the tuition.
- **Relationships**:
  - `user_id` references `auth.users.id`.
  - `tuition_id` references `tuition_spaces.id`.
- **Who uses it**: System, Teacher, Student.
- **Where it is used**:
  - `TeacherDashboard.jsx` / `StudentDashboard.jsx` (Assigning roles when creating or joining tuitions).
  - `TuitionDetail.jsx` / `ClassDetail.jsx` (Querying which students exist inside a space).

### `classes`

- **Purpose**: Represents an individual class/session belonging to a larger tuition space.
- **Columns**:
  - `id` (UUID): Primary key.
  - `tuition_id` (UUID): The tuition space this class belongs to.
  - `name` (Text): The custom name for the specific class session.
  - `topics` (Array of Text): List of topics covered in this class (e.g., `['Algebra', 'Geometry']`).
  - `created_at` (Timestamptz): Timestamp of when the class was created.
- **Relationships**:
  - `tuition_id` references `tuition_spaces.id`.
- **Who uses it**: Teacher (creates/views) and Student (views).
- **Where it is used**:
  - `ClassesTab.jsx` (Teacher creates classes).
  - `TuitionDetail.jsx` (Listing all available classes under a tuition).
  - `ClassDetail.jsx` (Fetching data for a single class view).

### `class_attendance`

- **Purpose**: Tracks which students were present or absent for an individual class session.
- **Columns**:
  - `class_id` (UUID): The specific class session.
  - `student_id` (UUID): The student whose attendance is being recorded.
  - `status` (Text): The attendance status (`'present'` or `'absent'`).
  - `locked` (Boolean): Indicates whether the attendance record can still be mutated (`true` once submitted by teacher).
- **Relationships**:
  - `class_id` references `classes.id`.
  - `student_id` references `auth.users.id`.
- **Who uses it**: Teacher (assigns) and Student (views).
- **Where it is used**:
  - `ClassDetail.jsx` (Teacher batch-marks attendance statuses over a conflict-resolution upsert logic. Students check their own state).

## 3. Relationship Diagram

```text
auth.users
  |
  +---(1:1)---> profiles
  |
  +---(1:N)---> tuition_spaces
  |
  +---(1:N)---> tuition_members <---(N:1)---+
  |                                         |
  +---(1:N)---> class_attendance            tuition_spaces
                                            |
                                            +---(1:N)---> classes <---(1:N)---+
                                                                              |
                                                                              class_attendance
```

*Alternative Path Flow:*
`profiles` → `tuition_members` → `tuition_spaces` → `classes` → `class_attendance`

## 4. Notes

- **Row Level Security (RLS)**: Not explicitly configured within the frontend code itself, but Supabase enforces secure data boundaries. Upserts onto `profiles` bind using `auth.user.id`, meaning standard RLS restrictions generally accompany these implementation strategies in production.
- **Constraints**:
  - `class_attendance` relies heavily on an `ON CONFLICT` strategy covering the unique compound constraint (`class_id`, `student_id`), ensuring a student cannot have multiple attendance records for the exact same class.
  - `tuition_members` uses a check to see if a student is already a member of a tuition before inserting, essentially functioning around an expected unique compound constraint on (`user_id`, `tuition_id`).

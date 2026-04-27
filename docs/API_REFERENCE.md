# API Reference

AfterClass uses Supabase (PostgreSQL) as its backend. There is no custom REST API — all data operations are performed directly against the database using the Supabase JavaScript client.

## Table of Contents

- [Database Tables](#database-tables)
- [Key Relationships](#key-relationships)
- [Common Query Patterns](#common-query-patterns)
- [RLS Summary](#rls-summary)
- [Storage](#storage)

---

## Database Tables

The database consists of 17 tables. All tables use UUIDs as primary keys unless otherwise noted.

### 1. profiles

User profiles linked to Supabase authentication. One profile per user.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key, references `auth.users(id)` |
| `role` | text | User role: `'teacher'` or `'student'` |
| `full_name` | text | User's display name |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update timestamp |

**Foreign Keys:**
- `id` → `auth.users(id)`

**Constraints:**
- One profile per authenticated user (FK constraint)

---

### 2. tuition_spaces

Tuition/classroom groups created by teachers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Tuition space name (required) |
| `created_by` | uuid | Teacher who created it |
| `created_at` | timestamptz | Creation timestamp |
| `join_code` | text | Unique code for students to join |
| `subject` | text | Subject (e.g., "Mathematics") |
| `grade` | text | Grade level (e.g., "10th") |
| `batch` | text | Batch identifier |
| `description` | text | Tuition description |
| `monthly_fee` | numeric | Monthly fee amount |
| `due_day` | integer | Day of month fees are due (1-31) |
| `upi_id` | text | UPI ID for fee payments |
| `qr_code_url` | text | URL to QR code image |

**Foreign Keys:**
- `created_by` → `auth.users(id)`

**Constraints:**
- `join_code` is unique

---

### 3. tuition_members

Links users to tuition spaces with their role within that tuition.

| Column | Type | Description |
|--------|------|-------------|
| `user_id` | uuid | Primary key part 1 |
| `tuition_id` | uuid | Primary key part 2 |
| `role_in_tuition` | text | `'teacher'` or `'student'` |
| `created_at` | timestamptz | When user joined |

**Foreign Keys:**
- `user_id` → `auth.users(id)`
- `tuition_id` → `tuition_spaces(id)`

**Constraints:**
- `role_in_tuition` must be `'teacher'` or `'student'`
- Composite primary key: `(user_id, tuition_id)`

---

### 4. classes

Individual class sessions within a tuition space.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tuition_id` | uuid | Parent tuition space |
| `name` | text | Class name |
| `topics` | text[] | Array of topics covered |
| `created_by` | uuid | Teacher who created it |
| `created_at` | timestamptz | Creation timestamp |
| `class_date` | date | Date of the class |
| `summary` | text | Class summary/notes |

**Foreign Keys:**
- `tuition_id` → `tuition_spaces(id)`
- `created_by` → `auth.users(id)`

---

### 5. class_attendance

Tracks student attendance for each class.

| Column | Type | Description |
|--------|------|-------------|
| `class_id` | uuid | Primary key part 1 |
| `student_id` | uuid | Primary key part 2 |
| `status` | text | `'present'` or `'absent'` |
| `created_at` | timestamptz | When marked |
| `locked` | boolean | Whether attendance is locked |

**Foreign Keys:**
- `class_id` → `classes(id)`
- `student_id` → `profiles(id)`

**Constraints:**
- Composite primary key: `(class_id, student_id)`
- `status` must be `'present'` or `'absent'`

---

### 6. announcements

Tuition-wide announcements posted by teachers.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tuition_id` | uuid | Parent tuition |
| `title` | text | Announcement title |
| `message` | text | Announcement content |
| `created_by` | uuid | Teacher who posted |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

**Foreign Keys:**
- `tuition_id` → `tuition_spaces(id)`
- `created_by` → `profiles(id)`

---

### 7. discussion_messages

Chat messages within a tuition space.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tuition_id` | uuid | Parent tuition |
| `sender_id` | uuid | Message author |
| `message_text` | text | Message content |
| `created_at` | timestamptz | When sent |

**Foreign Keys:**
- `tuition_id` → `tuition_spaces(id)`
- `sender_id` → `auth.users(id)`

---

### 8. doubts

Student questions about specific classes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `class_id` | uuid | Related class |
| `student_id` | uuid | Asking student |
| `question` | text | Student's question |
| `teacher_reply` | text | Teacher's answer |
| `answered_at` | timestamptz | When answered |
| `created_at` | timestamptz | When asked |

**Foreign Keys:**
- `class_id` → `classes(id)`
- `student_id` → `profiles(id)`

---

### 9. quizzes

Quizzes created by teachers within a tuition.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `title` | text | Quiz title |
| `description` | text | Quiz description |
| `tuition_id` | uuid | Parent tuition |
| `created_by` | uuid | Creating teacher |
| `created_at` | timestamptz | Creation timestamp |

**Foreign Keys:**
- `tuition_id` → `tuition_spaces(id)`
- `created_by` → `auth.users(id)`

---

### 10. questions

Questions within a quiz.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `quiz_id` | uuid | Parent quiz |
| `question_text` | text | Question content |

**Foreign Keys:**
- `quiz_id` → `quizzes(id)`

---

### 11. options

Answer options for each question.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `question_id` | uuid | Parent question |
| `option_text` | text | Option content |
| `is_correct` | boolean | Whether this is the correct answer |

**Foreign Keys:**
- `question_id` → `questions(id)`

---

### 12. quiz_attempts

Student attempts at quizzes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `quiz_id` | uuid | Attempted quiz |
| `student_id` | uuid | Student who attempted |
| `score` | integer | Points earned |
| `total_questions` | integer | Total questions in quiz |
| `created_at` | timestamptz | When attempted |

**Foreign Keys:**
- `quiz_id` → `quizzes(id)`
- `student_id` → `auth.users(id)`

---

### 13. answers

Student's answer to each question in an attempt.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `attempt_id` | uuid | Parent attempt |
| `question_id` | uuid | Question being answered |
| `selected_option_id` | uuid | Option selected |
| `is_correct` | boolean | Whether answer was correct |

**Foreign Keys:**
- `attempt_id` → `quiz_attempts(id)`
- `question_id` → `questions(id)`
- `selected_option_id` → `options(id)`

---

### 14. fees_payments

Monthly fee payment records for students.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tuition_id` | uuid | Parent tuition |
| `student_id` | uuid | Paying student |
| `month` | integer | Month (1-12) |
| `year` | integer | Year |
| `status` | text | `'unpaid'`, `'pending'`, or `'paid'` |
| `paid_on` | timestamptz | When payment was made |
| `created_at` | timestamptz | Record creation |

**Foreign Keys:**
- `tuition_id` → `tuition_spaces(id)`
- `student_id` → `auth.users(id)`

**Constraints:**
- `month` must be 1-12
- `status` must be `'unpaid'`, `'pending'`, or `'paid'`

---

### 15. student_fees

Fee configuration per student per tuition.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `tuition_id` | uuid | Parent tuition |
| `student_id` | uuid | Student |
| `fee_amount` | numeric | Monthly fee for this student |
| `due_day` | integer | Due day (1-31) |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

**Foreign Keys:**
- `tuition_id` → `tuition_spaces(id)`

---

### 16. teacher_payment_details

Teacher's payment configuration (UPI, QR codes).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `teacher_id` | uuid | Teacher's profile (unique) |
| `upi_id` | text | UPI ID |
| `qr_code_url` | text | URL to QR code image |
| `created_at` | timestamptz | Creation timestamp |
| `updated_at` | timestamptz | Last update |

**Foreign Keys:**
- `teacher_id` → `profiles(id)`

**Constraints:**
- One record per teacher (`teacher_id` is unique)

---

### 17. resources

File uploads (notes, assignments, etc.) for tuitions and classes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `file_name` | text | Original file name |
| `file_path` | text | Path in Supabase Storage |
| `uploaded_by` | uuid | Uploader's user ID |
| `tuition_id` | uuid | Parent tuition (optional) |
| `class_id` | uuid | Related class (optional) |
| `created_at` | timestamptz | Upload timestamp |

**Foreign Keys:**
- `uploaded_by` → `auth.users(id)`
- `tuition_id` → `tuition_spaces(id)`
- `class_id` → `classes(id)`

---

### 18. topics

Predefined topic list for class creation, organized by subject and grade.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `subject` | text | Subject name (e.g., "Mathematics", "Physics") |
| `topic` | text | Topic name |
| `grade` | text | Grade level (e.g., "Class 9", "Class 12", "JEE", "NEET") |

**Constraints:**
- No foreign keys — standalone reference table
- Covers NCERT syllabus (Class 9-12) and JEE/NEET syllabus
- 280+ topics across Mathematics, Physics, Chemistry, Biology

---

## Key Relationships

```
auth.users
    │
    ├─── 1:1 ────► profiles (id)
    │                   │
    │                   ├─── 1:N ────► tuition_spaces (created_by)
    │                   │
    │                   └─── 1:1 ────► teacher_payment_details (teacher_id)
    │
    ├─── N:M ────► tuition_spaces ◄─────── N:M ────► users
    │      via tuition_members       via tuition_members
    │
    └─── N:1 ────► classes (created_by)

tuition_spaces (id)
    │
    ├─── 1:N ────► classes (tuition_id)
    ├─── 1:N ────► announcements (tuition_id)
    ├─── 1:N ────► discussion_messages (tuition_id)
    ├─── 1:N ────► quizzes (tuition_id)
    ├─── 1:N ────► student_fees (tuition_id)
    ├─── 1:N ────► fees_payments (tuition_id)
    └─── 1:N ────► resources (tuition_id)

classes (id)
    │
    ├─── 1:N ────► class_attendance (class_id)
    ├─── 1:N ────► doubts (class_id)
    └─── 1:N ────► resources (class_id)

quizzes (id)
    │
    ├─── 1:N ────► questions (quiz_id)
    └─── 1:N ────► quiz_attempts (quiz_id)

questions (id)
    │
    └─── 1:N ────► options (question_id)

quiz_attempts (id)
    │
    └─── 1:N ────► answers (attempt_id)

profiles (id)
    │
    ├─── 1:N ────► class_attendance (student_id)
    ├─── 1:N ◄─────── doubts (student_id)
    └─── 1:N ◄─────── quiz_attempts (student_id)

users (auth.users)
    │
    ├─── N:M ◄─────── tuition_spaces (via tuition_members)
    ├─── N:1 ◄─────── fees_payments (student_id)
    └─── N:1 ◄─────── quiz_attempts (student_id)
```

---

## Common Query Patterns

All queries use the Supabase JavaScript client. Below are patterns extracted from the actual codebase.

### Fetching User Profile

```javascript
const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user.id)
  .maybeSingle();
```

### Fetching Teacher's Tuitions

```javascript
const { data: tuitions } = await supabase
  .from('tuition_spaces')
  .select('*')
  .eq('created_by', user.id);
```

### Fetching Tuition Members

```javascript
const { data: members } = await supabase
  .from('tuition_members')
  .select('user_id, tuition_id, created_at, tuition_spaces(name)')
  .eq('tuition_id', tuitionId);
```

### Fetching Student's Enrolled Tuitions

```javascript
const { data: enrollments } = await supabase
  .from('tuition_members')
  .select('id, tuition_id')
  .eq('user_id', user.id)
  .eq('role_in_tuition', 'student');
```

### Fetching Classes with Attendance

```javascript
const { data: classes } = await supabase
  .from('classes')
  .select('id, name, tuition_id, created_at, tuition_spaces(name)')
  .eq('tuition_id', tuitionId)
  .order('created_at', { ascending: false });

const { data: attendance } = await supabase
  .from('class_attendance')
  .select('class_id, status')
  .eq('student_id', studentId)
  .in('class_id', classIds);
```

### Creating a New Tuition

```javascript
const { data, error } = await supabase
  .from('tuition_spaces')
  .insert({
    name: tuitionName,
    created_by: user.id,
    join_code: generatedCode,
    subject,
    grade,
    batch,
    description,
    monthly_fee: feeAmount,
    due_day: dueDay,
  })
  .select()
  .single();

await supabase.from('tuition_members').insert({
  user_id: user.id,
  tuition_id: data.id,
  role_in_tuition: 'teacher',
});
```

### Student Joining a Tuition

```javascript
// Find tuition by join code
const { data: tuition } = await supabase
  .from('tuition_spaces')
  .select('id, name, monthly_fee, due_day')
  .eq('join_code', joinCode)
  .single();

// Add member
await supabase.from('tuition_members').insert({
  user_id: user.id,
  tuition_id: tuition.id,
  role_in_tuition: 'student',
});

// Create student fee record
await supabase.from('student_fees').insert({
  tuition_id: tuition.id,
  student_id: user.id,
  fee_amount: tuition.monthly_fee,
  due_day: tuition.due_day,
});
```

### Creating a Class

```javascript
const { data, error } = await supabase
  .from('classes')
  .insert({
    tuition_id: tuitionId,
    name: className,
    topics: topicsArray,
    created_by: user.id,
    class_date: classDate,
    summary: summaryText,
  })
  .select()
  .single();
```

### Fetching Topics by Subject

```javascript
const { data: topics } = await supabase
  .from('topics')
  .select('topic, grade')
  .eq('subject', tuitionSubject)
  .order('grade', { ascending: true })
  .order('topic', { ascending: true });
```

### Marking Attendance

```javascript
const records = students.map(student => ({
  class_id: classId,
  student_id: student.id,
  status: student.status, // 'present' or 'absent'
}));

const { error } = await supabase.from('class_attendance').upsert(records);
```

### Creating a Quiz with Questions

```javascript
// Insert quiz
const { data: quiz, error: quizError } = await supabase
  .from('quizzes')
  .insert({
    title: quizTitle,
    description: quizDescription,
    tuition_id: tuitionId,
    created_by: user.id,
  })
  .select()
  .single();

// Insert questions
for (const q of questions) {
  const { data: question } = await supabase
    .from('questions')
    .insert({ quiz_id: quiz.id, question_text: q.text })
    .select()
    .single();

  // Insert options
  await supabase.from('options').insert(
    q.options.map(opt => ({
      question_id: question.id,
      option_text: opt.text,
      is_correct: opt.isCorrect,
    }))
  );
}
```

### Submitting a Quiz Attempt

```javascript
const { data: attempt } = await supabase
  .from('quiz_attempts')
  .insert({
    quiz_id: quizId,
    student_id: user.id,
    score: 0,
    total_questions: questions.length,
  })
  .select()
  .single();

// Insert answers
await supabase.from('answers').insert(
  answers.map(a => ({
    attempt_id: attempt.id,
    question_id: a.questionId,
    selected_option_id: a.selectedOptionId,
    is_correct: a.isCorrect,
  }))
);

// Update score
await supabase
  .from('quiz_attempts')
  .update({ score: correctCount })
  .eq('id', attempt.id);
```

### Creating an Announcement

```javascript
await supabase.from('announcements').insert({
  tuition_id: tuitionId,
  title: announcementTitle,
  message: announcementMessage,
  created_by: user.id,
});
```

### Posting a Discussion Message

```javascript
await supabase.from('discussion_messages').insert({
  tuition_id: tuitionId,
  sender_id: user.id,
  message_text: messageText,
});
```

### Asking a Doubt

```javascript
await supabase.from('doubts').insert({
  class_id: classId,
  student_id: user.id,
  question: questionText,
});
```

### Answering a Doubt

```javascript
await supabase
  .from('doubts')
  .update({
    teacher_reply: replyText,
    answered_at: new Date().toISOString(),
  })
  .eq('id', doubtId);
```

### Recording a Payment

```javascript
await supabase.from('fees_payments').upsert({
  tuition_id: tuitionId,
  student_id: studentId,
  month: month,
  year: year,
  status: 'paid',
  paid_on: new Date().toISOString(),
});
```

### Uploading a Resource

```javascript
const filePath = `${tuitionId}/${Date.now()}_${file.name}`;

// Upload to Supabase Storage
const { error: uploadError } = await supabase.storage
  .from('resources')
  .upload(filePath, file);

// Save metadata to database
await supabase.from('resources').insert({
  file_name: file.name,
  file_path: filePath,
  uploaded_by: user.id,
  tuition_id: tuitionId,
  class_id: classId,
});
```

### Getting a Public URL for Resource

```javascript
const { data } = supabase.storage
  .from('resources')
  .getPublicUrl(resource.file_path);
```

---

## RLS Summary

Row Level Security (RLS) policies control data access. For detailed security policies, see [SECURITY.md](./SECURITY.md).

| Table | Access Summary |
|-------|----------------|
| `profiles` | Users can read all profiles; read/write own profile only |
| `tuition_spaces` | Teachers can read/update their created tuitions; students can read enrolled tuitions |
| `tuition_members` | Users can read their memberships only |
| `classes` | Tuition members can read; teachers can create/update |
| `topics` | Authenticated users can read all topics |
| `class_attendance` | Teachers can mark; students can view their own |
| `announcements` | Tuition teachers can create; all members can read |
| `discussion_messages` | Tuition members can read/write |
| `doubts` | Students see own; teachers see all in their tuitions |
| `quizzes` | Teachers create; students attempt |
| `questions` | Teachers manage; students read during quiz |
| `options` | Teachers manage; students read during quiz |
| `quiz_attempts` | Students see own; teachers see all in their tuitions |
| `answers` | Created during quiz attempts |
| `fees_payments` | Students see own; teachers see tuition's |
| `student_fees` | Teachers manage; students see own |
| `teacher_payment_details` | Teachers manage own |
| `resources` | Uploaders can delete; tuition members can view |

---

## Storage

AfterClass uses Supabase Storage for file uploads.

### Bucket Name

`resources`

### What's Stored

- PDFs, documents, images
- Notes and study materials
- Assignment files
- Teacher QR codes for payments

### Storage Policies

#### RESOURCES bucket (Private)
| Policy | Description |
|--------|-------------|
| Tuition members can read resources | Authenticated users only can read files |
| Authenticated users can upload resources | Authenticated users can upload files |
| Users can delete own resources | Only the uploader can delete their files |

#### PAYMENT_QRS bucket (Private)
| Policy | Description |
|--------|-------------|
| Teachers can upload own QR codes | Authenticated teachers can upload |
| Teachers can update own QR codes | Only the owning teacher can update |
| Teachers can delete own QR codes | Only the owning teacher can delete |
| Authenticated users can view QR codes | Students can view teacher QR codes for payment |

### File Path Structure

```
{tuition_id}/{timestamp}_{filename}
```

Example: `abc123-def45/1699876543000_math_notes.pdf`

### Getting Public URLs

```javascript
const { data } = supabase.storage
  .from('resources')
  .getPublicUrl('abc123-def45/math_notes.pdf');
// Returns: { data: { publicUrl: '...' } }
```
# RLS Policies

This document lists all Row Level Security (RLS) policies active on the AfterClass database. All tables have RLS enabled.

Last updated: April 2026

---

## profiles

| Policy | Command | Description |
|--------|---------|-------------|
| Users can view own profile | SELECT | Users can only read their own profile |
| Users can update own profile | UPDATE | Users can only update their own profile |
| Tuition members can view each other's profiles | SELECT | Users who share a tuition can see each other's profiles |
| Students can view their tuition teacher profile | SELECT | Students can view the profile of teachers whose tuitions they are enrolled in |

---

## tuition_spaces

| Policy | Command | Description |
|--------|---------|-------------|
| Users can view their tuitions | SELECT | Teachers see own tuitions, students see enrolled tuitions |
| Teachers can create tuitions | INSERT | Only the creating teacher can insert |
| Teachers can update own tuitions | UPDATE | Only the creator can update |
| Teachers can delete own tuitions | DELETE | Only the creator can delete |
| Anyone can look up tuition by join code | SELECT | Any authenticated user can find a tuition using a join code |

---

## tuition_members

| Policy | Command | Description |
|--------|---------|-------------|
| Users can view own memberships | SELECT | Users can only see their own membership records |
| Teachers can view their tuition members | SELECT | Teachers can see all members in their tuitions |
| Users can join tuitions | INSERT | Any authenticated user can join a tuition |
| Teachers can remove members | DELETE | Teachers can remove students from their tuitions |

---

## classes

| Policy | Command | Description |
|--------|---------|-------------|
| Tuition members can view classes | SELECT | All members of a tuition can view its classes |
| Teachers can create classes | INSERT | Only teachers of the tuition can create classes |
| Teachers can update own classes | UPDATE | Only the class creator can update |
| Teachers can delete own classes | DELETE | Only the class creator can delete |

---

## class_attendance

| Policy | Command | Description |
|--------|---------|-------------|
| Students can view own attendance | SELECT | Students can only see their own attendance records |
| Teachers can view tuition attendance | SELECT | Teachers can see all attendance in their tuitions |
| Teachers can manage attendance | INSERT | Only teachers can mark attendance |

---

## announcements

| Policy | Command | Description |
|--------|---------|-------------|
| Tuition members can view announcements | SELECT | All tuition members can read announcements |
| Teachers can create announcements | INSERT | Only teachers can post announcements |
| Teachers can update own announcements | UPDATE | Only the announcement creator can update |
| Teachers can delete own announcements | DELETE | Only the announcement creator can delete |

---

## discussion_messages

| Policy | Command | Description |
|--------|---------|-------------|
| Tuition members can view messages | SELECT | Only tuition members can read messages |
| Tuition members can send messages | INSERT | Only tuition members can send messages |
| Users can delete own messages | DELETE | Users can only delete their own messages |

---

## doubts

| Policy | Command | Description |
|--------|---------|-------------|
| Students can view own doubts | SELECT | Students can only see their own doubts |
| Teachers can view doubts in their classes | SELECT | Teachers can see all doubts in their tuition's classes |
| Students can post doubts | INSERT | Students can post doubts on classes they attend |
| Teachers can reply to doubts | UPDATE | Teachers can add replies to doubts in their classes |
| Students can delete own doubts | DELETE | Students can delete their own doubts |

---

## quizzes

| Policy | Command | Description |
|--------|---------|-------------|
| Tuition members can view quizzes | SELECT | All tuition members can view quizzes |
| Teachers can create quizzes | INSERT | Only teachers can create quizzes |
| Teachers can update own quizzes | UPDATE | Only the quiz creator can update |
| Teachers can delete own quizzes | DELETE | Only the quiz creator can delete |

---

## questions

| Policy | Command | Description |
|--------|---------|-------------|
| Tuition members can view questions | SELECT | All tuition members can view questions |
| Teachers can manage questions | INSERT | Only the quiz creator can add questions |
| Teachers can update questions | UPDATE | Only the quiz creator can update questions |
| Teachers can delete questions | DELETE | Only the quiz creator can delete questions |

---

## options

| Policy | Command | Description |
|--------|---------|-------------|
| Tuition members can view options | SELECT | All tuition members can view answer options |
| Teachers can manage options | INSERT | Only the quiz creator can add options |
| Teachers can update options | UPDATE | Only the quiz creator can update options |
| Teachers can delete options | DELETE | Only the quiz creator can delete options |

---

## quiz_attempts

| Policy | Command | Description |
|--------|---------|-------------|
| Students can view own attempts | SELECT | Students can only see their own attempts |
| Teachers can view attempts on their quizzes | SELECT | Teachers can see all attempts on their quizzes |
| Students can attempt quizzes | INSERT | Students can create their own quiz attempts |

---

## answers

| Policy | Command | Description |
|--------|---------|-------------|
| Students can view own answers | SELECT | Students can only see their own submitted answers |
| Teachers can view answers on their quizzes | SELECT | Teachers can see all answers on their quizzes |
| Students can submit answers | INSERT | Students can submit answers for their own attempts |

---

## fees_payments

| Policy | Command | Description |
|--------|---------|-------------|
| Students can view own payments | SELECT | Students can only see their own payment records |
| Teachers can view tuition payments | SELECT | Teachers can see all payment records in their tuitions |
| Teachers can manage payments | INSERT | Only teachers can create payment records |
| Students can update own payment status | UPDATE | Students can update their own payment record to send a payment request |
| Teachers can update payment status | UPDATE | Teachers can update payment status in their tuitions |
| Teachers can delete payment records | DELETE | Teachers can delete payment records in their tuitions |

---

## student_fees

| Policy | Command | Description |
|--------|---------|-------------|
| Students can view own fee details | SELECT | Students can only see their own fee configuration |
| Teachers can view tuition fee details | SELECT | Teachers can see all fee details in their tuitions |
| Teachers can update student fees | UPDATE | Only teachers can update fee amounts and due dates |
| Students can insert own fee record | INSERT | Students can create their own fee record when joining a tuition |
| Teachers can insert student fees | INSERT | Teachers can insert fee records for students in their tuitions |
| Teachers can delete student fees | DELETE | Teachers can delete fee records in their tuitions |

---

## resources

| Policy | Command | Description |
|--------|---------|-------------|
| Tuition members can view resources | SELECT | All tuition members can view resources |
| Tuition members can upload resources | INSERT | Any tuition member can upload resources |
| Uploaders can delete own resources | DELETE | Only the uploader or tuition teacher can delete |

---

## topics

| Policy | Command | Description |
|--------|---------|-------------|
| Authenticated users can view topics | SELECT | Any logged in user can read the topics list |

---

## teacher_payment_details

| Policy | Command | Description |  
|--------|---------|-------------|
| Teachers can insert payment details | INSERT | Teachers can add their own UPI/QR details |
| Teachers can update payment details | UPDATE | Teachers can update their own payment details |
| Students can view teacher payment details | SELECT | Students can view payment details of teachers in their enrolled tuitions |

> Note: Student access to teacher payment details is handled via the `tuition_spaces` table which stores `upi_id` and `qr_code_url` directly.

---

## Notes

- All policies are applied to the `public` schema
- The `is_tuition_member()` security definer function is used in `tuition_spaces` policies to prevent infinite recursion between `tuition_spaces` and `tuition_members`
- Storage bucket policies are documented separately in [SECURITY.md](./SECURITY.md)
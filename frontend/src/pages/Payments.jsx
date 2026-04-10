import { useSelector } from 'react-redux';
import TeacherPaymentsView from '../components/payments/TeacherPaymentsView';
import StudentPaymentsView from '../components/payments/StudentPaymentsView';

function Payments() {
  const { user, role: authRole } = useSelector((state) => state.auth);
  
  // Get role from either auth state or fallback to user metadata
  const userRole = authRole || user?.user_metadata?.role || 'student';
  const role = userRole === 'teacher' ? 'Teacher' : 'Student';

  if (role === 'Teacher') {
    return <TeacherPaymentsView />;
  }

  return <StudentPaymentsView />;
}

export default Payments;

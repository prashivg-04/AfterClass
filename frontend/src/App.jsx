import { useState } from 'react';
import { supabase } from "./lib/supabase";
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  const [currentPage, setCurrentPage] = useState('home');

  console.log("Supabase connected:", supabase);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      {currentPage === 'home' && <Home onNavigate={handleNavigate} />}
      {currentPage === 'login' && <Login onNavigate={handleNavigate} />}
      {currentPage === 'signup' && <Signup onNavigate={handleNavigate} />}
      {currentPage === 'role-selection' && <RoleSelection onNavigate={handleNavigate} />}
      {currentPage === 'teacher-dashboard' && <TeacherDashboard onNavigate={handleNavigate} />}
      {currentPage === 'student-dashboard' && <StudentDashboard onNavigate={handleNavigate} />}
    </>
  );
}

export default App;

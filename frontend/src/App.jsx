import { useState } from 'react';
import { supabase } from "./lib/supabase";
import Login from './pages/Login';
import Signup from './pages/Signup';
import RoleSelection from './pages/RoleSelection';

function App() {
  const [currentPage, setCurrentPage] = useState('login');

  console.log("Supabase connected:", supabase);

  const handleNavigate = (page) => {
    setCurrentPage(page);
  };

  return (
    <>
      {currentPage === 'login' && <Login onNavigate={handleNavigate} />}
      {currentPage === 'signup' && <Signup onNavigate={handleNavigate} />}
      {currentPage === 'role-selection' && <RoleSelection onNavigate={handleNavigate} />}
    </>
  );
}

export default App;

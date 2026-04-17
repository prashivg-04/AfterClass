import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import logo from '../../assets/afterclass_logo_v2.svg';

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#FDFDFD] flex flex-col p-4 sm:p-8 relative overflow-hidden font-sans selection:bg-indigo-200 selection:text-indigo-900">
      
      {/* Immersive Glass Backgrounds matching Landing Page */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgydjJIMXoiIGZpbGw9IiNlN2U1ZTQiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-[0.4] [mask-image:linear-gradient(to_bottom,white,transparent_80%)]" />
      
      {/* Massive subtle ambient glows */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1], opacity: [0.6, 0.8, 0.6] }} 
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[600px] sm:h-[800px] bg-gradient-to-b from-indigo-100/50 via-purple-100/30 to-transparent rounded-full blur-[90px] sm:blur-[120px] pointer-events-none z-0" 
      />

      {/* Pinned Top Navigation */}
      <div className="w-full relative z-50 mb-6 mt-2 sm:mb-0 sm:mt-0 sm:absolute sm:top-8 sm:left-8">
        <Link to="/">
          <img src={logo} alt="AfterClass" className="h-8 sm:h-10 md:h-12 w-auto mix-blend-multiply opacity-80 hover:opacity-100 transition-opacity drop-shadow-sm" />
        </Link>
      </div>

      <div className="flex-1 w-full flex flex-col items-center justify-center relative z-10">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, filter: "blur(10px)" }}
          animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-4xl"
        >
          {children}
        </motion.div>
      </div>

    </div>
  );
}

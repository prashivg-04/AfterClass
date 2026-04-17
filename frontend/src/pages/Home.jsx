import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, BookOpen, Users2, ShieldCheck, Zap, LayoutDashboard, BrainCog, CheckCircle2 } from 'lucide-react';
import logo from '../assets/afterclass_logo_v2.svg';

const fadeIn = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 }
  }
};

const MockupWindow = () => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 120, rotateX: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
      transition={{ duration: 1.2, delay: 0.3, type: "spring", bounce: 0.3 }}
      className="relative mx-auto max-w-5xl mt-24 mb-16 perspective-[2000px] z-10 hidden md:block"
    >
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-indigo-500/20 rounded-[2.5rem] blur-2xl opacity-60"></div>
      <div className="relative rounded-[2rem] border border-white/40 bg-white/50 p-2 shadow-2xl shadow-indigo-900/10 backdrop-blur-3xl ring-1 ring-slate-900/5">
        <div className="rounded-[1.5rem] border border-slate-200/60 bg-[#FAFAFA] overflow-hidden flex h-[500px]">
          
          {/* Sidebar */}
          <div className="w-64 bg-white border-r border-slate-200/80 p-6 flex flex-col gap-6 shrink-0">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-slate-900 rounded-lg"></div>
              <div className="h-4 w-24 bg-slate-200 rounded-md"></div>
            </div>
            <div className="space-y-4">
              {[1,2,3,4].map(i => (
                <div key={i} className={`flex items-center gap-3 p-2 rounded-lg ${i === 1 ? 'bg-indigo-50' : ''}`}>
                  <div className={`w-5 h-5 rounded ${i === 1 ? 'bg-indigo-500' : 'bg-slate-300'}`}></div>
                  <div className={`h-3 w-20 rounded ${i === 1 ? 'bg-indigo-700' : 'bg-slate-300'}`}></div>
                </div>
              ))}
            </div>
            <div className="mt-auto h-24 bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-2">
               <div className="h-3 w-16 bg-slate-300 rounded"></div>
               <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden mt-1"><div className="h-full w-2/3 bg-indigo-500"></div></div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 p-8 flex flex-col gap-6 overflow-hidden">
            <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              <div className="h-6 w-48 bg-slate-200 rounded-md"></div>
              <div className="flex gap-3">
                <div className="h-8 w-8 bg-slate-100 rounded-full"></div>
                <div className="h-8 w-8 bg-indigo-100 rounded-full"></div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="h-32 bg-white border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <div className="h-4 w-12 bg-slate-100 rounded-md mb-4"></div>
                  <div className="h-8 w-24 bg-slate-900 rounded-md mb-2"></div>
                  <div className="h-3 w-16 bg-green-100 rounded-md"></div>
                </div>
              ))}
            </div>

            <div className="flex-1 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm flex gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-4 w-32 bg-slate-200 rounded-md"></div>
                  <div className="h-6 w-20 bg-indigo-50 rounded-md"></div>
                </div>
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-12 bg-slate-50 border border-slate-100 rounded-xl w-full flex items-center px-4 gap-4">
                    <div className="h-6 w-6 bg-slate-200 rounded-full"></div>
                    <div className="h-3 w-32 bg-slate-200 rounded"></div>
                    <div className="h-3 w-16 bg-slate-200 rounded ml-auto"></div>
                  </div>
                ))}
              </div>
              <div className="w-64 bg-slate-50 rounded-xl p-4 border border-slate-100">
                <div className="h-32 w-full bg-white rounded-lg border border-slate-200 mb-4 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full border-4 border-indigo-500 border-t-slate-100"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 w-full bg-slate-200 rounded"></div>
                  <div className="h-3 w-4/5 bg-slate-200 rounded"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </motion.div>
  );
};

function Home() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const { scrollYProgress } = useScroll();
  const y = useTransform(scrollYProgress, [0, 1], [0, 300]);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle();
        if (profile?.role) navigate(profile.role === 'teacher' ? '/dashboard/teacher' : '/dashboard/student', { replace: true });
        else navigate('/role-selection', { replace: true });
        return;
      }
      setChecking(false);
    };
    checkSession();
  }, [navigate]);

  if (checking) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-b-2 border-slate-900 rounded-full"></div></div>;

  return (
    <div className="min-h-screen bg-[#FDFDFD] text-slate-900 font-sans selection:bg-indigo-200 selection:text-indigo-900 overflow-hidden relative">
      
      {/* Immersive Glass Backgrounds */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTEgMWgydjJIMXoiIGZpbGw9IiNlN2U1ZTQiIGZpbGwtcnVsZT0iZXZlbm9kZCIvPjwvc3ZnPg==')] opacity-[0.4] [mask-image:linear-gradient(to_bottom,white,transparent_80%)]" />
      <motion.div style={{ y }} className="absolute -top-[500px] left-1/2 -translate-x-1/2 w-[1200px] h-[1000px] bg-gradient-to-b from-indigo-100/50 via-purple-100/30 to-transparent rounded-[100%] blur-[120px] -z-10 pointer-events-none" />
      
      {/* Navbar */}
      <nav className="fixed top-0 inset-x-0 h-20 bg-white/70 backdrop-blur-2xl border-b border-slate-200/60 z-50 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <img src={logo} alt="AfterClass Logo" className="h-10 w-auto opacity-95 mix-blend-multiply" />
          
          <div className="hidden md:flex items-center gap-10 text-[15px] font-medium text-slate-500">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-slate-900 transition-colors">Solutions</a>
            <a href="#customers" className="hover:text-slate-900 transition-colors">Customers</a>
          </div>

          <div className="flex gap-4 items-center">
            <Link to="/login" className="px-4 py-2.5 text-[15px] font-medium text-slate-600 hover:text-slate-900 transition-colors">Log in</Link>
            <Link to="/signup" className="px-5 py-2.5 bg-slate-900 text-white text-[15px] font-semibold rounded-full shadow-lg shadow-slate-900/20 hover:bg-slate-800 hover:scale-105 active:scale-95 transition-all">
              Start for free
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-40 pb-24 px-6 relative z-10 flex flex-col items-center">
        
        {/* Hero Section */}
        <motion.div initial="hidden" animate="visible" variants={staggerContainer} className="text-center w-full max-w-5xl mx-auto mb-10">
          
          <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50/80 border border-indigo-200/60 text-indigo-700 text-sm font-semibold mb-10 shadow-sm backdrop-blur-sm">
            <span className="flex h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></span>
            AfterClass 1.0 Early Access
          </motion.div>
          
          <motion.h1 variants={fadeIn} className="text-6xl md:text-[6.5rem] leading-[1.05] font-extrabold tracking-[-0.04em] text-slate-900 mb-8 max-w-4xl mx-auto">
            The standard for <br className="hidden md:block" />
            <span className="relative">
               modern tutorship.
               <svg className="absolute -bottom-2 md:-bottom-4 left-0 w-full h-3 md:h-6 text-indigo-500 -z-10 opacity-40" viewBox="0 0 400 30" fill="none" preserveAspectRatio="none"><path d="M0 25C150 -10 250 -10 400 25" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/></svg>
            </span>
          </motion.h1>

          <motion.p variants={fadeIn} className="text-xl md:text-2xl text-slate-500 mb-12 max-w-2xl mx-auto leading-[1.6] font-light tracking-tight">
            Stop juggling spreadsheets and group chats. Centralize your batches, automate fee collection, and scale your teaching empire flawlessly.
          </motion.p>
          
          <motion.div variants={fadeIn} className="flex flex-col sm:flex-row gap-5 justify-center items-center">
            <div className="relative group w-full sm:w-auto">
               <div className="absolute -inset-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 rounded-full blur-md opacity-30 group-hover:opacity-70 transition duration-500"></div>
               <Link to="/signup" className="relative flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-full font-semibold text-lg shadow-xl hover:bg-slate-800 transition-all">
                 Launch your portal
                 <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
               </Link>
            </div>
            <a href="#demo" className="w-full sm:w-auto px-8 py-4 bg-white/50 backdrop-blur-md text-slate-700 rounded-full font-semibold text-lg border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm">
              Talk to sales
            </a>
          </motion.div>
        </motion.div>

        {/* CSS Mockup Representation */}
        <MockupWindow />

        {/* Marquee / Social Proof area */}
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="w-full max-w-7xl border-y border-slate-200/50 py-8 mb-32 flex flex-col items-center justify-center gap-6 bg-slate-50/50 backdrop-blur-sm rounded-[2rem] overflow-hidden mt-8 md:mt-0">
           <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">Built for educators scaling across</p>
           <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60 mix-blend-multiply grayscale">
              {['Mathematics', 'Computer Science', 'Physics', 'Design', 'Languages', 'Test Prep'].map(sub => (
                <span key={sub} className="text-xl font-bold tracking-tight text-slate-800">{sub}</span>
              ))}
           </div>
        </motion.div>

        {/* Advanced Bento Grid */}
        <motion.div id="features" initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-100px" }} variants={staggerContainer} className="grid md:grid-cols-12 gap-6 w-full max-w-7xl mx-auto">
          
          <div className="col-span-12 mb-8 text-center md:text-left md:ml-4">
             <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 mb-4">Everything you need. <span className="text-slate-400">Zero bloat.</span></h2>
             <p className="text-xl text-slate-500">A meticulously designed ecosystem replacing exactly 4 disjointed tools.</p>
          </div>

          {/* Deep Dark Secure Payments Box */}
          <motion.div variants={fadeIn} className="col-span-12 md:col-span-8 group rounded-[2rem] bg-[#0A0A0A] border border-white/10 shadow-2xl overflow-hidden relative min-h-[400px] flex flex-col lg:flex-row items-center p-1 md:p-2 cursor-default">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-gradient-to-br from-indigo-500/20 to-purple-500/0 rounded-full blur-[100px] pointer-events-none"></div>
            
            <div className="flex-1 p-10 lg:p-14 relative z-10 order-2 lg:order-1">
              <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8 border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.2)]">
                <ShieldCheck className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4 tracking-tight">Automated Ledger</h3>
              <p className="text-slate-400 text-lg leading-relaxed max-w-md">No more awkward WhatsApp messages for pending fees. Automatically generate invoices, send reminders, and track financial analytics reliably.</p>
            </div>
            
            <div className="w-full lg:w-[45%] h-full relative p-6 lg:p-0 order-1 lg:order-2 flex items-center justify-center">
              <div className="w-full h-[280px] bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-6 relative overflow-hidden group-hover:-translate-y-2 group-hover:-translate-x-2 transition-transform duration-700">
                 <div className="flex justify-between items-end mb-6">
                    <div>
                      <div className="text-white/40 text-xs font-semibold mb-1 tracking-wider uppercase">Pending Due</div>
                      <div className="text-3xl font-bold text-white">₹1,240<span className="text-white/40 text-lg">.00</span></div>
                    </div>
                    <div className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-lg border border-green-500/20">Paid</div>
                 </div>
                 <div className="space-y-3">
                   {[1,2,3].map(i => (
                     <div key={i} className="flex justify-between items-center py-3 border-t border-white/10">
                        <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/20 flex items-center justify-center text-indigo-300 text-xs">SP</div>
                           <div className="text-sm font-medium text-white/80">Batch {i} Invoice</div>
                        </div>
                        <div className="text-sm font-semibold text-white/60">₹450</div>
                     </div>
                   ))}
                 </div>
              </div>
            </div>
          </motion.div>

          {/* Growth Box */}
          <motion.div variants={fadeIn} className="col-span-12 md:col-span-4 group rounded-[2rem] bg-indigo-50 border border-indigo-100/60 shadow-lg overflow-hidden relative p-10 flex flex-col justify-between hover:bg-indigo-100 transition-colors cursor-default">
             <div className="w-14 h-14 bg-white border border-indigo-100 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-105 transition-transform">
               <Users2 className="w-7 h-7 text-indigo-600" />
             </div>
             <div>
               <h3 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">Student CRM</h3>
               <p className="text-slate-600 leading-relaxed text-lg mb-6">A single source of truth for every student's attendance and demographic data.</p>
               <ul className="space-y-3">
                 {['Attendance tracking', 'Parent outreach', 'Performance tagging'].map(t =>(
                   <li key={t} className="flex items-center gap-3 text-indigo-900 font-medium">
                     <CheckCircle2 className="w-5 h-5 text-indigo-500" /> {t}
                   </li>
                 ))}
               </ul>
             </div>
          </motion.div>

          {/* Bottom Assessment Box */}
          <motion.div variants={fadeIn} className="col-span-12 group rounded-[2rem] bg-white border border-slate-200/60 shadow-xl shadow-slate-200/20 overflow-hidden relative p-10 lg:p-16 flex flex-col sm:flex-row items-center gap-12 hover:border-slate-300 transition-colors">
            <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-100 via-transparent to-transparent opacity-50 z-0 pointer-events-none" />
            <div className="flex-1 relative z-10 w-full">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-sm font-semibold mb-6">
                <BrainCog className="w-4 h-4" /> Next-Gen Learning
              </div>
              <h3 className="text-4xl font-extrabold text-slate-900 mb-5 tracking-tight">Craft Interactive Quizzes</h3>
              <p className="text-slate-500 text-xl leading-relaxed mb-8 max-w-2xl">Stop sending Word documents over email. Create immersive, auto-graded digital assessments natively woven into your students' workflow.</p>
              <Link to="/signup" className="group/btn inline-flex items-center gap-2 px-6 py-3 bg-slate-100 text-slate-900 rounded-xl font-bold text-lg hover:bg-slate-200 transition-colors">
                Explore creation <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>

        </motion.div>
      </main>

      {/* Structured Footer */}
      <footer className="border-t border-slate-200/60 bg-white pt-20 pb-10 mt-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
           <div className="grid md:grid-cols-4 gap-12 mb-16">
              <div className="md:col-span-2">
                 <img src={logo} alt="AfterClass Logo" className="h-10 w-auto mb-6 opacity-80" />
                 <p className="text-slate-500 max-w-sm text-lg">The definitive software ecosystem for modern educators to manage, teach, and grow.</p>
              </div>
              <div>
                 <h4 className="font-bold text-slate-900 mb-4 font-mono tracking-wider">PLATFORM</h4>
                 <ul className="space-y-3 text-slate-500 font-medium">
                   <li><a href="#" className="hover:text-indigo-600">Features</a></li>
                   <li><a href="#" className="hover:text-indigo-600">Pricing</a></li>
                   <li><a href="#" className="hover:text-indigo-600">Integrations</a></li>
                 </ul>
              </div>
              <div>
                 <h4 className="font-bold text-slate-900 mb-4 font-mono tracking-wider">COMPANY</h4>
                 <ul className="space-y-3 text-slate-500 font-medium">
                   <li><a href="#" className="hover:text-indigo-600">Privacy Policy</a></li>
                   <li><a href="#" className="hover:text-indigo-600">Terms of Service</a></li>
                   <li><a href="#" className="hover:text-indigo-600">Twitter (X)</a></li>
                 </ul>
              </div>
           </div>
           <div className="flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-slate-100 text-slate-400 font-medium text-sm">
             <p>© {new Date().getFullYear()} AfterClass Ecosystem Inc.</p>
             <p>Designed with meticulous attention to detail.</p>
           </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;

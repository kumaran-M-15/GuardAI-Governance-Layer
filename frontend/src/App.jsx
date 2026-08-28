import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, MessageSquare, LayoutDashboard, Database } from 'lucide-react';
import SecureChat from './components/SecureChat';
import GovernanceDashboard from './components/GovernanceDashboard';
import AuditLogs from './components/AuditLogs';

function NavLink({ to, children, icon: Icon }) {
  const location = useLocation();
  const isActive = location.pathname === to;
  
  return (
    <Link
      to={to}
      className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
        isActive 
          ? 'bg-indigo-600/20 text-indigo-400 font-medium' 
          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
      }`}
    >
      <Icon size={18} />
      {children}
    </Link>
  );
}

function Layout({ children }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg">
            <ShieldCheck className="text-indigo-400" size={24} />
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            GuardAI
          </h1>
        </div>
        
        <nav className="flex-1 px-4 py-6 flex flex-col gap-2">
          <NavLink to="/" icon={MessageSquare}>Secure Chat</NavLink>
          <NavLink to="/dashboard" icon={LayoutDashboard}>Governance</NavLink>
          <NavLink to="/audit" icon={Database}>Audit Logs</NavLink>
        </nav>
        
        <div className="p-4 border-t border-slate-800 text-xs text-slate-500">
          GuardAI Prototype v1.0
        </div>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-950">
        {children}
      </main>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<SecureChat />} />
          <Route path="/dashboard" element={<GovernanceDashboard />} />
          <Route path="/audit" element={<AuditLogs />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

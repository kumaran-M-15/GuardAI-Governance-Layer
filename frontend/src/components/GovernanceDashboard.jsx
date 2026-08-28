import { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Activity, ShieldAlert, Timer, RefreshCw } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';
const COLORS = ['#818cf8', '#a78bfa', '#f472b6', '#38bdf8', '#fbbf24', '#f87171'];

export default function GovernanceDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 10 seconds automatically
    const interval = setInterval(fetchStats, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !stats) {
    return <div className="p-8 text-slate-400 flex items-center gap-2"><RefreshCw className="animate-spin" size={16}/> Loading dashboard...</div>;
  }

  const { total_prompts_scanned, pii_incidents_blocked, average_latency_ms, risk_breakdown } = stats || {
    total_prompts_scanned: 0, pii_incidents_blocked: 0, average_latency_ms: 0, risk_breakdown: []
  };

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Governance Dashboard</h1>
          <p className="text-slate-400 mt-1">Real-time metrics on AI safety and privacy interventions.</p>
        </div>
        <button onClick={fetchStats} className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md transition-colors" title="Refresh">
          <RefreshCw size={18} className={loading ? 'animate-spin text-indigo-400' : ''} />
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Total Prompts Scanned" 
          value={total_prompts_scanned} 
          icon={<Activity size={24} className="text-blue-400" />}
          gradient="from-blue-500/10 to-transparent border-blue-500/20"
        />
        <MetricCard 
          title="PII Incidents Blocked" 
          value={pii_incidents_blocked} 
          icon={<ShieldAlert size={24} className="text-red-400" />}
          gradient="from-red-500/10 to-transparent border-red-500/20"
        />
        <MetricCard 
          title="Average Latency" 
          value={`${average_latency_ms.toFixed(1)} ms`} 
          icon={<Timer size={24} className="text-emerald-400" />}
          gradient="from-emerald-500/10 to-transparent border-emerald-500/20"
        />
      </div>

      {/* Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Breakdown Pie Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <h2 className="text-lg font-semibold text-slate-200 mb-6">Risk Breakdown</h2>
          
          {risk_breakdown.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={risk_breakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {risk_breakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc', borderRadius: '0.5rem' }}
                    itemStyle={{ color: '#e2e8f0' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-slate-500 border border-dashed border-slate-700 rounded-xl">
              No PII incidents detected yet.
            </div>
          )}
        </div>
        
        {/* Info Card */}
        <div className="bg-gradient-to-br from-indigo-900/30 to-slate-900 border border-indigo-500/20 rounded-2xl p-6 shadow-xl flex flex-col justify-center">
          <h3 className="text-xl font-semibold text-indigo-100 mb-4">System Status: Active</h3>
          <p className="text-slate-300 leading-relaxed">
            GuardAI is actively monitoring all traffic between users and the configured LLM endpoints. 
            Microsoft Presidio engines are running and intercepting standard entity types (PERSON, EMAIL_ADDRESS, PHONE_NUMBER, LOCATION, etc).
          </p>
          <div className="mt-6 p-4 bg-slate-950/50 rounded-xl border border-slate-800">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">Presidio Analyzer</span>
              <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online</span>
            </div>
            <div className="flex justify-between items-center text-sm mt-2">
              <span className="text-slate-400">Presidio Anonymizer</span>
              <span className="text-emerald-400 flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> Online</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, gradient }) {
  return (
    <div className={`bg-gradient-to-b bg-slate-900 ${gradient} border border-t-2 rounded-2xl p-6 shadow-lg`}>
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-400 mb-1">{title}</p>
          <h3 className="text-3xl font-bold text-slate-100">{value}</h3>
        </div>
        <div className="p-2 bg-slate-950 rounded-lg shadow-inner">
          {icon}
        </div>
      </div>
    </div>
  );
}

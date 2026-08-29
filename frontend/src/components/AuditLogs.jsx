import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Database, ArrowRight, ShieldBan } from 'lucide-react';

const API_URL = 'http://localhost:8000/api';

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await axios.get(`${API_URL}/logs`);
        setLogs(response.data);
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter(log => 
    log.original_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.masked_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <Database className="text-indigo-400" />
            Compliance Audit Log
          </h1>
          <p className="text-slate-400 mt-1">Immutable record of all intercepted LLM prompts and masking actions.</p>
        </div>
        
        <div className="relative w-full md:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-500" />
          </div>
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-slate-700 rounded-lg bg-slate-900 text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-all"
          />
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-950/50">
              <tr>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Time</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">User ID</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Transformation</th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Detected PII</th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 bg-slate-900">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    Loading audit logs...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <ShieldBan size={32} className="mx-auto mb-3 opacity-50" />
                    No logs found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const entities = JSON.parse(log.detected_entities || "[]");
                  const hasEntities = entities.length > 0;
                  
                  // Force UTC parsing by appending 'Z' if missing
                  const timeString = log.timestamp.includes('Z') ? log.timestamp : `${log.timestamp}Z`;
                  
                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(timeString).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300 font-mono">
                        {log.user_id}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-300 max-w-md">
                        <div className="flex flex-col gap-2">
                          <div className="p-2 bg-slate-950 rounded-md border border-slate-800 font-mono text-xs opacity-70">
                            {log.original_text}
                          </div>
                          <div className="flex justify-center text-slate-500">
                            <ArrowRight size={14} />
                          </div>
                          <div className={`p-2 rounded-md border font-mono text-xs ${hasEntities ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-200' : 'bg-slate-950 border-slate-800'}`}>
                            {log.masked_text}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {hasEntities ? (
                            entities.map((entity, idx) => (
                              <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                                {entity}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-500 text-xs italic">None</span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-slate-400">
                        {log.processing_time_ms.toFixed(1)} ms
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
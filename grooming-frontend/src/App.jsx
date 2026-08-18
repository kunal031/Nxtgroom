import React, { useState, useEffect } from 'react';
import { SWRConfig } from 'swr';
import { LogOut, CheckCircle2, RefreshCw } from 'lucide-react';
import Sidebar from './components/Sidebar';
import EvaluationReportModal from './components/EvaluationReportModal';
import BottomNav from './components/BottomNav';
import EvaluateCard from './components/EvaluateCard';
import InstructorDetail from './components/InstructorDetail';
import Login from './components/Login';
import DailyAttendanceTable from './components/DailyAttendanceTable';
import BOAManagement from './components/BOAManagement';
import CollegeManagement from './components/CollegeManagement';
import InstructorManagement from './components/InstructorManagement';

const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000`;

function localStorageProvider() {
  if (typeof window === 'undefined') return new Map();
  try {
    const map = new Map(JSON.parse(localStorage.getItem('nxtwave-swr-cache') || '[]'));
    window.addEventListener('beforeunload', () => {
      const appCache = JSON.stringify(Array.from(map.entries()));
      localStorage.setItem('nxtwave-swr-cache', appCache);
    });
    return map;
  } catch (e) {
    return new Map();
  }
}

export default function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('nxtwave_token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('nxtwave_role'));
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    return hash || localStorage.getItem('nxtwave_active_tab') || 'overview';
  });
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState(null);

  // Global Notification State
  const [pollingJobs, setPollingJobs] = useState([]);
  const [unopenedReports, setUnopenedReports] = useState([]);
  const [viewingEvaluation, setViewingEvaluation] = useState(null);

  useEffect(() => {
    if (pollingJobs.length === 0) return;

    const intervalId = setInterval(async () => {
      try {
        const token = localStorage.getItem('nxtwave_token');
        for (const job of pollingJobs) {
          const res = await fetch(`${API_BASE}/api/v2/attendance/${job.id}/evaluation`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const evalData = await res.json();
            setPollingJobs(prev => prev.filter(j => j.id !== job.id));
            
            const newReport = { ...job, evaluation: evalData, timestamp: Date.now() };
            setUnopenedReports(prev => [...prev, newReport]); // Immediately add to inbox
          }
        }
      } catch (err) {
        // Keep polling
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [pollingJobs]);

  useEffect(() => {
    localStorage.setItem('nxtwave_active_tab', activeTab);
    if (window.location.hash !== `#${activeTab}`) {
      window.location.hash = activeTab;
    }
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash && hash !== activeTab) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [activeTab]);

  const handleLogin = (token, role) => {
    setAuthToken(token);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('nxtwave_token');
    localStorage.removeItem('nxtwave_role');
    localStorage.removeItem('nxtwave-swr-cache');
    localStorage.removeItem('nxtwave_active_tab');
    setAuthToken(null);
    setUserRole(null);
    setActiveTab('overview');
    window.location.hash = '';
  };

  const fetchInstructors = async () => {
    if (!authToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v2/instructors`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.status === 401) {
        handleLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setInstructors(data);
      }
    } catch (err) {
      console.error("Failed to fetch instructors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) fetchInstructors();
  }, [authToken]);

  if (!authToken) {
    return <Login onLogin={handleLogin} />;
  }

  const filteredInstructors = instructors.filter(ins => 
    (ins.name || '').toLowerCase().includes(search.toLowerCase()) || 
    (ins.uuid || ins.employee_id || '').toLowerCase().includes(search.toLowerCase())
  );

  const allDates = new Set();
  filteredInstructors.forEach(ins => {
    ins.daily_feedbacks?.forEach(fb => {
      const dateKey = fb.date.split('T')[0];
      allDates.add(dateKey);
    });
  });
  const sortedDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a));

  const navigate = (tab) => {
    setActiveTab(tab);
  };

  return (
    <SWRConfig value={{ provider: localStorageProvider }}>
      <div className="flex h-screen bg-[#f8f9fc] font-sans text-gray-800 overflow-hidden relative w-full">
      
      <Sidebar 
        activeTab={activeTab} 
        navigate={navigate} 
        onLogout={handleLogout}
      />

      <main className="flex-1 h-full overflow-y-scroll overflow-x-hidden pb-20 lg:pb-0 flex flex-col w-full">
        {/* Mobile Top Header */}
        <div className="lg:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 p-1 shadow-sm border border-slate-100">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h2 className="font-extrabold text-slate-800 tracking-tight text-lg">Faculty<span className="text-[#4554d3]">Track</span></h2>
          </div>
          <button 
            onClick={handleLogout}
            className="text-slate-400 hover:text-rose-500 transition-colors p-2 bg-slate-50 rounded-xl"
            aria-label="Logout"
          >
            <LogOut size={20} />
          </button>
        </div>

        <div className="p-4 md:p-6 flex flex-col xl:flex-row gap-6 items-start flex-1 min-h-0 w-full">
          {activeTab === 'overview' && (
            <div className="w-full h-full flex justify-center items-start pt-10">
              <div className="w-full max-w-2xl shrink-0">
                <EvaluateCard 
                  instructors={instructors} 
                  fetchInstructors={fetchInstructors} 
                  setPollingJobs={setPollingJobs}
                  unopenedReports={unopenedReports}
                  setViewingEvaluation={setViewingEvaluation}
                />
              </div>
            </div>
          )}

          {activeTab === 'daily-records' && (
            <div className="w-full h-full">
              <DailyAttendanceTable onRowClick={(record) => {
                setSelectedAttendanceRecord(record);
                navigate('instructor-detail');
              }} />
            </div>
          )}

          {activeTab === 'instructor-detail' && (
            <div className="w-full h-full">
              <InstructorDetail 
                record={selectedAttendanceRecord} 
                onBack={() => navigate('daily-records')} 
              />
            </div>
          )}

          {activeTab === 'boa-management' && (
            <div className="w-full h-full">
              <BOAManagement />
            </div>
          )}

          {activeTab === 'college-management' && (
            <div className="w-full h-full">
              <CollegeManagement />
            </div>
          )}

          {activeTab === 'instructor-management' && (
            <div className="w-full h-full">
              <InstructorManagement />
            </div>
          )}
        </div>
      </main>
      
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>

    {/* Global Notifications (Only show on overview page as requested) */}
    {activeTab === 'overview' && (
      <div className="fixed bottom-24 right-4 md:bottom-8 md:right-8 z-50 flex flex-col gap-3 items-end pointer-events-none">
        {pollingJobs.map(job => (
          <span key={job.id} className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-md animate-in slide-in-from-right-4">
            <RefreshCw size={16} className="animate-spin" /> {job.instructorName} report pending...
          </span>
        ))}
      </div>
    )}

    {viewingEvaluation && (
      <EvaluationReportModal 
        evaluation={viewingEvaluation.evaluation}
        instructorName={viewingEvaluation.instructorName}
        instructorRole={viewingEvaluation.instructorRole}
        onClose={() => {
          setUnopenedReports(prev => prev.filter(r => r.id !== viewingEvaluation.id));
          setViewingEvaluation(null);
        }}
      />
    )}
    </SWRConfig>
  );
}

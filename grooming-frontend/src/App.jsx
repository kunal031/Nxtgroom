import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from './components/Sidebar';
import EvaluateCard from './components/EvaluateCard';
import InstructorDetail from './components/InstructorDetail';
import Login from './components/Login';
import DailyAttendanceTable from './components/DailyAttendanceTable';
import BOAManagement from './components/BOAManagement';
import CollegeManagement from './components/CollegeManagement';
import InstructorManagement from './components/InstructorManagement';

const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000`;

export default function App() {
  const [authToken, setAuthToken] = useState(localStorage.getItem('nxtwave_token'));
  const [userRole, setUserRole] = useState(localStorage.getItem('nxtwave_role'));
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'instructors'
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedAttendanceRecord, setSelectedAttendanceRecord] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogin = (token, role) => {
    setAuthToken(token);
    setUserRole(role);
  };

  const handleLogout = () => {
    localStorage.removeItem('nxtwave_token');
    localStorage.removeItem('nxtwave_role');
    setAuthToken(null);
    setUserRole(null);
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
    setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#f8f9fc] font-sans text-gray-800 overflow-hidden relative w-full">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar 
        isSidebarOpen={isSidebarOpen} 
        setIsSidebarOpen={setIsSidebarOpen} 
        activeTab={activeTab} 
        navigate={navigate} 
      />

      <main className="flex-1 h-full overflow-auto p-4 md:p-6 flex flex-col w-full">
        <div className="flex items-center justify-between gap-4 mb-6 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-slate-600 hover:text-slate-900 bg-white p-2 rounded-lg border border-slate-200 shadow-sm"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-[#1a1f36] tracking-tight">
              Instructor Grooming Standard
            </h1>
          </div>
          <button 
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-bold text-slate-500 bg-white border border-slate-200 rounded-lg shadow-sm hover:bg-slate-50 transition-colors"
          >
            Logout
          </button>
        </div>
        
        <div className="flex flex-col xl:flex-row gap-6 items-start flex-1 min-h-0 w-full">
          {activeTab === 'overview' && (
            <div className="w-full h-full flex justify-center items-start pt-10">
              <div className="w-full max-w-2xl shrink-0">
                <EvaluateCard 
                  instructors={instructors} 
                  fetchInstructors={fetchInstructors} 
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
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { LayoutGrid, Users, ShieldCheck, X, History, Building2, UserCog, Folder, ChevronDown, ChevronRight } from 'lucide-react';

export default function Sidebar({ isSidebarOpen, setIsSidebarOpen, activeTab, navigate }) {
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  
  useEffect(() => {
    if (['college-management', 'instructor-management', 'boa-management'].includes(activeTab)) {
      setIsManagementOpen(true);
    }
  }, [activeTab]);

  return (
    <aside className={`fixed lg:static inset-y-0 left-0 w-64 bg-white border-r border-indigo-50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-50 shrink-0 transform transition-transform duration-300 ease-in-out ${
      isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
    }`}>
      <div className="p-6 pt-8 mb-4 relative">
        <button 
          className="lg:hidden absolute top-6 right-4 text-slate-400 hover:text-slate-600 bg-slate-50 p-1 rounded-full" 
          onClick={() => setIsSidebarOpen(false)}
        >
          <X size={20} />
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="FacultyTrack Logo" className="w-full h-full object-contain mix-blend-multiply" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg leading-tight text-slate-800 tracking-tight">Faculty<span className="text-indigo-600">Track</span></h2>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-6">
        <button 
          onClick={() => navigate('overview')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'overview' 
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <LayoutGrid size={20} />
          Attendance
        </button>
        
        <button 
          onClick={() => navigate('daily-records')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'daily-records' 
              ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' 
              : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
        >
          <History size={20} />
          Daily Records
        </button>

        {localStorage.getItem('nxtwave_role') === 'SUPER_ADMIN' && (
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button 
              onClick={() => setIsManagementOpen(!isManagementOpen)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider hover:text-slate-600 transition-colors"
            >
              <span className="flex items-center gap-2"><Folder size={14} /> Management</span>
              {isManagementOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            <div className={`mt-2 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isManagementOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
              <button 
                onClick={() => navigate('college-management')}
                className={`w-full flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'college-management' 
                    ? 'bg-indigo-50 text-indigo-700 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Building2 size={16} />
                Colleges
              </button>
              <button 
                onClick={() => navigate('instructor-management')}
                className={`w-full flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'instructor-management' 
                    ? 'bg-indigo-50 text-indigo-700 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <UserCog size={16} />
                Instructors
              </button>
              <button 
                onClick={() => navigate('boa-management')}
                className={`w-full flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'boa-management' 
                    ? 'bg-indigo-50 text-indigo-700 font-bold' 
                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <Users size={16} />
                BOAs
              </button>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}

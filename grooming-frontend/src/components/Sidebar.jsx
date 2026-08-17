import React, { useState, useEffect } from 'react';
import { LayoutGrid, Users, ShieldCheck, X, History, Building2, UserCog, Folder, ChevronDown, ChevronRight, MoreVertical, LogOut } from 'lucide-react';

export default function Sidebar({ activeTab, navigate, onLogout }) {
  const [isManagementOpen, setIsManagementOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  
  useEffect(() => {
    if (['college-management', 'instructor-management', 'boa-management'].includes(activeTab)) {
      setIsManagementOpen(true);
    }
  }, [activeTab]);

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#4554d3] shadow-[4px_0_24px_rgba(0,0,0,0.1)] z-50 shrink-0">
      <div className="p-6 pt-8 mb-4 relative">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shrink-0 p-1 shadow-sm">
            <img src="/logo.png" alt="FacultyTrack Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <h2 className="font-extrabold text-lg leading-tight text-white tracking-tight">Faculty<span className="text-indigo-200">Track</span></h2>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-2 overflow-y-auto pb-6">
        <button 
          onClick={() => navigate('overview')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'overview' 
              ? 'bg-white/20 text-white shadow-md shadow-black/10 font-bold' 
              : 'text-indigo-100 hover:bg-white/10 hover:text-white'
          }`}
        >
          <LayoutGrid size={20} />
          Attendance
        </button>
        
        <button 
          onClick={() => navigate('daily-records')}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
            activeTab === 'daily-records' 
              ? 'bg-white/20 text-white shadow-md shadow-black/10 font-bold' 
              : 'text-indigo-100 hover:bg-white/10 hover:text-white'
          }`}
        >
          <History size={20} />
          Daily Records
        </button>

        {localStorage.getItem('nxtwave_role') === 'SUPER_ADMIN' && (
          <div className="pt-4 mt-4 border-t border-white/10">
            <button 
              onClick={() => setIsManagementOpen(!isManagementOpen)}
              className="w-full flex items-center justify-between px-4 py-2 text-xs font-bold text-indigo-200 uppercase tracking-wider hover:text-white transition-colors"
            >
              <span className="flex items-center gap-2"><Folder size={14} /> Management</span>
              {isManagementOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </button>
            
            <div className={`mt-2 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${isManagementOpen ? 'max-h-64 opacity-100' : 'max-h-0 opacity-0'}`}>
              <button 
                onClick={() => navigate('college-management')}
                className={`w-full flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'college-management' 
                    ? 'bg-white/15 text-white font-bold shadow-sm' 
                    : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Building2 size={16} />
                Colleges
              </button>
              <button 
                onClick={() => navigate('instructor-management')}
                className={`w-full flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'instructor-management' 
                    ? 'bg-white/15 text-white font-bold shadow-sm' 
                    : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <UserCog size={16} />
                Instructors
              </button>
              <button 
                onClick={() => navigate('boa-management')}
                className={`w-full flex items-center gap-3 pl-11 pr-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeTab === 'boa-management' 
                    ? 'bg-white/15 text-white font-bold shadow-sm' 
                    : 'text-indigo-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Users size={16} />
                BOAs
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* User Profile Badge */}
      <div className="p-4 border-t border-white/10 shrink-0 relative">
        <div 
          className="flex items-center gap-3 bg-white/10 rounded-xl p-3 hover:bg-white/20 transition-colors cursor-pointer group"
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
        >
          <div className="w-10 h-10 rounded-full bg-white text-indigo-600 flex items-center justify-center shrink-0 overflow-hidden shadow-sm">
            <span className="font-bold text-lg">{localStorage.getItem('nxtwave_name')?.charAt(0) || 'U'}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{localStorage.getItem('nxtwave_name') || 'Admin'}</h3>
            <p className="text-xs text-indigo-200 truncate">{localStorage.getItem('nxtwave_email') || 'admin@nxtwave.com'}</p>
          </div>
          <MoreVertical size={18} className="text-white/70 group-hover:text-white" />
        </div>
        
        {isProfileMenuOpen && (
          <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
            <button 
              onClick={() => {
                setIsProfileMenuOpen(false);
                if (onLogout) onLogout();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 transition-colors"
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

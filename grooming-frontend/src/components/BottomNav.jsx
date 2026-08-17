import React from 'react';
import { LayoutGrid, History, Building2, UserCog, ShieldCheck } from 'lucide-react';

export default function BottomNav({ activeTab, setActiveTab }) {
  const isAdmin = localStorage.getItem('nxtwave_role') === 'SUPER_ADMIN';

  const navItems = [
    { id: 'overview', icon: LayoutGrid, label: 'Attendance' },
    { id: 'daily-records', icon: History, label: 'Records' },
  ];

  if (isAdmin) {
    navItems.push(
      { id: 'college-management', icon: Building2, label: 'Colleges' },
      { id: 'instructor-management', icon: UserCog, label: 'Instructors' },
      { id: 'boa-management', icon: ShieldCheck, label: 'BOAs' }
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] z-50 lg:hidden px-2 pb-safe">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-[#4554d3]' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1 rounded-xl transition-all duration-300 ${isActive ? 'bg-indigo-50 text-[#4554d3]' : ''}`}>
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

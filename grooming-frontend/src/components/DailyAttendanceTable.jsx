import React, { useState, useEffect } from 'react';
import { History, Search, MapPin, CheckCircle2, XCircle, Clock } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8000`;
const locationCache = {};

function LocationName({ coords, onResolved }) {
  const [name, setName] = useState('Loading...');

  useEffect(() => {
    if (!coords) return;
    if (locationCache[coords]) {
      setName(locationCache[coords]);
      if (onResolved) onResolved(locationCache[coords]);
      return;
    }
    const [lat, lon] = coords.split(',').map(s => s.trim());
    if (!lat || !lon) {
      setName(coords);
      if (onResolved) onResolved(coords);
      return;
    }
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(r => r.json())
      .then(data => {
        const locName = data.address?.city || data.address?.town || data.address?.suburb || data.display_name?.split(',')[0] || coords;
        locationCache[coords] = locName;
        setName(locName);
        if (onResolved) onResolved(locName);
      })
      .catch(() => {
        setName(coords);
        if (onResolved) onResolved(coords);
      });
  }, [coords]);

  return <span className="flex items-center gap-1.5 text-indigo-600 font-medium whitespace-nowrap"><MapPin size={14}/> {name}</span>;
}

export default function DailyAttendanceTable({ onRowClick }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [dateFilter, setDateFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [resolvedLocations, setResolvedLocations] = useState({});

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nxtwave_token');
      const url = `${API_BASE}/api/v2/attendance/today${dateFilter ? `?date=${dateFilter}` : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRecords(data);
      }
    } catch (err) {
      console.error("Failed to fetch daily records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // Poll every 30 seconds for AI status updates
    const interval = setInterval(fetchRecords, 30000);
    return () => clearInterval(interval);
  }, [dateFilter]);

  const uniqueRoles = [...new Set(records.map(r => r.instructor_role).filter(Boolean))];
  const uniqueColleges = [...new Set(records.map(r => r.college_name).filter(Boolean))];

  const filteredRecords = records.filter(r => {
    const locName = resolvedLocations[r._id] || r.location_coordinates || '';
    if (search && 
        !(r.instructor_name || '').toLowerCase().includes(search.toLowerCase()) && 
        !(r.remarks || '').toLowerCase().includes(search.toLowerCase()) &&
        !locName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (roleFilter && r.instructor_role !== roleFilter) return false;
    if (collegeFilter && r.college_name !== collegeFilter) return false;
    return true;
  });

  const getStatusBadge = (status) => {
    switch(status) {
      case 'compliant':
      case 'done':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200"><CheckCircle2 size={12} /> Done</span>;
      case 'non_compliant':
      case 'error':
      case 'failed':
      case 'fail':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200"><XCircle size={12} /> Failed</span>;
      case 'pending':
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200"><Clock size={12} /> Pending</span>;
    }
  };

  const formatTime = (isoString) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (isoString) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <History size={24} className="text-indigo-600" />
            Daily Attendance Records
          </h2>
          <p className="text-sm text-slate-500 mt-1">Live feed of all check-ins, check-outs, and grooming audits.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <input 
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm text-slate-600"
          />
          <select 
            value={collegeFilter}
            onChange={(e) => setCollegeFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm text-slate-600 appearance-none bg-white min-w-[140px]"
          >
            <option value="">All Colleges</option>
            {uniqueColleges.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-4 py-2 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm text-slate-600 appearance-none bg-white min-w-[120px]"
          >
            <option value="">All Roles</option>
            {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <div className="relative flex-1 md:flex-none">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search Name or Location..." 
              className="pl-10 pr-4 py-2 w-full md:w-64 rounded-xl border border-slate-200 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="sticky top-0 bg-slate-50 z-10 shadow-sm">
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Instructor Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">Date</th>
                <th className="p-4">Check-In</th>
                <th className="p-4">Check-Out</th>
                <th className="p-4">Location</th>
                <th className="p-4">Status</th>
                <th className="p-4 w-1/4">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && records.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">Loading daily records...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="8" className="p-8 text-center text-slate-400">No records found for today.</td>
                </tr>
              ) : (
                filteredRecords.map(r => (
                  <tr 
                    key={r._id} 
                    onClick={() => r.status !== 'pending' && onRowClick(r)}
                    className={`transition-colors ${r.status !== 'pending' ? 'hover:bg-slate-50 cursor-pointer' : 'opacity-80'}`}
                  >
                    <td className="p-4 font-bold text-slate-800">{r.instructor_name}</td>
                    <td className="p-4 text-sm font-medium text-slate-500">{r.instructor_role}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{formatDate(r.date)}</td>
                    <td className="p-4 text-sm font-bold text-slate-700">{formatTime(r.check_in_time)}</td>
                    <td className="p-4 text-sm font-bold text-slate-700">{formatTime(r.check_out_time)}</td>
                    <td className="p-4 text-sm text-slate-500">
                      {r.location_coordinates ? <LocationName coords={r.location_coordinates} onResolved={(name) => {
                        if (resolvedLocations[r._id] !== name) {
                          setResolvedLocations(prev => ({...prev, [r._id]: name}));
                        }
                      }} /> : '--'}
                    </td>
                    <td className="p-4">{getStatusBadge(r.status)}</td>
                    <td className="p-4 text-sm text-slate-500 max-w-xs truncate">{r.remarks}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

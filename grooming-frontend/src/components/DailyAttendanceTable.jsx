import React, { useState, useEffect } from 'react';
import { History, Search, MapPin, CheckCircle2, XCircle, Clock, Download, X } from 'lucide-react';
import * as XLSX from 'xlsx';

const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000`;
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
        const parts = [];
        if (data.address?.suburb) parts.push(data.address.suburb);
        else if (data.address?.neighbourhood) parts.push(data.address.neighbourhood);
        
        if (data.address?.city) parts.push(data.address.city);
        else if (data.address?.town) parts.push(data.address.town);
        else if (data.address?.state_district) parts.push(data.address.state_district);
        
        let locName = parts.length > 0 ? parts.join(', ') : (data.display_name?.split(',').slice(1,3).join(',').trim() || coords);
        if (locName.includes('undefined')) locName = coords;
        
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
  const [allColleges, setAllColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [dateFilter, setDateFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [collegeFilter, setCollegeFilter] = useState('');
  const [resolvedLocations, setResolvedLocations] = useState({});

  const [showExport, setShowExport] = useState(false);
  const [exportFrom, setExportFrom] = useState('');
  const [exportTo, setExportTo] = useState('');
  const [exportColleges, setExportColleges] = useState([]);
  const [exportEmail, setExportEmail] = useState('');
  const [exportFormat, setExportFormat] = useState('csv'); // 'csv' or 'excel'
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async (e) => {
    e.preventDefault();
    setExportLoading(true);
    try {
      const token = localStorage.getItem('nxtwave_token');
      const payload = {};
      if (exportFrom && exportTo) {
        payload.date_from = exportFrom;
        payload.date_to = exportTo;
      }
      if (exportColleges.length > 0) payload.colleges = exportColleges;
      if (exportEmail) payload.send_to_email = exportEmail;

      const res = await fetch(`${API_BASE}/api/v2/attendance/export`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Export failed");

      if (exportEmail) {
        alert(data.message);
      } else if (data.csv) {
        if (exportFormat === 'csv') {
          // Create CSV download
          const blob = new Blob([data.csv], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', `Daily_Records_${exportFrom || 'all'}_to_${exportTo || 'all'}.csv`);
          link.style.visibility = 'hidden';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } else {
          // Create Excel download
          const workbook = XLSX.read(data.csv, { type: 'string' });
          XLSX.writeFile(workbook, `Daily_Records_${exportFrom || 'all'}_to_${exportTo || 'all'}.xlsx`);
        }
      }
      setShowExport(false);
    } catch (err) {
      alert("Error exporting: " + err.message);
    } finally {
      setExportLoading(false);
    }
  };

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
    const fetchColleges = async () => {
      try {
        const token = localStorage.getItem('nxtwave_token');
        const res = await fetch(`${API_BASE}/api/v2/colleges`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAllColleges(data.map(c => c.name));
        }
      } catch (err) {
        console.error("Failed to fetch colleges", err);
      }
    };
    fetchColleges();
  }, []);

  useEffect(() => {
    fetchRecords();
    // Poll every 30 seconds for AI status updates
    const interval = setInterval(fetchRecords, 30000);
    return () => clearInterval(interval);
  }, [dateFilter]);

  const uniqueRoles = [...new Set(records.map(r => r.instructor_role).filter(Boolean))];
  const uniqueColleges = allColleges.length > 0 
    ? allColleges 
    : [...new Set(records.map(r => r.college_name).filter(Boolean))];

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
          <button
            onClick={() => setShowExport(true)}
            className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors border border-indigo-200"
          >
            <Download size={16} /> Export
          </button>
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
                    <td className="p-4 text-sm text-slate-500 max-w-xs">
                      {(() => {
                        if (!r.remarks) return '--';
                        const match = r.remarks.match(/^\[(.*?)\]\s*(.*)$/);
                        if (match) {
                          const tag = match[1];
                          const text = match[2];
                          let tagColor = 'bg-slate-100 text-slate-600';
                          const tLower = tag.toLowerCase();
                          if (tLower.includes('poor')) tagColor = 'bg-rose-100 text-rose-700';
                          else if (tLower.includes('average')) tagColor = 'bg-amber-100 text-amber-700';
                          else if (tLower.includes('good')) tagColor = 'bg-emerald-100 text-emerald-700';
                          else if (tLower.includes('excellent')) tagColor = 'bg-indigo-100 text-indigo-700';
                          return (
                            <div className="flex flex-col gap-1 items-start w-full">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${tagColor}`}>
                                {tag}
                              </span>
                              <span className="truncate w-full block" title={text}>{text}</span>
                            </div>
                          );
                        }
                        return <span className="truncate w-full block" title={r.remarks}>{r.remarks}</span>;
                      })()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showExport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <Download size={20} className="text-indigo-600" /> Export Records
              </h3>
              <button onClick={() => setShowExport(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleExport} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">From Date</label>
                  <input type="date" value={exportFrom} onChange={e => setExportFrom(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">To Date</label>
                  <input type="date" value={exportTo} onChange={e => setExportTo(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Colleges (Leave empty for all)</label>
                <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 space-y-1">
                  {allColleges.map(c => (
                    <label key={c} className="flex items-center gap-2 p-2 hover:bg-slate-100 rounded-lg cursor-pointer">
                      <input 
                        type="checkbox" 
                        className="rounded text-indigo-600 focus:ring-indigo-500"
                        checked={exportColleges.includes(c)}
                        onChange={(e) => {
                          if (e.target.checked) setExportColleges([...exportColleges, c]);
                          else setExportColleges(exportColleges.filter(col => col !== c));
                        }}
                      />
                      <span className="text-sm font-medium text-slate-700">{c}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Send To Email (Optional)</label>
                <input type="email" placeholder="example@nxtwave.tech" value={exportEmail} onChange={e => setExportEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                <p className="text-xs text-slate-400 mt-1">If provided, the export will be emailed as a CSV attachment instead of downloaded.</p>
              </div>

              {!exportEmail && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Export Format</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input 
                        type="radio" 
                        name="exportFormat" 
                        value="csv" 
                        checked={exportFormat === 'csv'} 
                        onChange={() => setExportFormat('csv')} 
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      CSV Document
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-700">
                      <input 
                        type="radio" 
                        name="exportFormat" 
                        value="excel" 
                        checked={exportFormat === 'excel'} 
                        onChange={() => setExportFormat('excel')} 
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      Excel Sheet (.xlsx)
                    </label>
                  </div>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setShowExport(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">Cancel</button>
                <button type="submit" disabled={exportLoading} className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors disabled:opacity-70">
                  {exportLoading ? 'Processing...' : <><Download size={18} /> Download / Send</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Users, CloudUpload, CheckCircle2, AlertCircle, Plus, Search, ArrowRight, ShieldCheck, Info, X } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'instructors'
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedReport, setSelectedReport] = useState(null); // For the details modal

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/v2/instructors`);
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
    fetchInstructors();
  }, []);

  const filteredInstructors = instructors.filter(ins => 
    ins.name.toLowerCase().includes(search.toLowerCase()) || 
    ins.uuid.toLowerCase().includes(search.toLowerCase())
  );

  // Extract all unique dates for columns
  const allDates = new Set();
  filteredInstructors.forEach(ins => {
    ins.daily_feedbacks?.forEach(fb => {
      // support both ISO strings and YYYY-MM-DD
      const dateKey = fb.date.split('T')[0];
      allDates.add(dateKey);
    });
  });
  const sortedDates = Array.from(allDates).sort((a, b) => new Date(b) - new Date(a));

  return (
    <div className="flex h-screen bg-[#f8f9fc] font-sans text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-indigo-50 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10 shrink-0">
        <div className="p-6 pt-8 mb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <ShieldCheck size={20} className="stroke-[2.5px]" />
            </div>
            <div>
              <h2 className="font-bold text-lg leading-tight text-slate-800">Instructor</h2>
              <h2 className="font-bold text-lg leading-tight text-slate-800">Portal</h2>
            </div>
          </div>
          <p className="text-[10px] font-bold tracking-widest text-slate-400 mt-2 uppercase">Management Suite</p>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'overview' 
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <LayoutGrid size={20} />
            Overview
          </button>
          
          <button 
            onClick={() => setActiveTab('instructors')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
              activeTab === 'instructors' 
                ? 'bg-indigo-500 text-white shadow-md shadow-indigo-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Users size={20} />
            All Instructors
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8 lg:p-10 flex flex-col">
        <h1 className="text-3xl md:text-4xl font-extrabold text-[#1a1f36] mb-8 tracking-tight">
          Instructor Grooming Standard
        </h1>
        
        <div className="flex flex-col xl:flex-row gap-6 items-start flex-1 min-h-0">
          
          {/* Left Column (List) */}
          <div className={`flex flex-col transition-all duration-500 h-full ${activeTab === 'overview' ? 'xl:w-[65%] w-full' : 'w-full'}`}>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col flex-1 min-h-0">
              
              {/* Table Header Area */}
              <div className="flex flex-col sm:flex-row justify-between items-center p-5 border-b border-slate-200 gap-4 shrink-0">
                <h3 className="font-bold text-base text-[#1a1f36] uppercase tracking-wide">List of all Instructors</h3>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search instructors..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Table - Dynamic Columns for Dates */}
              <div className="overflow-auto flex-1 relative">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="sticky top-0 bg-white z-10 shadow-[0_1px_0_#e2e8f0]">
                    <tr className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="px-6 py-5 min-w-[120px] sticky left-0 bg-white shadow-[1px_0_0_#e2e8f0] z-20">UUID</th>
                      <th className="px-6 py-5 min-w-[180px]">Instructor Name</th>
                      <th className="px-6 py-5 min-w-[150px]">Role</th>
                      {sortedDates.map(date => (
                        <th key={date} className="px-6 py-5 min-w-[160px] text-center">
                          {new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loading ? (
                      <tr><td colSpan={3 + sortedDates.length} className="px-6 py-12 text-center text-slate-400">Loading directory...</td></tr>
                    ) : filteredInstructors.length === 0 ? (
                      <tr><td colSpan={3 + sortedDates.length} className="px-6 py-12 text-center text-slate-400">No instructors found.</td></tr>
                    ) : (
                      filteredInstructors.map((ins) => (
                        <tr key={ins.uuid} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="px-6 py-5 align-middle sticky left-0 bg-white shadow-[1px_0_0_#e2e8f0] group-hover:bg-slate-50/50 z-10">
                            <span className="font-mono text-[13px] text-slate-400 font-medium">#{ins.uuid}</span>
                          </td>
                          <td className="px-6 py-5 align-middle">
                            <span className="font-semibold text-slate-800 text-sm">{ins.name}</span>
                          </td>
                          <td className="px-6 py-5 align-middle">
                            <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-600 font-medium text-xs rounded-md">
                              {ins.role}
                            </span>
                          </td>
                          {sortedDates.map(date => {
                            const record = ins.daily_feedbacks?.find(fb => fb.date.startsWith(date));
                            return (
                              <td key={date} className="px-6 py-5 text-center align-middle">
                                {record ? (
                                  <div className="flex items-center justify-center gap-2">
                                    <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${record.overall_status === 'COMPLIANT' ? 'text-indigo-600' : 'text-red-600'}`}>
                                      {record.overall_status === 'COMPLIANT' ? <CheckCircle2 size={16} className="stroke-[2.5px]" /> : <AlertCircle size={16} className="stroke-[2.5px]" />}
                                      {record.overall_status === 'COMPLIANT' ? 'Pass' : 'NON-COMPLIANT'}
                                    </span>
                                    <button 
                                      onClick={() => setSelectedReport(record.detailed_report)}
                                      className="text-slate-400 hover:text-indigo-600 transition-colors"
                                      title="View Full Report"
                                    >
                                      <Info size={16} />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="text-slate-300">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column (Evaluate Card) */}
          {activeTab === 'overview' && (
            <div className="w-full xl:w-[35%]">
              <EvaluateCard instructors={instructors} fetchInstructors={fetchInstructors} />
            </div>
          )}

        </div>
      </main>

      {/* Report Modal */}
      {selectedReport && <ReportModal report={selectedReport} onClose={() => setSelectedReport(null)} />}
    </div>
  );
}

// Subcomponent: Evaluate Card
function EvaluateCard({ instructors, fetchInstructors }) {
  const [selectedUuid, setSelectedUuid] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const fileInputRef = useRef(null);

  const handleEvaluate = async () => {
    if (!selectedUuid || !file) {
      alert("Please select a target profile and upload an image.");
      return;
    }
    setLoading(true);

    const formData = new FormData();
    formData.append('uuid', selectedUuid);
    formData.append('file', file);

    try {
      const res = await fetch(`${API_BASE}/api/v2/evaluate_grooming`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Evaluation failed");
      
      alert(`Evaluation Complete!\nStatus: ${data.report.overall_status}\nCheck the table for details.`);
      setFile(null); 
      if(fileInputRef.current) fileInputRef.current.value = '';
      fetchInstructors(); 
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white border border-[#e6d9fc] rounded-xl p-6 lg:p-8 shadow-sm">
        <h3 className="text-lg font-bold text-[#1a1f36] uppercase tracking-wide leading-snug mb-8">
          Evaluate<br/>Grooming<br/>Standard
        </h3>

        {/* Drag & Drop Area */}
        <div 
          className="border border-dashed border-[#c1c4d6] rounded-xl bg-white p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-50 transition-colors group mb-8"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <div className="w-12 h-12 rounded-full bg-indigo-500 flex items-center justify-center text-white mb-4 shadow-sm group-hover:scale-105 transition-transform">
            <CloudUpload size={24} />
          </div>
          {file ? (
            <p className="text-sm font-semibold text-indigo-600">{file.name}</p>
          ) : (
            <>
              <p className="text-sm font-bold text-indigo-600 mb-1">upload image</p>
              <p className="text-[11px] text-slate-400 font-mono tracking-wide">Drag & drop or click<br/>to browse</p>
            </>
          )}
        </div>

        {/* Target Profile Dropdown */}
        <div className="mb-8">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            Target Profile
          </label>
          <div className="flex gap-2">
            <select 
              value={selectedUuid}
              onChange={(e) => setSelectedUuid(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 0.75rem center`, backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
            >
              <option value="">select new instructor</option>
              {instructors.map(ins => (
                <option key={ins.uuid} value={ins.uuid}>{ins.name}</option>
              ))}
            </select>
            <button 
              onClick={() => setShowModal(true)}
              className="w-11 h-11 shrink-0 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Add Instructor"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        {/* Evaluate Button */}
        <button 
          onClick={handleEvaluate}
          disabled={loading}
          className="w-full bg-[#8b5cf6] text-white py-3.5 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#7c3aed] transition-colors disabled:opacity-60"
        >
          {loading ? 'Evaluating...' : 'Evaluate'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </div>

      {/* Add Instructor Modal */}
      {showModal && <AddInstructorModal onClose={() => setShowModal(false)} onSuccess={() => { setShowModal(false); fetchInstructors(); }} />}
    </>
  );
}

// Subcomponent: Add Instructor Modal
function AddInstructorModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ uuid: '', name: '', role: '', gender: 'MALE' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE}/api/v2/instructors`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        onSuccess();
      } else {
        const data = await res.json();
        alert(data.detail || "Error creating instructor");
      }
    } catch (err) {
      alert("Network error");
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <h2 className="text-xl font-bold mb-6 text-slate-800">Add New Target Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">UUID</label>
            <input required type="text" className="w-full rounded-lg border border-slate-200 p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.uuid} onChange={e => setFormData({...formData, uuid: e.target.value})} placeholder="e.g. INS-001" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
            <input required type="text" className="w-full rounded-lg border border-slate-200 p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sarah Jenkins" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
            <input required type="text" className="w-full rounded-lg border border-slate-200 p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="e.g. Lead Instructor" />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
            <select className="w-full rounded-lg border border-slate-200 p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-5 py-2 text-slate-500 font-bold text-sm hover:bg-slate-50 rounded-lg">CANCEL</button>
            <button type="submit" disabled={saving} className="px-6 py-2 bg-indigo-600 text-white font-bold text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'SAVING...' : 'CREATE PROFILE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Subcomponent: Full Report Details Modal
function ReportModal({ report, onClose }) {
  if (!report) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 sm:p-8">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header - Fixed */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">Grooming Detailed Report</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-full hover:bg-slate-200">
            <X size={20} />
          </button>
        </div>
        
        {/* Scrollable Content */}
        <div className="overflow-y-auto p-6 flex-1">
          {/* Top Section: Overall Status & Summary */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Overall Status:</span>
              <span className={`px-4 py-1.5 rounded-full text-sm font-bold tracking-wide flex items-center gap-2 ${report.overall_status === 'COMPLIANT' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {report.overall_status === 'COMPLIANT' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                {report.overall_status}
              </span>
            </div>
            <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-xl">
              <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-2">AI Summary</h4>
              <p className="text-slate-700 text-base leading-relaxed">{report.summary}</p>
            </div>
          </div>
          
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Individual Checkpoints</h4>
          
          {/* Individual Checks */}
          <div className="space-y-4">
            {report.checks?.map((check, idx) => {
              const isPass = check.status === 'PASS';
              const isNA = check.status === 'N/A';
              return (
                <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-bold text-slate-800 flex-1 pr-4">{check.checkpoint}</h3>
                    <span className={`shrink-0 text-xs font-bold px-3 py-1 rounded-full border ${
                      isPass ? 'text-green-600 bg-green-50 border-green-200' : 
                      isNA ? 'text-slate-500 bg-slate-100 border-slate-200' : 'text-red-600 bg-red-50 border-red-200'
                    }`}>
                      {check.status}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Observation</span>
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{check.observation}</p>
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Reasoning</span>
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100">{check.reasoning}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

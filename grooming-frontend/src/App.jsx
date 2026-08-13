import React, { useState, useEffect, useRef } from 'react';
import { LayoutGrid, Users, CloudUpload, CheckCircle2, AlertCircle, Plus, Search, ArrowRight, ShieldCheck } from 'lucide-react';

const API_BASE = 'http://127.0.0.1:8000';

export default function App() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'instructors'
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

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

  return (
    <div className="flex h-screen bg-[#f4f6fb] font-sans text-gray-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-10">
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
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
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
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Users size={20} />
            All Instructors
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto p-8 lg:p-10">
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-8 tracking-tight">
          Instructor Grooming Standard
        </h1>
        
        <div className="flex flex-col xl:flex-row gap-6 items-start">
          
          {/* Left Column (List) */}
          <div className={`transition-all duration-500 ${activeTab === 'overview' ? 'xl:w-2/3 w-full' : 'w-full'}`}>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Table Header Area */}
              <div className="flex flex-col sm:flex-row justify-between items-center p-6 border-b border-gray-100 gap-4">
                <h3 className="font-bold text-lg text-slate-800 uppercase tracking-wide">List of all Instructors</h3>
                <div className="relative w-full sm:w-64">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Search instructors..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-white border-b border-gray-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-6 py-4 w-32">UUID</th>
                      <th className="px-6 py-4">Instructor Name</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Grooming Status<br/>(Dates)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {loading ? (
                      <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400">Loading directory...</td></tr>
                    ) : filteredInstructors.length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400">No instructors found.</td></tr>
                    ) : (
                      filteredInstructors.map((ins) => (
                        <tr key={ins.uuid} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-5 align-top">
                            <span className="font-mono text-xs text-slate-500">#{ins.uuid}</span>
                          </td>
                          <td className="px-6 py-5 align-top">
                            <span className="font-semibold text-slate-800 text-base">{ins.name}</span>
                          </td>
                          <td className="px-6 py-5 align-top">
                            <span className="inline-flex px-3 py-1 bg-indigo-50 text-indigo-700 font-medium text-xs rounded-md">
                              {ins.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-top">
                            {/* Vertical Date Scrollbar */}
                            <div className="max-h-24 overflow-y-auto pr-2 space-y-2 custom-scrollbar">
                              {ins.daily_feedbacks && ins.daily_feedbacks.length > 0 ? (
                                // Sort feedbacks by date descending
                                [...ins.daily_feedbacks].sort((a,b) => new Date(b.date) - new Date(a.date)).map((fb, idx) => {
                                  const isPass = fb.overall_status === 'COMPLIANT';
                                  const formattedDate = new Date(fb.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                  return (
                                    <div key={idx} className="flex items-center justify-between gap-4 py-1">
                                      <span className="text-slate-500 text-[13px]">{formattedDate}</span>
                                      <span className={`flex items-center gap-1.5 text-[13px] font-semibold ${isPass ? 'text-indigo-600' : 'text-red-600'}`}>
                                        {isPass ? <CheckCircle2 size={14} className="stroke-[2.5px]" /> : <AlertCircle size={14} className="stroke-[2.5px]" />}
                                        {isPass ? 'Pass' : 'Flagged'}
                                      </span>
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-slate-400 text-[13px] italic">No evaluations yet</span>
                              )}
                            </div>
                          </td>
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
            <div className="w-full xl:w-1/3">
              <EvaluateCard instructors={instructors} fetchInstructors={fetchInstructors} />
            </div>
          )}

        </div>
      </main>
      
      {/* Minimal custom scrollbar styles for the date list */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #cbd5e1;
        }
      `}} />
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
      setFile(null); // Reset
      if(fileInputRef.current) fileInputRef.current.value = '';
      fetchInstructors(); // Refresh table
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white border-2 border-[#e6d9fc] rounded-2xl p-6 shadow-sm relative overflow-hidden">
        {/* Subtle purple gradient accent border from mockup */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>

        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide leading-snug mb-6">
          Evaluate<br/>Grooming<br/>Standard
        </h3>

        {/* Drag & Drop Area */}
        <div 
          className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-100 hover:border-indigo-400 transition-colors group mb-6"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            className="hidden" 
            ref={fileInputRef} 
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
          />
          <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white mb-3 shadow-md group-hover:scale-110 transition-transform">
            <CloudUpload size={24} />
          </div>
          {file ? (
            <p className="text-sm font-semibold text-indigo-700">{file.name}</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-indigo-700 mb-1">upload image</p>
              <p className="text-xs text-slate-400 font-mono">Drag & drop or click<br/>to browse</p>
            </>
          )}
        </div>

        {/* Target Profile Dropdown */}
        <div className="mb-8">
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            Target Profile
          </label>
          <div className="flex gap-2">
            <select 
              value={selectedUuid}
              onChange={(e) => setSelectedUuid(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 bg-white p-2.5 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-sm appearance-none"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2364748b'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`, backgroundPosition: `right 0.75rem center`, backgroundRepeat: 'no-repeat', backgroundSize: '1rem' }}
            >
              <option value="">select new instructor</option>
              {instructors.map(ins => (
                <option key={ins.uuid} value={ins.uuid}>{ins.name}</option>
              ))}
            </select>
            <button 
              onClick={() => setShowModal(true)}
              className="w-10 h-10 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Add Instructor"
            >
              <Plus size={18} />
            </button>
          </div>
        </div>

        {/* Evaluate Button */}
        <button 
          onClick={handleEvaluate}
          disabled={loading}
          className="w-full bg-gradient-to-r from-indigo-600 to-purple-500 text-white py-3 rounded-lg font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-60 shadow-md shadow-indigo-200"
        >
          {loading ? 'Evaluating...' : 'Evaluate'}
          {!loading && <ArrowRight size={16} />}
        </button>
      </div>

      {/* Reused Add Instructor Modal */}
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

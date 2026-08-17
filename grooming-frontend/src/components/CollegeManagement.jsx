import React, { useState, useEffect } from 'react';
import { Plus, Building2, Search, Edit2, Trash2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000`;

export default function CollegeManagement() {
  const [colleges, setColleges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    location: ''
  });

  const fetchColleges = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nxtwave_token');
      const res = await fetch(`${API_BASE}/api/v2/colleges`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setColleges(data);
      }
    } catch (err) {
      console.error("Failed to fetch colleges", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchColleges();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('nxtwave_token');
      const url = isEditMode ? `${API_BASE}/api/v2/colleges/${editingId}` : `${API_BASE}/api/v2/colleges`;
      const res = await fetch(url, {
        method: isEditMode ? 'PUT' : 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        closeModal();
        fetchColleges();
      } else {
        const errorData = await res.json();
        let errorMsg = errorData.detail;
        if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        }
        alert(`Error: ${errorMsg}`);
      }
    } catch (err) {
      console.error("Failed to save college", err);
      alert("Failed to save college");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this college? This action cannot be undone.")) return;
    try {
      const token = localStorage.getItem('nxtwave_token');
      const res = await fetch(`${API_BASE}/api/v2/colleges/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchColleges();
      } else {
        const errorData = await res.json();
        alert(`Failed to delete college: ${errorData.detail}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ name: '', location: '' });
    setShowModal(true);
  };

  const openEditModal = (college) => {
    setIsEditMode(true);
    setEditingId(college._id);
    setFormData({
      name: college.name,
      location: college.location
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in duration-300">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Building2 size={24} className="text-indigo-600" />
            College Management
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage partner colleges and campuses</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
        >
          <Plus size={18} />
          Add New College
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">College ID</th>
                <th className="p-4">Name</th>
                <th className="p-4">Location</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400 font-medium">Loading colleges...</td>
                </tr>
              ) : colleges.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-slate-400 font-medium">No colleges found. Add one to get started.</td>
                </tr>
              ) : (
                colleges.map(college => (
                  <tr key={college._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 text-xs font-mono text-slate-400">{college._id}</td>
                    <td className="p-4 font-bold text-slate-800">{college.name}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{college.location}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(college)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(college._id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                <Building2 size={20} className="text-indigo-600" />
                {isEditMode ? 'Edit College' : 'Add New College'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors bg-white p-1 rounded-full border border-slate-200 shadow-sm">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdate} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">College Name</label>
                <input required placeholder="e.g. NxtWave Campus A" className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Location</label>
                <input required placeholder="e.g. Hyderabad" className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                  {isEditMode ? 'Save Changes' : 'Add College'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

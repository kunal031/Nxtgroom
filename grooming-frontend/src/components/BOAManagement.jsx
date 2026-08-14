import React, { useState, useEffect } from 'react';
import { Plus, Users, Search, Edit2, Trash2 } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8000`;

export default function BOAManagement() {
  const [boas, setBoas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    employee_id: '',
    email: '',
    password: '',
    college_id: ''
  });

  const fetchBOAs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('nxtwave_token');
      const res = await fetch(`${API_BASE}/api/v2/boas`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBoas(data);
      }
    } catch (err) {
      console.error("Failed to fetch BOAs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBOAs();
  }, []);

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('nxtwave_token');
      const url = isEditMode ? `${API_BASE}/api/v2/boas/${editingId}` : `${API_BASE}/api/v2/boas`;
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
        fetchBOAs();
      } else {
        const errorData = await res.json();
        let errorMsg = errorData.detail;
        if (Array.isArray(errorData.detail)) {
          errorMsg = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        }
        alert(`Error: ${errorMsg}`);
      }
    } catch (err) {
      console.error("Failed to save BOA", err);
      alert("Failed to save BOA");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this BOA? This action cannot be undone.")) return;
    try {
      const token = localStorage.getItem('nxtwave_token');
      const res = await fetch(`${API_BASE}/api/v2/boas/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchBOAs();
      } else {
        const errorData = await res.json();
        alert(`Failed to delete BOA: ${errorData.detail}`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openAddModal = () => {
    setIsEditMode(false);
    setEditingId(null);
    setFormData({ name: '', employee_id: '', email: '', password: '', college_id: '' });
    setShowModal(true);
  };

  const openEditModal = (boa) => {
    setIsEditMode(true);
    setEditingId(boa._id);
    setFormData({
      name: boa.name,
      employee_id: boa.employee_id,
      email: boa.email || '',
      password: '',
      college_id: boa.college_id || ''
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setIsEditMode(false);
    setEditingId(null);
  };

  return (
    <div className="w-full flex flex-col h-full">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users size={24} className="text-indigo-600" />
            Board of Administration
          </h2>
          <p className="text-sm text-slate-500 mt-1">Manage all BOA access and profiles.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200"
        >
          <Plus size={18} />
          Create New BOA
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4">Name</th>
                <th className="p-4">Employee ID</th>
                <th className="p-4">College ID</th>
                <th className="p-4">Registered Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">Loading BOAs...</td>
                </tr>
              ) : boas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-slate-400">No BOAs found.</td>
                </tr>
              ) : (
                boas.map(boa => (
                  <tr key={boa._id} className="hover:bg-slate-50 transition-colors group">
                    <td className="p-4 font-bold text-slate-800">{boa.name}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{boa.employee_id}</td>
                    <td className="p-4 text-sm font-medium text-slate-600">{boa.college_id}</td>
                    <td className="p-4 text-sm text-slate-500">
                      {new Date(boa.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(boa)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(boa._id)} className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors">
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
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-extrabold text-slate-800">
                {isEditMode ? 'Edit BOA' : 'Create New BOA'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 transition-colors">
                ✕
              </button>
            </div>
            
            <form onSubmit={handleCreateOrUpdate} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                <input required className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Employee ID</label>
                <input required className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <input required type="email" className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Password {isEditMode && <span className="text-slate-400 font-normal normal-case">(leave blank to keep current)</span>}</label>
                <input required={!isEditMode} type="password" placeholder={isEditMode ? "********" : ""} className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">College ID</label>
                <input required className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none" value={formData.college_id} onChange={e => setFormData({...formData, college_id: e.target.value})} />
              </div>

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={closeModal} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-200">
                  {isEditMode ? 'Save Changes' : 'Create BOA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from 'react';

const API_BASE = `http://${window.location.hostname}:8000`;

export default function AddInstructorModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({ employee_id: '', name: '', role: '', gender: 'MALE', college_id: 'temp-college-uuid' });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const token = localStorage.getItem('nxtwave_token');
      const res = await fetch(`${API_BASE}/api/v2/instructors`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
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
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md transform transition-all">
        <h2 className="text-lg md:text-xl font-bold mb-6 text-slate-800">Add New Target Profile</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Employee ID</label>
            <input required type="text" className="w-full rounded-lg border border-slate-200 p-2 md:p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" value={formData.employee_id} onChange={e => setFormData({...formData, employee_id: e.target.value})} placeholder="e.g. INS-001" />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</label>
            <input required type="text" className="w-full rounded-lg border border-slate-200 p-2 md:p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Sarah Jenkins" />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Role</label>
            <input required type="text" className="w-full rounded-lg border border-slate-200 p-2 md:p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} placeholder="e.g. Lead Instructor" />
          </div>
          <div>
            <label className="block text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Gender</label>
            <select className="w-full rounded-lg border border-slate-200 p-2 md:p-2.5 bg-slate-50 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
            </select>
          </div>
          <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose} className="px-4 md:px-5 py-2 text-slate-500 font-bold text-xs md:text-sm hover:bg-slate-50 rounded-lg">CANCEL</button>
            <button type="submit" disabled={saving} className="px-4 md:px-6 py-2 bg-indigo-600 text-white font-bold text-xs md:text-sm rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'SAVING...' : 'CREATE PROFILE'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

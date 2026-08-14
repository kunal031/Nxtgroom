import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000`;

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const res = await fetch(`${API_BASE}/api/v2/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || "Login failed");
      }
      
      localStorage.setItem('nxtwave_token', data.access_token);
      localStorage.setItem('nxtwave_role', data.role);
      onLogin(data.access_token, data.role);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 mb-4 flex items-center justify-center">
            <img src="/logo.png" alt="FacultyTrack Logo" className="w-full h-full object-contain drop-shadow-sm" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800">FacultyTrack</h2>
          <p className="text-sm font-medium text-slate-400 mt-1 uppercase tracking-widest">Management Suite</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm font-medium text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Email Username</label>
            <input 
              required 
              type="email" 
              className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all" 
              value={username} 
              onChange={e => setUsername(e.target.value)} 
              placeholder="admin@nxtwave.com" 
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Password</label>
            <input 
              required 
              type="password" 
              className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none text-sm transition-all" 
              value={password} 
              onChange={e => setPassword(e.target.value)} 
              placeholder="••••••••" 
            />
          </div>
          
          <div className="flex justify-end">
            <button type="button" className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors">
              Forgot Password?
            </button>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-[#8b5cf6] text-white py-3.5 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#7c3aed] transition-colors shadow-md shadow-indigo-200 disabled:opacity-70 mt-4"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={18} className="w-5 h-5" />}
          </button>
        </form>
        
      </div>
    </div>
  );
}

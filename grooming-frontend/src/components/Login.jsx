import React, { useState } from 'react';
import { ShieldCheck, ArrowRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000`;

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot Password State
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');

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

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');
    try {
      const res = await fetch(`${API_BASE}/api/v2/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to send OTP");
      setOtpSent(true);
      setForgotSuccess("OTP sent to your email.");
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    try {
      const res = await fetch(`${API_BASE}/api/v2/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp, new_password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Failed to reset password");
      setForgotSuccess("Password reset successfully. You can now log in.");
      setTimeout(() => {
        setShowForgot(false);
        setOtpSent(false);
        setForgotEmail('');
        setOtp('');
        setNewPassword('');
        setForgotSuccess('');
      }, 2000);
    } catch (err) {
      setForgotError(err.message);
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fc] p-4">
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-xl w-full max-w-md border border-slate-100">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 mb-4 flex items-center justify-center">
            <img src="/logo.png" alt="FacultyTrack Logo" className="w-full h-full object-contain drop-shadow-sm mix-blend-multiply" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">Faculty<span className="text-indigo-600">Track</span></h2>
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
            <button 
              type="button" 
              onClick={() => {
                setShowForgot(true);
                setForgotError('');
                setForgotSuccess('');
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
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

      {showForgot && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <h3 className="text-xl font-extrabold text-slate-800 mb-2">Reset Password</h3>
              <p className="text-sm text-slate-500 mb-6">
                {!otpSent ? "Enter your email to receive an OTP." : "Enter the OTP sent to your email and your new password."}
              </p>

              {forgotError && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-xl text-sm font-medium">{forgotError}</div>}
              {forgotSuccess && <div className="mb-4 p-3 bg-emerald-50 text-emerald-600 rounded-xl text-sm font-medium">{forgotSuccess}</div>}

              {!otpSent ? (
                <form onSubmit={handleSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
                    <input required type="email" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForgot(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">Cancel</button>
                    <button type="submit" disabled={forgotLoading} className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm disabled:opacity-70">
                      {forgotLoading ? 'Sending...' : 'Send OTP'}
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Email</label>
                    <input disabled type="email" value={forgotEmail} className="w-full rounded-xl border border-slate-200 p-3 bg-slate-100 text-slate-500 text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">6-Digit OTP</label>
                    <input required type="text" maxLength={6} value={otp} onChange={e => setOtp(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">New Password</label>
                    <input required type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full rounded-xl border border-slate-200 p-3 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setShowForgot(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl text-sm">Cancel</button>
                    <button type="submit" disabled={forgotLoading} className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm disabled:opacity-70">
                      {forgotLoading ? 'Resetting...' : 'Reset Password'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

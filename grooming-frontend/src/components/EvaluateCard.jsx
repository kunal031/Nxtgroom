import React, { useState } from 'react';
import { Camera, UploadCloud, RefreshCw, LogOut, MapPin } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000`;

export default function EvaluateCard({ instructors, fetchInstructors }) {
  const [selectedUuid, setSelectedUuid] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  React.useEffect(() => {
    const checkStatus = async () => {
      if (!selectedUuid) {
        setHasCheckedInToday(false);
        return;
      }
      try {
        const token = localStorage.getItem('nxtwave_token');
        const res = await fetch(`${API_BASE}/api/v2/attendance/today`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const exists = data.some(att => att.instructor_id === selectedUuid);
          setHasCheckedInToday(exists);
        }
      } catch (e) {
        console.error(e);
      }
    };
    checkStatus();
  }, [selectedUuid]);

  const getCoordinates = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(`${pos.coords.latitude},${pos.coords.longitude}`),
        (err) => resolve(null),
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  };

  const handleCheckIn = async () => {
    if (!selectedUuid || !file) {
      alert("Please select an instructor and upload an image.");
      return;
    }

    if (hasCheckedInToday) {
      if (!window.confirm("This instructor has already been evaluated today. Submitting again will overwrite the previous evaluation. Continue?")) {
        return;
      }
    }

    setLoading(true);
    setLocationStatus('Getting location...');
    const coords = await getCoordinates();
    setLocationStatus('');

    const formData = new FormData();
    formData.append('instructor_id', selectedUuid);
    formData.append('file', file);
    if (coords) formData.append('location_coordinates', coords);

    try {
      const token = localStorage.getItem('nxtwave_token');
      const res = await fetch(`${API_BASE}/api/v2/attendance/check-in`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });
      const data = await res.json();

      if (res.ok) {
        alert("Check-in successful! AI is processing in the background.");
        setFile(null);
        setPreview(null);
        setSelectedUuid('');
        fetchInstructors();
      } else {
        alert(`Check-in failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during check-in.");
    } finally {
      setLoading(false);
    }
  };

  const handleCheckOut = async () => {
    if (!selectedUuid) {
      alert("Please select an instructor to check out.");
      return;
    }

    setCheckoutLoading(true);
    try {
      const token = localStorage.getItem('nxtwave_token');
      const res = await fetch(`${API_BASE}/api/v2/attendance/check-out`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ instructor_id: selectedUuid }),
      });
      const data = await res.json();

      if (res.ok) {
        alert("Check-out successful!");
        setSelectedUuid('');
        fetchInstructors();
      } else {
        alert(`Check-out failed: ${data.detail || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred during check-out.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 md:p-8 flex flex-col h-full border border-slate-100 relative overflow-hidden group">
      
      {/* Decorative Blob */}
      <div className="absolute top-0 right-0 -mt-16 -mr-16 w-48 h-48 bg-indigo-50 rounded-full blur-3xl opacity-60 pointer-events-none group-hover:bg-indigo-100 transition-colors duration-700"></div>

      <div className="relative z-10">
        <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 mb-2 tracking-tight">Attendance Action</h2>
        <p className="text-slate-500 text-sm mb-6 font-medium">Select an instructor to check-in or check-out.</p>

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Instructor</label>
          <div className="relative">
            <select
              className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none appearance-none cursor-pointer transition-all hover:bg-slate-100"
              value={selectedUuid}
              onChange={(e) => setSelectedUuid(e.target.value)}
            >
              <option value="">-- Choose Instructor --</option>
              {instructors.map(ins => (
                <option key={ins._id} value={ins._id}>{ins.name} ({ins.employee_id})</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </div>
          </div>
          {hasCheckedInToday && (
            <p className="mt-2 text-xs font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
              ⚠️ This instructor has already checked in today. Submitting again will overwrite the previous evaluation.
            </p>
          )}
        </div>

        <div className="flex-1 flex flex-col mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Check-In Photo</label>
          <div 
            className="flex-1 min-h-[240px] border-3 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50 relative overflow-hidden transition-all hover:border-indigo-400 hover:bg-indigo-50/30 group/drop"
          >
            <input 
              type="file" 
              accept="image/*" 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              onChange={handleFileChange}
            />
            {preview ? (
              <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover object-top" />
            ) : (
              <div className="flex flex-col items-center text-slate-400 group-hover/drop:text-indigo-500 transition-colors p-6 text-center">
                <div className="w-16 h-16 rounded-2xl bg-white shadow-sm flex items-center justify-center mb-4 group-hover/drop:scale-110 transition-transform duration-300">
                  <Camera size={32} />
                </div>
                <p className="font-bold text-sm text-slate-600 mb-1">Upload Photo</p>
                <p className="text-xs font-medium px-4 leading-relaxed">Required for Check-In analysis.</p>
              </div>
            )}
          </div>
        </div>

        {locationStatus && <p className="text-xs text-indigo-600 font-bold mb-3 flex items-center gap-1"><MapPin size={12}/> {locationStatus}</p>}

        <div className="flex gap-4">
          <button 
            onClick={handleCheckIn}
            disabled={loading || checkoutLoading}
            className={`flex-1 rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              loading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-[#4554d3] text-white hover:bg-[#3944b3] shadow-lg shadow-indigo-200 hover:-translate-y-0.5'
            }`}
          >
            {loading ? <RefreshCw size={18} className="animate-spin" /> : <UploadCloud size={18} />}
            {loading ? 'Processing...' : 'Check-In'}
          </button>

          <button 
            onClick={handleCheckOut}
            disabled={loading || checkoutLoading}
            className={`flex-1 rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              checkoutLoading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200'
            }`}
          >
            {checkoutLoading ? <RefreshCw size={18} className="animate-spin" /> : <LogOut size={18} />}
            Check-Out
          </button>
        </div>
      </div>
    </div>
  );
}

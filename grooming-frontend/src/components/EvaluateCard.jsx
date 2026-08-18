import React, { useState, useEffect, useRef } from 'react';
import { Camera, UploadCloud, RefreshCw, LogOut, MapPin, Search, ChevronDown, Bell, CheckCircle2, X } from 'lucide-react';
import Webcam from 'react-webcam';

function InstructorCombobox({ instructors, selectedUuid, setSelectedUuid }) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const wrapperRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedInstructor = instructors.find(i => i._id === selectedUuid);
  
  useEffect(() => {
    if (selectedInstructor) {
      setQuery(`${selectedInstructor.name} (${selectedInstructor.employee_id})`);
    } else {
      setQuery(query); // retain query if typing
    }
  }, [selectedUuid, selectedInstructor]);

  const filtered = query === '' || (selectedInstructor && query === `${selectedInstructor.name} (${selectedInstructor.employee_id})`)
    ? instructors
    : instructors.filter(i => 
        (i.name || '').toLowerCase().includes(query.toLowerCase()) || 
        (i.employee_id || '').toLowerCase().includes(query.toLowerCase())
      );

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-4 pl-12 pr-12 text-sm font-medium text-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all placeholder:text-slate-400"
          placeholder="Search instructor by name or ID..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (selectedUuid) setSelectedUuid('');
          }}
          onFocus={() => setIsOpen(true)}
        />
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
        <button 
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1"
        >
          <ChevronDown className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} size={20} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="p-4 text-sm text-slate-500 text-center font-medium">No instructors found</div>
          ) : (
            <ul className="py-2">
              {filtered.map(ins => {
                const isSelected = selectedUuid === ins._id;
                return (
                  <li 
                    key={ins._id}
                    onClick={() => {
                      setSelectedUuid(ins._id);
                      setQuery(`${ins.name} (${ins.employee_id})`);
                      setIsOpen(false);
                    }}
                    className={`px-4 py-2.5 text-sm cursor-pointer transition-colors flex flex-col ${isSelected ? 'bg-indigo-50' : 'hover:bg-slate-50'}`}
                  >
                    <span className={`font-semibold ${isSelected ? 'text-indigo-700' : 'text-slate-700'}`}>{ins.name}</span>
                    <span className={`text-[11px] font-bold tracking-wider uppercase mt-0.5 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`}>{ins.employee_id}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

import EvaluationReportModal from './EvaluationReportModal';

const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:8000`;

export default function EvaluateCard({ 
  instructors, 
  fetchInstructors,
  setPollingJobs,
  unopenedReports,
  setViewingEvaluation
}) {
  const [selectedUuid, setSelectedUuid] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState('');
  const [hasCheckedInToday, setHasCheckedInToday] = useState(false);
  
  const [resetKey, setResetKey] = useState(0);
  
  const [showInbox, setShowInbox] = useState(false);

  const [captureMode, setCaptureMode] = useState('upload'); // 'upload' or 'camera'
  const webcamRef = useRef(null);

  const capturePhoto = React.useCallback(() => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        setPreview(imageSrc);
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const capturedFile = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            setFile(capturedFile);
          });
      }
    }
  }, [webcamRef]);

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
        const ins = instructors.find(i => i._id === selectedUuid);
        if (ins) {
          setPollingJobs(prev => [...prev, { 
            id: data.attendance_id, 
            instructorName: ins.name, 
            instructorRole: ins.instructor_role || 'Instructor' 
          }]);
        }
        
        setFile(null);
        setPreview(null);
        setSelectedUuid('');
        setResetKey(prev => prev + 1);
        setCaptureMode('upload');
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-2 gap-4 relative z-[60]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">Attendance Action</h2>
            <div className="relative">
              <button 
                onClick={() => setShowInbox(!showInbox)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors relative focus:outline-none"
              >
                <Bell size={18} />
                {unopenedReports.length > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-rose-500 border-2 border-[#f8f9fc] rounded-full"></span>
                )}
              </button>
              
              {showInbox && (
                <div className="absolute left-0 md:left-auto md:right-0 mt-2 w-72 bg-white rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                  <div className="p-4 border-b border-slate-100 font-bold text-slate-800 flex items-center justify-between bg-slate-50/50">
                    <span>Unopened Reports</span>
                    <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">{unopenedReports.length}</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {unopenedReports.length === 0 ? (
                      <div className="p-8 text-center text-sm font-medium text-slate-400">No unread reports.</div>
                    ) : (
                      <ul className="divide-y divide-slate-50">
                        {unopenedReports.map(report => (
                          <li 
                            key={report.id}
                            onClick={() => {
                              setViewingEvaluation(report);
                              setShowInbox(false);
                            }}
                            className="p-4 hover:bg-slate-50 cursor-pointer transition-colors"
                          >
                            <p className="text-sm font-bold text-slate-700">{report.instructorName}</p>
                            <p className="text-xs font-semibold text-emerald-500 mt-1 flex items-center gap-1">
                              <CheckCircle2 size={12} /> Evaluation Ready
                            </p>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <p className="text-slate-500 text-sm mb-6 font-medium">Select an instructor to check-in or check-out.</p>

        <div className="mb-6">
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Select Instructor</label>
          <div className="relative z-[50]">
            <InstructorCombobox 
              key={resetKey}
              instructors={instructors} 
              selectedUuid={selectedUuid} 
              setSelectedUuid={setSelectedUuid} 
            />
          </div>
          {hasCheckedInToday && (
            <p className="mt-2 text-xs font-bold text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100">
              ⚠️ This instructor has already checked in today. Submitting again will overwrite the previous evaluation.
            </p>
          )}
        </div>

        <div className="flex-1 flex flex-col mb-6">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">Check-In Photo</label>
            <div className="flex bg-slate-100 p-1 rounded-xl w-fit">
              <button
                onClick={(e) => { e.preventDefault(); setCaptureMode('upload'); setPreview(null); setFile(null); }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${captureMode === 'upload' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Upload
              </button>
              <button
                onClick={(e) => { e.preventDefault(); setCaptureMode('camera'); setPreview(null); setFile(null); }}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${captureMode === 'camera' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                Camera
              </button>
            </div>
          </div>
          
          {captureMode === 'camera' ? (
            <div className="flex-1 min-h-[240px] rounded-3xl flex flex-col items-center justify-center bg-black relative overflow-hidden group/drop shadow-inner">
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-cover object-center" />
                  <button onClick={(e) => { e.preventDefault(); setPreview(null); setFile(null); }} className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-rose-500 transition-colors backdrop-blur-md z-20">
                    <X size={16} />
                  </button>
                </>
              ) : (
                <>
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    videoConstraints={{ facingMode: "environment" }}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4 z-20">
                    <button 
                      onClick={(e) => { e.preventDefault(); capturePhoto(); }}
                      className="w-16 h-16 rounded-full bg-white/20 border-4 border-white flex items-center justify-center hover:bg-white/40 transition-colors backdrop-blur-md focus:outline-none"
                    >
                      <div className="w-12 h-12 rounded-full bg-white shadow-lg pointer-events-none"></div>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <div 
              className="flex-1 min-h-[240px] border-3 border-dashed border-slate-200 rounded-3xl flex flex-col items-center justify-center bg-slate-50/50 relative overflow-hidden transition-all hover:border-indigo-400 hover:bg-indigo-50/30 group/drop"
            >
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                onChange={handleFileChange}
              />
              {preview ? (
                <>
                  <img src={preview} alt="Preview" className="absolute inset-0 w-full h-full object-contain object-center" />
                  <button onClick={(e) => { e.preventDefault(); setPreview(null); setFile(null); }} className="absolute top-4 right-4 bg-slate-800/80 text-white p-2 rounded-full hover:bg-rose-500 transition-colors backdrop-blur-md z-20">
                    <X size={16} />
                  </button>
                </>
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
          )}
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

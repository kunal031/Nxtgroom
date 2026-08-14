import React, { useState, useEffect } from 'react';
import { ArrowLeft, User, MapPin, Clock, Calendar, CheckCircle2, XCircle } from 'lucide-react';

const API_BASE = `http://${window.location.hostname}:8000`;

const locationCache = {};
function LocationName({ coords }) {
  const [name, setName] = useState('Loading...');

  useEffect(() => {
    if (!coords) return;
    if (locationCache[coords]) {
      setName(locationCache[coords]);
      return;
    }
    const [lat, lon] = coords.split(',').map(s => s.trim());
    if (!lat || !lon) {
      setName(coords);
      return;
    }
    fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`)
      .then(r => r.json())
      .then(data => {
        const locName = data.address?.city || data.address?.town || data.address?.suburb || data.display_name?.split(',')[0] || coords;
        locationCache[coords] = locName;
        setName(locName);
      })
      .catch(() => setName(coords));
  }, [coords]);

  return <span className="font-semibold text-indigo-600">{name}</span>;
}

export default function InstructorDetail({ record, onBack }) {
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!record) return;
    const fetchEval = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('nxtwave_token');
        const res = await fetch(`${API_BASE}/api/v2/attendance/${record._id}/evaluation`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setEvaluation(data);
        }
      } catch (e) {
        console.error("Failed to fetch evaluation", e);
      } finally {
        setLoading(false);
      }
    };
    fetchEval();
  }, [record]);

  if (!record) {
    onBack();
    return null;
  }

  const formatTime = (isoString) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (isoString) => {
    if (!isoString) return '--';
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    if (status === 'done') return <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-50 text-emerald-600 border border-emerald-200"><CheckCircle2 size={16} /> Compliant</span>;
    if (status === 'fail') return <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold bg-rose-50 text-rose-600 border border-rose-200"><XCircle size={16} /> Failed</span>;
    return <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold bg-amber-50 text-amber-600 border border-amber-200"><Clock size={16} /> Pending AI</span>;
  };

  const renderDictionarySection = (title, items) => {
    if (!items || items.length === 0) return null;
    return (
      <div className="mb-8">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 border-b border-slate-100 pb-2">{title}</h4>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-100">
              {Array.isArray(items) ? items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-700 w-1/3 bg-slate-50/50 border-r border-slate-100">{item.checkpoint_name}</td>
                  <td className="p-4 text-slate-600">{item.observation}</td>
                </tr>
              )) : Object.entries(items).map(([key, value]) => (
                <tr key={key} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-bold text-slate-700 w-1/3 bg-slate-50/50 border-r border-slate-100">{key}</td>
                  <td className="p-4 text-slate-600">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full flex flex-col h-full animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="flex items-center gap-4 mb-6 shrink-0">
        <button 
          onClick={onBack}
          className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-extrabold text-slate-800">Instructor Detail View</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-1 min-h-0 overflow-hidden">
        
        {/* Left Column: Instructor Details */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6 overflow-y-auto pb-6 pr-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col items-center text-center shrink-0">
            <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-5">
              <User size={48} />
            </div>
            <h3 className="text-2xl font-extrabold text-slate-800">{record.instructor_name}</h3>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1.5 mb-5">{record.instructor_role}</p>
            {getStatusBadge(record.status)}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 shrink-0">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3">Session Details</h4>
            
            <div className="flex items-start gap-4">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
                <Calendar size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Date</p>
                <p className="text-sm font-semibold text-slate-700">{formatDate(record.date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Check-In Time</p>
                <p className="text-sm font-semibold text-slate-700">{formatTime(record.check_in_time)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
                <Clock size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Check-Out Time</p>
                <p className="text-sm font-semibold text-slate-700">{formatTime(record.check_out_time)}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="bg-slate-50 p-2 rounded-lg text-slate-400">
                <MapPin size={18} />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Location</p>
                {record.location_coordinates ? <LocationName coords={record.location_coordinates} /> : <p className="text-sm font-semibold text-slate-700">--</p>}
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 shrink-0">
            <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 mb-4">AI Remarks Summary</h4>
            <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              {record.remarks || 'No remarks available.'}
            </p>
          </div>
        </div>

        {/* Right Column: AI JSON Report */}
        <div className="w-full lg:w-2/3 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 overflow-y-auto flex flex-col mb-6">
          <h3 className="text-lg font-extrabold text-slate-800 mb-6 border-b border-slate-100 pb-4">Detailed Grooming Audit Report</h3>
          
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 gap-4">
              <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
              <p className="text-sm font-medium">Fetching detailed evaluation...</p>
            </div>
          ) : !evaluation ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 font-medium bg-slate-50 rounded-xl border border-dashed border-slate-200 p-8 text-center gap-2">
              <XCircle size={32} className="text-slate-300" />
              <p>No detailed evaluation report found for this session.</p>
              <p className="text-xs text-slate-400 font-normal">If the AI analysis failed (e.g., missing API key or invalid image), the detailed report won't be generated. Check the "AI Remarks Summary" on the left for errors.</p>
            </div>
          ) : (
            <div className="flex-1 pb-4">
              {renderDictionarySection("General ID Card Check", evaluation.general_idcard_check)}
              {renderDictionarySection("Grooming Check", evaluation.grooming_check)}
              {renderDictionarySection("Attire Check", evaluation.attire_check)}
              {renderDictionarySection("Accessories Check", evaluation.accessories_check)}
              {renderDictionarySection("Footwear Check", evaluation.footwear_check)}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

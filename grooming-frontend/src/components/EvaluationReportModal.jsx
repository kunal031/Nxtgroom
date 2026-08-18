import React from 'react';
import { X, User, CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function EvaluationReportModal({ evaluation, instructorName, instructorRole, onClose }) {
  if (!evaluation) return null;

  const getStatusBadge = (status) => {
    if (status === 'done' || status === 'COMPLIANT') return <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold bg-emerald-50 text-emerald-600 border border-emerald-200"><CheckCircle2 size={16} /> good </span>;
    if (status === 'fail' || status === 'failed' || status === 'error' || status === 'NON_COMPLIANT') return <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold bg-rose-50 text-rose-600 border border-rose-200"><CheckCircle2 size={16} /> average </span>;
    return <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold bg-amber-50 text-amber-600 border border-amber-200"><Clock size={16} /> Pending</span>;
  };

  const renderDictionarySection = (title, items) => {
    if (!items || (Array.isArray(items) && items.length === 0) || Object.keys(items).length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 border-b border-slate-100 pb-2">{title}</h4>
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <tbody className="divide-y divide-slate-100">
              {Array.isArray(items) ? items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-700 w-1/3 bg-slate-50/50 border-r border-slate-100">{item.checkpoint_name}</td>
                  <td className="p-3 text-slate-600">{item.observation}</td>
                </tr>
              )) : Object.entries(items).map(([key, value]) => (
                <tr key={key} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-bold text-slate-700 w-1/3 bg-slate-50/50 border-r border-slate-100">{key}</td>
                  <td className="p-3 text-slate-600">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#f8f9fc] rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xl font-extrabold text-slate-800">Evaluation Complete</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-600 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row gap-6 p-6 overflow-y-auto">
          {/* Left Column: Basic Info */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                <User size={40} />
              </div>
              <h3 className="text-xl font-extrabold text-slate-800">{instructorName || 'Unknown Instructor'}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1 mb-4">{instructorRole || 'Instructor'}</p>
              
              <div className="flex flex-wrap items-center justify-center gap-2">
                {getStatusBadge(evaluation.overall_status)}
                {evaluation.attire_type && evaluation.attire_type !== "Unknown" && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold bg-indigo-50 text-indigo-600 border border-indigo-200">
                   {evaluation.attire_type}
                  </span>
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h4 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">AI Summary</h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 italic">
                "{evaluation.ai_summary || 'No summary provided.'}"
              </p>
            </div>
          </div>

          {/* Right Column: Detailed Checkpoints */}
          <div className="w-full lg:w-2/3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 h-full">
              <h3 className="text-lg font-extrabold text-slate-800 mb-6">Detailed Grooming Report</h3>
              {renderDictionarySection('General & ID Card Check', evaluation.general_idcard_check)}
              {renderDictionarySection('Grooming Check', evaluation.grooming_check)}
              {renderDictionarySection('Attire Check', evaluation.attire_check)}
              {renderDictionarySection('Accessories Check', evaluation.accessories_check)}
              {renderDictionarySection('Footwear Check', evaluation.footwear_check)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

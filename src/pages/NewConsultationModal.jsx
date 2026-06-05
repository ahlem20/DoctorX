import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X, HeartPulse, Thermometer, Droplets, Activity, Weight,
  FlaskConical, Radio, Plus, Trash2, ChevronRight, ChevronLeft,
  Save, Clock, Stethoscope, FileText, CheckCircle2, AlertTriangle, Loader2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import api from '../api';
import { useTranslation } from 'react-i18next';

const STEPS = [
  { id: 1, label: 'newCons.step.vitals', icon: HeartPulse },
  { id: 2, label: 'newCons.step.cons', icon: Stethoscope },
  { id: 3, label: 'newCons.step.analyses', icon: FlaskConical },
  { id: 4, label: 'newCons.step.summary', icon: CheckCircle2 },
];

export default function NewConsultationModal({ isOpen, onClose, patient, onSuccess }) {
  const { t, i18n } = useTranslation('group1');
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [catalogAnalyses, setCatalogAnalyses] = useState([]);
  const [catalogRadios, setCatalogRadios] = useState([]);
  const [duration, setDuration] = useState(0);
  const [pastConsultations, setPastConsultations] = useState([]);

  // Step 1 — Vitals
  const [vitals, setVitals] = useState({
    heartRate: '', bpSystolic: '', bpDiastolic: '',
    temperature: '', spo2: '', bloodSugar: '', weight: '', height: '',
  });

  // Step 2 — Consultation
  const [consultation, setConsultation] = useState({
    complaint: '', symptoms: '', diagnosis: '',
    subjective: '', objective: '', assessment: '', plan: '',
  });

  // Step 3 — Analyses & Radios
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [selectedRadios, setSelectedRadios] = useState([]);

  const bmi = vitals.weight && vitals.height
    ? (parseFloat(vitals.weight) / Math.pow(parseFloat(vitals.height) / 100, 2)).toFixed(1)
    : null;

  // Timer
  useEffect(() => {
    if (!isOpen) { setDuration(0); return; }
    const t = setInterval(() => setDuration(d => d + 1), 1000);
    return () => clearInterval(t);
  }, [isOpen]);

  // Fetch catalogs
  useEffect(() => {
    if (!isOpen || !patient) return;
    api.get('/catalog/analyses').then(r => setCatalogAnalyses(r.data)).catch(() => {});
    api.get('/catalog/radios').then(r => setCatalogRadios(r.data)).catch(() => {});
    api.get(`/consultation/${patient._id}/consultations`).then(r => setPastConsultations(r.data)).catch(() => {});
    setStep(1);
    setVitals({ heartRate: '', bpSystolic: '', bpDiastolic: '', temperature: '', spo2: '', bloodSugar: '', weight: '', height: '' });
    setConsultation({ complaint: '', symptoms: '', diagnosis: '', subjective: '', objective: '', assessment: '', plan: '' });
    setSelectedAnalyses([]);
    setSelectedRadios([]);
  }, [isOpen]);

  const formatDuration = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const addAnalysis = (item) => {
    if (selectedAnalyses.find(a => a.catalogId === item._id)) return;
    setSelectedAnalyses(prev => [...prev, { catalogId: item._id, name: item.name, result: '', unit: item.unit || '', status: 'En attente', refMin: item.refMin, refMax: item.refMax }]);
  };

  const addRadio = (item) => {
    if (selectedRadios.find(r => r.catalogId === item._id)) return;
    setSelectedRadios(prev => [...prev, { catalogId: item._id, name: item.name, notes: '', bodyRegion: item.bodyRegion || '' }]);
  };

  const updateAnalysis = (idx, field, value) => {
    setSelectedAnalyses(prev => prev.map((a, i) => {
      if (i !== idx) return a;
      const updated = { ...a, [field]: value };
      if (field === 'result' && updated.refMin !== undefined && updated.refMax !== undefined) {
        const num = parseFloat(value);
        updated.status = isNaN(num) ? 'En attente' : (num < updated.refMin || num > updated.refMax) ? 'Anormal' : 'Normal';
      }
      return updated;
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(`/consultation/${patient._id}/consultations`, {
        vitals: { ...vitals, bmi },
        consultation,
        analyses: selectedAnalyses,
        radios: selectedRadios,
        duration,
      });
      onSuccess?.();
      onClose();
    } catch (e) {
      alert(t('newCons.errSave'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConsultation = async (consultationId) => {
    if (window.confirm(t('newCons.confirmDelete'))) {
      try {
        await api.delete(`/consultation/${consultationId}`);
        setPastConsultations(prev => prev.filter(c => c._id !== consultationId));
      } catch (error) {
        console.error("Erreur lors de la suppression", error);
        alert(t('newCons.errorDelete'));
      }
    }
  };

  if (!isOpen || !patient) return null;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col max-h-[95vh] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-7 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-400/10 border border-teal-400/20 rounded-xl">
              <Stethoscope className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-white">{t('newCons.title')}</h2>
              <p className="text-[11px] text-slate-400 font-medium">{patient.fullName} · {patient.age} {t('appointments.modal.yearsOld')}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 bg-slate-800/60 px-3 py-1.5 rounded-xl border border-slate-700/40">
              <Clock className="h-3.5 w-3.5 text-teal-400" />
              <span className="text-xs font-bold text-white font-mono">{formatDuration(duration)}</span>
            </div>
            <button onClick={onClose} className="p-2 bg-slate-800/60 rounded-xl text-slate-400 hover:text-white border border-slate-700/40 transition">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left: Form Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Step Indicator */}
            <div className="flex items-center px-7 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
              {STEPS.map((s, i) => (
                <div key={s.id} className="flex items-center flex-1">
                  <button
                    onClick={() => setStep(s.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                      step === s.id
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                        : step > s.id
                        ? 'text-teal-600 bg-teal-50 border border-teal-100'
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <s.icon className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">{t(s.label)}</span>
                    <span className="sm:hidden">{s.id}</span>
                  </button>
                  {i < STEPS.length - 1 && (i18n.language === 'ar' ? <ChevronLeft className="h-3.5 w-3.5 text-slate-300 mx-1 flex-1" /> : <ChevronRight className="h-3.5 w-3.5 text-slate-300 mx-1 flex-1" />)}
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-7">

              {/* STEP 1 — Vitals */}
          {step === 1 && (
            <div className="space-y-6">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('newCons.step.vitals')}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { key: 'heartRate', label: 'newCons.vit.hr', unit: 'bpm', icon: HeartPulse, color: 'text-rose-500', bg: 'bg-rose-50 border-rose-100', placeholder: '72' },
                  { key: 'temperature', label: 'newCons.vit.temp', unit: '°C', icon: Thermometer, color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100', placeholder: '37.0' },
                  { key: 'spo2', label: 'SpO2', unit: '%', icon: Activity, color: 'text-blue-500', bg: 'bg-blue-50 border-blue-100', placeholder: '98' },
                  { key: 'bloodSugar', label: 'newCons.vit.bg', unit: 'g/L', icon: Droplets, color: 'text-purple-500', bg: 'bg-purple-50 border-purple-100', placeholder: '1.0' },
                  { key: 'weight', label: 'newCons.vit.weight', unit: 'kg', icon: Weight, color: 'text-teal-500', bg: 'bg-teal-50 border-teal-100', placeholder: '70' },
                  { key: 'height', label: 'newCons.vit.height', unit: 'cm', icon: Activity, color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-100', placeholder: '170' },
                ].map(f => (
                  <div key={f.key} className={`p-4 rounded-2xl border ${f.bg} space-y-2`}>
                    <div className="flex items-center gap-1.5">
                      <f.icon className={`h-3.5 w-3.5 ${f.color}`} />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t(f.label)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        placeholder={f.placeholder}
                        value={vitals[f.key]}
                        onChange={e => setVitals(v => ({ ...v, [f.key]: e.target.value }))}
                        className="flex-1 bg-white/70 border border-white/80 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 w-full"
                      />
                      <span className="text-[10px] font-bold text-slate-400 shrink-0">{f.unit}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Blood Pressure */}
              <div className="p-4 rounded-2xl border bg-rose-50 border-rose-100 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Activity className="h-3.5 w-3.5 text-rose-500" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('newCons.vit.bp')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="number" placeholder="120" value={vitals.bpSystolic} onChange={e => setVitals(v => ({ ...v, bpSystolic: e.target.value }))} className="w-full bg-white/70 border border-white/80 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  <span className="text-slate-400 font-bold">/</span>
                  <input type="number" placeholder="80" value={vitals.bpDiastolic} onChange={e => setVitals(v => ({ ...v, bpDiastolic: e.target.value }))} className="w-full bg-white/70 border border-white/80 rounded-xl px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400" />
                  <span className="text-[10px] font-bold text-slate-400 shrink-0">mmHg</span>
                </div>
              </div>

              {/* BMI */}
              {bmi && (
                <div className={`flex items-center gap-3 p-4 rounded-2xl border ${parseFloat(bmi) < 18.5 || parseFloat(bmi) > 30 ? 'bg-amber-50 border-amber-100' : 'bg-teal-50 border-teal-100'}`}>
                  <AlertTriangle className={`h-4 w-4 ${parseFloat(bmi) < 18.5 || parseFloat(bmi) > 30 ? 'text-amber-500' : 'text-teal-500'}`} />
                  <span className="text-sm font-extrabold text-slate-700">{t('newCons.vit.bmiCalc')}<span className="text-indigo-600">{bmi}</span></span>
                  <span className="text-[10px] text-slate-400 font-medium">
                    {parseFloat(bmi) < 18.5 ? t('newCons.vit.underweight') : parseFloat(bmi) < 25 ? t('newCons.vit.normalWeight') : parseFloat(bmi) < 30 ? t('newCons.vit.overweight') : t('newCons.vit.obese')}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 2 — Consultation */}
          {step === 2 && (
            <div className="space-y-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('newCons.cons.details')}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('newCons.cons.reason')}</label>
                  <input value={consultation.complaint} onChange={e => setConsultation(c => ({ ...c, complaint: e.target.value }))} placeholder={t('newCons.cons.reasonPlaceholder')} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50/50" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('newCons.cons.diag')}</label>
                  <input value={consultation.diagnosis} onChange={e => setConsultation(c => ({ ...c, diagnosis: e.target.value }))} placeholder={t('newCons.cons.diagPlaceholder')} className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50/50" />
                </div>
              </div>

              {/* SOAP Notes */}
              <div className="rounded-2xl border border-slate-200 overflow-hidden">
                <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('newCons.cons.soap')}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
                  {[
                    { key: 'subjective', label: 'newCons.cons.soapS', placeholder: 'newCons.cons.soapSPlaceholder', color: 'bg-indigo-50/30' },
                    { key: 'objective', label: 'newCons.cons.soapO', placeholder: 'newCons.cons.soapOPlaceholder', color: 'bg-teal-50/30' },
                    { key: 'assessment', label: 'newCons.cons.soapA', placeholder: 'newCons.cons.soapAPlaceholder', color: 'bg-amber-50/30' },
                    { key: 'plan', label: 'newCons.cons.soapP', placeholder: 'newCons.cons.soapPPlaceholder', color: 'bg-rose-50/30' },
                  ].map(f => (
                    <div key={f.key} className={`p-4 ${f.color} space-y-1.5`}>
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t(f.label)}</label>
                      <textarea
                        rows={3}
                        placeholder={t(f.placeholder)}
                        value={consultation[f.key]}
                        onChange={e => setConsultation(c => ({ ...c, [f.key]: e.target.value }))}
                        className="w-full bg-white/70 border border-white/80 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3 — Analyses & Radios */}
          {step === 3 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

              {/* Analyses */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5 text-purple-500" /> {t('newCons.ana.title')}</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {catalogAnalyses.length === 0
                    ? <p className="text-xs text-slate-400 italic">{t('newCons.ana.empty')}</p>
                    : catalogAnalyses.map(item => (
                      <button key={item._id} onClick={() => addAnalysis(item)} className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:border-purple-400 hover:bg-purple-50 transition text-xs font-semibold text-slate-700 group">
                        <span>{item.name}</span>
                        <Plus className="h-3.5 w-3.5 text-slate-300 group-hover:text-purple-500" />
                      </button>
                    ))}
                </div>
                <div className="space-y-2">
                  {selectedAnalyses.map((a, i) => (
                    <div key={i} className="p-3 rounded-2xl border border-purple-100 bg-purple-50/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{a.name}</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${a.status === 'Normal' ? 'bg-teal-50 text-teal-600 border-teal-100' : a.status === 'Anormal' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                            {a.status === 'Normal' ? t('newCons.status.normal') : a.status === 'Anormal' ? t('newCons.status.abnormal') : t('newCons.status.pending')}
                          </span>
                          <button onClick={() => setSelectedAnalyses(p => p.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5 text-slate-300 hover:text-rose-500" /></button>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="text" placeholder={t('newCons.ana.res')} value={a.result} onChange={e => updateAnalysis(i, 'result', e.target.value)} className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-purple-400" />
                        <span className="text-[10px] text-slate-400 font-bold">{a.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Radios */}
              <div className="space-y-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5"><Radio className="h-3.5 w-3.5 text-indigo-500" /> {t('newCons.rad.title')}</p>
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {catalogRadios.length === 0
                    ? <p className="text-xs text-slate-400 italic">{t('newCons.rad.empty')}</p>
                    : catalogRadios.map(item => (
                      <button key={item._id} onClick={() => addRadio(item)} className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50 transition text-xs font-semibold text-slate-700 group">
                        <span>{item.name}</span>
                        <Plus className="h-3.5 w-3.5 text-slate-300 group-hover:text-indigo-500" />
                      </button>
                    ))}
                </div>
                <div className="space-y-2">
                  {selectedRadios.map((r, i) => (
                    <div key={i} className="p-3 rounded-2xl border border-indigo-100 bg-indigo-50/40 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700">{r.name}</span>
                        <button onClick={() => setSelectedRadios(p => p.filter((_, idx) => idx !== i))}><Trash2 className="h-3.5 w-3.5 text-slate-300 hover:text-rose-500" /></button>
                      </div>
                      <textarea rows={2} placeholder={t('newCons.rad.notesPlaceholder')} value={r.notes} onChange={e => setSelectedRadios(p => p.map((x, idx) => idx === i ? { ...x, notes: e.target.value } : x))} className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400 resize-none" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 — Summary */}
          {step === 4 && (
            <div className="space-y-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('newCons.sum.title')}</p>

              {/* Vitals Summary */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><HeartPulse className="h-3.5 w-3.5 text-rose-500" /> {t('newCons.step.vitals')}</p>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[
                    { label: t('newCons.vit.hrAbbr'), value: vitals.heartRate, unit: 'bpm' },
                    { label: t('newCons.vit.bpAbbr'), value: vitals.bpSystolic && vitals.bpDiastolic ? `${vitals.bpSystolic}/${vitals.bpDiastolic}` : '', unit: 'mmHg' },
                    { label: t('newCons.vit.tempAbbr'), value: vitals.temperature, unit: '°C' },
                    { label: t('newCons.vit.spo2Abbr'), value: vitals.spo2, unit: '%' },
                    { label: t('newCons.vit.bgAbbr'), value: vitals.bloodSugar, unit: 'g/L' },
                    { label: t('newCons.vit.weightAbbr'), value: vitals.weight, unit: 'kg' },
                    { label: t('newCons.vit.heightAbbr'), value: vitals.height, unit: 'cm' },
                    { label: t('newCons.vit.bmiAbbr'), value: bmi, unit: '' },
                  ].filter(v => v.value).map((v, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-100 p-2 text-center">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{v.label}</p>
                      <p className="text-sm font-extrabold text-slate-800">{v.value} <span className="text-[9px] font-normal text-slate-400">{v.unit}</span></p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Diagnosis */}
              {consultation.diagnosis && (
                <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">{t('newCons.cons.diag')}</p>
                  <p className="text-sm font-bold text-slate-800">{consultation.diagnosis}</p>
                </div>
              )}

              {/* Analyses */}
              {selectedAnalyses.length > 0 && (
                <div className="p-4 rounded-2xl border border-purple-100 bg-purple-50/30 space-y-2">
                  <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider flex items-center gap-1"><FlaskConical className="h-3 w-3" /> {t('newCons.ana.title')} ({selectedAnalyses.length})</p>
                  {selectedAnalyses.map((a, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{a.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{a.result} {a.unit}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${a.status === 'Normal' ? 'bg-teal-100 text-teal-700' : a.status === 'Anormal' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                          {a.status === 'Normal' ? t('newCons.status.normal') : a.status === 'Anormal' ? t('newCons.status.abnormal') : t('newCons.status.pending')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Radios */}
              {selectedRadios.length > 0 && (
                <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/30 space-y-2">
                  <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1"><Radio className="h-3 w-3" /> {t('newCons.rad.title')} ({selectedRadios.length})</p>
                  {selectedRadios.map((r, i) => (
                    <div key={i} className="text-xs">
                      <span className="font-bold text-slate-700">{r.name}</span>
                      {r.notes && <p className="text-slate-400 mt-0.5 italic">{r.notes}</p>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2 p-3 rounded-xl bg-teal-50 border border-teal-100">
                <Clock className="h-3.5 w-3.5 text-teal-500" />
                <span className="text-xs font-bold text-teal-700">{t('newCons.sum.duration')}{formatDuration(duration)}</span>
              </div>
            </div>
          )}
        </div>
            
        {/* Footer */}
        <div className="px-7 py-4 border-t border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
              <Button variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : onClose()} className="gap-2 text-xs font-bold rounded-xl">
                {i18n.language === 'ar' ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />} {step === 1 ? t('newCons.btn.cancel') : t('newCons.btn.prev')}
              </Button>
              {step < 4
                ? <Button onClick={() => setStep(s => s + 1)} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 text-xs font-bold rounded-xl shadow-sm">
                    {t('newCons.btn.next')} {i18n.language === 'ar' ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </Button>
                : <Button onClick={handleSave} disabled={saving} className="bg-teal-600 hover:bg-teal-700 text-white gap-2 text-xs font-bold rounded-xl shadow-sm">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    {saving ? t('newCons.btn.saving') : t('newCons.btn.closeCons')}
                  </Button>
              }
            </div>
          </div>

          {/* Right: History Sidebar */}
          <div className="hidden md:flex w-80 lg:w-96 ltr:border-l rtl:border-r border-slate-100 bg-slate-50/50 flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-100 bg-white shrink-0 flex items-center justify-between">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-400" /> {t('newCons.pastSummaries')}
              </h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{pastConsultations.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {pastConsultations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                  <Stethoscope className="h-8 w-8 text-slate-200" />
                  <p className="text-xs italic text-center">{t('newCons.noPastConsultations')}</p>
                </div>
              ) : (
                [...pastConsultations]
                  .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                  .map(c => (
                    <div key={c._id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:border-indigo-200 transition-colors space-y-3">
                      <div className="flex justify-between items-center border-b border-slate-50 pb-2">
                        <span className="text-[10px] font-extrabold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                          {new Date(c.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {formatDuration(c.duration)}
                          </span>
                          <button 
                            onClick={() => handleDeleteConsultation(c._id)}
                            className="p-1 hover:bg-rose-100 rounded-md text-slate-300 hover:text-rose-500 transition-colors"
                            title={t('newCons.deleteTooltip')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      {c.diagnosis && (
                        <div>
                          <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">{t('newCons.mainDiagnosis')}</span>
                          <p className="text-xs font-bold text-slate-700 leading-snug">{c.diagnosis}</p>
                        </div>
                      )}
                      {c.complaint && (
                        <div>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{t('newCons.complaint')}</span>
                          <p className="text-xs text-slate-600 leading-snug">{c.complaint}</p>
                        </div>
                      )}
                      {(c.subjective || c.objective || c.assessment || c.plan) && (
                        <div className="text-[10px] space-y-1.5 mt-2 p-2.5 bg-slate-50/80 rounded-xl border border-slate-100">
                          {c.subjective && <p><span className="font-extrabold text-indigo-500 w-4 inline-block">S:</span> <span className="text-slate-600">{c.subjective}</span></p>}
                          {c.objective && <p><span className="font-extrabold text-teal-500 w-4 inline-block">O:</span> <span className="text-slate-600">{c.objective}</span></p>}
                          {c.assessment && <p><span className="font-extrabold text-amber-500 w-4 inline-block">A:</span> <span className="text-slate-600">{c.assessment}</span></p>}
                          {c.plan && <p><span className="font-extrabold text-rose-500 w-4 inline-block">P:</span> <span className="text-slate-600">{c.plan}</span></p>}
                        </div>
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
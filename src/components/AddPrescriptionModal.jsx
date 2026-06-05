import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Plus, Trash2, FlaskConical, Radio as RadioIcon, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function AddPrescriptionModal({ isOpen, onClose, onSuccess, patient: initialPatient }) {
  const { t, i18n } = useTranslation('group2');
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [activeTab, setActiveTab] = useState('analyses'); // 'analyses' or 'radios'
  
  // Catalogs
  const [catalogAnalyses, setCatalogAnalyses] = useState([]);
  const [catalogRadios, setCatalogRadios] = useState([]);
  
  // Selected Exams
  const [selectedAnalyses, setSelectedAnalyses] = useState([]);
  const [selectedRadios, setSelectedRadios] = useState([]);
  
  // Custom inputs
  const [customAnalysis, setCustomAnalysis] = useState('');
  const [customRadio, setCustomRadio] = useState('');
  
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          if (!initialPatient) {
            const { data } = await api.get('/patients');
            setPatients(data);
            if (data.length > 0) setPatientId(data[0]._id);
          } else {
            setPatientId(initialPatient._id);
          }
          
          const [anaRes, radRes] = await Promise.all([
            api.get('/catalog/analyses'),
            api.get('/catalog/radios')
          ]);
          setCatalogAnalyses(anaRes.data);
          setCatalogRadios(radRes.data);
        } catch (error) {
          console.error('Failed to fetch modal data', error);
        }
      };
      
      fetchData();
      
      // Reset states
      setSelectedAnalyses([]);
      setSelectedRadios([]);
      setNotes('');
      setPrice('');
    }
  }, [isOpen, initialPatient]);

  if (!isOpen) return null;

  const addAnalysis = (item) => {
    if (selectedAnalyses.find(a => a.catalogId === item._id || a.name === item.name)) return;
    setSelectedAnalyses(prev => [...prev, { catalogId: item._id, name: item.name }]);
  };

  const addCustomAnalysis = (e) => {
    e.preventDefault();
    if (!customAnalysis.trim()) return;
    if (selectedAnalyses.find(a => a.name.toLowerCase() === customAnalysis.trim().toLowerCase())) return;
    setSelectedAnalyses(prev => [...prev, { name: customAnalysis.trim() }]);
    setCustomAnalysis('');
  };

  const addRadio = (item) => {
    if (selectedRadios.find(r => r.catalogId === item._id || r.name === item.name)) return;
    setSelectedRadios(prev => [...prev, { catalogId: item._id, name: item.name, notes: '' }]);
  };

  const addCustomRadio = (e) => {
    e.preventDefault();
    if (!customRadio.trim()) return;
    if (selectedRadios.find(r => r.name.toLowerCase() === customRadio.trim().toLowerCase())) return;
    setSelectedRadios(prev => [...prev, { name: customRadio.trim(), notes: '' }]);
    setCustomRadio('');
  };

  const updateRadioNotes = (index, value) => {
    setSelectedRadios(prev => prev.map((r, i) => i === index ? { ...r, notes: value } : r));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) {
      alert(t('addPrescriptionModal.selectPatientPlaceholder'));
      return;
    }

    if (selectedAnalyses.length === 0 && selectedRadios.length === 0) {
      alert(t('addPrescriptionModal.emptyExamsError'));
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/prescriptions', {
        patientId,
        analyses: selectedAnalyses,
        radios: selectedRadios,
        notes,
        price: Number(price) || 0
      });
      
      // Open print preview in new tab
      window.open(`/prescriptions/print/${data._id}`, '_blank');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert(t('addPrescriptionModal.savePrescriptionError'));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-7 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-400/10 border border-teal-400/20 rounded-xl">
              <FlaskConical className="h-5 w-5 text-teal-400" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">{t('addPrescriptionModal.title')}</h2>
              <p className="text-[10px] text-slate-400 font-medium">{t('addPrescriptionModal.subtitlePrescribeExams')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800/60 rounded-xl text-slate-400 hover:text-white border border-slate-700/40 transition">
            <X className="h-4 w-4" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-7 grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Left Column: Patient & Metadata (2/5 size) */}
          <div className="md:col-span-2 space-y-5 ltr:border-r rtl:border-l border-slate-100 pr-0 ltr:md:pr-6 rtl:md:pl-6">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('addPrescriptionModal.selectPatient')}</Label>
              {initialPatient ? (
                <div className="flex h-10 w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 items-center">
                  {initialPatient.fullName}
                </div>
              ) : (
                <select
                  required
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option value="" disabled>{t('addPrescriptionModal.selectPatientPlaceholder')}</option>
                  {patients.map(p => (
                    <option key={p._id} value={p._id}>{p.fullName} - {p.phoneNumber || 'Sans tel'}</option>
                  ))}
                </select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('addPrescriptionModal.notes')}</Label>
              <textarea
                id="notes"
                rows="4"
                placeholder={t('addPrescriptionModal.notesPlaceholder')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="price" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('addPrescriptionModal.consultationFee')}</Label>
              <div className="relative">
                <Input 
                  id="price" 
                  type="number" 
                  placeholder={t('addPrescriptionModal.feePlaceholder')} 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  className="w-full text-base font-extrabold text-emerald-600 bg-slate-50/50 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl ltr:pr-10 rtl:pl-10"
                />
                <span className="absolute ltr:right-3.5 rtl:left-3.5 top-2.5 text-[10px] font-bold text-slate-400 uppercase">{t('addPrescriptionModal.feeCurrency')}</span>
              </div>
            </div>

            {/* Quick Summary card */}
            <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-50/80 space-y-2">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block">{t('addPrescriptionModal.examSummary')}</span>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5"><FlaskConical className="h-3.5 w-3.5 text-purple-500" /> {t('catalog.tabAnalyses')}</span>
                <span className="bg-purple-100/60 text-purple-700 px-2 py-0.5 rounded-full text-[10px]">{selectedAnalyses.length}</span>
              </div>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5"><RadioIcon className="h-3.5 w-3.5 text-indigo-500" /> {t('catalog.tabRadios')}</span>
                <span className="bg-indigo-100/60 text-indigo-700 px-2 py-0.5 rounded-full text-[10px]">{selectedRadios.length}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Exam Selector (3/5 size) */}
          <div className="md:col-span-3 flex flex-col space-y-4 overflow-hidden">
            {/* Tabs Selector */}
            <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
              <button
                type="button"
                onClick={() => setActiveTab('analyses')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-lg transition-all ${activeTab === 'analyses' ? 'bg-white text-indigo-600 shadow-sm shadow-indigo-150' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <FlaskConical className="h-3.5 w-3.5" />
                {t('addPrescriptionModal.tabAnalyses')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('radios')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-lg transition-all ${activeTab === 'radios' ? 'bg-white text-indigo-600 shadow-sm shadow-indigo-150' : 'text-slate-500 hover:text-slate-700'}`}
              >
                <RadioIcon className="h-3.5 w-3.5" />
                {t('addPrescriptionModal.tabRadios')}
              </button>
            </div>

            {/* TAB CONTENT: Analyses */}
            {activeTab === 'analyses' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                {/* Catalog items select */}
                <div className="space-y-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('addPrescriptionModal.catalogSelect')}</span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                    {catalogAnalyses.map(item => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => addAnalysis(item)}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 bg-white hover:bg-indigo-50/20 transition-all flex items-center gap-1 active:scale-95"
                      >
                        <Plus className="h-3 w-3" /> {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Analysis input */}
                <form onSubmit={addCustomAnalysis} className="flex gap-2 shrink-0">
                  <Input
                    placeholder={t('addPrescriptionModal.customAnalysisPlaceholder')}
                    value={customAnalysis}
                    onChange={(e) => setCustomAnalysis(e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <Button type="submit" size="sm" className="bg-slate-900 text-white font-bold h-9">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>

                {/* Selected list */}
                <div className="flex-1 overflow-y-auto pr-1 min-h-[120px] space-y-2 border border-slate-100 p-3 rounded-2xl bg-white shadow-inner">
                  <span className="text-[9px] font-bold text-purple-400 uppercase tracking-wider block mb-1">{t('addPrescriptionModal.selectedAnalysesTitle')}</span>
                  {selectedAnalyses.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">{t('addPrescriptionModal.noAnalysesSelected')}</p>
                  ) : (
                    selectedAnalyses.map((a, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-purple-50/40 border border-purple-100/50">
                        <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                          <span className="text-[9px] font-bold text-purple-400 bg-purple-100 px-1.5 py-0.5 rounded-md">{idx + 1}</span>
                          {a.name}
                        </span>
                        <button type="button" onClick={() => setSelectedAnalyses(prev => prev.filter((_, i) => i !== idx))} className="p-1 hover:bg-rose-100/55 rounded-lg transition text-slate-300 hover:text-rose-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB CONTENT: Radios */}
            {activeTab === 'radios' && (
              <div className="flex-1 flex flex-col min-h-0 space-y-4">
                {/* Catalog items select */}
                <div className="space-y-1.5 shrink-0">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('addPrescriptionModal.catalogSelect')}</span>
                  <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1 border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                    {catalogRadios.map(item => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => addRadio(item)}
                        className="px-2.5 py-1.5 text-[10px] font-bold text-slate-600 hover:text-indigo-600 border border-slate-200 rounded-lg hover:border-indigo-300 bg-white hover:bg-indigo-50/20 transition-all flex items-center gap-1 active:scale-95"
                      >
                        <Plus className="h-3 w-3" /> {item.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Radio input */}
                <form onSubmit={addCustomRadio} className="flex gap-2 shrink-0">
                  <Input
                    placeholder={t('addPrescriptionModal.customRadioPlaceholder')}
                    value={customRadio}
                    onChange={(e) => setCustomRadio(e.target.value)}
                    className="flex-1 text-xs"
                  />
                  <Button type="submit" size="sm" className="bg-slate-900 text-white font-bold h-9">
                    <Plus className="h-4 w-4" />
                  </Button>
                </form>

                {/* Selected list */}
                <div className="flex-1 overflow-y-auto pr-1 min-h-[120px] space-y-2 border border-slate-100 p-3 rounded-2xl bg-white shadow-inner">
                  <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider block mb-1">{t('addPrescriptionModal.selectedRadiosTitle')}</span>
                  {selectedRadios.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-6">{t('addPrescriptionModal.noRadiosSelected')}</p>
                  ) : (
                    selectedRadios.map((r, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-indigo-50/40 border border-indigo-100/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                            <span className="text-[9px] font-bold text-indigo-400 bg-indigo-100 px-1.5 py-0.5 rounded-md">{idx + 1}</span>
                            {r.name}
                          </span>
                          <button type="button" onClick={() => setSelectedRadios(prev => prev.filter((_, i) => i !== idx))} className="p-1 hover:bg-rose-100/55 rounded-lg transition text-slate-300 hover:text-rose-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <input
                          type="text"
                          placeholder={t('addPrescriptionModal.radioNotesPlaceholder')}
                          value={r.notes}
                          onChange={(e) => updateRadioNotes(idx, e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1 text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-400 text-slate-600 font-medium"
                        />
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="px-7 py-4 border-t bg-slate-50 flex justify-end space-x-3 rtl:space-x-reverse rounded-b-3xl">
          <Button variant="outline" onClick={onClose} type="button" className="text-xs font-bold rounded-xl">{t('addPrescriptionModal.cancel')}</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 h-10 px-5 transition duration-200 active:scale-95"
          >
            {loading ? t('addPrescriptionModal.saving') : t('addPrescriptionModal.saveAndPrintBtn')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

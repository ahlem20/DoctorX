import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Plus, Trash2, FileText, Pill, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function AddOrdonnanceModal({ isOpen, onClose, onSuccess, patient: initialPatient }) {
  const { t, i18n } = useTranslation('group2');
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  
  // Medicines
  const [medicines, setMedicines] = useState([]);
  const [medName, setMedName] = useState('');
  const [medDosage, setMedDosage] = useState('');
  const [medDuration, setMedDuration] = useState('');
  
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Catalog
  const [catalogMedicines, setCatalogMedicines] = useState([]);
  const [searchMed, setSearchMed] = useState('');

  const filteredCatalog = catalogMedicines.filter(m => 
    m.name.toLowerCase().includes(searchMed.toLowerCase())
  );

  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        try {
          const [patRes, catRes] = await Promise.all([
            !initialPatient ? api.get('/patients') : Promise.resolve({ data: null }),
            api.get('/catalog/medicines')
          ]);

          if (!initialPatient && patRes.data) {
            setPatients(patRes.data);
            if (patRes.data.length > 0) setPatientId(patRes.data[0]._id);
          } else if (initialPatient) {
            setPatientId(initialPatient._id);
          }
          
          setCatalogMedicines(catRes.data);
        } catch (error) {
          console.error('Failed to fetch modal data', error);
        }
      };
      
      fetchData();
      
      // Reset states
      setMedicines([]);
      setMedName('');
      setMedDosage('');
      setMedDuration('');
      setNotes('');
      setPrice('');
    }
  }, [isOpen, initialPatient]);

  if (!isOpen) return null;

  const addMedicine = (e) => {
    e.preventDefault();
    if (!medName.trim()) return;
    setMedicines(prev => [...prev, { name: medName.trim(), dosage: medDosage.trim(), duration: medDuration.trim() }]);
    setMedName('');
    setMedDosage('');
    setMedDuration('');
  };

  const removeMedicine = (index) => {
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!patientId) {
      alert(t('addPrescriptionModal.selectPatientPlaceholder'));
      return;
    }

    if (medicines.length === 0) {
      alert(t('addPrescriptionModal.emptyMedicinesError'));
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/prescriptions', {
        patientId,
        medicines,
        notes,
        price: Number(price) || 0
      });
      
      // Open print preview in new tab
      window.open(`/prescriptions/print/${data._id}`, '_blank');
      
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      alert(t('addPrescriptionModal.saveOrdonnanceError'));
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 overflow-hidden">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center px-7 py-5 bg-gradient-to-r from-emerald-700 to-teal-900 text-white rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-400/20 border border-emerald-400/30 rounded-xl">
              <FileText className="h-5 w-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold">{t('addPrescriptionModal.titleOrdonnance')}</h2>
              <p className="text-[10px] text-emerald-200 font-medium">{t('addPrescriptionModal.subtitleOrdonnance')}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-black/20 rounded-xl text-emerald-100 hover:text-white border border-emerald-800/40 transition">
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
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-750 focus:outline-none focus:ring-2 focus:ring-emerald-400"
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
                className="flex w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 py-2.5 text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
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
                  className="w-full text-base font-extrabold text-emerald-600 bg-slate-50/50 border-slate-200 focus:border-emerald-500 focus:ring-emerald-500/20 rounded-xl ltr:pr-10 rtl:pl-10"
                />
                <span className="absolute ltr:right-3.5 rtl:left-3.5 top-2.5 text-[10px] font-bold text-slate-400 uppercase">{t('addPrescriptionModal.feeCurrency')}</span>
              </div>
            </div>

            {/* Quick Summary card */}
            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2">
              <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wider block">{t('addPrescriptionModal.summary')}</span>
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-emerald-500" /> {t('addPrescriptionModal.prescribedMedicinesTitle')}</span>
                <span className="bg-emerald-100/60 text-emerald-700 px-2 py-0.5 rounded-full text-[10px]">{medicines.length}</span>
              </div>
            </div>
          </div>

          {/* Right Column: Dynamic Medicine Selector (3/5 size) */}
          <div className="md:col-span-3 flex flex-col space-y-4 overflow-hidden">
            {/* Catalog selection */}
            <div className="space-y-1.5 shrink-0">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('addPrescriptionModal.searchCatalog')}</span>
              <div className="relative">
                <Search className="absolute ltr:left-3 rtl:right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <Input
                  type="text"
                  placeholder={t('addPrescriptionModal.searchCatalogPlaceholder')}
                  value={searchMed}
                  onChange={(e) => setSearchMed(e.target.value)}
                  className="ltr:pl-8 rtl:pr-8 pl-3 pr-3 text-xs bg-slate-50/50 border-slate-200 h-9 rounded-xl focus:border-emerald-400 focus:ring-emerald-400"
                />
              </div>

              {searchMed.trim() !== '' && (
                <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1 border border-emerald-100 rounded-xl p-1.5 bg-emerald-50/30 mt-2 shadow-inner">
                  {filteredCatalog.length === 0 ? (
                    <span className="text-xs text-slate-400 italic p-2 text-center block">{t('addPrescriptionModal.noResultFound')}</span>
                  ) : (
                    filteredCatalog.map(item => (
                      <button
                        key={item._id}
                        type="button"
                        onClick={() => {
                          setMedName(item.name);
                          setSearchMed('');
                        }}
                        className="ltr:text-left rtl:text-right px-3 py-2 text-xs font-bold text-slate-700 hover:text-emerald-700 hover:bg-white rounded-lg transition-all border border-transparent hover:border-emerald-200 shadow-sm"
                      >
                        {item.name}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Plus className="h-4 w-4 text-emerald-500" /> {t('addPrescriptionModal.addMedicineTitle')}
              </span>
              <form onSubmit={addMedicine} className="space-y-3">
                <Input
                  required
                  placeholder={t('addPrescriptionModal.medicineNamePlaceholderNew')}
                  value={medName}
                  onChange={(e) => setMedName(e.target.value)}
                  className="w-full text-xs bg-white border-slate-200"
                />
                <div className="flex gap-3">
                  <Input
                    placeholder={t('addPrescriptionModal.medicineDosagePlaceholderNew')}
                    value={medDosage}
                    onChange={(e) => setMedDosage(e.target.value)}
                    className="flex-1 text-xs bg-white border-slate-200"
                  />
                  <Input
                    placeholder={t('addPrescriptionModal.medicineDurationPlaceholderNew')}
                    value={medDuration}
                    onChange={(e) => setMedDuration(e.target.value)}
                    className="flex-1 text-xs bg-white border-slate-200"
                  />
                </div>
                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-9 rounded-xl flex items-center gap-2 text-xs">
                  <Plus className="h-3.5 w-3.5" /> {t('addPrescriptionModal.addMedicineBtn')}
                </Button>
              </form>
            </div>

            {/* Selected list */}
            <div className="flex-1 overflow-y-auto pr-1 min-h-[150px] space-y-2 border border-slate-100 p-3 rounded-2xl bg-white shadow-inner">
              <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider block mb-2">{t('addPrescriptionModal.prescribedMedicinesTitle')}</span>
              {medicines.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-400 space-y-2">
                  <FileText className="h-8 w-8 text-slate-200" />
                  <p className="text-xs italic">{t('addPrescriptionModal.noMedicinesSelected')}</p>
                </div>
              ) : (
                medicines.map((m, idx) => (
                  <div key={idx} className="flex flex-col p-3 rounded-xl bg-emerald-50/40 border border-emerald-100/60 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                        <span className="text-[9px] font-bold text-emerald-600 bg-emerald-100 px-1.5 py-0.5 rounded-md">{idx + 1}</span>
                        {m.name}
                      </span>
                      <button type="button" onClick={() => removeMedicine(idx)} className="p-1.5 hover:bg-rose-100/70 rounded-lg transition text-slate-300 hover:text-rose-500">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {(m.dosage || m.duration) && (
                      <div className="flex gap-2 text-[10px] font-medium text-slate-500 pl-7">
                        {m.dosage && <span className="bg-white border border-slate-100 px-2 py-0.5 rounded-md">{t('addPrescriptionModal.dosageLabel')}: {m.dosage}</span>}
                        {m.duration && <span className="bg-white border border-slate-100 px-2 py-0.5 rounded-md">{t('addPrescriptionModal.durationLabel')}: {m.duration}</span>}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        
        {/* Modal Footer */}
        <div className="px-7 py-4 border-t bg-slate-50 flex justify-end space-x-3 rtl:space-x-reverse rounded-b-3xl">
          <Button variant="outline" onClick={onClose} type="button" className="text-xs font-bold rounded-xl">{t('addPrescriptionModal.cancel')}</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading} 
            className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 h-10 px-5 transition duration-200 active:scale-95 shadow-sm"
          >
            {loading ? t('addPrescriptionModal.saving') : t('addPrescriptionModal.saveAndPrintBtn')}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}

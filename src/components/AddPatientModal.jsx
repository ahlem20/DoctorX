import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, UserPlus, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function AddPatientModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation('group2');
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    gender: 'Male',
    phoneNumber: '',
    address: '',
    allergies: '',
    medicalHistory: '',
  });
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...formData,
        allergies: formData.allergies.split(',').map((a) => a.trim()).filter(a => a),
      };
      await api.post('/patients', payload);
      onSuccess();
      onClose();
      // reset form
      setFormData({
        fullName: '', age: '', gender: 'Male', phoneNumber: '', address: '', allergies: '', medicalHistory: ''
      });
    } catch (error) {
      console.error(error);
      alert(t('addPatientModal.errorAddPatient'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in-40 duration-300">
      <div className="bg-white/90 backdrop-blur-lg border border-slate-200/60 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          <form id="add-patient-form" onSubmit={handleSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <Label htmlFor="fullName" className="text-xs font-bold text-slate-500">{t('addPatientModal.fullName')}</Label>
              <Input
                id="fullName"
                name="fullName"
                placeholder={t('addPatientModal.fullNamePlaceholder')}
                required
                value={formData.fullName}
                onChange={handleChange}
                className="h-10 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="age" className="text-xs font-bold text-slate-500">{t('addPatientModal.age')}</Label>
                <Input
                  id="age"
                  name="age"
                  type="number"
                  placeholder="34"
                  required
                  value={formData.age}
                  onChange={handleChange}
                  className="h-10 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="gender" className="text-xs font-bold text-slate-500">{t('addPatientModal.gender')}</Label>
                <select
                  id="gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="flex h-10 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus-visible:outline-none transition"
                >
                  <option value="Male">{t('addPatientModal.male')}</option>
                  <option value="Female">{t('addPatientModal.female')}</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber" className="text-xs font-bold text-slate-500">{t('addPatientModal.phone')}</Label>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                placeholder={t('addPatientModal.phonePlaceholder')}
                value={formData.phoneNumber}
                onChange={handleChange}
                className="h-10 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-bold text-slate-500">{t('addPatientModal.address')}</Label>
              <Input
                id="address"
                name="address"
                placeholder={t('addPatientModal.addressPlaceholder')}
                value={formData.address}
                onChange={handleChange}
                className="h-10 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="allergies" className="text-xs font-bold text-slate-500 flex items-center gap-1">
                <span>{t('addPatientModal.allergies')}</span>
                <span className="text-[10px] text-slate-400 font-semibold italic">{t('addPatientModal.allergiesHint')}</span>
              </Label>
              <Input
                id="allergies"
                name="allergies"
                placeholder={t('addPatientModal.allergiesPlaceholder')}
                value={formData.allergies}
                onChange={handleChange}
                className="h-10 bg-white border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="medicalHistory" className="text-xs font-bold text-slate-500">{t('addPatientModal.medicalHistory')}</Label>
              <textarea
                id="medicalHistory"
                name="medicalHistory"
                rows="3"
                placeholder={t('addPatientModal.medicalHistoryPlaceholder')}
                value={formData.medicalHistory}
                onChange={handleChange}
                className="flex w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus-visible:outline-none transition"
              ></textarea>
            </div>
          </form>
        </div>

        {/* Modal Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end space-x-3">
          <button
            onClick={onClose}
            type="button"
            className="h-10 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer active:scale-95"
          >
            {t('addPatientModal.cancel')}
          </button>

          <button
            type="submit"
            form="add-patient-form"
            disabled={loading}
            className="h-10 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition duration-200 active:scale-95 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                {t('addPatientModal.saving')}
              </span>
            ) : (
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" /> {t('addPatientModal.save')}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

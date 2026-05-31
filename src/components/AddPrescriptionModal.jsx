import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { X, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function AddPrescriptionModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation('group2');
  const [patients, setPatients] = useState([]);
  const [patientId, setPatientId] = useState('');
  const [medicines, setMedicines] = useState([{ name: '', dosage: '', duration: '' }]);
  const [notes, setNotes] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const fetchPatients = async () => {
        try {
          const { data } = await api.get('/patients');
          setPatients(data);
          if (data.length > 0) setPatientId(data[0]._id);
        } catch (error) {
          console.error(error);
        }
      };
      fetchPatients();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddMedicine = () => {
    setMedicines([...medicines, { name: '', dosage: '', duration: '' }]);
  };

  const handleRemoveMedicine = (index) => {
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index, field, value) => {
    const newMeds = [...medicines];
    newMeds[index][field] = value;
    setMedicines(newMeds);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post('/prescriptions', { patientId, medicines, notes, price: Number(price) });
      
      // Ouvrir la page d'impression dans un nouvel onglet
      window.open(`/prescriptions/print/${data._id}`, '_blank');
      
      if (onSuccess) onSuccess();
      onClose();
      // reset
      setPatientId('');
      setMedicines([{ name: '', dosage: '', duration: '' }]);
      setNotes('');
      setPrice('');
    } catch (error) {
      console.error(error);
      alert(t('addPrescriptionModal.errorSave'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm py-8">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-full">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">{t('addPrescriptionModal.title')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <form id="add-prescription-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="patient">{t('addPrescriptionModal.selectPatient')}</Label>
              <select
                id="patient"
                required
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                <option value="" disabled>{t('addPrescriptionModal.selectPatientPlaceholder')}</option>
                {patients.map(p => (
                  <option key={p._id} value={p._id}>{p.fullName} - {p.phoneNumber}</option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>{t('addPrescriptionModal.medicines')}</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddMedicine}>
                  <Plus className="h-4 w-4 mr-1" /> {t('addPrescriptionModal.add')}
                </Button>
              </div>
              
              {medicines.map((med, index) => (
                <div key={index} className="flex gap-3 items-start bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <div className="flex-1 space-y-2">
                    <Input placeholder={t('addPrescriptionModal.medicineNamePlaceholder')} required value={med.name} onChange={(e) => handleMedicineChange(index, 'name', e.target.value)} />
                  </div>
                  <div className="w-1/4 space-y-2">
                    <Input placeholder={t('addPrescriptionModal.dosagePlaceholder')} required value={med.dosage} onChange={(e) => handleMedicineChange(index, 'dosage', e.target.value)} />
                  </div>
                  <div className="w-1/4 space-y-2">
                    <Input placeholder={t('addPrescriptionModal.durationPlaceholder')} required value={med.duration} onChange={(e) => handleMedicineChange(index, 'duration', e.target.value)} />
                  </div>
                  {medicines.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleRemoveMedicine(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="notes">{t('addPrescriptionModal.notes')}</Label>
                <textarea
                  id="notes"
                  rows="3"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                ></textarea>
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">{t('addPrescriptionModal.consultationFee')}</Label>
                <Input 
                  id="price" 
                  type="number" 
                  placeholder={t('addPrescriptionModal.feePlaceholder')} 
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  className="w-full text-lg font-semibold text-emerald-600"
                />
              </div>
            </div>
          </form>
        </div>

        <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
          <Button variant="outline" onClick={onClose} type="button">{t('addPrescriptionModal.cancel')}</Button>
          <Button type="submit" form="add-prescription-form" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
            {loading ? t('addPrescriptionModal.saving') : t('addPrescriptionModal.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}

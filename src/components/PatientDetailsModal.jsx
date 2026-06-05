import { useState, useEffect } from 'react';
import { X, FileText, User, Activity, AlertCircle, Phone, MapPin, Printer, MessageSquare, Clock, Stethoscope } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AddPrescriptionModal from './AddPrescriptionModal';
import NewConsultationModal from '../pages/NewConsultationModal';

export default function PatientDetailsModal({ isOpen, onClose, patient }) {
  const { t } = useTranslation('group2');
  const navigate = useNavigate();
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('prescriptions'); // 'prescriptions' | 'notes'
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const handleStartExam = () => {
    if (!patient) return;
    localStorage.setItem('current_patient', JSON.stringify(patient));
    window.dispatchEvent(new CustomEvent('currentPatientChanged', { detail: patient }));
    alert(t('patientDetails.markedAsCurrent', { name: patient.fullName }));
  };

  const fetchHistoryAndNotes = async () => {
    if (!patient) return;
    setLoading(true);
    try {
      const [prescRes, notesRes] = await Promise.all([
        api.get(`/prescriptions/patient/${patient._id}`),
        api.get(`/patients/${patient._id}/notes`)
      ]);
      setPrescriptions(prescRes.data);
      setNotes(notesRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patient) {
      fetchHistoryAndNotes();
      setActiveTab('prescriptions');
    }
  }, [isOpen, patient]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSubmittingNote(true);
    try {
      const { data } = await api.post(`/patients/${patient._id}/notes`, { note: newNote });
      setNotes(prev => [data, ...prev]);
      setNewNote('');
    } catch (error) {
      console.error(error);
      alert(t('patientDetails.errorAddNote'));
    } finally {
      setSubmittingNote(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Doctor': return 'bg-indigo-50 border-indigo-150 text-indigo-700';
      case 'Nurse': return 'bg-teal-50 border-teal-150 text-teal-700';
      default: return 'bg-amber-50 border-amber-150 text-amber-700';
    }
  };

  const getRoleLabel = (role) => {
    if (role === 'Doctor') return t('patientDetails.doctor');
    if (role === 'Nurse') return t('patientDetails.nurse');
    if (role === 'Receptionist') return t('patientDetails.receptionist');
    return role;
  };

  if (!isOpen || !patient) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-full overflow-hidden">

          {/* Header */}
          <div className="flex justify-between items-start p-6 bg-blue-50/50 border-b">
            <div className="flex gap-4 items-center">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                <User className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900">{patient.fullName}</h2>
                <div className="flex gap-4 text-sm text-gray-500 mt-1">
                  <span className="flex items-center"><User className="h-4 w-4 mr-1" /> {patient.age} {t('patientDetails.yearsOld')}, {patient.gender}</span>
                  {patient.phoneNumber && <span className="flex items-center"><Phone className="h-4 w-4 mr-1" /> {patient.phoneNumber}</span>}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-gray-700 shadow-sm border border-gray-100">
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Left Column: Details */}
            <div className="md:col-span-1 space-y-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">{t('patientDetails.patientInfo')}</h3>
                <div className="bg-gray-50 p-4 rounded-xl space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">{t('patientDetails.firstVisit')}</span>
                    <span className="font-medium text-gray-900">{new Date(patient.createdAt).toLocaleDateString()}</span>
                  </div>
                  {patient.address && (
                    <div className="flex items-start gap-2 pt-2 border-t border-gray-200">
                      <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-gray-900">{patient.address}</span>
                    </div>
                  )}
                </div>
              </div>

              {patient.allergies && patient.allergies.length > 0 && (
                <div>
                  <h3 className="flex items-center text-sm font-semibold text-red-500 uppercase tracking-wider mb-3">
                    <AlertCircle className="h-4 w-4 mr-1" /> {t('patientDetails.allergies')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {patient.allergies.map((allergy, idx) => (
                      <span key={idx} className="px-3 py-1 bg-red-50 text-red-700 text-xs rounded-full font-medium border border-red-100">
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: History, Prescriptions & Notes */}
            <div className="md:col-span-2 space-y-6">
              <div>
                <h3 className="flex items-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
                  <Activity className="h-4 w-4 mr-1" /> {t('patientDetails.medicalHistory')}
                </h3>
                <div className="bg-white border border-gray-250 rounded-xl p-4 text-gray-700 text-sm leading-relaxed shadow-xs">
                  {patient.medicalHistory || t('patientDetails.noMedicalHistory')}
                </div>
              </div>

              {/* Tabs navigation */}
              <div className="border-b border-gray-200 flex gap-4">
                <button
                  onClick={() => setActiveTab('prescriptions')}
                  className={`pb-2 text-sm font-bold border-b-2 transition duration-150 cursor-pointer ${
                    activeTab === 'prescriptions'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t('patientDetails.prescriptionsTab', { count: prescriptions.length })}
                </button>
                <button
                  onClick={() => setActiveTab('notes')}
                  className={`pb-2 text-sm font-bold border-b-2 transition duration-150 cursor-pointer ${
                    activeTab === 'notes'
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {t('patientDetails.notesTab', { count: notes.length })}
                </button>
              </div>

              {activeTab === 'prescriptions' ? (
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="flex items-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                      <FileText className="h-4 w-4 mr-1" /> {t('patientDetails.prescriptionHistory')}
                    </h3>
                    {!loading && prescriptions.length > 0 && (
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                        {t('patientDetails.revenue', { amount: prescriptions.reduce((sum, p) => sum + (p.price || 0), 0) })}
                      </span>
                    )}
                  </div>

                  {loading ? (
                    <div className="text-center py-6 text-gray-400 text-sm">{t('patientDetails.loadingHistory')}</div>
                  ) : prescriptions.length > 0 ? (
                    <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                      {prescriptions.map((script) => (
                        <div key={script._id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-xs relative">
                          <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                            <span className="font-bold text-xs text-gray-800">
                              {new Date(script.createdAt).toLocaleDateString()}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                                {script.price || 0} DA
                              </span>
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{t('patientDetails.byDoctor', { name: script.doctor?.name })}</span>
                              <a
                                href={`/prescriptions/print/${script._id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] flex items-center gap-0.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md"
                              >
                                <Printer className="h-3 w-3" /> {t('patientDetails.print')}
                              </a>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {script.medicines.map((med, idx) => (
                              <div key={idx} className="flex justify-between text-xs bg-blue-50/30 p-2 rounded-lg">
                                <span className="font-semibold text-blue-900">{med.name}</span>
                                <span className="text-gray-500">{med.dosage} {t('patientDetails.during')} {med.duration}</span>
                              </div>
                            ))}
                          </div>
                          {script.notes && (
                            <p className="mt-2 text-xs text-gray-500 italic bg-yellow-50/50 p-2.5 rounded-lg">"{script.notes}"</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-6 text-center text-gray-400 text-xs">
                      {t('patientDetails.noPrescriptions')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Add Note Form */}
                  <form onSubmit={handleAddNote} className="space-y-2">
                    <textarea
                      placeholder={t('patientDetails.addObservationPlaceholder')}
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      rows={2}
                      required
                      className="w-full p-2.5 border border-gray-200 rounded-xl focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-xs bg-gray-50/30"
                    />
                    <div className="flex justify-end">
                      <Button
                        type="submit"
                        disabled={submittingNote}
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8 rounded-lg"
                      >
                        {submittingNote ? t('patientDetails.adding') : t('patientDetails.addNote')}
                      </Button>
                    </div>
                  </form>

                  {/* Notes Timeline */}
                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
                    {notes.length > 0 ? (
                      notes.map((note) => (
                        <div key={note._id} className="bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-2">
                          <div className="flex items-center gap-1.5">
                            <div className="h-6 w-6 rounded bg-blue-50 text-blue-600 font-extrabold text-[10px] flex items-center justify-center">
                              {note.author?.name?.charAt(0)}
                            </div>
                            <span className="text-xs font-bold text-gray-800">{note.author?.name}</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[8px] font-semibold border ${getRoleBadge(note.author?.role)}`}>
                              {getRoleLabel(note.author?.role)}
                            </span>
                            <span className="text-[9px] text-gray-400 ml-auto flex items-center gap-0.5">
                              <Clock className="h-3 w-3" />
                              {new Date(note.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-gray-650 pl-7 leading-relaxed">
                            {note.note}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 border-dashed rounded-xl p-6 text-center text-gray-450 text-xs">
                        {t('patientDetails.noNotes')}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Footer */}
          <div className="p-4 border-t bg-gray-50 flex justify-end">
            <Button
              variant="outline"
              onClick={() => {
                onClose();
                navigate(`/patients/${patient._id}`);
              }}
              className="mr-auto border-indigo-200 text-indigo-600 hover:bg-indigo-50 font-bold"
            >
              {t('patientDetails.fullFile')}
            </Button>
            
            <Button variant="outline" onClick={onClose} className="mr-2">{t('patientDetails.close')}</Button>

            {user?.role === 'Doctor' && (
              <Button
                onClick={handleStartExam}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold mr-2"
              >
                🔬 {t('patientDetails.startExam')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 4. Render the AddPrescriptionModal conditionally */}
      <AddPrescriptionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          fetchHistoryAndNotes(); // Refreshes the timeline automatically if a submission occurs
        }}
        patient={patient}
      />

      {/* 5. Render the NewConsultationModal conditionally */}
      <NewConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => setIsConsultationModalOpen(false)}
        patient={patient}
        onSuccess={fetchHistoryAndNotes}
      />
    </>
  );
}
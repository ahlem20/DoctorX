import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { User, Phone, MapPin, AlertCircle, FileText, Calendar, MessageSquare, Plus, Clock, Printer, Stethoscope, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../api';
import AddPrescriptionModal from '../components/AddPrescriptionModal';
import NewConsultationModal from './NewConsultationModal';
import { useModal } from '../context/ModalContext';

export default function CurrentPatient() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  
  const [patient, setPatient] = useState(null);
  const [notes, setNotes] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [isConsultationModalOpen, setIsConsultationModalOpen] = useState(false);
  const { setModalOpen } = useModal();

  useEffect(() => {
    setModalOpen(isPrescriptionModalOpen || isConsultationModalOpen);
    return () => setModalOpen(false);
  }, [isPrescriptionModalOpen, isConsultationModalOpen, setModalOpen]);

  const fetchPatientData = async (patientId) => {
    try {
      const [patientRes, notesRes, prescriptionsRes, appointmentsRes] = await Promise.all([
        api.get(`/patients/${patientId}`),
        api.get(`/patients/${patientId}/notes`),
        api.get(`/prescriptions/patient/${patientId}`),
        api.get('/appointments'),
      ]);
      
      setPatient(patientRes.data);
      setNotes(notesRes.data);
      setPrescriptions(prescriptionsRes.data);
      
      const filteredApps = appointmentsRes.data.filter(app => app.patient?._id === patientId);
      setAppointments(filteredApps);
    } catch (error) {
      console.error('Failed to fetch patient data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem('current_patient');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        fetchPatientData(p._id);
      } catch (e) {
        console.error(e);
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, []);

  const handleFinishExam = () => {
    localStorage.removeItem('current_patient');
    window.dispatchEvent(new CustomEvent('currentPatientChanged', { detail: null }));
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center bg-slate-900 rounded-2xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 animate-ping rounded-full bg-teal-500/20" />
            <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-teal-500 border-t-indigo-400" />
          </div>
          <p className="text-sm font-semibold text-slate-400">{t('current_patient.loading')}</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-96 items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center max-w-xl mx-auto">
        <div className="space-y-4">
          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <User className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">{t('current_patient.no_patient_title')}</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            {t('current_patient.no_patient_desc')}
          </p>
          <Button onClick={() => navigate('/patients')} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl">
            {t('current_patient.view_patients_btn')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Live exam warning banner & Finish Exam button */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-gradient-to-r from-teal-500 to-indigo-600 p-5 rounded-2xl shadow-md text-white">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center text-teal-200">
            <Stethoscope className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-md font-extrabold">{t('current_patient.live_exam')}</h2>
            <p className="text-[11px] text-teal-100 font-semibold uppercase tracking-wider mt-0.5">
              {t('current_patient.current_patient_label')} <span className="text-white underline">{patient.fullName}</span>
            </p>
          </div>
        </div>
        <Button
          onClick={handleFinishExam}
          className="bg-white hover:bg-slate-100 text-indigo-700 font-extrabold h-10 px-5 rounded-xl flex items-center gap-1.5 active:scale-95 transition shadow-md shrink-0 cursor-pointer border-transparent"
        >
          <CheckCircle className="h-4.5 w-4.5 text-indigo-600" /> {t('current_patient.finish_exam_btn')}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Info Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 p-6 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-gradient-to-tr from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                {patient.fullName.charAt(0)}
              </div>
              <h2 className="text-lg font-bold text-slate-800 mt-4">{patient.fullName}</h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                {t('current_patient.age')}: {patient.age} {t('current_patient.years')} · {t('current_patient.gender')}: {patient.gender === 'Male' ? t('current_patient.male') : t('current_patient.female')}
              </p>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <div className="bg-slate-50 p-4 rounded-xl space-y-3.5 text-xs">
                <div className="flex justify-between border-b border-slate-100 pb-2">
                  <span className="text-slate-400 font-medium">Téléphone</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-slate-400" />
                    {patient.phoneNumber || 'Non renseigné'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Adresse</span>
                  <span className="font-bold text-slate-700 flex items-center gap-1 text-right max-w-[150px] truncate">
                    <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                    {patient.address || 'Non renseigné'}
                  </span>
                </div>
              </div>

              {patient.allergies && patient.allergies.length > 0 && (
                <div>
                  <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5" /> Allergies
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {patient.allergies.map((a, i) => (
                      <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] rounded-md border border-red-100 font-bold">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Antécédents Médicaux</h3>
                <div className="bg-slate-50 p-4 rounded-xl text-slate-600 text-xs leading-relaxed max-h-36 overflow-y-auto">
                  {patient.medicalHistory || 'Aucun antécédent médical enregistré.'}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive Consultation & Actions */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 py-4 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
                  <Stethoscope className="h-4.5 w-4.5 text-indigo-500" />
                  Actions de Diagnostic Rapide
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">Lancez de nouvelles observations pour ce patient.</p>
              </div>
            </CardHeader>

            <CardContent className="p-6 flex flex-wrap gap-4">
              <Button
                onClick={() => setIsConsultationModalOpen(true)}
                className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-12 px-6 rounded-xl flex items-center gap-2 active:scale-95 transition shadow-sm shrink-0 cursor-pointer border-transparent"
              >
                <Stethoscope className="h-5 w-5" /> Nouvelle Consultation Clinique
              </Button>

              <Button
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold h-12 px-6 rounded-xl flex items-center gap-2 active:scale-95 transition shadow-sm shrink-0 cursor-pointer border-transparent"
              >
                <FileText className="h-5 w-5" /> Nouvelle Ordonnance
              </Button>
            </CardContent>
          </Card>

          {/* Registre des Ordonnances */}
          <Card className="border border-slate-200 bg-white shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 py-4 px-6">
              <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-indigo-500" />
                Dernières Ordonnances du Patient
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {prescriptions.length > 0 ? (
                  prescriptions.map((script) => (
                    <div key={script._id} className="bg-slate-50/50 border border-slate-150 p-4 rounded-xl shadow-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
                        <span className="text-xs font-bold text-slate-700">
                          Ordonnance du {new Date(script.createdAt).toLocaleDateString()}
                        </span>
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                          Par Dr. {script.doctor?.name}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {script.medicines.map((med, idx) => (
                          <div key={idx} className="flex justify-between text-xs bg-white p-2 rounded-lg border border-slate-100">
                            <span className="font-semibold text-slate-700">{med.name}</span>
                            <span className="text-slate-400">{med.dosage} pendant {med.duration}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 border border-dashed border-slate-200 rounded-xl">
                    <FileText className="h-6 w-6 text-slate-200 mx-auto mb-1" />
                    <p className="font-semibold text-xs">Aucune ordonnance rédigée</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AddPrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => {
          setIsPrescriptionModalOpen(false);
          fetchPatientData(patient._id);
        }}
        patient={patient}
      />

      <NewConsultationModal
        isOpen={isConsultationModalOpen}
        onClose={() => {
          setIsConsultationModalOpen(false);
          fetchPatientData(patient._id);
        }}
        patient={patient}
        onSuccess={() => fetchPatientData(patient._id)}
      />
    </div>
  );
}

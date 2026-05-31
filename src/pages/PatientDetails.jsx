import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { ArrowLeft, User, Phone, MapPin, AlertCircle, FileText, Calendar, MessageSquare, Plus, Clock, Printer, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useTranslation } from 'react-i18next';

export default function PatientDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, i18n } = useTranslation('group1');
  
  const [patient, setPatient] = useState(null);
  const [notes, setNotes] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  const handleStartExam = () => {
    if (!patient) return;
    localStorage.setItem('current_patient', JSON.stringify(patient));
    window.dispatchEvent(new CustomEvent('currentPatientChanged', { detail: patient }));
    alert(`${t('patDet.startExamMsg1')}${patient.fullName}${t('patDet.startExamMsg2')}`);
  };

  const fetchPatientData = async () => {
    try {
      const [patientRes, notesRes, prescriptionsRes, appointmentsRes] = await Promise.all([
        api.get(`/patients/${id}`),
        api.get(`/patients/${id}/notes`),
        api.get(`/prescriptions/patient/${id}`),
        api.get('/appointments'), // get all to filter in memory
      ]);
      
      setPatient(patientRes.data);
      setNotes(notesRes.data);
      setPrescriptions(prescriptionsRes.data);
      
      // Filter appointments for this patient
      const filteredApps = appointmentsRes.data.filter(app => app.patient?._id === id);
      setAppointments(filteredApps);
    } catch (error) {
      console.error('Failed to fetch patient data', error);
      alert(t('patDet.errLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchPatientData();
    }
  }, [id]);

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.trim()) return;

    setSubmittingNote(true);
    try {
      const { data } = await api.post(`/patients/${id}/notes`, { note: newNote });
      setNotes((prev) => [data, ...prev]);
      setNewNote('');
    } catch (error) {
      console.error('Failed to add note', error);
      alert(t('patDet.errAddNote'));
    } finally {
      setSubmittingNote(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'Doctor':
        return 'bg-indigo-50 border-indigo-150 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
      case 'Nurse':
        return 'bg-teal-50 border-teal-150 text-teal-700 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30';
      default:
        return 'bg-amber-50 border-amber-150 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
    }
  };

  const getRoleLabel = (role) => {
    if (role === 'Doctor') return t('chat.role.doctor');
    if (role === 'Nurse') return t('patDet.role.nurse');
    if (role === 'Receptionist') return t('chat.role.reception');
    return role;
  };

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center bg-slate-950 rounded-2xl">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 animate-ping rounded-full bg-indigo-500/20" />
            <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-teal-400" />
          </div>
          <p className="text-sm font-semibold text-slate-400">{t('patDet.loading')}</p>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="flex h-96 items-center justify-center bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="text-center">
          <p className="text-slate-500 font-semibold mb-3">{t('patDet.notFound')}</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" /> {t('patDet.btn.back')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <div className="flex justify-between items-center">
        <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center text-slate-500 hover:text-slate-700 cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t('patDet.btn.backList')}
        </Button>
        {user?.role === 'Doctor' && (
          <Button
            onClick={handleStartExam}
            className="bg-teal-600 hover:bg-teal-700 text-white font-bold h-9 rounded-xl flex items-center gap-1.5 active:scale-95 transition cursor-pointer shadow-md shadow-teal-500/10"
          >
            <Stethoscope className="h-4 w-4" /> {t('patDet.btn.startExam')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Demographics & History Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-slate-200 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 p-6 flex flex-col items-center text-center">
              <div className="h-16 w-16 bg-gradient-to-tr from-indigo-600 to-teal-500 rounded-full flex items-center justify-center text-white font-extrabold text-xl shadow-md">
                {patient.fullName.charAt(0)}
              </div>
              <h2 className="text-lg font-bold text-slate-800 mt-4">{patient.fullName}</h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-1">
                {t('patDet.createdOn')} {new Date(patient.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR')}
              </p>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Demographics details */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('patDet.genInfo')}</h3>
                <div className="bg-slate-50/60 p-4 rounded-xl space-y-3.5 text-xs">
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-medium">{t('patDet.age')}</span>
                    <span className="font-bold text-slate-700">{patient.age} {t('appointments.modal.yearsOld')}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-medium">{t('patDet.gender')}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${patient.gender === 'Male'
                      ? 'bg-blue-50 text-blue-700 border-blue-100'
                      : 'bg-rose-50 text-rose-700 border-rose-100'
                    }`}>
                      {patient.gender === 'Male' ? t('patDet.male') : t('patDet.female')}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 pb-2">
                    <span className="text-slate-400 font-medium">{t('current_patient.phone')}</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <Phone className="h-3 w-3 text-slate-400" />
                      {patient.phoneNumber || t('patDet.notSpec')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-medium">{t('current_patient.address')}</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1 text-right max-w-[150px] truncate">
                      <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                      {patient.address || t('patDet.notSpec')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Allergies list */}
              <div>
                <h3 className="text-[10px] font-bold text-red-500 uppercase tracking-wider mb-2 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" /> {t('patDet.allergies')}
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {patient.allergies && patient.allergies.length > 0 ? (
                    patient.allergies.map((a, i) => (
                      <span key={i} className="px-2.5 py-1 bg-red-50 text-red-700 text-[10px] rounded-md border border-red-100 font-bold">
                        {a}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-slate-400 italic">{t('patDet.noAllergies')}</span>
                  )}
                </div>
              </div>

              {/* Medical History */}
              <div>
                <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{t('patDet.medHist')}</h3>
                <div className="bg-slate-50/60 p-4 rounded-xl text-slate-600 text-xs leading-relaxed max-h-36 overflow-y-auto">
                  {patient.medicalHistory || t('patDet.noMedHist')}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Interactive Clinical Files, Notes and Prescriptions */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Notes Section (Notes Internes) */}
          <Card className="border border-slate-200 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 py-4 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
                  <MessageSquare className="h-4.5 w-4.5 text-indigo-500" />
                  {t('patDet.notes.title')}
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{t('patDet.notes.subtitle')}</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                {notes.length} {t('patDet.notes.count')}
              </span>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Form to submit a new note */}
              <form onSubmit={handleAddNote} className="space-y-3">
                <textarea
                  placeholder={t('patDet.notes.placeholder')}
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  required
                  className="w-full p-3.5 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-xs bg-slate-50/30"
                />
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={submittingNote}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-9 rounded-lg px-4 flex items-center gap-1 cursor-pointer active:scale-95 shadow-sm"
                  >
                    {submittingNote ? t('patDet.notes.adding') : t('patDet.notes.publish')}
                  </Button>
                </div>
              </form>

              {/* Notes timeline list */}
              <div className="space-y-4 max-h-[300px] overflow-y-auto divide-y divide-slate-100">
                {notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note._id} className="pt-4 first:pt-0 flex gap-3 items-start">
                      <div className="h-7 w-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-extrabold text-[10px]">
                        {note.author?.name?.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{note.author?.name}</span>
                          <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-semibold border ${getRoleBadge(note.author?.role)}`}>
                            {getRoleLabel(note.author?.role)}
                          </span>
                          <span className="text-[9px] text-slate-400 font-medium ml-auto flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(note.createdAt).toLocaleString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-2 bg-slate-50/60 p-3 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                          {note.note}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-slate-400">
                    <MessageSquare className="h-7 w-7 text-slate-200 mx-auto mb-2" />
                    <p className="font-semibold text-xs">{t('patDet.notes.empty')}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{t('patDet.notes.emptyDesc')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Appointments history section */}
          <Card className="border border-slate-200 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 py-4 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
                  <Calendar className="h-4.5 w-4.5 text-indigo-500" />
                  {t('appointments.apptsCount')}
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{t('patDet.apps.hist')}</p>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="space-y-3">
                {appointments.length > 0 ? (
                  appointments.map((app) => (
                    <div key={app._id} className="bg-white border border-slate-150 p-3.5 rounded-xl shadow-xs flex justify-between items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">
                            {new Date(app.dateTime).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded-md">
                            {new Date(app.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                          {t('patDet.apps.dr')}{app.doctor?.name} {t('patDet.apps.reason')}{app.reason || t('appointments.consultationReason')}
                        </p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                        app.status === 'Attended' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        app.status === 'No-show' ? 'bg-rose-50 text-rose-700 border-rose-100' :
                        'bg-indigo-50 text-indigo-700 border-indigo-100'
                      }`}>
                        {app.status === 'Attended' ? t('appointments.status.attended') :
                         app.status === 'No-show' ? t('appointments.status.noShow') :
                         t('appointments.status.confirmed')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-150 rounded-xl">
                    <Calendar className="h-6 w-6 text-slate-200 mx-auto mb-1" />
                    <p className="font-semibold text-xs">{t('patDet.apps.empty')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Prescription history section */}
          <Card className="border border-slate-200 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100/80 py-4 px-6 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-indigo-500" />
                  {t('patDet.presc.ledger')}
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{t('patDet.presc.hist')}</p>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="space-y-4">
                {prescriptions.length > 0 ? (
                  prescriptions.map((script) => (
                    <div key={script._id} className="bg-white border border-slate-150 p-4 rounded-xl shadow-xs">
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-3">
                        <span className="text-xs font-bold text-slate-700">
                          {t('patDet.presc.of')}{new Date(script.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR')}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-md">
                            {t('patDet.presc.fee')}{script.price || 0} DA
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {t('patDet.presc.by')}{script.doctor?.name}
                          </span>
                          <a
                            href={`/prescriptions/print/${script._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] flex items-center gap-0.5 text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-md transition-colors"
                          >
                            <Printer className="h-3 w-3" /> {t('patDet.presc.print')}
                          </a>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {script.medicines.map((med, idx) => (
                          <div key={idx} className="flex justify-between text-xs bg-slate-50/50 p-2 rounded-lg">
                            <span className="font-semibold text-slate-750">{med.name}</span>
                            <span className="text-slate-400">{med.dosage}{t('patDet.presc.for')}{med.duration}</span>
                          </div>
                        ))}
                      </div>
                      {script.notes && (
                        <p className="mt-2 text-xs text-slate-500 italic bg-yellow-50/60 p-2 rounded-lg">
                          "{script.notes}"
                        </p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-slate-400 border-2 border-dashed border-slate-150 rounded-xl">
                    <FileText className="h-6 w-6 text-slate-200 mx-auto mb-1" />
                    <p className="font-semibold text-xs">{t('patDet.presc.empty')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

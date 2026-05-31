import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, Plus, UserPlus, Phone, Calendar, ArrowRight, User, Trash2 } from 'lucide-react';
import api from '../api';
import AddPatientModal from '../components/AddPatientModal';
import PatientDetailsModal from '../components/PatientDetailsModal';
import { useTranslation } from 'react-i18next';
import { useModal } from '../context/ModalContext';

export default function PatientsList() {
  const { t, i18n } = useTranslation('group2');
  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const { setModalOpen } = useModal();

  useEffect(() => {
    setModalOpen(isModalOpen || !!selectedPatient);
    return () => setModalOpen(false);
  }, [isModalOpen, selectedPatient, setModalOpen]);

  const fetchPatients = async () => {
    try {
      const { data } = await api.get(`/patients?keyword=${search}`);
      setPatients(data);
    } catch (error) {
      console.error('Error fetching patients', error);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [search]);

  const handleDeletePatient = async (id, e) => {
    e.stopPropagation();
    if (window.confirm(t('patientsList.confirmDelete'))) {
      try {
        await api.delete(`/patients/${id}`);
        fetchPatients();
        if (selectedPatient?._id === id) setSelectedPatient(null);
      } catch (error) {
        console.error('Failed to delete patient', error);
        alert(t('patientsList.errorDelete'));
      }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Top Filter and Action Bar */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center">
        <div className="relative w-full sm:w-80 group">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
          <Input
            type="search"
            placeholder={t('patientsList.searchPlaceholder')}
            className="glass-input pl-10 h-10 w-full bg-white/70 border-slate-200 focus:border-indigo-500 focus:ring-indigo-500/20 rounded-xl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="h-10 px-5 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="h-4.5 w-4.5" />
          {t('patientsList.addPatient')}
        </button>
      </div>

      {/* Main Table Container */}
      <Card className="border border-slate-200/60 dark:border-slate-800/40 bg-white/80 backdrop-blur-md shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                <TableRow>
                  <TableHead className="font-bold text-slate-800 h-12 py-3 px-6 text-left">{t('patientsList.patientDetails')}</TableHead>
                  <TableHead className="font-bold text-slate-800 h-12 py-3 px-6 text-left">{t('patientsList.ageAndGender')}</TableHead>
                  <TableHead className="font-bold text-slate-800 h-12 py-3 px-6 text-left">{t('patientsList.phoneNumber')}</TableHead>
                  <TableHead className="font-bold text-slate-800 h-12 py-3 px-6 text-left">{t('patientsList.registeredOn')}</TableHead>
                  <TableHead className="font-bold text-slate-800 h-12 py-3 px-6 text-right">{t('patientsList.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.length > 0 ? (
                  patients.map((patient, index) => (
                    <TableRow
                      key={patient._id}
                      className="hover:bg-indigo-50/30 cursor-pointer border-b border-slate-100 last:border-0 transition-colors animate-in fade-in-35 duration-300"
                      style={{ animationDelay: `${index * 30}ms` }}
                      onClick={() => setSelectedPatient(patient)}
                    >
                      <TableCell className="py-4 px-6 font-semibold text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                            {patient.fullName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{patient.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-medium">UID: {patient._id.substring(18)}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-slate-600">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{patient.age} {t('patientsList.yearsOld')}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${patient.gender === 'Male'
                              ? 'bg-blue-50 text-blue-700 border-blue-100'
                              : 'bg-rose-50 text-rose-700 border-rose-100'
                            }`}>
                            {patient.gender === 'Male' ? t('addPatientModal.male') : t('addPatientModal.female')}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-slate-600 font-medium">
                        {patient.phoneNumber ? (
                          <span className="flex items-center gap-1.5 text-xs text-slate-600">
                            <Phone className="h-3.5 w-3.5 text-slate-400" />
                            {patient.phoneNumber}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">{t('patientsList.notAvailable')}</span>
                        )}
                      </TableCell>

                      <TableCell className="py-4 px-6 text-slate-600">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(patient.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setSelectedPatient(patient)}
                            className="h-8 px-3.5 rounded-lg text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-transparent transition duration-200 flex items-center justify-center gap-1 inline-flex cursor-pointer active:scale-95"
                          >
                            {t('patientsList.viewProfile')}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => handleDeletePatient(patient._id, e)}
                            className="h-8 px-3.5 rounded-lg text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-transparent transition duration-200 flex items-center justify-center gap-1 inline-flex cursor-pointer active:scale-95"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="h-32 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <User className="h-8 w-8 text-slate-200 animate-pulse" />
                        <p className="font-semibold text-slate-500">{t('patientsList.noPatients')}</p>
                        <p className="text-xs text-slate-400">{t('patientsList.addPatientHint')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modals */}
      <AddPatientModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPatients}
      />

      <PatientDetailsModal
        isOpen={!!selectedPatient}
        onClose={() => setSelectedPatient(null)}
        patient={selectedPatient}
      />
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Input } from '../components/ui/input';
import { Search, Plus, Printer, FileText, Calendar, User, UserCheck, Trash2, FlaskConical, Radio as RadioIcon } from 'lucide-react';
import api from '../api';
import AddPrescriptionModal from '../components/AddPrescriptionModal';
import AddPatientModal from '../components/AddPatientModal';
import { useTranslation } from 'react-i18next';
import { useModal } from '../context/ModalContext';

export default function Prescriptions() {
  const { t, i18n } = useTranslation('group2');
  const [prescriptions, setPrescriptions] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const { setModalOpen } = useModal();

  useEffect(() => {
    setModalOpen(isModalOpen || isPatientModalOpen);
    return () => setModalOpen(false);
  }, [isModalOpen, isPatientModalOpen, setModalOpen]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/prescriptions');
      setPrescriptions(data);
    } catch (error) {
      console.error('Error fetching prescriptions', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const filteredPrescriptions = prescriptions.filter(p =>
    p.patient?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
    p.doctor?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id) => {
    if (window.confirm(t('prescriptions.confirmDelete'))) {
      try {
        await api.delete(`/prescriptions/${id}`);
        fetchPrescriptions();
      } catch (error) {
        console.error('Failed to delete prescription', error);
        alert(t('prescriptions.errorDelete'));
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
            placeholder={t('prescriptions.searchPlaceholder')}
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
          {t('prescriptions.newPrescription')}
        </button>
      </div>

      {/* Main Table Container */}
      <Card className="border border-slate-200/60 dark:border-slate-800/40 bg-white/80 backdrop-blur-md shadow-sm overflow-hidden rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                <TableRow>
                  <TableHead className="font-bold text-slate-800 h-12 py-3 px-6 text-left">{t('prescriptions.prescriptionDate')}</TableHead>
                  <TableHead className="font-bold text-slate-800 h-12 py-3 px-6 text-left">{t('prescriptions.patientDetails')}</TableHead>
                  <TableHead className="font-bold text-slate-800 h-12 py-3 px-6 text-left">{t('prescriptions.treatingDoctor')}</TableHead>
                  <TableHead className="font-bold text-slate-800 h-12 py-3 px-6 text-left">{t('prescriptions.medicines')}</TableHead>
                  <TableHead className="font-bold text-slate-800 h-12 py-3 px-6 text-right">{t('prescriptions.consultationFee')}</TableHead>
                  <TableHead className="font-bold text-slate-800 h-12 py-3 px-6 text-right">{t('prescriptions.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-400 animate-pulse">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <FlaskConical className="h-6 w-6 text-indigo-500 animate-spin" />
                        <span className="font-semibold text-xs">{t('prescriptions.loading')}</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredPrescriptions.length > 0 ? (
                  filteredPrescriptions.map((script, index) => (
                    <TableRow
                      key={script._id}
                      className="hover:bg-indigo-50/30 border-b border-slate-100 last:border-0 transition-colors animate-in fade-in-35 duration-300"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="py-4 px-6">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold whitespace-nowrap">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" />
                          {new Date(script.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </TableCell>

                      <TableCell className="py-4 px-6 font-semibold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-xs">
                            {script.patient?.fullName ? script.patient.fullName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">{script.patient?.fullName || <span className="text-rose-500">{t('prescriptions.unknown')}</span>}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">UID: {script.patient?._id?.substring(18) || 'N/A'}</p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-slate-600">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                          <UserCheck className="h-3.5 w-3.5 text-teal-500" />
                          <span>Dr. {script.doctor?.name || 'N/A'}</span>
                        </div>
                      </TableCell>

                      {/* Display biological analyses & radiology exam badges */}
                      <TableCell className="py-4 px-6 text-slate-600">
                        <div className="flex flex-col gap-1.5">
                          {script.analyses && script.analyses.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-lg border border-purple-150 w-fit">
                              <FlaskConical className="h-3.5 w-3.5 text-purple-500" />
                              {script.analyses.length} {script.analyses.length > 1 ? 'Analyses' : 'Analyse'}
                            </span>
                          )}
                          {script.radios && script.radios.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-lg border border-indigo-150 w-fit">
                              <RadioIcon className="h-3.5 w-3.5 text-indigo-500" />
                              {script.radios.length} {script.radios.length > 1 ? 'Radiologies' : 'Radiologie'}
                            </span>
                          )}
                          {(!script.analyses || script.analyses.length === 0) && (!script.radios || script.radios.length === 0) && (
                            <span className="text-xs text-slate-400 italic">Aucun examen prescrit</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-right">
                        <span className="font-extrabold text-emerald-600 text-sm">
                          {script.price || 0} DA
                        </span>
                      </TableCell>

                      <TableCell className="py-4 px-6 text-right">
                        <div className="flex justify-end gap-2">
                          <a
                            href={`/prescriptions/print/${script._id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="h-8 px-3 rounded-lg text-xs font-bold text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-transparent transition duration-200 inline-flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <Printer className="h-3.5 w-3.5" />
                            {t('prescriptions.print')}
                          </a>
                          <button
                            onClick={() => handleDelete(script._id)}
                            className="h-8 px-3 rounded-lg text-xs font-bold text-rose-600 hover:text-white hover:bg-rose-600 border border-rose-200 hover:border-transparent transition duration-200 inline-flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-slate-400">
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FlaskConical className="h-8 w-8 text-slate-200 animate-pulse" />
                        <p className="font-semibold text-slate-500">{t('prescriptions.noPrescriptions')}</p>
                        <p className="text-xs text-slate-400">{t('prescriptions.addPrescriptionHint')}</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddPrescriptionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchPrescriptions}
      />
      <AddPatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={fetchPrescriptions}
      />
    </div>
  );
}

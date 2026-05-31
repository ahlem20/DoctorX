import { useState, useEffect } from 'react';
import { format, addDays, isSameDay, parseISO, subDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, User, UserPlus, Check, X, AlertCircle, Plus, Trash2, Edit } from 'lucide-react';
import api from '../api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';
import { useModal } from '../context/ModalContext';

export default function Appointments() {
  const { t, i18n } = useTranslation('group1');
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [staff, setStaff] = useState([]);
  const [viewMode, setViewMode] = useState('week'); // 'week' (now 5 days) | 'day'
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  
  const { setModalOpen } = useModal();

  useEffect(() => {
    setModalOpen(isAddModalOpen || isEditModalOpen);
    return () => setModalOpen(false);
  }, [isAddModalOpen, isEditModalOpen, setModalOpen]);

  // Form states
  const [formData, setFormData] = useState({
    patient: '',
    doctor: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    time: '09:00',
    duration: 30,
    reason: '',
    notes: '',
  });

  const [editFormData, setEditFormData] = useState({
    _id: '',
    patient: '',
    doctor: '',
    date: '',
    time: '',
    duration: 30,
    reason: '',
    notes: '',
    status: 'Confirmed',
  });

  const fetchAppointments = async () => {
    try {
      const { data } = await api.get('/appointments');
      setAppointments(data);
    } catch (error) {
      console.error('Error fetching appointments', error);
    }
  };

  const fetchPatientsAndStaff = async () => {
    try {
      const [patientsRes, staffRes] = await Promise.all([
        api.get('/patients'),
        api.get('/auth/staff'),
      ]);
      setPatients(patientsRes.data);
      setStaff(staffRes.data);
      
      if (patientsRes.data.length > 0) {
        setFormData(prev => ({ ...prev, patient: patientsRes.data[0]._id }));
      }
      if (staffRes.data.length > 0) {
        setFormData(prev => ({ ...prev, doctor: staffRes.data[0]._id }));
      }
    } catch (error) {
      console.error('Error fetching patients or staff', error);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchPatientsAndStaff();
  }, []);

  // Generates 5 days starting from the chosen anchor date
  const daysToDisplay = Array.from({ length: 5 }, (_, i) =>
    addDays(selectedDate, i)
  );

  const getAppointmentsForDay = (day) => {
    return appointments.filter((app) => isSameDay(parseISO(app.dateTime), day));
  };

  // Navigates precisely by 5 days if in multi-day view, or 1 day if in single-day view
  const handlePrev = () => {
    setSelectedDate(prev => viewMode === 'week' ? subDays(prev, 5) : subDays(prev, 1));
  };

  const handleNext = () => {
    setSelectedDate(prev => viewMode === 'week' ? addDays(prev, 5) : addDays(prev, 1));
  };

  const handleToday = () => {
    setSelectedDate(new Date());
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    try {
      const combinedDateTime = new Date(`${formData.date}T${formData.time}:00`);
      const body = {
        patient: formData.patient,
        doctor: formData.doctor,
        dateTime: combinedDateTime.toISOString(),
        duration: parseInt(formData.duration),
        reason: formData.reason,
        notes: formData.notes,
      };

      await api.post('/appointments', body);
      setIsAddModalOpen(false);
      fetchAppointments();
      setFormData({
        patient: patients[0]?._id || '',
        doctor: staff[0]?._id || '',
        date: format(new Date(), 'yyyy-MM-dd'),
        time: '09:00',
        duration: 30,
        reason: '',
        notes: '',
      });
    } catch (error) {
      console.error('Failed to create appointment', error);
      alert(error.response?.data?.message || t('appointments.errPlan'));
    }
  };

  const handleEditClick = (app) => {
    const appDate = parseISO(app.dateTime);
    setSelectedAppointment(app);
    setEditFormData({
      _id: app._id,
      patient: app.patient?._id,
      doctor: app.doctor?._id,
      date: format(appDate, 'yyyy-MM-dd'),
      time: format(appDate, 'HH:mm'),
      duration: app.duration,
      reason: app.reason || '',
      notes: app.notes || '',
      status: app.status,
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const combinedDateTime = new Date(`${editFormData.date}T${editFormData.time}:00`);
      const body = {
        doctor: editFormData.doctor,
        dateTime: combinedDateTime.toISOString(),
        duration: parseInt(editFormData.duration),
        reason: editFormData.reason,
        notes: editFormData.notes,
        status: editFormData.status,
      };

      await api.put(`/appointments/${editFormData._id}`, body);
      setIsEditModalOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error('Failed to update appointment', error);
      alert(error.response?.data?.message || t('appointments.errEdit'));
    }
  };

  const handleMarkArrived = async (appId) => {
    try {
      await api.put(`/appointments/${appId}`, { status: 'Attended' });
      setIsEditModalOpen(false);
      fetchAppointments();
    } catch (error) {
      console.error('Failed to mark patient as arrived', error);
    }
  };

  const handleDelete = async (appId) => {
    if (window.confirm(t('appointments.confirmCancel'))) {
      try {
        await api.delete(`/appointments/${appId}`);
        setIsEditModalOpen(false);
        fetchAppointments();
      } catch (error) {
        console.error('Failed to delete appointment', error);
      }
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Attended':
        return 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
      case 'No-show':
        return 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'Attended': return t('appointments.status.attended');
      case 'No-show': return t('appointments.status.noShow');
      default: return t('appointments.status.confirmed');
    }
  };

  const timeSlots = Array.from({ length: 11 }, (_, i) => {
    const hour = i + 8;
    return `${hour.toString().padStart(2, '0')}:00`;
  });

  return (
    <div className="w-full space-y-6">
      {/* Calendar Header Navigation */}
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-between sm:items-center bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-200/60 shadow-sm">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handlePrev} className="h-9 px-3 rounded-lg border-slate-200">
            {t('appointments.prev')}
          </Button>
          <Button variant="outline" onClick={handleToday} className="h-9 px-3.5 rounded-lg border-slate-200 font-bold">
            {t('appointments.today')}
          </Button>
          <Button variant="outline" onClick={handleNext} className="h-9 px-3 rounded-lg border-slate-200">
            {t('appointments.next')}
          </Button>
          <span className="text-sm font-bold text-slate-800 ml-2">
            {selectedDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', viewMode === 'week' ? { month: 'long', year: 'numeric' } : { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100/80 p-0.5 rounded-xl border border-slate-200/50 flex">
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'week' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('appointments.view.5days')}
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {t('appointments.view.day')}
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-teal-500 text-white font-bold text-xs flex items-center gap-2 transition duration-200 shadow-sm shadow-indigo-600/10 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            {t('appointments.scheduleBtn')}
          </button>
        </div>
      </div>

      {/* 5-Day Flexible Calendar View */}
      {viewMode === 'week' && (
        <div className="grid grid-cols-1 min-h-[500px] sm:grid-cols-2 md:grid-cols-5 gap-4 w-full auto-rows-fr">
          {daysToDisplay.map((day) => {
            const dayAppointments = getAppointmentsForDay(day);
            const isToday = isSameDay(day, new Date());
            return (
              <Card
                key={day.toString()}
                className={`border bg-white/70 backdrop-blur-md shadow-sm flex flex-col h-full transition-all relative overflow-hidden rounded-2xl group ${
                  isToday ? 'border-indigo-400 ring-1 ring-indigo-400 bg-indigo-50/10' : 'border-slate-200/60'
                }`}
              >
                <div
                  className={`p-3 text-center border-b border-slate-100 flex flex-col items-center justify-center ${
                    isToday ? 'bg-indigo-50/50' : 'bg-slate-50/30'
                  }`}
                >
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-indigo-600' : 'text-slate-400'}`}>
                    {day.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { weekday: 'long' })}
                  </span>
                  <span className={`h-8 w-8 flex items-center justify-center rounded-full text-sm font-extrabold mt-1 ${
                    isToday ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20' : 'text-slate-700'
                  }`}>
                    {day.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric' })}
                  </span>
                </div>

                <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[400px]">
                  {dayAppointments.length > 0 ? (
                    dayAppointments.map((app) => (
                      <div
                        key={app._id}
                        onClick={() => handleEditClick(app)}
                        className="bg-white border border-slate-150 p-2.5 rounded-xl shadow-xs hover:border-indigo-400 hover:shadow-md transition duration-200 cursor-pointer text-left group/card relative"
                      >
                        <div className="flex justify-between items-start gap-1">
                          <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="h-2.5 w-2.5" />
                            {format(parseISO(app.dateTime), 'HH:mm')}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold border ${getStatusStyle(app.status)}`}>
                            {getStatusLabel(app.status)}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-800 mt-2 truncate group-hover/card:text-indigo-600 transition-colors">
                          {app.patient?.fullName || t('appointments.unknownPatient')}
                        </p>
                        <p className="text-[9px] text-slate-400 mt-1 truncate">
                          {t('appointments.doctorLabel')} {app.doctor?.name || ''}
                        </p>
                        {app.reason && (
                          <p className="text-[9px] text-slate-500 italic mt-1.5 line-clamp-1 border-t border-slate-50 pt-1">
                            {app.reason}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-slate-300 py-16 flex-col text-center">
                      <CalendarIcon className="h-6 w-6 text-slate-200 mb-1" />
                      <span className="text-[10px] font-semibold text-slate-400">{t('appointments.noAppts')}</span>
                      <button
                        onClick={() => {
                          setFormData(prev => ({ ...prev, date: format(day, 'yyyy-MM-dd') }));
                          setIsAddModalOpen(true);
                        }}
                        className="text-[9px] text-indigo-500 hover:underline mt-2 font-bold cursor-pointer"
                      >
                        {t('appointments.addBtn')}
                      </button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Day Calendar View */}
      {viewMode === 'day' && (
        <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm rounded-2xl overflow-hidden">
          <CardHeader className="bg-slate-50/50 border-b border-slate-100 py-4 px-6 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-md font-bold text-slate-800">
                {t('appointments.planningOf')} {selectedDate.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">{t('appointments.chronologicalView')}</p>
            </div>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
              {getAppointmentsForDay(selectedDate).length} {t('appointments.apptsCount')}
            </span>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {timeSlots.map((slot) => {
                const slotHour = parseInt(slot.split(':')[0]);
                const slotAppointments = getAppointmentsForDay(selectedDate).filter(app => {
                  const appHour = parseISO(app.dateTime).getHours();
                  return appHour === slotHour;
                });

                return (
                  <div key={slot} className="flex min-h-16 group hover:bg-slate-50/30 transition-colors">
                    <div className="w-24 border-r border-slate-100 p-4 flex items-center justify-center font-mono text-xs font-bold text-slate-400 bg-slate-50/20 shrink-0">
                      {slot}
                    </div>

                    <div className="flex-1 p-3 flex flex-wrap gap-3 items-center">
                      {slotAppointments.length > 0 ? (
                        slotAppointments.map((app) => (
                          <div
                            key={app._id}
                            onClick={() => handleEditClick(app)}
                            className="bg-white border border-slate-150 p-3 rounded-xl shadow-xs hover:border-indigo-400 hover:shadow-md transition duration-200 cursor-pointer flex items-center justify-between gap-4 max-w-md group/card min-w-[280px]"
                          >
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 font-extrabold font-sans">
                                {app.patient?.fullName.charAt(0)}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 group-hover/card:text-indigo-600 transition-colors">
                                  {app.patient?.fullName}
                                </p>
                                <p className="text-[10px] text-slate-400 mt-0.5">
                                  {t('appointments.doctorLabel')} {app.doctor?.name} • {t('appointments.modal.reason')}: {app.reason || t('appointments.consultationReason')}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusStyle(app.status)}`}>
                                {getStatusLabel(app.status)}
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <button
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              date: format(selectedDate, 'yyyy-MM-dd'),
                              time: slot,
                            }));
                            setIsAddModalOpen(true);
                          }}
                          className="opacity-0 group-hover:opacity-100 text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1 transition duration-150 cursor-pointer px-3 py-1.5 rounded-lg hover:bg-indigo-50"
                        >
                          <Plus className="h-4 w-4" />
                          {t('appointments.createApptBtn')}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Appointment Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center p-6 bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-850">{t('appointments.modal.titleAdd')}</h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{t('appointments.modal.subtitleAdd')}</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.patient')}</label>
                <select
                  value={formData.patient}
                  onChange={(e) => setFormData({ ...formData, patient: e.target.value })}
                  required
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-sm"
                >
                  <option value="" disabled>{t('appointments.modal.selectPatient')}</option>
                  {patients.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.fullName} ({p.age} {t('appointments.modal.yearsOld')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.practitioner')}</label>
                <select
                  value={formData.doctor}
                  onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
                  required
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-sm"
                >
                  <option value="" disabled>{t('appointments.modal.selectPractitioner')}</option>
                  {staff.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.date')}</label>
                  <Input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="h-10 border-slate-200 rounded-xl focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.time')}</label>
                  <Input
                    type="time"
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="h-10 border-slate-200 rounded-xl focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.duration')}</label>
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    required
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    className="h-10 border-slate-200 rounded-xl focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.reason')}</label>
                  <Input
                    type="text"
                    placeholder={t('appointments.modal.reasonPlaceholder')}
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    className="h-10 border-slate-200 rounded-xl focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.notes')}</label>
                <textarea
                  placeholder={t('appointments.modal.notesPlaceholder')}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="h-10 rounded-xl">
                  {t('appointments.modal.close')}
                </Button>
                <Button type="submit" className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5">
                  {t('appointments.modal.validate')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit/Cancel Appointment Modal */}
      {isEditModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="flex justify-between items-center p-6 bg-slate-50 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-850">
                  {t('appointments.modal.titleEdit')} {selectedAppointment.patient?.fullName}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5 font-medium">{t('appointments.modal.subtitleEdit')}</p>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="p-1.5 bg-white border border-slate-200 rounded-full text-slate-400 hover:text-slate-600 shadow-sm"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {selectedAppointment.status === 'Confirmed' && (
                <div className="bg-indigo-50/50 border border-indigo-100 p-4 rounded-xl flex items-center justify-between">
                  <div className="flex gap-2.5 items-start">
                    <AlertCircle className="h-5 w-5 text-indigo-500 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-indigo-900">{t('appointments.modal.arrivedQuestion')}</p>
                      <p className="text-[10px] text-indigo-600 font-medium mt-0.5">
                        {t('appointments.modal.arrivedDesc')}
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() => handleMarkArrived(selectedAppointment._id)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs h-8 rounded-lg px-3 flex items-center gap-1 active:scale-95"
                  >
                    <Check className="h-3.5 w-3.5" /> {t('appointments.modal.markPresent')}
                  </Button>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.status')}</label>
                <select
                  value={editFormData.status}
                  onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-sm"
                >
                  <option value="Confirmed">{t('appointments.modal.statusConfirmed')}</option>
                  <option value="Attended">{t('appointments.modal.statusAttended')}</option>
                  <option value="No-show">{t('appointments.modal.statusNoShow')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.practitioner')}</label>
                <select
                  value={editFormData.doctor}
                  onChange={(e) => setEditFormData({ ...editFormData, doctor: e.target.value })}
                  required
                  className="w-full h-10 px-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white text-sm"
                >
                  {staff.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.name} ({s.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.date')}</label>
                  <Input
                    type="date"
                    required
                    value={editFormData.date}
                    onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                    className="h-10 border-slate-200 rounded-xl focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.time')}</label>
                  <Input
                    type="time"
                    required
                    value={editFormData.time}
                    onChange={(e) => setEditFormData({ ...editFormData, time: e.target.value })}
                    className="h-10 border-slate-200 rounded-xl focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.duration')}</label>
                  <Input
                    type="number"
                    min="5"
                    max="180"
                    required
                    value={editFormData.duration}
                    onChange={(e) => setEditFormData({ ...editFormData, duration: e.target.value })}
                    className="h-10 border-slate-200 rounded-xl focus:border-indigo-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.reason')}</label>
                  <Input
                    type="text"
                    value={editFormData.reason}
                    onChange={(e) => setEditFormData({ ...editFormData, reason: e.target.value })}
                    className="h-10 border-slate-200 rounded-xl focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">{t('appointments.modal.notes')}</label>
                <textarea
                  value={editFormData.notes}
                  onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                  rows={2}
                  className="w-full p-3 border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm bg-white"
                />
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => handleDelete(selectedAppointment._id)}
                  className="h-10 rounded-xl bg-rose-600 hover:bg-rose-700 flex items-center gap-1.5 font-bold text-xs"
                >
                  <Trash2 className="h-4 w-4" /> {t('appointments.modal.cancelAppt')}
                </Button>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)} className="h-10 rounded-xl">
                    {t('appointments.modal.close')}
                  </Button>
                  <Button type="submit" className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4">
                    {t('appointments.modal.save')}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
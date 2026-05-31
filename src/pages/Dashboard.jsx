import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, UserPlus, FileText, Coins, Activity, ArrowUpRight, Sparkles, TrendingUp } from 'lucide-react';
import api from '../api';
import AddPatientModal from '../components/AddPatientModal';
import AddPrescriptionModal from '../components/AddPrescriptionModal';
import { useOutletContext } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Dashboard() {
  const { t } = useTranslation('group1');
  const [stats, setStats] = useState({
    totalPatients: 0,
    patientsToday: 0,
    recentPrescriptions: 0,
    dailyRevenue: 0,
  });
  const [activity, setActivity] = useState([]);

  const [isPatientModalOpen, setIsPatientModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);

// To this:
  const [isModalOpen, setIsModalOpen] = useOutletContext();
  useEffect(() => {
    setIsModalOpen(isPatientModalOpen || isPrescriptionModalOpen);
  }, [isPatientModalOpen, isPrescriptionModalOpen]);

  const fetchStatsAndActivity = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/activity'),
      ]);
      setStats(statsRes.data);
      setActivity(activityRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data', error);
    }
  };

  useEffect(() => {
    fetchStatsAndActivity();
  }, []);

  const statCards = [
    {
      title: t('dashboard.stat.totPatients'),
      value: stats.totalPatients,
      description: t('dashboard.stat.totPatientsDesc'),
      icon: Users,
      color: 'text-indigo-500',
      bg: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30',
    },
    {
      title: t('dashboard.stat.todayPatients'),
      value: stats.patientsToday,
      description: t('dashboard.stat.todayPatientsDesc'),
      icon: UserPlus,
      color: 'text-teal-500',
      bg: 'bg-teal-50 dark:bg-teal-950/30 border-teal-100 dark:border-teal-900/30',
    },
    {
      title: t('dashboard.stat.recentPresc'),
      value: stats.recentPrescriptions,
      description: t('dashboard.stat.recentPrescDesc'),
      icon: FileText,
      color: 'text-purple-500',
      bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-100 dark:border-purple-900/30',
    },
    {
      title: t('dashboard.stat.todayRev'),
      value: `${stats.dailyRevenue.toLocaleString()} DA`,
      description: t('dashboard.stat.todayRevDesc'),
      icon: Coins,
      color: 'text-amber-500',
      bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-100 dark:border-amber-900/30',
    },
  ];

  return (
    <div className="relative">

      {/* Dashboard Content — fades & scales out when a modal is open */}
      <div
        className={`space-y-8 transition-all duration-300 ease-in-out ${isModalOpen
          ? 'opacity-0 pointer-events-none scale-95 blur-sm'
          : 'opacity-100 scale-100 blur-0 animate-in fade-in-50 duration-500'
          }`}
      >
        {/* Stat Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat, idx) => (
            <Card
              key={idx}
              className="border border-slate-200/60 dark:border-slate-800/40 bg-white/70 backdrop-blur-md shadow-sm hover-scale transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {stat.title}
                </span>

                <div
                  className={`${stat.bg} p-2.5 rounded-xl border flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
                >
                  <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
                </div>
              </CardHeader>

              <CardContent className="pt-2">
                <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  {stat.value}
                </div>
                <p className="text-[10px] text-slate-500 mt-1 font-medium">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Grid: Activity Feed & Action Panel */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* Recent Activity Timeline */}
          <Card className="border border-slate-200/60 dark:border-slate-800/40 bg-white/70 backdrop-blur-md shadow-sm lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/80 pb-4">
              <div>
                <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-indigo-500" />
                  {t('dashboard.activity.title')}
                </CardTitle>
                <p className="text-xs text-slate-400 font-medium">
                  {t('dashboard.activity.subtitle')}
                </p>
              </div>

              <span className="px-2 py-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full tracking-wider uppercase flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 animate-pulse" />
                {t('dashboard.activity.live')}
              </span>
            </CardHeader>

            <CardContent className="px-6 py-6">
              <div className="space-y-6 relative before:absolute before:left-6.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                {activity.length > 0 ? (
                  activity.map((act, index) => (
                    <div
                      key={act.id}
                      className="flex gap-4 items-start relative group animate-in fade-in-30 duration-300"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="relative z-10 flex items-center justify-center h-12 w-12 rounded-2xl bg-white border border-slate-200/60 shadow-sm transition-all duration-300 group-hover:border-indigo-400 group-hover:shadow-[0_0_15px_rgba(99,102,241,0.15)]">
                        <div
                          className={`rounded-xl p-2 ${act.type === 'Patient'
                            ? 'bg-indigo-50 text-indigo-500'
                            : 'bg-teal-50 text-teal-500'
                            }`}
                        >
                          {act.type === 'Patient' ? (
                            <UserPlus className="h-4 w-4" />
                          ) : (
                            <FileText className="h-4 w-4" />
                          )}
                        </div>
                      </div>

                      <div className="flex-1 pt-1">
                        <p className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {act.message}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1 font-medium">
                          {new Date(act.time).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}{' '}
                          at{' '}
                          {new Date(act.time).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <ArrowUpRight className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-slate-400 text-center py-12 flex flex-col items-center justify-center">
                    <Activity className="h-8 w-8 text-slate-200 mb-2 animate-bounce" />
                    <p className="font-semibold">{t('dashboard.activity.noAct')}</p>
                    <p className="text-xs text-slate-500">
                      {t('dashboard.activity.noActDesc')}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          <Card className="border border-slate-200/60 dark:border-slate-800/40 bg-white/70 backdrop-blur-md shadow-sm flex flex-col justify-between">
            <CardHeader className="border-b border-slate-100/80 pb-4">
              <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-teal-500" />
                {t('dashboard.actions.title')}
              </CardTitle>
              <p className="text-xs text-slate-400 font-medium">
                {t('dashboard.actions.subtitle')}
              </p>
            </CardHeader>

            <CardContent className="grid grid-cols-1 gap-4 p-6 flex-1">
              <button
                onClick={() => setIsPatientModalOpen(true)}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 hover:border-indigo-500 hover:bg-indigo-50/50 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 group text-center cursor-pointer active:scale-95"
              >
                <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-100 transition-all duration-300 mb-3 border border-indigo-100">
                  <UserPlus className="h-6 w-6 text-indigo-500 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-700 block">
                  {t('dashboard.actions.addPatient')}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {t('dashboard.actions.addPatientDesc')}
                </span>
              </button>

              <button
                onClick={() => setIsPrescriptionModalOpen(true)}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 bg-white/50 hover:border-teal-500 hover:bg-teal-50/50 hover:shadow-lg hover:shadow-teal-500/5 transition-all duration-300 group text-center cursor-pointer active:scale-95"
              >
                <div className="p-3 bg-teal-50 rounded-xl group-hover:bg-teal-100 transition-all duration-300 mb-3 border border-teal-100">
                  <FileText className="h-6 w-6 text-teal-500 group-hover:scale-110 transition-transform" />
                </div>
                <span className="text-sm font-bold text-slate-700 group-hover:text-teal-700 block">
                  {t('dashboard.actions.addPresc')}
                </span>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {t('dashboard.actions.addPrescDesc')}
                </span>
              </button>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* Modals — always mounted, rendered on top */}
      <AddPatientModal
        isOpen={isPatientModalOpen}
        onClose={() => setIsPatientModalOpen(false)}
        onSuccess={fetchStatsAndActivity}
      />

      <AddPrescriptionModal
        isOpen={isPrescriptionModalOpen}
        onClose={() => setIsPrescriptionModalOpen(false)}
        onSuccess={fetchStatsAndActivity}
      />

    </div>
  );
}

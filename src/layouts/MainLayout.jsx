import { Outlet, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useModal } from '../context/ModalContext';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, Users, FileText, Settings, LogOut, Activity, ChevronRight, Clock, Sparkles, Calendar, MessageSquare, HelpCircle, Stethoscope, Languages } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useEffect, useState } from 'react';
import NotificationsDropdown from '../components/NotificationsDropdown';
import api from '../api';

export default function MainLayout() {
  const { user, logout, loading } = useAuth();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { isModalOpen, setModalOpen } = useModal();
  const [greeting, setGreeting] = useState('layout.greeting_default');
  const [time, setTime] = useState(new Date());
  const [currentPatient, setCurrentPatient] = useState(null);

  const isArabic = i18n.language === 'ar';

  useEffect(() => {
    // Load current patient from localStorage
    const saved = localStorage.getItem('current_patient');
    if (saved) {
      try {
        setCurrentPatient(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }

    const handlePatientChange = (e) => {
      setCurrentPatient(e.detail);
    };

    window.addEventListener('currentPatientChanged', handlePatientChange);

    // Licensing check removed

    // Time-based professional medical greeting
    const hrs = new Date().getHours();
    if (hrs < 12) setGreeting('layout.greeting_morning');
    else if (hrs < 18) setGreeting('layout.greeting_afternoon');
    else setGreeting('layout.greeting_evening');

    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => {
      clearInterval(timer);
      window.removeEventListener('currentPatientChanged', handlePatientChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute h-16 w-16 animate-ping rounded-full bg-indigo-500/20" />
            <div className="relative h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-teal-400" />
          </div>
          <p className="text-sm font-semibold text-slate-400">{t('layout.loading')}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Nurse permission route guard: nurses can only access Appointments and Chat pages
  if (user?.role === 'Nurse' && location.pathname !== '/appointments' && location.pathname !== '/chat') {
    return <Navigate to="/appointments" replace />;
  }

  let navItems = [];
  if (user?.role === 'Nurse') {
    navItems = [
      { displayName: t('nav.appointments'), name: 'Appointments', path: '/appointments', icon: Calendar },
      { displayName: t('nav.messages'), name: 'Chat', path: '/chat', icon: MessageSquare },
    ];
  } else {
    navItems = [
      { displayName: t('nav.dashboard'), name: 'Dashboard', path: '/', icon: LayoutDashboard },
      { displayName: t('nav.appointments'), name: 'Appointments', path: '/appointments', icon: Calendar },
      { displayName: t('nav.patients'), name: 'Patients', path: '/patients', icon: Users },
      { displayName: t('nav.messages'), name: 'Chat', path: '/chat', icon: MessageSquare },
      { displayName: t('nav.prescriptions'), name: 'Prescriptions', path: '/prescriptions', icon: FileText },
    ];

   if (user?.role === 'Doctor') {
  navItems.unshift({
    displayName: currentPatient
      ? `${t('current_patient.current_patient_label')} ${currentPatient.fullName}`
      : t('current_patient.no_patient_title'),
    name: 'CurrentPatient',
    path: '/current-patient',
    icon: Stethoscope
  });
}

    if (user?.role === 'Doctor' || user?.permissions?.viewFinance) {
      navItems.push({ displayName: t('nav.finance'), name: 'Finance', path: '/finance', icon: Activity });
    }

    // Licenses navigation item removed

    navItems.push({ displayName: t('nav.settings'), name: 'Settings', path: '/settings', icon: Settings }); 
    navItems.push({ displayName: t('nav.help'), name: 'Help', path: '/help', icon: HelpCircle });    
  }

  const getPageTitle = () => {
    if (location.pathname === '/') return t('layout.page_title.dashboard');
    const segment = location.pathname.split('/')[1];
    if (segment === 'patients') return t('layout.page_title.patients');
    if (segment === 'prescriptions') return t('layout.page_title.prescriptions');
    if (segment === 'appointments') return t('layout.page_title.appointments');
    if (segment === 'chat') return t('layout.page_title.chat');
    if (segment === 'finance') return t('layout.page_title.finance');
    if (segment === 'settings') return t('layout.page_title.settings');
    if (segment === 'help') return t('layout.page_title.help');
    if (segment === 'current-patient') return t('layout.page_title.current_patient');
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  };

  const getBreadcrumbName = () => {
    const segment = location.pathname.split('/')[1];
    if (!segment) return t('layout.breadcrumb.dashboard');
    if (segment === 'patients') return t('layout.breadcrumb.patients');
    if (segment === 'prescriptions') return t('layout.breadcrumb.prescriptions');
    if (segment === 'appointments') return t('layout.breadcrumb.appointments');
    if (segment === 'chat') return t('layout.breadcrumb.chat');
    if (segment === 'finance') return t('layout.breadcrumb.finance');
    if (segment === 'settings') return t('layout.breadcrumb.settings');
    if (segment === 'help') return t('layout.breadcrumb.help');
    if (segment === 'current-patient') return t('layout.breadcrumb.current_patient');
    return segment;
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Premium Dark Sidebar */}
      <aside className="w-68 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 relative z-30">
        {/* Glow overlay */}
        <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-500/5 to-transparent pointer-events-none" />

        <div>
          {/* Logo Brand Header */}
          <div className="p-6 flex items-center space-x-3 border-b border-slate-800/60">
            <div className="relative group">
              <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-indigo-500 to-teal-500 opacity-70 blur-sm group-hover:opacity-100 transition duration-300" />
              <div className="relative bg-slate-950 p-2 rounded-xl border border-white/10 flex items-center justify-center">
                <Activity className="h-5 w-5 text-teal-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold text-white tracking-tight block">MaClinic</span>
              <span className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider block">Clinical OS v1.2</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="px-4 space-y-1.5 mt-6">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              return (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-300 relative group ${isActive
                      ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-medium shadow-md shadow-indigo-900/30'
                      : 'hover:bg-slate-800/60 hover:text-slate-100 text-slate-400'
                    }`}
                >
                  {/* Left Active Glow bar */}
                  {isActive && (
                    <span className="absolute left-0 top-3 bottom-3 w-1 rounded-r-lg bg-teal-400" />
                  )}

                  <item.icon className={`h-5 w-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-teal-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
                  <span className="text-sm font-semibold tracking-wide">{item.displayName}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          {/* License Plan Status removed */}

          {/* Profile Card & Logout Footer */}
          <div className="p-4 border-t border-slate-800/60 bg-slate-950/20">
          <div className="flex items-center space-x-3 mb-4 p-2 bg-slate-850/50 rounded-2xl border border-slate-800/40">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-teal-500 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/10">
                {user.name.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-slate-900" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{user.name}</p>
              <p className="text-[10px] text-teal-400 font-semibold uppercase tracking-wider">{t(`roles.${user.role.toLowerCase()}`)}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 h-10 px-4 rounded-xl text-xs font-bold text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 border border-rose-950/40 transition duration-200 active:scale-95 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </button>
        </div>
      </div>
    </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* 2. Dynamically apply relative z-20 based on isModalOpen */}
        <header className={`h-20 bg-white/70 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 ${isModalOpen ? 'hidden' : 'z-20'}`}>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-400">
              <span>{t('nav.system')}</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
              <span className="text-indigo-600 font-bold capitalize">{getBreadcrumbName()}</span>
            </div>
          </div>

          {/* Dynamic greeting header and digital clock */}
          <div className="flex items-center space-x-6">
            <div className="hidden md:flex flex-col text-right">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-end">
                <Sparkles className="h-3 w-3 text-indigo-500" /> {t('layout.portal')}
              </span>
              <h2 className="text-sm font-bold text-slate-800">
                {t(greeting)}, <span className="text-indigo-600 font-extrabold">{user.name}</span>!
              </h2>
            </div>

            <div className="h-10 w-px bg-slate-200" />

            <NotificationsDropdown />

            <div className="h-10 w-px bg-slate-200" />

            <button
              onClick={() => i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr')}
              className="flex items-center space-x-2 text-slate-600 hover:text-indigo-600 transition p-2 rounded-lg hover:bg-slate-100 cursor-pointer"
              title="Changer de langue"
            >
              <Languages className="h-5 w-5" />
              <span className="text-xs font-bold uppercase">{i18n.language}</span>
            </button>

            <div className="h-10 w-px bg-slate-200" />

            <div className="flex items-center space-x-2 text-slate-600 bg-slate-100/80 px-3.5 py-1.5 rounded-xl border border-slate-200/50">
              <Clock className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold font-mono">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </header>

        {/* Content Body with Animation Slide */}
        <div className="flex-1 overflow-auto p-8 bg-slate-50/50 relative z-10 animate-in fade-in-40 duration-500">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Page Title Tag - Hidden on settings to avoid duplication */}
            {location.pathname !== '/settings' && (
              <div className="flex flex-col mb-2">
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{getPageTitle()}</h1>
                <p className="text-xs text-slate-500 font-medium">{t('layout.dashboard_desc')}</p>
              </div>
            )}

            {/* 3. Pass down the state modifier to child views */}
            <Outlet context={[isModalOpen, setModalOpen]} />
          </div>
        </div>
      </main>
    </div>
  );
}
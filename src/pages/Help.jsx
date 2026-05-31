import { Mail, Phone, MapPin, Clock, HeartPulse, Shield, Users, Sparkles, ChevronRight, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useTranslation } from 'react-i18next';

export default function Help() {
  const { t } = useTranslation('group1');
  const features = [
    { icon: Users, title: t('help.feat.patManage'), desc: t('help.feat.patManageDesc'), color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-100' },
    { icon: HeartPulse, title: t('help.feat.medFollow'), desc: t('help.feat.medFollowDesc'), color: 'text-rose-500', bg: 'bg-rose-50 border-rose-100' },
    { icon: Shield, title: t('help.feat.secData'), desc: t('help.feat.secDataDesc'), color: 'text-teal-500', bg: 'bg-teal-50 border-teal-100' },
  ];

  const contacts = [
    { icon: Mail, label: t('help.cont.email'), value: 'fenndev26@gmail.com', color: 'text-indigo-500', bg: 'bg-indigo-50 border-indigo-100' },
    { icon: Phone, label: t('help.cont.phone'), value: '+213 (0) 542 90 29 57', color: 'text-teal-500', bg: 'bg-teal-50 border-teal-100' },
    { icon: MapPin, label: t('help.cont.address'), value: 'lakhdaria ,bouira, Algérie', color: 'text-rose-500', bg: 'bg-rose-50 border-rose-100' },
    { icon: Clock, label: t('help.cont.avail'), value: t('help.cont.availVal'), color: 'text-amber-500', bg: 'bg-amber-50 border-amber-100' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">

      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-10 shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.25),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(20,184,166,0.15),transparent_60%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-1 text-[10px] font-bold text-teal-400 bg-teal-400/10 border border-teal-400/20 rounded-full uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="h-2.5 w-2.5 animate-pulse" /> {t('help.hero.helpCenter')}
              </span>
            </div>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              {t('help.hero.welcome')}<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-teal-400">MaClinic</span>
            </h1>
            <p className="text-slate-400 text-sm mt-2 max-w-lg font-medium">
              {t('help.hero.desc')}
            </p>
          </div>
          <div className="relative group shrink-0">
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-indigo-500 to-teal-500 opacity-60 blur-md group-hover:opacity-90 transition duration-300" />
            <div className="relative bg-slate-950 p-5 rounded-2xl border border-white/10 flex items-center justify-center">
              <HeartPulse className="h-12 w-12 text-teal-400" />
            </div>
          </div>
        </div>
      </div>

      {/* About the Company */}
      <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm overflow-hidden">
        <CardHeader className="border-b border-slate-100/80 pb-4">
          <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-indigo-500" />
            {t('help.about.title')}
          </CardTitle>
          <p className="text-xs text-slate-400 font-medium">{t('help.about.subtitle')}</p>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            <span className="font-extrabold text-slate-800">MaClinic</span>{t('help.about.p1_1')}
          </p>
          <p className="text-sm text-slate-600 leading-relaxed font-medium">
            {t('help.about.p2')}
          </p>

          {/* Feature Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:shadow-md transition-all duration-300 group">
                <div className={`p-2.5 rounded-xl border ${f.bg} shrink-0`}>
                  <f.icon className={`h-4 w-4 ${f.color}`} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700 group-hover:text-indigo-600 transition-colors">{f.title}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Contact Section */}
      <Card className="border border-slate-200/60 bg-white/70 backdrop-blur-md shadow-sm">
        <CardHeader className="border-b border-slate-100/80 pb-4">
          <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-teal-500" />
            {t('help.contact.title')}
          </CardTitle>
          <p className="text-xs text-slate-400 font-medium">{t('help.contact.subtitle')}</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contacts.map((c, i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 bg-slate-50/60 hover:shadow-md hover:border-slate-200 transition-all duration-300 group">
                <div className={`p-3 rounded-xl border ${c.bg} shrink-0`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{c.label}</p>
                  <p className="text-sm font-bold text-slate-700 group-hover:text-indigo-600 transition-colors truncate">{c.value}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-slate-300 ml-auto shrink-0 group-hover:text-indigo-400 transition-colors" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
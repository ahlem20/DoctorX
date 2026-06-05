import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Coins, TrendingUp, Calendar, CreditCard, Activity, Sparkles, Receipt, Plus, Trash2, Wallet, TrendingDown } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import api from '../api';
import { useTranslation } from 'react-i18next';

export default function Finance() {
  const { t, i18n } = useTranslation('group1');
  const [prescriptions, setPrescriptions] = useState([]);
  const [charges, setCharges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all | day | month | range
  const [filterDate, setFilterDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().substring(0, 7));
  const [rangeStart, setRangeStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [rangeEnd, setRangeEnd] = useState(() => new Date().toISOString().split('T')[0]);

  // Form State
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Autre');
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);

  const fetchFinances = async () => {
    try {
      const [prescriptionsRes, chargesRes] = await Promise.all([
        api.get('/prescriptions'),
        api.get('/charges')
      ]);
      setPrescriptions(prescriptionsRes.data);
      setCharges(chargesRes.data);
    } catch (error) {
      console.error('Error fetching finance data', error);
    } finally {
      setLoading(false);
    }
  };

  // Memoized Filtered Lists
  const filteredData = useMemo(() => {
    let startLimit = null;
    let endLimit = null;

    if (filterType === 'day') {
      const d = new Date(filterDate);
      startLimit = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      endLimit = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    } else if (filterType === 'month') {
      const [year, month] = filterMonth.split('-').map(Number);
      startLimit = new Date(year, month - 1, 1, 0, 0, 0, 0);
      endLimit = new Date(year, month, 0, 23, 59, 59, 999);
    } else if (filterType === 'range') {
      const start = new Date(rangeStart);
      const end = new Date(rangeEnd);
      startLimit = new Date(start.getFullYear(), start.getMonth(), start.getDate(), 0, 0, 0, 0);
      endLimit = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999);
    }

    const filterFn = (itemDate) => {
      if (!startLimit || !endLimit) return true;
      return itemDate >= startLimit && itemDate <= endLimit;
    };

    const filteredPres = prescriptions.filter(p => filterFn(new Date(p.createdAt)));
    const filteredChg = charges.filter(c => filterFn(new Date(c.date)));

    return {
      prescriptions: filteredPres,
      charges: filteredChg
    };
  }, [prescriptions, charges, filterType, filterDate, filterMonth, rangeStart, rangeEnd]);

  // Memoized Stats Calculations
  const stats = useMemo(() => {
    let totalRevenue = 0;
    let totalExpenses = 0;

    filteredData.prescriptions.forEach(p => {
      totalRevenue += p.price || 0;
    });

    filteredData.charges.forEach(c => {
      totalExpenses += c.amount || 0;
    });

    // Subtext stats (always showing current month/today for general context in 'all' view)
    let thisMonthRevenue = 0;
    let thisMonthExpenses = 0;
    let todayRevenue = 0;
    let todayExpenses = 0;

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    prescriptions.forEach(p => {
      const price = p.price || 0;
      const pDate = new Date(p.createdAt);
      if (pDate >= startOfMonth) thisMonthRevenue += price;
      if (pDate >= startOfToday) todayRevenue += price;
    });

    charges.forEach(c => {
      const amountVal = c.amount || 0;
      const cDate = new Date(c.date);
      if (cDate >= startOfMonth) thisMonthExpenses += amountVal;
      if (cDate >= startOfToday) todayExpenses += amountVal;
    });

    return {
      totalRevenue,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      thisMonthRevenue,
      thisMonthExpenses,
      thisMonthProfit: thisMonthRevenue - thisMonthExpenses,
      todayRevenue,
      todayExpenses,
      todayProfit: todayRevenue - todayExpenses
    };
  }, [filteredData, prescriptions, charges]);

  // Memoized Chart Data
  const chartData = useMemo(() => {
    let chartArray = [];
    let isMonthly = false;

    if (filterType === 'all') {
      const days = 30;
      chartArray = Array.from({ length: days }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (days - 1 - i));
        d.setHours(0, 0, 0, 0);
        return {
          date: d,
          label: d.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'short' }),
          revenue: 0,
          expenses: 0,
          profit: 0
        };
      });
    } else if (filterType === 'day') {
      chartArray = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(filterDate);
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return {
          date: d,
          label: d.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { weekday: 'short', day: 'numeric' }),
          revenue: 0,
          expenses: 0,
          profit: 0
        };
      });
    } else if (filterType === 'month') {
      const [year, month] = filterMonth.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      chartArray = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(year, month - 1, i + 1);
        d.setHours(0, 0, 0, 0);
        return {
          date: d,
          label: d.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric' }),
          revenue: 0,
          expenses: 0,
          profit: 0
        };
      });
    } else if (filterType === 'range') {
      const start = new Date(rangeStart);
      const end = new Date(rangeEnd);
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

      if (diffDays <= 90) {
        chartArray = Array.from({ length: diffDays }, (_, i) => {
          const d = new Date(start);
          d.setDate(d.getDate() + i);
          d.setHours(0, 0, 0, 0);
          return {
            date: d,
            label: d.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'short' }),
            revenue: 0,
            expenses: 0,
            profit: 0
          };
        });
      } else {
        isMonthly = true;
        let cur = new Date(start.getFullYear(), start.getMonth(), 1);
        const endMonth = new Date(end.getFullYear(), end.getMonth(), 1);
        while (cur <= endMonth) {
          chartArray.push({
            date: new Date(cur),
            label: cur.toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short', year: 'numeric' }),
            revenue: 0,
            expenses: 0,
            profit: 0
          });
          cur.setMonth(cur.getMonth() + 1);
        }
      }
    }

    prescriptions.forEach((p) => {
      const price = p.price || 0;
      const pDate = new Date(p.createdAt);

      const match = chartArray.find(item => {
        if (isMonthly) {
          return pDate.getFullYear() === item.date.getFullYear() && pDate.getMonth() === item.date.getMonth();
        } else {
          return pDate.getFullYear() === item.date.getFullYear() &&
                 pDate.getMonth() === item.date.getMonth() &&
                 pDate.getDate() === item.date.getDate();
        }
      });
      if (match) {
        match.revenue += price;
      }
    });

    charges.forEach((c) => {
      const amountVal = c.amount || 0;
      const cDate = new Date(c.date);

      const match = chartArray.find(item => {
        if (isMonthly) {
          return cDate.getFullYear() === item.date.getFullYear() && cDate.getMonth() === item.date.getMonth();
        } else {
          return cDate.getFullYear() === item.date.getFullYear() &&
                 cDate.getMonth() === item.date.getMonth() &&
                 cDate.getDate() === item.date.getDate();
        }
      });
      if (match) {
        match.expenses += amountVal;
      }
    });

    chartArray.forEach(item => {
      item.profit = item.revenue - item.expenses;
    });

    return chartArray;
  }, [prescriptions, charges, filterType, filterDate, filterMonth, rangeStart, rangeEnd, i18n.language]);

  useEffect(() => {
    fetchFinances();
  }, [i18n.language]);

  const handleAddCharge = async (e) => {
    e.preventDefault();
    if (!desc || !amount) return;

    try {
      setSubmitting(true);
      await api.post('/charges', {
        description: desc,
        amount: parseFloat(amount),
        category,
        date: new Date(date),
      });
      // Clear form
      setDesc('');
      setAmount('');
      setCategory('Autre');
      setDate(new Date().toISOString().split('T')[0]);
      // Refetch
      await fetchFinances();
    } catch (error) {
      console.error('Error adding charge', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCharge = async (id) => {
    if (!window.confirm(t('finance.confirmDelete'))) return;

    try {
      await api.delete(`/charges/${id}`);
      await fetchFinances();
    } catch (error) {
      console.error('Error deleting charge', error);
    }
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Loyer':
        return 'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30';
      case 'Électricité/Eau':
        return 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
      case 'Équipement':
        return 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30';
      case 'Salaires':
        return 'bg-teal-50 text-teal-700 border-teal-100 dark:bg-teal-950/20 dark:text-teal-400 dark:border-teal-900/30';
      case 'Fournitures':
        return 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/30';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-100 dark:bg-slate-950/20 dark:text-slate-400 dark:border-slate-900/30';
    }
  };

  const getCategoryLabel = (cat) => {
    switch (cat) {
      case 'Loyer': return t('finance.cat.rent');
      case 'Électricité/Eau': return t('finance.cat.elecWater');
      case 'Équipement': return t('finance.cat.equip');
      case 'Salaires': return t('finance.cat.salary');
      case 'Fournitures': return t('finance.cat.supplies');
      default: return t('finance.cat.other');
    }
  };

  const filterSubtext = useMemo(() => {
    if (filterType === 'all') return '';
    if (filterType === 'day') {
      const formattedDate = new Date(filterDate).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      return t('finance.filter.subtext.day', { date: formattedDate });
    }
    if (filterType === 'month') {
      const [y, m] = filterMonth.split('-');
      const formattedMonth = new Date(Number(y), Number(m) - 1).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'long', year: 'numeric' });
      return t('finance.filter.subtext.month', { date: formattedMonth });
    }
    if (filterType === 'range') {
      const startStr = new Date(rangeStart).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'short' });
      const endStr = new Date(rangeEnd).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
      return t('finance.filter.subtext.range', { from: startStr, to: endStr });
    }
    return '';
  }, [filterType, filterDate, filterMonth, rangeStart, rangeEnd, i18n.language, t]);

  const statCards = [
    {
      title: t('finance.stat.totRev'),
      value: stats.totalRevenue,
      subtext: filterType === 'all' 
        ? `${t('finance.stat.thisMonth')} +${stats.thisMonthRevenue.toLocaleString()} DA` 
        : filterSubtext,
      description: filterType === 'all' ? t('finance.stat.revHist') : t('finance.filter.title'),
      icon: Coins,
      color: 'text-teal-500',
      bg: 'bg-teal-50 dark:bg-teal-950/30 border-teal-100 dark:border-teal-900/30'
    },
    {
      title: t('finance.stat.totExp'),
      value: stats.totalExpenses,
      subtext: filterType === 'all' 
        ? `${t('finance.stat.thisMonth')} -${stats.thisMonthExpenses.toLocaleString()} DA` 
        : filterSubtext,
      description: filterType === 'all' ? t('finance.stat.expDesc') : t('finance.filter.title'),
      icon: TrendingDown,
      color: 'text-rose-500',
      bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30'
    },
    {
      title: t('finance.stat.netProf'),
      value: stats.netProfit,
      subtext: filterType === 'all' 
        ? `${t('finance.stat.thisMonth')} ${stats.thisMonthProfit >= 0 ? '+' : ''}${stats.thisMonthProfit.toLocaleString()} DA` 
        : filterSubtext,
      description: filterType === 'all' ? t('finance.stat.profDesc') : t('finance.filter.title'),
      icon: Wallet,
      color: stats.netProfit >= 0 ? 'text-indigo-500' : 'text-rose-500',
      bg: stats.netProfit >= 0 
        ? 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-100 dark:border-indigo-900/30' 
        : 'bg-rose-50 dark:bg-rose-950/30 border-rose-100 dark:border-rose-900/30'
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center py-24 text-slate-500 animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <Activity className="h-8 w-8 text-indigo-500 animate-spin" />
          <span className="font-semibold text-xs">{t('finance.loading')}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in-50 duration-500">
      {/* Date Filtering Controls */}
      <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                {t('finance.filter.title')}
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                {filterType === 'all'
                  ? t('finance.filter.subtext.all')
                  : filterSubtext}
              </p>
            </div>

            {/* Mode selection buttons */}
            <div className="flex flex-wrap gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200/50 self-start md:self-auto">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'all' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('finance.filter.all')}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('day')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'day' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('finance.filter.day')}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('month')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'month' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('finance.filter.month')}
              </button>
              <button
                type="button"
                onClick={() => setFilterType('range')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${filterType === 'range' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {t('finance.filter.range')}
              </button>
            </div>
          </div>

          {/* Conditional inputs */}
          {filterType !== 'all' && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 items-end animate-in slide-in-from-top-2 duration-200">
              {filterType === 'day' && (
                <div className="space-y-1.5">
                  <Label htmlFor="filter-day" className="text-xs text-slate-500 font-bold">{t('finance.filter.selectDay')}</Label>
                  <Input
                    id="filter-day"
                    type="date"
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-48 text-xs font-bold focus-visible:ring-indigo-500"
                  />
                </div>
              )}

              {filterType === 'month' && (
                <div className="space-y-1.5">
                  <Label htmlFor="filter-month" className="text-xs text-slate-500 font-bold">{t('finance.filter.selectMonth')}</Label>
                  <Input
                    id="filter-month"
                    type="month"
                    value={filterMonth}
                    onChange={(e) => setFilterMonth(e.target.value)}
                    className="w-48 text-xs font-bold focus-visible:ring-indigo-500"
                  />
                </div>
              )}

              {filterType === 'range' && (
                <>
                  <div className="space-y-1.5">
                    <Label htmlFor="filter-start" className="text-xs text-slate-500 font-bold">{t('finance.filter.startDate')}</Label>
                    <Input
                      id="filter-start"
                      type="date"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                      className="w-44 text-xs font-bold focus-visible:ring-indigo-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="filter-end" className="text-xs text-slate-500 font-bold">{t('finance.filter.endDate')}</Label>
                    <Input
                      id="filter-end"
                      type="date"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      className="w-44 text-xs font-bold focus-visible:ring-indigo-500"
                    />
                  </div>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Stats Summary */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {statCards.map((stat, idx) => (
          <Card key={idx} className="border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm hover-scale transition-all duration-300 relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-teal-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {stat.title}
              </span>
              <div className={`${stat.bg} p-2.5 rounded-xl border flex items-center justify-center`}>
                <stat.icon className={`h-4.5 w-4.5 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {stat.value.toLocaleString()} <span className="text-sm font-semibold text-slate-400">DA</span>
              </div>
              <p className="text-xs font-bold text-slate-600 mt-1">{stat.subtext}</p>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100/80 pb-4">
            <div>
              <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" /> {t('finance.chart.title')}
              </CardTitle>
              <p className="text-xs text-slate-400 font-medium">{t('finance.chart.subtitle')}</p>
            </div>
            <span className="px-2 py-0.5 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full tracking-wider uppercase">
              {filterType === 'all'
                ? t('finance.chart.cycle.all')
                : filterType === 'day'
                ? t('finance.chart.cycle.day')
                : filterType === 'month'
                ? t('finance.chart.cycle.month')
                : t('finance.chart.cycle.range')}
            </span>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-72 w-full mt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="colorExpenses" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.01} />
                    </linearGradient>
                    <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 600 }} tickFormatter={(value) => `${value} DA`} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.4)',
                      background: 'rgba(255,255,255,0.85)',
                      backdropFilter: 'blur(8px)',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)',
                      fontFamily: 'Plus Jakarta Sans',
                      fontSize: '11px',
                      fontWeight: 600
                    }}
                  />
                  <Area type="monotone" name={t('finance.chart.rev')} dataKey="revenue" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                  <Area type="monotone" name={t('finance.chart.exp')} dataKey="expenses" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorExpenses)" />
                  <Area type="monotone" name={t('finance.stat.netProf')} dataKey="profit" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions Ledger */}
        <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm">
          <CardHeader className="border-b border-slate-100/80 pb-4">
            <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-slate-400" />
              {t('finance.ledger.title')}
            </CardTitle>
            <p className="text-xs text-slate-400 font-medium">{t('finance.ledger.subtitle')}</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-y-auto">
              <Table>
                <TableBody>
                  {filteredData.prescriptions.slice(0, 10).map((p, index) => (
                    <TableRow
                      key={p._id}
                      className="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors animate-in fade-in-25 duration-300"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="py-3 px-6">
                        <div className="flex items-center gap-2.5">
                          <div className="h-7 w-7 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-xs">
                            {p.patient?.fullName ? p.patient.fullName.charAt(0) : 'U'}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{p.patient?.fullName || 'Unknown'}</p>
                            <p className="text-[9px] text-slate-400 font-semibold">{new Date(p.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short', day: 'numeric' })}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3 px-6">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-sm shadow-emerald-100/20">
                          +{p.price || 0} DA
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredData.prescriptions.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-12 text-slate-400">
                        <div className="flex flex-col items-center gap-1 justify-center">
                          <Receipt className="h-6 w-6 text-slate-200 animate-pulse" />
                          <p className="text-xs font-semibold text-slate-500">{t('finance.ledger.noTrans')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charge Management Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Add Charge Form */}
        <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm">
          <CardHeader className="border-b border-slate-100/80 pb-4">
            <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
              <Plus className="h-4 w-4 text-indigo-500" />
              {t('finance.addCharge.title')}
            </CardTitle>
            <p className="text-xs text-slate-400 font-medium">{t('finance.addCharge.subtitle')}</p>
          </CardHeader>
          <CardContent className="pt-6">
            <form onSubmit={handleAddCharge} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="desc">{t('finance.addCharge.desc')}</Label>
                <Input
                  id="desc"
                  type="text"
                  placeholder={t('finance.addCharge.descPlaceholder')}
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">{t('finance.addCharge.amount')}</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder={t('finance.addCharge.amountPlaceholder')}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    min="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">{t('finance.addCharge.cat')}</Label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:border-slate-800 dark:bg-slate-950"
                  >
                    <option value="Loyer">{t('finance.cat.rent')}</option>
                    <option value="Électricité/Eau">{t('finance.cat.elecWater')}</option>
                    <option value="Équipement">{t('finance.cat.equip')}</option>
                    <option value="Salaires">{t('finance.cat.salary')}</option>
                    <option value="Fournitures">{t('finance.cat.supplies')}</option>
                    <option value="Autre">{t('finance.cat.other')}</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">{t('finance.table.date')}</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer" disabled={submitting}>
                {submitting ? t('finance.addCharge.adding') : t('finance.addCharge.btn')}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Charges Table */}
        <Card className="border border-slate-200/60 bg-white/80 backdrop-blur-md shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-slate-100/80 pb-4">
            <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2">
              <Receipt className="h-4 w-4 text-rose-500" />
              {t('finance.chargeLedger.title')}
            </CardTitle>
            <p className="text-xs text-slate-400 font-medium">{t('finance.chargeLedger.subtitle')}</p>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[350px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/50 hover:bg-slate-50/50">
                    <TableHead className="font-semibold text-slate-600 text-xs px-6 py-3">{t('finance.table.date')}</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs px-6 py-3">{t('finance.addCharge.desc')}</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs px-6 py-3">{t('finance.addCharge.cat')}</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs px-6 py-3 text-right">{t('finance.addCharge.amount')}</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-xs px-6 py-3 text-center">{t('finance.chargeLedger.action')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredData.charges.map((c, index) => (
                    <TableRow
                      key={c._id}
                      className="hover:bg-slate-50 border-b border-slate-100 last:border-0 transition-colors animate-in fade-in-25 duration-300"
                      style={{ animationDelay: `${index * 30}ms` }}
                    >
                      <TableCell className="px-6 py-3 text-xs text-slate-500 font-medium">
                        {new Date(c.date).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-xs font-bold text-slate-800">
                        {c.description}
                      </TableCell>
                      <TableCell className="px-6 py-3 text-xs">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getCategoryBadgeClass(c.category)}`}>
                          {getCategoryLabel(c.category)}
                        </span>
                      </TableCell>
                      <TableCell className="px-6 py-3 text-xs font-bold text-right text-rose-600">
                        -{c.amount.toLocaleString()} DA
                      </TableCell>
                      <TableCell className="px-6 py-3 text-center">
                        <button
                          onClick={() => handleDeleteCharge(c._id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredData.charges.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-12 text-slate-400">
                        <div className="flex flex-col items-center gap-1 justify-center">
                          <Receipt className="h-6 w-6 text-slate-200" />
                          <p className="text-xs font-semibold text-slate-500">{t('finance.chargeLedger.noCharges')}</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

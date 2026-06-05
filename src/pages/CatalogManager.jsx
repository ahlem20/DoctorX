import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { X, Plus, Trash2, FlaskConical, Radio as RadioIcon, Pill } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../api';

export default function CatalogManager() {
  const { t } = useTranslation('group2');
  const [activeTab, setActiveTab] = useState('analyses'); // analyses | radios | medicines
  const [catalog, setCatalog] = useState({ analyses: [], radios: [], medicines: [] });
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchCatalog = async () => {
    try {
      const [anaRes, radRes, medRes] = await Promise.all([
        api.get('/catalog/analyses'),
        api.get('/catalog/radios'),
        api.get('/catalog/medicines'),
      ]);
      setCatalog({ analyses: anaRes.data, radios: radRes.data, medicines: medRes.data });
    } catch (error) {
      console.error('Failed to fetch catalog', error);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleAdd = async () => {
    if (!newItem.trim()) return;
    setLoading(true);
    try {
      const endpoint = activeTab === 'analyses' ? '/catalog/analyses' : activeTab === 'radios' ? '/catalog/radios' : '/catalog/medicines';
      const { data } = await api.post(endpoint, { name: newItem.trim() });
      setCatalog(prev => ({
        ...prev,
        [activeTab]: [...prev[activeTab], data],
      }));
      setNewItem('');
    } catch (error) {
      console.error('Add item error', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('catalog.confirmDelete') || 'Delete item?')) return;
    try {
      const endpoint = activeTab === 'analyses' ? `/catalog/analyses/${id}` : activeTab === 'radios' ? `/catalog/radios/${id}` : `/catalog/medicines/${id}`;
      await api.delete(endpoint);
      setCatalog(prev => ({
        ...prev,
        [activeTab]: prev[activeTab].filter(item => item._id !== id),
      }));
    } catch (error) {
      console.error('Delete error', error);
    }
  };

  const renderList = () => {
    const items = catalog[activeTab];
    return (
      <div className="flex-1 overflow-y-auto pr-1 min-h-[120px] space-y-2 border border-slate-100 p-3 rounded-2xl bg-white shadow-inner">
        {items.length === 0 ? (
          <p className="text-xs text-slate-400 italic text-center py-6">{t('catalog.empty')}</p>
        ) : (
          items.map((itm) => (
            <div key={itm._id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-sm font-medium text-slate-800">{itm.name}</span>
              <button type="button" onClick={() => handleDelete(itm._id)} className="p-1 hover:bg-rose-100/55 rounded-lg transition text-slate-300 hover:text-rose-500">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    );
  };

  const IconForTab = activeTab === 'analyses' ? FlaskConical : activeTab === 'radios' ? RadioIcon : Pill;

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-500">
      {/* Header */}
      <Card className="border border-slate-200/60 dark:border-slate-800/40 bg-white/70 backdrop-blur-md shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl p-4">
          <div className="flex items-center gap-2">
            <IconForTab className="h-5 w-5 text-white" />
            <CardTitle className="text-lg font-bold">
              {activeTab === 'analyses' ? t('catalog.titleAnalyses') : activeTab === 'radios' ? t('catalog.titleRadios') : t('catalog.titleMedicines')}
            </CardTitle>
          </div>
          <button onClick={() => setActiveTab('analyses')} className="p-2 hover:bg-white/20 rounded-full transition">
            <X className="h-4 w-4 text-white" />
          </button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex bg-slate-100 p-1.5 rounded-xl mb-4 border border-slate-200/50">
            <button
              onClick={() => setActiveTab('analyses')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-lg transition ${activeTab === 'analyses' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <FlaskConical className="h-3.5 w-3.5" /> {t('catalog.tabAnalyses')}
            </button>
            <button
              onClick={() => setActiveTab('radios')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-lg transition ${activeTab === 'radios' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <RadioIcon className="h-3.5 w-3.5" /> {t('catalog.tabRadios')}
            </button>
            <button
              onClick={() => setActiveTab('medicines')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-extrabold rounded-lg transition ${activeTab === 'medicines' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Pill className="h-3.5 w-3.5" /> {t('catalog.tabMedicines')}
            </button>
          </div>

          {/* Add new item */}
          <div className="flex gap-2 mb-4">
            <Input
              placeholder={t('catalog.newPlaceholder')}
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAdd} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              <Plus className="h-4 w-4 mr-1" /> {t('catalog.add')}
            </Button>
          </div>

          {/* List */}
          {renderList()}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { User, Lock, Mail, Save, AlertCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { useTranslation } from 'react-i18next';

export default function Settings() {
  const { t } = useTranslation('group2');
  const { user, login } = useAuth();
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    password: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [staffList, setStaffList] = useState([]);

  useEffect(() => {
    if (user?.role === 'Doctor') {
      const fetchStaff = async () => {
        try {
          const { data } = await api.get('/auth/users');
          setStaffList(data);
        } catch (error) {
          console.error(t('settings.errorFetchStaff'));
        }
      };
      fetchStaff();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTogglePermission = async (staffId, currentPermissions) => {
    try {
      const updatedPermissions = {
        ...currentPermissions,
        viewFinance: !currentPermissions?.viewFinance
      };
      await api.put(`/auth/users/${staffId}/permissions`, { permissions: updatedPermissions });
      
      setStaffList(prevList => prevList.map(s => s._id === staffId ? { ...s, permissions: updatedPermissions } : s));
    } catch (error) {
      alert(t('settings.errorUpdatePermissions'));
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (window.confirm(t('settings.confirmDeleteStaff'))) {
      try {
        await api.delete(`/auth/users/${staffId}`);
        setStaffList(prevList => prevList.filter(s => s._id !== staffId));
      } catch (error) {
        console.error(error);
        alert(t('settings.errorDeleteStaff'));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (formData.password && formData.password !== formData.confirmPassword) {
      return setMessage({ type: 'error', text: t('settings.passwordMismatch') });
    }

    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        password: formData.password || undefined
      });
      
      localStorage.setItem('userInfo', JSON.stringify(data));
      login(data);
      
      setMessage({ type: 'success', text: t('settings.profileUpdated') });
      setFormData({ ...formData, password: '', confirmPassword: '' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || t('settings.errorUpdateProfile') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.accountSettings')}</h1>
        <p className="text-gray-500">{t('settings.settingsDescription')}</p>
      </div>

      <Card className="border-0 shadow-sm ring-1 ring-gray-200">
        <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-6">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-blue-600" /> {t('settings.personalInfo')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
              <AlertCircle className="h-5 w-5" />
              <p className="font-medium text-sm">{message.text}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t('settings.fullName')}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input 
                    id="name" 
                    name="name" 
                    className="pl-10" 
                    value={formData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">{t('settings.email')}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    className="pl-10" 
                    value={formData.email} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('settings.phone')}</Label>
                <Input 
                  id="phone" 
                  name="phone" 
                  placeholder={t('settings.phonePlaceholder')}
                  value={formData.phone} 
                  onChange={handleChange} 
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t('settings.address')}</Label>
                <Input 
                  id="address" 
                  name="address" 
                  placeholder={t('settings.addressPlaceholder')}
                  value={formData.address} 
                  onChange={handleChange} 
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Lock className="h-4 w-4 text-gray-500" /> {t('settings.changePassword')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="password">{t('settings.newPassword')}</Label>
                  <Input 
                    id="password" 
                    name="password" 
                    type="password" 
                    placeholder={t('settings.leaveEmpty')} 
                    value={formData.password} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t('settings.confirmPassword')}</Label>
                  <Input 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    type="password" 
                    placeholder={t('settings.confirmPasswordPlaceholder')} 
                    value={formData.confirmPassword} 
                    onChange={handleChange} 
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-100 flex justify-end">
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px]">
                {loading ? t('settings.saving') : <><Save className="h-4 w-4 mr-2" /> {t('settings.save')}</>}
              </Button>
            </div>
          </form>

        </CardContent>
      </Card>

      {user?.role === 'Doctor' && (
        <Card className="border-0 shadow-sm ring-1 ring-gray-200 mt-8">
          <CardHeader className="border-b border-gray-100 bg-gray-50/50 pb-6">
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" /> {t('settings.permissionsManagement')}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-gray-100">
              {staffList.map((staff) => (
                <div key={staff._id} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div>
                    <h4 className="font-medium text-gray-900">{staff.name}</h4>
                    <p className="text-sm text-gray-500">{staff.role} • {staff.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-700">{t('settings.allowFinance')}</span>
                    <button
                      onClick={() => handleTogglePermission(staff._id, staff.permissions)}
                      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${staff.permissions?.viewFinance ? 'bg-blue-600' : 'bg-gray-200'}`}
                      role="switch"
                      aria-checked={staff.permissions?.viewFinance}
                    >
                      <span
                        aria-hidden="true"
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${staff.permissions?.viewFinance ? 'translate-x-5' : 'translate-x-0'}`}
                      />
                    </button>
                    <button
                      onClick={() => handleDeleteStaff(staff._id)}
                      className="ml-2 h-8 w-8 flex items-center justify-center rounded-lg text-rose-500 hover:text-white hover:bg-rose-500 border border-rose-200 hover:border-transparent transition duration-200 active:scale-95"
                      title={t('settings.deleteAccount')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
              {staffList.length === 0 && (
                <div className="p-6 text-center text-gray-500">{t('settings.noOtherStaff')}</div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

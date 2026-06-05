import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Stethoscope, Languages } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation(['translation', 'group1']);

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(t('login.error_invalid'));
    }
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-blue-50/50 relative">
      <div className="absolute top-4 right-4 rtl:left-4 rtl:right-auto">
        <button
          type="button"
          onClick={toggleLanguage}
          className="flex items-center space-x-2 rtl:space-x-reverse text-slate-600 hover:text-blue-600 transition p-2 rounded-lg hover:bg-blue-100 cursor-pointer bg-white shadow-sm border border-slate-200"
          title="Changer de langue"
        >
          <Languages className="h-5 w-5" />
          <span className="text-xs font-bold uppercase">{i18n.language}</span>
        </button>
      </div>
      <Card className="w-full max-w-md shadow-xl border-blue-100">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-2xl">
              <Stethoscope className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-blue-900">{t('login.title')}</CardTitle>
          <CardDescription className="text-gray-500">{t('login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="email">{t('login.email_label')}</Label>
              <Input
                id="email"
                type="email"
                placeholder={t('login.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-visible:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('login.password_label')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="focus-visible:ring-blue-500"
              />
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {t('login.submit')}
            </Button>

            <div className="text-center text-sm text-gray-500 mt-4">
              {t('login.no_account')}{' '}
              <Link to="/register" className="text-blue-600 hover:underline">
                {t('login.register_link')}
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import MainLayout from './layouts/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import PatientsList from './pages/PatientsList';
import PatientDetails from './pages/PatientDetails';
import CatalogManager from './pages/CatalogManager';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import PrintPrescription from './pages/PrintPrescription';
import Appointments from './pages/Appointments';
import Chat from './pages/Chat';
import Help from './pages/Help';
import CurrentPatient from './pages/CurrentPatient';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const { i18n } = useTranslation();

  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  return (
    <ErrorBoundary>
      <AuthProvider>
        <ModalProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/prescriptions/print/:id" element={<PrintPrescription />} />
              <Route element={<MainLayout />}> 
                <Route path="/" element={<Dashboard />} />
                <Route path="/patients" element={<PatientsList />} />
                <Route path="/patients/:id" element={<PatientDetails />} />
                <Route path="/prescriptions" element={<CatalogManager />} />
                <Route path="/appointments" element={<Appointments />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/finance" element={<Finance />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/help" element={<Help />} />
                <Route path="/current-patient" element={<CurrentPatient />} />
              </Route>
            </Routes>
          </Router>
        </ModalProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

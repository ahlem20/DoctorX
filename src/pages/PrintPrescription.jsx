import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Stethoscope, Printer, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTranslation } from 'react-i18next';

export default function PrintPrescription() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('group2');
  const [prescription, setPrescription] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPrescription = async () => {
      try {
        const { data } = await api.get(`/prescriptions/${id}`);
        setPrescription(data);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching prescription', error);
        setLoading(false);
      }
    };
    fetchPrescription();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">{t('printPrescription.loading')}</div>;
  }

  if (!prescription) {
    return <div className="flex h-screen items-center justify-center text-red-500">{t('printPrescription.notFound')}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Controls - Hidden during print */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => navigate(-1)} className="bg-white">
          <ArrowLeft className="h-4 w-4 mr-2" /> {t('printPrescription.back')}
        </Button>
        <Button onClick={handlePrint} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Printer className="h-4 w-4 mr-2" /> {t('printPrescription.printPdf')}
        </Button>
      </div>

      {/* A4 Paper Container */}
      <div className="max-w-3xl mx-auto bg-white p-12 shadow-lg min-h-[1056px] print:shadow-none print:p-0">
        {/* Header */}
        <header className="flex justify-between items-start border-b-2 border-blue-600 pb-8 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-3 rounded-xl print:bg-white print:text-blue-600 print:border print:border-blue-600">
              <Stethoscope className="h-8 w-8 text-white print:text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">MaClinic</h1>
              <p className="text-gray-500 text-sm mt-1">{t('printPrescription.slogan')}</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-gray-800">{prescription.doctor.name}</h2>
            <p className="text-gray-500 text-sm">{t('printPrescription.consultantDoctor')}</p>
            <p className="text-gray-500 text-sm mt-2">{prescription.doctor.address || t('printPrescription.defaultAddress')}</p>
            <p className="text-gray-500 text-sm">{t('printPrescription.tel', { phone: prescription.doctor.phone || t('printPrescription.defaultPhone') })}</p>
          </div>
        </header>

        {/* Patient Info */}
        <section className="bg-gray-50 rounded-xl p-6 mb-8 print:bg-white print:border print:border-gray-200">
          <div className="grid grid-cols-2 gap-y-4">
            <div>
              <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">{t('printPrescription.patientName')}</span>
              <p className="text-lg font-bold text-gray-900 mt-1">{prescription.patient.fullName}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">{t('printPrescription.date')}</span>
              <p className="text-lg font-bold text-gray-900 mt-1">
                {new Date(prescription.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">{t('printPrescription.ageGender')}</span>
              <p className="text-gray-900 font-medium mt-1">{prescription.patient.age} {t('printPrescription.yearsOld')} / {prescription.patient.gender === 'Male' ? t('addPatientModal.male') : t('addPatientModal.female')}</p>
            </div>
            {prescription.patient.phoneNumber && (
              <div>
                <span className="text-gray-500 text-sm uppercase tracking-wider font-semibold">{t('printPrescription.phone')}</span>
                <p className="text-gray-900 font-medium mt-1">{prescription.patient.phoneNumber}</p>
              </div>
            )}
          </div>
        </section>

        {/* Medicines */}
        <section className="min-h-[300px]">
          <ul className="space-y-6">
            {prescription.medicines.map((med, idx) => (
              <li key={idx} className="flex gap-4 items-start border-b border-gray-100 pb-4">
                <span className="font-bold text-gray-400 text-lg mt-0.5">{idx + 1}.</span>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">{med.name}</h3>
                  <div className="flex gap-6 mt-2 text-gray-700">
                    <p><span className="font-semibold text-gray-500">{t('printPrescription.dosage')}</span> {med.dosage}</p>
                    <p><span className="font-semibold text-gray-500">{t('printPrescription.duration')}</span> {med.duration}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          {prescription.notes && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h4 className="font-semibold text-gray-900 mb-2">{t('printPrescription.doctorNotes')}</h4>
              <p className="text-gray-700 italic">{prescription.notes}</p>
            </div>
          )}
        </section>

        {/* Signatures */}
        <footer className="mt-24 flex justify-end">
          <div className="text-center">
            <div className="w-48 border-b border-gray-400 mb-2"></div>
            <p className="font-semibold text-gray-800">{prescription.doctor.name}</p>
            <p className="text-sm text-gray-500">{t('printPrescription.signature')}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

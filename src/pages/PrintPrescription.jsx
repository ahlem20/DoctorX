import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Stethoscope, Printer, ArrowLeft, FlaskConical, Radio as RadioIcon, Pill } from 'lucide-react';
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
    return <div className="flex h-screen items-center justify-center font-bold text-slate-500">Chargement de la prescription d'examens...</div>;
  }

  if (!prescription) {
    return <div className="flex h-screen items-center justify-center text-rose-500 font-bold">Ordonnance d'examens introuvable.</div>;
  }

  const hasAnalyses = prescription.analyses && prescription.analyses.length > 0;
  const hasRadios = prescription.radios && prescription.radios.length > 0;
  const hasMedicines = prescription.medicines && prescription.medicines.length > 0;

  const isOnlyMedicines = hasMedicines && !hasAnalyses && !hasRadios;
  const docTitle = isOnlyMedicines 
    ? "Ordonnance Médicale" 
    : (hasMedicines ? "Ordonnance Médicale & Examens" : "Demande d'examens complémentaires");

  return (
    <div className="min-h-screen bg-gray-100 p-8 print:p-0 print:bg-white" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      {/* Controls - Hidden during print */}
      <div className="max-w-3xl mx-auto mb-6 flex justify-between items-center print:hidden">
        <Button variant="outline" onClick={() => navigate(-1)} className="bg-white rounded-xl font-bold">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour
        </Button>
        <Button onClick={handlePrint} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold">
          <Printer className="h-4 w-4 mr-2" /> Imprimer / Enregistrer en PDF
        </Button>
      </div>

      {/* A4 Paper Container */}
      <div className="max-w-3xl mx-auto bg-white p-12 shadow-lg min-h-[1056px] print:shadow-none print:p-0 flex flex-col justify-between">
        <div>
          {/* Header */}
          <header className="flex justify-between items-start border-b-2 border-indigo-600 pb-8 mb-8">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-3 rounded-xl print:bg-white print:text-indigo-600 print:border print:border-indigo-600 text-white">
                <FlaskConical className="h-8 w-8" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">MaClinic</h1>
                <p className="text-gray-500 text-xs font-semibold mt-1 uppercase tracking-wider">{docTitle}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-800">Dr. {prescription.doctor.name}</h2>
              <p className="text-gray-500 text-xs font-bold uppercase text-indigo-600">Médecin Praticien</p>
              <p className="text-gray-500 text-xs mt-2">{prescription.doctor.address || "Medical District Center, Alger"}</p>
              <p className="text-gray-500 text-xs">Tél: {prescription.doctor.phone || "+213 555 123 456"}</p>
            </div>
          </header>

          {/* Patient Info */}
          <section className="bg-slate-50 rounded-2xl p-6 mb-8 print:bg-white print:border print:border-slate-200">
            <div className="grid grid-cols-2 gap-y-4 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Nom Complet du Patient</span>
                <p className="text-base font-extrabold text-slate-800 mt-1">{prescription.patient.fullName}</p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Date de Prescription</span>
                <p className="text-base font-extrabold text-slate-800 mt-1">
                  {new Date(prescription.createdAt).toLocaleDateString(i18n.language === 'ar' ? 'ar-DZ' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Âge / Sexe</span>
                <p className="font-bold text-slate-700 mt-1">{prescription.patient.age} ans / {prescription.patient.gender === 'Male' ? 'Homme' : 'Femme'}</p>
              </div>
              {prescription.patient.phoneNumber && (
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px]">Téléphone</span>
                  <p className="font-bold text-slate-700 mt-1">{prescription.patient.phoneNumber}</p>
                </div>
              )}
            </div>
          </section>

          {/* Title Banner */}
          <div className="text-center py-2.5 bg-slate-100 rounded-xl mb-8 border border-slate-200/50 print:bg-white print:border">
            <span className="text-sm font-extrabold text-slate-800 tracking-wide uppercase">{docTitle}</span>
          </div>

          {/* Exams List Container */}
          <div className="space-y-8 min-h-[400px]">
            {/* Medicines */}
            {hasMedicines && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-emerald-200 pb-1.5">
                  <Pill className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-md font-extrabold text-emerald-950 uppercase tracking-wide">Traitement Médical</h3>
                </div>
                <ul className="space-y-4 pl-4 mt-4">
                  {prescription.medicines.map((med, idx) => (
                    <li key={idx} className="border-b border-dashed border-gray-150 pb-3">
                      <div className="flex justify-between items-baseline">
                        <span className="text-base font-extrabold text-gray-800">{idx + 1}. {med.name}</span>
                        {(med.dosage || med.duration) && (
                          <span className="text-sm font-bold text-gray-600">
                            {med.dosage && <span>{med.dosage}</span>}
                            {med.dosage && med.duration && <span className="mx-2 text-gray-400">|</span>}
                            {med.duration && <span>{med.duration}</span>}
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {/* Biological Analyses */}
            {hasAnalyses && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-purple-200 pb-1.5">
                  <FlaskConical className="h-5 w-5 text-purple-600" />
                  <h3 className="text-md font-extrabold text-purple-950 uppercase tracking-wide">1. Analyses Biologiques (Bilan Biologique)</h3>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 pl-4">
                  {prescription.analyses.map((ana, idx) => (
                    <div key={idx} className="flex gap-2 items-center text-sm text-gray-800 border-b border-dashed border-gray-150 pb-1">
                      <span className="font-bold text-purple-400">{idx + 1}.</span>
                      <span className="font-extrabold">{ana.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Radiology & Medical Imaging */}
            {hasRadios && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b-2 border-indigo-200 pb-1.5">
                  <RadioIcon className="h-5 w-5 text-indigo-600" />
                  <h3 className="text-md font-extrabold text-indigo-950 uppercase tracking-wide">2. Imagerie Médicale & Radiographies</h3>
                </div>
                <ul className="space-y-3.5 pl-4">
                  {prescription.radios.map((rad, idx) => (
                    <li key={idx} className="border-b border-dashed border-gray-150 pb-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-extrabold text-gray-800">{idx + 1}. {rad.name}</span>
                      </div>
                      {rad.notes && (
                        <p className="text-xs text-slate-400 font-semibold italic mt-0.5 pl-4">
                          Note / Incidence: {rad.notes}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* General Notes */}
            {prescription.notes && (
              <div className="pt-6 border-t border-slate-100">
                <h4 className="font-extrabold text-xs text-slate-400 uppercase tracking-wider mb-2">Indications Cliniques Spécifiques :</h4>
                <p className="text-xs text-slate-600 font-medium italic leading-relaxed bg-slate-50/60 p-4 rounded-xl border border-slate-100 whitespace-pre-line">
                  "{prescription.notes}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer & Signature */}
        <footer className="mt-16 flex justify-between items-end border-t border-slate-100 pt-6">
          <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Document clinique officiel · MaClinic OS
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-slate-400 mb-2"></div>
            <p className="font-bold text-gray-800 text-xs">Dr. {prescription.doctor.name}</p>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Signature & Cachet du Médecin</p>
          </div>
        </footer>
      </div>
    </div>
  );
}

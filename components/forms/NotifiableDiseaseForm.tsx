import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ThankYouModal from '../ui/ThankYouModal';
import { 
  AREAS, NOTIFIABLE_DISEASES, BARANGAYS, EMBO_BARANGAYS, PATIENT_OUTCOMES,
  DENGUE_VACCINE_OPTIONS, DENGUE_CLINICAL_CLASSES,
  ILI_TRAVEL_OPTIONS, ILI_VACCINE_OPTIONS,
  LEPTO_EXPOSURE_OPTIONS,
  AFP_POLIO_VACCINE_OPTIONS,
  HFMD_SYMPTOMS, HFMD_COMMUNITY_CASES_OPTIONS, HFMD_EXPOSURE_TYPE_OPTIONS,
  MEASLES_SYMPTOMS, MEASLES_VACCINE_OPTIONS,
  ROTA_VACCINE_OPTIONS,
  RABIES_RIG_OPTIONS, RABIES_VACCINE_PRIOR_OPTIONS,
  CHIKUNGUNYA_SYMPTOMS, CHIKUNGUNYA_TRAVEL_OPTIONS,
  PERTUSSIS_VACCINE_OPTIONS, PERTUSSIS_SYMPTOMS,
  AMES_SYMPTOMS, AMES_VACCINES_LIST, AMES_TRAVEL_OPTIONS,
  SARI_MEDICATIONS, SARI_HOUSEHOLD_ILI_OPTIONS, SARI_SCHOOL_ILI_OPTIONS, 
  SARI_FLU_VACCINE_OPTIONS, SARI_ANIMAL_EXPOSURE_OPTIONS, SARI_TRAVEL_OPTIONS
} from '../../constants';
import { submitReport, calculateAge, extractPatientInfoFromImage } from '../../services/ipcService';
import { ChevronLeft, Send, Loader2, Camera, Plus, Trash2, Users, FileText, Activity, Syringe, Plane, ShieldCheck, Pill, Droplets, Wind, MapPin, AlertTriangle } from 'lucide-react';

interface PatientData {
  id: string; 
  lastName: string;
  firstName: string;
  middleName: string;
  hospitalNumber: string;
  dob: string;
  age: string;
  sex: string;
  barangay: string;
  city: string;
}

const NotifiableDiseaseForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isOutsideMakati, setIsOutsideMakati] = useState(false);
  
  const [commonData, setCommonData] = useState<any>({
    dateOfAdmission: '',
    disease: '',
    diseaseOther: '',
    area: '',
    areaOther: '',
    outcome: 'Admitted',
    outcomeDate: '',
    reporterName: '',
    designation: '',
    designationOther: '',
    // --- DISEASE SPECIFIC FIELDS ---
    dengueVaccine: '', dengueDose1: '', dengueDoseLast: '', dengueClinicalClass: '',
    iliTravel: '', iliTravelLoc: '', iliVaccine: '', iliVaccineDate: '',
    leptoExposure: '', leptoPlace: '',
    afpPolioVaccine: '',
    hfmdSymptoms: [] as string[], hfmdCommunityCases: '', hfmdExposureType: '',
    measlesSymptoms: [] as string[], measlesVaccine: '', measlesVaccineDate: '',
    rotaVaccine: '', rotaVaccineDate: '',
    rabiesRIG: '', rabiesVaccinePrior: '', rabiesVaccineDate: '',
    chikSymptoms: [] as string[], chikTravel: '', chikTravelLoc: '',
    pertVaccine: '', pertVaccineDate: '', pertSymptoms: [] as string[],
    amesSymptoms: [] as string[], amesTravel: '', amesTravelLoc: '',
    amesVaccines: {} as Record<string, { doses: string, lastDate: string }>,
    sariMeds: [] as string[], sariMedsOther: '', sariHouseholdILI: '', sariSchoolILI: '', sariFluVaccine: '', sariAnimalExposure: [] as string[], sariTravel: '', sariTravelLoc: ''
  });

  const [currentPatient, setCurrentPatient] = useState<PatientData>({
    id: '', lastName: '', firstName: '', middleName: '', hospitalNumber: '',
    dob: '', age: '', sex: '', barangay: '', city: 'Makati'
  });

  const [patientList, setPatientList] = useState<PatientData[]>([]);

  useEffect(() => {
    if (currentPatient.dob) {
      setCurrentPatient(prev => ({ ...prev, age: calculateAge(prev.dob) }));
    }
  }, [currentPatient.dob]);

  const handleCommonChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setCommonData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxList = (field: string, value: string) => {
    setCommonData((prev: any) => {
      const list = prev[field] || [];
      return {
        ...prev,
        [field]: list.includes(value) ? list.filter((i: string) => i !== value) : [...list, value]
      };
    });
  };

  const handleAmesVaccine = (vaccine: string, field: 'doses' | 'lastDate', value: string) => {
    setCommonData((prev: any) => ({
      ...prev,
      amesVaccines: {
        ...prev.amesVaccines,
        [vaccine]: {
          ...(prev.amesVaccines[vaccine] || { doses: '', lastDate: '' }),
          [field]: value
        }
      }
    }));
  };

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentPatient(prev => ({ ...prev, [name]: value }));
  };

  const handleOutsideMakatiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsOutsideMakati(checked);
    setCurrentPatient((prev) => ({ ...prev, barangay: '', city: checked ? '' : 'Makati' }));
  };

  const handleBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBrgy = e.target.value;
    let newCity = 'Makati';
    if (EMBO_BARANGAYS.includes(selectedBrgy)) newCity = 'Embo';
    setCurrentPatient((prev) => ({ ...prev, barangay: selectedBrgy, city: newCity }));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const extractedData = await extractPatientInfoFromImage(base64);
        if (extractedData) {
          setCurrentPatient(prev => ({
            ...prev,
            lastName: extractedData.lastName || prev.lastName,
            firstName: extractedData.firstName || prev.firstName,
            middleName: extractedData.middleName || prev.middleName,
            hospitalNumber: extractedData.hospitalNumber || prev.hospitalNumber,
            dob: extractedData.dob || prev.dob,
            sex: extractedData.sex || prev.sex,
          }));
        }
        setScanning(false);
      };
    } catch (error) { setScanning(false); }
  };

  const validatePatientForm = (patient: PatientData) => {
    return patient.lastName && patient.firstName && patient.hospitalNumber && patient.dob;
  };

  const handleAddPatient = () => {
    if (!validatePatientForm(currentPatient)) {
      alert("Please fill in required patient fields.");
      return;
    }
    setPatientList([...patientList, { ...currentPatient, id: Date.now().toString() }]);
    setIsOutsideMakati(false);
    setCurrentPatient({
      id: '', lastName: '', firstName: '', middleName: '', hospitalNumber: '',
      dob: '', age: '', sex: '', barangay: '', city: 'Makati'
    });
  };

  const resetForm = () => {
    setPatientList([]);
    setCurrentPatient({
      id: '', lastName: '', firstName: '', middleName: '', hospitalNumber: '',
      dob: '', age: '', sex: '', barangay: '', city: 'Makati'
    });
    setCommonData({
        dateOfAdmission: '', disease: '', diseaseOther: '', area: '', areaOther: '',
        outcome: 'Admitted', outcomeDate: '', reporterName: '', designation: '', designationOther: '',
        hfmdSymptoms: [], measlesSymptoms: [], chikSymptoms: [], pertSymptoms: [], amesSymptoms: [],
        sariMeds: [], sariAnimalExposure: [], amesVaccines: {}
    });
    setShowThankYou(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const patientsToReport = [...patientList];
    if (currentPatient.lastName || currentPatient.firstName || currentPatient.hospitalNumber) {
        if (validatePatientForm(currentPatient)) {
            patientsToReport.push({ ...currentPatient, id: 'temp-form' });
        } else {
            alert("Please complete the current patient fields or clear them.");
            return;
        }
    }
    if (patientsToReport.length === 0) { alert("Please add at least one patient."); return; }

    setLoading(true);
    
    // Prepare common payload
    const submissionCommon = { ...commonData };
    if (submissionCommon.disease === 'Other (specify)') submissionCommon.disease = submissionCommon.diseaseOther || 'Other Disease';
    if (submissionCommon.area === 'Other (specify)') submissionCommon.area = submissionCommon.areaOther || 'Other Area';
    
    // Cleanup non-DB fields
    delete submissionCommon.diseaseOther;
    delete submissionCommon.areaOther;
    delete submissionCommon.designationOther;

    try {
      for (const patient of patientsToReport) {
          const { id: _, ...patientPayload } = patient;
          await submitReport("Notifiable Disease", { ...submissionCommon, ...patientPayload });
      }
      setShowThankYou(true);
    } catch (err) { 
      const msg = err instanceof Error ? err.message : "Failed to submit.";
      alert(`Submission Failed: ${msg}`); 
    } finally { setLoading(false); }
  };

  return (
    <Layout title="Report Notifiable Disease">
      <button onClick={() => navigate('/')} className="mb-4 flex items-center text-xs font-bold text-gray-500 hover:text-primary transition-colors">
        <ChevronLeft size={14} /> Back to Hub
      </button>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {patientList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2 animate-in fade-in">
                {patientList.map((p) => (
                    <div key={p.id} className="bg-white border-2 border-primary p-3 rounded-xl flex justify-between items-center shadow-md">
                        <div className="truncate">
                            <div className="font-black text-xs text-primary truncate uppercase">{p.lastName}, {p.firstName}</div>
                            <div className="text-[10px] text-gray-400 font-bold">{p.hospitalNumber}</div>
                        </div>
                        <button type="button" onClick={() => setPatientList(patientList.filter(pl => pl.id !== p.id))} className="text-red-400 hover:text-red-600 p-2"><Trash2 size={16} /></button>
                    </div>
                ))}
            </div>
        )}

        {/* 1. Patient Info */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide"><Users size={18} className="text-primary"/> Patient Identification</h3>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={scanning} className="flex items-center gap-2 text-[10px] bg-primary/5 text-primary px-4 py-2 rounded-xl hover:bg-primary/10 transition-all font-black uppercase">
                    {scanning ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />} Scan Document
                </button>
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Input label="Hospital #" name="hospitalNumber" value={currentPatient.hospitalNumber} onChange={handlePatientChange} required={patientList.length === 0} />
                <Input label="Last Name" name="lastName" value={currentPatient.lastName} onChange={handlePatientChange} required={patientList.length === 0} />
                <Input label="First Name" name="firstName" value={currentPatient.firstName} onChange={handlePatientChange} required={patientList.length === 0} />
                <Input label="Middle Name" name="middleName" value={currentPatient.middleName} onChange={handlePatientChange} />
                <Input label="DOB" name="dob" type="date" value={currentPatient.dob} onChange={handlePatientChange} required={currentPatient.hospitalNumber !== ''} />
                <Input label="Age" name="age" value={currentPatient.age} readOnly className="bg-slate-50 font-bold" />
                <Select label="Sex" name="sex" options={['Male', 'Female']} value={currentPatient.sex} onChange={handlePatientChange} required={currentPatient.hospitalNumber !== ''} />
                <div className="flex flex-col justify-end">
                    <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase cursor-pointer mb-2">
                        <input type="checkbox" checked={isOutsideMakati} onChange={handleOutsideMakatiChange} className="rounded text-primary h-4 w-4"/> Outside Makati?
                    </label>
                </div>
                <div className="md:col-span-2">
                    {!isOutsideMakati ? (
                        <Select label="Barangay" name="barangay" options={BARANGAYS} value={currentPatient.barangay} onChange={handleBarangayChange} required={!isOutsideMakati && currentPatient.hospitalNumber !== ''} />
                    ) : (
                        <Input label="Address (Non-Makati)" name="barangay" value={currentPatient.barangay} onChange={handlePatientChange} />
                    )}
                </div>
                <Input label="City/Province" name="city" value={currentPatient.city} onChange={handlePatientChange} readOnly={!isOutsideMakati} className={!isOutsideMakati ? "bg-slate-50" : "bg-white"} required={currentPatient.hospitalNumber !== ''} />
                
                <div className="flex items-end">
                    <button type="button" onClick={handleAddPatient} className="w-full h-10 border-2 border-primary text-primary rounded-xl font-black uppercase text-[10px] hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2">
                        <Plus size={14} /> Add to Batch
                    </button>
                </div>
            </div>
        </div>
        
        {/* 2. Epidemiological Data */}
        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wide"><FileText size={18} className="text-primary"/> Epidemiological & Clinical Case Data</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="lg:col-span-2">
                    <Select label="Reporting Disease" name="disease" options={NOTIFIABLE_DISEASES} value={commonData.disease} onChange={handleCommonChange} required />
                    {commonData.disease === "Other (specify)" && <Input label="Specify Disease" name="diseaseOther" value={commonData.diseaseOther} onChange={handleCommonChange} className="mt-2" />}
                </div>
                <div className="lg:col-span-1">
                    <Select label="Assigned Ward" name="area" options={AREAS} value={commonData.area} onChange={handleCommonChange} required />
                    {commonData.area === "Other (specify)" && <Input label="Specify Ward" name="areaOther" value={commonData.areaOther} onChange={handleCommonChange} className="mt-2" />}
                </div>
                <Input label="Admission Date" name="dateOfAdmission" type="date" value={commonData.dateOfAdmission} onChange={handleCommonChange} required />
            </div>

            {/* --- DISEASE SPECIFIC QUESTIONNAIRES --- */}
            {commonData.disease === "Dengue" && (
                <div className="p-6 bg-red-50/50 rounded-[1.5rem] border border-red-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-red-800 uppercase flex items-center gap-2"><Syringe size={14}/> Dengue Specific Questionnaire</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <Select label="Received Dengue Vaccine?" name="dengueVaccine" options={DENGUE_VACCINE_OPTIONS} value={commonData.dengueVaccine} onChange={handleCommonChange} />
                        {commonData.dengueVaccine === 'Yes' && (
                            <>
                                <Input label="Date of 1st Dose" name="dengueDose1" type="date" value={commonData.dengueDose1} onChange={handleCommonChange} />
                                <Input label="Date of Last Dose" name="dengueDoseLast" type="date" value={commonData.dengueDoseLast} onChange={handleCommonChange} />
                            </>
                        )}
                        <div className="lg:col-span-3">
                            <Select label="Clinical Classification" name="dengueClinicalClass" options={DENGUE_CLINICAL_CLASSES} value={commonData.dengueClinicalClass} onChange={handleCommonChange} />
                        </div>
                    </div>
                </div>
            )}

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-6 rounded-[1.5rem] border border-slate-200">
                <Select label="Patient Disposition" name="outcome" options={PATIENT_OUTCOMES} value={commonData.outcome} onChange={handleCommonChange} />
                {commonData.outcome !== "Admitted" && commonData.outcome !== "ER-level" && (
                    <Input label="Disposition Date" name="outcomeDate" type="date" value={commonData.outcomeDate} onChange={handleCommonChange} required />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-100 pt-6">
                <Input label="Name of Reporter" name="reporterName" value={commonData.reporterName} onChange={handleCommonChange} required />
                <Select label="Professional Designation" name="designation" options={['Doctor', 'Nurse', 'IPC Staff', 'Other (specify)']} value={commonData.designation} onChange={handleCommonChange} required />
                <div className="flex items-end">
                    <button type="submit" disabled={loading} className="w-full h-11 bg-primary text-white rounded-xl font-black uppercase hover:bg-osmak-green-dark transition-all flex items-center justify-center gap-3 shadow-xl">
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Publish Report(s)
                    </button>
                </div>
            </div>
        </div>
      </form>

      <ThankYouModal 
        show={showThankYou} 
        reporterName={commonData.reporterName} 
        moduleName="Notifiable Diseases Registry" 
        onClose={resetForm} 
      />
    </Layout>
  );
};

export default NotifiableDiseaseForm;
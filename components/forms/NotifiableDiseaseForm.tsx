import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { AREAS, NOTIFIABLE_DISEASES, BARANGAYS, EMBO_BARANGAYS, PATIENT_OUTCOMES } from '../../constants';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const reportsToSubmit = [...patientList];
    if (currentPatient.lastName || currentPatient.firstName || currentPatient.hospitalNumber) {
        if (validatePatientForm(currentPatient)) {
            reportsToSubmit.push({ ...currentPatient, id: 'temp-form' });
        } else {
            alert("Please complete the current patient fields or clear them.");
            return;
        }
    }
    if (reportsToSubmit.length === 0) { alert("Please add at least one patient."); return; }

    setLoading(true);
    try {
      for (const patient of reportsToSubmit) {
          const { id: _, ...patientPayload } = patient;
          await submitReport("Notifiable Disease", { ...commonData, ...patientPayload });
      }
      alert(`Successfully submitted ${reportsToSubmit.length} report(s).`);
      navigate('/');
    } catch (error) { 
      console.error("Submission error details:", error);
      let msg = "Failed to submit.";
      if (error instanceof Error) {
        msg = error.message;
      } else if (typeof error === 'object' && error !== null) {
        msg = JSON.stringify(error);
      } else if (typeof error === 'string') {
        msg = error;
      }
      alert(msg); 
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
                        <Select label="Received Dengue Vaccine?" name="dengueVaccine" options={['Yes', 'No']} value={commonData.dengueVaccine} onChange={handleCommonChange} />
                        {commonData.dengueVaccine === 'Yes' && (
                            <>
                                <Input label="Date of 1st Dose" name="dengueDose1" type="date" value={commonData.dengueDose1} onChange={handleCommonChange} />
                                <Input label="Date of Last Dose" name="dengueDoseLast" type="date" value={commonData.dengueDoseLast} onChange={handleCommonChange} />
                            </>
                        )}
                        <div className="lg:col-span-3">
                            <Select label="Clinical Classification" name="dengueClinicalClass" options={['dengue without warning signs', 'dengue with warning signs', 'severe dengue']} value={commonData.dengueClinicalClass} onChange={handleCommonChange} />
                        </div>
                    </div>
                </div>
            )}

            {commonData.disease === "Influenza-like Illness" && (
                <div className="p-6 bg-blue-50/50 rounded-[1.5rem] border border-blue-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-blue-800 uppercase flex items-center gap-2"><Plane size={14}/> ILI Surveillance Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="History of Travel within 21 days?" name="iliTravel" options={['Yes', 'No']} value={commonData.iliTravel} onChange={handleCommonChange} />
                        {commonData.iliTravel === 'Yes' && <Input label="Travel Location" name="iliTravelLoc" value={commonData.iliTravelLoc} onChange={handleCommonChange} />}
                        <Select label="Received Influenza Vaccine?" name="iliVaccine" options={['Yes', 'No']} value={commonData.iliVaccine} onChange={handleCommonChange} />
                        {commonData.iliVaccine === 'Yes' && <Input label="Date of Last Dose (Month & Year)" name="iliVaccineDate" value={commonData.iliVaccineDate} onChange={handleCommonChange} placeholder="e.g. October 2023" />}
                    </div>
                </div>
            )}

            {commonData.disease === "Leptospirosis" && (
                <div className="p-6 bg-amber-50/50 rounded-[1.5rem] border border-amber-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-amber-800 uppercase flex items-center gap-2"><Droplets size={14}/> Leptospirosis Exposure Tracking</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Exposure to contaminated animal urine?" name="leptoExposure" options={['wading in flood waters', 'rice fields', 'drainage', 'No']} value={commonData.leptoExposure} onChange={handleCommonChange} />
                        <Input label="Place of Exposure" name="leptoPlace" value={commonData.leptoPlace} onChange={handleCommonChange} placeholder="Enter specific location" />
                    </div>
                </div>
            )}

            {commonData.disease === "Acute Flaccid Paralysis (Poliomyelitis)" && (
                <div className="p-6 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100 animate-in slide-in-from-top-2">
                    <div className="max-w-xs">
                        <Select label="Polio Vaccine Given?" name="afpPolioVaccine" options={['Yes', 'No', 'Unknown']} value={commonData.afpPolioVaccine} onChange={handleCommonChange} />
                    </div>
                </div>
            )}

            {commonData.disease === "Hand, Foot and Mouth Disease" && (
                <div className="p-6 bg-orange-50/50 rounded-[1.5rem] border border-orange-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-orange-800 uppercase flex items-center gap-2"><Activity size={14}/> HFMD Symptom Assessment</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['Fever', 'Rash: Palms', 'Rash: Fingers', 'Rash: Sole of Feet', 'Rash: Buttocks', 'Rash: Mouth Ulcers', 'Painful', 'Maculopapular', 'Papulovesicular', 'Loss of Appetite', 'Body Malaise', 'Sore throat', 'Nausea or vomiting', 'Difficulty of Breathing'].map(sym => (
                            <label key={sym} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-orange-200 cursor-pointer hover:bg-orange-50">
                                <input type="checkbox" checked={commonData.hfmdSymptoms.includes(sym)} onChange={() => handleCheckboxList('hfmdSymptoms', sym)} className="rounded text-orange-500" /> {sym}
                            </label>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <Select label="Known Cases in Community?" name="hfmdCommunityCases" options={['Yes', 'No', 'Unknown']} value={commonData.hfmdCommunityCases} onChange={handleCommonChange} />
                        <Select label="Exposure Site Type" name="hfmdExposureType" options={['Day Care', 'Home', 'Community', 'Health Facility', 'School', 'Dormitory', 'Others']} value={commonData.hfmdExposureType} onChange={handleCommonChange} />
                    </div>
                </div>
            )}

            {commonData.disease === "Measles" && (
                <div className="p-6 bg-rose-50/50 rounded-[1.5rem] border border-rose-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-rose-800 uppercase flex items-center gap-2"><Activity size={14}/> Measles Clinical Checklist</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['Fever', 'Rash', 'Cough', 'Koplik Sign', 'Coryza', 'Conjunctivitis', 'Arthritis', 'Swollen Lymphatic'].map(sym => (
                            <label key={sym} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-rose-200 cursor-pointer">
                                <input type="checkbox" checked={commonData.measlesSymptoms.includes(sym)} onChange={() => handleCheckboxList('measlesSymptoms', sym)} className="rounded text-rose-500" /> {sym}
                            </label>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <Select label="Received Measles Vaccine?" name="measlesVaccine" options={['Yes', 'No', 'Unknown']} value={commonData.measlesVaccine} onChange={handleCommonChange} />
                        {commonData.measlesVaccine === 'Yes' && <Input label="Date of Last Dose (Date or Unrecalled)" name="measlesVaccineDate" value={commonData.measlesVaccineDate} onChange={handleCommonChange} />}
                    </div>
                </div>
            )}

            {commonData.disease === "Rotavirus" && (
                <div className="p-6 bg-indigo-50/50 rounded-[1.5rem] border border-indigo-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Received Rotavirus Vaccine?" name="rotaVaccine" options={['Yes', 'No', 'Unknown']} value={commonData.rotaVaccine} onChange={handleCommonChange} />
                        {commonData.rotaVaccine === 'Yes' && <Input label="Date of Last Dose (Date or Unrecalled)" name="rotaVaccineDate" value={commonData.rotaVaccineDate} onChange={handleCommonChange} />}
                    </div>
                </div>
            )}

            {commonData.disease === "Rabies" && (
                <div className="p-6 bg-slate-900 rounded-[1.5rem] text-white flex flex-col gap-5 animate-in slide-in-from-top-2 shadow-xl">
                    <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><ShieldCheck size={14} className="text-red-500" /> Rabies Post-Exposure Log</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select label="Received Immunoglobulin?" name="rabiesRIG" options={['Yes', 'No']} value={commonData.rabiesRIG} onChange={handleCommonChange} className="bg-slate-800 text-white border-slate-700" />
                        <Select label="Completed Prior Vaccine?" name="rabiesVaccinePrior" options={['Yes', 'No']} value={commonData.rabiesVaccinePrior} onChange={handleCommonChange} className="bg-slate-800 text-white border-slate-700" />
                        <Input label="Month & Year 1st Dose" name="rabiesVaccineDate" value={commonData.rabiesVaccineDate} onChange={handleCommonChange} className="bg-slate-800 text-white border-slate-700" placeholder="MM/YYYY" />
                    </div>
                </div>
            )}

            {commonData.disease === "Chikungunya Viral Disease" && (
                <div className="p-6 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-emerald-800 uppercase flex items-center gap-2"><Activity size={14}/> Chikungunya Symptom Checklist</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['Fever', 'Arthritis', 'Arthalgia', 'Periarticular edema', 'Skin manifestations', 'Myalgia', 'Back Pain', 'Headache', 'Nausea', 'Mucosal Bleeding', 'Vomiting', 'Asthenia', 'Meningoencephalitis'].map(sym => (
                            <label key={sym} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-emerald-200 cursor-pointer">
                                <input type="checkbox" checked={commonData.chikSymptoms.includes(sym)} onChange={() => handleCheckboxList('chikSymptoms', sym)} className="rounded text-emerald-500" /> {sym}
                            </label>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                        <Select label="Travel within 30 days?" name="chikTravel" options={['Yes', 'No']} value={commonData.chikTravel} onChange={handleCommonChange} />
                        {commonData.chikTravel === 'Yes' && <Input label="Destination" name="chikTravelLoc" value={commonData.chikTravelLoc} onChange={handleCommonChange} />}
                    </div>
                </div>
            )}

            {commonData.disease === "Pertussis" && (
                <div className="p-6 bg-teal-50/50 rounded-[1.5rem] border border-teal-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-teal-800 uppercase flex items-center gap-2"><Activity size={14}/> Pertussis Assessment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="Received Vaccine?" name="pertVaccine" options={['Yes', 'No', 'Unknown']} value={commonData.pertVaccine} onChange={handleCommonChange} />
                        {commonData.pertVaccine === 'Yes' && <Input label="Last Dose (Date/Unrecalled)" name="pertVaccineDate" value={commonData.pertVaccineDate} onChange={handleCommonChange} />}
                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                            {['Post tussive vomiting', 'Cough lasting at least 2 weeks', 'Apnea', 'Paroxysms of coughing', 'Inspiratory whooping'].map(sym => (
                                <label key={sym} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-teal-200 cursor-pointer">
                                    <input type="checkbox" checked={commonData.pertSymptoms.includes(sym)} onChange={() => handleCheckboxList('pertSymptoms', sym)} className="rounded text-teal-500" /> {sym}
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {(commonData.disease === "Acute Meningitis Encephalitis Syndrome" || commonData.disease === "Bacterial Meningitis") && (
                <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200 flex flex-col gap-6 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2"><ShieldCheck size={14}/> AMES - Bacterial Meningitis Questionnaire</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {['Fever', 'Altered Mental', 'New Seizures', 'Stiff Neck', 'Meningeal Signs', 'CNS Infection', 'CNS Others'].map(sym => (
                            <label key={sym} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-slate-300 cursor-pointer">
                                <input type="checkbox" checked={commonData.amesSymptoms.includes(sym)} onChange={() => handleCheckboxList('amesSymptoms', sym)} className="rounded text-slate-700" /> {sym}
                            </label>
                        ))}
                    </div>
                    <div className="flex flex-col gap-3">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-1">Comprehensive Vaccination History</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {['Japanese Encephalitis', 'Penta HIB', 'Measles', 'Meningococcal', 'Pneumococcal', 'PCV 10', 'PCV 13'].map(v => (
                                <div key={v} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
                                    <span className="text-[10px] font-black text-slate-800 leading-tight uppercase">{v}</span>
                                    <Input label="No. of Doses" value={commonData.amesVaccines[v]?.doses || ''} onChange={e => handleAmesVaccine(v, 'doses', e.target.value)} />
                                    <Input label="Last Dose Date" type="date" value={commonData.amesVaccines[v]?.lastDate || ''} onChange={e => handleAmesVaccine(v, 'lastDate', e.target.value)} />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="History of Travel?" name="amesTravel" options={['Yes', 'No']} value={commonData.amesTravel} onChange={handleCommonChange} />
                        {commonData.amesTravel === 'Yes' && <Input label="Specify Destination" name="amesTravelLoc" value={commonData.amesTravelLoc} onChange={handleCommonChange} />}
                    </div>
                </div>
            )}

            {commonData.disease === "Severe Acute Respiratory Infection" && (
                <div className="p-6 bg-sky-50 rounded-[1.5rem] border border-sky-100 flex flex-col gap-6 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-sky-800 uppercase flex items-center gap-2"><Wind size={14}/> SARI Surveillance Criteria</h4>
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medications prior to consultation</label>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                            {['Ranitidine', 'Amantidine', 'Zanamivir', 'Oseltamivir'].map(med => (
                                <label key={med} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-sky-200 cursor-pointer">
                                    <input type="checkbox" checked={commonData.sariMeds.includes(med)} onChange={() => handleCheckboxList('sariMeds', med)} className="rounded text-sky-500" /> {med}
                                </label>
                            ))}
                            <Input label="Others (specify)" name="sariMedsOther" value={commonData.sariMedsOther} onChange={handleCommonChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Select label="ILI in Household?" name="sariHouseholdILI" options={['Yes', 'No']} value={commonData.sariHouseholdILI} onChange={handleCommonChange} />
                        <Select label="ILI in School/Daycare?" name="sariSchoolILI" options={['Yes', 'No']} value={commonData.sariSchoolILI} onChange={handleCommonChange} />
                        <Select label="Flu vaccine (last year)?" name="sariFluVaccine" options={['Yes', 'No']} value={commonData.sariFluVaccine} onChange={handleCommonChange} />
                    </div>
                    <div className="flex flex-col gap-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">History of exposure to:</label>
                        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                            {['Bats', 'Poultry/Migratory Birds', 'Camels', 'Pigs', 'Horses'].map(ani => (
                                <label key={ani} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-sky-200 cursor-pointer">
                                    <input type="checkbox" checked={commonData.sariAnimalExposure.includes(ani)} onChange={() => handleCheckboxList('sariAnimalExposure', ani)} className="rounded text-sky-500" /> {ani}
                                </label>
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Select label="History of Travel?" name="sariTravel" options={['Yes', 'No']} value={commonData.sariTravel} onChange={handleCommonChange} />
                        {commonData.sariTravel === 'Yes' && <Input label="Destination" name="sariTravelLoc" value={commonData.sariTravelLoc} onChange={handleCommonChange} />}
                    </div>
                </div>
            )}

            {/* --- END DISEASE SPECIFIC SECTIONS --- */}

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
    </Layout>
  );
};

export default NotifiableDiseaseForm;
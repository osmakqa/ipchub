
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { AREAS, NOTIFIABLE_DISEASES, BARANGAYS, EMBO_BARANGAYS, PATIENT_OUTCOMES } from '../../constants';
import { submitReport, calculateAge, extractPatientInfoFromImage } from '../../services/ipcService';
import { ChevronLeft, Send, Loader2, Camera, Plus, Trash2, Users, FileText, MapPin, Activity, Syringe, Plane, AlertTriangle, ShieldCheck } from 'lucide-react';

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
    // Dengue
    dengueNS1: '', dengueIgG: '', dengueIgM: '',
    dengueVaccine: '', dengueDose1: '', dengueDoseLast: '', dengueClinicalClass: '',
    // ILI
    iliTravel: '', iliTravelLoc: '', iliVaccine: '', iliVaccineDate: '',
    // Lepto
    leptoExposure: '', leptoPlace: '',
    // AFP
    afpPolioVaccine: '',
    // HFMD
    hfmdSymptoms: [] as string[], hfmdCommunityCases: '', hfmdExposureType: '',
    // Measles
    measlesSymptoms: [] as string[], measlesVaccine: '', measlesVaccineDate: '',
    // Rotavirus
    rotaVaccine: '', rotaVaccineDate: '',
    // Rabies
    rabiesRIG: '', rabiesVaccinePrior: '', rabiesVaccineDate: '',
    // Chikungunya
    chikSymptoms: [] as string[], chikTravel: '', chikTravelLoc: '',
    // Pertussis
    pertVaccine: '', pertVaccineDate: '', pertSymptoms: [] as string[],
    // AMES
    amesSymptoms: [] as string[], amesTravel: '', amesTravelLoc: '',
    amesVaccines: {} as Record<string, { doses: string, lastDate: string }>,
    // SARI
    sariMeds: [] as string[], sariHouseholdILI: '', sariSchoolILI: '', sariFluVaccine: '', sariAnimalExposure: [] as string[], sariTravel: '', sariTravelLoc: ''
  });

  const [currentPatient, setCurrentPatient] = useState<PatientData>({
    id: '',
    lastName: '',
    firstName: '',
    middleName: '',
    hospitalNumber: '',
    dob: '',
    age: '',
    sex: '',
    barangay: '',
    city: 'Makati'
  });

  const [patientList, setPatientList] = useState<PatientData[]>([]);

  useEffect(() => {
    if (currentPatient.dob) {
      setCurrentPatient(prev => ({ ...prev, age: calculateAge(prev.dob) }));
    }
  }, [currentPatient.dob]);

  const handleCommonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
    setCurrentPatient((prev) => ({
      ...prev,
      barangay: '', 
      city: checked ? '' : 'Makati' 
    }));
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
    if (currentPatient.lastName && validatePatientForm(currentPatient)) {
        reportsToSubmit.push({ ...currentPatient, id: 'current' });
    }
    if (reportsToSubmit.length === 0) { alert("Please add at least one patient."); return; }
    setLoading(true);
    try {
      for (const patient of reportsToSubmit) {
          await submitReport("Notifiable Disease", { ...commonData, ...patient });
      }
      alert(`Successfully submitted ${reportsToSubmit.length} report(s).`);
      navigate('/');
    } catch (error) { alert("Failed to submit."); } finally { setLoading(false); }
  };

  return (
    <Layout title="Report Notifiable Disease">
      <button onClick={() => navigate('/')} className="mb-4 flex items-center text-xs font-bold text-gray-500 hover:text-[var(--osmak-green)] transition-colors">
        <ChevronLeft size={14} /> Back
      </button>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {patientList.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {patientList.map((p) => (
                    <div key={p.id} className="bg-white border border-gray-200 p-2 rounded-lg flex justify-between items-center shadow-sm">
                        <div className="truncate">
                            <div className="font-bold text-xs text-[var(--osmak-green-dark)] truncate">{p.lastName}, {p.firstName}</div>
                            <div className="text-[10px] text-gray-400 font-bold uppercase">{p.hospitalNumber}</div>
                        </div>
                        <button type="button" onClick={() => setPatientList(patientList.filter(pl => pl.id !== p.id))} className="text-red-400 hover:text-red-600 p-1"><Trash2 size={14} /></button>
                    </div>
                ))}
            </div>
        )}

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 uppercase tracking-wide"><Users size={18} className="text-primary"/> Patient Information</h3>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={scanning} className="flex items-center gap-2 text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-black uppercase">
                    {scanning ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />} Scan ID
                </button>
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Input label="Hosp #" name="hospitalNumber" value={currentPatient.hospitalNumber} onChange={handlePatientChange} required />
                <Input label="Last Name" name="lastName" value={currentPatient.lastName} onChange={handlePatientChange} required />
                <Input label="First Name" name="firstName" value={currentPatient.firstName} onChange={handlePatientChange} required />
                <Input label="Middle" name="middleName" value={currentPatient.middleName} onChange={handlePatientChange} />
                <Input label="DOB" name="dob" type="date" value={currentPatient.dob} onChange={handlePatientChange} required />
                <Input label="Age" name="age" value={currentPatient.age} readOnly className="bg-gray-50" />
                <Select label="Sex" name="sex" options={['Male', 'Female']} value={currentPatient.sex} onChange={handlePatientChange} required />
                <div className="md:col-span-1 lg:col-span-1 flex flex-col justify-end">
                    <label className="flex items-center gap-2 text-[10px] font-bold text-gray-500 uppercase cursor-pointer mb-2">
                        <input type="checkbox" checked={isOutsideMakati} onChange={handleOutsideMakatiChange} className="rounded text-primary h-4 w-4"/> Outside Makati?
                    </label>
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                    {!isOutsideMakati ? (
                        <Select label="Barangay" name="barangay" options={BARANGAYS} value={currentPatient.barangay} onChange={handleBarangayChange} required={!isOutsideMakati} />
                    ) : (
                        <Input label="Barangay / Location" name="barangay" value={currentPatient.barangay} onChange={handlePatientChange} />
                    )}
                </div>
                <Input label="City" name="city" value={currentPatient.city} onChange={handlePatientChange} readOnly={!isOutsideMakati} className={!isOutsideMakati ? "bg-gray-100" : "bg-white"} required />
                
                <div className="flex items-end">
                    <button type="button" onClick={handleAddPatient} className="w-full h-9 text-[10px] border-2 border-primary text-primary rounded-lg font-black uppercase hover:bg-primary hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                        <Plus size={14} /> Add Patient
                    </button>
                </div>
            </div>
        </div>
        
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide"><FileText size={18} className="text-primary"/> Case Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="lg:col-span-2">
                    <Select label="Disease" name="disease" options={NOTIFIABLE_DISEASES} value={commonData.disease} onChange={handleCommonChange} required />
                    {commonData.disease === "Other (specify)" && <Input label="Specify Disease" name="diseaseOther" value={commonData.diseaseOther} onChange={handleCommonChange} className="mt-2" />}
                </div>
                <div className="lg:col-span-1">
                    <Select label="Ward" name="area" options={AREAS} value={commonData.area} onChange={handleCommonChange} required />
                    {commonData.area === "Other (specify)" && <Input label="Specify Ward" name="areaOther" value={commonData.areaOther} onChange={handleCommonChange} className="mt-2" />}
                </div>
                <Input label="Adm. Date" name="dateOfAdmission" type="date" value={commonData.dateOfAdmission} onChange={handleCommonChange} required />

                {/* --- DISEASE SPECIFIC SECTIONS --- */}
                
                {/* 1. DENGUE */}
                {commonData.disease === "Dengue" && (
                    <div className="lg:col-span-4 bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col gap-4 animate-in fade-in">
                        <h4 className="text-xs font-black text-red-800 uppercase flex items-center gap-2"><Activity size={14}/> Dengue Specifics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Select label="NS1 Result" name="dengueNS1" options={['Positive', 'Negative', 'Not Done']} value={commonData.dengueNS1} onChange={handleCommonChange} />
                            <Select label="IgG Result" name="dengueIgG" options={['Positive', 'Negative', 'Not Done']} value={commonData.dengueIgG} onChange={handleCommonChange} />
                            <Select label="IgM Result" name="dengueIgM" options={['Positive', 'Negative', 'Not Done']} value={commonData.dengueIgM} onChange={handleCommonChange} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-red-200 pt-3">
                            <Select label="Received Dengue Vaccine?" name="dengueVaccine" options={['Yes', 'No']} value={commonData.dengueVaccine} onChange={handleCommonChange} />
                            <Select label="Clinical Classification" name="dengueClinicalClass" options={['Dengue without warning signs', 'Dengue with warning signs', 'Severe Dengue']} value={commonData.dengueClinicalClass} onChange={handleCommonChange} />
                            {commonData.dengueVaccine === 'Yes' && (
                                <>
                                    <Input label="Date of 1st Dose" name="dengueDose1" type="date" value={commonData.dengueDose1} onChange={handleCommonChange} />
                                    <Input label="Date of Last Dose" name="dengueDoseLast" type="date" value={commonData.dengueDoseLast} onChange={handleCommonChange} />
                                </>
                            )}
                        </div>
                    </div>
                )}

                {/* 2. INFLUENZA LIKE ILLNESS (ILI) */}
                {commonData.disease === "Influenza-like Illness" && (
                    <div className="lg:col-span-4 bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-col gap-4 animate-in fade-in">
                        <h4 className="text-xs font-black text-blue-800 uppercase flex items-center gap-2"><Plane size={14}/> ILI Specifics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Select label="History of Travel (21 days)" name="iliTravel" options={['Yes', 'No']} value={commonData.iliTravel} onChange={handleCommonChange} />
                            {commonData.iliTravel === 'Yes' && <Input label="Where?" name="iliTravelLoc" value={commonData.iliTravelLoc} onChange={handleCommonChange} />}
                            <Select label="Influenza Vaccine?" name="iliVaccine" options={['Yes', 'No']} value={commonData.iliVaccine} onChange={handleCommonChange} />
                            {commonData.iliVaccine === 'Yes' && <Input label="Date of Last Dose (Month/Year)" name="iliVaccineDate" type="month" value={commonData.iliVaccineDate} onChange={handleCommonChange} />}
                        </div>
                    </div>
                )}

                {/* 3. LEPTOSPIROSIS */}
                {commonData.disease === "Leptospirosis" && (
                    <div className="lg:col-span-4 bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex flex-col gap-4 animate-in fade-in">
                        <h4 className="text-xs font-black text-yellow-800 uppercase flex items-center gap-2"><AlertTriangle size={14}/> Leptospirosis Specifics</h4>
                        <div className="grid grid-cols-1 gap-3">
                            <Select label="Exposure to contaminated water/urine?" name="leptoExposure" options={['Yes', 'No']} value={commonData.leptoExposure} onChange={handleCommonChange} />
                            {commonData.leptoExposure === 'Yes' && <Input label="Place of Exposure" name="leptoPlace" value={commonData.leptoPlace} onChange={handleCommonChange} placeholder="e.g. Flood waters, Rice field" />}
                        </div>
                    </div>
                )}

                {/* 4. ACUTE FLACCID PARALYSIS */}
                {commonData.disease === "Acute Flaccid Paralysis (Poliomyelitis)" && (
                    <div className="lg:col-span-4 bg-purple-50 p-4 rounded-xl border border-purple-100 animate-in fade-in">
                        <h4 className="text-xs font-black text-purple-800 uppercase mb-2"><Syringe size={14} className="inline mr-1"/> AFP Specifics</h4>
                        <Select label="Polio Vaccine Given?" name="afpPolioVaccine" options={['Yes', 'No', 'Unknown']} value={commonData.afpPolioVaccine} onChange={handleCommonChange} />
                    </div>
                )}

                {/* 5. HFMD */}
                {commonData.disease === "Hand, Foot and Mouth Disease" && (
                    <div className="lg:col-span-4 bg-orange-50 p-4 rounded-xl border border-orange-100 flex flex-col gap-4 animate-in fade-in">
                        <h4 className="text-xs font-black text-orange-800 uppercase flex items-center gap-2"><Activity size={14}/> HFMD Checklist</h4>
                        <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Symptoms</span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                                {['Fever', 'Rash (Palms/Soles)', 'Mouth Ulcers', 'Painful Rash', 'Maculopapular', 'Papulovesicular', 'Loss of Appetite', 'Malaise', 'Sore Throat', 'Vomiting', 'Diff. Breathing'].map(sym => (
                                    <label key={sym} className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded border border-orange-100"><input type="checkbox" checked={commonData.hfmdSymptoms.includes(sym)} onChange={() => handleCheckboxList('hfmdSymptoms', sym)} className="rounded text-orange-500" /> {sym}</label>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Select label="Known Community Cases?" name="hfmdCommunityCases" options={['Yes', 'No']} value={commonData.hfmdCommunityCases} onChange={handleCommonChange} />
                            <Select label="Exposure Setting" name="hfmdExposureType" options={['Day Care', 'Home', 'Community', 'School', 'Dormitory', 'Other']} value={commonData.hfmdExposureType} onChange={handleCommonChange} />
                        </div>
                    </div>
                )}

                {/* 6. MEASLES */}
                {commonData.disease === "Measles" && (
                    <div className="lg:col-span-4 bg-red-50 p-4 rounded-xl border border-red-100 flex flex-col gap-4 animate-in fade-in">
                        <h4 className="text-xs font-black text-red-800 uppercase flex items-center gap-2"><Activity size={14}/> Measles Checklist</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {['Fever', 'Rash', 'Cough', 'Koplik Spots', 'Coryza', 'Conjunctivitis', 'Arthritis', 'Swollen Lymphatics'].map(sym => (
                                <label key={sym} className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded border border-red-100"><input type="checkbox" checked={commonData.measlesSymptoms.includes(sym)} onChange={() => handleCheckboxList('measlesSymptoms', sym)} className="rounded text-red-500" /> {sym}</label>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-red-200 pt-3">
                            <Select label="Measles Vaccine?" name="measlesVaccine" options={['Yes', 'No']} value={commonData.measlesVaccine} onChange={handleCommonChange} />
                            {commonData.measlesVaccine === 'Yes' && <Input label="Date of Last Dose (or type 'Unrecalled')" name="measlesVaccineDate" value={commonData.measlesVaccineDate} onChange={handleCommonChange} />}
                        </div>
                    </div>
                )}

                {/* 7. ROTAVIRUS */}
                {commonData.disease === "Rotavirus" && (
                    <div className="lg:col-span-4 bg-teal-50 p-4 rounded-xl border border-teal-100 flex flex-col gap-3 animate-in fade-in">
                        <h4 className="text-xs font-black text-teal-800 uppercase flex items-center gap-2"><Syringe size={14}/> Rotavirus History</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Select label="Rotavirus Vaccine?" name="rotaVaccine" options={['Yes', 'No']} value={commonData.rotaVaccine} onChange={handleCommonChange} />
                            {commonData.rotaVaccine === 'Yes' && <Input label="Date of Last Dose (or type 'Unrecalled')" name="rotaVaccineDate" value={commonData.rotaVaccineDate} onChange={handleCommonChange} />}
                        </div>
                    </div>
                )}

                {/* 8. RABIES */}
                {commonData.disease === "Rabies" && (
                    <div className="lg:col-span-4 bg-slate-100 p-4 rounded-xl border border-slate-200 flex flex-col gap-3 animate-in fade-in">
                        <h4 className="text-xs font-black text-slate-700 uppercase flex items-center gap-2"><ShieldCheck size={14}/> Rabies History</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Select label="Received RIG?" name="rabiesRIG" options={['Yes', 'No']} value={commonData.rabiesRIG} onChange={handleCommonChange} />
                            <Select label="Completed Prior Vaccine?" name="rabiesVaccinePrior" options={['Yes', 'No']} value={commonData.rabiesVaccinePrior} onChange={handleCommonChange} />
                            {commonData.rabiesVaccinePrior === 'Yes' && <Input label="Date of 1st Dose (Month/Year)" name="rabiesVaccineDate" type="month" value={commonData.rabiesVaccineDate} onChange={handleCommonChange} />}
                        </div>
                    </div>
                )}

                {/* 9. CHIKUNGUNYA */}
                {commonData.disease === "Chikungunya Viral Disease" && (
                    <div className="lg:col-span-4 bg-amber-50 p-4 rounded-xl border border-amber-100 flex flex-col gap-4 animate-in fade-in">
                        <h4 className="text-xs font-black text-amber-800 uppercase">Chikungunya Specifics</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {['Fever', 'Arthritis', 'Arthralgia', 'Periarticular Edema', 'Rash', 'Myalgia', 'Back Pain', 'Headache', 'Nausea/Vomiting', 'Mucosal Bleed', 'Meningoenceph'].map(sym => (
                                <label key={sym} className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded border border-amber-100"><input type="checkbox" checked={commonData.chikSymptoms.includes(sym)} onChange={() => handleCheckboxList('chikSymptoms', sym)} className="rounded text-amber-500" /> {sym}</label>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-amber-200 pt-3">
                            <Select label="Travel within 30 days?" name="chikTravel" options={['Yes', 'No']} value={commonData.chikTravel} onChange={handleCommonChange} />
                            {commonData.chikTravel === 'Yes' && <Input label="Specify Place" name="chikTravelLoc" value={commonData.chikTravelLoc} onChange={handleCommonChange} />}
                        </div>
                    </div>
                )}

                {/* 10. PERTUSSIS */}
                {commonData.disease === "Pertussis" && (
                    <div className="lg:col-span-4 bg-indigo-50 p-4 rounded-xl border border-indigo-100 flex flex-col gap-4 animate-in fade-in">
                        <h4 className="text-xs font-black text-indigo-800 uppercase flex items-center gap-2"><Activity size={14}/> Pertussis Checklist</h4>
                        <div className="grid grid-cols-2 gap-2">
                            {['Post-tussive vomiting', 'Cough > 2 weeks', 'Apnea', 'Paroxysms of coughing', 'Inspiratory whooping'].map(sym => (
                                <label key={sym} className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded border border-indigo-100"><input type="checkbox" checked={commonData.pertSymptoms.includes(sym)} onChange={() => handleCheckboxList('pertSymptoms', sym)} className="rounded text-indigo-500" /> {sym}</label>
                            ))}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-indigo-200 pt-3">
                            <Select label="Pertussis Vaccine?" name="pertVaccine" options={['Yes', 'No']} value={commonData.pertVaccine} onChange={handleCommonChange} />
                            {commonData.pertVaccine === 'Yes' && <Input label="Date of Last Dose (or type 'Unrecalled')" name="pertVaccineDate" value={commonData.pertVaccineDate} onChange={handleCommonChange} />}
                        </div>
                    </div>
                )}

                {/* 11. AMES / MENINGITIS */}
                {(commonData.disease === "Bacterial Meningitis" || commonData.disease === "Acute Encephalitis Syndrome" || commonData.disease === "Meningococcal Disease") && (
                    <div className="lg:col-span-4 bg-rose-50 p-4 rounded-xl border border-rose-100 flex flex-col gap-4 animate-in fade-in">
                        <h4 className="text-xs font-black text-rose-800 uppercase flex items-center gap-2"><Activity size={14}/> AMES / Meningitis Data</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {['Fever', 'Altered Mental Status', 'New Seizures', 'Stiff Neck', 'Meningeal Signs', 'CNS Infection'].map(sym => (
                                <label key={sym} className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded border border-rose-100"><input type="checkbox" checked={commonData.amesSymptoms.includes(sym)} onChange={() => handleCheckboxList('amesSymptoms', sym)} className="rounded text-rose-500" /> {sym}</label>
                            ))}
                        </div>
                        <div className="mt-2">
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Vaccination History</span>
                            <div className="overflow-x-auto mt-1">
                                <table className="w-full text-xs bg-white rounded border border-rose-100">
                                    <thead className="bg-rose-100"><tr><th className="p-2 text-left">Vaccine</th><th className="p-2 text-center">No. Doses</th><th className="p-2 text-center">Date Last Dose</th></tr></thead>
                                    <tbody>
                                        {['Japanese Encephalitis', 'Penta HIB', 'Measles', 'Meningococcal', 'Pneumococcal', 'PCV 10', 'PCV 13'].map(v => (
                                            <tr key={v} className="border-t border-rose-50">
                                                <td className="p-2 font-bold text-gray-700">{v}</td>
                                                <td className="p-1"><input className="w-full border border-gray-200 rounded px-2 py-1" value={commonData.amesVaccines?.[v]?.doses || ''} onChange={(e) => handleAmesVaccine(v, 'doses', e.target.value)} /></td>
                                                <td className="p-1"><input className="w-full border border-gray-200 rounded px-2 py-1" type="date" value={commonData.amesVaccines?.[v]?.lastDate || ''} onChange={(e) => handleAmesVaccine(v, 'lastDate', e.target.value)} /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-rose-200 pt-3">
                            <Select label="Travel?" name="amesTravel" options={['Yes', 'No']} value={commonData.amesTravel} onChange={handleCommonChange} />
                            {commonData.amesTravel === 'Yes' && <Input label="Specify Place" name="amesTravelLoc" value={commonData.amesTravelLoc} onChange={handleCommonChange} />}
                        </div>
                    </div>
                )}

                {/* 12. SARI */}
                {commonData.disease === "Severe Acute Respiratory Syndrome" && (
                    <div className="lg:col-span-4 bg-gray-100 p-4 rounded-xl border border-gray-200 flex flex-col gap-4 animate-in fade-in">
                        <h4 className="text-xs font-black text-gray-700 uppercase">SARI / Severe Respiratory Data</h4>
                        <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Medications Prior to Consult</span>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-1">
                                {['Ranitidine', 'Amantidine', 'Zanamivir', 'Oseltamivir (Tamiflu)', 'Other'].map(med => (
                                    <label key={med} className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded border border-gray-200"><input type="checkbox" checked={commonData.sariMeds.includes(med)} onChange={() => handleCheckboxList('sariMeds', med)} className="rounded text-gray-500" /> {med}</label>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <Select label="Household ILI Cases?" name="sariHouseholdILI" options={['Yes', 'No']} value={commonData.sariHouseholdILI} onChange={handleCommonChange} />
                            <Select label="School/Daycare ILI?" name="sariSchoolILI" options={['Yes', 'No']} value={commonData.sariSchoolILI} onChange={handleCommonChange} />
                            <Select label="Flu Vaccine (Past Year)?" name="sariFluVaccine" options={['Yes', 'No']} value={commonData.sariFluVaccine} onChange={handleCommonChange} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-gray-500 uppercase">Animal Exposure</span>
                            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-1">
                                {['Bats', 'Poultry/Birds', 'Camels', 'Pigs', 'Horses'].map(anim => (
                                    <label key={anim} className="flex items-center gap-2 text-xs text-gray-700 bg-white p-2 rounded border border-gray-200"><input type="checkbox" checked={commonData.sariAnimalExposure.includes(anim)} onChange={() => handleCheckboxList('sariAnimalExposure', anim)} className="rounded text-gray-500" /> {anim}</label>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-gray-300 pt-3">
                            <Select label="Travel History?" name="sariTravel" options={['Yes', 'No']} value={commonData.sariTravel} onChange={handleCommonChange} />
                            {commonData.sariTravel === 'Yes' && <Input label="Specify Place" name="sariTravelLoc" value={commonData.sariTravelLoc} onChange={handleCommonChange} />}
                        </div>
                    </div>
                )}

                <div className="lg:col-span-2">
                  <Select label="Current Outcome" name="outcome" options={PATIENT_OUTCOMES} value={commonData.outcome} onChange={handleCommonChange} />
                </div>
                {commonData.outcome !== "Admitted" && commonData.outcome !== "ER-level" && (
                  <Input label="Outcome Date" name="outcomeDate" type="date" value={commonData.outcomeDate} onChange={handleCommonChange} required />
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 border-t pt-4">
                <Input label="Reporter Name" name="reporterName" value={commonData.reporterName} onChange={handleCommonChange} required />
                <div className="md:col-span-1">
                    <Select label="Designation" name="designation" options={['Doctor', 'Nurse', 'Other (specify)']} value={commonData.designation} onChange={handleCommonChange} required />
                    {commonData.designation === "Other (specify)" && <Input label="Specify" name="designationOther" value={commonData.designationOther} onChange={handleCommonChange} className="mt-2" />}
                </div>
                <div className="flex items-end">
                    <button type="submit" disabled={loading} className="w-full h-10 bg-primary text-white rounded-lg font-black uppercase hover:bg-[var(--osmak-green-dark)] transition-all flex items-center justify-center gap-2 shadow-lg">
                        {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                        Submit Batch
                    </button>
                </div>
            </div>
        </div>
      </form>
    </Layout>
  );
};

export default NotifiableDiseaseForm;

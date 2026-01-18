
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ThankYouModal from '../ui/ThankYouModal';
import { 
  AREAS, BARANGAYS, EMBO_BARANGAYS, CIVIL_STATUS, PTB_OUTCOMES, COMORBIDITIES 
} from '../../constants';
import { submitReport, calculateAge, extractPatientInfoFromImage } from '../../services/ipcService';
import { 
  ChevronLeft, Send, Loader2, Camera, User, Activity, Stethoscope, MapPin, 
  Beaker, FileText, Plus, Trash2, Users, Pill, ShieldCheck, Clock, Heart, 
  Search, Info, AlertTriangle, ClipboardList
} from 'lucide-react';

const PTBForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isOutsideMakati, setIsOutsideMakati] = useState(false);

  const [formData, setFormData] = useState<any>({
    lastName: '', firstName: '', middleName: '', dob: '', age: '', sex: '', civilStatus: '', hospitalNumber: '', 
    barangay: '', city: 'Makati', 
    dateOfAdmission: '', area: '', areaOther: '', 
    movementHistory: [] as { area: string, date: string }[],
    xpertResults: [] as { date: string, specimen: string, result: string }[],
    smearResults: [] as { date: string, specimen: string, result: string }[],
    cxrDate: '',
    classification: '', anatomicalSite: 'Pulmonary', drugSusceptibility: '', treatmentHistory: '', 
    emergencySurgicalProcedure: '',
    outcome: 'Admitted', outcomeDate: '',
    treatmentStarted: '', treatmentStartDate: '', 
    comorbidities: [] as string[], 
    hivTestResult: '', startedOnArt: '', 
    reporterName: '', designation: ''
  });

  useEffect(() => { 
    if (formData.dob) {
      setFormData((prev: any) => ({ ...prev, age: calculateAge(prev.dob) }));
    }
  }, [formData.dob]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
        lastName: '', firstName: '', middleName: '', dob: '', hospitalNumber: '', 
        barangay: '', city: 'Makati', movementHistory: [], xpertResults: [],
        smearResults: [], classification: '', reporterName: '', designation: '',
        comorbidities: [], outcome: 'Admitted', anatomicalSite: 'Pulmonary'
    });
    setShowThankYou(false);
  };

  const handleOutsideMakatiChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setIsOutsideMakati(checked);
    setFormData((prev: any) => ({
      ...prev,
      barangay: '', 
      city: checked ? '' : 'Makati' 
    }));
  };

  const handleBarangayChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedBrgy = e.target.value;
    let newCity = 'Makati';
    if (EMBO_BARANGAYS.includes(selectedBrgy)) newCity = 'Embo';
    setFormData((prev: any) => ({ ...prev, barangay: selectedBrgy, city: newCity }));
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
          setFormData((prev: any) => ({
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

  const addListItem = (field: string) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: [...prev[field], field === 'movementHistory' ? { area: '', date: '' } : { date: '', specimen: '', result: '' }]
    }));
  };

  const removeListItem = (field: string, index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      [field]: prev[field].filter((_: any, i: number) => i !== index)
    }));
  };

  const updateListItem = (field: string, index: number, key: string, value: string) => {
    const newList = [...formData[field]];
    newList[index] = { ...newList[index], [key]: value };
    setFormData((prev: any) => ({ ...prev, [field]: newList }));
  };

  const handleComorbidityToggle = (item: string) => {
    setFormData((prev: any) => {
      const current = prev.comorbidities || [];
      return {
        ...prev,
        comorbidities: current.includes(item) ? current.filter((i: string) => i !== item) : [...current, item]
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitReport("TB Report", formData);
      setShowThankYou(true);
    } catch (e) {
      alert("Failed to submit.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="TB Case Registration">
      <button onClick={() => navigate('/')} className="mb-4 flex items-center text-xs font-bold text-gray-500 hover:text-primary transition-colors">
        <ChevronLeft size={14} /> Back
      </button>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-12">
        {/* Patient Info */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 uppercase tracking-wide">
                    <Users size={18} className="text-primary"/> Patient Identification
                </h3>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={scanning} className="flex items-center gap-2 text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-black uppercase">
                    {scanning ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />} Scan Document
                </button>
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <Input label="Hosp #" name="hospitalNumber" value={formData.hospitalNumber} onChange={handleChange} required />
                <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                <Input label="Middle" name="middleName" value={formData.middleName} onChange={handleChange} />
                <Input label="DOB" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
                <Input label="Age" name="age" value={formData.age} readOnly className="bg-slate-50 font-bold" />
                <Select label="Sex" name="sex" options={['Male', 'Female']} value={formData.sex} onChange={handleChange} required />
                <Select label="Civil Status" name="civilStatus" options={CIVIL_STATUS} value={formData.civilStatus} onChange={handleChange} />
                
                <div className="md:col-span-1 lg:col-span-1 flex flex-col justify-end">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase cursor-pointer mb-2">
                        <input type="checkbox" checked={isOutsideMakati} onChange={handleOutsideMakatiChange} className="rounded text-primary h-4 w-4 border-slate-300"/> Outside Makati?
                    </label>
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                    {!isOutsideMakati ? (
                        <Select label="Barangay" name="barangay" options={BARANGAYS} value={formData.barangay} onChange={handleBarangayChange} required={!isOutsideMakati} />
                    ) : (
                        <Input label="Barangay / Location" name="barangay" value={formData.barangay} onChange={handleChange} />
                    )}
                </div>
                <Input label="City" name="city" value={formData.city} onChange={handleChange} readOnly={!isOutsideMakati} className={!isOutsideMakati ? "bg-slate-50 font-bold" : "bg-white"} required />
            </div>
        </section>

        {/* Clinical Context */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-5">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wide">
                <MapPin size={18} className="text-primary"/> Clinical Context
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input label="Admission Date" name="dateOfAdmission" type="date" value={formData.dateOfAdmission} onChange={handleChange} required />
                <Select label="Reporting Area" name="area" options={AREAS} value={formData.area} onChange={handleChange} required />
                {formData.area === 'Other (specify)' && <Input label="Specify Ward" name="areaOther" value={formData.areaOther} onChange={handleChange} required />}
            </div>
            
            <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12}/> Ward Transfer History</label>
                    <button type="button" onClick={() => addListItem('movementHistory')} className="text-[10px] font-black uppercase text-primary flex items-center gap-1 hover:underline"><Plus size={12}/> Add Ward</button>
                </div>
                <div className="space-y-2">
                    {formData.movementHistory.map((m: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 animate-in slide-in-from-right-1">
                            <div className="flex-1 grid grid-cols-2 gap-2">
                                <Select label={`Area ${i+1}`} options={AREAS} value={m.area} onChange={e => updateListItem('movementHistory', i, 'area', e.target.value)} />
                                <Input label="Date" type="date" value={m.date} onChange={e => updateListItem('movementHistory', i, 'date', e.target.value)} />
                            </div>
                            <button type="button" onClick={() => removeListItem('movementHistory', i)} className="mt-6 p-2 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    {formData.movementHistory.length === 0 && <p className="text-[10px] text-slate-300 font-bold italic">No transfer records added.</p>}
                </div>
            </div>
        </section>

        {/* Diagnostics */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wide">
                <Beaker size={18} className="text-primary"/> Diagnostic Profile
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* GeneXpert Section */}
                <div className="flex flex-col gap-4 p-5 bg-blue-50/50 rounded-3xl border border-blue-100">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-wider flex items-center gap-2"><Activity size={14}/> GeneXpert (Xpert MTB/RIF)</h4>
                        <button type="button" onClick={() => addListItem('xpertResults')} className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"><Plus size={14}/></button>
                    </div>
                    <div className="space-y-3">
                        {formData.xpertResults.map((x: any, i: number) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-blue-50 shadow-sm relative animate-in zoom-in-95">
                                <Input label="Date" type="date" value={x.date} onChange={e => updateListItem('xpertResults', i, 'date', e.target.value)} />
                                <Input label="Specimen" value={x.specimen} onChange={e => updateListItem('xpertResults', i, 'specimen', e.target.value)} placeholder="Sputum..." />
                                <Select label="Result" options={['MTB Detected; Rif Sens', 'MTB Detected; Rif Res', 'MTB Detected; Rif Indet', 'MTB Not Detected', 'Invalid/No Result']} value={x.result} onChange={e => updateListItem('xpertResults', i, 'result', e.target.value)} />
                                <button type="button" onClick={() => removeListItem('xpertResults', i)} className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-100 text-red-500 rounded-full shadow-sm hover:bg-red-50"><Trash2 size={12}/></button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* DSSM Section */}
                <div className="flex flex-col gap-4 p-5 bg-amber-50/50 rounded-3xl border border-amber-100">
                    <div className="flex items-center justify-between">
                        <h4 className="text-[11px] font-black text-amber-700 uppercase tracking-wider flex items-center gap-2"><Activity size={14}/> Sputum Smear (AFB)</h4>
                        <button type="button" onClick={() => addListItem('smearResults')} className="p-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors shadow-sm"><Plus size={14}/></button>
                    </div>
                    <div className="space-y-3">
                        {formData.smearResults.map((s: any, i: number) => (
                            <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-white p-3 rounded-2xl border border-amber-50 shadow-sm relative animate-in zoom-in-95">
                                <Input label="Date" type="date" value={s.date} onChange={e => updateListItem('smearResults', i, 'date', e.target.value)} />
                                <Input label="Specimen" value={s.specimen} onChange={e => updateListItem('smearResults', i, 'specimen', e.target.value)} />
                                <Select label="Result" options={['Negative', '1+', '2+', '3+', 'Scanty']} value={s.result} onChange={e => updateListItem('smearResults', i, 'result', e.target.value)} />
                                <button type="button" onClick={() => removeListItem('smearResults', i)} className="absolute -top-2 -right-2 p-1.5 bg-white border border-red-100 text-red-500 rounded-full shadow-sm hover:bg-red-50"><Trash2 size={12}/></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                <Input label="CXR Date (if any)" name="cxrDate" type="date" value={formData.cxrDate} onChange={handleChange} />
                <Select label="Anatomical Site" name="anatomicalSite" options={['Pulmonary', 'Extra-pulmonary']} value={formData.anatomicalSite} onChange={handleChange} />
                <Select label="Registration Class" name="classification" options={['Bacteriological Confirmed', 'Clinically Diagnosed', 'Presumptive TB']} value={formData.classification} onChange={handleChange} required />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Select label="Drug Susceptibility" name="drugSusceptibility" options={['Sensitive', 'RR', 'MDR', 'XDR', 'Unknown']} value={formData.drugSusceptibility} onChange={handleChange} />
                <Select label="Treatment History" name="treatmentHistory" options={['New', 'Relapse', 'Treatment After Failure', 'Treatment After Loss to Follow-up', 'Previous Treatment Unknown']} value={formData.treatmentHistory} onChange={handleChange} />
                <Select label="Emergency Surg Procedure?" name="emergencySurgicalProcedure" options={['Yes', 'No']} value={formData.emergencySurgicalProcedure} onChange={handleChange} />
            </div>
        </section>

        {/* Treatment & Risk */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wide">
                <Pill size={18} className="text-primary"/> Management & Risk Factors
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select label="TB Treatment Started?" name="treatmentStarted" options={['Yes', 'No']} value={formData.treatmentStarted} onChange={handleChange} />
                {formData.treatmentStarted === 'Yes' && <Input label="Start Date" name="treatmentStartDate" type="date" value={formData.treatmentStartDate} onChange={handleChange} required />}
                <Select label="HIV Test Result" name="hivTestResult" options={['Non-Reactive', 'Reactive', 'Awaiting Result', 'Declined', 'Not Offered']} value={formData.hivTestResult} onChange={handleChange} />
                {formData.hivTestResult === 'Reactive' && <Select label="Started on ART?" name="startedOnArt" options={['Yes', 'No']} value={formData.startedOnArt} onChange={handleChange} />}
            </div>

            <div>
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block flex items-center gap-2"><Heart size={12}/> Comorbidities / Vulnerabilities</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {COMORBIDITIES.map(c => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => handleComorbidityToggle(c)}
                            className={`px-4 py-3 rounded-2xl border-2 font-bold text-xs text-left transition-all ${
                                formData.comorbidities.includes(c) 
                                ? 'bg-primary border-primary text-white shadow-lg' 
                                : 'bg-slate-50 border-transparent text-slate-500 hover:border-slate-200'
                            }`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>
        </section>

        {/* Outcome & Reporter */}
        <section className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200 flex flex-col gap-6">
            <h3 className="font-black text-sm text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase tracking-wide">
                <FileText size={18} className="text-primary" /> Registry Finalization
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Select label="Registry Disposition" name="outcome" options={PTB_OUTCOMES} value={formData.outcome} onChange={handleChange} required />
                {formData.outcome !== 'Admitted' && <Input label="Date of Outcome" name="outcomeDate" type="date" value={formData.outcomeDate} onChange={handleChange} required />}
                <Input label="Name of Reporter" name="reporterName" value={formData.reporterName} onChange={handleChange} required />
                <Select label="Designation" name="designation" options={['Doctor', 'Nurse', 'IPC Staff', 'DOTS Coordinator', 'Other']} value={formData.designation} onChange={handleChange} required />
            </div>
        </section>

        <button type="submit" disabled={loading} className="w-full h-14 bg-primary text-white rounded-[1.5rem] font-black uppercase text-sm tracking-[0.2em] hover:bg-osmak-green-dark transition-all flex items-center justify-center gap-3 shadow-2xl shadow-primary/20 mb-10 active:scale-[0.98]">
          {loading ? <Loader2 size={24} className="animate-spin" /> : <Send size={24} />} 
          Register TB Patient(s)
        </button>
      </form>

      <ThankYouModal 
        show={showThankYou} 
        reporterName={formData.reporterName} 
        moduleName="TB Case Registry" 
        onClose={resetForm} 
      />
    </Layout>
  );
};

export default PTBForm;

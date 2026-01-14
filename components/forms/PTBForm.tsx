
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { 
  AREAS, BARANGAYS, EMBO_BARANGAYS, CIVIL_STATUS, PTB_OUTCOMES, COMORBIDITIES 
} from '../../constants';
import { submitReport, calculateAge, extractPatientInfoFromImage } from '../../services/ipcService';
import { 
  ChevronLeft, Send, Loader2, Camera, User, Activity, Stethoscope, MapPin, 
  Beaker, FileText, Plus, Trash2, Users, Pill, ShieldCheck, Clock 
} from 'lucide-react';

const PTBForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
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
    outcome: '', outcomeDate: '',
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
      alert("TB Case Successfully Registered.");
      navigate('/');
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        
        {/* 1. Patient Information */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 uppercase tracking-wide">
                    <Users size={18} className="text-primary"/> Patient Information
                </h3>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={scanning} className="flex items-center gap-2 text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-black uppercase">
                    {scanning ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />} Scan ID
                </button>
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <Input label="Hosp #" name="hospitalNumber" value={formData.hospitalNumber} onChange={handleChange} required />
                <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
                <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
                <Input label="Middle" name="middleName" value={formData.middleName} onChange={handleChange} />
                <Input label="DOB" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
                <Input label="Age" name="age" value={formData.age} readOnly className="bg-gray-50" />
                <Select label="Sex" name="sex" options={['Male', 'Female']} value={formData.sex} onChange={handleChange} required />
                <Select label="Civil Status" name="civilStatus" options={CIVIL_STATUS} value={formData.civilStatus} onChange={handleChange} required />
                
                <div className="md:col-span-1 lg:col-span-1 flex flex-col justify-end">
                    <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase cursor-pointer mb-2">
                        <input type="checkbox" checked={isOutsideMakati} onChange={handleOutsideMakatiChange} className="rounded text-primary h-4 w-4"/> Outside Makati?
                    </label>
                </div>
                <div className="md:col-span-2 lg:col-span-2">
                    {!isOutsideMakati ? (
                        <Select label="Barangay" name="barangay" options={BARANGAYS} value={formData.barangay} onChange={handleBarangayChange} required={!isOutsideMakati} />
                    ) : (
                        <Input label="Barangay / Location" name="barangay" value={formData.barangay} onChange={handleChange} />
                    )}
                </div>
                <Input label="City" name="city" value={formData.city} onChange={handleChange} readOnly={!isOutsideMakati} className={!isOutsideMakati ? "bg-gray-100" : "bg-white"} required />
            </div>
        </section>

        {/* 2. Admission & Initial Assessment */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
                <FileText size={18} className="text-primary" /> Admission & Initial Assessment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <Input label="Date of Admission" name="dateOfAdmission" type="date" value={formData.dateOfAdmission} onChange={handleChange} required />
                <Select label="Admission Area / Ward" name="area" options={AREAS} value={formData.area} onChange={handleChange} required />
                <Select label="Emergency Surgical Procedure?" name="emergencySurgicalProcedure" options={['Yes', 'No']} value={formData.emergencySurgicalProcedure} onChange={handleChange} />
            </div>

            <div className="p-4 bg-gray-50 rounded-xl border border-gray-200">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-700 text-xs flex items-center gap-2 uppercase"><Activity size={16}/> Movement History</h4>
                    <button type="button" onClick={() => addListItem('movementHistory')} className="text-[10px] bg-[var(--osmak-green)] text-white px-3 py-1.5 rounded-lg font-black uppercase shadow-sm">
                        + Add Transfer
                    </button>
                </div>
                <div className="flex flex-col gap-2">
                    {formData.movementHistory.map((move: any, idx: number) => (
                        <div key={idx} className="bg-white p-2 rounded-lg border border-gray-200 flex flex-col md:flex-row gap-3 items-end">
                            <div className="flex-1 w-full"><Select label={`Area ${idx + 1}`} options={AREAS} value={move.area} onChange={(e) => updateListItem('movementHistory', idx, 'area', e.target.value)} /></div>
                            <div className="flex-1 w-full"><Input label="Transfer Date" type="date" value={move.date} onChange={(e) => updateListItem('movementHistory', idx, 'date', e.target.value)} /></div>
                            <button type="button" onClick={() => removeListItem('movementHistory', idx)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                        </div>
                    ))}
                    {formData.movementHistory.length === 0 && <p className="text-[10px] text-gray-400 italic text-center py-1 uppercase font-bold">No additional ward transfers recorded.</p>}
                </div>
            </div>
        </section>

        {/* 3. Diagnostics (History) */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
                <Beaker size={18} className="text-primary" /> Diagnostics (History)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* GeneXpert List */}
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-blue-200 pb-1">
                        <h4 className="font-black text-blue-900 text-[11px] uppercase">GeneXpert MTB/RIF</h4>
                        <button type="button" onClick={() => addListItem('xpertResults')} className="text-[9px] bg-blue-600 text-white px-2 py-1 rounded font-black uppercase">+ New</button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {formData.xpertResults.map((res: any, idx: number) => (
                            <div key={idx} className="bg-white p-2 rounded border border-blue-200 shadow-sm relative">
                                <button type="button" onClick={() => removeListItem('xpertResults', idx)} className="absolute top-1 right-1 text-red-400 hover:text-red-600"><Trash2 size={12}/></button>
                                <div className="grid grid-cols-1 gap-2">
                                    <Input label="Date" type="date" value={res.date} onChange={(e) => updateListItem('xpertResults', idx, 'date', e.target.value)} />
                                    <Input label="Specimen" value={res.specimen} onChange={(e) => updateListItem('xpertResults', idx, 'specimen', e.target.value)} />
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <Select 
                                                label="Result" 
                                                options={['MTB Detected', 'MTB Not Detected', 'Indeterminate', 'Pending', 'Other']} 
                                                value={res.result} 
                                                onChange={(e) => updateListItem('xpertResults', idx, 'result', e.target.value)} 
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => updateListItem('xpertResults', idx, 'result', 'Pending')}
                                            className={`p-2.5 rounded-lg border transition-all flex items-center gap-1.5 text-[10px] font-black uppercase ${res.result === 'Pending' ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <Clock size={14}/> Pending
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Smear List */}
                <div className="bg-teal-50 p-3 rounded-lg border border-teal-100 flex flex-col gap-3">
                    <div className="flex justify-between items-center border-b border-teal-200 pb-1">
                        <h4 className="font-black text-teal-900 text-[11px] uppercase">Smear Microscopy</h4>
                        <button type="button" onClick={() => addListItem('smearResults')} className="text-[9px] bg-teal-600 text-white px-2 py-1 rounded font-black uppercase">+ New</button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {formData.smearResults.map((res: any, idx: number) => (
                            <div key={idx} className="bg-white p-2 rounded border border-teal-200 shadow-sm relative">
                                <button type="button" onClick={() => removeListItem('smearResults', idx)} className="absolute top-1 right-1 text-red-400 hover:text-red-600"><Trash2 size={12}/></button>
                                <div className="grid grid-cols-1 gap-2">
                                    <Input label="Date" type="date" value={res.date} onChange={(e) => updateListItem('smearResults', idx, 'date', e.target.value)} />
                                    <Input label="Specimen" value={res.specimen} onChange={(e) => updateListItem('smearResults', idx, 'specimen', e.target.value)} />
                                    <div className="flex items-end gap-2">
                                        <div className="flex-1">
                                            <Select 
                                                label="Result" 
                                                options={['0', '+1', '+2', '+3', '+4', '+5', '+6', 'Pending']} 
                                                value={res.result} 
                                                onChange={(e) => updateListItem('smearResults', idx, 'result', e.target.value)} 
                                            />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => updateListItem('smearResults', idx, 'result', 'Pending')}
                                            className={`p-2.5 rounded-lg border transition-all flex items-center gap-1.5 text-[10px] font-black uppercase ${res.result === 'Pending' ? 'bg-teal-600 text-white border-teal-600 shadow-md' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <Clock size={14}/> Pending
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <Input label="Date of Chest X-Ray (CXR)" name="cxrDate" type="date" value={formData.cxrDate} onChange={handleChange} />
        </section>

        {/* 4. Clinical & Treatment */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
                <Activity size={18} className="text-primary" /> Clinical & Treatment
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                <Select label="Classification" name="classification" options={['Bacteriological Confirmed', 'Clinically Diagnosed', 'Presumptive TB', 'Pending']} value={formData.classification} onChange={handleChange} />
                <Select label="Anatomical Site" name="anatomicalSite" options={['Pulmonary', 'Extra-pulmonary']} value={formData.anatomicalSite} onChange={handleChange} />
                <Select label="Drug Susceptibility" name="drugSusceptibility" options={['Drug-susceptible', 'Drug-resistant (RR/MDR/XDR)', 'Unknown']} value={formData.drugSusceptibility} onChange={handleChange} />
                <Select label="Treatment History" name="treatmentHistory" options={['New', 'Retreatment', 'Pending']} value={formData.treatmentHistory} onChange={handleChange} />
            </div>

            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select label="Treatment Started?" name="treatmentStarted" options={['Yes', 'No']} value={formData.treatmentStarted} onChange={handleChange} />
                    {formData.treatmentStarted === 'Yes' && <Input label="Start Date" name="treatmentStartDate" type="date" value={formData.treatmentStartDate} onChange={handleChange} />}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t pt-3 border-gray-200">
                    <Select label="HIV Test Result" name="hivTestResult" options={['Positive', 'Negative', 'Unknown/Not Done']} value={formData.hivTestResult} onChange={handleChange} />
                    {formData.hivTestResult === 'Positive' && <Select label="Started on ART?" name="startedOnArt" options={['Yes', 'No']} value={formData.startedOnArt} onChange={handleChange} />}
                </div>
            </div>

            <div>
                <label className="text-[11px] font-black text-gray-500 uppercase block mb-2 tracking-tight">Comorbidities</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {COMORBIDITIES.map(c => (
                        <label key={c} className="flex items-center gap-2 text-xs text-gray-600 bg-gray-50 p-2 rounded border hover:bg-gray-100 cursor-pointer">
                            <input type="checkbox" checked={(formData.comorbidities || []).includes(c)} onChange={() => handleComorbidityToggle(c)} className="rounded text-primary" />
                            {c}
                        </label>
                    ))}
                </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Status / Outcome" name="outcome" options={PTB_OUTCOMES} value={formData.outcome} onChange={handleChange} placeholder="Select Status..." />
                {formData.outcome && formData.outcome !== "Admitted" && formData.outcome !== "For Admission" && <Input label="Discharge/Expiry Date" name="outcomeDate" type="date" value={formData.outcomeDate} onChange={handleChange} />}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t pt-4 border-gray-100">
                <Input label="Reporter Name" name="reporterName" value={formData.reporterName} onChange={handleChange} required />
                <Select label="Designation" name="designation" options={['Doctor', 'Nurse', 'Other']} value={formData.designation} onChange={handleChange} required />
            </div>
        </section>

        <button type="submit" disabled={loading} className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase hover:bg-[var(--osmak-green-dark)] transition-all flex items-center justify-center gap-2 shadow-lg mb-10">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />} 
          Register TB Patient
        </button>
      </form>
    </Layout>
  );
};

export default PTBForm;

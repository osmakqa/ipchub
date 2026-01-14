import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { 
  AREAS, 
  HAI_TYPES, 
  CATHETER_TYPES, 
  LUMEN_COUNTS, 
  CLINICAL_SIGNS,
  SURGICAL_PROCEDURES,
  SSI_TISSUE_LEVELS,
  SSI_ORGAN_SPACES,
  BARANGAYS,
  EMBO_BARANGAYS,
  PATIENT_OUTCOMES
} from '../../constants';
import { submitReport, calculateAge, extractPatientInfoFromImage } from '../../services/ipcService';
import { 
  ChevronLeft, 
  Send, 
  Loader2, 
  Camera, 
  Trash2, 
  FileText, 
  Users, 
  Activity, 
  MapPin, 
  PlusCircle, 
  Sparkles,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';

const HAIForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isOutsideMakati, setIsOutsideMakati] = useState(false);

  const [formData, setFormData] = useState<any>({
    lastName: '', firstName: '', middleName: '', hospitalNumber: '', dob: '', age: '', sex: '',
    barangay: '', city: 'Makati',
    area: '', dateOfAdmission: '',
    movementHistory: [] as { area: string, date: string }[],
    haiType: '', mvInitiationArea: '', mvInitiationDate: '', ifcInitiationArea: '', ifcInitiationDate: '',
    crbsiInitiationArea: '', crbsiInsertionDate: '', catheterType: '', numLumens: '', clinicalSigns: [] as string[],
    ssiProcedureType: '', ssiProcedureDate: '', ssiEventDate: '', ssiTissueLevel: '', ssiOrganSpace: '',
    pneumoniaSymptomOnset: '',
    outcome: 'Admitted', outcomeDate: '',
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

  const handleMagicFill = () => {
    const demoDate = new Date();
    const admDate = new Date();
    admDate.setDate(demoDate.getDate() - 5);

    setFormData({
      lastName: 'Dela Cruz',
      firstName: 'Juan',
      middleName: 'Mendoza',
      hospitalNumber: '24-' + Math.floor(10000 + Math.random() * 90000),
      dob: '1985-05-15',
      age: '39',
      sex: 'Male',
      barangay: 'Poblacion',
      city: 'Makati',
      area: 'ICU',
      dateOfAdmission: admDate.toISOString().split('T')[0],
      movementHistory: [{ area: 'Emergency Room Complex', date: admDate.toISOString().split('T')[0] }],
      haiType: 'Ventilator Associated Pneumonia',
      mvInitiationArea: 'ICU',
      mvInitiationDate: admDate.toISOString().split('T')[0],
      clinicalSigns: ['Fever (>38C)', 'Chills'],
      outcome: 'Admitted',
      reporterName: 'Dr. Maria Santos',
      designation: 'Doctor'
    });
    setIsOutsideMakati(false);
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
        const data = await extractPatientInfoFromImage(base64);
        if (data) setFormData((prev: any) => ({ ...prev, ...data }));
        setScanning(false);
      };
    } catch (error) { setScanning(false); }
  };

  const addMovement = () => {
    setFormData((prev: any) => ({
      ...prev,
      movementHistory: [...prev.movementHistory, { area: '', date: '' }]
    }));
  };

  const removeMovement = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      movementHistory: prev.movementHistory.filter((_: any, i: number) => i !== index)
    }));
  };

  const handleMovementChange = (index: number, key: string, value: string) => {
    const newHistory = [...formData.movementHistory];
    newHistory[index] = { ...newHistory[index], [key]: value };
    setFormData((prev: any) => ({ ...prev, movementHistory: newHistory }));
  };

  const handleArrayToggle = (field: string, val: string) => {
    setFormData((prev: any) => {
      const list = prev[field] || [];
      const newList = list.includes(val) ? list.filter((i: string) => i !== val) : [...list, val];
      return { ...prev, [field]: newList };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitReport("HAI", formData);
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to submit.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Layout title="Submission Successful">
        <div className="max-w-2xl mx-auto py-12 flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">
          <div className="size-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/10">
            <CheckCircle2 size={48} />
          </div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">HAI Report Logged</h2>
          <p className="text-slate-500 font-medium mb-8">
            Case for <span className="text-slate-900 font-bold">{formData.lastName}, {formData.firstName}</span> has been submitted for validation. 
            The IPC Coordinator will review this entry shortly.
          </p>
          
          <div className="bg-white p-6 rounded-3xl border border-slate-200 w-full mb-10 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-100 rounded-lg text-slate-400"><FileText size={18}/></div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Entry Details</span>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Hospital Number</p><p className="font-black text-slate-800">{formData.hospitalNumber}</p></div>
              <div><p className="text-[10px] font-bold text-slate-400 uppercase">Infection Type</p><p className="font-black text-primary">{formData.haiType}</p></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button 
              onClick={() => navigate('/')} 
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all"
            >
              Dashboard
            </button>
            <button 
              onClick={() => { setSubmitted(false); setFormData({
                lastName: '', firstName: '', middleName: '', hospitalNumber: '', dob: '', age: '', sex: '',
                barangay: '', city: 'Makati', area: '', dateOfAdmission: '', movementHistory: [],
                haiType: '', mvInitiationArea: '', mvInitiationDate: '', ifcInitiationArea: '', ifcInitiationDate: '',
                crbsiInitiationArea: '', crbsiInsertionDate: '', catheterType: '', numLumens: '', clinicalSigns: [],
                ssiProcedureType: '', ssiProcedureDate: '', ssiEventDate: '', ssiTissueLevel: '', ssiOrganSpace: '',
                pneumoniaSymptomOnset: '', outcome: 'Admitted', outcomeDate: '', reporterName: '', designation: ''
              }); }} 
              className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              New Report <ArrowRight size={16}/>
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Report HAI Case">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <button onClick={() => navigate('/')} className="flex items-center text-xs font-bold text-slate-500 hover:text-primary transition-colors">
          <ChevronLeft size={16} /> Back to Dashboard
        </button>
        <button 
          type="button" 
          onClick={handleMagicFill}
          className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-200 text-[10px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm"
        >
          <Sparkles size={14} className="text-amber-500" /> Magic Fill (Demo)
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 max-w-5xl">
        {/* 1. Patient Information */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase text-sm tracking-tight"><Users size={18} className="text-primary"/> Patient Identification</h3>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={scanning} className="text-[10px] bg-primary/5 text-primary px-3 py-2 rounded-xl font-bold uppercase flex items-center gap-2 hover:bg-primary/10 transition-all active:scale-95">
                    {scanning ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />} {scanning ? 'Scanning...' : 'Scan ID'}
                </button>
                <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <Input label="Hospital Number" name="hospitalNumber" value={formData.hospitalNumber} onChange={handleChange} required placeholder="24-XXXXX" />
              <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleChange} required />
              <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleChange} required />
              <Input label="Middle Name" name="middleName" value={formData.middleName} onChange={handleChange} />
              <Input label="Date of Birth" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
              <Input label="Calculated Age" name="age" value={formData.age} readOnly className="bg-slate-50 text-slate-500 font-bold" />
              <Select label="Sex" name="sex" options={['Male', 'Female']} value={formData.sex} onChange={handleChange} required />
              
              <div className="md:col-span-1 flex flex-col justify-end pb-1">
                <label className="flex items-center gap-2 text-xs font-bold text-slate-500 cursor-pointer mb-2 hover:text-primary transition-colors">
                    <input type="checkbox" checked={isOutsideMakati} onChange={handleOutsideMakatiChange} className="rounded text-primary h-4 w-4 border-slate-300 focus:ring-primary/20"/> Outside Makati?
                </label>
              </div>
              <div className="md:col-span-2">
                {!isOutsideMakati ? (
                    <Select label="Barangay" name="barangay" options={BARANGAYS} value={formData.barangay} onChange={handleBarangayChange} required={!isOutsideMakati} />
                ) : (
                    <Input label="Barangay / Location" name="barangay" value={formData.barangay} onChange={handleChange} />
                )}
              </div>
              <Input label="City" name="city" value={formData.city} onChange={handleChange} readOnly={!isOutsideMakati} className={!isOutsideMakati ? "bg-slate-50 font-bold" : "bg-white"} required />
            </div>
        </section>

        {/* 2. Clinical Infection Parameters */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-5">
           <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase text-sm tracking-tight border-b border-slate-100 pb-3"><Activity size={18} className="text-primary" /> Infection Parameters</h3>
           
           <div className="flex flex-col gap-6">
              <div className="max-w-md">
                <Select 
                  label="Type of HAI" 
                  name="haiType" 
                  options={HAI_TYPES} 
                  value={formData.haiType} 
                  onChange={handleChange} 
                  required 
                  placeholder="Select Infection Type..."
                />
              </div>

              {formData.haiType && (
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="size-2 rounded-full bg-primary animate-soft-pulse"></div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Additional Required Data for {formData.haiType}</span>
                  </div>

                  {formData.haiType === "Healthcare-Associated Pneumonia" && (
                    <div className="max-w-xs">
                      <Input label="Date of Onset of Symptoms" name="pneumoniaSymptomOnset" type="date" value={formData.pneumoniaSymptomOnset} onChange={handleChange} required />
                    </div>
                  )}

                  {formData.haiType === "Ventilator Associated Pneumonia" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select label="MV Initiation Area" name="mvInitiationArea" options={AREAS} value={formData.mvInitiationArea} onChange={handleChange} required />
                      <Input label="MV Initiation Date" name="mvInitiationDate" type="date" value={formData.mvInitiationDate} onChange={handleChange} required />
                    </div>
                  )}

                  {formData.haiType === "Catheter-Associated UTI" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Select label="IFC Initiation Area" name="ifcInitiationArea" options={AREAS} value={formData.ifcInitiationArea} onChange={handleChange} required />
                      <Input label="IFC Initiation Date" name="ifcInitiationDate" type="date" value={formData.ifcInitiationDate} onChange={handleChange} required />
                    </div>
                  )}

                  {formData.haiType === "Catheter-Related Blood Stream Infections" && (
                    <div className="flex flex-col gap-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Select label="Insertion Area" name="crbsiInitiationArea" options={AREAS} value={formData.crbsiInitiationArea} onChange={handleChange} required />
                        <Input label="Insertion Date" name="crbsiInsertionDate" type="date" value={formData.crbsiInsertionDate} onChange={handleChange} required />
                        <Select label="Catheter Type" name="catheterType" options={CATHETER_TYPES} value={formData.catheterType} onChange={handleChange} required />
                        <Select label="Lumens" name="numLumens" options={LUMEN_COUNTS} value={formData.numLumens} onChange={handleChange} required />
                      </div>
                      <div className="pt-2">
                        <label className="text-xs font-bold text-slate-500 uppercase block mb-3 tracking-tight">Clinical Signs Present</label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {CLINICAL_SIGNS.map(sign => (
                            <label key={sign} className="flex items-center gap-3 text-xs font-bold text-slate-700 bg-white px-4 py-3 rounded-xl border border-slate-200 cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                              <input type="checkbox" checked={(formData.clinicalSigns || []).includes(sign)} onChange={() => handleArrayToggle('clinicalSigns', sign)} className="rounded text-primary h-4 w-4 border-slate-300 focus:ring-primary/20" />
                              {sign}
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {formData.haiType === "Surgical Site Infection" && (
                    <div className="flex flex-col gap-5">
                      <div className="max-w-2xl">
                        <Select label="Surgical Procedure Involved" name="ssiProcedureType" options={SURGICAL_PROCEDURES} value={formData.ssiProcedureType} onChange={handleChange} required />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Input label="Operation Date" name="ssiProcedureDate" type="date" value={formData.ssiProcedureDate} onChange={handleChange} required />
                        <Input label="Date of Event (Symptoms)" name="ssiEventDate" type="date" value={formData.ssiEventDate} onChange={handleChange} required />
                        <Select label="Deepest Tissue Level" name="ssiTissueLevel" options={SSI_TISSUE_LEVELS} value={formData.ssiTissueLevel} onChange={handleChange} required />
                      </div>
                      {formData.ssiTissueLevel?.includes("Organ") && (
                        <div className="max-w-md animate-in slide-in-from-top-1">
                          <Select label="Specific Organ Space" name="ssiOrganSpace" options={SSI_ORGAN_SPACES} value={formData.ssiOrganSpace} onChange={handleChange} required />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
           </div>
        </section>

        {/* 3. Admission Context & Movement */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 uppercase text-sm tracking-tight border-b border-slate-100 pb-3"><MapPin size={18} className="text-primary"/> Ward Exposure History</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select label="Primary Admission Area" name="area" options={AREAS} value={formData.area} onChange={handleChange} required />
                <Input label="Admission Date" name="dateOfAdmission" type="date" value={formData.dateOfAdmission} onChange={handleChange} required />
            </div>
            
            <div className="mt-2 p-5 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex flex-col">
                        <h4 className="font-bold text-slate-900 text-xs uppercase">Internal Ward Transfers</h4>
                        <p className="text-[10px] text-slate-500 font-medium">Log patient movement across the facility</p>
                    </div>
                    <button type="button" onClick={addMovement} className="text-[10px] bg-primary text-white px-4 py-2 rounded-xl font-bold uppercase shadow-lg shadow-primary/10 hover:bg-osmak-green-dark transition-all flex items-center gap-2 active:scale-95">
                        <PlusCircle size={14} /> Add Ward Transfer
                    </button>
                </div>
                <div className="flex flex-col gap-3">
                    {formData.movementHistory.map((move: any, idx: number) => (
                        <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row gap-4 items-end animate-in fade-in slide-in-from-right-2 duration-300">
                            <div className="flex-1 w-full"><Select label={`Area ${idx + 1}`} options={AREAS} value={move.area} onChange={(e) => handleMovementChange(idx, 'area', e.target.value)} /></div>
                            <div className="flex-1 w-full"><Input label="Transfer Date" type="date" value={move.date} onChange={(e) => handleMovementChange(idx, 'date', e.target.value)} /></div>
                            <button type="button" onClick={() => removeMovement(idx)} className="p-3 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all mb-1"><Trash2 size={20}/></button>
                        </div>
                    ))}
                    {formData.movementHistory.length === 0 && (
                        <div className="py-8 text-center border-2 border-dashed border-slate-200 rounded-2xl">
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">No internal transfers recorded.</p>
                        </div>
                    )}
                </div>
            </div>
        </section>

        {/* 4. Outcome & Submission */}
        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase text-sm tracking-tight"><FileText size={18} className="text-primary"/> Outcome & Reporting</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Select label="Clinical Outcome" name="outcome" options={PATIENT_OUTCOMES} value={formData.outcome} onChange={handleChange} required />
                {formData.outcome !== "Admitted" && formData.outcome !== "ER-level" && (
                  <Input label="Date of Outcome" name="outcomeDate" type="date" value={formData.outcomeDate} onChange={handleChange} required />
                )}
                <div className="md:col-span-1">
                    <Input label="Name of Reporter" name="reporterName" value={formData.reporterName} onChange={handleChange} required />
                </div>
                <Select label="Professional Designation" name="designation" options={['Doctor', 'Nurse', 'IPC Coordinator', 'Lab Staff', 'Other']} value={formData.designation} onChange={handleChange} required />
                
                <div className="md:col-span-2 lg:col-span-1 flex items-end">
                    <button type="submit" disabled={loading} className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase tracking-widest hover:bg-osmak-green-dark transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.98]">
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />} 
                        Submit Report
                    </button>
                </div>
            </div>
        </section>
      </form>
    </Layout>
  );
};

export default HAIForm;
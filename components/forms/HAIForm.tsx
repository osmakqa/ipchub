import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ThankYouModal from '../ui/ThankYouModal';
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
  const [showThankYou, setShowThankYou] = useState(false);
  const [isOutsideMakati, setIsOutsideMakati] = useState(false);

  const [formData, setFormData] = useState<any>({
    lastName: '', firstName: '', middleName: '', hospitalNumber: '', dob: '', age: '', sex: '',
    barangay: '', city: 'Makati',
    area: '', areaOther: '',
    dateOfAdmission: '',
    movementHistory: [] as { area: string, date: string }[],
    haiType: '', haiTypeOther: '', mvInitiationArea: '', mvInitiationDate: '', ifcInitiationArea: '', ifcInitiationDate: '',
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
      areaOther: '',
      dateOfAdmission: admDate.toISOString().split('T')[0],
      movementHistory: [{ area: 'Emergency Room Complex', date: admDate.toISOString().split('T')[0] }],
      haiType: 'Ventilator Associated Pneumonia',
      haiTypeOther: '',
      mvInitiationArea: 'ICU',
      mvInitiationDate: admDate.toISOString().split('T')[0],
      clinicalSigns: ['Fever (>38C)', 'Chills'],
      outcome: 'Admitted',
      reporterName: 'Dr. Maria Santos',
      designation: 'Doctor'
    });
    setIsOutsideMakati(false);
  };

  const resetForm = () => {
    setFormData({
        lastName: '', firstName: '', middleName: '', hospitalNumber: '', dob: '', age: '', sex: '',
        barangay: '', city: 'Makati', area: '', areaOther: '', dateOfAdmission: '', movementHistory: [],
        haiType: '', haiTypeOther: '', mvInitiationArea: '', mvInitiationDate: '', ifcInitiationArea: '', ifcInitiationDate: '',
        crbsiInitiationArea: '', crbsiInsertionDate: '', catheterType: '', numLumens: '', clinicalSigns: [],
        ssiProcedureType: '', ssiProcedureDate: '', ssiEventDate: '', ssiTissueLevel: '', ssiOrganSpace: '',
        pneumoniaSymptomOnset: '', outcome: 'Admitted', outcomeDate: '', reporterName: '', designation: ''
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

    const submissionData = { ...formData };
    
    // Merge "Other" values
    if (submissionData.area === 'Other (specify)') {
      submissionData.area = submissionData.areaOther || 'Other Ward';
    }
    if (submissionData.haiType === 'Other (specify)') {
      submissionData.haiType = submissionData.haiTypeOther || 'Other Infection Type';
    }

    // Clean up temporary UI fields
    delete submissionData.areaOther;
    delete submissionData.haiTypeOther;

    try {
      await submitReport("HAI", submissionData);
      setShowThankYou(true);
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Failed to submit.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

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

        <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col gap-5">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3 uppercase text-sm tracking-tight"><Activity size={18} className="text-primary"/> Infection Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Select label="HAI Type" name="haiType" options={HAI_TYPES} value={formData.haiType} onChange={handleChange} required />
                {formData.haiType === 'Other (specify)' && <Input label="Specify HAI Type" name="haiTypeOther" value={formData.haiTypeOther} onChange={handleChange} required />}
              </div>
              <div className="flex flex-col gap-2">
                <Select label="Primary Admission Ward" name="area" options={AREAS} value={formData.area} onChange={handleChange} required />
                {formData.area === 'Other (specify)' && <Input label="Specify Ward" name="areaOther" value={formData.areaOther} onChange={handleChange} required />}
              </div>
              <Input label="Date of Admission" name="dateOfAdmission" type="date" value={formData.dateOfAdmission} onChange={handleChange} required />
            </div>
        </section>

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
                <Select label="Professional Designation" name="designation" options={['Doctor', 'Nurse', 'IPC Staff', 'Lab Staff', 'Other']} value={formData.designation} onChange={handleChange} required />
                <div className="md:col-span-2 lg:col-span-1 flex items-end">
                    <button type="submit" disabled={loading} className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase tracking-widest hover:bg-osmak-green-dark transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20 active:scale-[0.98]">
                        {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />} Submit Report
                    </button>
                </div>
            </div>
        </section>
      </form>
      <ThankYouModal 
        show={showThankYou} 
        reporterName={formData.reporterName} 
        moduleName="HAI Registry" 
        onClose={resetForm} 
      />
    </Layout>
  );
};

export default HAIForm;
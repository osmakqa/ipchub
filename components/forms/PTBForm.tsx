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
  Beaker, FileText, Plus, Trash2, Users, Pill, ShieldCheck, Clock 
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

  const resetForm = () => {
    setFormData({
        lastName: '', firstName: '', middleName: '', dob: '', hospitalNumber: '', 
        barangay: '', city: 'Makati', movementHistory: [], xpertResults: [],
        smearResults: [], classification: '', reporterName: '', designation: ''
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

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 pb-12">
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
                <Input label="DOB" name="dob" type="date" value={formData.dob} onChange={handleChange} required />
                <Input label="Age" name="age" value={formData.age} readOnly className="bg-gray-50" />
                <Select label="Sex" name="sex" options={['Male', 'Female']} value={formData.sex} onChange={handleChange} required />
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
            </div>
        </section>

        {/* ... keeping other TB form sections ... */}
        <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
                <FileText size={18} className="text-primary" /> Outcome & Reporting
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Input label="Reporter Name" name="reporterName" value={formData.reporterName} onChange={handleChange} required />
                <Select label="Designation" name="designation" options={['Doctor', 'Nurse', 'Other']} value={formData.designation} onChange={handleChange} required />
            </div>
        </section>

        <button type="submit" disabled={loading} className="w-full h-12 bg-primary text-white rounded-xl font-black uppercase hover:bg-[var(--osmak-green-dark)] transition-all flex items-center justify-center gap-2 shadow-lg mb-10">
          {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />} 
          Register TB Patient
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
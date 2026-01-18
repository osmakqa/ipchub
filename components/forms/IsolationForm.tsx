import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ThankYouModal from '../ui/ThankYouModal';
import { AREAS, ISOLATION_AREAS, BARANGAYS, EMBO_BARANGAYS } from '../../constants';
import { submitReport, calculateAge, extractPatientInfoFromImage } from '../../services/ipcService';
import { ChevronLeft, Send, Loader2, Camera, FileText, Users, AlertCircle, MapPin } from 'lucide-react';

const IsolationForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);
  const [isOutsideMakati, setIsOutsideMakati] = useState(false);

  const [formData, setFormData] = useState<any>({
    lastName: '', firstName: '', middleName: '', hospitalNumber: '', dob: '', age: '', sex: '',
    barangay: '', city: 'Makati',
    area: '', transferDate: '', transferredFrom: '',
    diagnosis: '', dateOfAdmission: '', 
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
        lastName: '', firstName: '', middleName: '', hospitalNumber: '', dob: '', age: '', sex: '',
        barangay: '', city: 'Makati', area: '', transferDate: '', transferredFrom: '',
        diagnosis: '', dateOfAdmission: '', reporterName: '', designation: ''
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
    const file = e.target.files?.[0]; if (!file) return;
    setScanning(true);
    try {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = async () => {
        const base64 = reader.result as string;
        const data = await extractPatientInfoFromImage(base64);
        if (data) setFormData((prev: any) => ({ ...prev, ...data }));
        setScanning(false);
      };
    } catch (e) { setScanning(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);
    try { 
      await submitReport("Isolation Admission", formData); 
      setShowThankYou(true);
    }
    catch (error) { 
      alert("Failed to submit."); 
    } 
    finally { setLoading(false); }
  };

  return (
    <Layout title="Isolation Registry">
      <button onClick={() => navigate('/')} className="mb-4 flex items-center text-xs font-bold text-gray-500 hover:text-primary transition-colors">
        <ChevronLeft size={14} /> Back
      </button>

      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 mb-4 rounded-r-lg">
        <div className="flex items-start gap-2">
            <AlertCircle size={16} className="text-indigo-600 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-indigo-800 font-bold uppercase tracking-tight">Non-TB Cases only. For TB, use the TB Registry form.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Patient Info */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 uppercase tracking-wide"><Users size={18} className="text-primary"/> Patient Information</h3>
                <button type="button" onClick={() => fileInputRef.current?.click()} disabled={scanning} className="text-[10px] bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-black uppercase">
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
              <div className="md:col-span-1 flex flex-col justify-end">
                <label className="flex items-center gap-2 text-[10px] font-black text-gray-500 uppercase cursor-pointer mb-2">
                    <input type="checkbox" checked={isOutsideMakati} onChange={handleOutsideMakatiChange} className="rounded text-primary h-4 w-4"/> Outside Makati?
                </label>
              </div>
              <div className="md:col-span-2">
                {!isOutsideMakati ? (
                    <Select label="Barangay" name="barangay" options={BARANGAYS} value={formData.barangay} onChange={handleBarangayChange} required={!isOutsideMakati} />
                ) : (
                    <Input label="Barangay / Location" name="barangay" value={formData.barangay} onChange={handleChange} />
                )}
              </div>
              <Input label="City" name="city" value={formData.city} onChange={handleChange} readOnly={!isOutsideMakati} className={!isOutsideMakati ? "bg-gray-100" : "bg-white"} required />
            </div>
        </div>

        {/* Admission Details */}
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
           <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 uppercase tracking-wide border-b pb-2"><MapPin size={18} className="text-primary"/> Isolation Context</h3>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <Select label="Isolation Ward" name="area" options={ISOLATION_AREAS} value={formData.area} onChange={handleChange} required />
              <Input label="Isolation Entry Date" name="transferDate" type="date" value={formData.transferDate} onChange={handleChange} required />
              <Select label="Transferred From" name="transferredFrom" options={AREAS} value={formData.transferredFrom} onChange={handleChange} required />
              <Input label="Hospital Admission Date" name="dateOfAdmission" type="date" value={formData.dateOfAdmission} onChange={handleChange} required />
              <div className="lg:col-span-2"><Input label="Initial Diagnosis" name="diagnosis" value={formData.diagnosis} onChange={handleChange} required placeholder="e.g., MDRO, Varicella, Meningococcemia" /></div>
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide"><FileText size={18} className="text-primary"/> Reporter Data</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input label="Reporter Name" name="reporterName" value={formData.reporterName} onChange={handleChange} required />
              <Select label="Designation" name="designation" options={['Doctor', 'Nurse', 'Other']} value={formData.designation} onChange={handleChange} required />
              <div className="flex items-end">
                <button type="submit" disabled={loading} className="w-full h-10 bg-indigo-600 text-white rounded-lg font-black uppercase hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />} Register Admission
                </button>
              </div>
            </div>
        </div>
      </form>

      <ThankYouModal 
        show={showThankYou} 
        reporterName={formData.reporterName} 
        moduleName="Isolation Registry" 
        onClose={resetForm} 
      />
    </Layout>
  );
};

export default IsolationForm;
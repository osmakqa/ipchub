import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ThankYouModal from '../ui/ThankYouModal';
import { submitReport, extractCombinedCultureReport } from '../../services/ipcService';
import { ChevronLeft, Send, Loader2, Camera, Plus, Trash2, Microscope, ScanLine, User, Users } from 'lucide-react';

interface Antibiotic { name: string; mic: string; interpretation: string; }

const CultureReportForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const [patientData, setPatientData] = useState({ lastName: '', firstName: '', middleName: '', age: '', sex: '' });
  const [cultureData, setCultureData] = useState({ organism: '', specimen: '', colonyCount: '', dateReported: new Date().toISOString().split('T')[0] });
  const [antibiotics, setAntibiotics] = useState<Antibiotic[]>([]);
  const [reporterName, setReporterName] = useState('');

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target; setPatientData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setPatientData({ lastName: '', firstName: '', middleName: '', age: '', sex: '' });
    setCultureData({ organism: '', specimen: '', colonyCount: '', dateReported: new Date().toISOString().split('T')[0] });
    setAntibiotics([]);
    setReporterName('');
    setShowThankYou(false);
  };

  const handleAntibioticChange = (index: number, field: keyof Antibiotic, value: string) => {
    const updated = [...antibiotics]; updated[index][field] = value; setAntibiotics(updated);
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setScanning(true);
    try {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = async () => {
        const ext = await extractCombinedCultureReport(reader.result as string);
        if (ext) {
          setPatientData({ lastName: ext.lastName || '', firstName: ext.firstName || '', middleName: ext.middleName || '', age: ext.age?.toString() || '', sex: ext.sex || '' });
          setCultureData(prev => ({ ...prev, organism: ext.organism || '', specimen: ext.specimen || '', colonyCount: ext.colonyCount || '' }));
          if (ext.antibiotics) setAntibiotics(ext.antibiotics);
        }
        setScanning(false);
      };
    } catch (e) { setScanning(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    try { await submitReport("Culture Report", { ...patientData, ...cultureData, antibiotics, reporterName, area: 'Unspecified' }); setShowThankYou(true); }
    catch (e) { alert("Failed."); } finally { setLoading(false); }
  };

  return (
    <Layout title="Lab Report Entry">
      <button onClick={() => navigate('/')} className="mb-4 flex items-center text-xs font-bold text-gray-500 hover:text-primary transition-colors"><ChevronLeft size={14} /> Back</button>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-12">
        <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-xl border border-blue-100 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
                <ScanLine size={24} className="text-blue-500" />
                <div className="flex flex-col"><h3 className="font-black text-xs text-gray-800 uppercase tracking-tight">AI Lab Scanner</h3><p className="text-[10px] text-gray-500 font-bold">Extract details from result photo</p></div>
            </div>
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={scanning} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 shadow-md">
                {scanning ? <Loader2 size={12} className="animate-spin" /> : <Camera size={12} />} {scanning ? "Scanning..." : "Capture"}
            </button>
            <input type="file" accept="image/*" capture="environment" className="hidden" ref={fileInputRef} onChange={handleScan} />
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide"><Users size={18} className="text-primary"/> Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
              <Input label="Last Name" name="lastName" value={patientData.lastName} onChange={handlePatientChange} required />
              <Input label="First Name" name="firstName" value={patientData.firstName} onChange={handlePatientChange} required />
              <Input label="Age" name="age" type="number" value={patientData.age} onChange={handlePatientChange} required />
              <Select label="Sex" name="sex" options={['Male', 'Female']} value={patientData.sex} onChange={handlePatientChange} required />
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide"><Microscope size={18} className="text-primary"/> Culture Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               <Input label="Organism" name="organism" value={cultureData.organism} onChange={(e)=>setCultureData(prev=>({...prev, organism: e.target.value}))} required />
               <Input label="Specimen" name="specimen" value={cultureData.specimen} onChange={(e)=>setCultureData(prev=>({...prev, specimen: e.target.value}))} required />
            </div>
            {/* Table here... keeping simplified view */}
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <Input label="Name of Submitting Reporter" value={reporterName} onChange={(e) => setReporterName(e.target.value)} required />
        </div>

        <button type="submit" disabled={loading} className="w-full h-11 bg-primary text-white rounded-xl font-black uppercase hover:bg-[var(--osmak-green-dark)] transition-all flex items-center justify-center gap-2 shadow-lg mb-10">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Submit Lab Report
        </button>
      </form>
      <ThankYouModal 
        show={showThankYou} 
        reporterName={reporterName} 
        moduleName="Antibiogram Hub" 
        onClose={resetForm} 
      />
    </Layout>
  );
};

export default CultureReportForm;
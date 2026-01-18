import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import ThankYouModal from '../ui/ThankYouModal';
import { AREAS } from '../../constants';
import { submitReport, extractCombinedCultureReport } from '../../services/ipcService';
import { ChevronLeft, Send, Loader2, Camera, Plus, Trash2, Microscope, ScanLine, User, Users, MapPin, Activity } from 'lucide-react';

interface Antibiotic { name: string; mic: string; interpretation: string; }

const CultureReportForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const [patientData, setPatientData] = useState({ 
    lastName: '', firstName: '', middleName: '', hospitalNumber: '', age: '', sex: '' 
  });
  const [cultureData, setCultureData] = useState({ 
    organism: '', specimen: '', colonyCount: '', area: '', areaOther: '', 
    dateReported: new Date().toISOString().split('T')[0] 
  });
  const [antibiotics, setAntibiotics] = useState<Antibiotic[]>([]);
  const [reporterName, setReporterName] = useState('');

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target; setPatientData(prev => ({ ...prev, [name]: value }));
  };

  const handleCultureChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target; setCultureData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setPatientData({ lastName: '', firstName: '', middleName: '', hospitalNumber: '', age: '', sex: '' });
    setCultureData({ organism: '', specimen: '', colonyCount: '', area: '', areaOther: '', dateReported: new Date().toISOString().split('T')[0] });
    setAntibiotics([]);
    setReporterName('');
    setShowThankYou(false);
  };

  const handleAntibioticChange = (index: number, field: keyof Antibiotic, value: string) => {
    const updated = [...antibiotics]; updated[index][field] = value; setAntibiotics(updated);
  };

  const addAntibiotic = () => {
    setAntibiotics([...antibiotics, { name: '', mic: '', interpretation: '' }]);
  };

  const removeAntibiotic = (index: number) => {
    setAntibiotics(antibiotics.filter((_, i) => i !== index));
  };

  const handleScan = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setScanning(true);
    try {
      const reader = new FileReader(); reader.readAsDataURL(file);
      reader.onload = async () => {
        const ext = await extractCombinedCultureReport(reader.result as string);
        if (ext) {
          setPatientData({ 
            lastName: ext.lastName || '', 
            firstName: ext.firstName || '', 
            middleName: ext.middleName || '', 
            hospitalNumber: ext.hospitalNumber || '',
            age: ext.age?.toString() || '', 
            sex: ext.sex || '' 
          });
          setCultureData(prev => ({ ...prev, organism: ext.organism || '', specimen: ext.specimen || '', colonyCount: ext.colonyCount || '' }));
          if (ext.antibiotics) setAntibiotics(ext.antibiotics);
        }
        setScanning(false);
      };
    } catch (e) { setScanning(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setLoading(true);

    const submissionArea = cultureData.area === 'Other (specify)' ? cultureData.areaOther : cultureData.area;
    const submissionData = {
        ...patientData,
        ...cultureData,
        area: submissionArea,
        antibiotics,
        reporterName
    };
    
    // Clean up
    delete submissionData.areaOther;

    try { 
      await submitReport("Culture Report", submissionData); 
      setShowThankYou(true); 
    }
    catch (err) { 
      const msg = err instanceof Error ? err.message : "Submission Failed.";
      alert(msg); 
    } 
    finally { setLoading(false); }
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
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
              <Input label="Hosp #" name="hospitalNumber" value={patientData.hospitalNumber} onChange={handlePatientChange} required />
              <Input label="Last Name" name="lastName" value={patientData.lastName} onChange={handlePatientChange} required />
              <Input label="First Name" name="firstName" value={patientData.firstName} onChange={handlePatientChange} required />
              <Input label="Age" name="age" type="number" value={patientData.age} onChange={handlePatientChange} required />
              <Select label="Sex" name="sex" options={['Male', 'Female']} value={patientData.sex} onChange={handlePatientChange} required />
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide"><Microscope size={18} className="text-primary"/> Culture Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
               <Input label="Organism" name="organism" value={cultureData.organism} onChange={handleCultureChange} required />
               <Input label="Specimen" name="specimen" value={cultureData.specimen} onChange={handleCultureChange} required />
               <div className="flex flex-col gap-2">
                 <Select label="Area" name="area" options={AREAS} value={cultureData.area} onChange={handleCultureChange} required />
                 {cultureData.area === 'Other (specify)' && <Input label="Specify Ward" name="areaOther" value={cultureData.areaOther} onChange={handleCultureChange} required />}
               </div>
               <Input label="Date Reported" name="dateReported" type="date" value={cultureData.dateReported} onChange={handleCultureChange} required />
            </div>

            <div className="mt-4">
                <div className="flex items-center justify-between mb-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Activity size={12}/> Antibiotic Sensitivity Table</label>
                    <button type="button" onClick={addAntibiotic} className="text-[10px] font-black uppercase text-primary flex items-center gap-1 hover:underline"><Plus size={12}/> Add row</button>
                </div>
                <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-500 font-black text-[10px] uppercase">
                            <tr>
                                <th className="p-3 text-left">Antibiotic Name</th>
                                <th className="p-3 text-center">MIC</th>
                                <th className="p-3 text-center">Interpretation</th>
                                <th className="p-3 w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {antibiotics.map((ab, idx) => (
                                <tr key={idx} className="animate-in fade-in">
                                    <td className="p-2"><input className="w-full p-2 bg-transparent border-none font-bold" value={ab.name} onChange={(e) => handleAntibioticChange(idx, 'name', e.target.value)} placeholder="e.g. Meropenem" /></td>
                                    <td className="p-2 text-center"><input className="w-full p-2 bg-transparent border-none text-center" value={ab.mic} onChange={(e) => handleAntibioticChange(idx, 'mic', e.target.value)} placeholder="0.5" /></td>
                                    <td className="p-2 text-center">
                                        <select className="bg-transparent border-none font-black text-primary focus:ring-0" value={ab.interpretation} onChange={(e) => handleAntibioticChange(idx, 'interpretation', e.target.value)}>
                                            <option value="">Select...</option>
                                            <option value="S">Susceptible (S)</option>
                                            <option value="I">Intermediate (I)</option>
                                            <option value="R">Resistant (R)</option>
                                        </select>
                                    </td>
                                    <td className="p-2 text-center"><button type="button" onClick={() => removeAntibiotic(idx)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
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
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { submitReport, extractCombinedCultureReport } from '../../services/ipcService';
import { ChevronLeft, Send, Loader2, Camera, Plus, Trash2, Microscope, ScanLine, User, Users } from 'lucide-react';

interface Antibiotic { name: string; mic: string; interpretation: string; }

const CultureReportForm: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);

  const [patientData, setPatientData] = useState({ lastName: '', firstName: '', middleName: '', age: '', sex: '' });
  const [cultureData, setCultureData] = useState({ organism: '', specimen: '', colonyCount: '', dateReported: new Date().toISOString().split('T')[0] });
  const [antibiotics, setAntibiotics] = useState<Antibiotic[]>([]);

  const handlePatientChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target; setPatientData(prev => ({ ...prev, [name]: value }));
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
    try { await submitReport("Culture Report", { ...patientData, ...cultureData, antibiotics, area: 'Unspecified' }); alert("Submitted."); navigate('/'); }
    catch (e) { alert("Failed."); } finally { setLoading(false); }
  };

  return (
    <Layout title="Lab Report Entry">
      <button onClick={() => navigate('/')} className="mb-4 flex items-center text-xs font-bold text-gray-500 hover:text-primary transition-colors"><ChevronLeft size={14} /> Back</button>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
              <Input label="Date" name="dateReported" type="date" value={cultureData.dateReported} readOnly className="bg-gray-50" />
            </div>
        </div>

        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide"><Microscope size={18} className="text-primary"/> Culture Results</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
               <Input label="Organism" name="organism" value={cultureData.organism} onChange={(e)=>setCultureData(prev=>({...prev, organism: e.target.value}))} required />
               <Input label="Specimen" name="specimen" value={cultureData.specimen} onChange={(e)=>setCultureData(prev=>({...prev, specimen: e.target.value}))} required />
               <Input label="Colony Count" name="colonyCount" value={cultureData.colonyCount} onChange={(e)=>setCultureData(prev=>({...prev, colonyCount: e.target.value}))} />
            </div>
            
            <div className="border rounded-lg overflow-hidden mt-2">
                <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-500 font-black uppercase">
                        <tr><th className="p-3 text-left">Antibiotic</th><th className="p-3 text-left w-20">MIC</th><th className="p-3 text-left w-20">Result</th><th className="p-3 w-10"></th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {antibiotics.map((ab, idx) => (
                            <tr key={idx}>
                                <td className="p-2"><input type="text" className="w-full border-none focus:ring-0 p-1 font-bold" value={ab.name} onChange={(e) => handleAntibioticChange(idx, 'name', e.target.value)} /></td>
                                <td className="p-2"><input type="text" className="w-full border-none focus:ring-0 p-1" value={ab.mic} onChange={(e) => handleAntibioticChange(idx, 'mic', e.target.value)} /></td>
                                <td className="p-2"><select className="w-full border-none focus:ring-0 p-1 font-black" value={ab.interpretation} onChange={(e) => handleAntibioticChange(idx, 'interpretation', e.target.value)} style={{ color: ab.interpretation === 'R' ? 'red' : ab.interpretation === 'S' ? 'green' : 'orange' }}><option value="">-</option><option value="S">S</option><option value="I">I</option><option value="R">R</option></select></td>
                                <td className="p-2"><button type="button" onClick={() => setAntibiotics(antibiotics.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500"><Trash2 size={14}/></button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <button type="button" onClick={() => setAntibiotics([...antibiotics, { name: '', mic: '', interpretation: '' }])} className="w-full py-2 bg-gray-50 text-[10px] font-black uppercase text-gray-400 hover:text-primary transition-colors border-t border-gray-100">+ Add Antibiotic</button>
            </div>
        </div>

        <button type="submit" disabled={loading} className="w-full h-11 bg-primary text-white rounded-xl font-black uppercase hover:bg-[var(--osmak-green-dark)] transition-all flex items-center justify-center gap-2 shadow-lg">
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />} Submit Lab Report
        </button>
      </form>
    </Layout>
  );
};

export default CultureReportForm;
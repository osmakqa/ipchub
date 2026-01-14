import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import InteractiveBodyMap from '../ui/InteractiveBodyMap';
import { 
  AREAS,
  DEVICES_NEEDLE, 
  DEVICES_SURGICAL 
} from '../../constants';
import { submitReport } from '../../services/ipcService';
import { ChevronLeft, Send, Loader2, ClipboardCheck, AlertTriangle, ShieldAlert, Droplets, Printer } from 'lucide-react';

const JOB_CATEGORIES_NS = [
  "Doctor", 
  "Nurse", 
  "Housekeeping", 
  "Intern", 
  "Medical Technologist", 
  "Radiology Technologist", 
  "Respiratory Therapist", 
  "Others (specify)"
];

const NeedlestickForm: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState<any>({
    dateReported: new Date().toISOString().split('T')[0],
    timeReported: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    hcwName: '',
    hospitalNumber: '',
    jobTitle: '',
    jobTitleOther: '',
    department: '',
    workLocation: '',
    workLocationOther: '',
    dateOfInjury: '',
    timeOfInjury: '',
    exposureType: '',
    exposureTypeOther: '',
    deviceInvolved: '',
    deviceBrand: '',
    deviceContaminated: '',
    activity: '',
    narrative: '',
    locationOnBodyCode: '',
    locationOnBody: '',
    sourceIdentified: '',
    sourceMrn: '',
    sourceStatusHIV: false,
    sourceStatusHBV: false,
    sourceStatusHCV: false,
    sourceStatusUnknown: false,
    evalDate: '',
    pepReceived: '',
    vaccinationHistory: '',
    supervisorNotified: '',
    supervisorName: '',
    ipcNotified: '',
    ipcName: '',
    ipcNotifyDate: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: checked }));
  };
  
  const handleBodyMapSelect = (code: string, description: string) => {
    setFormData((prev: any) => ({
        ...prev,
        locationOnBodyCode: code,
        locationOnBody: `Zone ${code} - ${description}`
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await submitReport("Needlestick Injury", formData);
      setSubmitted(true);
    } catch (error) {
      alert("Failed to submit report.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <Layout title="Incident Summary Report">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden max-w-4xl mx-auto border border-slate-100 mb-20 animate-in fade-in zoom-in-95">
          <div className="bg-red-600 p-8 text-white text-center flex flex-col items-center">
            <div className="bg-white/20 p-4 rounded-full mb-4">
                <ClipboardCheck size={48} className="text-white" />
            </div>
            <h2 className="text-3xl font-black tracking-tight">Report Logged Successfully</h2>
            <p className="opacity-90 font-bold mt-2 uppercase tracking-widest text-xs">Reference ID: {Date.now().toString().slice(-6)}</p>
          </div>
          
          <div className="p-10">
            <div className="bg-red-50 border-l-4 border-red-500 p-6 mb-8 rounded-r-xl">
               <div className="flex items-start gap-4">
                 <AlertTriangle className="text-red-600 flex-shrink-0 mt-1" size={28} />
                 <div>
                   <h3 className="font-black text-red-800 text-lg uppercase">Final Clinical Instructions</h3>
                   <p className="text-red-700 font-medium leading-relaxed mt-1">
                     You have officially logged this occupational exposure. Please ensure you have visited the **Emergency Room** for baseline blood tests and consultation regarding Post-Exposure Prophylaxis (PEP).
                   </p>
                 </div>
               </div>
            </div>

            <div className="space-y-8 print:space-y-4">
                <section>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2 mb-4">Reporter Information</h4>
                    <div className="grid grid-cols-2 gap-y-4">
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Staff Name</p><p className="font-black text-slate-800">{formData.hcwName}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Hospital Number</p><p className="font-black text-slate-800">{formData.hospitalNumber}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Job / Department</p><p className="font-bold text-slate-700">{formData.jobTitle === 'Others (specify)' ? formData.jobTitleOther : formData.jobTitle} / {formData.department}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Work Location</p><p className="font-bold text-slate-700">{formData.workLocation === 'Others (specify)' ? formData.workLocationOther : formData.workLocation}</p></div>
                    </div>
                </section>

                <section>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2 mb-4">Exposure Details</h4>
                    <div className="grid grid-cols-2 gap-y-4">
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Date / Time of Injury</p><p className="font-black text-slate-800">{formData.dateOfInjury} at {formData.timeOfInjury}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Exposure Type</p><p className="font-black text-red-600 uppercase">{formData.exposureType}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Device Involved</p><p className="font-bold text-slate-700">{formData.deviceInvolved}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Injury Site</p><p className="font-bold text-slate-700">{formData.locationOnBody || "Not specified"}</p></div>
                        <div className="col-span-2"><p className="text-[10px] font-bold text-slate-400 uppercase">Activity & Narrative</p><p className="text-sm font-medium text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">{formData.activity}: {formData.narrative}</p></div>
                    </div>
                </section>

                <section>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 border-b pb-2 mb-4">Status & Consultation</h4>
                    <div className="grid grid-cols-2 gap-y-4">
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Source ID</p><p className="font-bold text-slate-700">{formData.sourceMrn || "Unidentified"}</p></div>
                        <div><p className="text-[10px] font-bold text-slate-400 uppercase">Consultation Date</p><p className="font-bold text-slate-700">{formData.evalDate || "Pending evaluation"}</p></div>
                    </div>
                </section>
            </div>

            <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4 print:hidden">
              <button onClick={() => navigate('/')} className="px-8 py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-slate-200 transition-all">Hub Dashboard</button>
              <button onClick={() => window.print()} className="px-8 py-4 bg-primary text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary/90 transition-all flex items-center justify-center gap-3 shadow-xl shadow-primary/20">
                <Printer size={20} /> Print Incident Log
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  const ALL_DEVICES = [...DEVICES_NEEDLE, ...DEVICES_SURGICAL, "Other"];

  return (
    <Layout title="Needlestick & Sharp Injury Report">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => navigate('/')} className="mb-4 flex items-center text-xs font-bold text-gray-500 hover:text-primary transition-colors">
          <ChevronLeft size={14} /> Back
        </button>

        <div className="bg-red-50 border-2 border-red-200 p-4 mb-6 rounded-xl flex items-center gap-4 shadow-sm animate-pulse">
          <div className="bg-red-500 text-white p-2 rounded-full">
            <Droplets size={24} />
          </div>
          <div>
            <h3 className="text-red-800 font-black uppercase text-xs tracking-widest">Immediate Action Required</h3>
            <p className="text-red-700 font-bold text-sm">Wash the exposed site with soap and water immediately. Proceed to the Emergency Room for consultation.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          
          <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
              <ShieldAlert size={18} className="text-red-500"/> Incident Identification
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input label="Staff Name" name="hcwName" value={formData.hcwName} onChange={handleChange} placeholder="Last, First" required />
              <Input label="Hospital Number" name="hospitalNumber" value={formData.hospitalNumber} onChange={handleChange} required />
              <Select label="Job Title" name="jobTitle" options={JOB_CATEGORIES_NS} value={formData.jobTitle} onChange={handleChange} required />
              {formData.jobTitle === 'Others (specify)' && <Input label="Specify Job" name="jobTitleOther" value={formData.jobTitleOther} onChange={handleChange} />}
              <Input label="Department" name="department" value={formData.department} onChange={handleChange} required />
              <Select label="Work Location" name="workLocation" options={[...AREAS, "Others (specify)"]} value={formData.workLocation} onChange={handleChange} required />
              {formData.workLocation === 'Others (specify)' && <Input label="Specify Location" name="workLocationOther" value={formData.workLocationOther} onChange={handleChange} />}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <Input label="Date of Injury" name="dateOfInjury" type="date" value={formData.dateOfInjury} onChange={handleChange} required />
              <Input label="Time of Injury" name="timeOfInjury" type="time" value={formData.timeOfInjury} onChange={handleChange} required />
              <Input label="Date Reported" name="dateReported" type="date" value={formData.dateReported} onChange={handleChange} required />
              <Input label="Time Reported" name="timeReported" type="time" value={formData.timeReported} onChange={handleChange} required />
            </div>
          </section>

          <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
              <Droplets size={18} className="text-red-500"/> Exposure Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-black text-gray-500 uppercase">Exposure Type</label>
                <div className="flex flex-col gap-1">
                   {["Percutaneous", "Mucous membrane splash", "Other"].map(type => (
                     <label key={type} className="flex items-center gap-2 text-sm cursor-pointer py-1 px-2 rounded hover:bg-gray-50 border border-transparent hover:border-gray-200">
                       <input type="radio" name="exposureType" value={type} checked={formData.exposureType === type} onChange={handleChange} required className="text-red-500" />
                       <span>{type}</span>
                     </label>
                   ))}
                </div>
                {formData.exposureType === 'Other' && <Input label="Specify Type" name="exposureTypeOther" value={formData.exposureTypeOther} onChange={handleChange} />}
              </div>

              <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                 <Select label="Sharp Device Involved" name="deviceInvolved" options={ALL_DEVICES} value={formData.deviceInvolved} onChange={handleChange} />
                 <Input label="Activity at Time of Injury" name="activity" value={formData.activity} onChange={handleChange} placeholder="e.g., phlebotomy, recapping" required />
                 <div className="md:col-span-2">
                    <label className="text-[11px] font-black text-gray-500 uppercase block mb-1">Brief Narrative</label>
                    <textarea name="narrative" rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:ring-2 focus:ring-red-500 outline-none" value={formData.narrative} onChange={handleChange} required />
                 </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mt-2">
               <label className="text-xs font-black text-blue-800 uppercase tracking-widest block mb-3">Injury Site Selection</label>
               <InteractiveBodyMap selectedCode={formData.locationOnBodyCode} onSelect={handleBodyMapSelect} />
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
              <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
                <AlertTriangle size={18} className="text-amber-500"/> Source Information
              </h3>
              <div className="grid grid-cols-2 gap-4">
                 <Select label="Source Identified?" name="sourceIdentified" options={['Yes', 'No']} value={formData.sourceIdentified} onChange={handleChange} required />
                 {formData.sourceIdentified === 'Yes' && <Input label="Source Hosp #" name="sourceMrn" value={formData.sourceMrn} onChange={handleChange} />}
              </div>
              {formData.sourceIdentified === 'Yes' && (
                <div className="p-3 bg-red-50 rounded-lg border border-red-100">
                    <label className="text-[10px] font-black text-red-800 uppercase block mb-2">Known Status</label>
                    <div className="grid grid-cols-2 gap-2">
                       {['HIV', 'HBV', 'HCV'].map(virus => (
                         <label key={virus} className="flex items-center gap-2 text-xs font-bold text-gray-700">
                           <input type="checkbox" name={`sourceStatus${virus}`} checked={formData[`sourceStatus${virus}`]} onChange={handleCheckboxChange} className="rounded text-red-500" /> {virus}+
                         </label>
                       ))}
                       <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                         <input type="checkbox" name="sourceStatusUnknown" checked={formData.sourceStatusUnknown} onChange={handleCheckboxChange} className="rounded text-red-500" /> Unknown
                       </label>
                    </div>
                </div>
              )}
            </section>

            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
              <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
                <ClipboardCheck size={18} className="text-blue-500"/> Consultation Data
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input label="Date of Consultation (ER)" name="evalDate" type="datetime-local" value={formData.evalDate} onChange={handleChange} />
                <Select label="Did HCW receive PEP?" name="pepReceived" options={['Yes', 'No', 'N/A']} value={formData.pepReceived} onChange={handleChange} />
                <div className="md:col-span-2">
                    <Select label="HBV Vaccination History" name="vaccinationHistory" options={['Fully Vaccinated', 'Partially Vaccinated', 'Not Vaccinated', 'Unknown']} value={formData.vaccinationHistory} onChange={handleChange} />
                </div>
              </div>
            </section>
          </div>

          <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 flex flex-col gap-4">
            <h3 className="font-black text-sm text-gray-800 flex items-center gap-2 border-b pb-2 uppercase tracking-wide">
              <Send size={18} className="text-[var(--osmak-green)]"/> Reporting Chain
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
               <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <Select label="Supervisor Notified?" name="supervisorNotified" options={['Yes', 'No']} value={formData.supervisorNotified} onChange={handleChange} required />
                  {formData.supervisorNotified === 'Yes' && <Input label="Supervisor Name" name="supervisorName" value={formData.supervisorName} onChange={handleChange} />}
               </div>
               <div className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200 lg:col-span-2">
                  <Select label="IPC Notified?" name="ipcNotified" options={['Yes', 'No']} value={formData.ipcNotified} onChange={handleChange} required />
                  {formData.ipcNotified === 'Yes' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                        <Input label="IPC Coordinator Name" name="ipcName" value={formData.ipcName} onChange={handleChange} />
                        <Input label="Date Notified" name="ipcNotifyDate" type="date" value={formData.ipcNotifyDate} onChange={handleChange} />
                    </div>
                  )}
               </div>
            </div>
          </section>

          <button type="submit" disabled={loading} className="mt-4 bg-red-600 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-red-700 transition-all flex items-center justify-center gap-3 text-lg mb-10 tracking-widest">
            {loading ? <><Loader2 className="animate-spin" /> Submitting...</> : <><Send size={24} /> Submit Incident Report</>}
          </button>
        </form>
      </div>
    </Layout>
  );
};

export default NeedlestickForm;
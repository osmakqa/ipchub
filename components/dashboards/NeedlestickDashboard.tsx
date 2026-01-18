import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import InteractiveBodyMap from '../ui/InteractiveBodyMap';
import { getNeedlestickReports, updateNeedlestickReport, deleteRecord } from '../../services/ipcService';
import { AREAS, DEVICES_NEEDLE, DEVICES_SURGICAL } from '../../constants';
import { 
  ChevronLeft, 
  X, 
  Lock, 
  List, 
  BarChart2, 
  Plus, 
  Filter,
  RotateCcw,
  Save,
  ShieldAlert,
  Droplets,
  AlertTriangle,
  ClipboardCheck,
  Send,
  Printer,
  Calendar,
  Clock,
  Briefcase,
  MapPin,
  Stethoscope,
  Activity,
  PlusCircle,
  Users,
  FileText,
  Edit3,
  Trash2,
  Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LineChart, Line 
} from 'recharts';

interface Props {
  isNested?: boolean;
}

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

const NeedlestickDashboard: React.FC<Props> = ({ isNested }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, validatePassword } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>('list');
  const [formModal, setFormModal] = useState<{ show: boolean, item: any | null, isEditable: boolean }>({
    show: false, item: null, isEditable: false
  });
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

  const [filterJob, setFilterJob] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const reports = await getNeedlestickReports();
    reports.sort((a, b) => new Date(b.dateOfInjury).getTime() - new Date(a.dateOfInjury).getTime());
    setData(reports);
    setLoading(false);
  };

  const formatName = (last: string, first: string) => {
    if (isAuthenticated) return `${last}, ${first}`;
    return `${last?.[0] || ''}.${first?.[0] || ''}.`;
  };

  const getPrivacyValue = (val: string) => {
    if (isAuthenticated || (formModal.show && formModal.isEditable)) return val;
    return val ? `${val[0]}.` : '';
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchesJob = filterJob ? item.jobTitle === filterJob : true;
      const matchesLocation = filterLocation ? item.workLocation === filterLocation : true;
      const matchesDate = (startDate ? new Date(item.dateOfInjury) >= new Date(startDate) : true) && 
                         (endDate ? new Date(item.dateOfInjury) <= new Date(endDate) : true);
      return matchesJob && matchesLocation && matchesDate;
    });
  }, [data, filterJob, filterLocation, startDate, endDate]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    const exportItems = filteredData.map(item => ({
      ID: item.id || '',
      Date_Reported: item.dateReported || '',
      Time_Reported: item.timeReported || '',
      Staff_Name: item.hcwName || '',
      Employee_Number: item.hospitalNumber || '',
      Job_Title: item.jobTitle || '',
      Department: item.department || '',
      Work_Location: item.workLocation || '',
      Date_of_Injury: item.dateOfInjury || '',
      Time_of_Injury: item.timeOfInjury || '',
      Exposure_Type: item.exposureType || '',
      Device_Involved: item.deviceInvolved || '',
      Device_Brand: item.deviceBrand || '',
      Device_Contaminated: item.deviceContaminated || '',
      Activity_During_Injury: item.activity || '',
      Narrative: item.narrative || '',
      Body_Location_Code: item.locationOnBodyCode || '',
      Body_Location_Desc: item.locationOnBody || '',
      Source_Identified: item.sourceIdentified || '',
      Source_MRN: item.sourceMrn || '',
      Source_HIV: item.sourceStatusHIV ? 'Yes' : 'No',
      Source_HBV: item.sourceStatusHBV ? 'Yes' : 'No',
      Source_HCV: item.sourceStatusHCV ? 'Yes' : 'No',
      Eval_Date: item.evalDate || '',
      PEP_Received: item.pepReceived || '',
      Vaccination_History: item.vaccinationHistory || '',
      Supervisor_Notified: item.supervisorNotified || '',
      Supervisor_Name: item.supervisorName || '',
      IPC_Notified: item.ipcNotified || '',
      IPC_Notify_Date: item.ipcNotifyDate || ''
    }));

    const headers = Object.keys(exportItems[0]).join(',');
    const rows = exportItems.map(item => 
      Object.values(item).map(val => `"${String(val).replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const csvContent = `${headers}\n${rows}`;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Sharps_Exposure_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const analytics = useMemo(() => {
    if (filteredData.length === 0) return null;
    const monthMap: Record<string, any> = {};
    filteredData.forEach(d => {
      const month = d.dateOfInjury.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { name: month, census: 0 };
      monthMap[month].census++;
    });
    const monthlyData = Object.values(monthMap).sort((a: any, b: any) => a.name.localeCompare(b.name));
    const typeCount: Record<string, number> = {};
    filteredData.forEach(d => { typeCount[d.exposureType || 'Unspecified'] = (typeCount[d.exposureType || 'Unspecified'] || 0) + 1; });
    const typeData = Object.entries(typeCount).map(([name, value]) => ({ name, value }));
    const jobCount: Record<string, number> = {};
    filteredData.forEach(d => { jobCount[d.jobTitle || 'Other'] = (jobCount[d.jobTitle || 'Other'] || 0) + 1; });
    const jobData = Object.entries(jobCount).map(([name, value]) => ({ name, value }));
    return { monthlyData, typeData, jobData };
  }, [filteredData]);

  const handleRowClick = (item: any) => { setFormModal({ show: true, item: { ...item }, isEditable: false }); };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target; setFormModal(prev => ({ ...prev, item: { ...prev.item, [name]: value } }));
  };

  const saveChanges = async () => { 
    await updateNeedlestickReport(formModal.item); 
    setFormModal({ show: false, item: null, isEditable: false }); 
    loadData(); 
  };

  const promptDeleteConfirmation = (item: any) => {
    setItemToDelete(item);
    setShowPasswordConfirm(true);
  };

  const handlePasswordConfirmed = async (password: string) => {
    if (!itemToDelete || !user) return;

    setPasswordConfirmLoading(true);
    if (!validatePassword(user, password)) {
      alert("Incorrect password. Deletion failed.");
      setPasswordConfirmLoading(false);
      return;
    }

    try {
      await deleteRecord('reports_needlestick', itemToDelete.id);
      setFormModal({ show: false, item: null, isEditable: false });
      setShowPasswordConfirm(false);
      setItemToDelete(null);
      loadData();
    } catch (e) { 
      const msg = e instanceof Error ? e.message : "Failed to delete record.";
      console.error("Delete Operation Error in Dashboard:", e);
      alert(msg); 
    } finally {
      setPasswordConfirmLoading(false);
    }
  };

  const content = (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex gap-4 items-center">
                {!isNested && <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-red-600 font-bold transition-colors"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}><List size={14} /> List</button>
                    <button onClick={() => setViewMode('analysis')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}><BarChart2 size={14} /> Analysis</button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportCSV}
                  disabled={filteredData.length === 0}
                  className="bg-white text-slate-600 px-4 py-2 rounded-lg font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95 text-xs"
                >
                  <Download size={18} /> Export Full CSV
                </button>
                <button onClick={() => navigate('/report-needlestick')} className="bg-red-500 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest shadow hover:bg-red-600 flex items-center gap-2 transition-all active:scale-95 text-xs">
                  <PlusCircle size={18} /> Log Injury
                </button>
            </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:hidden">
            <div className="flex items-center gap-3 min-w-max">
                <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                    <Filter size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span>
                </div>
                <div className="flex items-center gap-2">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-red-500 outline-none font-medium bg-slate-50/50" value={filterJob} onChange={(e) => setFilterJob(e.target.value)}>
                        <option value="">All Roles</option>
                        {JOB_CATEGORIES_NS.map(j => <option key={j} value={j}>{j}</option>)}
                    </select>
                </div>
                <div className="h-6 w-px bg-slate-100 mx-1"></div>
                <button onClick={() => { setFilterJob(''); setFilterLocation(''); setStartDate(''); setEndDate(''); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><RotateCcw size={14} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 order-2 lg:order-1 min-w-0">
                {viewMode === 'analysis' ? (
                     <div className="flex flex-col gap-8 print:block">
                        <div className="text-center flex flex-col gap-2 mb-6">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Needlestick & Body Fluid Exposure</h2>
                            <div className="h-1.5 w-24 bg-red-600 mx-auto mt-2 rounded-full"></div>
                        </div>
                        {!analytics ? <div className="p-20 text-center text-slate-400 font-bold">No records found.</div> : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:gap-4">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><Calendar size={14} /> Census Trend</h3>
                                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.monthlyData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{fontSize: 10}} /><YAxis tick={{fontSize: 10}} /><RechartsTooltip /><Line type="monotone" dataKey="census" stroke="#ef4444" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><Briefcase size={14} /> By Job Category</h3>
                                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.jobData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={140} tick={{fontSize: 9, fontWeight: 'bold'}} /><RechartsTooltip /><Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fontWeight: 'bold' }} /></BarChart></ResponsiveContainer></div>
                                </div>
                            </div>
                        )}
                     </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                              <tr>
                                <th className="px-6 py-4">Injury Date</th>
                                <th className="px-6 py-4">Staff Name</th>
                                <th className="px-6 py-4">Job Title</th>
                                <th className="px-6 py-4">Exposure</th>
                                <th className="px-6 py-4">Location</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr> : filteredData.map((report) => (
                                    <tr key={report.id} onClick={() => handleRowClick(report)} className="hover:bg-amber-50/50 transition-colors cursor-pointer group">
                                      <td className="px-6 py-3">{report.dateOfInjury}</td>
                                      <td className="px-6 py-3 font-bold text-red-600">{formatName(report.hcwName?.split(', ')[0] || '', report.hcwName?.split(', ')[1] || '')}</td>
                                      <td className="px-6 py-3">{report.jobTitle}</td>
                                      <td className="px-6 py-3 font-medium text-amber-600">{report.exposureType}</td>
                                      <td className="px-6 py-3">{report.workLocation}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>

        {formModal.show && formModal.item && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
                    <div className="bg-red-600 text-white p-6 sticky top-0 z-10 flex justify-between items-center shadow-lg">
                        <h2 className="font-black text-xl leading-tight">
                           {formModal.isEditable ? 'Edit Incident Log' : 'Injury Incident Details'}
                        </h2>
                        <div className="flex items-center gap-2">
                          {isAuthenticated && !formModal.isEditable && (
                            <>
                              <button onClick={() => setFormModal(prev => ({ ...prev, isEditable: true }))} className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold">
                                <Edit3 size={16}/> Edit
                              </button>
                              <button onClick={() => promptDeleteConfirmation(formModal.item)} className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold text-white shadow-sm">
                                <Trash2 size={16}/> Delete
                              </button>
                            </>
                          )}
                          <button onClick={() => setFormModal({ show: false, item: null, isEditable: false })} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                    </div>

                    <div className="p-6 md:p-8 flex flex-col gap-8">
                        {/* Section 1: Staff Info */}
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <Users size={18} className="text-red-500"/> Staff Identification
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <Input label="Staff Name" name="hcwName" value={formModal.isEditable ? formModal.item.hcwName : formatName(formModal.item.hcwName?.split(',')[0] || '', formModal.item.hcwName?.split(',')[1] || '')} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Employee/Hosp #" name="hospitalNumber" value={formModal.item.hospitalNumber} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Select label="Job Title" name="jobTitle" options={JOB_CATEGORIES_NS} value={formModal.item.jobTitle} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Department" name="department" value={formModal.item.department} onChange={handleInputChange} disabled={!formModal.isEditable} />
                            </div>
                        </section>

                        {/* Section 2: Exposure Data */}
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <ShieldAlert size={18} className="text-red-500"/> Exposure Details
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Input label="Date of Injury" name="dateOfInjury" type="date" value={formModal.item.dateOfInjury} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Time of Injury" name="timeOfInjury" value={formModal.item.timeOfInjury} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Select label="Work Location" name="workLocation" options={AREAS} value={formModal.item.workLocation} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Exposure Type" name="exposureType" value={formModal.item.exposureType} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <div className="md:col-span-2">
                                  <Input label="Device Involved" name="deviceInvolved" value={formModal.item.deviceInvolved} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Follow-up */}
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <ClipboardCheck size={18} className="text-red-500"/> Clinical Follow-up
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <Select label="Source ID'd?" name="sourceIdentified" options={['Yes', 'No']} value={formModal.item.sourceIdentified} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Source MRN" name="sourceMrn" value={formModal.item.sourceMrn} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Select label="PEP Received?" name="pepReceived" options={['Yes', 'No', 'N/A']} value={formModal.item.pepReceived} onChange={handleInputChange} disabled={!formModal.isEditable} />
                            </div>
                        </section>
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-end items-center gap-3 sticky bottom-0">
                        <button onClick={() => setFormModal({ show: false, item: null, isEditable: false })} className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">Close</button>
                        {formModal.isEditable && (
                          <button onClick={saveChanges} className="bg-red-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-red-700 flex items-center gap-2 transition-all">
                            <Save size={20}/> Save Changes
                          </button>
                        )}
                    </div>
                </div>
            </div>
        )}

        <PasswordConfirmModal
          show={showPasswordConfirm}
          onClose={() => setShowPasswordConfirm(false)}
          onConfirm={handlePasswordConfirmed}
          loading={passwordConfirmLoading}
          title="Confirm Incident Deletion"
          description={`Enter your password to permanently delete the incident report for ${itemToDelete?.hcwName || ''}.`}
        />
    </div>
  );

  return isNested ? content : <Layout title="Needlestick & Sharp Injury Hub">{content}</Layout>;
};

export default NeedlestickDashboard;
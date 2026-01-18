import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getNotifiableReports, updateNotifiableReport, deleteRecord, syncToGoogleSheets } from '../../services/ipcService';
import { 
  AREAS, NOTIFIABLE_DISEASES, PATIENT_OUTCOMES, BARANGAYS,
  DENGUE_VACCINE_OPTIONS, DENGUE_CLINICAL_CLASSES,
  ILI_TRAVEL_OPTIONS, ILI_VACCINE_OPTIONS,
  LEPTO_EXPOSURE_OPTIONS,
  AFP_POLIO_VACCINE_OPTIONS,
  HFMD_SYMPTOMS, HFMD_COMMUNITY_CASES_OPTIONS, HFMD_EXPOSURE_TYPE_OPTIONS,
  MEASLES_SYMPTOMS, MEASLES_VACCINE_OPTIONS,
  ROTA_VACCINE_OPTIONS,
  RABIES_RIG_OPTIONS, RABIES_VACCINE_PRIOR_OPTIONS,
  CHIKUNGUNYA_SYMPTOMS, CHIKUNGUNYA_TRAVEL_OPTIONS,
  PERTUSSIS_VACCINE_OPTIONS, PERTUSSIS_SYMPTOMS,
  AMES_SYMPTOMS, AMES_VACCINES_LIST, AMES_TRAVEL_OPTIONS,
  SARI_MEDICATIONS, SARI_HOUSEHOLD_ILI_OPTIONS, SARI_SCHOOL_ILI_OPTIONS, 
  SARI_FLU_VACCINE_OPTIONS, SARI_ANIMAL_EXPOSURE_OPTIONS, SARI_TRAVEL_OPTIONS
} from '../../constants';
import { 
  ChevronLeft, 
  Save, 
  X, 
  User, 
  Lock, 
  List, 
  BarChart2, 
  Plus, 
  Activity,
  Filter,
  RotateCcw,
  Printer,
  TrendingUp,
  MapPin,
  ClipboardList,
  Users,
  FileText,
  Bell,
  PlusCircle,
  Edit3,
  Trash2,
  Database,
  CloudDownload,
  Loader2,
  Syringe, Plane, Droplets, ShieldCheck, Pill, Wind, AlertTriangle,
  Download
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid 
} from 'recharts';

interface Props {
  isNested?: boolean;
  viewMode?: 'list' | 'analysis';
}

const NotifiableDashboard: React.FC<Props> = ({ isNested, viewMode: initialViewMode }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, validatePassword } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>(initialViewMode || 'list');
  const [formModal, setFormModal] = useState<{ show: boolean, item: any | null, isEditable: boolean }>({
    show: false, item: null, isEditable: false
  });
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

  const [filterDisease, setFilterDisease] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('Active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedQuarter, setSelectedQuarter] = useState('');

  useEffect(() => {
    if (initialViewMode) setViewMode(initialViewMode);
  }, [initialViewMode]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const reports = await getNotifiableReports();
    reports.sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());
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

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    const exportItems = filteredData.map(item => ({
      Report_Date: item.dateReported,
      Patient_Name: formatName(item.lastName, item.firstName),
      Hospital_Number: item.hospitalNumber,
      Disease: item.disease,
      Ward: item.area,
      Status: item.outcome || 'Admitted',
      Admission_Date: item.dateOfAdmission,
      Reporter: item.reporterName
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
    link.setAttribute('download', `Notifiable_Diseases_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const handleQuarterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const q = e.target.value; 
    setSelectedQuarter(q); 
    const year = selectedYear || new Date().getFullYear().toString();
    if (q === 'Q1 (Jan-Mar)') { setStartDate(`${year}-01-01`); setEndDate(`${year}-03-31`); }
    else if (q === 'Q2 (Apr-Jun)') { setStartDate(`${year}-04-01`); setEndDate(`${year}-06-30`); }
    else if (q === 'Q3 (Jul-Sep)') { setStartDate(`${year}-07-01`); setEndDate(`${year}-09-30`); }
    else if (q === 'Q4 (Oct-Dec)') { setStartDate(`${year}-10-01`); setEndDate(`${year}-12-31`); }
    else if (q === 'YTD') { setStartDate(`${year}-01-01`); setEndDate(new Date().toISOString().split('T')[0]); }
    else { setStartDate(''); setEndDate(''); }
  };

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const itemDate = new Date(item.dateReported);
      const matchesYear = selectedYear ? itemDate.getFullYear().toString() === selectedYear : true;
      const matchesDisease = filterDisease ? item.disease === filterDisease : true;
      const matchesArea = filterArea ? item.area === filterArea : true;
      
      let matchesOutcome = true;
      if (filterOutcome === 'Active') {
        matchesOutcome = !item.outcome || item.outcome === 'Admitted' || item.outcome === 'ER-level';
      } else if (filterOutcome !== 'All') {
        matchesOutcome = item.outcome === filterOutcome;
      }
      
      const matchesDateRange = (startDate ? itemDate >= new Date(startDate) : true) && 
                         (endDate ? itemDate <= new Date(endDate) : true);
      return matchesYear && matchesDisease && matchesArea && matchesDateRange && matchesOutcome;
    });
  }, [data, filterDisease, filterArea, filterOutcome, startDate, endDate, selectedYear]);

  const summaryStats = useMemo(() => {
    const active = data.filter(item => !item.outcome || item.outcome === 'Admitted' || item.outcome === 'ER-level');
    const counts: Record<string, number> = {};
    active.forEach(item => { if(item.disease) counts[item.disease] = (counts[item.disease] || 0) + 1; });
    return {
      totalActive: active.length,
      diseaseCensus: Object.entries(counts).sort((a, b) => b[1] - a[1])
    };
  }, [data]);

  const analytics = useMemo(() => {
    if (filteredData.length === 0) return null;
    const diseaseMonthMap: Record<string, any> = {};
    filteredData.forEach(d => {
      const month = d.dateReported.substring(0, 7);
      const disease = d.disease;
      if (!diseaseMonthMap[month]) diseaseMonthMap[month] = { name: month };
      diseaseMonthMap[month][disease] = (diseaseMonthMap[month][disease] || 0) + 1;
      diseaseMonthMap[month].total = (diseaseMonthMap[month].total || 0) + 1;
    });
    const monthlyTrendData = Object.values(diseaseMonthMap).sort((a: any, b: any) => a.name.localeCompare(b.name));
    const outcomeMap: Record<string, number> = {};
    filteredData.forEach(d => { const key = d.outcome || 'Active'; outcomeMap[key] = (outcomeMap[key] || 0) + 1; });
    const outcomeData = Object.entries(outcomeMap).map(([name, value]) => ({ name, value }));
    return { monthlyTrendData, outcomeData };
  }, [filteredData]);

  const handleRowClick = (item: any) => { setFormModal({ show: true, item: { ...item }, isEditable: false }); };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormModal(prev => ({ ...prev, item: { ...prev.item, [name]: value } }));
  };

  const handleModalCheckboxToggle = (field: string, value: string) => {
    setFormModal(prev => {
      const currentList = prev.item?.[field] || [];
      const updatedList = currentList.includes(value)
        ? currentList.filter((item: string) => item !== value)
        : [...currentList, value];
      return {
        ...prev,
        item: { ...prev.item, [field]: updatedList }
      };
    });
  };

  const handleModalAmesVaccine = (vaccine: string, field: 'doses' | 'lastDate', value: string) => {
    setFormModal(prev => ({
      ...prev,
      item: {
        ...prev.item,
        amesVaccines: {
          ...(prev.item?.amesVaccines || {}),
          [vaccine]: {
            ...(prev.item?.amesVaccines?.[vaccine] || { doses: '', lastDate: '' }),
            [field]: value
          }
        }
      }
    }));
  };

  const saveChanges = async () => {
    await updateNotifiableReport(formModal.item);
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
      await deleteRecord('report_notif', itemToDelete.id);
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

  const handleBulkSync = async () => {
    if (!window.confirm("Sync all currently filtered records to Google Sheets? This will create redundant entries if already synced.")) return;
    setSyncing(true);
    let successCount = 0;
    try {
      for (const record of filteredData) {
        const ok = await syncToGoogleSheets(record);
        if (ok) successCount++;
      }
      alert(`Successfully synced ${successCount} records to Google Sheets.`);
    } catch (err) {
      alert("Error during bulk sync.");
    } finally {
      setSyncing(false);
    }
  };

  const COLORS = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#111827'];

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
                  <Download size={18} /> Export CSV
                </button>
                {isAuthenticated && (
                  <button 
                    onClick={handleBulkSync}
                    disabled={syncing || filteredData.length === 0}
                    className="bg-white text-slate-600 px-4 py-2 rounded-lg font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95 text-xs"
                  >
                    {syncing ? <Loader2 size={18} className="animate-spin" /> : <CloudDownload size={18} />}
                    Backup to Sheets
                  </button>
                )}
                <button onClick={() => navigate('/report-disease')} className="bg-red-600 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest shadow hover:bg-red-700 flex items-center gap-2 transition-all active:scale-95 text-xs">
                  <PlusCircle size={18} /> New Report
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
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-red-500 outline-none font-medium bg-slate-50/50" value={filterDisease} onChange={(e) => setFilterDisease(e.target.value)}>
                        <option value="">All Diseases</option>
                        {NOTIFIABLE_DISEASES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                </div>
                <div className="h-6 w-px bg-slate-100 mx-1"></div>
                <div className="flex items-center gap-2">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-red-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                    </select>
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-red-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedQuarter} onChange={handleQuarterChange}>
                        <option value="">Full Year</option>
                        <option value="Q1 (Jan-Mar)">Q1</option>
                        <option value="Q2 (Apr-Jun)">Q2</option>
                        <option value="Q3 (Jul-Sep)">Q3</option>
                        <option value="Q4 (Oct-Dec)">Q4</option>
                        <option value="YTD">YTD</option>
                    </select>
                </div>
                <button onClick={() => { setFilterDisease(''); setFilterOutcome('Active'); setStartDate(''); setEndDate(''); setSelectedQuarter(''); setSelectedYear(new Date().getFullYear().toString()); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><RotateCcw size={14} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 order-2 lg:order-1 min-w-0">
                {viewMode === 'analysis' ? (
                    <div className="flex flex-col gap-8 print:block">
                        <div className="text-center flex flex-col gap-2 mb-6">
                          <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Notifiable Diseases Analysis</h2>
                          <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{selectedQuarter || 'Annual'} {selectedYear} Report</p>
                          <div className="h-1.5 w-24 bg-red-600 mx-auto mt-2 rounded-full"></div>
                        </div>
                        {!analytics ? <div className="p-20 text-center text-slate-400 font-bold">No data found.</div> : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:gap-4">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><TrendingUp size={14}/> Monthly Census Trend</h3>
                                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.monthlyTrendData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{fontSize: 10}} /><YAxis tick={{fontSize: 10}} /><RechartsTooltip /><Legend wrapperStyle={{fontSize: 10, fontWeight: 'bold'}} /><Bar dataKey={filterDisease || "total"} fill="#ef4444" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><ClipboardList size={14}/> Outcome Distribution</h3>
                                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.outcomeData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" label={({name, value}) => `${name}: ${value}`}>{analytics.outcomeData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RechartsTooltip /></PieChart></ResponsiveContainer></div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                              <tr>
                                <th className="px-6 py-4">Report Date</th>
                                <th className="px-6 py-4">Patient</th>
                                <th className="px-6 py-4">Hosp #</th>
                                <th className="px-6 py-4">Disease</th>
                                <th className="px-6 py-4 text-center">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? <tr><td colSpan={5} className="p-8 text-center">Loading...</td></tr> : filteredData.map((report) => (
                                    <tr key={report.id} onClick={() => handleRowClick(report)} className="hover:bg-red-50/50 transition-colors cursor-pointer group">
                                      <td className="px-6 py-3">{report.dateReported}</td>
                                      <td className="px-6 py-3 font-bold text-red-600">{formatName(report.lastName, report.firstName)}</td>
                                      <td className="px-6 py-3 text-slate-500 font-medium">{report.hospitalNumber}</td>
                                      <td className="px-6 py-3 font-medium text-red-600">{report.disease}</td>
                                      <td className="px-6 py-3 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${!report.outcome || report.outcome === 'Admitted' || report.outcome === 'ER-level' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>{report.outcome || "Admitted"}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Condensed Summary Sidebar - Standardized Width */}
            {viewMode !== 'analysis' && (
              <div className="w-full lg:w-48 flex flex-col gap-3 print:hidden order-1 lg:order-2">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      <div className="px-3 py-2 border-b border-slate-50 bg-slate-50/30">
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Data Cards</span>
                      </div>
                      <button 
                        onClick={() => { setFilterOutcome('Active'); setFilterDisease(''); }}
                        className="p-4 flex flex-col gap-0.5 text-left hover:bg-slate-50 transition-colors group"
                      >
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-red-600">Total Active</span>
                            <Bell size={10} className="text-red-500 opacity-40" />
                          </div>
                          <span className="text-2xl font-black text-slate-900 leading-none">{summaryStats.totalActive}</span>
                      </button>
                  </div>

                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                          <Activity size={10} className="text-slate-400" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">Per Disease</span>
                      </div>
                      <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
                          {summaryStats.diseaseCensus.map(([name, count]) => (
                              <button 
                                key={name} 
                                onClick={() => { setFilterDisease(name); setFilterOutcome('Active'); }}
                                className="flex items-center justify-between bg-slate-50/50 px-2 py-1.5 rounded-md border border-slate-100/50 hover:border-red-400 hover:bg-white transition-all text-left group"
                              >
                                  <span className="text-[7px] font-bold text-slate-500 truncate mr-1 uppercase group-hover:text-red-600">{name}</span>
                                  <span className="text-[9px] font-black text-red-600">{count}</span>
                              </button>
                          ))}
                      </div>
                  </div>
              </div>
            )}
        </div>

        {formModal.show && formModal.item && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
                    <div className="bg-red-700 text-white p-6 sticky top-0 z-10 flex justify-between items-center shadow-lg">
                        <h2 className="font-black text-xl leading-tight">
                          {formModal.isEditable ? 'Edit Disease Record' : 'Disease Case Details'}
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
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <Users size={18} className="text-red-600"/> Patient Identification
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <Input label="Hospital Number" name="hospitalNumber" value={formModal.item.hospitalNumber} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Last Name" name="lastName" value={formModal.isEditable ? formModal.item.lastName : getPrivacyValue(formModal.item.lastName)} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="First Name" name="firstName" value={formModal.isEditable ? formModal.item.firstName : getPrivacyValue(formModal.item.firstName)} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Calculated Age" name="age" value={formModal.item.age} readOnly className="bg-slate-50 font-bold" />
                                <Select label="Sex" name="sex" options={['Male', 'Female']} value={formModal.item.sex} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <div className="md:col-span-2">
                                  <Input label="Barangay" name="barangay" value={formModal.item.barangay} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                </div>
                                <Input label="City" name="city" value={formModal.item.city} onChange={handleInputChange} disabled={!formModal.isEditable} />
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <Activity size={18} className="text-red-600"/> Clinical Context
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Select label="Notifiable Disease" name="disease" options={NOTIFIABLE_DISEASES} value={formModal.item.disease} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Select label="Assigned Area" name="area" options={AREAS} value={formModal.item.area} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Admission Date" name="dateOfAdmission" type="date" value={formModal.item.dateOfAdmission} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Date Reported" name="dateReported" type="date" value={formModal.item.dateReported} readOnly className="bg-slate-50" />
                            </div>

                            {/* --- DISEASE SPECIFIC QUESTIONNAIRES --- */}
                            {formModal.item.disease === "Dengue" && (
                                <div className="p-6 bg-red-50/50 rounded-[1.5rem] border border-red-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-black text-red-800 uppercase flex items-center gap-2"><Syringe size={14}/> Dengue Specific Questionnaire</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <Select label="Received Dengue Vaccine?" name="dengueVaccine" options={DENGUE_VACCINE_OPTIONS} value={formModal.item.dengueVaccine} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        {formModal.item.dengueVaccine === 'Yes' && (
                                            <>
                                                <Input label="Date of 1st Dose" name="dengueDose1" type="date" value={formModal.item.dengueDose1} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                                <Input label="Date of Last Dose" name="dengueDoseLast" type="date" value={formModal.item.dengueDoseLast} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                            </>
                                        )}
                                        <div className="lg:col-span-3">
                                            <Select label="Clinical Classification" name="dengueClinicalClass" options={DENGUE_CLINICAL_CLASSES} value={formModal.item.dengueClinicalClass} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {formModal.item.disease === "Influenza-like Illness" && (
                                <div className="p-6 bg-blue-50/50 rounded-[1.5rem] border border-blue-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-black text-blue-800 uppercase flex items-center gap-2"><Plane size={14}/> ILI Surveillance Details</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select label="History of Travel within 21 days?" name="iliTravel" options={ILI_TRAVEL_OPTIONS} value={formModal.item.iliTravel} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        {formModal.item.iliTravel === 'Yes' && <Input label="Travel Location" name="iliTravelLoc" value={formModal.item.iliTravelLoc} onChange={handleInputChange} disabled={!formModal.isEditable} />}
                                        <Select label="Received Influenza Vaccine?" name="iliVaccine" options={ILI_VACCINE_OPTIONS} value={formModal.item.iliVaccine} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        {formModal.item.iliVaccine === 'Yes' && <Input label="Date of Last Dose (Month & Year)" name="iliVaccineDate" value={formModal.item.iliVaccineDate} onChange={handleInputChange} disabled={!formModal.isEditable} placeholder="e.g. October 2023" />}
                                    </div>
                                </div>
                            )}

                            {formModal.item.disease === "Leptospirosis" && (
                                <div className="p-6 bg-amber-50/50 rounded-[1.5rem] border border-amber-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-black text-amber-800 uppercase flex items-center gap-2"><Droplets size={14}/> Leptospirosis Exposure Tracking</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select label="Exposure to animal urine?" name="leptoExposure" options={LEPTO_EXPOSURE_OPTIONS} value={formModal.item.leptoExposure} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        <Input label="Place of Exposure" name="leptoPlace" value={formModal.item.leptoPlace} onChange={handleInputChange} disabled={!formModal.isEditable} placeholder="Enter specific location" />
                                    </div>
                                </div>
                            )}

                            {formModal.item.disease === "Acute Flaccid Paralysis (Poliomyelitis)" && (
                                <div className="p-6 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100 animate-in slide-in-from-top-2">
                                    <div className="max-w-xs">
                                        <Select label="Polio Vaccine Given?" name="afpPolioVaccine" options={AFP_POLIO_VACCINE_OPTIONS} value={formModal.item.afpPolioVaccine} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                    </div>
                                </div>
                            )}

                            {formModal.item.disease === "Hand, Foot and Mouth Disease" && (
                                <div className="p-6 bg-orange-50/50 rounded-[1.5rem] border border-orange-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-black text-orange-800 uppercase flex items-center gap-2"><Activity size={14}/> HFMD Symptom Assessment</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {HFMD_SYMPTOMS.map(sym => (
                                            <label key={sym} className={`flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-orange-200 ${formModal.isEditable ? 'cursor-pointer hover:bg-orange-50' : 'cursor-default'}`}>
                                                <input type="checkbox" checked={(formModal.item.hfmdSymptoms || []).includes(sym)} onChange={() => handleModalCheckboxToggle('hfmdSymptoms', sym)} disabled={!formModal.isEditable} className="rounded text-orange-500" /> {sym}
                                            </label>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <Select label="Known Cases in Community?" name="hfmdCommunityCases" options={HFMD_COMMUNITY_CASES_OPTIONS} value={formModal.item.hfmdCommunityCases} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        <Select label="Exposure Site Type" name="hfmdExposureType" options={HFMD_EXPOSURE_TYPE_OPTIONS} value={formModal.item.hfmdExposureType} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                    </div>
                                </div>
                            )}

                            {formModal.item.disease === "Measles" && (
                                <div className="p-6 bg-rose-50/50 rounded-[1.5rem] border border-rose-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-black text-rose-800 uppercase flex items-center gap-2"><Activity size={14}/> Measles Clinical Checklist</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {MEASLES_SYMPTOMS.map(sym => (
                                            <label key={sym} className={`flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-rose-200 ${formModal.isEditable ? 'cursor-pointer' : ''}`}>
                                                <input type="checkbox" checked={(formModal.item.measlesSymptoms || []).includes(sym)} onChange={() => handleModalCheckboxToggle('measlesSymptoms', sym)} disabled={!formModal.isEditable} className="rounded text-rose-500" /> {sym}
                                            </label>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <Select label="Received Measles Vaccine?" name="measlesVaccine" options={MEASLES_VACCINE_OPTIONS} value={formModal.item.measlesVaccine} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        {formModal.item.measlesVaccine === 'Yes' && <Input label="Date of Last Dose" name="measlesVaccineDate" value={formModal.item.measlesVaccineDate} onChange={handleInputChange} disabled={!formModal.isEditable} />}
                                    </div>
                                </div>
                            )}

                            {formModal.item.disease === "Rotavirus" && (
                                <div className="p-6 bg-indigo-50/50 rounded-[1.5rem] border border-indigo-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select label="Received Rotavirus Vaccine?" name="rotaVaccine" options={ROTA_VACCINE_OPTIONS} value={formModal.item.rotaVaccine} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        {formModal.item.rotaVaccine === 'Yes' && <Input label="Date of Last Dose" name="rotaVaccineDate" value={formModal.item.rotaVaccineDate} onChange={handleInputChange} disabled={!formModal.isEditable} />}
                                    </div>
                                </div>
                            )}

                            {formModal.item.disease === "Rabies" && (
                                <div className="p-6 bg-slate-900 rounded-[1.5rem] text-white flex flex-col gap-5 animate-in slide-in-from-top-2 shadow-xl">
                                    <h4 className="text-xs font-black text-slate-400 uppercase flex items-center gap-2 tracking-widest"><ShieldCheck size={14} className="text-red-500" /> Rabies Post-Exposure Log</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Select label="Received RIG?" name="rabiesRIG" options={RABIES_RIG_OPTIONS} value={formModal.item.rabiesRIG} onChange={handleInputChange} disabled={!formModal.isEditable} className="bg-slate-800 text-white border-slate-700" />
                                        <Select label="Completed Prior Vaccine?" name="rabiesVaccinePrior" options={RABIES_VACCINE_PRIOR_OPTIONS} value={formModal.item.rabiesVaccinePrior} onChange={handleInputChange} disabled={!formModal.isEditable} className="bg-slate-800 text-white border-slate-700" />
                                        <Input label="Month & Year 1st Dose" name="rabiesVaccineDate" value={formModal.item.rabiesVaccineDate} onChange={handleInputChange} disabled={!formModal.isEditable} className="bg-slate-800 text-white border-slate-700" placeholder="MM/YYYY" />
                                    </div>
                                </div>
                            )}

                            {formModal.item.disease === "Chikungunya Viral Disease" && (
                                <div className="p-6 bg-emerald-50/50 rounded-[1.5rem] border border-emerald-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-black text-emerald-800 uppercase flex items-center gap-2"><Activity size={14}/> Chikungunya Symptom Checklist</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {CHIKUNGUNYA_SYMPTOMS.map(sym => (
                                            <label key={sym} className={`flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-emerald-200 ${formModal.isEditable ? 'cursor-pointer' : ''}`}>
                                                <input type="checkbox" checked={(formModal.item.chikSymptoms || []).includes(sym)} onChange={() => handleModalCheckboxToggle('chikSymptoms', sym)} disabled={!formModal.isEditable} className="rounded text-emerald-500" /> {sym}
                                            </label>
                                        ))}
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                        <Select label="Travel within 30 days?" name="chikTravel" options={CHIKUNGUNYA_TRAVEL_OPTIONS} value={formModal.item.chikTravel} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        {formModal.item.chikTravel === 'Yes' && <Input label="Destination" name="chikTravelLoc" value={formModal.item.chikTravelLoc} onChange={handleInputChange} disabled={!formModal.isEditable} />}
                                    </div>
                                </div>
                            )}

                            {formModal.item.disease === "Pertussis" && (
                                <div className="p-6 bg-teal-50/50 rounded-[1.5rem] border border-teal-100 flex flex-col gap-5 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-black text-teal-800 uppercase flex items-center gap-2"><Activity size={14}/> Pertussis Assessment</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select label="Received Vaccine?" name="pertVaccine" options={PERTUSSIS_VACCINE_OPTIONS} value={formModal.item.pertVaccine} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        {formModal.item.pertVaccine === 'Yes' && <Input label="Last Dose Date" name="pertVaccineDate" value={formModal.item.pertVaccineDate} onChange={handleInputChange} disabled={!formModal.isEditable} />}
                                        <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-2">
                                            {PERTUSSIS_SYMPTOMS.map(sym => (
                                                <label key={sym} className={`flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-teal-200 ${formModal.isEditable ? 'cursor-pointer' : ''}`}>
                                                    <input type="checkbox" checked={(formModal.item.pertSymptoms || []).includes(sym)} onChange={() => handleModalCheckboxToggle('pertSymptoms', sym)} disabled={!formModal.isEditable} className="rounded text-teal-500" /> {sym}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {(formModal.item.disease === "Acute Meningitis Encephalitis Syndrome" || formModal.item.disease === "Bacterial Meningitis") && (
                                <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-200 flex flex-col gap-6 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-black text-slate-800 uppercase flex items-center gap-2"><ShieldCheck size={14}/> AMES - Bacterial Meningitis Questionnaire</h4>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {AMES_SYMPTOMS.map(sym => (
                                            <label key={sym} className={`flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-slate-300 ${formModal.isEditable ? 'cursor-pointer' : ''}`}>
                                                <input type="checkbox" checked={(formModal.item.amesSymptoms || []).includes(sym)} onChange={() => handleModalCheckboxToggle('amesSymptoms', sym)} disabled={!formModal.isEditable} className="rounded text-slate-700" /> {sym}
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex flex-col gap-3">
                                        <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-widest border-b pb-1">Vaccination History</h5>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {AMES_VACCINES_LIST.map(v => (
                                                <div key={v} className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
                                                    <span className="text-[10px] font-black text-slate-800 uppercase">{v}</span>
                                                    <Input label="Doses" value={formModal.item.amesVaccines?.[v]?.doses || ''} onChange={e => handleModalAmesVaccine(v, 'doses', e.target.value)} disabled={!formModal.isEditable} />
                                                    <Input label="Last Date" type="date" value={formModal.item.amesVaccines?.[v]?.lastDate || ''} onChange={e => handleModalAmesVaccine(v, 'lastDate', e.target.value)} disabled={!formModal.isEditable} />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select label="History of Travel?" name="amesTravel" options={AMES_TRAVEL_OPTIONS} value={formModal.item.amesTravel} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        {formModal.item.amesTravel === 'Yes' && <Input label="Destination" name="amesTravelLoc" value={formModal.item.amesTravelLoc} onChange={handleInputChange} disabled={!formModal.isEditable} />}
                                    </div>
                                </div>
                            )}

                            {formModal.item.disease === "Severe Acute Respiratory Infection" && (
                                <div className="p-6 bg-sky-50 rounded-[1.5rem] border border-sky-100 flex flex-col gap-6 animate-in slide-in-from-top-2">
                                    <h4 className="text-xs font-black text-sky-800 uppercase flex items-center gap-2"><Wind size={14}/> SARI Surveillance Criteria</h4>
                                    <div className="flex flex-col gap-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medications prior</label>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                            {SARI_MEDICATIONS.map(med => (
                                                <label key={med} className={`flex items-center gap-2 text-[10px] font-bold text-slate-600 bg-white p-2 rounded-lg border border-sky-200 ${formModal.isEditable ? 'cursor-pointer' : ''}`}>
                                                    <input type="checkbox" checked={(formModal.item.sariMeds || []).includes(med)} onChange={() => handleModalCheckboxToggle('sariMeds', med)} disabled={!formModal.isEditable} className="rounded text-sky-500" /> {med}
                                                </label>
                                            ))}
                                            <Input label="Others" name="sariMedsOther" value={formModal.item.sariMedsOther} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <Select label="ILI in Household?" name="sariHouseholdILI" options={SARI_HOUSEHOLD_ILI_OPTIONS} value={formModal.item.sariHouseholdILI} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        <Select label="ILI in School/Daycare?" name="sariSchoolILI" options={SARI_SCHOOL_ILI_OPTIONS} value={formModal.item.sariSchoolILI} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        <Select label="Flu vaccine?" name="sariFluVaccine" options={SARI_FLU_VACCINE_OPTIONS} value={formModal.item.sariFluVaccine} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <Select label="History of Travel?" name="sariTravel" options={SARI_TRAVEL_OPTIONS} value={formModal.item.sariTravel} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                        {formModal.item.sariTravel === 'Yes' && <Input label="Destination" name="sariTravelLoc" value={formModal.item.sariTravelLoc} onChange={handleInputChange} disabled={!formModal.isEditable} />}
                                    </div>
                                </div>
                            )}
                            {/* --- END DISEASE SPECIFIC SECTIONS --- */}

                        </section>

                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <FileText size={18} className="text-red-600"/> Outcome & Reporter
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Select label="Status" name="outcome" options={PATIENT_OUTCOMES} value={formModal.item.outcome} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Reporter Name" name="reporterName" value={formModal.item.reporterName} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Logged On" name="dateReported" value={formModal.item.dateReported} readOnly className="bg-slate-50" />
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
          title="Confirm Disease Record Deletion"
          description={`Enter your password to permanently delete the notifiable disease record for ${itemToDelete?.lastName || ''}, ${itemToDelete?.firstName || ''}.`}
        />
      </div>
  );

  return isNested ? content : <Layout title="Notifiable Diseases Hub">{content}</Layout>;
};

export default NotifiableDashboard;
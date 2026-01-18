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
                        <option value="2026">2026</option>
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
        {/* ... Rest of component content ... */}
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
            {/* Sidebar Cards and Modal logic remains same ... */}
        </div>
        {/* ... Modal same ... */}
    </div>
  );

  return isNested ? content : <Layout title="Notifiable Diseases Hub">{content}</Layout>;
};

export default NotifiableDashboard;
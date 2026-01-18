import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getTBReports, updateTBReport, deleteRecord } from '../../services/ipcService';
import { 
  AREAS, 
  PTB_OUTCOMES,
  COMORBIDITIES,
  BARANGAYS
} from '../../constants';
import { 
  ChevronLeft, 
  Save, 
  X, 
  Stethoscope, 
  Lock, 
  List, 
  BarChart2, 
  Plus, 
  Activity, 
  MapPin,
  Trash2,
  ShieldCheck,
  Filter,
  RotateCcw,
  Printer,
  Calendar,
  Beaker,
  FileText,
  Pill,
  Users,
  Scissors,
  ClipboardList,
  Home,
  ArrowUpRight,
  User,
  PlusCircle,
  AlertCircle,
  Edit3,
  Download,
  Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, Legend, 
  ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LineChart, Line 
} from 'recharts';

interface Props {
  isNested?: boolean;
  viewMode?: 'list' | 'analysis';
}

const PTBDashboard: React.FC<Props> = ({ isNested, viewMode: initialViewMode }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, validatePassword } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>(initialViewMode || 'list');

  const [formModal, setFormModal] = useState<{ show: boolean, item: any | null, isEditable: boolean }>({
    show: false, item: null, isEditable: false
  });
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

  const [filterArea, setFilterArea] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('Active');
  const [filterNoDx, setFilterNoDx] = useState(false);
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
    const reports = await getTBReports();
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
      ID: item.id || '',
      Report_Date: item.dateReported || '',
      Hospital_Number: item.hospitalNumber || '',
      Last_Name: item.lastName || '',
      First_Name: item.firstName || '',
      Middle_Name: item.middleName || '',
      DOB: item.dob || '',
      Age: item.age || '',
      Sex: item.sex || '',
      Barangay: item.barangay || '',
      City: item.city || '',
      Admission_Date: item.dateOfAdmission || '',
      Area: item.area || '',
      Area_Other: item.areaOther || '',
      Classification: item.classification || '',
      Anatomical_Site: item.anatomicalSite || '',
      Drug_Susceptibility: item.drugSusceptibility || '',
      Treatment_History: item.treatmentHistory || '',
      CXR_Date: item.cxrDate || '',
      Xpert_Results: Array.isArray(item.xpertResults) ? item.xpertResults.map((x: any) => `${x.date}:${x.specimen}:${x.result}`).join('; ') : '',
      Smear_Results: Array.isArray(item.smearResults) ? item.smearResults.map((s: any) => `${s.date}:${s.specimen}:${s.result}`).join('; ') : '',
      Emergency_Procedure: item.emergencySurgicalProcedure || '',
      Treatment_Started: item.treatmentStarted || '',
      Treatment_Start_Date: item.treatmentStartDate || '',
      Comorbidities: Array.isArray(item.comorbidities) ? item.comorbidities.join('; ') : '',
      HIV_Result: item.hivTestResult || '',
      Started_ART: item.startedOnArt || '',
      Movement_History: Array.isArray(item.movementHistory) ? item.movementHistory.map((m: any) => `${m.area} (${m.date})`).join('; ') : '',
      Outcome: item.outcome || 'Admitted',
      Outcome_Date: item.outcomeDate || '',
      Reporter: item.reporterName || '',
      Designation: item.designation || ''
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
    link.setAttribute('download', `TB_Registry_Full_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const calculateLOS = (admissionDate: string, outcomeDate?: string) => {
    if (!admissionDate) return 0;
    const start = new Date(admissionDate);
    const end = outcomeDate ? new Date(outcomeDate) : new Date();
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 0 ? 0 : diffDays;
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
      const matchesArea = filterArea ? item.area === filterArea : true;
      
      let matchesOutcome = true;
      if (filterOutcome === 'Active') {
        matchesOutcome = !item.outcome || item.outcome === 'Admitted' || item.outcome === 'ER-level';
      } else if (filterOutcome !== 'All') {
        matchesOutcome = item.outcome === filterOutcome;
      }

      const isMissingDx = (!item.xpertResults || item.xpertResults.length === 0) && 
                         (!item.smearResults || item.smearResults.length === 0);
      const matchesDx = filterNoDx ? isMissingDx : true;

      let matchesDateRange = true;
      if (startDate) matchesDateRange = matchesDateRange && itemDate >= new Date(startDate);
      if (endDate) matchesDateRange = matchesDateRange && itemDate <= new Date(endDate);
      return matchesYear && matchesArea && matchesDateRange && matchesDx && matchesOutcome;
    });
  }, [data, filterArea, filterOutcome, filterNoDx, startDate, endDate, selectedYear]);

  const summaryStats = useMemo(() => {
    const activePatients = data.filter(d => !d.outcome || d.outcome === 'Admitted' || d.outcome === 'ER-level');
    const missingDiagnostics = activePatients.filter(d => 
      (!d.xpertResults || d.xpertResults.length === 0) && 
      (!d.smearResults || d.smearResults.length === 0)
    ).length;

    const medIsoCount = activePatients.filter(d => d.area === 'Medicine Isolation Room').length;
    const surgIsoCount = activePatients.filter(d => d.area === 'Surgery Isolation Room').length;
    const pediaIsoCount = activePatients.filter(d => d.area === 'Pediatric Isolation Room').length;
    const erIsoCount = activePatients.filter(d => d.area === 'ER Isolation Room').length;
    const floor7Count = activePatients.filter(d => d.area === '7th Floor').length;

    return {
      totalActive: activePatients.length,
      missingDiagnostics,
      medIso: medIsoCount,
      surgIso: surgIsoCount,
      pediaIso: pediaIsoCount,
      erIso: erIsoCount,
      floor7: floor7Count
    };
  }, [data]);

  const analytics = useMemo(() => {
    if (filteredData.length === 0) return null;
    const monthMap: Record<string, { census: number, discharges: number }> = {};
    const classMap: Record<string, number> = {};
    const susMap: Record<string, number> = {};
    const xpertMap: Record<string, number> = {};
    const areaStats: Record<string, { count: number, sumLOS: number }> = {};

    filteredData.forEach(d => {
      const reportMonth = d.dateReported.substring(0, 7);
      if (!monthMap[reportMonth]) monthMap[reportMonth] = { census: 0, discharges: 0 };
      monthMap[reportMonth].census++;
      const c = d.classification || 'Unspecified';
      classMap[c] = (classMap[c] || 0) + 1;
      const s = d.drugSusceptibility || 'Unknown';
      susMap[s] = (susMap[s] || 0) + 1;
      if (d.xpertResults) d.xpertResults.forEach((r: any) => { if(r.result) xpertMap[r.result] = (xpertMap[r.result] || 0) + 1; });
      
      if (!areaStats[d.area]) areaStats[d.area] = { count: 0, sumLOS: 0 };
      areaStats[d.area].count++;
      areaStats[d.area].sumLOS += calculateLOS(d.dateOfAdmission, d.outcomeDate);
    });

    const monthlyTrendData = Object.keys(monthMap).sort().map(m => ({ name: m, census: monthMap[m].census, discharges: monthMap[m].discharges }));
    const avgNewCasesPerMonth = parseFloat((filteredData.length / Math.max(Object.keys(monthMap).length, 1)).toFixed(1));
    const classData = Object.entries(classMap).map(([name, value]) => ({ name, value }));
    const susData = Object.entries(susMap).map(([name, value]) => ({ name, value }));
    const xpertData = Object.entries(xpertMap).map(([name, value]) => ({ name, value })).sort((a,b) => b.value - a.value);
    const areaMetricsData = Object.entries(areaStats).map(([name, stats]) => ({
        name,
        census: stats.count,
        avgLOS: parseFloat((stats.sumLOS / Math.max(stats.count, 1)).toFixed(1))
    })).sort((a, b) => b.census - a.census);

    return { monthlyTrendData, avgNewCasesPerMonth, classData, susData, xpertData, areaMetricsData };
  }, [filteredData]);

  const handleRowClick = (item: any) => {
    setFormModal({ 
      show: true, 
      item: { ...item }, 
      isEditable: false 
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormModal(prev => ({ ...prev, item: { ...prev.item, [name]: value } }));
  };

  const saveChanges = async () => {
    await updateTBReport(formModal.item);
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
      await deleteRecord('reports_tb', itemToDelete.id);
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

  const COLORS = ['#eab308', '#3b82f6', '#ef4444', '#10b981', '#8b5cf6', '#06b6d4', '#ec4899', '#14b8a6'];

  const content = (
    <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
            <div className="flex gap-4 items-center">
                {!isNested && <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-amber-600 font-bold transition-colors"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}><List size={14} /> List</button>
                    <button onClick={() => setViewMode('analysis')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500'}`}><BarChart2 size={14} /> Analysis</button>
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
                <button onClick={() => navigate('/report-ptb')} className="bg-amber-700 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest shadow hover:bg-amber-800 flex items-center gap-2 transition-all active:scale-95 text-xs">
                  <PlusCircle size={18} /> Register Case
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
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none font-medium bg-slate-50/50" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                        <option value="">All Areas</option>
                        {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="h-6 w-px bg-slate-100 mx-1"></div>
                <div className="flex items-center gap-2">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-amber-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedQuarter} onChange={handleQuarterChange}>
                        <option value="">Full Year</option>
                        <option value="Q1 (Jan-Mar)">Q1</option>
                        <option value="Q2 (Apr-Jun)">Q2</option>
                        <option value="Q3 (Jul-Sep)">Q3</option>
                        <option value="Q4 (Oct-Dec)">Q4</option>
                        <option value="YTD">YTD</option>
                    </select>
                </div>
                <button onClick={() => { setFilterArea(''); setFilterOutcome('Active'); setFilterNoDx(false); setStartDate(''); setEndDate(''); setSelectedQuarter(''); setSelectedYear(new Date().getFullYear().toString()); }} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"><RotateCcw size={14} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 order-2 lg:order-1 min-w-0">
                {viewMode === 'analysis' ? (
                    <div className="flex flex-col gap-8 print:block pb-10">
                        <div className="text-center flex flex-col gap-2 mb-6">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">TB Surveillance Analysis</h2>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{selectedQuarter || 'Annual'} {selectedYear} Report</p>
                            <div className="h-1.5 w-24 bg-amber-500 mx-auto mt-2 rounded-full"></div>
                        </div>
                        {!analytics ? <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">No records found.</div> : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:gap-4">
                                <div className="lg:col-span-2 bg-amber-50 p-6 rounded-3xl border-2 border-amber-100 flex items-center justify-center gap-6">
                                    <Calendar size={48} className="text-amber-600" />
                                    <div className="flex flex-col">
                                        <span className="text-4xl font-black text-amber-900 leading-none">{analytics.avgNewCasesPerMonth}</span>
                                        <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-700 mt-2">Avg. New Registry per Month</span>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><Activity size={14} /> Classification Census</h3>
                                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.classData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" label={({name, value}) => `${name}: ${value}`}>{analytics.classData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RechartsTooltip /></PieChart></ResponsiveContainer></div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><Pill size={14} /> Drug Susceptibility</h3>
                                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.susData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{fontSize: 10}} /><YAxis tick={{fontSize: 10}} /><RechartsTooltip /><Bar dataKey="value" fill="#4f46e5" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 text-gray-700 font-bold border-b">
                                  <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Hosp #</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">Classification</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (<tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>) : filteredData.map((report) => (
                                        <tr key={report.id} onClick={() => handleRowClick(report)} className="hover:bg-amber-50/50 transition-colors cursor-pointer group">
                                          <td className="px-6 py-3">{report.dateReported}</td>
                                          <td className="px-6 py-3 font-bold text-amber-700">{formatName(report.lastName, report.firstName)}</td>
                                          <td className="px-6 py-3 text-slate-500 font-medium">{report.hospitalNumber}</td>
                                          <td className="px-6 py-3">{report.area}</td>
                                          <td className="px-6 py-3 text-xs">{report.classification || "N/A"}</td>
                                          <td className="px-6 py-3 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${!report.outcome || report.outcome === 'Admitted' ? "bg-green-100 text-green-700 border-green-200" : report.outcome === 'Expired' ? "bg-red-100 text-red-700 border-red-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>{report.outcome || "Admitted"}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            
            {viewMode === 'list' && (
                <div className="w-full lg:w-48 flex flex-col gap-3 print:hidden order-1 lg:order-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-3 py-2 border-b border-slate-50 bg-slate-50/30">
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">TB Stats</span>
                        </div>
                        <div className="flex flex-col divide-y divide-slate-50">
                          <button onClick={() => { setFilterOutcome('Active'); setFilterArea(''); setFilterNoDx(false); }} className="p-4 flex flex-col gap-0.5 text-left hover:bg-slate-50 transition-colors group">
                              <span className="text-[7px] font-black uppercase text-slate-400 group-hover:text-amber-600">Active Registry</span>
                              <span className="text-2xl font-black text-slate-900 leading-none">{summaryStats.totalActive}</span>
                          </button>
                          <button onClick={() => { setFilterOutcome('Active'); setFilterNoDx(true); }} className="p-4 flex flex-col gap-0.5 text-left hover:bg-slate-50 transition-colors group">
                              <span className="text-[7px] font-black uppercase text-slate-400 group-hover:text-red-600 leading-tight">Missing Lab Results</span>
                              <span className="text-2xl font-black text-red-600 leading-none">{summaryStats.missingDiagnostics}</span>
                          </button>
                        </div>
                    </div>

                    <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                            <MapPin size={10} className="text-slate-400" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">Isolation Census</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <button onClick={() => setFilterArea('Medicine Isolation Room')} className="flex items-center justify-between bg-slate-50/50 px-2 py-1.5 rounded-md hover:bg-white transition-all text-left group border border-transparent hover:border-amber-200">
                                <span className="text-[7px] font-bold text-slate-500 uppercase group-hover:text-amber-600">Medicine ISO</span>
                                <span className="text-[9px] font-black text-amber-600">{summaryStats.medIso}</span>
                            </button>
                            <button onClick={() => setFilterArea('Surgery Isolation Room')} className="flex items-center justify-between bg-slate-50/50 px-2 py-1.5 rounded-md hover:bg-white transition-all text-left group border border-transparent hover:border-amber-200">
                                <span className="text-[7px] font-bold text-slate-500 uppercase group-hover:text-amber-600">Surgery ISO</span>
                                <span className="text-[9px] font-black text-amber-600">{summaryStats.surgIso}</span>
                            </button>
                            <button onClick={() => setFilterArea('Pediatric Isolation Room')} className="flex items-center justify-between bg-slate-50/50 px-2 py-1.5 rounded-md hover:bg-white transition-all text-left group border border-transparent hover:border-amber-200">
                                <span className="text-[7px] font-bold text-slate-500 uppercase group-hover:text-amber-600">Pedia ISO</span>
                                <span className="text-[9px] font-black text-amber-600">{summaryStats.pediaIso}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>

        {formModal.show && formModal.item && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
                    <div className="bg-amber-700 text-white p-6 sticky top-0 z-10 flex justify-between items-center shadow-lg">
                        <h2 className="font-black text-xl leading-tight">
                          {formModal.isEditable ? 'Edit TB Record' : 'TB Registry Details'}
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
                        {/* Section 1: Demographics */}
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <Users size={18} className="text-amber-700"/> Patient Identification
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <Input label="Hospital Number" name="hospitalNumber" value={formModal.item.hospitalNumber} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Last Name" name="lastName" value={formModal.isEditable ? formModal.item.lastName : getPrivacyValue(formModal.item.lastName)} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="First Name" name="firstName" value={formModal.isEditable ? formModal.item.firstName : getPrivacyValue(formModal.item.firstName)} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Age" name="age" value={formModal.item.age} readOnly className="bg-slate-50 font-bold" />
                                <Select label="Sex" name="sex" options={['Male', 'Female']} value={formModal.item.sex} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <div className="md:col-span-2">
                                  <Input label="Barangay" name="barangay" value={formModal.item.barangay} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                </div>
                                <Input label="City" name="city" value={formModal.item.city} onChange={handleInputChange} disabled={!formModal.isEditable} />
                            </div>
                        </section>

                        {/* Section 2: TB Specifics */}
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <Stethoscope size={18} className="text-amber-700"/> Diagnostic Classification
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Select label="Initial Admission Area" name="area" options={AREAS} value={formModal.item.area} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Select label="Classification" name="classification" options={['Bacteriological Confirmed', 'Clinically Diagnosed', 'Presumptive TB']} value={formModal.item.classification} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Select label="Drug Susceptibility" name="drugSusceptibility" options={['Sensitive', 'RR', 'MDR', 'XDR', 'Unknown']} value={formModal.item.drugSusceptibility} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Select label="Treatment History" name="treatmentHistory" options={['New', 'Relapse', 'Treatment After Failure', 'Treatment After Loss to Follow-up', 'Previous Treatment Unknown']} value={formModal.item.treatmentHistory} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Select label="Outcome" name="outcome" options={PTB_OUTCOMES} value={formModal.item.outcome} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Outcome Date" name="outcomeDate" type="date" value={formModal.item.outcomeDate} onChange={handleInputChange} disabled={!formModal.isEditable} />
                            </div>
                            
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                                    <h4 className="text-[10px] font-black text-blue-600 uppercase mb-2">GeneXpert History</h4>
                                    <div className="space-y-2">
                                        {Array.isArray(formModal.item.xpertResults) && formModal.item.xpertResults.map((x: any, i: number) => (
                                            <div key={i} className="text-xs bg-white p-2 rounded-lg border border-blue-50 flex justify-between">
                                                <span className="font-bold">{x.date} ({x.specimen})</span>
                                                <span className="font-black text-blue-700">{x.result}</span>
                                            </div>
                                        ))}
                                        {(!formModal.item.xpertResults || formModal.item.xpertResults.length === 0) && <p className="text-[10px] italic text-slate-400">No records found</p>}
                                    </div>
                                </div>
                                <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100">
                                    <h4 className="text-[10px] font-black text-amber-700 uppercase mb-2">Smear (AFB) History</h4>
                                    <div className="space-y-2">
                                        {Array.isArray(formModal.item.smearResults) && formModal.item.smearResults.map((s: any, i: number) => (
                                            <div key={i} className="text-xs bg-white p-2 rounded-lg border border-amber-50 flex justify-between">
                                                <span className="font-bold">{s.date} ({s.specimen})</span>
                                                <span className="font-black text-amber-700">{s.result}</span>
                                            </div>
                                        ))}
                                        {(!formModal.item.smearResults || formModal.item.smearResults.length === 0) && <p className="text-[10px] italic text-slate-400">No records found</p>}
                                    </div>
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-end items-center gap-3 sticky bottom-0">
                        <button onClick={() => setFormModal({ show: false, item: null, isEditable: false })} className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">Close</button>
                        {formModal.isEditable && (
                          <button onClick={saveChanges} className="bg-amber-700 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-amber-800 flex items-center gap-2 transition-all">
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
          title="Confirm TB Record Deletion"
          description={`Enter your password to permanently delete the TB record for ${itemToDelete?.lastName || ''}, ${itemToDelete?.firstName || ''}.`}
        />
    </div>
  );

  return isNested ? content : <Layout title="TB Hub">{content}</Layout>;
};

export default PTBDashboard;
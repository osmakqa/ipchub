import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getHAIReports, updateHAIReport, deleteRecord } from '../../services/ipcService';
import { 
  AREAS, 
  HAI_TYPES, 
  PATIENT_OUTCOMES
} from '../../constants';
import { 
  ChevronLeft, 
  Save, 
  X, 
  User, 
  Activity, 
  List, 
  BarChart2, 
  Plus, 
  MapPin, 
  ShieldCheck, 
  Filter, 
  RotateCcw, 
  Printer, 
  Calendar, 
  Users, 
  Wind, 
  Droplets, 
  Syringe, 
  PlusCircle, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  Clock, 
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
  viewMode?: 'list' | 'analysis';
}

const HAIDashboard: React.FC<Props> = ({ isNested, viewMode: initialViewMode }) => {
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

  const [filterType, setFilterType] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterOutcome, setFilterOutcome] = useState('Active');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [monthlyChartFilter, setMonthlyChartFilter] = useState<string | null>(null);

  useEffect(() => {
    if (initialViewMode) setViewMode(initialViewMode);
  }, [initialViewMode]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const reports = await getHAIReports();
      reports.sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());
      setData(reports);
    } catch (e) {
      console.error("Load failed", e);
    } finally {
      setLoading(false);
    }
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
      const itemDate = new Date(item.dateReported);
      const matchesYear = selectedYear ? itemDate.getFullYear().toString() === selectedYear : true;
      const matchesType = filterType ? item.haiType === filterType : true;
      const matchesArea = filterArea ? item.area === filterArea : true;
      
      let matchesOutcome = true;
      if (filterOutcome === 'Active') {
        matchesOutcome = !item.outcome || item.outcome === 'Admitted' || item.outcome === 'ER-level';
      } else if (filterOutcome !== 'All') {
        matchesOutcome = item.outcome === filterOutcome;
      }
      
      let matchesDateRange = true;
      if (startDate) matchesDateRange = matchesDateRange && itemDate >= new Date(startDate);
      if (endDate) matchesDateRange = matchesDateRange && itemDate <= new Date(endDate);
      
      return matchesYear && matchesType && matchesArea && matchesOutcome && matchesDateRange;
    });
  }, [data, filterType, filterArea, filterOutcome, startDate, endDate, selectedYear]);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    // Prepare headers and data
    const exportItems = filteredData.map(item => ({
      Date_Reported: item.dateReported,
      Patient_Name: formatName(item.lastName, item.firstName),
      Hospital_Number: item.hospitalNumber,
      Area: item.area,
      HAI_Type: item.haiType,
      Outcome: item.outcome || 'Admitted',
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
    link.setAttribute('download', `HAI_Registry_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const summaryStats = useMemo(() => {
    const activePatients = data.filter(d => !d.outcome || d.outcome === 'Admitted' || d.outcome === 'ER-level');
    const wardCounts: Record<string, number> = {};
    activePatients.forEach(d => { wardCounts[d.area] = (wardCounts[d.area] || 0) + 1; });
    const vapCount = activePatients.filter(d => d.haiType === 'Ventilator Associated Pneumonia').length;
    const cautiCount = activePatients.filter(d => d.haiType === 'Catheter-Associated UTI').length;
    const crbsiCount = activePatients.filter(d => d.haiType === 'Catheter-Related Blood Stream Infections').length;
    return {
      totalActive: activePatients.length,
      wardCounts: Object.entries(wardCounts).sort((a, b) => b[1] - a[1]),
      vap: vapCount,
      cauti: cautiCount,
      crbsi: crbsiCount
    };
  }, [data]);

  const analytics = useMemo(() => {
    if (filteredData.length === 0) return null;
    const monthMap: Record<string, Record<string, number>> = {};
    filteredData.forEach(d => {
      const month = d.dateReported.substring(0, 7);
      if (!monthMap[month]) monthMap[month] = { total: 0 };
      monthMap[month].total++;
      monthMap[month][d.haiType] = (monthMap[month][d.haiType] || 0) + 1;
    });
    const monthlyTrendData = Object.keys(monthMap).sort().map(m => ({
      name: m,
      value: monthlyChartFilter ? (monthMap[m][monthlyChartFilter] || 0) : monthMap[m].total
    }));
    const typeCounts: Record<string, number> = {};
    filteredData.forEach(d => typeCounts[d.haiType] = (typeCounts[d.haiType] || 0) + 1);
    const typeData = Object.entries(typeCounts).map(([name, value]) => ({ name, value }));
    const areaCounts: Record<string, number> = {};
    filteredData.forEach(d => areaCounts[d.area] = (areaCounts[d.area] || 0) + 1);
    const areaData = Object.entries(areaCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const trackedWards = ["ICU", "Medicine Ward", "Cohort", "Pedia Ward", "Emergency Room Complex"];
    const now = new Date();
    const daysWithoutData = trackedWards.map(ward => {
        const wardCases = data.filter(d => d.area === ward).sort((a, b) => new Date(b.dateReported).getTime() - new Date(a.dateReported).getTime());
        const lastInfection = wardCases.length > 0 ? new Date(wardCases[0].dateReported) : null;
        const days = lastInfection ? Math.floor((now.getTime() - lastInfection.getTime()) / (1000 * 60 * 60 * 24)) : 999;
        return { ward, days };
    });
    return { monthlyTrendData, typeData, areaData, daysWithoutData };
  }, [filteredData, monthlyChartFilter, data]);

  const COLORS = ['#009a3e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];

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

  const handleRowClick = (item: any) => { 
    setFormModal({ 
      show: true, 
      item: { ...item }, 
      isEditable: false 
    }); 
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target; setFormModal(prev => ({ ...prev, item: { ...prev.item, [name]: value } }));
  };

  const saveChanges = async () => { 
    try {
      await updateHAIReport(formModal.item); 
      setFormModal({ show: false, item: null, isEditable: false }); 
      loadData(); 
    } catch (e) {
      alert("Failed to update: " + (e instanceof Error ? e.message : "Unknown error"));
    }
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
      const success = await deleteRecord('reports_hai', itemToDelete.id);
      
      if (success) {
        setFormModal({ show: false, item: null, isEditable: false });
        setShowPasswordConfirm(false);
        setItemToDelete(null);
        await loadData();
      }
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
                {!isNested && <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-primary font-bold transition-colors"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg shadow-inner">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}><List size={14} /> List</button>
                    <button onClick={() => setViewMode('analysis')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-white text-primary shadow-sm' : 'text-gray-500'}`}><BarChart2 size={14} /> Analysis</button>
                </div>
            </div>
            <div className="flex gap-2">
                <button 
                  onClick={handleExportCSV}
                  disabled={filteredData.length === 0}
                  className="bg-white text-slate-600 px-4 py-2 rounded-lg font-black uppercase tracking-widest border border-slate-200 shadow-sm hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95 text-xs"
                >
                  <Download size={18} /> Export CSV
                </button>
                <button onClick={() => navigate('/report-hai')} className="bg-primary text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest shadow-lg hover:bg-osmak-green-dark flex items-center gap-2 transition-all active:scale-95 text-xs">
                  <PlusCircle size={18} /> Report Case
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
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none font-medium bg-slate-50/50" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                        <option value="">All HAI Types</option>
                        {HAI_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none font-medium bg-slate-50/50" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                        <option value="">All Areas</option>
                        {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="h-6 w-px bg-slate-100 mx-1"></div>
                <div className="flex items-center gap-2">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-primary outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedQuarter} onChange={handleQuarterChange}>
                        <option value="">Full Year</option>
                        <option value="Q1 (Jan-Mar)">Q1</option>
                        <option value="Q2 (Apr-Jun)">Q2</option>
                        <option value="Q3 (Jul-Sep)">Q3</option>
                        <option value="Q4 (Oct-Dec)">Q4</option>
                        <option value="YTD">YTD</option>
                    </select>
                </div>
                <button onClick={() => { setFilterType(''); setFilterArea(''); setFilterOutcome('Active'); setStartDate(''); setEndDate(''); setSelectedQuarter(''); setSelectedYear(new Date().getFullYear().toString()); }} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><RotateCcw size={14} /></button>
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 order-2 lg:order-1 min-w-0">
                {viewMode === 'analysis' ? (
                    <div className="flex flex-col gap-8 print:block pb-10">
                        <div className="text-center flex flex-col gap-2 mb-6">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">HAI Surveillance Analysis</h2>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{selectedQuarter || 'Annual'} {selectedYear} Report</p>
                            <div className="h-1.5 w-24 bg-primary mx-auto mt-2 rounded-full"></div>
                        </div>
                        {!analytics ? (
                            <div className="p-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200 text-slate-400 font-bold">No data matches criteria.</div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><TrendingUp size={14} /> Infection Trend</h3>
                                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.monthlyTrendData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{fontSize: 10}} /><YAxis tick={{fontSize: 10}} /><RechartsTooltip /><Line type="monotone" dataKey="value" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: 'var(--primary)' }} activeDot={{ r: 6 }} /></LineChart></ResponsiveContainer></div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><Users size={14} /> Census per Type</h3>
                                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={analytics.typeData} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" label={({name, value}) => `${name}: ${value}`}>{analytics.typeData.map((e, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><RechartsTooltip /><Legend verticalAlign="bottom" wrapperStyle={{fontSize: 9, fontWeight: 'bold'}} /></PieChart></ResponsiveContainer></div>
                                </div>
                                <div className="md:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-3xl shadow-xl text-white">
                                    <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4"><ShieldCheck size={28} className="text-emerald-400" /><div><h3 className="font-black uppercase text-sm tracking-[0.2em]">Safety Tracker</h3><p className="text-xs text-white/50 font-bold">Days since last reported infection</p></div></div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                                        {analytics.daysWithoutData.map(d => (
                                            <div key={d.ward} className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-colors">
                                                <span className="text-[28px] font-black text-emerald-400 leading-none">{d.days === 999 ? '∞' : d.days}</span>
                                                <span className="text-[10px] font-black uppercase text-white/60 text-center leading-tight tracking-tighter">{d.ward}</span>
                                            </div>
                                        ))}
                                    </div>
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
                                    <th className="px-6 py-4">Report Date</th>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Hosp #</th>
                                    <th className="px-6 py-4">Location</th>
                                    <th className="px-6 py-4">HAI Type</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (<tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>) : filteredData.map((report) => (
                                        <tr key={report.id} onClick={() => handleRowClick(report)} className="hover:bg-green-50/50 transition-colors cursor-pointer group">
                                          <td className="px-6 py-3">{report.dateReported}</td>
                                          <td className="px-6 py-3 font-bold text-primary">{formatName(report.lastName, report.firstName)}</td>
                                          <td className="px-6 py-3 text-slate-500 font-medium">{report.hospitalNumber}</td>
                                          <td className="px-6 py-3">{report.area}</td>
                                          <td className="px-6 py-3 font-medium text-osmak-green-dark">{report.haiType}</td>
                                          <td className="px-6 py-3 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${!report.outcome || report.outcome === 'Admitted' ? "bg-green-100 text-green-700 border-green-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>{report.outcome || "Admitted"}</span></td>
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
                        <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Data Cards</span>
                      </div>
                      <div className="flex flex-col divide-y divide-slate-50">
                        {/* Total Active */}
                        <button 
                            onClick={() => { setFilterOutcome('Active'); setFilterType(''); }}
                            className="p-4 flex flex-col gap-0.5 text-left hover:bg-slate-50 transition-colors group"
                        >
                            <span className="text-[7px] font-black uppercase text-slate-400 group-hover:text-primary transition-colors">Total Active</span>
                            <span className="text-2xl font-black text-slate-900 leading-none">{summaryStats.totalActive}</span>
                        </button>
                        
                        {/* VAP */}
                        <button 
                            onClick={() => { setFilterOutcome('Active'); setFilterType('Ventilator Associated Pneumonia'); }}
                            className="p-4 flex flex-col gap-0.5 text-left hover:bg-slate-50 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[7px] font-black uppercase text-slate-400 group-hover:text-blue-600 transition-colors">Active VAPs</span>
                                <Wind size={10} className="text-blue-400 opacity-50" />
                            </div>
                            <span className="text-2xl font-black text-blue-600 leading-none">{summaryStats.vap}</span>
                        </button>

                        {/* CAUTI */}
                        <button 
                            onClick={() => { setFilterOutcome('Active'); setFilterType('Catheter-Associated UTI'); }}
                            className="p-4 flex flex-col gap-0.5 text-left hover:bg-slate-50 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[7px] font-black uppercase text-slate-400 group-hover:text-amber-600 transition-colors">Active CAUTIs</span>
                                <Droplets size={10} className="text-amber-400 opacity-50" />
                            </div>
                            <span className="text-2xl font-black text-amber-600 leading-none">{summaryStats.cauti}</span>
                        </button>

                        {/* CRBSI */}
                        <button 
                            onClick={() => { setFilterOutcome('Active'); setFilterType('Catheter-Related Blood Stream Infections'); }}
                            className="p-4 flex flex-col gap-0.5 text-left hover:bg-slate-50 transition-colors group"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-[7px] font-black uppercase text-slate-400 group-hover:text-red-600 transition-colors">Active CRBSIs</span>
                                <Syringe size={10} className="text-red-400 opacity-50" />
                            </div>
                            <span className="text-2xl font-black text-red-600 leading-none">{summaryStats.crbsi}</span>
                        </button>
                      </div>
                  </div>

                  <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2">
                      <div className="flex items-center gap-1.5 border-b border-slate-50 pb-1.5">
                          <MapPin size={10} className="text-slate-400" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 leading-none">Per Ward</span>
                      </div>
                      <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
                          {summaryStats.wardCounts.map(([name, count]) => (
                              <button 
                                key={name} 
                                onClick={() => { setFilterArea(name); setFilterOutcome('Active'); }}
                                className="flex items-center justify-between bg-slate-50/50 px-2 py-1.5 rounded-md border border-slate-100/50 hover:border-primary hover:bg-white transition-all text-left group"
                              >
                                  <span className="text-[7px] font-bold text-slate-500 uppercase group-hover:text-primary truncate mr-1">{name}</span>
                                  <span className="text-[9px] font-black text-primary">{count}</span>
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
                    <div className="bg-osmak-green text-white p-6 sticky top-0 z-10 flex justify-between items-center shadow-lg">
                        <h2 className="font-black text-xl leading-tight">
                          {formModal.isEditable ? 'Edit Infection Record' : 'Infection Case Details'}
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
                        {/* Section 1: Patient ID */}
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <Users size={18} className="text-primary"/> Patient Identification
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

                        {/* Section 2: Clinical Data */}
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <Activity size={18} className="text-primary"/> Infection Parameters
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <Select label="HAI Type" name="haiType" options={HAI_TYPES} value={formModal.item.haiType} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Select label="Primary Area" name="area" options={AREAS} value={formModal.item.area} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Admission Date" name="dateOfAdmission" type="date" value={formModal.item.dateOfAdmission} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Date Reported" name="dateReported" type="date" value={formModal.item.dateReported} readOnly className="bg-slate-50" />
                            </div>
                        </section>

                        {/* Section 3: Reporter Data */}
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <FileText size={18} className="text-primary"/> Outcome & Reporting
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <Select label="Clinical Outcome" name="outcome" options={PATIENT_OUTCOMES} value={formModal.item.outcome} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Reporter Name" name="reporterName" value={formModal.item.reporterName} onChange={handleInputChange} disabled={!formModal.isEditable} />
                              <Input label="Designation" name="designation" value={formModal.item.designation} onChange={handleInputChange} disabled={!formModal.isEditable} />
                            </div>
                        </section>
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-end items-center gap-3 sticky bottom-0">
                        <button onClick={() => setFormModal({ show: false, item: null, isEditable: false })} className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">Close</button>
                        {formModal.isEditable && (
                          <button onClick={saveChanges} className="bg-osmak-green text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-osmak-green-dark flex items-center gap-2 transition-all">
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
          title="Confirm HAI Record Deletion"
          description={`Enter your password to permanently delete the HAI record for ${itemToDelete?.lastName || ''}, ${itemToDelete?.firstName || ''}.`}
        />
    </div>
  );

  return isNested ? content : <Layout title="HAI Registry">{content}</Layout>;
};

export default HAIDashboard;
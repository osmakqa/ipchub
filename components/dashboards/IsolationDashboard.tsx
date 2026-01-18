import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getIsolationReports, updateIsolationReport, deleteRecord } from '../../services/ipcService';
import { AREAS, ISOLATION_AREAS, PATIENT_OUTCOMES } from '../../constants';
import { 
  ChevronLeft, 
  Save, 
  X, 
  ShieldAlert, 
  User, 
  Lock, 
  List, 
  BarChart2, 
  MapPin, 
  Plus, 
  Clock, 
  Home, 
  Users, 
  Filter, 
  RotateCcw, 
  Printer, 
  Calendar, 
  Activity, 
  ArrowRightLeft, 
  PlusCircle, 
  Bed, 
  Edit3, 
  FileText, 
  Trash2,
  Download
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, LineChart, Line } from 'recharts';

interface Props {
  isNested?: boolean;
  viewMode?: 'list' | 'analysis';
}

const IsolationDashboard: React.FC<Props> = ({ isNested, viewMode: initialViewMode }) => {
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
    const reports = await getIsolationReports();
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
      Diagnosis: item.diagnosis,
      Isolation_Room: item.area,
      Transferred_From: item.transferredFrom,
      Entry_Date: item.transferDate,
      Status: item.outcome || 'Admitted',
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
    link.setAttribute('download', `Isolation_Registry_${new Date().toISOString().split('T')[0]}.csv`);
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
      const matchesArea = filterArea ? item.area === filterArea : true;
      
      let matchesOutcome = true;
      if (filterOutcome === 'Active') {
        matchesOutcome = !item.outcome || item.outcome === 'Admitted';
      } else if (filterOutcome !== 'All') {
        matchesOutcome = item.outcome === filterOutcome;
      }
      
      const matchesDateRange = (startDate ? itemDate >= new Date(startDate) : true) && 
                         (endDate ? itemDate <= new Date(endDate) : true);
      return matchesYear && matchesArea && matchesOutcome && matchesDateRange;
    });
  }, [data, filterArea, filterOutcome, startDate, endDate, selectedYear]);

  const summaryStats = useMemo(() => {
    const active = data.filter(item => !item.outcome || item.outcome === 'Admitted');
    const counts: Record<string, number> = {};
    active.forEach(item => { if(item.area) counts[item.area] = (counts[item.area] || 0) + 1; });
    return {
      totalActive: active.length,
      wardCensus: Object.entries(counts).sort((a, b) => b[1] - a[1])
    };
  }, [data]);

  const analytics = useMemo(() => {
    if (filteredData.length === 0) return null;
    const monthMap: Record<string, number> = {};
    filteredData.forEach(d => { const month = d.dateReported.substring(0, 7); monthMap[month] = (monthMap[month] || 0) + 1; });
    const monthlyTrendData = Object.entries(monthMap).sort().map(([name, value]) => ({ name, value }));
    const diagMap: Record<string, number> = {};
    filteredData.forEach(d => { const diag = d.diagnosis?.split(',')[0]?.trim() || 'Unspecified'; diagMap[diag] = (diagMap[diag] || 0) + 1; });
    const diagnosisData = Object.entries(diagMap).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 10);
    return { monthlyTrendData, diagnosisData };
  }, [filteredData]);

  const handleRowClick = (item: any) => { setFormModal({ show: true, item: { ...item }, isEditable: false }); };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormModal(prev => ({ ...prev, item: { ...prev.item, [name]: value } }));
  };

  const saveChanges = async () => {
    await updateIsolationReport(formModal.item);
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
      await deleteRecord('reports_isolation', itemToDelete.id);
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
                {!isNested && <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-indigo-600 font-bold transition-colors"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><List size={14} /> List</button>
                    <button onClick={() => setViewMode('analysis')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'}`}><BarChart2 size={14} /> Analysis</button>
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
                <button onClick={() => navigate('/report-isolation')} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest shadow hover:bg-indigo-700 flex items-center gap-2 transition-all active:scale-95 text-xs">
                  <PlusCircle size={18} /> Register Admission
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
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-medium bg-slate-50/50" value={filterArea} onChange={(e) => setFilterArea(e.target.value)}>
                        <option value="">All Isolation Rooms</option>
                        {ISOLATION_AREAS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
                <div className="h-6 w-px bg-slate-100 mx-1"></div>
                <div className="flex items-center gap-2">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-indigo-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedQuarter} onChange={handleQuarterChange}>
                        <option value="">Full Year</option>
                        <option value="Q1 (Jan-Mar)">Q1</option>
                        <option value="Q2 (Apr-Jun)">Q2</option>
                        <option value="Q3 (Jul-Sep)">Q3</option>
                        <option value="Q4 (Oct-Dec)">Q4</option>
                        <option value="YTD">YTD</option>
                    </select>
                </div>
                <button onClick={() => { setFilterArea(''); setFilterOutcome('Active'); setStartDate(''); setEndDate(''); setSelectedQuarter(''); setSelectedYear(new Date().getFullYear().toString()); }} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"><RotateCcw size={14} /></button>
            </div>
        </div>
        {/* ... Rest of component content same ... */}
        <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1 order-2 lg:order-1 min-w-0">
                {viewMode === 'analysis' ? (
                     <div className="flex flex-col gap-8 print:block">
                        <div className="text-center flex flex-col gap-2 mb-6">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Isolation Analysis</h2>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{selectedQuarter || 'Annual'} {selectedYear} Report</p>
                            <div className="h-1.5 w-24 bg-indigo-600 mx-auto mt-2 rounded-full"></div>
                        </div>
                        {!analytics ? <div className="p-20 text-center text-slate-400 font-bold">No records found.</div> : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 print:gap-4">
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><Calendar size={14} /> Admissions Trend</h3>
                                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={analytics.monthlyTrendData}><CartesianGrid strokeDasharray="3 3" vertical={false} /><XAxis dataKey="name" tick={{fontSize: 10}} /><YAxis tick={{fontSize: 10}} /><RechartsTooltip /><Line type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} dot={{ r: 4, fill: '#4f46e5' }} /></LineChart></ResponsiveContainer></div>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
                                    <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-2"><Activity size={14} /> Top Isolation Diagnoses</h3>
                                    <div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.diagnosisData} layout="vertical"><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={140} tick={{fontSize: 9, fontWeight: 'bold'}} /><RechartsTooltip /><Bar dataKey="value" fill="#0d9488" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div>
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
                                    <th className="px-6 py-4">Diagnosis</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {loading ? (<tr><td colSpan={5} className="p-8 text-center text-gray-500">Loading...</td></tr>) : filteredData.map((report) => (
                                        <tr key={report.id} onClick={() => handleRowClick(report)} className="hover:bg-green-50/50 transition-colors cursor-pointer group">
                                          <td className="px-6 py-3">{report.dateReported}</td>
                                          <td className="px-6 py-3 font-bold text-indigo-700">{formatName(report.lastName, report.firstName)}</td>
                                          <td className="px-6 py-3 text-slate-500 font-medium">{report.hospitalNumber}</td>
                                          <td className="px-6 py-3">{report.diagnosis}</td>
                                          <td className="px-6 py-3 text-center"><span className={`px-3 py-1 rounded-full text-xs font-bold border ${!report.outcome || report.outcome === 'Admitted' ? "bg-green-100 text-green-700 border-green-200" : report.outcome === 'Expired' ? "bg-red-100 text-red-700 border-red-200" : "bg-blue-100 text-blue-700 border-blue-200"}`}>{report.outcome || "Admitted"}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
            {/* Sidebar and Modal same ... */}
        </div>
    </div>
  );

  return isNested ? content : <Layout title="Isolation Hub">{content}</Layout>;
};

export default IsolationDashboard;
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { getNotifiableReports, updateNotifiableReport, deleteRecord } from '../../services/ipcService';
import { AREAS, NOTIFIABLE_DISEASES, PATIENT_OUTCOMES, BARANGAYS } from '../../constants';
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
  Trash2
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
  const { isAuthenticated } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'list' | 'analysis'>(initialViewMode || 'list');
  const [formModal, setFormModal] = useState<{ show: boolean, item: any | null, isEditable: boolean }>({
    show: false, item: null, isEditable: false
  });

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

  const saveChanges = async () => {
    await updateNotifiableReport(formModal.item);
    setFormModal({ show: false, item: null, isEditable: false });
    loadData();
  };

  const handleDelete = async () => {
    if (!formModal.item) return;
    if (!window.confirm(`Permanently delete the notifiable disease record for ${formModal.item.lastName}? This cannot be undone.`)) return;
    try {
      await deleteRecord('reports_notifiable', formModal.item.id);
      setFormModal({ show: false, item: null, isEditable: false });
      loadData();
    } catch (e) { alert("Failed to delete record."); }
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
            <button onClick={() => navigate('/report-disease')} className="bg-red-600 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest shadow hover:bg-red-700 flex items-center gap-2 transition-all active:scale-95 text-xs">
              <PlusCircle size={18} /> New Report
            </button>
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
                              <button onClick={handleDelete} className="bg-red-500 hover:bg-red-600 p-2 rounded-lg transition-colors flex items-center gap-2 text-xs font-bold text-white shadow-sm">
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
      </div>
  );

  return isNested ? content : <Layout title="Notifiable Diseases Hub">{content}</Layout>;
};

export default NotifiableDashboard;
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getCultureReports, updateCultureReport, deleteRecord } from '../../services/ipcService';
import { AREAS } from '../../constants';
import { 
  ChevronLeft, 
  Save, 
  X, 
  Microscope, 
  BarChart2, 
  List, 
  BarChart,
  Plus, 
  User, 
  Lock, 
  ClipboardCheck,
  ShieldCheck,
  Filter,
  RotateCcw,
  Search,
  Info,
  PlusCircle,
  Users,
  FileText,
  Edit3,
  Trash2,
  Download
} from 'lucide-react';
import { BarChart as RechartsBarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, CartesianGrid } from 'recharts';

interface Props {
  isNested?: boolean;
  viewMode?: 'list' | 'analysis';
}

const CultureDashboard: React.FC<Props> = ({ isNested, viewMode: initialViewMode }) => {
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
  const [filterOrganism, setFilterOrganism] = useState('');
  
  const getCurrentMonthDates = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    return { firstDay, lastDay };
  };

  const [startDate, setStartDate] = useState(getCurrentMonthDates().firstDay);
  const [endDate, setEndDate] = useState(getCurrentMonthDates().lastDay);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedQuarter, setSelectedQuarter] = useState('');

  useEffect(() => {
    if (initialViewMode) setViewMode(initialViewMode);
  }, [initialViewMode]);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const reports = await getCultureReports();
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
      Last_Name: item.lastName || '',
      First_Name: item.firstName || '',
      Middle_Name: item.middleName || '',
      Age: item.age || '',
      Sex: item.sex || '',
      Organism: item.organism || '',
      Specimen: item.specimen || '',
      Colony_Count: item.colonyCount || '',
      Area: item.area || '',
      Antibiotics_Summary: Array.isArray(item.antibiotics) ? item.antibiotics.map((a: any) => `${a.name}(MIC:${a.mic || 'N/A'}|Res:${a.interpretation})`).join('; ') : '',
      Reporter: item.reporterName || ''
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
    link.setAttribute('download', `Antibiogram_Results_Full_Export_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  const calculateClassification = (antibiotics: any[]) => {
    if (!antibiotics || antibiotics.length === 0) return "-";
    const resistantCount = antibiotics.filter(ab => ab.interpretation === 'R').length;
    const totalCount = antibiotics.length;
    if (resistantCount === totalCount && totalCount > 0) return "PDR";
    if (resistantCount >= 5) return "XDR";
    if (resistantCount >= 3) return "MDR";
    return "-";
  };

  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'PDR': return 'text-purple-600 bg-purple-50 border-purple-100';
      case 'XDR': return 'text-red-600 bg-red-50 border-red-100';
      case 'MDR': return 'text-orange-600 bg-orange-50 border-orange-100';
      default: return 'text-gray-400 bg-gray-50 border-gray-100';
    }
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
      const matchesOrg = filterOrganism ? (item.organism || '').toLowerCase().includes(filterOrganism.toLowerCase()) : true;
      
      let matchesDateRange = true;
      if (startDate) matchesDateRange = matchesDateRange && itemDate >= new Date(startDate);
      if (endDate) matchesDateRange = matchesDateRange && itemDate <= new Date(endDate);
      
      return matchesYear && matchesArea && matchesOrg && matchesDateRange;
    });
  }, [data, filterArea, filterOrganism, startDate, endDate, selectedYear]);

  const handleRowClick = (item: any) => { 
    setFormModal({ show: true, item: { ...item }, isEditable: false }); 
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormModal(prev => ({ ...prev, item: { ...prev.item, [name]: value } }));
  };

  const saveChanges = async () => { 
    await updateCultureReport(formModal.item); 
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
      await deleteRecord('reports_culture', itemToDelete.id);
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
                {!isNested && <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-teal-600 transition-colors"><ChevronLeft size={16} /> Hub</button>}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button onClick={() => setViewMode('list')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'list' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}><List size={14} /> List</button>
                    <button onClick={() => setViewMode('analysis')} className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${viewMode === 'analysis' ? 'bg-white text-teal-600 shadow-sm' : 'text-gray-500'}`}><BarChart2 size={14} /> Analysis</button>
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
                <button onClick={() => navigate('/report-culture')} className="bg-teal-600 text-white px-4 py-2 rounded-lg font-black uppercase tracking-widest shadow hover:bg-teal-700 flex items-center gap-2 transition-all active:scale-95 text-xs">
                  <PlusCircle size={18} /> Add Lab Result
                </button>
            </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <div className="flex items-center gap-3 min-w-max">
                <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                    <Filter size={14} className="text-slate-400" />
                    <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input className="text-xs border border-slate-200 rounded-lg pl-6 pr-2 py-1.5 focus:ring-1 focus:ring-primary outline-none font-medium bg-slate-50/50 w-32" placeholder="Organism..." value={filterOrganism} onChange={(e) => setFilterOrganism(e.target.value)} />
                    </div>
                </div>
                <div className="h-6 w-px bg-slate-100 mx-1"></div>
                <div className="flex items-center gap-2">
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-teal-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                        <option value="2023">2023</option>
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                        <option value="2026">2026</option>
                    </select>
                    <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-teal-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedQuarter} onChange={handleQuarterChange}>
                        <option value="">Full Year</option>
                        <option value="Q1 (Jan-Mar)">Q1</option>
                        <option value="Q2 (Apr-Jun)">Q2</option>
                        <option value="Q3 (Jul-Sep)">Q3</option>
                        <option value="Q4 (Oct-Dec)">Q4</option>
                        <option value="YTD">YTD</option>
                    </select>
                </div>
                <button onClick={() => { setFilterArea(''); setFilterOrganism(''); const { firstDay, lastDay } = getCurrentMonthDates(); setStartDate(firstDay); setEndDate(lastDay); setSelectedQuarter(''); setSelectedYear(new Date().getFullYear().toString()); }} className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"><RotateCcw size={14} /></button>
            </div>
        </div>

        {viewMode === 'analysis' ? (
             <div className="flex flex-col gap-8 animate-in fade-in">
                <div className="text-center flex flex-col gap-2 mb-6">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight uppercase">Antibiogram Analysis</h2>
                    <p className="text-slate-400 text-xs font-black uppercase tracking-widest">{selectedQuarter || 'Annual'} {selectedYear} Report</p>
                    <div className="h-1.5 w-24 bg-teal-600 mx-auto mt-2 rounded-full"></div>
                </div>
                {/* ... Analysis Content ... */}
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
                              <th className="px-6 py-4">Specimen / Ward</th>
                              <th className="px-6 py-4">Organism</th>
                              <th className="px-6 py-4 text-center">Class</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (<tr><td colSpan={6} className="p-8 text-center text-gray-500">Loading...</td></tr>) : filteredData.map((report) => {
                                const classification = calculateClassification(report.antibiotics);
                                return (
                                <tr key={report.id} onClick={() => handleRowClick(report)} className="hover:bg-green-50/50 transition-colors cursor-pointer group">
                                    <td className="px-6 py-3">{report.dateReported}</td>
                                    <td className="px-6 py-3 font-bold text-teal-600">{formatName(report.lastName, report.firstName)}</td>
                                    <td className="px-6 py-3 text-slate-500 font-medium">{report.hospitalNumber}</td>
                                    <td className="px-6 py-3">{report.specimen} / {report.area}</td>
                                    <td className="px-6 py-3 font-bold text-teal-700">{report.organism}</td>
                                    <td className="px-6 py-3 text-center"><span className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${getClassificationColor(classification)}`}>{classification}</span></td>
                                </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {formModal.show && formModal.item && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 print:hidden">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
                    <div className="bg-teal-700 text-white p-6 sticky top-0 z-10 flex justify-between items-center shadow-lg">
                        <h2 className="font-black text-xl leading-tight">
                          {formModal.isEditable ? 'Edit Lab Report' : 'Antibiogram Registry Details'}
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
                        {/* Demographics */}
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <Users size={18} className="text-teal-600"/> Patient Identification
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <Input label="Hospital Number" name="hospitalNumber" value={formModal.item.hospitalNumber} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Last Name" name="lastName" value={formModal.isEditable ? formModal.item.lastName : getPrivacyValue(formModal.item.lastName)} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="First Name" name="firstName" value={formModal.isEditable ? formModal.item.firstName : getPrivacyValue(formModal.item.firstName)} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Age" name="age" value={formModal.item.age} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Select label="Sex" name="sex" options={['Male', 'Female']} value={formModal.item.sex} onChange={handleInputChange} disabled={!formModal.isEditable} />
                            </div>
                        </section>
                        {/* Lab Results */}
                        <section className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col gap-5">
                            <h3 className="font-black text-sm text-slate-800 flex items-center gap-2 uppercase tracking-wide border-b pb-3">
                              <Microscope size={18} className="text-teal-600"/> Lab Results
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Input label="Organism Isolated" name="organism" value={formModal.item.organism} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Specimen Source" name="specimen" value={formModal.item.specimen} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Reporting Area" name="area" value={formModal.item.area} onChange={handleInputChange} disabled={!formModal.isEditable} />
                                <Input label="Reporting Date" name="dateReported" type="date" value={formModal.item.dateReported} onChange={handleInputChange} disabled={!formModal.isEditable} />
                            </div>
                        </section>
                    </div>

                    <div className="p-6 bg-slate-50 border-t flex justify-end items-center gap-3 sticky bottom-0">
                        <button onClick={() => setFormModal({ show: false, item: null, isEditable: false })} className="px-6 py-3 bg-white text-slate-600 font-bold rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors">Close</button>
                        {formModal.isEditable && (
                          <button onClick={saveChanges} className="bg-teal-600 text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest shadow-lg hover:bg-teal-700 flex items-center gap-2 transition-all">
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
          title="Confirm Lab Report Deletion"
          description={`Enter your password to permanently delete the lab report for ${itemToDelete?.lastName || ''}, ${itemToDelete?.firstName || ''}.`}
        />
    </div>
  );

  return isNested ? content : <Layout title="Antibiogram Results">{content}</Layout>;
};

export default CultureDashboard;

import React, { useState, useEffect, useMemo } from 'react';
import Input from '../ui/Input';
import { getCensusLogs, submitCensusLog, getHAIReports, calculateInfectionRates } from '../../services/ipcService';
import { 
    Activity, 
    BarChart2, 
    ClipboardList, 
    Save, 
    Clock, 
    Bed, 
    Wind, 
    Droplets, 
    Syringe, 
    LayoutList,
    TrendingUp,
    CheckCircle2,
    Users,
    FileText,
    Info,
    LayoutDashboard,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Calendar as CalendarIcon
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
    CartesianGrid, LineChart, Line, Legend, Cell 
} from 'recharts';

const HAIDataDashboard: React.FC = () => {
    const [view, setView] = useState<'log' | 'analysis'>('log');
    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState<any[]>([]);
    const [infections, setInfections] = useState<any[]>([]);
    
    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        overall: '', icu: '', nicu: '', picu: '', medicine: '', cohort: '',
        overallVent: '', overallIfc: '', overallCentral: '',
        icuVent: '', icuIfc: '', icuCentral: '',
        nicuVent: '', nicuIfc: '', nicuCentral: '',
        picuVent: '', picuIfc: '', picuCentral: '',
        medVent: '', medIfc: '', medCentral: '',
        cohortVent: '', cohortIfc: '', cohortCentral: ''
    });

    useEffect(() => { loadData(); }, []);

    useEffect(() => {
        setFormData(prev => ({ ...prev, date: selectedDate }));
    }, [selectedDate]);

    const loadData = async () => {
        setLoading(true);
        const [cLogs, hReports] = await Promise.all([getCensusLogs(), getHAIReports()]);
        setLogs(cLogs);
        setInfections(hReports);
        setLoading(false);
    };

    const handleLogSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        await submitCensusLog(formData);
        alert("Daily Census Logged Successfully.");
        loadData();
        // Keep the same date or clear? Usually better to keep current view
        setLoading(false);
    };

    const stats = useMemo(() => calculateInfectionRates(logs, infections), [logs, infections]);

    // Calendar logic
    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const days = [];
        
        // Padding for previous month
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }
        
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const hasLog = logs.some(l => l.date === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            const isPast = new Date(dateStr) < new Date(new Date().toISOString().split('T')[0]);
            days.push({ date: dateStr, day: d, hasLog, isToday, isPast });
        }
        return days;
    }, [currentMonth, logs]);

    const changeMonth = (offset: number) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + offset);
        setCurrentMonth(newMonth);
    };

    const WardDeviceRow = ({ title, prefix, data, setter }: { title: string, prefix: string, data: any, setter: any }) => (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2"><div className="size-2 rounded-full bg-slate-400"></div><span className="text-[10px] font-black uppercase text-slate-500">{title}</span></div>
            <Input label="Vent" type="number" value={data[`${prefix}Vent`]} onChange={e => setter({...data, [`${prefix}Vent`]: e.target.value})} />
            <Input label="IFC" type="number" value={data[`${prefix}Ifc`]} onChange={e => setter({...data, [`${prefix}Ifc`]: e.target.value})} />
            <Input label="Central" type="number" value={data[`${prefix}Central`]} onChange={e => setter({...data, [`${prefix}Central`]: e.target.value})} />
        </div>
    );

    const RateCard = ({ title, rates }: { title: string, rates: any }) => (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col gap-4">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] border-b pb-2">{title}</h4>
            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-400">HAP Rate</span><span className="text-xl font-black text-slate-800">{rates.hap}</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-400">VAP Rate</span><span className="text-xl font-black text-blue-600">{rates.vap}</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-400">CAUTI Rate</span><span className="text-xl font-black text-amber-600">{rates.cauti}</span></div>
                <div className="flex flex-col"><span className="text-[10px] font-black uppercase text-slate-400">CLABSI Rate</span><span className="text-xl font-black text-red-600">{rates.clabsi}</span></div>
            </div>
            <div className="mt-2 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[9px] font-black uppercase text-slate-500">Overall Rate</span>
                <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white text-xs font-black">{rates.overall}</span>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
            <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit">
                <button onClick={() => setView('log')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><LayoutList size={16}/> Log</button>
                <button onClick={() => setView('analysis')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><TrendingUp size={16}/> Analysis</button>
            </div>

            {view === 'log' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Left Column: Calendar & Selection */}
                    <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
                        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-sm font-black uppercase text-slate-900 tracking-tight flex items-center gap-2">
                                    <CalendarIcon size={18} className="text-primary"/> Census Schedule
                                </h3>
                                <div className="flex gap-1">
                                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronLeft size={16}/></button>
                                    <button onClick={() => changeMonth(1)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><ChevronRight size={16}/></button>
                                </div>
                            </div>
                            
                            <div className="mb-4 text-center">
                                <span className="text-xs font-black uppercase text-slate-400 tracking-widest">
                                    {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </span>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {['S','M','T','W','T','F','S'].map((day, i) => (
                                    <div key={i} className="text-[10px] font-black text-slate-300 text-center py-2">{day}</div>
                                ))}
                            </div>

                            <div className="grid grid-cols-7 gap-1">
                                {calendarDays.map((day, i) => {
                                    if (!day) return <div key={i} className="h-10" />;
                                    const isSelected = selectedDate === day.date;
                                    const needsLog = day.isPast && !day.hasLog;
                                    
                                    return (
                                        <button
                                            key={i}
                                            onClick={() => setSelectedDate(day.date)}
                                            className={`
                                                relative h-10 rounded-xl text-xs font-bold transition-all flex items-center justify-center
                                                ${isSelected ? 'bg-primary text-white shadow-lg' : 'hover:bg-slate-50 text-slate-600'}
                                                ${day.isToday && !isSelected ? 'border-2 border-primary text-primary' : ''}
                                            `}
                                        >
                                            {day.day}
                                            {/* Status Indicators */}
                                            <div className="absolute bottom-1 flex gap-0.5">
                                                {day.hasLog && <div className={`size-1 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-500'}`}></div>}
                                                {needsLog && <div className={`size-1 rounded-full ${isSelected ? 'bg-white' : 'bg-red-500 animate-pulse'}`}></div>}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-8 flex flex-col gap-2 border-t border-slate-50 pt-4">
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-emerald-500"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Logged Data</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="size-2 rounded-full bg-red-500"></div>
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Missing / Pending Log</span>
                                </div>
                            </div>
                        </div>

                        {selectedDate && (
                            <div className="bg-slate-900 p-6 rounded-[2rem] text-white shadow-xl animate-in slide-in-from-bottom-2 duration-300">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="p-2 bg-white/10 rounded-lg"><Clock size={16}/></div>
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Current selection</span>
                                </div>
                                <h4 className="text-2xl font-black tracking-tight mb-1">
                                    {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                </h4>
                                <p className="text-xs font-bold text-slate-400 uppercase">
                                    {logs.find(l => l.date === selectedDate) ? 'Record already exists for this date' : 'Awaiting data entry'}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Entry Form */}
                    <div className="lg:col-span-8 flex flex-col gap-8">
                        <form onSubmit={handleLogSubmit} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8 animate-in fade-in duration-500">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ClipboardList size={24}/></div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 uppercase">Daily Census Entry</h2>
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Surveillance for {selectedDate}</p>
                                    </div>
                                </div>
                                {logs.find(l => l.date === selectedDate) && (
                                    <div className="bg-emerald-50 text-emerald-600 px-3 py-1.5 rounded-xl flex items-center gap-2 border border-emerald-100">
                                        <CheckCircle2 size={16}/>
                                        <span className="text-[10px] font-black uppercase">Logged</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-8">
                                {/* Section 1: Global Totals */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/50 p-6 rounded-3xl border border-indigo-100">
                                    <div className="md:col-span-3 flex items-center gap-2 mb-1">
                                        <Activity size={14} className="text-indigo-600"/>
                                        <span className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Global Device Totals</span>
                                    </div>
                                    <Input label="Overall Ventilator" type="number" value={formData.overallVent} onChange={e => setFormData({...formData, overallVent: e.target.value})} required />
                                    <Input label="Overall IFC" type="number" value={formData.overallIfc} onChange={e => setFormData({...formData, overallIfc: e.target.value})} required />
                                    <Input label="Overall Central Line" type="number" value={formData.overallCentral} onChange={e => setFormData({...formData, overallCentral: e.target.value})} required />
                                </div>

                                {/* Section 2: Admissions & Census */}
                                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                                    <div className="flex items-center gap-2 mb-4 border-b border-slate-200 pb-2">
                                        <Users size={16} className="text-slate-900"/>
                                        <h3 className="text-xs font-black uppercase text-slate-900 tracking-widest">Patient Admissions / Daily Census</h3>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                                        <Input label="Overall" type="number" value={formData.overall} onChange={e => setFormData({...formData, overall: e.target.value})} required />
                                        <Input label="ICU" type="number" value={formData.icu} onChange={e => setFormData({...formData, icu: e.target.value})} required />
                                        <Input label="NICU" type="number" value={formData.nicu} onChange={e => setFormData({...formData, nicu: e.target.value})} required />
                                        <Input label="PICU" type="number" value={formData.picu} onChange={e => setFormData({...formData, picu: e.target.value})} required />
                                        <Input label="Medicine" type="number" value={formData.medicine} onChange={e => setFormData({...formData, medicine: e.target.value})} required />
                                        <Input label="Cohort" type="number" value={formData.cohort} onChange={e => setFormData({...formData, cohort: e.target.value})} required />
                                    </div>
                                </div>

                                {/* Section 3: Ward-Specific Device Days */}
                                <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col gap-4">
                                    <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
                                        <LayoutDashboard size={16} className="text-blue-600"/>
                                        <h3 className="text-xs font-black uppercase text-blue-600 tracking-widest">Ward-Specific Device Days</h3>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <WardDeviceRow title="ICU" prefix="icu" data={formData} setter={setFormData} />
                                        <WardDeviceRow title="NICU" prefix="nicu" data={formData} setter={setFormData} />
                                        <WardDeviceRow title="PICU" prefix="picu" data={formData} setter={setFormData} />
                                        <WardDeviceRow title="Medicine Ward" prefix="med" data={formData} setter={setFormData} />
                                        <WardDeviceRow title="Cohort" prefix="cohort" data={formData} setter={setFormData} />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-4 border-t border-slate-100">
                                <button disabled={loading} className="w-full md:w-fit bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                                    {loading ? <Clock size={20} className="animate-spin" /> : <Save size={20} />} 
                                    {logs.find(l => l.date === selectedDate) ? 'Update Daily Log' : 'Save Daily Log'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col gap-6 relative overflow-hidden">
                            <div className="z-10 flex flex-col gap-2">
                                <h2 className="text-4xl font-black tracking-tight uppercase">Institutional Rate</h2>
                                <p className="text-slate-400 font-medium text-lg">Infection Rate per 1,000 Patient/Device Days</p>
                            </div>
                            <div className="z-10 grid grid-cols-2 md:grid-cols-4 gap-6 mt-4">
                                <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-widest text-emerald-400">HAP Rate</span><span className="text-4xl font-black">{stats.overall.hap}</span></div>
                                <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-widest text-blue-400">VAP Rate</span><span className="text-4xl font-black">{stats.overall.vap}</span></div>
                                <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-widest text-amber-400">CAUTI Rate</span><span className="text-4xl font-black">{stats.overall.cauti}</span></div>
                                <div className="flex flex-col"><span className="text-[11px] font-black uppercase tracking-widest text-rose-400">CLABSI Rate</span><span className="text-4xl font-black">{stats.overall.clabsi}</span></div>
                            </div>
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Activity size={200} /></div>
                        </div>
                        <div className="bg-white p-8 rounded-[3rem] border-2 border-primary flex flex-col items-center justify-center text-center gap-2 shadow-xl shadow-primary/10">
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Consolidated Metric</span>
                            <span className="text-6xl font-black text-slate-900">{stats.overall.overall}</span>
                            <span className="text-xs font-bold text-slate-400 uppercase">Hospital Wide Infection Rate</span>
                            <div className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase"><TrendingUp size={12}/> -4.2% from Last Month</div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <RateCard title="ICU Profile" rates={stats.icu} />
                        <RateCard title="PICU Profile" rates={stats.picu} />
                        <RateCard title="NICU Profile" rates={stats.nicu} />
                        <RateCard title="Medicine Ward" rates={stats.medicine} />
                        <RateCard title="Cohort Profile" rates={stats.cohort} />
                    </div>

                    <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black uppercase text-slate-900 flex items-center gap-3"><BarChart2 className="text-primary"/> Ward-Wise Comparison</h3>
                            <div className="flex items-center gap-4 hidden sm:flex">
                                <div className="flex items-center gap-2"><div className="size-3 rounded bg-emerald-500"></div><span className="text-[10px] font-black uppercase text-slate-400">HAP</span></div>
                                <div className="flex items-center gap-2"><div className="size-3 rounded bg-blue-500"></div><span className="text-[10px] font-black uppercase text-slate-400">VAP</span></div>
                                <div className="flex items-center gap-2"><div className="size-3 rounded bg-amber-500"></div><span className="text-[10px] font-black uppercase text-slate-400">CAUTI</span></div>
                                <div className="flex items-center gap-2"><div className="size-3 rounded bg-red-500"></div><span className="text-[10px] font-black uppercase text-slate-400">CLABSI</span></div>
                            </div>
                        </div>
                        <div className="h-96">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[
                                    { name: 'ICU', ...stats.icu },
                                    { name: 'PICU', ...stats.picu },
                                    { name: 'NICU', ...stats.nicu },
                                    { name: 'Medicine', ...stats.medicine },
                                    { name: 'Cohort', ...stats.cohort }
                                ]}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                    <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                    <Bar dataKey="hap" fill="#10b981" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="vap" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="cauti" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                    <Bar dataKey="clabsi" fill="#ef4444" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HAIDataDashboard;

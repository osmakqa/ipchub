
import React, { useState, useEffect, useMemo } from 'react';
import { getActionPlans, updateActionPlanStatus } from '../../services/ipcService';
import { 
    ClipboardList, 
    CheckCircle2, 
    XCircle, 
    Clock, 
    ArrowRight, 
    Filter, 
    User, 
    Calendar,
    MoreHorizontal,
    AlertCircle,
    RotateCcw,
    LayoutList,
    TrendingUp,
    BarChart2,
    CheckCircle,
    MapPin
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, 
    Cell, PieChart, Pie, Legend, CartesianGrid 
} from 'recharts';

interface Props {
  viewMode?: 'log' | 'analysis';
}

const ActionPlanTracker: React.FC<Props> = ({ viewMode: initialViewMode }) => {
    const [view, setView] = useState<'log' | 'analysis'>(initialViewMode || 'log');
    const [plans, setPlans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('');
    
    // Filters
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [selectedQuarter, setSelectedQuarter] = useState('');

    useEffect(() => { loadPlans(); }, []);

    const loadPlans = async () => {
        setLoading(true);
        const data = await getActionPlans();
        setPlans(data);
        setLoading(false);
    };

    const handleStatusChange = async (id: string, status: string) => {
        await updateActionPlanStatus(id, status);
        loadPlans();
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'completed-closed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'failed-extended': return 'bg-amber-50 text-amber-600 border-amber-100';
            case 'failed-changed': return 'bg-rose-50 text-rose-600 border-rose-100';
            default: return 'bg-slate-50 text-slate-400 border-slate-100';
        }
    };

    const filteredPlans = useMemo(() => {
        return plans.filter(p => {
            const matchesStatus = filterStatus ? p.status === filterStatus : true;
            // Additional date filtering could be added here if needed
            return matchesStatus;
        });
    }, [plans, filterStatus]);

    const analysisData = useMemo(() => {
        if (plans.length === 0) return null;
        const statusMap: Record<string, number> = {
            'completed-closed': 0,
            'failed-extended': 0,
            'failed-changed': 0,
            'pending': 0
        };
        plans.forEach(p => {
            const s = p.status || 'pending';
            statusMap[s] = (statusMap[s] || 0) + 1;
        });

        const pieData = Object.entries(statusMap).map(([name, value]) => ({ 
            name: name.replace('-', ' '), 
            value 
        })).filter(d => d.value > 0);

        const categoryMap: Record<string, number> = {};
        plans.forEach(p => {
            const cat = p.category || 'General';
            categoryMap[cat] = (categoryMap[cat] || 0) + 1;
        });
        const barData = Object.entries(categoryMap).map(([name, count]) => ({ name, count })).sort((a,b) => b.count - a.count);

        return { pieData, barData };
    }, [plans]);

    const COLORS = ['#10b981', '#f59e0b', '#ef4444', '#94a3b8'];

    return (
        <div className="flex flex-col gap-6 max-w-6xl mx-auto pb-20">
            <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit print:hidden">
                <button onClick={() => setView('log')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><LayoutList size={16}/> Log</button>
                <button onClick={() => setView('analysis')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><TrendingUp size={16}/> Analysis</button>
            </div>

            {view === 'log' ? (
                <>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                            <button onClick={() => setFilterStatus('')} className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 transition-all ${!filterStatus ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>All Actions</button>
                            {['completed-closed', 'failed-extended', 'failed-changed', 'pending'].map(s => (
                                <button key={s} onClick={() => setFilterStatus(s)} className={`px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest border-2 transition-all ${filterStatus === s ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'}`}>
                                    {s.replace('-', ' ')}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => { setFilterStatus(''); loadPlans(); }} className="p-2 text-slate-400 hover:text-slate-900 transition-colors"><RotateCcw size={20}/></button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {loading ? (
                            <div className="bg-white p-20 rounded-3xl flex flex-col items-center gap-4 text-slate-300">
                                <Clock size={48} className="animate-spin" />
                                <span className="font-black uppercase text-xs tracking-widest">Loading Plans...</span>
                            </div>
                        ) : filteredPlans.length === 0 ? (
                            <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
                                <CheckCircle size={48} className="text-slate-200" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No active plans in this category</p>
                            </div>
                        ) : (
                            filteredPlans.map(plan => (
                                <div key={plan.id} className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-slate-400 transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className={`p-4 rounded-2xl border ${getStatusStyle(plan.status)}`}>
                                            {plan.status === 'completed-closed' ? <CheckCircle2 size={24}/> : plan.status === 'pending' ? <Clock size={24}/> : <AlertCircle size={24}/>}
                                        </div>
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{plan.category}</span>
                                            <h3 className="font-black text-slate-900 text-lg leading-tight">{plan.action}</h3>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><User size={12}/> {plan.personResponsible}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Calendar size={12}/> Target: {plan.targetDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl">
                                        <select 
                                            className="bg-transparent border-none text-[10px] font-black uppercase text-slate-600 focus:ring-0 cursor-pointer"
                                            value={plan.status}
                                            onChange={(e) => handleStatusChange(plan.id, e.target.value)}
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="completed-closed">Completed</option>
                                            <option value="failed-extended">Extended</option>
                                            <option value="failed-changed">Modified</option>
                                        </select>
                                        <div className="h-4 w-px bg-slate-200 mx-1"></div>
                                        <button className="p-2 text-slate-300 hover:text-slate-900 transition-colors"><MoreHorizontal size={18}/></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </>
            ) : (
                <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                    <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:hidden">
                        <div className="flex items-center gap-3 min-w-max">
                            <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                                <Filter size={14} className="text-slate-400" />
                                <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-rose-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                    <option value="2023">2023</option>
                                    <option value="2024">2024</option>
                                    <option value="2025">2025</option>
                                </select>
                                <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-rose-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedQuarter} onChange={(e) => setSelectedQuarter(e.target.value)}>
                                    <option value="">Full Year</option>
                                    <option value="Q1">Q1</option>
                                    <option value="Q2">Q2</option>
                                    <option value="Q3">Q3</option>
                                    <option value="Q4">Q4</option>
                                </select>
                            </div>
                            <button onClick={() => { setSelectedYear(new Date().getFullYear().toString()); setSelectedQuarter(''); }} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><RotateCcw size={14} /></button>
                        </div>
                    </div>

                    {!analysisData ? (
                        <div className="p-20 text-center text-slate-400 font-bold">No data to analyze.</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                                    <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3">Resolution Status</h3>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={analysisData.pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value">
                                                    {analysisData.pieData.map((entry, index) => <Cell key={index} fill={COLORS[index % COLORS.length]} />)}
                                                </Pie>
                                                <RechartsTooltip contentStyle={{borderRadius: '16px'}} />
                                                <Legend wrapperStyle={{fontSize: 12, fontWeight: 'bold'}} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                                    <h3 className="text-xl font-black text-slate-900 uppercase flex items-center gap-3"><BarChart2 className="text-primary"/> Actions by Category</h3>
                                    <div className="h-72">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={analysisData.barData} layout="vertical">
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                                <XAxis type="number" hide />
                                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                                <RechartsTooltip contentStyle={{borderRadius: '16px'}} />
                                                <Bar dataKey="count" fill="#0f172a" radius={[0, 10, 10, 0]} barSize={30} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default ActionPlanTracker;

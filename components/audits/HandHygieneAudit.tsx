import React, { useState, useMemo, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { AREAS } from '../../constants';
import { submitHHAudit, submitActionPlan, getHandHygieneAudits } from '../../services/ipcService';
import { 
    Hand, 
    User, 
    MapPin, 
    Calendar, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    Plus, 
    Trash2, 
    AlertCircle, 
    Save, 
    ShieldCheck,
    Briefcase,
    Zap,
    LayoutList,
    TrendingUp,
    BarChart3,
    Filter,
    RotateCcw,
    Loader2
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

const ROLES = ["Doctor", "Nurse", "Nursing Aide", "Housekeeping", "Rad Tech", "Med Tech", "Respi Tech", "Dietary Staff", "Therapist", "Others (specify)"];
const MOMENTS = ["1. Before touching patient", "2. Before aseptic proc.", "3. After body fluid exposure", "4. After touching patient", "5. After touching surroundings"];
const ACTIONS = ["Hand Rub", "Hand Wash", "Missed"];

interface MomentEntry {
    moment: string;
    action: string;
    usedGloves: boolean;
}

interface Props {
  viewMode?: 'log' | 'analysis';
}

const HandHygieneAudit: React.FC<Props> = ({ viewMode: initialViewMode }) => {
    const [view, setView] = useState<'log' | 'analysis'>(initialViewMode || 'log');
    const [loading, setLoading] = useState(false);
    const [auditHistory, setAuditHistory] = useState<any[]>([]);
    const [showActionPlanModal, setShowActionPlanModal] = useState(false);
    
    // Filters
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        area: '',
        areaOther: '',
        auditeeRole: '',
        auditeeRoleOther: '',
        moments: [{ moment: '', action: '', usedGloves: false }] as MomentEntry[]
    });

    const [apForm, setApForm] = useState({ 
        action: '', 
        targetDate: '', 
        personResponsible: '', 
        category: 'Hand Hygiene',
        area: '',
        areaOther: ''
    });

    useEffect(() => {
        if (view === 'analysis') loadHistory();
    }, [view]);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getHandHygieneAudits();
        setAuditHistory(data);
        setLoading(false);
    };

    const handleAddMoment = () => {
        if (form.moments.length >= 10) return;
        setForm(prev => ({ ...prev, moments: [...prev.moments, { moment: '', action: '', usedGloves: false }] }));
    };

    const handleRemoveMoment = (idx: number) => {
        setForm(prev => ({ ...prev, moments: prev.moments.filter((_, i) => i !== idx) }));
    };

    const updateMoment = (idx: number, field: keyof MomentEntry, val: any) => {
        const newMoments = [...form.moments];
        newMoments[idx] = { ...newMoments[idx], [field]: val };
        setForm(prev => ({ ...prev, moments: newMoments }));
    };

    const handleSubmit = async () => {
        setLoading(true);
        await submitHHAudit(form);
        alert("Hand Hygiene Audit Logged Successfully.");
        setForm({
            date: new Date().toISOString().split('T')[0],
            area: '', areaOther: '', auditeeRole: '', auditeeRoleOther: '',
            moments: [{ moment: '', action: '', usedGloves: false }]
        });
        setLoading(false);
        if (view === 'analysis') loadHistory();
    };

    const handleSaveActionPlan = async () => {
        await submitActionPlan(apForm);
        setShowActionPlanModal(false);
        setApForm({ action: '', targetDate: '', personResponsible: '', category: 'Hand Hygiene', area: '', areaOther: '' });
        alert("Action Plan Added.");
    };

    const stats = useMemo(() => {
        if (auditHistory.length === 0) return null;
        
        const roleCompliance: Record<string, { total: number, performed: number }> = {};
        const areaCompliance: Record<string, { total: number, performed: number }> = {};
        let grandTotal = 0;
        let grandPerformed = 0;

        auditHistory.forEach(audit => {
            const role = audit.auditeeRole || 'Other';
            const area = audit.area || 'Unknown';
            const moments = audit.moments || [];
            
            if (!roleCompliance[role]) roleCompliance[role] = { total: 0, performed: 0 };
            if (!areaCompliance[area]) areaCompliance[area] = { total: 0, performed: 0 };

            moments.forEach((m: any) => {
                roleCompliance[role].total++;
                areaCompliance[area].total++;
                grandTotal++;
                if (m.action !== 'Missed') {
                    roleCompliance[role].performed++;
                    areaCompliance[area].performed++;
                    grandPerformed++;
                }
            });
        });

        const roleData = Object.entries(roleCompliance).map(([name, data]) => ({
            name,
            compliance: Math.round((data.performed / data.total) * 100)
        }));

        const areaData = Object.entries(areaCompliance).map(([name, data]) => ({
            name,
            score: Math.round((data.performed / data.total) * 100)
        })).sort((a, b) => b.score - a.score);

        return { roleData, areaData, overall: Math.round((grandPerformed / grandTotal) * 100) };
    }, [auditHistory]);

    return (
        <div className="flex flex-col gap-6 max-w-5xl mx-auto pb-20">
            <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit">
                <button onClick={() => setView('log')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><LayoutList size={16}/> Log</button>
                <button onClick={() => setView('analysis')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><TrendingUp size={16}/> Analysis</button>
            </div>

            {view === 'log' ? (
                <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col gap-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><Hand size={24} /></div>
                            <div><h2 className="text-xl font-black text-slate-900 uppercase">Direct Observation Audit</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">WHO 5 Moments Recording</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setShowActionPlanModal(true)}
                                className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100 flex items-center gap-2 hover:bg-emerald-100 transition-all"
                            >
                                <Zap size={14}/> Add Action Plan
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Input label="Audit Date" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
                        <div className="flex flex-col gap-2">
                            <Select label="Observation Area" options={AREAS} value={form.area} onChange={e => setForm({...form, area: e.target.value})} />
                            {form.area === 'Other (specify)' && <Input label="Specify Area" value={form.areaOther} onChange={e => setForm({...form, areaOther: e.target.value})} />}
                        </div>
                        <div className="flex flex-col gap-2">
                            <Select label="Auditee Role" options={ROLES} value={form.auditeeRole} onChange={e => setForm({...form, auditeeRole: e.target.value})} />
                            {form.auditeeRole === 'Others (specify)' && <Input label="Specify Role" value={form.auditeeRoleOther} onChange={e => setForm({...form, auditeeRoleOther: e.target.value})} />}
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black uppercase text-slate-500 tracking-widest flex items-center gap-2">Observations <span className="bg-slate-100 px-2 py-0.5 rounded text-[10px]">{form.moments.length}/10</span></h3>
                        </div>
                        
                        <div className="space-y-3">
                            {form.moments.map((entry, idx) => (
                                <div key={idx} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200 grid grid-cols-1 lg:grid-cols-12 gap-4 items-end animate-in fade-in slide-in-from-right-2 duration-300">
                                    <div className="lg:col-span-1 flex items-center justify-center h-full"><span className="text-xs font-black text-slate-400">#{idx + 1}</span></div>
                                    <div className="lg:col-span-4"><Select label="WHO Moment" options={MOMENTS} value={entry.moment} onChange={e => updateMoment(idx, 'moment', e.target.value)} placeholder="Select Moment..." /></div>
                                    <div className="lg:col-span-3">
                                        <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Action Taken</label>
                                        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-lg">
                                            {ACTIONS.map(a => (
                                                <button 
                                                    key={a}
                                                    type="button"
                                                    onClick={() => updateMoment(idx, 'action', a)}
                                                    className={`flex-1 text-[10px] font-black py-1.5 rounded-md transition-all ${entry.action === a ? 'bg-emerald-500 text-white' : 'text-slate-400 hover:bg-slate-50'}`}
                                                >
                                                    {a === 'Missed' ? '✖' : a === 'Hand Rub' ? '💧' : '🧼'} {a.split(' ')[1] || a}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="lg:col-span-3">
                                        {entry.action === 'Missed' && (
                                            <div className="animate-in zoom-in-95">
                                                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1.5">Used Gloves?</label>
                                                <div className="flex gap-1">
                                                    <button onClick={() => updateMoment(idx, 'usedGloves', true)} className={`flex-1 text-[10px] font-black py-2 rounded-lg border transition-all ${entry.usedGloves ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>Yes</button>
                                                    <button onClick={() => updateMoment(idx, 'usedGloves', false)} className={`flex-1 text-[10px] font-black py-2 rounded-lg border transition-all ${!entry.usedGloves ? 'bg-slate-600 border-slate-600 text-white' : 'bg-white border-slate-200 text-slate-400'}`}>No</button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="lg:col-span-1 flex justify-end">
                                        {form.moments.length > 1 && (
                                            <button onClick={() => handleRemoveMoment(idx)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18}/></button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={handleAddMoment} 
                            disabled={form.moments.length >= 10} 
                            className="mt-2 w-full py-4 rounded-2xl border-2 border-dashed border-emerald-200 bg-emerald-50/30 text-emerald-600 font-black uppercase text-xs tracking-widest hover:bg-emerald-50 hover:border-emerald-400 transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            <Plus size={18}/> Add Opportunity
                        </button>
                    </div>

                    <div className="border-t border-slate-100 pt-6 flex justify-end">
                        <button 
                            onClick={handleSubmit}
                            disabled={loading || !form.area || !form.auditeeRole}
                            className="bg-emerald-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
                        >
                            {loading ? <Clock size={20} className="animate-spin" /> : <Save size={20} />} Publish Audit Results
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                    {loading ? <Loader2 className="animate-spin mx-auto text-slate-300" size={48} /> : !stats ? (
                        <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 text-slate-400 font-bold">Awaiting first audit entry</div>
                    ) : (
                        <>
                            <div className="bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-200 overflow-x-auto print:hidden">
                                <div className="flex items-center gap-3 min-w-max">
                                    <div className="flex items-center gap-2 border-r pr-3 border-slate-100">
                                        <Filter size={14} className="text-slate-400" />
                                        <span className="text-[10px] font-black uppercase tracking-tighter text-slate-400">Filters</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <select className="text-xs border border-slate-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 outline-none font-bold bg-slate-50/50 text-slate-600" value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)}>
                                            <option value="2023">2023</option>
                                            <option value="2024">2024</option>
                                            <option value="2025">2025</option>
                                        </select>
                                    </div>
                                    <button onClick={() => { setSelectedYear(new Date().getFullYear().toString()); loadHistory(); }} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"><RotateCcw size={14} /></button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-emerald-900 p-10 rounded-[3rem] text-white flex flex-col gap-6 overflow-hidden relative">
                                    <div className="z-10 flex flex-col gap-2">
                                        <h2 className="text-4xl font-black tracking-tight uppercase">Compliance Rates</h2>
                                        <p className="text-emerald-300 font-medium text-lg">Direct Observation Trends per Staff Group</p>
                                        <p className="text-white/50 text-xs font-black uppercase tracking-widest">Annual {selectedYear} Report</p>
                                    </div>
                                    <div className="z-10 h-64 mt-4">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={stats.roleData}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#fff', fontSize: 10}} />
                                                <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{fill: '#fff', fontSize: 10}} />
                                                <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{borderRadius: '12px', border: 'none'}} />
                                                <Bar dataKey="compliance" fill="#34d399" radius={[10, 10, 0, 0]} barSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                    <div className="absolute top-0 right-0 p-8 opacity-10 text-white"><Hand size={200} /></div>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] border-2 border-emerald-500 flex flex-col items-center justify-center text-center gap-2 shadow-xl shadow-emerald-500/10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-600">Institutional Aggregate</span>
                                    <span className="text-7xl font-black text-slate-900">{stats.overall}%</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Overall Compliance</span>
                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-slate-100 rounded-2xl text-slate-500"><BarChart3 size={24}/></div>
                                    <h3 className="text-xl font-black uppercase text-slate-900">Area Analysis</h3>
                                </div>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.areaData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} />
                                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 'bold'}} domain={[0, 100]} />
                                            <RechartsTooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                                            <Bar dataKey="score" radius={[10, 10, 0, 0]} barSize={50}>
                                                {stats.areaData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.score > 85 ? '#10b981' : entry.score > 75 ? '#3b82f6' : '#f59e0b'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {showActionPlanModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-emerald-600 p-6 text-white text-center">
                            <Zap size={40} className="mx-auto mb-2" fill="currentColor" />
                            <h3 className="text-xl font-black uppercase">Create Action Plan</h3>
                            <p className="text-xs opacity-80 font-bold">Correction for Hand Hygiene non-compliance</p>
                        </div>
                        <div className="p-8 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Select label="Target Area / Ward" options={AREAS} value={apForm.area} onChange={e => setApForm({...apForm, area: e.target.value})} />
                                {apForm.area === 'Other (specify)' && <Input label="Specify Ward" value={apForm.areaOther} onChange={e => setApForm({...apForm, areaOther: e.target.value})} />}
                            </div>
                            <Input label="Correction Action" value={apForm.action} onChange={e => setApForm({...apForm, action: e.target.value})} placeholder="e.g. Provide pocket alcohol dispensers" />
                            <Input label="Target Date" type="date" value={apForm.targetDate} onChange={e => setApForm({...apForm, targetDate: e.target.value})} />
                            <Input label="Person Responsible" value={apForm.personResponsible} onChange={e => setApForm({...apForm, personResponsible: e.target.value})} />
                            <div className="flex gap-3 mt-4">
                                <button onClick={() => setShowActionPlanModal(false)} className="flex-1 py-3 text-slate-400 font-black uppercase text-xs hover:bg-slate-50 rounded-xl">Cancel</button>
                                <button onClick={handleSaveActionPlan} className="flex-1 py-3 bg-emerald-600 text-white font-black uppercase text-xs rounded-xl shadow-lg hover:bg-emerald-700 transition-all">Save Action</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HandHygieneAudit;
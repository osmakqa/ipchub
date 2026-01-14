import React, { useState, useEffect, useMemo } from 'react';
import { 
    Activity, 
    ShieldCheck, 
    TrendingDown, 
    Trophy, 
    AlertTriangle, 
    Users, 
    MapPin, 
    Dna, 
    CheckCircle2, 
    BarChart3,
    Hand,
    Loader2,
    Calendar
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
    ResponsiveContainer, Cell, PieChart, Pie, Legend, 
    CartesianGrid, AreaChart, Area 
} from 'recharts';
import { 
    getHAIReports, 
    getAreaAudits, 
    getHandHygieneAudits, 
    getCultureReports,
    getIsolationReports,
    getCensusLogs,
    calculateInfectionRates
} from '../../services/ipcService';

interface Props {
    viewMode?: string;
}

const ExecutiveDashboard: React.FC<Props> = ({ viewMode }) => {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState({
        hai: [] as any[],
        areaAudits: [] as any[],
        hhAudits: [] as any[],
        culture: [] as any[],
        isolation: [] as any[],
        census: [] as any[]
    });

    useEffect(() => {
        const fetchAll = async () => {
            const [hai, areaAudits, hhAudits, culture, isolation, census] = await Promise.all([
                getHAIReports(), getAreaAudits(), getHandHygieneAudits(), getCultureReports(), getIsolationReports(), getCensusLogs()
            ]);
            setData({ hai, areaAudits, hhAudits, culture, isolation, census });
            setLoading(false);
        };
        fetchAll();
    }, []);

    const stats = useMemo(() => {
        if (loading) return null;

        // 1. Compliance (Area Audits Average)
        const areaScores = data.areaAudits.map(a => {
            const answers = Object.values(a.answers || {});
            const yes = answers.filter(v => v === 'Yes').length;
            const total = answers.filter(v => v !== 'NA').length || 1;
            return (yes / total) * 100;
        });
        const institutionalCompliance = areaScores.length > 0 
            ? (areaScores.reduce((a, b) => a + b, 0) / areaScores.length).toFixed(1) 
            : "0.0";

        // 2. Active HAIs
        const activeHAIs = data.hai.filter(h => !h.outcome || h.outcome === 'Admitted').length;

        // 3. Infection Rate (using service logic)
        const rates = calculateInfectionRates(data.census, data.hai);
        const overallRate = rates.overall.overall;

        // 4. Ward Leaderboard
        const wards = ["ICU", "NICU", "PICU", "Medicine Ward", "Surgery Ward", "Cohort"];
        const wardPerformance = wards.map(ward => {
            const wardAudits = data.areaAudits.filter(a => a.area === ward);
            const wardHH = data.hhAudits.filter(a => a.area === ward);
            
            const auditScore = wardAudits.length > 0 ? (wardAudits.reduce((acc, a) => {
                const ans = Object.values(a.answers || {});
                return acc + (ans.filter(v => v === 'Yes').length / (ans.filter(v => v !== 'NA').length || 1)) * 100;
            }, 0) / wardAudits.length) : 0;

            const hhScore = wardHH.length > 0 ? (wardHH.reduce((acc, a) => {
                const moments = a.moments || [];
                return acc + (moments.filter((m: any) => m.action !== 'Missed').length / (moments.length || 1)) * 100;
            }, 0) / wardHH.length) : 0;

            return {
                name: ward,
                score: Math.round((auditScore + hhScore) / (auditScore > 0 && hhScore > 0 ? 2 : 1)),
                compliance: Math.round(hhScore),
                trend: wardAudits.length > 1 ? '+0%' : 'New'
            };
        }).sort((a, b) => b.score - a.score);

        // 5. Monthly Trend (HAI)
        const monthMap: Record<string, number> = {};
        data.hai.forEach(h => {
            const m = h.dateReported?.substring(0, 7) || 'Unknown';
            monthMap[m] = (monthMap[m] || 0) + 1;
        });
        const monthlyInfections = Object.entries(monthMap)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .map(([month, count]) => ({ month: month.split('-')[1], count }))
            .slice(-6);

        // 6. Organism Distribution
        const orgMap: Record<string, number> = {};
        data.culture.forEach(c => {
            const org = c.organism || 'Unknown';
            orgMap[org] = (orgMap[org] || 0) + 1;
        });
        const resistanceData = Object.entries(orgMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 4)
            .map(([name, value], i) => ({ name, value, color: ['#f43f5e', '#fb923c', '#10b981', '#94a3b8'][i] }));

        return {
            institutionalCompliance,
            activeHAIs,
            overallRate,
            wardPerformance,
            monthlyInfections,
            resistanceData
        };
    }, [data, loading]);

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-20 text-slate-300">
            <Loader2 className="animate-spin mb-4" size={48} />
            <p className="font-black uppercase tracking-widest text-xs">Generating Executive Insights...</p>
        </div>
    );

    const renderSummary = () => (
        <div className="flex flex-col gap-10 max-w-[1600px] mx-auto pb-20 animate-in fade-in duration-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white flex flex-col gap-4 shadow-2xl">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-white/10 rounded-2xl text-emerald-400"><ShieldCheck size={32}/></div>
                        <span className="text-[10px] font-black uppercase text-emerald-400 tracking-widest bg-emerald-400/10 px-2 py-1 rounded">Compliance</span>
                    </div>
                    <div>
                        <span className="text-5xl font-black block">{stats?.institutionalCompliance}%</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 block">Global Adherence</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Activity size={32}/></div>
                        <span className="text-[10px] font-black uppercase text-rose-600 tracking-widest bg-rose-50 px-2 py-1 rounded">Surveillance</span>
                    </div>
                    <div>
                        <span className="text-5xl font-black block text-slate-900">{stats?.activeHAIs.toString().padStart(2, '0')}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 block">Active HAI Cases</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><TrendingDown size={32}/></div>
                        <span className="text-[10px] font-black uppercase text-blue-600 tracking-widest bg-blue-50 px-2 py-1 rounded">Live Data</span>
                    </div>
                    <div>
                        <span className="text-5xl font-black block text-slate-900">{stats?.overallRate}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 block">Infection Rate</span>
                    </div>
                </div>
                <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 flex flex-col gap-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl"><Calendar size={32}/></div>
                        <span className="text-[10px] font-black uppercase text-amber-500 tracking-widest bg-amber-50 px-2 py-1 rounded">Updates</span>
                    </div>
                    <div>
                        <span className="text-5xl font-black block text-slate-900">{data.census.length}</span>
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-[0.2em] mt-2 block">Census Logs</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase">Hospital-Wide Infection Trend</h3>
                            <p className="text-sm font-bold text-slate-400 uppercase mt-1">Live Surveillance Registry</p>
                        </div>
                    </div>
                    <div className="h-80">
                        {stats?.monthlyInfections.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase text-xs">Awaiting registry entries</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats?.monthlyInfections}>
                                    <defs>
                                        <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#0f172a" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#0f172a" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                                    <RechartsTooltip contentStyle={{borderRadius: '20px', border: 'none'}} />
                                    <Area type="monotone" dataKey="count" stroke="#0f172a" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-slate-900 p-10 rounded-[3rem] text-white flex flex-col gap-6 shadow-xl relative overflow-hidden">
                    <div className="z-10">
                        <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-3"><Trophy className="text-amber-400"/> Ward Safety Ranking</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-widest">Aggregate Compliance Scores</p>
                    </div>
                    <div className="z-10 flex flex-col gap-4 mt-4">
                        {stats?.wardPerformance.slice(0, 5).map((ward, i) => (
                            <div key={ward.name} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-4">
                                    <span className={`text-lg font-black ${i === 0 ? 'text-amber-400' : 'text-slate-400'}`}>0{i + 1}</span>
                                    <div className="flex flex-col">
                                        <span className="font-black text-sm uppercase">{ward.name}</span>
                                        <span className="text-[10px] font-bold text-slate-500 uppercase">{ward.trend} status</span>
                                    </div>
                                </div>
                                <span className="text-xl font-black text-white">{ward.score}%</span>
                            </div>
                        ))}
                    </div>
                    <div className="absolute -bottom-10 -right-10 opacity-5 text-white rotate-12"><Trophy size={200} /></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><Dna size={24}/></div>
                        <h3 className="text-xl font-black text-slate-900 uppercase">Organism Distribution</h3>
                    </div>
                    <div className="h-64">
                        {stats?.resistanceData.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-slate-300 font-bold uppercase text-xs">No culture results recorded</div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={stats?.resistanceData} cx="50%" cy="50%" innerRadius={70} outerRadius={90} paddingAngle={8} dataKey="value">
                                        {stats?.resistanceData.map((entry: any, index: number) => <Cell key={index} fill={entry.color} />)}
                                    </Pie>
                                    <RechartsTooltip />
                                    <Legend verticalAlign="middle" align="right" layout="vertical" wrapperStyle={{fontSize: 12, fontWeight: 'bold'}} />
                                </PieChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-rose-50/40 p-10 rounded-[3rem] border border-rose-100 flex flex-col gap-6">
                    <div className="flex items-center justify-between border-b border-rose-100 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl"><AlertTriangle size={24}/></div>
                            <h3 className="text-xl font-black text-slate-900 uppercase">Isolation Clusters</h3>
                        </div>
                    </div>
                    <div className="flex flex-col gap-3">
                        {data.isolation.slice(0, 3).map((iso, i) => (
                            <div key={i} className="bg-white p-6 rounded-3xl border border-rose-200 flex items-center justify-between shadow-sm">
                                <div className="flex flex-col">
                                    <span className="text-lg font-black text-slate-900 uppercase">{iso.area} Patient</span>
                                    <span className="text-xs font-bold text-rose-500 uppercase tracking-widest mt-1">{iso.diagnosis}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Admitted</span>
                                    <span className="text-sm font-black text-slate-900">{iso.dateOfAdmission}</span>
                                </div>
                            </div>
                        ))}
                        {data.isolation.length === 0 && (
                            <div className="text-center py-20 text-slate-300 font-bold uppercase text-xs">No isolated patients</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return renderSummary();
};

export default ExecutiveDashboard;
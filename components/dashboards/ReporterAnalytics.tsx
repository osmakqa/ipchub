import React, { useState, useEffect, useMemo } from 'react';
import { 
  Trophy, 
  Users, 
  Medal, 
  Star, 
  Filter, 
  RotateCcw, 
  Activity, 
  Bell, 
  Stethoscope, 
  ShieldAlert, 
  ShieldCheck, 
  FlaskConical,
  TrendingUp,
  Search,
  Calendar,
  Loader2
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, 
  ResponsiveContainer, Cell, CartesianGrid 
} from 'recharts';
import { 
  getHAIReports, 
  getNotifiableReports, 
  getTBReports, 
  getIsolationReports, 
  getNeedlestickReports,
  getCultureReports 
} from '../../services/ipcService';

const ReporterAnalytics: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [hai, notif, tb, iso, needle, cult] = await Promise.all([
        getHAIReports(), getNotifiableReports(), getTBReports(), 
        getIsolationReports(), getNeedlestickReports(), getCultureReports()
      ]);
      
      const combined = [
        ...hai.map(r => ({ ...r, module: 'HAI' })),
        ...notif.map(r => ({ ...r, module: 'Notifiable' })),
        ...tb.map(r => ({ ...r, module: 'TB' })),
        ...iso.map(r => ({ ...r, module: 'Isolation' })),
        ...needle.map(r => ({ ...r, module: 'Sharps', reporterName: r.hcwName })), // Needle uses hcwName
        ...cult.map(r => ({ ...r, module: 'Culture' }))
      ];
      setData(combined);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const filteredData = useMemo(() => {
    return data.filter(item => {
      const date = new Date(item.dateReported || item.dateOfInjury || item.transferDate);
      const year = date.getFullYear().toString();
      const month = date.getMonth();
      const quarter = Math.floor(month / 3) + 1;
      
      const matchesYear = selectedYear ? year === selectedYear : true;
      const matchesQuarter = selectedQuarter ? `Q${quarter}` === selectedQuarter : true;
      const matchesSearch = searchQuery ? 
        (item.reporterName || '').toLowerCase().includes(searchQuery.toLowerCase()) : true;

      return matchesYear && matchesQuarter && matchesSearch;
    });
  }, [data, selectedYear, selectedQuarter, searchQuery]);

  const analytics = useMemo(() => {
    if (filteredData.length === 0) return null;

    const counts: Record<string, { total: number, modules: Record<string, number> }> = {};
    
    filteredData.forEach(r => {
      const name = r.reporterName || 'Unknown';
      const mod = r.module;
      if (!counts[name]) counts[name] = { total: 0, modules: {} };
      counts[name].total++;
      counts[name].modules[mod] = (counts[name].modules[mod] || 0) + 1;
    });

    const sortedReporters = Object.entries(counts)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.total - a.total);

    const moduleLeaders = ['HAI', 'Notifiable', 'TB', 'Isolation', 'Sharps', 'Culture'].map(mod => {
      const leader = Object.entries(counts)
        .map(([name, stats]) => ({ name, count: stats.modules[mod] || 0 }))
        .sort((a, b) => b.count - a.count)[0];
      return { module: mod, name: leader?.count > 0 ? leader.name : 'N/A', count: leader?.count || 0 };
    });

    return { sortedReporters, moduleLeaders };
  }, [filteredData]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 text-slate-300">
      <Loader2 className="animate-spin mb-4" size={48} />
      <p className="font-black uppercase tracking-widest text-xs">Aggregating Reporter Contributions...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-500">
      {/* Filters */}
      <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search reporters..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select 
            className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-black uppercase text-slate-600 focus:ring-2 focus:ring-primary outline-none"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
          >
            <option value="2023">2023</option>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
          <select 
            className="bg-slate-50 border-none rounded-xl px-4 py-2.5 text-xs font-black uppercase text-slate-600 focus:ring-2 focus:ring-primary outline-none"
            value={selectedQuarter}
            onChange={(e) => setSelectedQuarter(e.target.value)}
          >
            <option value="">All Quarters</option>
            <option value="Q1">Q1</option>
            <option value="Q2">Q2</option>
            <option value="Q3">Q3</option>
            <option value="Q4">Q4</option>
          </select>
          <button onClick={() => { setSelectedYear('2025'); setSelectedQuarter(''); setSearchQuery(''); }} className="p-2.5 text-slate-400 hover:text-primary transition-colors"><RotateCcw size={20}/></button>
        </div>
      </div>

      {!analytics || analytics.sortedReporters.length === 0 ? (
        <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 text-slate-400 font-bold uppercase text-xs">No records found for this period</div>
      ) : (
        <>
          {/* Top 3 Leaders */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {analytics.sortedReporters.slice(0, 3).map((rep, i) => (
              <div key={rep.name} className={`relative p-8 rounded-[3rem] border flex flex-col items-center text-center gap-4 shadow-xl ${i === 0 ? 'bg-slate-900 text-white border-slate-900 scale-105' : 'bg-white border-slate-100 text-slate-900'}`}>
                <div className={`size-16 rounded-2xl flex items-center justify-center ${i === 0 ? 'bg-emerald-500 text-white' : i === 1 ? 'bg-slate-100 text-slate-400' : 'bg-orange-50 text-orange-400'}`}>
                  {i === 0 ? <Trophy size={32}/> : <Medal size={32}/>}
                </div>
                <div className="flex flex-col gap-1">
                  <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${i === 0 ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {i === 0 ? 'Master Contributor' : i === 1 ? 'Elite Contributor' : 'Super Contributor'}
                  </span>
                  <h3 className="text-xl font-black leading-tight uppercase">{rep.name}</h3>
                </div>
                <div className="flex flex-col">
                  <span className="text-4xl font-black leading-none">{rep.total}</span>
                  <span className="text-[10px] font-bold opacity-50 uppercase mt-2">Validated Reports</span>
                </div>
                {i === 0 && <Star className="absolute top-6 right-6 text-yellow-400 animate-pulse" size={24} fill="currentColor"/>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Module Champions */}
            <div className="lg:col-span-1 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-6">
              <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest flex items-center gap-3">
                <Medal size={20} className="text-primary" /> Module Champions
              </h3>
              <div className="flex flex-col gap-4">
                {analytics.moduleLeaders.map(ml => (
                  <div key={ml.module} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:border-primary transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-lg text-slate-400 group-hover:text-primary transition-colors">
                        {ml.module === 'HAI' && <Activity size={16}/>}
                        {ml.module === 'Notifiable' && <Bell size={16}/>}
                        {ml.module === 'TB' && <Stethoscope size={16}/>}
                        {ml.module === 'Isolation' && <ShieldCheck size={16}/>}
                        {ml.module === 'Sharps' && <ShieldAlert size={16}/>}
                        {ml.module === 'Culture' && <FlaskConical size={16}/>}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black uppercase text-slate-400">{ml.module} Hub</span>
                        <span className="text-xs font-black text-slate-800 uppercase truncate max-w-[120px]">{ml.name}</span>
                      </div>
                    </div>
                    <span className="text-lg font-black text-slate-900">{ml.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* List of All Contributors */}
            <div className="lg:col-span-2 bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase text-slate-900 tracking-widest flex items-center gap-3">
                  <Users size={20} className="text-primary" /> Contribution List
                </h3>
                <span className="text-[10px] font-black uppercase text-slate-400">Aggregated Volume</span>
              </div>
              <div className="max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                <table className="w-full text-sm text-left">
                  <thead className="text-[10px] font-black uppercase text-slate-400 border-b border-slate-50">
                    <tr>
                      <th className="py-4 px-2">Rank</th>
                      <th className="py-4">Reporter Name</th>
                      <th className="py-4 text-center">Volume</th>
                      <th className="py-4 text-right">Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {analytics.sortedReporters.map((rep, idx) => (
                      <tr key={rep.name} className="hover:bg-slate-50 transition-colors group">
                        <td className="py-4 px-2 font-black text-slate-300 group-hover:text-primary">0{idx + 1}</td>
                        <td className="py-4 font-black text-slate-800 uppercase">{rep.name}</td>
                        <td className="py-4 text-center"><span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 font-black text-xs">{rep.total}</span></td>
                        <td className="py-4 text-right">
                          <div className="flex justify-end gap-1">
                            {Object.keys(rep.modules).map(m => (
                              <div key={m} title={m} className="size-2 rounded-full bg-primary/20 group-hover:bg-primary transition-colors"></div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ReporterAnalytics;
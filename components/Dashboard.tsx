
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './ui/Layout';
import { useAuth } from '../AuthContext';
import { getHAIReports, getTBReports, getIsolationReports, getCultureReports, getNotifiableReports, getNeedlestickReports } from '../services/ipcService';
import { Search, X, User, LayoutDashboard, ArrowRight, Loader2 } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'page' | 'patient';
  category: string;
  title: string;
  subtitle?: string;
  path: string;
  icon: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const registries = [
    {
      title: "HAI Registry",
      desc: "Surveillance & Trend Analytics",
      path: "/surveillance?module=hai",
      reportPath: "/report-hai",
      reportLabel: "Report HAI Case",
      icon: "analytics",
      colorClass: "bg-blue-100 text-blue-700",
      reportIcon: "edit_note"
    },
    {
      title: "Notifiable Diseases",
      desc: "Mandatory Government Registry",
      path: "/surveillance?module=notifiable",
      reportPath: "/report-disease",
      reportLabel: "Report New Case",
      icon: "coronavirus",
      colorClass: "bg-red-100 text-red-700",
      reportIcon: "campaign"
    },
    {
      title: "TB Registry",
      desc: "TB Monitoring & Treatment Log",
      path: "/surveillance?module=tb",
      reportPath: "/report-ptb",
      reportLabel: "Register TB Case",
      icon: "pulmonology",
      colorClass: "bg-orange-100 text-orange-700",
      reportIcon: "person_add"
    },
    {
      title: "Isolation Room",
      desc: "Current Admission Tracking",
      path: "/surveillance?module=isolation",
      reportPath: "/report-isolation",
      reportLabel: "Register Admission",
      icon: "bedroom_child",
      colorClass: "bg-purple-100 text-purple-700",
      reportIcon: "meeting_room"
    },
    {
      title: "Needlestick injuries",
      desc: "Occupational Exposure Log",
      path: "/surveillance?module=needlestick",
      reportPath: "/report-needlestick",
      reportLabel: "Report Sharp Injury",
      icon: "vaccines",
      colorClass: "bg-amber-100 text-amber-700",
      reportIcon: "add_alert"
    },
    {
      title: "Antibiogram",
      desc: "Lab Results & Culture Studies",
      path: "/surveillance?module=culture",
      reportPath: "/report-culture",
      reportLabel: "Add Lab Result",
      icon: "science",
      colorClass: "bg-teal-100 text-teal-700",
      reportIcon: "biotech"
    }
  ];

  const otherForms = [
    { title: "Clinical SOPs", desc: "Official IPC Policies & Procedures", path: "/policies", icon: "policy", color: "bg-slate-100 text-slate-700" },
    { title: "Care Pathways", desc: "Standardized Evidence-Based Care", path: "/pathways", icon: "alt_route", color: "bg-slate-100 text-slate-700" }
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchQuery('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      const query = searchQuery.toLowerCase();
      const results: SearchResult[] = [];

      registries.forEach(item => {
        if (item.title.toLowerCase().includes(query)) {
          results.push({
            id: item.path,
            type: 'page',
            category: 'Modules & Forms',
            title: item.title,
            subtitle: item.desc,
            path: item.path,
            icon: item.icon
          });
        }
      });

      otherForms.forEach(item => {
          if (item.title.toLowerCase().includes(query)) {
              results.push({
                  id: item.path,
                  type: 'page',
                  category: 'Clinical Resources',
                  title: item.title,
                  subtitle: item.desc,
                  path: item.path,
                  icon: item.icon
              });
          }
      });

      if (isAuthenticated) {
        try {
          const [hai, tb, isolation, culture, notifiable, needle] = await Promise.all([
            getHAIReports(), getTBReports(), getIsolationReports(), getCultureReports(), getNotifiableReports(), getNeedlestickReports()
          ]);
          const allPatients = [
            ...hai.map(p => ({ ...p, source: 'HAI Registry', link: '/surveillance?module=hai' })),
            ...notifiable.map(p => ({ ...p, source: 'Notifiable Registry', link: '/surveillance?module=notifiable' })),
            ...needle.map(p => ({ ...p, source: 'Needlestick Log', link: '/surveillance?module=needlestick' })),
            ...tb.map(p => ({ ...p, source: 'TB Registry', link: '/surveillance?module=tb' })),
            ...isolation.map(p => ({ ...p, source: 'Isolation', link: '/surveillance?module=isolation' })),
            ...culture.map(p => ({ ...p, source: 'Antibiogram', link: '/surveillance?module=culture' }))
          ];
          allPatients.forEach(p => {
            const name = `${p.lastName || p.hcwName} ${p.firstName || ''}`.toLowerCase();
            const hosp = (p.hospitalNumber || p.employeeId || '').toLowerCase();
            if (name.includes(query) || hosp.includes(query)) {
              results.push({
                id: p.id,
                type: 'patient',
                category: 'Clinical Records',
                title: p.hcwName || `${p.lastName}, ${p.firstName}`,
                subtitle: `ID: ${p.hospitalNumber || p.employeeId} | Found in: ${p.source}`,
                path: p.link,
                icon: 'person'
              });
            }
          });
        } catch (err) { console.error("Search failed", err); }
      }
      setSearchResults(results);
      setIsSearching(false);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, isAuthenticated]);

  return (
    <Layout>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div className="flex flex-col gap-2 max-w-2xl">
          <h1 className="text-[#0c1d13] text-3xl md:text-5xl font-black leading-tight tracking-[-0.033em]">
            IPC Hub
          </h1>
          <p className="text-slate-600 text-base md:text-xl font-normal leading-normal">
            Secure incident reporting and real-time clinical surveillance.
          </p>
        </div>
        
        <div className="w-full md:w-auto md:min-w-[500px] relative" ref={searchRef}>
          <div className="relative group">
            <div className="absolute left-5 top-1/2 -translate-y-1/2 text-primary z-10">
              {isSearching ? <Loader2 size={24} className="animate-spin" /> : <Search size={24} />}
            </div>
            <input 
              className="w-full h-16 pl-14 pr-14 rounded-2xl bg-white border border-slate-200 shadow-sm focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-slate-900 placeholder:text-slate-400 text-lg font-medium outline-none" 
              placeholder={isAuthenticated ? "Search patients, staff or modules..." : "Search modules or clinical SOPs..."} 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-5 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            )}
          </div>
          {searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-slate-200 z-[100] max-h-[500px] overflow-y-auto animate-in fade-in slide-in-from-top-2">
              {searchResults.length > 0 ? (
                <div className="p-3">
                  {Array.from(new Set(searchResults.map(r => r.category))).map(category => (
                    <div key={category} className="mb-2">
                      <div className="px-5 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400">{category}</div>
                      {searchResults.filter(r => r.category === category).map((result) => (
                        <button
                          key={result.id + result.type}
                          onClick={() => { navigate(result.path); setSearchQuery(''); }}
                          className="w-full flex items-center gap-5 px-5 py-4 hover:bg-slate-50 rounded-xl transition-colors group text-left"
                        >
                          <div className={`p-3 rounded-lg ${result.type === 'page' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'} group-hover:scale-110 transition-transform`}>
                            {result.type === 'page' ? <LayoutDashboard size={24} /> : <User size={24} />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900 text-lg truncate">{result.title}</div>
                            <div className="text-sm text-slate-500 truncate">{result.subtitle}</div>
                          </div>
                          <ArrowRight size={20} className="text-slate-300 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : !isSearching && (
                <div className="p-16 text-center text-slate-400 font-bold flex flex-col gap-2">
                    <span>No results found.</span>
                    {!isAuthenticated && <span className="text-xs font-medium text-slate-300">Searching records requires Coordinator login.</span>}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mb-14">
        <div className="flex items-center gap-4 mb-8">
          <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined symbol-filled text-[28px]">dashboard</span>
          </div>
          <h3 className="text-[#0c1d13] text-2xl font-black leading-tight tracking-[-0.015em]">Surveillance Hub</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {registries.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-3 group">
              <div 
                onClick={() => navigate(item.path)}
                className="flex-1 flex flex-col gap-5 rounded-3xl border-2 border-slate-200 bg-white pt-10 pb-8 px-8 text-left shadow-sm hover:border-primary hover:shadow-2xl transition-all cursor-pointer min-h-[180px] relative overflow-hidden"
              >
                <div className={`size-14 rounded-2xl ${item.colorClass} flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <span className="material-symbols-outlined text-[32px]">{item.icon}</span>
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight mb-2">{item.title}</h2>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
              <button 
                onClick={() => navigate(item.reportPath)}
                className="w-full rounded-2xl border-2 border-slate-200 bg-white py-4 px-6 text-left shadow-sm hover:bg-primary hover:border-primary hover:text-white group-hover:shadow-lg transition-all flex items-center gap-4"
              >
                <div className={`size-8 rounded-xl ${item.colorClass} flex items-center justify-center group-hover:bg-white/20 group-hover:text-white transition-colors`}>
                  <span className="material-symbols-outlined text-[20px]">{item.reportIcon}</span>
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest">{item.reportLabel}</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-slate-500 text-[12px] font-black uppercase tracking-[0.2em] mb-6 ml-1">Official Clinical Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {otherForms.map((item) => (
            <button 
              key={item.path}
              onClick={() => navigate(item.path)}
              className="group relative flex items-center gap-6 overflow-hidden rounded-3xl bg-white border-2 border-slate-200 py-6 px-8 shadow-sm hover:shadow-2xl transition-all min-h-[120px]"
            >
              <div className={`flex items-center justify-center rounded-2xl ${item.color} size-14 group-hover:bg-primary group-hover:text-white transition-all duration-300`}>
                <span className="material-symbols-outlined text-2xl">{item.icon}</span>
              </div>
              <div className="text-left">
                <h2 className="text-lg font-black leading-tight text-slate-900 group-hover:text-primary">{item.title}</h2>
                <p className="mt-1 text-xs font-medium text-slate-500 leading-tight">{item.desc}</p>
              </div>
              <ArrowRight className="ml-auto text-slate-300 group-hover:text-primary group-hover:translate-x-2 transition-all" size={24} />
            </button>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;

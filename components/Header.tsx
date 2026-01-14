import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth, AppMode } from '../AuthContext';
import { LogOut, Key, Loader2, Bell, Zap, Activity, ShieldCheck, MonitorPlay } from 'lucide-react';
import Input from './ui/Input';
import Select from './ui/Select';
import { getPendingReports } from '../services/ipcService';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [, setSearchParams] = useSearchParams();
  const { user, login, logout, isAuthenticated, appMode, setAppMode } = useAuth();
  const [showLogin, setShowLogin] = useState(false);
  const [loginData, setLoginData] = useState({ name: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    if (isAuthenticated) {
        const fetchCount = async () => {
            const pending = await getPendingReports();
            const total = 
              pending.hai.length + 
              pending.isolation.length + 
              pending.tb.length + 
              pending.culture.length +
              pending.notifiable.length +
              pending.needlestick.length;
            setPendingCount(total);
        };
        fetchCount();
        const interval = setInterval(fetchCount, 30000);
        return () => clearInterval(interval);
    }
  }, [isAuthenticated, location.pathname]);

  const handleModeSwitch = (mode: AppMode) => {
    setAppMode(mode);
    setSearchParams({ module: 'overview' });
    if (location.pathname !== '/' && location.pathname !== '/surveillance') {
      navigate('/surveillance?module=overview');
    }
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setTimeout(() => {
        if (login(loginData.name, loginData.password)) {
            setShowLogin(false);
            setLoginData({ name: '', password: '' });
        } else {
            alert("Incorrect password for IPC Coordinator.");
        }
        setLoading(false);
    }, 800);
  };

  const handleQuickLogin = () => {
    setLoginData({ name: 'Max', password: 'max123' });
    setLoading(true);
    setTimeout(() => {
        login('Max', 'max123');
        setShowLogin(false);
        setLoginData({ name: '', password: '' });
        setLoading(false);
    }, 500);
  };

  const avatarUrl = user === "Max" 
    ? "https://lh3.googleusercontent.com/a/ACg8ocIXIid-X874rMvjM-D_z_N8Yf6-S_C9O-f_f_f_=s96-c" 
    : "https://lh3.googleusercontent.com/aida-public/AB6AXuAtvnzJ9qucqZ8LJkPayd-EUbbMhmEdktPPXtX10e5TmpalA2Sycob5A8WRvTOppjDoM4UfI_Li9mRCWVUIFek1HPwbVORMKg6B-99STYmD4UmJmKoBXjUIMzika86E4ZTjPGXbGg9xH1GUs6FMFAecxETsbr3ApF2xL61FbI7fgyqTI2LinKTxmG2YKM2AE1N7-VtdTyCp8Ch1_NtXcUDtNDeYzjdENVfuUyl_k136ZwWlYs9MnPomDFKAJXbX0k2WktnmBEL7UJ";

  return (
    <>
      <header className="sticky top-0 z-[100] flex items-center justify-between gap-4 bg-[var(--osmak-green)] text-white px-4 py-3 shadow-[0_2px_6px_rgba(0,0,0,0.15)] whitespace-nowrap">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate('/')}>
          <img 
            src="https://maxterrenal-hash.github.io/justculture/osmak-logo.png" 
            alt="OsMak Logo" 
            className="h-12 w-auto"
          />
          <div className="flex flex-col hidden lg:flex">
            <h1 className="m-0 text-[1.05rem] tracking-[0.04em] uppercase font-bold text-white leading-none">OSPITAL NG MAKATI</h1>
            <span className="text-[0.8rem] opacity-90 text-white font-medium mt-0.5">IPC Unified Platform</span>
          </div>
        </div>

        {/* CENTER PILL SWITCHER */}
        {isAuthenticated && (
          <div className="absolute left-1/2 -translate-x-1/2 flex items-center bg-black/10 rounded-full p-1 border border-white/5 shadow-inner backdrop-blur-md">
            <button 
              onClick={() => handleModeSwitch('report')}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${appMode === 'report' ? 'bg-white text-[var(--osmak-green)] shadow-lg scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <Activity size={14} />
              <span className="hidden sm:inline">Surveillance</span>
            </button>
            <button 
              onClick={() => handleModeSwitch('audit')}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${appMode === 'audit' ? 'bg-white text-[var(--osmak-green)] shadow-lg scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <ShieldCheck size={14} />
              <span className="hidden sm:inline">Auditing</span>
            </button>
            <button 
              onClick={() => handleModeSwitch('present')}
              className={`flex items-center gap-2 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${appMode === 'present' ? 'bg-white text-[var(--osmak-green)] shadow-lg scale-105' : 'text-white/60 hover:text-white hover:bg-white/5'}`}
            >
              <MonitorPlay size={14} />
              <span className="hidden sm:inline">Presenting</span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 sm:gap-4">
          {isAuthenticated && (
            <div className="flex gap-2">
              <button 
                onClick={() => navigate('/pending')}
                className="relative flex size-10 cursor-pointer items-center justify-center overflow-hidden rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"
                title="Pending Validations"
              >
                <Bell size={20} />
                {pendingCount > 0 && (
                  <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center border border-primary">
                    {pendingCount}
                  </span>
                )}
              </button>
            </div>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col text-right hidden sm:block">
                <span className="text-sm font-bold text-white leading-none">{user}</span>
              </div>
              <button 
                onClick={logout}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg text-white transition-colors"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
              <div 
                className="bg-center bg-no-repeat bg-cover rounded-full size-10 border-2 border-white/30 shadow-sm hidden sm:block" 
                style={{ backgroundImage: `url("${avatarUrl}")` }}
              ></div>
            </div>
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className="flex items-center gap-2 bg-white text-[var(--osmak-green)] px-4 py-2 rounded-lg text-sm font-bold transition-all shadow hover:bg-slate-50"
            >
              <Key size={14} />
              <span className="hidden sm:inline">Coordinator Login</span>
            </button>
          )}
        </div>
      </header>

      {showLogin && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
                <div className="bg-[var(--osmak-green)] p-6 text-white text-center relative">
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Key size={32} />
                    </div>
                    <h3 className="text-xl font-black">Coordinator Access</h3>
                    <p className="text-xs opacity-80 uppercase tracking-widest font-bold mt-1">IPC Quality Assurance</p>
                    
                    <button 
                      type="button"
                      onClick={handleQuickLogin}
                      className="absolute top-4 right-4 bg-yellow-400 text-yellow-900 p-2 rounded-full shadow-lg hover:scale-110 transition-transform flex items-center gap-1 text-[10px] font-black"
                      title="Quick Login (Demo)"
                    >
                      <Zap size={14} fill="currentColor" />
                    </button>
                </div>
                
                <form onSubmit={handleLogin} className="p-8 flex flex-col gap-5">
                    <Select 
                        label="Select Coordinator"
                        options={['Max', 'Miko', 'Micha', 'Michael', 'Bel']}
                        value={loginData.name}
                        onChange={(e) => setLoginData({...loginData, name: e.target.value})}
                        required
                    />
                    <Input 
                        label="Password" 
                        type="password"
                        placeholder="••••••••"
                        value={loginData.password}
                        onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                        required
                    />
                    
                    <div className="flex gap-3 mt-2">
                        <button 
                            type="button" 
                            onClick={() => setShowLogin(false)}
                            className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading || !loginData.name}
                            className="flex-1 py-3 bg-[var(--osmak-green)] text-white font-bold rounded-xl shadow-lg hover:bg-[var(--osmak-green-dark)] transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 size={18} className="animate-spin" /> : "Login"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </>
  );
};

export default Header;
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
    Calendar as CalendarIcon, 
    ChevronLeft, 
    ChevronRight, 
    Plus, 
    Trash2, 
    Clock, 
    MapPin, 
    ShieldCheck, 
    Zap,
    X,
    Layers,
    Info,
    Search,
    Hand,
    SearchCode,
    Pill,
    MoreHorizontal,
    Download,
    Loader2
} from 'lucide-react';
import { toPng } from 'html-to-image';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { useAuth } from '../../AuthContext';
import { AREAS } from '../../constants';
import { getAuditSchedules, submitAuditSchedule, deleteAuditSchedule } from '../../services/ipcService';

const AUDIT_TYPES = ["Hand Hygiene", "HAI Bundles", "Area Audit", "AMS Audit", "Others (specify)"];

const getAuditTypeDetails = (type: string) => {
    const lowerType = type.toLowerCase();
    if (lowerType.includes('hand hygiene')) return { icon: Hand, color: 'text-emerald-500', bgColor: 'bg-emerald-500' };
    if (lowerType.includes('hai bundle')) return { icon: Layers, color: 'text-blue-500', bgColor: 'bg-blue-500' };
    if (lowerType.includes('area audit')) return { icon: SearchCode, color: 'text-amber-500', bgColor: 'bg-amber-500' };
    if (lowerType.includes('ams audit')) return { icon: Pill, color: 'text-purple-500', bgColor: 'bg-purple-500' };
    return { icon: MoreHorizontal, color: 'text-slate-400', bgColor: 'bg-slate-400' };
};

const AuditSchedule: React.FC = () => {
    const { user, validatePassword } = useAuth();
    const calendarRef = useRef<HTMLDivElement>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [schedules, setSchedules] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    
    const [formData, setFormData] = useState({
        type: '',
        typeOther: '',
        area: '',
        areaOther: ''
    });

    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null); // To store the schedule item to delete
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);

    useEffect(() => {
        loadSchedules();
    }, []);

    const loadSchedules = async () => {
        setLoading(true);
        const data = await getAuditSchedules();
        setSchedules(data);
        setLoading(false);
    };

    const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

    const calendarDays = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const totalDays = daysInMonth(year, month);
        const startDay = firstDayOfMonth(year, month);
        const days = [];
        
        for (let i = 0; i < startDay; i++) {
            days.push(null);
        }
        
        for (let d = 1; d <= totalDays; d++) {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            const daySchedules = schedules.filter(s => s.date === dateStr);
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            days.push({ date: dateStr, day: d, schedules: daySchedules, isToday });
        }
        return days;
    }, [currentMonth, schedules]);

    const changeMonth = (offset: number) => {
        const newMonth = new Date(currentMonth);
        newMonth.setMonth(newMonth.getMonth() + offset);
        setCurrentMonth(newMonth);
    };

    const handleAddSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        const type = formData.type === 'Others (specify)' ? formData.typeOther : formData.type;
        const area = formData.area === 'Other (specify)' ? formData.areaOther : formData.area;
        
        if (!type || !area) {
            alert("Please fill in all fields.");
            return;
        }

        await submitAuditSchedule({
            date: selectedDate,
            type,
            area
        });

        setFormData({ type: '', typeOther: '', area: '', areaOther: '' });
        setShowAddModal(false);
        loadSchedules();
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
            await deleteAuditSchedule(itemToDelete.id);
            setShowPasswordConfirm(false);
            setItemToDelete(null);
            loadSchedules();
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to delete schedule.";
            console.error("Delete Operation Error in AuditSchedule:", error);
            alert(msg);
        } finally {
            setPasswordConfirmLoading(false);
        }
    };

    const downloadCalendar = async () => {
        if (!calendarRef.current) return;
        setDownloading(true);
        try {
            const dataUrl = await toPng(calendarRef.current, { 
                backgroundColor: '#ffffff', 
                cacheBust: true,
                style: {
                    borderRadius: '0' 
                }
            });
            
            const link = document.createElement('a');
            link.download = `IPC-Audit-Schedule-${currentMonth.getFullYear()}-${currentMonth.getMonth() + 1}.png`;
            link.href = dataUrl;
            link.click();
        } catch (err) {
            console.error('Download failed', err);
            if (err instanceof Error && err.message.includes('cssRules')) {
                alert('Security restriction: Cannot capture external styles. Please try again or check browser settings.');
            } else {
                alert('Failed to generate PNG. Try again.');
            }
        } finally {
            setDownloading(false);
        }
    };

    const selectedDaySchedules = schedules.filter(s => s.date === selectedDate);

    return (
        <div className="max-w-6xl mx-auto flex flex-col gap-8 pb-20 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Left Column: Calendar UI */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    <div ref={calendarRef} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                                    <CalendarIcon size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 uppercase leading-tight">Audit Calendar</h2>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Facility Surveillance Planning</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-slate-50 p-1.5 rounded-2xl print:hidden">
                                <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-emerald-600"><ChevronLeft size={18}/></button>
                                <span className="text-xs font-black uppercase text-slate-900 min-w-[120px] text-center">
                                    {currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </span>
                                <button onClick={() => changeMonth(1)} className="p-2 hover:bg-white hover:shadow-md rounded-xl transition-all text-slate-400 hover:text-emerald-600"><ChevronRight size={18}/></button>
                            </div>
                            <button 
                                onClick={downloadCalendar}
                                disabled={downloading}
                                className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                                title="Download as PNG"
                            >
                                {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                Download
                            </button>
                        </div>

                        <div className="grid grid-cols-7 gap-3">
                            {['SUN','MON','TUE','WED','THU','FRI','SAT'].map((d, i) => (
                                <div key={i} className="text-[10px] font-black text-slate-300 text-center py-2 tracking-widest">{d}</div>
                            ))}
                            
                            {calendarDays.map((day, i) => {
                                if (!day) return <div key={i} className="aspect-square" />;
                                const isSelected = selectedDate === day.date;
                                
                                return (
                                    <button
                                        key={i}
                                        onClick={() => setSelectedDate(day.date)}
                                        className={`
                                            relative aspect-square rounded-[1.5rem] border-2 transition-all p-1 flex items-center justify-center overflow-hidden
                                            ${isSelected 
                                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xl shadow-emerald-600/20 scale-105 z-10' 
                                                : day.isToday 
                                                    ? 'bg-emerald-50 border-emerald-200 text-emerald-600' 
                                                    : 'bg-white border-transparent hover:border-slate-200 text-slate-600'}
                                        `}
                                    >
                                        <div className="flex items-center gap-1.5 flex-wrap justify-center px-1">
                                            <span className="text-sm font-black">{day.day}</span>
                                            {day.schedules.length > 0 && (
                                                <div className="flex gap-0.5 flex-wrap justify-start items-center">
                                                    {day.schedules.slice(0, 3).map((s, idx) => {
                                                        const details = getAuditTypeDetails(s.type);
                                                        const Icon = details.icon;
                                                        return (
                                                            <div key={idx} className={`${isSelected ? 'text-white' : details.color}`}>
                                                                <Icon size={12} strokeWidth={3} />
                                                            </div>
                                                        );
                                                    })}
                                                    {day.schedules.length > 3 && (
                                                        <span className={`text-[8px] font-black ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                                                            +{day.schedules.length - 3}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Legend */}
                        <div className="mt-10 pt-6 border-t border-slate-50 flex flex-wrap gap-x-6 gap-y-3">
                            {AUDIT_TYPES.slice(0, 4).map(type => {
                                const details = getAuditTypeDetails(type);
                                const Icon = details.icon;
                                return (
                                    <div key={type} className="flex items-center gap-2">
                                        <div className={`p-1.5 rounded-lg ${details.bgColor} bg-opacity-10 ${details.color}`}>
                                            <Icon size={14} />
                                        </div>
                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-tight">{type}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Column: Daily Details & Actions */}
                <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
                    <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl animate-in slide-in-from-right-4 duration-500">
                        <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
                            <div className="p-2 bg-white/10 rounded-xl text-emerald-400">
                                <Clock size={20} />
                            </div>
                            <div>
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Schedule for</span>
                                <h3 className="text-lg font-black tracking-tight leading-none mt-1">
                                    {new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                                </h3>
                            </div>
                        </div>

                        <div className="flex flex-col gap-4">
                            {selectedDaySchedules.length === 0 ? (
                                <div className="py-10 flex flex-col items-center justify-center text-center gap-4 opacity-40">
                                    <Info size={40} />
                                    <p className="text-xs font-bold uppercase tracking-widest">No audits scheduled</p>
                                </div>
                            ) : (
                                selectedDaySchedules.map(item => {
                                    const details = getAuditTypeDetails(item.type);
                                    const Icon = details.icon;
                                    return (
                                        <div key={item.id} className="bg-white/5 border border-white/10 p-4 rounded-2xl group relative hover:bg-white/10 transition-all">
                                            <div className="flex items-start gap-3">
                                                <div className={`mt-1 p-2 rounded-lg ${details.bgColor} bg-opacity-20 ${details.color}`}>
                                                    <Icon size={16} />
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[9px] font-black uppercase text-emerald-400 tracking-[0.2em]">{item.type}</span>
                                                    <div className="flex items-center gap-2">
                                                        <MapPin size={12} className="text-slate-500" />
                                                        <span className="font-bold text-sm text-slate-100">{item.area}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => promptDeleteConfirmation(item)}
                                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    );
                                })
                            )}
                            
                            <button 
                                onClick={() => setShowAddModal(true)}
                                className="mt-4 w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-900/50 hover:bg-emerald-500 transition-all flex items-center justify-center gap-2 active:scale-95"
                            >
                                <Plus size={18} /> Add Audit Sched
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add Schedule Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95">
                        <div className="bg-emerald-600 p-8 text-white relative">
                            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/20 rounded-2xl">
                                    <Plus size={32} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">New Audit</h3>
                                    <p className="text-xs opacity-80 font-bold uppercase tracking-widest">Scheduling for {selectedDate}</p>
                                </div>
                            </div>
                        </div>
                        
                        <form onSubmit={handleAddSchedule} className="p-10 flex flex-col gap-6">
                            <div className="flex flex-col gap-2">
                                <Select 
                                    label="Audit Type" 
                                    options={AUDIT_TYPES} 
                                    value={formData.type} 
                                    onChange={e => setFormData({...formData, type: e.target.value})} 
                                    required 
                                />
                                {formData.type === 'Others (specify)' && (
                                    <Input 
                                        label="Specify Audit" 
                                        value={formData.typeOther} 
                                        onChange={e => setFormData({...formData, typeOther: e.target.value})} 
                                        placeholder="e.g. Linen Mgmt Audit"
                                        required
                                    />
                                )}
                            </div>

                            <div className="flex flex-col gap-2">
                                <Select 
                                    label="Target Area / Ward" 
                                    options={AREAS} 
                                    value={formData.area} 
                                    onChange={e => setFormData({...formData, area: e.target.value})} 
                                    required 
                                />
                                {formData.area === 'Other (specify)' && (
                                    <Input 
                                        label="Specify Area" 
                                        value={formData.areaOther} 
                                        onChange={e => setFormData({...formData, areaOther: e.target.value})} 
                                        placeholder="e.g. Main Lobby"
                                        required
                                    />
                                )}
                            </div>

                            <div className="flex gap-4 mt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setShowAddModal(false)} 
                                    className="flex-1 py-4 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    className="flex-1 py-4 bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-700 transition-all active:scale-95"
                                >
                                    Confirm Sched
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            <PasswordConfirmModal
                show={showPasswordConfirm}
                onClose={() => setShowPasswordConfirm(false)}
                onConfirm={handlePasswordConfirmed}
                loading={passwordConfirmLoading}
                title="Confirm Schedule Deletion"
                description={`Enter your password to remove the '${itemToDelete?.type || ''}' audit for ${itemToDelete?.area || ''} on ${itemToDelete?.date || ''} from the schedule.`}
            />
        </div>
    );
};

export default AuditSchedule;
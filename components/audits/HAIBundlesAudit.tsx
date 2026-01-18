import React, { useState, useEffect, useMemo } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { AREAS } from '../../constants';
import { submitBundleAudit, submitActionPlan, getBundleAudits } from '../../services/ipcService';
import { 
    CheckCircle2, 
    XCircle, 
    ClipboardCheck, 
    Save, 
    Clock, 
    User, 
    Stethoscope, 
    Wind, 
    Droplets, 
    Syringe,
    AlertCircle,
    Info,
    Zap,
    LayoutList,
    TrendingUp,
    ShieldCheck,
    BarChart3,
    Filter,
    RotateCcw,
    Loader2,
    Sparkles
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell, CartesianGrid } from 'recharts';

const BUNDLE_TYPES = ["CAUTI", "VAP", "CLABSI"];

interface Props {
  viewMode?: 'log' | 'analysis';
}

const HAIBundlesAudit: React.FC<Props> = ({ viewMode: initialViewMode }) => {
    const [view, setView] = useState<'log' | 'analysis'>(initialViewMode || 'log');
    const [loading, setLoading] = useState(false);
    const [bundleHistory, setBundleHistory] = useState<any[]>([]);
    const [bundleType, setBundleType] = useState<string>('');
    const [showActionPlanModal, setShowActionPlanModal] = useState(false);
    
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

    const [formData, setFormData] = useState<any>({
        date: new Date().toISOString().split('T')[0],
        area: '',
        areaOther: '',
        patientName: '',
        nurseInCharge: '',
        cauti_drainageIntact: '',
        cauti_catheterSecured: '',
        cauti_urineBagPosition: '',
        cauti_meatalCare: '',
        vap_headElevated: '',
        vap_oralCare: '',
        vap_pepticProphylaxis: '',
        vap_dvtProphylaxis: '',
        clabsi_handHygiene: '',
        clabsi_scrubConnector: '',
        clabsi_dressingClean: ''
    });

    const handleMagicFill = () => {
        if (!bundleType) {
            alert("Select a Bundle Type first to use Magic Fill.");
            return;
        }
        const sampleBase = {
            date: new Date().toISOString().split('T')[0],
            area: 'ICU',
            patientName: 'Patient Sample-001',
            nurseInCharge: 'N. Reyes'
        };

        if (bundleType === 'VAP') {
            setFormData({ ...formData, ...sampleBase, vap_headElevated: 'Yes', vap_oralCare: 'Yes', vap_pepticProphylaxis: 'Yes', vap_dvtProphylaxis: 'Yes' });
        } else if (bundleType === 'CAUTI') {
            setFormData({ ...formData, ...sampleBase, cauti_drainageIntact: 'Yes', cauti_catheterSecured: 'Yes', cauti_urineBagPosition: 'Below bladder level', cauti_meatalCare: 'Daily with soap & water' });
        } else if (bundleType === 'CLABSI') {
            setFormData({ ...formData, ...sampleBase, clabsi_handHygiene: 'Yes', clabsi_scrubConnector: 'Yes', clabsi_dressingClean: 'Yes' });
        }
    };

    const [apForm, setApForm] = useState({ 
        action: '', 
        targetDate: '', 
        personResponsible: '', 
        category: 'Clinical Bundles',
        area: '',
        areaOther: ''
    });

    useEffect(() => {
        if (view === 'analysis') loadHistory();
    }, [view]);

    const loadHistory = async () => {
        setLoading(true);
        const data = await getBundleAudits();
        setBundleHistory(data);
        setLoading(false);
    };

    const handleInputChange = (name: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!bundleType || !formData.area || !formData.patientName) {
            alert("Please fill in required fields.");
            return;
        }
        setLoading(true);
        await submitBundleAudit({ ...formData, bundleType });
        alert(`${bundleType} Bundle Audit Logged Successfully.`);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            area: '', areaOther: '', patientName: '', nurseInCharge: '',
            cauti_drainageIntact: '', cauti_catheterSecured: '', cauti_urineBagPosition: '', cauti_meatalCare: '',
            vap_headElevated: '', vap_oralCare: '', vap_pepticProphylaxis: '', vap_dvtProphylaxis: '',
            clabsi_handHygiene: '', clabsi_scrubConnector: '', clabsi_dressingClean: ''
        });
        setBundleType('');
        setLoading(false);
        if (view === 'analysis') loadHistory();
    };

    const handleSaveActionPlan = async () => {
        await submitActionPlan({ ...apForm, category: bundleType ? `${bundleType} Bundle` : 'Clinical Bundles' });
        setShowActionPlanModal(false);
        setApForm({ action: '', targetDate: '', personResponsible: '', category: 'Clinical Bundles', area: '', areaOther: '' });
        alert("Action Plan Added.");
    };

    const stats = useMemo(() => {
        if (bundleHistory.length === 0) return null;

        const resultsByArea: Record<string, { vap: number, cauti: number, clabsi: number, countVap: number, countCauti: number, countClabsi: number }> = {};
        let totalC = 0;
        let totalN = 0;

        bundleHistory.forEach(audit => {
            const area = audit.area || 'Other';
            if (!resultsByArea[area]) resultsByArea[area] = { vap: 0, cauti: 0, clabsi: 0, countVap: 0, countCauti: 0, countClabsi: 0 };
            
            const type = audit.bundleType;
            let compliant = true;

            if (type === 'VAP') {
                const isC = audit.vap_headElevated === 'Yes' && audit.vap_oralCare === 'Yes' && audit.vap_pepticProphylaxis === 'Yes' && audit.vap_dvtProphylaxis === 'Yes';
                if (isC) resultsByArea[area].vap++;
                resultsByArea[area].countVap++;
                compliant = isC;
            } else if (type === 'CAUTI') {
                const isC = audit.cauti_drainageIntact === 'Yes' && audit.cauti_catheterSecured === 'Yes' && audit.cauti_urineBagPosition === 'Below bladder level' && audit.cauti_meatalCare === 'Daily with soap & water';
                if (isC) resultsByArea[area].cauti++;
                resultsByArea[area].countCauti++;
                compliant = isC;
            } else if (type === 'CLABSI') {
                const isC = audit.clabsi_handHygiene === 'Yes' && audit.clabsi_scrubConnector === 'Yes' && audit.clabsi_dressingClean === 'Yes';
                if (isC) resultsByArea[area].clabsi++;
                resultsByArea[area].countClabsi++;
                compliant = isC;
            }

            if (compliant) totalC++; else totalN++;
        });

        const areaBundleData = Object.entries(resultsByArea).map(([name, data]) => ({
            name,
            vap: data.countVap > 0 ? Math.round((data.vap / data.countVap) * 100) : 0,
            cauti: data.countCauti > 0 ? Math.round((data.cauti / data.countCauti) * 100) : 0,
            clabsi: data.countClabsi > 0 ? Math.round((data.clabsi / data.countClabsi) * 100) : 0
        }));

        const analysisData = [
            { name: 'Compliant', value: totalC, color: '#3b82f6' },
            { name: 'Non-Compliant', value: totalN, color: '#ef4444' }
        ];

        return { areaBundleData, analysisData, overall: Math.round((totalC / (totalC + totalN)) * 100) };
    }, [bundleHistory]);

    return (
        <div className="flex flex-col gap-6 max-w-4xl mx-auto pb-20">
            <div className="flex bg-slate-200 p-1.5 rounded-2xl w-fit">
                <button onClick={() => setView('log')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'log' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><LayoutList size={16}/> Log</button>
                <button onClick={() => setView('analysis')} className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 ${view === 'analysis' ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-500 hover:text-slate-700'}`}><TrendingUp size={16}/> Analysis</button>
            </div>

            {view === 'log' ? (
                <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col gap-8 animate-in fade-in duration-500">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl"><ClipboardCheck size={24} /></div>
                            <div><h2 className="text-xl font-black text-slate-900 uppercase">HAI Bundle Compliance</h2><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Clinical Care Pathway Audit</p></div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button 
                                type="button"
                                onClick={handleMagicFill}
                                className="text-[10px] font-black uppercase text-amber-600 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 flex items-center gap-2 hover:bg-amber-100 transition-all"
                            >
                                <Sparkles size={14}/> Magic Fill
                            </button>
                            <button 
                                type="button"
                                onClick={() => setShowActionPlanModal(true)}
                                className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 px-4 py-2 rounded-xl border border-blue-100 flex items-center gap-2 hover:bg-blue-100 transition-all"
                            >
                                <Zap size={14}/> Add Action Plan
                            </button>
                            <div className="w-48">
                                <Select label="Select Bundle" options={BUNDLE_TYPES} value={bundleType} onChange={(e) => setBundleType(e.target.value)} required />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <Input label="Audit Date" type="date" value={formData.date} onChange={e => handleInputChange('date', e.target.value)} required />
                        <div className="flex flex-col gap-2">
                            <Select label="Clinical Ward" options={AREAS} value={formData.area} onChange={e => handleInputChange('area', e.target.value)} required />
                            {formData.area === 'Other (specify)' && <Input label="Specify Area" value={formData.areaOther} onChange={e => handleInputChange('areaOther', e.target.value)} />}
                        </div>
                        <Input label="Patient Name" value={formData.patientName} onChange={e => handleInputChange('patientName', e.target.value)} required placeholder="Last, First" />
                        <Input label="Nurse in Charge" value={formData.nurseInCharge} onChange={e => handleInputChange('nurseInCharge', e.target.value)} placeholder="Full Name" />
                    </div>

                    {bundleType === 'CAUTI' && (
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-2 mb-2"><Droplets className="text-blue-500"/><h3 className="text-sm font-black uppercase text-slate-900 tracking-widest">CAUTI Prevention Bundle</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                                    <label className="text-xs font-bold text-slate-700">Closed Drainage System Intact?</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => handleInputChange('cauti_drainageIntact', 'Yes')} className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-xs transition-all ${formData.cauti_drainageIntact === 'Yes' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>Yes</button>
                                        <button type="button" onClick={() => handleInputChange('cauti_drainageIntact', 'No')} className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-xs transition-all ${formData.cauti_drainageIntact === 'No' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>No</button>
                                    </div>
                                </div>
                                <div className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                                    <label className="text-xs font-bold text-slate-700">Catheter Secured (no traction)?</label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => handleInputChange('cauti_catheterSecured', 'Yes')} className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-xs transition-all ${formData.cauti_catheterSecured === 'Yes' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>Yes</button>
                                        <button type="button" onClick={() => handleInputChange('cauti_catheterSecured', 'No')} className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-xs transition-all ${formData.cauti_catheterSecured === 'No' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>No</button>
                                    </div>
                                </div>
                                <div className="md:col-span-2">
                                    <Select label="Urine Bag Position" options={['Below bladder level', 'Not touching floor', 'Improper positioning']} value={formData.cauti_urineBagPosition} onChange={e => handleInputChange('cauti_urineBagPosition', e.target.value)} required />
                                </div>
                                <div className="md:col-span-2">
                                    <Select label="Routine Meatal Care" options={['Daily with soap & water', 'No antiseptics used', 'Not documented / improper']} value={formData.cauti_meatalCare} onChange={e => handleInputChange('cauti_meatalCare', e.target.value)} required />
                                </div>
                            </div>
                        </div>
                    )}

                    {bundleType === 'VAP' && (
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-2 mb-2"><Wind className="text-blue-500"/><h3 className="text-sm font-black uppercase text-slate-900 tracking-widest">VAP Prevention Bundle</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'vap_headElevated', label: "Is the patient's head elevated 30-45deg?" },
                                    { id: 'vap_oralCare', label: "Did the patient receive oral care?" },
                                    { id: 'vap_pepticProphylaxis', label: "Did the patient have peptic ulcer disease prophylaxis?" },
                                    { id: 'vap_dvtProphylaxis', label: "Does patient have deep venous thrombosis prophylaxis?" }
                                ].map(q => (
                                    <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                                        <label className="text-xs font-bold text-slate-700 leading-tight">{q.label}</label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => handleInputChange(q.id, 'Yes')} className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-xs transition-all ${formData[q.id] === 'Yes' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>Yes</button>
                                            <button type="button" onClick={() => handleInputChange(q.id, 'No')} className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-xs transition-all ${formData[q.id] === 'No' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>No</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {bundleType === 'CLABSI' && (
                        <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-200 flex flex-col gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
                            <div className="flex items-center gap-2 mb-2"><Syringe className="text-blue-500"/><h3 className="text-sm font-black uppercase text-slate-900 tracking-widest">CLABSI Prevention Bundle</h3></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {[
                                    { id: 'clabsi_handHygiene', label: "Performs hand hygiene prior to handling the line?" },
                                    { id: 'clabsi_scrubConnector', label: "Scrubs connector vigorously with alcohol for 15 seconds?" },
                                    { id: 'clabsi_dressingClean', label: "Dressing is clean and not soaked?" }
                                ].map(q => (
                                    <div key={q.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex flex-col gap-3">
                                        <label className="text-xs font-bold text-slate-700 leading-tight">{q.label}</label>
                                        <div className="flex gap-2">
                                            <button type="button" onClick={() => handleInputChange(q.id, 'Yes')} className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-xs transition-all ${formData[q.id] === 'Yes' ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>Yes</button>
                                            <button type="button" onClick={() => handleInputChange(q.id, 'No')} className={`flex-1 py-3 rounded-xl border-2 font-black uppercase text-xs transition-all ${formData[q.id] === 'No' ? 'bg-rose-500 border-rose-500 text-white' : 'bg-slate-50 border-transparent text-slate-400 hover:bg-slate-100'}`}>No</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {!bundleType && (
                        <div className="bg-slate-50 p-20 rounded-[2.5rem] border border-dashed border-slate-200 text-center flex flex-col items-center gap-4">
                            <Info size={48} className="text-slate-200" />
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Select a bundle type to begin the audit checklist</p>
                        </div>
                    )}

                    <div className="border-t border-slate-100 pt-6 flex justify-end">
                        <button type="submit" disabled={loading || !bundleType} className="bg-slate-900 text-white px-12 py-4 rounded-2xl font-black uppercase text-sm tracking-widest shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3">
                            {loading ? <Clock size={20} className="animate-spin" /> : <Save size={20} />} Publish Bundle Audit
                        </button>
                    </div>
                </form>
            ) : (
                <div className="flex flex-col gap-10 animate-in fade-in duration-500">
                    {loading ? <Loader2 className="animate-spin mx-auto" size={48}/> : !stats ? (
                        <div className="p-20 text-center bg-white rounded-[3rem] border border-dashed border-slate-200 text-slate-400 font-bold">Awaiting first bundle audit entry</div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-blue-900 p-10 rounded-[3rem] text-white flex flex-col gap-6 overflow-hidden relative">
                                    <div className="z-10 flex flex-col gap-2">
                                        <h2 className="text-4xl font-black tracking-tight uppercase">Bundle Compliance</h2>
                                        <p className="text-blue-300 font-medium text-lg">Hospital-wide adherence to clinical care bundles</p>
                                    </div>
                                    <div className="absolute top-0 right-0 p-8 opacity-10 text-white"><ShieldCheck size={200} /></div>
                                </div>
                                <div className="bg-white p-8 rounded-[3rem] border-2 border-blue-500 flex flex-col items-center justify-center text-center gap-2 shadow-xl shadow-blue-500/10">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Overall Success</span>
                                    <span className="text-7xl font-black text-slate-900">{stats.overall}%</span>
                                    <span className="text-xs font-bold text-slate-400 uppercase">Average Adherence</span>
                                </div>
                            </div>

                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600"><BarChart3 size={24}/></div>
                                    <h3 className="text-xl font-black uppercase text-slate-900">Area Performance</h3>
                                </div>
                                <div className="h-80">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats.areaBundleData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                                            <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 'bold'}} />
                                            <YAxis domain={[0, 100]} />
                                            <RechartsTooltip contentStyle={{borderRadius: '16px'}} />
                                            <Legend wrapperStyle={{fontSize: 10, fontWeight: 'bold', paddingTop: 20}} />
                                            <Bar dataKey="vap" name="VAP" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="cauti" name="CAUTI" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                                            <Bar dataKey="clabsi" name="CLABSI" fill="#ec4899" radius={[4, 4, 0, 0]} />
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
                        <div className="bg-blue-600 p-6 text-white text-center">
                            <Zap size={40} className="mx-auto mb-2" fill="currentColor" />
                            <h3 className="text-xl font-black uppercase">Create Action Plan</h3>
                            <p className="text-xs opacity-80 font-bold">Correction for Bundle non-compliance</p>
                        </div>
                        <div className="p-8 flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Select label="Target Area / Ward" options={AREAS} value={apForm.area} onChange={e => setApForm({...apForm, area: e.target.value})} />
                                {apForm.area === 'Other (specify)' && <Input label="Specify Ward" value={apForm.areaOther} onChange={e => setApForm({...apForm, areaOther: e.target.value})} />}
                            </div>
                            <Input label="Correction Action" value={apForm.action} onChange={e => setApForm({...apForm, action: e.target.value})} placeholder="e.g. Schedule VAP oral care re-training" />
                            <Input label="Target Date" type="date" value={apForm.targetDate} onChange={e => setApForm({...apForm, targetDate: e.target.value})} />
                            <Input label="Person Responsible" value={apForm.personResponsible} onChange={e => setApForm({...apForm, personResponsible: e.target.value})} />
                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setShowActionPlanModal(false)} className="flex-1 py-3 text-slate-400 font-black uppercase text-xs hover:bg-slate-50 rounded-xl">Cancel</button>
                                <button type="button" onClick={handleSaveActionPlan} className="flex-1 py-3 bg-blue-600 text-white font-black uppercase text-xs rounded-xl shadow-lg hover:bg-blue-700 transition-all">Save Action</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HAIBundlesAudit;
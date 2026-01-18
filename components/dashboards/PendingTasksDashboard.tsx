import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../AuthContext';
import Layout from '../ui/Layout';
import Input from '../ui/Input';
import Select from '../ui/Select';
import PasswordConfirmModal from '../ui/PasswordConfirmModal';
import { getPendingReports, validateReport, deletePendingReport } from '../../services/ipcService';
import { 
    AREAS, 
    HAI_TYPES, 
    ISOLATION_AREAS, 
    SURGICAL_PROCEDURES, 
    SSI_TISSUE_LEVELS,
    CATHETER_TYPES,
    LUMEN_COUNTS,
    INSERTION_SITES,
    NOTIFIABLE_DISEASES,
    PTB_OUTCOMES,
    BARANGAYS,
    DEVICES_NEEDLE,
    DEVICES_SURGICAL
} from '../../constants';
import { 
    ChevronLeft, 
    CheckCircle, 
    Activity, 
    ShieldAlert, 
    Stethoscope, 
    FlaskConical, 
    Trash2, 
    Loader2,
    AlertCircle,
    X,
    Save,
    User,
    Microscope,
    MapPin,
    ArrowRight,
    Bell,
    ShieldCheck,
    FileText,
    Briefcase
} from 'lucide-react';

const PendingTasksDashboard: React.FC = () => {
    const navigate = useNavigate();
    const { user, isAuthenticated, validatePassword } = useAuth();
    const [pending, setPending] = useState<any>({ hai: [], isolation: [], tb: [], culture: [], notifiable: [], needlestick: [] });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'hai' | 'isolation' | 'tb' | 'culture' | 'notifiable' | 'needlestick'>('hai');
    const [validatingId, setValidatingId] = useState<string | null>(null);
    const [reviewModal, setReviewModal] = useState<{ show: boolean, item: any | null }>({ show: false, item: null });

    const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [passwordConfirmLoading, setPasswordConfirmLoading] = useState(false);


    useEffect(() => {
        if (!isAuthenticated) { navigate('/'); return; }
        loadPending();
    }, [isAuthenticated]);

    const loadPending = async () => {
        setLoading(true);
        const data = await getPendingReports();
        setPending(data);
        setLoading(false);
    };

    const handleValidate = async (type: any, id: string, updatedData?: any) => {
        if (!user) return;
        setValidatingId(id);
        try {
            const success = await validateReport(type, id, user, updatedData);
            if (success) {
                setReviewModal({ show: false, item: null });
                loadPending();
            }
        } catch (error) {
            alert(error instanceof Error ? error.message : "Error validating report.");
        } finally {
            setValidatingId(null);
        }
    };

    const promptDeleteConfirmation = (type: any, item: any) => {
        setItemToDelete({ type, ...item });
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
            await deletePendingReport(itemToDelete.type, itemToDelete.id);
            setReviewModal({ show: false, item: null }); // Close review modal if it was open
            setShowPasswordConfirm(false);
            setItemToDelete(null);
            loadPending();
        } catch (error) {
            const msg = error instanceof Error ? error.message : "Failed to delete pending report.";
            console.error("Delete Operation Error in PendingTasksDashboard:", error);
            alert(msg);
        } finally {
            setPasswordConfirmLoading(false);
        }
    };

    const handleModalInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setReviewModal(prev => ({ 
            ...prev, 
            item: { ...prev.item, [name]: value }
        }));
    };

    const handleAntibioticChange = (index: number, field: string, value: string) => {
        const newAb = [...(reviewModal.item.antibiotics || [])];
        newAb[index] = { ...newAb[index], [field]: value };
        setReviewModal(prev => ({ ...prev, item: { ...prev.item, antibiotics: newAb } }));
    };

    const tabs = [
        { id: 'hai', label: 'HAI', icon: <Activity size={16} />, count: pending.hai.length, color: 'text-teal-600' },
        { id: 'notifiable', label: 'Notifiable', icon: <Bell size={16} />, count: pending.notifiable.length, color: 'text-red-600' },
        { id: 'needlestick', label: 'Sharps', icon: <ShieldAlert size={16} />, count: pending.needlestick.length, color: 'text-amber-600' },
        { id: 'tb', label: 'TB', icon: <Stethoscope size={16} />, count: pending.tb.length, color: 'text-amber-700' },
        { id: 'isolation', label: 'Isolation', icon: <ShieldCheck size={16} />, count: pending.isolation.length, color: 'text-indigo-600' },
        { id: 'culture', label: 'Culture', icon: <FlaskConical size={16} />, count: pending.culture.length, color: 'text-rose-600' },
    ];

    const currentList = pending[activeTab] || [];

    return (
        <Layout title="Pending Validations">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-[var(--osmak-green)] transition-colors font-bold">
                        <ChevronLeft size={16} /> Hub Dashboard
                    </button>
                </div>

                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex overflow-x-auto gap-2">
                    {tabs.map(tab => (
                        <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-bold text-sm transition-all border-2 ${
                                activeTab === tab.id 
                                ? `bg-gray-50 border-gray-800 text-gray-900` 
                                : `bg-white border-transparent text-gray-400 hover:bg-gray-50`
                            }`}
                        >
                            {tab.icon}
                            {tab.label}
                            {tab.count > 0 && (
                                <span className={`ml-1 px-2 py-0.5 rounded-full text-[10px] bg-red-100 text-red-600 font-black`}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {loading ? (
                    <div className="bg-white p-20 rounded-2xl shadow-sm flex flex-col items-center justify-center gap-4">
                        <Loader2 size={48} className="animate-spin text-gray-300" />
                        <p className="font-bold text-gray-400">Loading pending items...</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-4">
                        {currentList.length === 0 ? (
                            <div className="bg-white p-16 rounded-2xl shadow-sm border border-dashed border-gray-300 flex flex-col items-center justify-center gap-4 text-center">
                                <CheckCircle size={32} className="text-green-500" />
                                <h3 className="font-bold text-gray-800 text-lg">Inbox Zero!</h3>
                                <p className="text-gray-500 text-sm">No pending {activeTab} reports require validation.</p>
                            </div>
                        ) : (
                            currentList.map((item: any) => (
                                <div 
                                    key={item.id} 
                                    onClick={() => setReviewModal({ show: true, item: { ...item } })}
                                    className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-400 transition-all cursor-pointer group"
                                >
                                    <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl bg-gray-50 group-hover:bg-white transition-colors ${tabs.find(t => t.id === activeTab)?.color}`}>
                                                {tabs.find(t => t.id === activeTab)?.icon}
                                            </div>
                                            <div>
                                                <h4 className="font-black text-gray-800 group-hover:text-[var(--osmak-green-dark)] transition-colors">
                                                    {activeTab === 'needlestick' ? item.hcwName : `${item.lastName}, ${item.firstName}`}
                                                </h4>
                                                <p className="text-xs text-gray-500 font-bold uppercase tracking-tighter">Hosp #: {item.hospitalNumber}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex-1 text-sm font-bold text-gray-700">
                                            {activeTab === 'hai' && item.haiType}
                                            {activeTab === 'notifiable' && item.disease}
                                            {activeTab === 'needlestick' && `${item.exposureType} (${item.deviceInvolved})`}
                                            {activeTab === 'isolation' && item.diagnosis}
                                            {activeTab === 'tb' && `${item.classification}`}
                                            {activeTab === 'culture' && item.organism}
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className="hidden md:flex flex-col items-end text-[10px] text-gray-400 font-black uppercase tracking-widest mr-2">
                                                <span>Reported On</span>
                                                <span className="text-gray-600">{item.dateReported}</span>
                                            </div>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); promptDeleteConfirmation(activeTab, item); }} 
                                                className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                title="Discard"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                            <div className="text-gray-300 group-hover:text-[var(--osmak-green)] group-hover:translate-x-1 transition-all">
                                                <ArrowRight size={20} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Detailed Review Modal */}
            {reviewModal.show && reviewModal.item && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[95vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95">
                        <div className="bg-gray-900 text-white p-6 sticky top-0 z-10 flex justify-between items-center">
                            <h2 className="font-black text-xl">Review & Edit Submission - {activeTab.toUpperCase()}</h2>
                            <button onClick={() => setReviewModal({ show: false, item: null })} className="p-2 hover:bg-white/20 rounded-full"><X size={24}/></button>
                        </div>
                        
                        <div className="p-8 flex flex-col gap-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* SECTION: Patient Basic Data */}
                                <section className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><User size={14}/> {activeTab === 'needlestick' ? 'Staff Information' : 'Patient Information'}</h3>
                                    <div className="flex flex-col gap-3">
                                        {activeTab === 'needlestick' ? (
                                            <Input label="HCW Name" name="hcwName" value={reviewModal.item.hcwName} onChange={handleModalInputChange} />
                                        ) : (
                                            <>
                                                <Input label="Last Name" name="lastName" value={reviewModal.item.lastName} onChange={handleModalInputChange} />
                                                <Input label="First Name" name="firstName" value={reviewModal.item.firstName} onChange={handleModalInputChange} />
                                            </>
                                        )}
                                        <Input label="Hospital Number" name="hospitalNumber" value={reviewModal.item.hospitalNumber} onChange={handleModalInputChange} />
                                        <div className="grid grid-cols-2 gap-2">
                                            <Input label="Age" name="age" value={reviewModal.item.age} onChange={handleModalInputChange} />
                                            <Select label="Sex" name="sex" options={['Male', 'Female']} value={reviewModal.item.sex} onChange={handleModalInputChange} />
                                        </div>
                                        {activeTab === 'tb' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Input label="DOB" name="dob" type="date" value={reviewModal.item.dob} onChange={handleModalInputChange} />
                                            </div>
                                        )}
                                        {activeTab === 'needlestick' && (
                                            <div className="grid grid-cols-2 gap-2">
                                                <Select label="Job Category" name="jobTitle" options={['Doctor', 'Nurse', 'Housekeeping', 'Intern', 'Student', 'Other']} value={reviewModal.item.jobTitle} onChange={handleModalInputChange} />
                                                <Input label="Department" name="department" value={reviewModal.item.department} onChange={handleModalInputChange} />
                                            </div>
                                        )}
                                    </div>
                                </section>

                                {/* SECTION: Clinical Context & Specific Fields */}
                                <section className="p-5 bg-white rounded-xl border border-gray-200 flex flex-col gap-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><AlertCircle size={14}/> Clinical Context</h3>
                                    <div className="flex flex-col gap-3">
                                        <Select label={activeTab === 'tb' ? 'Initial Admission Area' : 'Area / Ward'} name="area" options={AREAS} value={reviewModal.item.area} onChange={handleModalInputChange} />
                                        <Input label="Admission/Injury Date" name={activeTab === 'needlestick' ? 'dateOfInjury' : 'dateOfAdmission'} type="date" value={reviewModal.item[activeTab === 'needlestick' ? 'dateOfInjury' : 'dateOfAdmission']} onChange={handleModalInputChange} />
                                        
                                        {activeTab === 'notifiable' && (
                                            <>
                                                <Select label="Disease" name="disease" options={NOTIFIABLE_DISEASES} value={reviewModal.item.disease} onChange={handleModalInputChange} />
                                                {reviewModal.item.disease === 'Dengue' && (
                                                    <div className="bg-red-50 p-3 rounded-lg grid grid-cols-3 gap-2">
                                                        <Select label="NS1" name="dengueNS1" options={['Positive', 'Negative', 'Pending']} value={reviewModal.item.dengueNS1} onChange={handleModalInputChange} />
                                                        <Select label="IgG" name="dengueIgG" options={['Positive', 'Negative', 'Pending']} value={reviewModal.item.dengueIgG} onChange={handleModalInputChange} />
                                                        <Select label="IgM" name="dengueIgM" options={['Positive', 'Negative', 'Pending']} value={reviewModal.item.dengueIgM} onChange={handleModalInputChange} />
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {activeTab === 'needlestick' && (
                                            <>
                                                <Select label="Exposure Type" name="exposureType" options={['Percutaneous', 'Mucous membrane splash', 'Other']} value={reviewModal.item.exposureType} onChange={handleModalInputChange} />
                                                <Input label="Device Involved" name="deviceInvolved" value={reviewModal.item.deviceInvolved} onChange={handleModalInputChange} />
                                                <Input label="Activity" name="activity" value={reviewModal.item.activity} onChange={handleModalInputChange} />
                                                <div className="bg-amber-50 p-3 rounded-lg">
                                                    <Select label="Source Known?" name="sourceIdentified" options={['Yes', 'No']} value={reviewModal.item.sourceIdentified} onChange={handleModalInputChange} />
                                                    {reviewModal.item.sourceIdentified === 'Yes' && <Input label="Source MRN" name="sourceMrn" value={reviewModal.item.sourceMrn} onChange={handleModalInputChange} className="mt-2" />}
                                                </div>
                                            </>
                                        )}

                                        {activeTab === 'hai' && (
                                            <>
                                                <Select label="HAI Type" name="haiType" options={HAI_TYPES} value={reviewModal.item.haiType} onChange={handleModalInputChange} />
                                                {reviewModal.item.haiType === "Ventilator Associated Pneumonia" && (
                                                    <div className="bg-blue-50 p-3 rounded-lg flex flex-col gap-2">
                                                        <Select label="MV Initiation Area" name="mvInitiationArea" options={AREAS} value={reviewModal.item.mvInitiationArea} onChange={handleModalInputChange} />
                                                        <Input label="MV Initiation Date" name="mvInitiationDate" type="date" value={reviewModal.item.mvInitiationDate} onChange={handleModalInputChange} />
                                                    </div>
                                                )}
                                            </>
                                        )}
                                        {activeTab === 'isolation' && (
                                            <>
                                                <Input label="Diagnosis" name="diagnosis" value={reviewModal.item.diagnosis} onChange={handleModalInputChange} />
                                                <Select label="Transferred From" name="transferredFrom" options={AREAS} value={reviewModal.item.transferredFrom} onChange={handleModalInputChange} />
                                            </>
                                        )}
                                        {activeTab === 'tb' && (
                                            <>
                                                <Select label="Classification" name="classification" options={['Bacteriological Confirmed', 'Clinically Diagnosed', 'Presumptive TB']} value={reviewModal.item.classification} onChange={handleModalInputChange} />
                                                <Select label="Outcome" name="outcome" options={PTB_OUTCOMES} value={reviewModal.item.outcome} onChange={handleModalInputChange} />
                                            </>
                                        )}
                                        {activeTab === 'culture' && (
                                            <>
                                                <Input label="Organism" name="organism" value={reviewModal.item.organism} onChange={handleModalInputChange} />
                                                <Input label="Specimen" name="specimen" value={reviewModal.item.specimen} onChange={handleModalInputChange} />
                                            </>
                                        )}
                                    </div>
                                </section>
                            </div>

                            {/* SECTION: Address (For TB/Notifiable) */}
                            {(activeTab === 'tb' || activeTab === 'notifiable') && (
                                <section className="p-5 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><MapPin size={14}/> Geography Data</h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <Select label="Barangay" name="barangay" options={BARANGAYS} value={reviewModal.item.barangay} onChange={handleModalInputChange} />
                                        <Input label="City" name="city" value={reviewModal.item.city} onChange={handleModalInputChange} />
                                    </div>
                                </section>
                            )}

                            {/* Antibiogram for Culture */}
                            {activeTab === 'culture' && reviewModal.item.antibiotics && (
                                <section className="p-5 bg-white rounded-xl border border-gray-200 flex flex-col gap-4">
                                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 border-b pb-2"><Microscope size={14}/> Antibiogram</h3>
                                    <div className="border rounded-xl overflow-hidden shadow-sm">
                                        <table className="w-full text-sm">
                                            <thead className="bg-gray-100 font-bold">
                                                <tr><th className="p-3 text-left">Antibiotic</th><th className="p-3 text-center">MIC</th><th className="p-3 text-center">Result</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-100">
                                                {reviewModal.item.antibiotics.map((ab: any, idx: number) => (
                                                    <tr key={idx}>
                                                        <td className="p-2"><input className="w-full p-1 bg-transparent border-none focus:ring-0 font-bold" value={ab.name} onChange={(e) => handleAntibioticChange(idx, 'name', e.target.value)} /></td>
                                                        <td className="p-2 text-center"><input className="w-full text-center p-1 bg-transparent border-none focus:ring-0" value={ab.mic} onChange={(e) => handleAntibioticChange(idx, 'mic', e.target.value)} /></td>
                                                        <td className="p-2 text-center">
                                                            <select className="font-black bg-transparent" value={ab.interpretation} onChange={(e) => handleAntibioticChange(idx, 'interpretation', e.target.value)}>
                                                                <option value="S">S</option><option value="I">I</option><option value="R">R</option>
                                                            </select>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </section>
                            )}
                            
                            <section className="p-5 bg-blue-50 rounded-xl border border-blue-100">
                                <h3 className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-3">Reporter Traceability</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <p className="text-sm font-bold text-blue-900">Submitted by: <span className="font-normal">{reviewModal.item.reporterName}</span></p>
                                    <p className="text-sm font-bold text-blue-900">Date Logged: <span className="font-normal">{reviewModal.item.dateReported}</span></p>
                                </div>
                            </section>
                        </div>

                        <div className="p-6 bg-gray-100 border-t flex justify-between gap-4 sticky bottom-0">
                            <button onClick={() => setReviewModal({ show: false, item: null })} className="px-6 py-3 bg-white text-gray-600 font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors">Cancel</button>
                            <button 
                                onClick={() => handleValidate(activeTab, reviewModal.item.id, reviewModal.item)}
                                disabled={validatingId === reviewModal.item.id}
                                className="px-10 py-3 bg-[var(--osmak-green)] text-white font-black rounded-xl shadow-lg hover:bg-[var(--osmak-green-dark)] transition-all flex items-center justify-center gap-2"
                            >
                                {validatingId === reviewModal.item.id ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                Publish to Hub Surveillance
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <PasswordConfirmModal
                show={showPasswordConfirm}
                onClose={() => setShowPasswordConfirm(false)}
                onConfirm={handlePasswordConfirmed}
                loading={passwordConfirmLoading}
                title="Confirm Discard"
                description={`Enter your password to permanently discard the pending ${itemToDelete?.type || ''} report for ${itemToDelete?.hcwName || itemToDelete?.lastName || ''}, ${itemToDelete?.firstName || ''}.`}
            />
        </Layout>
    );
};

export default PendingTasksDashboard;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './ui/Layout';
import { 
    ChevronLeft, 
    FileText, 
    Download, 
    Search, 
    BookOpen, 
    ShieldCheck, 
    Clock, 
    ChevronRight,
    ExternalLink,
    FileCheck,
    ScrollText,
    BadgeInfo,
    Library
} from 'lucide-react';

interface Resource {
    id: string;
    title: string;
    category: string;
    updated: string;
    description: string;
    type: 'pdf' | 'link' | 'text';
}

const SAMPLE_MANUAL_CONTENT: Resource[] = [
    { id: '1', title: 'Hand Hygiene Policy', category: 'General Precautions', updated: 'Jan 2024', description: 'Standardized protocols for 5 moments of hand hygiene using alcohol rub or soap.', type: 'pdf' },
    { id: '2', title: 'Isolation Precautions Standard', category: 'Transmission-Based', updated: 'Nov 2023', description: 'Guidelines for contact, droplet, and airborne isolation procedures.', type: 'pdf' },
    { id: '3', title: 'Needlestick Injury Protocol', category: 'HCW Safety', updated: 'Feb 2024', description: 'Step-by-step immediate management of sharps and blood-borne exposure.', type: 'text' },
    { id: '4', title: 'Environmental Cleaning Guide', category: 'Maintenance', updated: 'Oct 2023', description: 'Disinfection frequencies for low and high-touch areas in wards.', type: 'pdf' },
    { id: '5', title: 'Linen and Laundry Mgmt', category: 'Maintenance', updated: 'Sep 2023', description: 'Handling procedures for soiled and infectious linens.', type: 'pdf' },
    { id: '6', title: 'Waste Management Guideline', category: 'Bio-Safety', updated: 'Mar 2024', description: 'Segregation and disposal of infectious vs non-infectious waste.', type: 'pdf' },
    { id: '7', title: 'Surgical Antimicrobial Prophylaxis', category: 'Clinical Procedure', updated: 'Jan 2024', description: 'Timing and selection of antibiotics for surgical patients.', type: 'pdf' }
];

const SAMPLE_REFERENCES_CONTENT: Resource[] = [
    { id: 'p1', title: 'Suspected PTB Pathway', category: 'Respiratory', updated: 'Jan 2024', description: 'Clinical diagnostic algorithm from triage to GeneXpert and isolation.', type: 'link' },
    { id: 'p2', title: 'MDRO Decolonization', category: 'MDRO Mgmt', updated: 'Dec 2023', description: 'Standardized care plan for patients positive for MRSA or KPC.', type: 'text' },
    { id: 'p3', title: 'SSI Prevention Bundle', category: 'Surgical Care', updated: 'Feb 2024', description: 'Pre-op, intra-op, and post-op checklist to minimize surgical site infections.', type: 'pdf' },
    { id: 'p4', title: 'VAP Prevention Pathway', category: 'Critical Care', updated: 'Nov 2023', description: 'Ventilator bundle care including oral care and head-of-bed elevation.', type: 'link' },
    { id: 'p5', title: 'CDC Core IPC Practices', category: 'External Standard', updated: '2023', description: 'Comprehensive guide to core infection control from the CDC.', type: 'link' },
    { id: 'p6', title: 'WHO IPC Guidelines', category: 'External Standard', updated: '2022', description: 'World Health Organization guidelines on infection prevention and control.', type: 'link' }
];

interface Props {
    title?: string;
    type?: 'policies' | 'pathways';
    isNested?: boolean;
}

const Resources: React.FC<Props> = ({ title, type, isNested }) => {
    const navigate = useNavigate();
    const [search, setSearch] = useState('');
    
    // Default to policies if not provided
    const resourceType = type || 'policies';
    const items = resourceType === 'policies' ? SAMPLE_MANUAL_CONTENT : SAMPLE_REFERENCES_CONTENT;
    
    const filteredItems = items.filter(i => 
        i.title.toLowerCase().includes(search.toLowerCase()) || 
        i.category.toLowerCase().includes(search.toLowerCase()) ||
        i.description.toLowerCase().includes(search.toLowerCase())
    );

    const Content = (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                    {!isNested && (
                        <button onClick={() => navigate('/')} className="flex items-center text-sm text-gray-600 hover:text-[var(--osmak-green)] font-bold">
                            <ChevronLeft size={16} /> Hub Dashboard
                        </button>
                    )}
                    <div className="flex items-center gap-2">
                        <BadgeInfo size={16} className="text-primary" />
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">
                            {filteredItems.length} documents found
                        </span>
                    </div>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                        type="text" 
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[var(--osmak-green)] outline-none shadow-sm transition-all"
                        placeholder={`Search ${title || 'Resources'}...`}
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredItems.map((item) => (
                    <div key={item.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group flex flex-col gap-4 relative overflow-hidden">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-[var(--osmak-green)] tracking-widest">{item.category}</span>
                                <h3 className="font-black text-lg text-gray-800 mt-1">{item.title}</h3>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-xl group-hover:bg-green-50 text-gray-400 group-hover:text-[var(--osmak-green)] transition-colors">
                                {item.type === 'pdf' ? <ScrollText size={20} /> : item.type === 'link' ? <ExternalLink size={20} /> : <FileText size={20} />}
                            </div>
                        </div>
                        
                        <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">{item.description}</p>
                        
                        <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-50">
                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                <Clock size={12}/> {item.updated}
                            </span>
                            <button className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--osmak-green-dark)] hover:underline">
                                {item.type === 'pdf' ? (
                                    <><Download size={14} /> Download</>
                                ) : item.type === 'link' ? (
                                    <><ExternalLink size={14} /> Access</>
                                ) : (
                                    <><BookOpen size={14} /> Read</>
                                )}
                                <ChevronRight size={14}/>
                            </button>
                        </div>
                        <div className="absolute bottom-0 right-0 p-1 opacity-0 group-hover:opacity-10 transition-opacity">
                            <Library size={64} className="text-primary rotate-12" />
                        </div>
                    </div>
                ))}
            </div>

            {filteredItems.length === 0 && (
                <div className="bg-white p-20 rounded-3xl border-2 border-dashed border-gray-200 text-center flex flex-col items-center gap-4 animate-in fade-in">
                    <Search size={64} className="text-gray-100"/>
                    <div className="flex flex-col gap-1">
                        <h3 className="font-black text-gray-400 uppercase tracking-widest">No Documents Found</h3>
                        <p className="text-sm text-gray-300 font-bold">Try adjusting your search keywords</p>
                    </div>
                    <button 
                        onClick={() => setSearch('')}
                        className="mt-4 px-6 py-2 bg-slate-100 text-slate-500 rounded-lg font-black uppercase text-[10px] hover:bg-slate-200 transition-colors"
                    >
                        Clear Filter
                    </button>
                </div>
            )}
            
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-3xl border border-green-100 flex items-center gap-5">
                <div className="size-12 rounded-2xl bg-white flex items-center justify-center text-primary shadow-sm">
                    <FileCheck size={28}/>
                </div>
                <div>
                    <h4 className="font-black text-[var(--osmak-green-dark)] text-sm uppercase tracking-tight">Official Clinical Documentation</h4>
                    <p className="text-xs text-[var(--osmak-green)] font-bold opacity-80 mt-1">All entries reflect the latest approved versions from the IPC Committee and Hospital Management.</p>
                </div>
            </div>
        </div>
    );

    return isNested ? Content : <Layout title={title || "Resources"}>{Content}</Layout>;
};

export default Resources;

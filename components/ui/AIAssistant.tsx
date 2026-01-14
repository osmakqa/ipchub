
import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, X, Send, Loader2, MessageCircle, Info } from 'lucide-react';
import { queryIPCAssistant } from '../../services/ipcService';

const AIAssistant: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [history, setHistory] = useState<{role: 'user' | 'assistant', text: string}[]>([]);
    const [loading, setLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [history, loading]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim() || loading) return;

        const userMsg = query;
        setQuery('');
        setHistory(prev => [...prev, { role: 'user', text: userMsg }]);
        setLoading(true);

        const aiMsg = await queryIPCAssistant(userMsg, history);
        setHistory(prev => [...prev, { role: 'assistant', text: aiMsg }]);
        setLoading(false);
    };

    return (
        <div className="fixed bottom-6 right-6 z-[300] flex flex-col items-end gap-4 pointer-events-none">
            {isOpen && (
                <div className="w-[380px] h-[550px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-200 overflow-hidden flex flex-col pointer-events-auto animate-in slide-in-from-bottom-4 zoom-in-95 duration-300">
                    <div className="bg-slate-900 p-6 text-white flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-indigo-500 rounded-xl"><Sparkles size={20} className="text-white" /></div>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-tight">IPC Smart Advisor</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Gemini 3 Flash</p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 custom-scrollbar bg-slate-50/50">
                        {history.length === 0 && (
                            <div className="flex flex-col items-center justify-center h-full text-center gap-4 opacity-40">
                                <MessageCircle size={48} className="text-slate-400" />
                                <div className="flex flex-col gap-1">
                                    <p className="text-sm font-bold text-slate-900 uppercase tracking-widest">Welcome to Advisor</p>
                                    <p className="text-xs font-medium text-slate-500">Ask about IPC protocols, HAI prevention, or notifiable disease guidelines.</p>
                                </div>
                            </div>
                        )}
                        {history.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-1`}>
                                <div className={`max-w-[85%] p-4 rounded-3xl text-sm font-medium leading-relaxed ${
                                    msg.role === 'user' 
                                    ? 'bg-indigo-600 text-white rounded-tr-none shadow-md' 
                                    : 'bg-white text-slate-700 border border-slate-100 rounded-tl-none shadow-sm'
                                }`}>
                                    {msg.text}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-tl-none flex items-center gap-2">
                                    <Loader2 size={16} className="animate-spin text-indigo-500" />
                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Thinking...</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100 flex gap-2 items-center">
                        <input 
                            className="flex-1 bg-slate-50 border-none rounded-2xl px-5 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all outline-none" 
                            placeholder="Type IPC inquiry..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={!query.trim() || loading}
                            className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg active:scale-90 disabled:opacity-30"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            )}
            
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="pointer-events-auto size-16 bg-slate-900 text-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all group relative"
            >
                {isOpen ? <X size={24} /> : <Sparkles size={28} className="text-yellow-300 animate-pulse" />}
                {!isOpen && (
                    <div className="absolute right-full mr-4 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                        <span className="text-xs font-black uppercase text-slate-900 tracking-tight">IPC AI Advisor</span>
                    </div>
                )}
            </button>
        </div>
    );
};

export default AIAssistant;

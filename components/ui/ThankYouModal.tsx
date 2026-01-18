import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Heart, ArrowRight, Home, Users } from 'lucide-react';

interface ThankYouModalProps {
  show: boolean;
  reporterName: string;
  moduleName: string;
  onClose: () => void;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({ show, reporterName, moduleName, onClose }) => {
  const navigate = useNavigate();
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-500">
        <div className="bg-primary p-12 text-white text-center relative overflow-hidden">
          <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute -bottom-10 -left-10 size-40 bg-black/10 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className="size-20 bg-white text-primary rounded-full flex items-center justify-center shadow-xl mb-2">
              <CheckCircle2 size={48} />
            </div>
            <h2 className="text-4xl font-black tracking-tight uppercase leading-none">Thank You!</h2>
            <p className="text-primary-foreground/80 font-bold uppercase tracking-widest text-xs">Submission Successful</p>
          </div>
        </div>

        <div className="p-10 flex flex-col items-center text-center gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-slate-500 font-medium">Great work,</p>
            <h3 className="text-2xl font-black text-slate-900">{reporterName || 'Health Worker'}</h3>
          </div>
          
          <div className="flex flex-col gap-4 max-w-xs">
            <p className="text-slate-400 text-sm leading-relaxed">
              Your report for the <span className="text-primary font-bold">{moduleName}</span> has been logged. 
              Your contribution is vital to our hospital's safety and surveillance mission.
            </p>
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-3">
              <Users size={20} className="text-primary flex-shrink-0" />
              <p className="text-[11px] text-slate-500 font-bold text-left leading-tight">
                You may view your previous validated entries in the <span className="text-primary">Reporters</span> section of the hub.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
            <button 
              onClick={() => navigate('/')} 
              className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-black transition-all flex items-center justify-center gap-2"
            >
              <Home size={16} /> Hub Dashboard
            </button>
            <button 
              onClick={onClose} 
              className="flex-1 py-4 bg-white border-2 border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-xs tracking-widest hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2"
            >
              New Entry <ArrowRight size={16} />
            </button>
          </div>
          
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-300 mt-2">
            <Heart size={10} className="text-red-400 fill-current" />
            Ospital ng Makati IPC
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThankYouModal;
import React, { useState } from 'react';
import { Loader2, Key, X } from 'lucide-react';
import Input from './Input';

interface PasswordConfirmModalProps {
  show: boolean;
  onClose: () => void;
  onConfirm: (password: string) => void;
  loading: boolean;
  title?: string;
  description?: string;
}

const PasswordConfirmModal: React.FC<PasswordConfirmModalProps> = ({
  show,
  onClose,
  onConfirm,
  loading,
  title = "Confirm Deletion",
  description = "Please enter your password to confirm this action.",
}) => {
  const [password, setPassword] = useState('');

  if (!show) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onConfirm(password);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
        <div className="bg-slate-900 p-6 text-white text-center relative">
          <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"><X size={20}/></button>
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <Key size={28} />
          </div>
          <h3 className="text-xl font-black">{title}</h3>
          <p className="text-xs opacity-80 font-bold mt-1">{description}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 flex flex-col gap-5">
          <Input
            label="Your Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          
          <div className="flex gap-3 mt-2">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={loading || !password.trim()}
              className="flex-1 py-3 bg-red-600 text-white font-bold rounded-xl shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={18} className="animate-spin" /> : "Confirm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordConfirmModal;
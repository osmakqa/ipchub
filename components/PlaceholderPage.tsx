import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './ui/Layout';
import { ChevronLeft, Construction } from 'lucide-react';

interface Props {
  title: string;
}

const PlaceholderPage: React.FC<Props> = ({ title }) => {
  const navigate = useNavigate();

  return (
    <Layout title={title}>
      <button onClick={() => navigate('/')} className="mb-4 flex items-center text-sm text-gray-600 hover:text-[var(--osmak-green)] transition-colors">
        <ChevronLeft size={16} /> Back to Dashboard
      </button>
      <div className="bg-white p-12 rounded-xl shadow-sm text-center flex flex-col items-center justify-center gap-4">
        <Construction size={48} className="text-gray-300" />
        <h3 className="text-xl font-bold text-gray-700">Content Coming Soon</h3>
        <p className="text-gray-500">The {title} module is currently being set up.</p>
      </div>
    </Layout>
  );
};

export default PlaceholderPage;
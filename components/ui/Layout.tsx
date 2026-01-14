import React, { ReactNode } from 'react';

interface LayoutProps {
  children: ReactNode;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, title }) => {
  return (
    <div className="min-h-screen flex flex-col bg-background-light">
      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 md:px-10 py-8">
        {title && (
          <div className="mb-6">
            <h2 className="text-2xl font-black text-[#0c1d13] tracking-[-0.015em]">{title}</h2>
          </div>
        )}
        {children}
      </main>
      <footer className="mt-auto border-t border-slate-200 bg-surface-light py-6 text-center">
        <p className="text-sm text-slate-500">© {new Date().getFullYear()} Ospital ng Makati. Infection Prevention and Control Unit.</p>
      </footer>
    </div>
  );
};

export default Layout;
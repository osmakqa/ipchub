import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './AuthContext';
import Header from './components/Header';
import SurveillanceHub from './components/SurveillanceHub';
import HAIDashboard from './components/dashboards/HAIDashboard';
import IsolationDashboard from './components/dashboards/IsolationDashboard';
import PTBDashboard from './components/dashboards/PTBDashboard';
import CultureDashboard from './components/dashboards/CultureDashboard';
import NotifiableDashboard from './components/dashboards/NotifiableDashboard';
import NeedlestickDashboard from './components/dashboards/NeedlestickDashboard';
import PendingTasksDashboard from './components/dashboards/PendingTasksDashboard';
import NotifiableDiseaseForm from './components/forms/NotifiableDiseaseForm';
import HAIForm from './components/forms/HAIForm';
import IsolationForm from './components/forms/IsolationForm';
import NeedlestickForm from './components/forms/NeedlestickForm';
import PTBForm from './components/forms/PTBForm';
import CultureReportForm from './components/forms/CultureReportForm';
import Resources from './components/Resources';
import ReporterAnalytics from './components/dashboards/ReporterAnalytics';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <HashRouter>
        <Header />
        <Routes>
          {/* Surveillance Hub is the landing page */}
          <Route path="/" element={<SurveillanceHub />} />
          <Route path="/surveillance" element={<SurveillanceHub />} />
          
          {/* Direct Dashboard Routes */}
          <Route path="/hai-dashboard" element={<HAIDashboard />} />
          <Route path="/isolation-dashboard" element={<IsolationDashboard />} />
          <Route path="/ptb-dashboard" element={<PTBDashboard />} />
          <Route path="/culture-dashboard" element={<CultureDashboard />} />
          <Route path="/notifiable-dashboard" element={<NotifiableDashboard />} />
          <Route path="/needlestick-dashboard" element={<NeedlestickDashboard />} />
          <Route path="/pending" element={<PendingTasksDashboard />} />
          <Route path="/reporter-analytics" element={<ReporterAnalytics />} />
          
          {/* Form Routes */}
          <Route path="/report-disease" element={<NotifiableDiseaseForm />} />
          <Route path="/report-ptb" element={<PTBForm />} />
          <Route path="/report-hai" element={<HAIForm />} />
          <Route path="/report-isolation" element={<IsolationForm />} />
          <Route path="/report-needlestick" element={<NeedlestickForm />} />
          <Route path="/report-culture" element={<CultureReportForm />} />

          <Route path="/policies" element={<Resources title="IPC Policies" type="policies" />} />
          <Route path="/pathways" element={<Resources title="Clinical Pathways" type="pathways" />} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
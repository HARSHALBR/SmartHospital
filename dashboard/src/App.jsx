import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';

// 8 Consolidated Primary Pages for Phase 12
import Dashboard from './pages/Dashboard';
import HospitalData from './pages/HospitalData';
import SemanticVectorization from './pages/SemanticVectorization';
import FederatedGraphLearning from './pages/FederatedGraphLearning';
import AnomalyDetection from './pages/AnomalyDetection';
import SecurityPrivacy from './pages/SecurityPrivacy';
import Results from './pages/Results';
import About from './pages/About';
import HospitalSimulation from './pages/HospitalSimulation';
import NetworkSimulation from './pages/NetworkSimulation';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* Main Consolidated Routes */}
          <Route index element={<Dashboard />} />
          <Route path="simulation" element={<HospitalSimulation />} />
          <Route path="network-simulation" element={<NetworkSimulation />} />
          <Route path="data" element={<HospitalData />} />
          <Route path="semantic" element={<SemanticVectorization />} />
          <Route path="federated-graph" element={<FederatedGraphLearning />} />
          <Route path="anomaly-detection" element={<AnomalyDetection />} />
          <Route path="security-privacy" element={<SecurityPrivacy />} />
          <Route path="results" element={<Results />} />
          <Route path="about" element={<About />} />

          {/* Legacy route redirects/mappings */}
          <Route path="dataset" element={<Navigate to="/data" replace />} />
          <Route path="clinical" element={<Navigate to="/semantic" replace />} />
          <Route path="graph" element={<Navigate to="/federated-graph" replace />} />
          <Route path="cent-vs-fed" element={<Navigate to="/federated-graph" replace />} />
          <Route path="attack" element={<Navigate to="/anomaly-detection" replace />} />
          <Route path="inference" element={<Navigate to="/anomaly-detection" replace />} />
          <Route path="non-iid" element={<Navigate to="/security-privacy" replace />} />
          <Route path="fedprox" element={<Navigate to="/security-privacy" replace />} />
          <Route path="personalization" element={<Navigate to="/security-privacy" replace />} />
          <Route path="byzantine" element={<Navigate to="/security-privacy" replace />} />
          <Route path="privacy" element={<Navigate to="/security-privacy" replace />} />
          <Route path="performance" element={<Navigate to="/results" replace />} />
          <Route path="multimodal" element={<Navigate to="/results" replace />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

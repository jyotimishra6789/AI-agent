import React, { useState } from 'react';
import Layout from './components/Layout.jsx';
import CapturePage from './pages/CapturePage.jsx';
import SOPLibraryPage from './pages/SOPLibraryPage.jsx';
import SOPDetailPage from './pages/SOPDetailPage.jsx';
import DeviationPage from './pages/DeviationPage.jsx';
import ChatPage from './pages/ChatPage.jsx';

export default function App() {
  const [page, setPage] = useState('capture');
  const [activeSOP, setActiveSOP] = useState(null);
  const [stats, setStats] = useState({ sops: 0, steps: 0, deviations: 0 });

  const addSOP = (sop) => {
    setActiveSOP(sop);
    setStats((s) => ({ ...s, sops: s.sops + 1, steps: s.steps + sop.step_count }));
    setPage('detail');
  };

  const addDeviation = () => setStats((s) => ({ ...s, deviations: s.deviations + 1 }));

  return (
    <Layout page={page} setPage={setPage} stats={stats} activeSOP={activeSOP}>
      {page === 'capture'  && <CapturePage onSOPGenerated={addSOP} />}
      {page === 'library'  && <SOPLibraryPage setPage={setPage} setActiveSOP={setActiveSOP} />}
      {page === 'detail'   && <SOPDetailPage sop={activeSOP} setPage={setPage} />}
      {page === 'deviate'  && <DeviationPage sop={activeSOP} onDeviation={addDeviation} />}
      {page === 'chat'     && <ChatPage sop={activeSOP} />}
    </Layout>
  );
}
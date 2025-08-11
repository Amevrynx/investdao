import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { WalletProvider } from './contexts/WalletContext';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import ProposalsList from './pages/ProposalsList';
import ProposalDetails from './pages/ProposalDetails';
import CreateProposal from './pages/CreateProposal';
import Staking from './pages/Staking';
import Treasury from './pages/Treasury';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 5000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WalletProvider>
        <Router>
          <div className="App">
            <Layout>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/proposals" element={<ProposalsList />} />
                <Route path="/proposals/:id" element={<ProposalDetails />} />
                <Route path="/proposals/create" element={<CreateProposal />} />
                <Route path="/stake" element={<Staking />} />
                <Route path="/treasury" element={<Treasury />} />
              </Routes>
            </Layout>
            
            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1f2937',
                  color: '#f9fafb',
                  border: '1px solid #374151',
                },
                success: {
                  iconTheme: {
                    primary: '#f9fafb',
                    secondary: '#1f2937',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#f87171',
                    secondary: '#1f2937',
                  },
                },
              }}
            />
          </div>
        </Router>
      </WalletProvider>
    </QueryClientProvider>
  );
}

export default App;
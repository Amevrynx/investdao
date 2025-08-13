import React, { useState } from 'react';
import { 
  Vault, 
  TrendingUp, 
  Users, 
  FileText,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  BarChart3
} from 'lucide-react';
import { useDAO } from '../hooks/useDAO';
import { useWallet } from '../contexts/WalletContext';
import { CONTRACT_ADDRESS, formatAPT, TREASURY_ADDRESS } from '../config/aptos';
import LoadingSpinner from '../components/LoadingSpinner';
import { PieChart as RechartsPieChart, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Pie } from 'recharts';

const Treasury: React.FC = () => {
  const { wallet } = useWallet();
  const { 
    treasuryInfo, 
    proposals, 
    daoStats,
    treasuryLoading,
    proposalsLoading 
  } = useDAO(TREASURY_ADDRESS);

  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'management'>('overview');

  // Calculate treasury analytics
  const totalRequested = proposals.reduce((sum, p) => sum + p.requestedAmount, 0);
  const totalFunded = proposals.filter(p => p.status === 1).reduce((sum, p) => sum + p.requestedAmount, 0);
  const pendingRequests = proposals.filter(p => p.status === 0).reduce((sum, p) => sum + p.requestedAmount, 0);

  // Proposal status distribution for pie chart
  const proposalStatusData = [
    { name: 'Open', value: proposals.filter(p => p.status === 0).length, color: '#374151' },
    { name: 'Funded', value: proposals.filter(p => p.status === 1).length, color: '#f3f4f6' },
    { name: 'Rejected', value: proposals.filter(p => p.status === 2).length, color: '#6b7280' }
  ];

  // Monthly proposal data (simulated)
  const monthlyData = [
    { month: 'Jan', proposals: 0, funded: 0, amount: 0 },
    { month: 'Feb', proposals: 0, funded: 0, amount: 0 },
    { month: 'Mar', proposals: 0, funded: 0, amount: 0 },
    { month: 'Apr', proposals: 0, funded: 0, amount: 0 },
    { month: 'May', proposals: 0, funded: 0, amount: 0 },
    { month: 'Jun', proposals: 0, funded: 0, amount: 0 }
  ];

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <Vault className="w-16 h-16 text-grey-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-grey-900 mb-2">Connect Wallet</h2>
          <p className="text-grey-600">Please connect your wallet to view treasury information.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grey-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-900 mb-2">Treasury Management</h1>
          <p className="text-grey-600">
            Monitor DAO treasury funds, proposal analytics, and financial performance
          </p>
        </div>

        {/* Treasury Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 border border-grey-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <Vault className="w-8 h-8 text-grey-600" />
              {treasuryLoading && <LoadingSpinner size="sm" />}
            </div>
            <div className="text-2xl font-bold text-grey-900 mb-1">
              {treasuryInfo ? formatAPT(treasuryInfo.totalFunds) : '4.23'} APT
            </div>
            <p className="text-sm text-grey-600">Treasury Balance</p>
            <div className="flex items-center mt-2">
              <ArrowUpRight className="w-4 h-4 text-grey-500 mr-1" />
              <span className="text-xs text-grey-500">Available for funding</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-grey-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-grey-600" />
              <Activity className="w-4 h-4 text-grey-400" />
            </div>
            <div className="text-2xl font-bold text-grey-900 mb-1">
              {formatAPT(totalFunded)} APT
            </div>
            <p className="text-sm text-grey-600">Total Funded</p>
            <div className="flex items-center mt-2">
              <ArrowDownRight className="w-4 h-4 text-grey-500 mr-1" />
              <span className="text-xs text-grey-500">Across all proposals</span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-grey-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 text-grey-600" />
              {proposalsLoading && <LoadingSpinner size="sm" />}
            </div>
            <div className="text-2xl font-bold text-grey-900 mb-1">
              {daoStats.activeProposals}
            </div>
            <p className="text-sm text-grey-600">Active Proposals</p>
            <div className="flex items-center mt-2">
              <span className="text-xs text-grey-500">
                {formatAPT(pendingRequests)} APT requested
              </span>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 border border-grey-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-grey-600" />
              <TrendingUp className="w-4 h-4 text-grey-400" />
            </div>
            <div className="text-2xl font-bold text-grey-900 mb-1">
              {treasuryInfo ? formatAPT(treasuryInfo.stakedTokens) : '0'}
            </div>
            <p className="text-sm text-grey-600">Total Staked</p>
            <div className="flex items-center mt-2">
              <span className="text-xs text-grey-500">Voting power tokens</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg border border-grey-200 mb-8">
          <div className="border-b border-grey-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                { id: 'management', label: 'Management', icon: Vault }
              ].map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                      activeTab === tab.id
                        ? 'border-grey-900 text-grey-900'
                        : 'border-transparent text-grey-500 hover:text-grey-700 hover:border-grey-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-grey-900 mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    {proposals.slice(-5).reverse().map((proposal) => (
                      <div key={proposal.id} className="flex items-center justify-between p-4 bg-grey-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className={`w-2 h-2 rounded-full ${
                            proposal.status === 0 ? 'bg-grey-700' :
                            proposal.status === 1 ? 'bg-grey-200' : 'bg-grey-400'
                          }`} />
                          <div>
                            <p className="font-medium text-grey-900">Proposal #{proposal.id}</p>
                            <p className="text-sm text-grey-600">
                              {proposal.status === 0 ? 'Open for voting' :
                               proposal.status === 1 ? 'Funded and executed' : 'Rejected by community'}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-grey-900">{formatAPT(proposal.requestedAmount)} APT</p>
                          <p className="text-sm text-grey-600">{proposal.yesVotes + proposal.noVotes} votes</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Treasury Health */}
                <div>
                  <h3 className="text-lg font-semibold text-grey-900 mb-4">Treasury Health</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-grey-50 p-4 rounded-lg">
                      <h4 className="font-medium text-grey-900 mb-2">Utilization Rate</h4>
                      <div className="text-2xl font-bold text-grey-900 mb-1">
                        {treasuryInfo && treasuryInfo.totalFunds > 0 
                          ? ((totalFunded / treasuryInfo.totalFunds) * 100).toFixed(1)
                          : '0'
                        }%
                      </div>
                      <p className="text-sm text-grey-600">Funds allocated</p>
                    </div>
                    <div className="bg-grey-50 p-4 rounded-lg">
                      <h4 className="font-medium text-grey-900 mb-2">Success Rate</h4>
                      <div className="text-2xl font-bold text-grey-900 mb-1">
                        {proposals.length > 0 
                          ? ((proposals.filter(p => p.status === 1).length / proposals.length) * 100).toFixed(1)
                          : '0'
                        }%
                      </div>
                      <p className="text-sm text-grey-600">Proposals funded</p>
                    </div>
                    <div className="bg-grey-50 p-4 rounded-lg">
                      <h4 className="font-medium text-grey-900 mb-2">Avg. Proposal</h4>
                      <div className="text-2xl font-bold text-grey-900 mb-1">
                        {proposals.length > 0 
                          ? formatAPT(totalRequested / proposals.length)
                          : '0'
                        } APT
                      </div>
                      <p className="text-sm text-grey-600">Funding requested</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Proposal Status Distribution */}
                  <div>
                    <h3 className="text-lg font-semibold text-grey-900 mb-4">Proposal Status Distribution</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <RechartsPieChart>
                          <Pie
                            dataKey="value"
                            data={proposalStatusData}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            fill="#8884d8"
                          >
                            {proposalStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Monthly Trends */}
                  <div>
                    <h3 className="text-lg font-semibold text-grey-900 mb-4">Monthly Proposal Trends</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="month" stroke="#6b7280" />
                          <YAxis stroke="#6b7280" />
                          <Tooltip />
                          <Bar dataKey="proposals" fill="#374151" name="Total Proposals" />
                          <Bar dataKey="funded" fill="#9ca3af" name="Funded Proposals" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Funding Analytics Table */}
                <div>
                  <h3 className="text-lg font-semibold text-grey-900 mb-4">Funding Analysis</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-grey-200">
                      <thead className="bg-grey-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                            Metric
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                            Amount (APT)
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                            Percentage
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-grey-500 uppercase tracking-wider">
                            Count
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-grey-200">
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-grey-900">
                            Total Requested
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                            {formatAPT(totalRequested)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                            0%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                            {proposals.length}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-grey-900">
                            Total Funded
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                            {formatAPT(totalFunded)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                            {totalRequested > 0 ? ((totalFunded / totalRequested) * 100).toFixed(1) : '0'}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                            {proposals.filter(p => p.status === 1).length}
                          </td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-grey-900">
                            Pending Requests
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                            {formatAPT(pendingRequests)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                            {totalRequested > 0 ? ((pendingRequests / totalRequested) * 100).toFixed(1) : '0'}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-grey-900">
                            {proposals.filter(p => p.status === 0).length}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'management' && (
              <div className="space-y-8">
                <div className="text-center py-12">
                  <Vault className="w-16 h-16 text-grey-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-grey-900 mb-2">Treasury Management</h3>
                  <p className="text-grey-600 mb-6 max-w-md mx-auto">
                    Advanced treasury management features are available for DAO administrators. 
                    Connect with admin privileges to access fund management tools.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg mx-auto">
                    <button className="p-4 border-2 border-dashed border-grey-300 rounded-lg hover:border-grey-400 transition-colors duration-200">
                      <Plus className="w-6 h-6 text-grey-400 mx-auto mb-2" />
                      <span className="text-sm text-grey-600">Deposit Funds</span>
                    </button>
                    <button className="p-4 border-2 border-dashed border-grey-300 rounded-lg hover:border-grey-400 transition-colors duration-200">
                      <Users className="w-6 h-6 text-grey-400 mx-auto mb-2" />
                      <span className="text-sm text-grey-600">Manage Members</span>
                    </button>
                  </div>
                  <p className="text-xs text-grey-500 mt-4">
                    Note: Admin functions require the direct deployed address since the connected wallet does not belong to the deployed address these functions are useless !!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Treasury;
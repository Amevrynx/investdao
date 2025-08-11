import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Wallet, 
  TrendingUp, 
  FileText, 
  Vote, 
  Plus,
  ArrowRight,
  Coins,
  Users,
  Target
} from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useDAO } from '../hooks/useDAO';
import { formatAPT } from '../config/aptos';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';

const Dashboard: React.FC = () => {
  const { wallet } = useWallet();
  const navigate = useNavigate();
  const { 
    treasuryInfo, 
    memberTokens, 
    proposals, 
    daoStats,
    joinDAO,
    isJoining,
    treasuryLoading,
    tokensLoading,
    proposalsLoading
  } = useDAO();

  // Redirect if not connected
  useEffect(() => {
    if (!wallet.connected) {
      navigate('/');
    }
  }, [wallet.connected, navigate]);

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-grey-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-grey-900 mb-2">Wallet Not Connected</h2>
          <p className="text-grey-600 mb-4">Please connect your wallet to access the dashboard.</p>
          <Link 
            to="/"
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-grey-800 transition-colors duration-200"
          >
            Go Home
            <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const recentProposals = proposals.slice(-5).reverse();
  const votingPower = memberTokens?.stakedBalance || 0;
  const isMember = (memberTokens?.balance || 0) > 0;

  return (
    <div className="min-h-screen bg-grey-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-900">Dashboard</h1>
          <p className="text-grey-600 mt-2">
            Manage your DAO participation and track investment opportunities
          </p>
        </div>

        {/* Join DAO Banner */}
        {!isMember && (
          <div className="bg-black rounded-lg p-6 mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-xl font-semibold text-white mb-2">Join InvestDAO</h2>
                <p className="text-grey-300">
                  Become a member to receive governance tokens and participate in investment decisions.
                </p>
              </div>
              <button
                onClick={() => joinDAO()}
                disabled={isJoining}
                className="inline-flex items-center px-6 py-3 bg-white text-black rounded-lg font-medium hover:bg-grey-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isJoining ? (
                  <>
                    <LoadingSpinner size="sm" color="dark" className="mr-2" />
                    Joining...
                  </>
                ) : (
                  <>
                    <Users className="w-4 h-4 mr-2" />
                    Join DAO
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Token Balance */}
          <div className="bg-white rounded-lg p-6 border border-grey-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="w-8 h-8 text-grey-600" />
              {tokensLoading && <LoadingSpinner size="sm" />}
            </div>
            <div className="text-2xl font-bold text-grey-900 mb-1">
              {memberTokens ? formatAPT(memberTokens.balance) : '0'} APT
            </div>
            <p className="text-sm text-grey-600">Token Balance</p>
          </div>

          {/* Staked Amount */}
          <div className="bg-white rounded-lg p-6 border border-grey-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <Coins className="w-8 h-8 text-grey-600" />
              {tokensLoading && <LoadingSpinner size="sm" />}
            </div>
            <div className="text-2xl font-bold text-grey-900 mb-1">
              {memberTokens ? formatAPT(memberTokens.stakedBalance) : '0'} APT
            </div>
            <p className="text-sm text-grey-600">Staked Tokens</p>
          </div>

          {/* Voting Power */}
          <div className="bg-white rounded-lg p-6 border border-grey-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <Vote className="w-8 h-8 text-grey-600" />
              <Target className="w-4 h-4 text-grey-400" />
            </div>
            <div className="text-2xl font-bold text-grey-900 mb-1">
              {formatAPT(votingPower)}
            </div>
            <p className="text-sm text-grey-600">Voting Power</p>
          </div>

          {/* Treasury Balance */}
          <div className="bg-white rounded-lg p-6 border border-grey-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-grey-600" />
              {treasuryLoading && <LoadingSpinner size="sm" />}
            </div>
            <div className="text-2xl font-bold text-grey-900 mb-1">
              {treasuryInfo ? formatAPT(treasuryInfo.totalFunds) : '0'} APT
            </div>
            <p className="text-sm text-grey-600">Treasury Balance</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg border border-grey-200 p-6">
              <h2 className="text-lg font-semibold text-grey-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link
                  to="/stake"
                  className="flex items-center p-3 rounded-lg bg-grey-50 hover:bg-grey-100 transition-colors duration-200 group"
                >
                  <Coins className="w-5 h-5 text-grey-600 mr-3 group-hover:text-grey-800" />
                  <div>
                    <div className="font-medium text-grey-900">Stake Tokens</div>
                    <div className="text-sm text-grey-600">Increase voting power</div>
                  </div>
                </Link>
                
                <Link
                  to="/proposals/create"
                  className="flex items-center p-3 rounded-lg bg-grey-50 hover:bg-grey-100 transition-colors duration-200 group"
                >
                  <Plus className="w-5 h-5 text-grey-600 mr-3 group-hover:text-grey-800" />
                  <div>
                    <div className="font-medium text-grey-900">Create Proposal</div>
                    <div className="text-sm text-grey-600">Submit funding request</div>
                  </div>
                </Link>
                
                <Link
                  to="/proposals"
                  className="flex items-center p-3 rounded-lg bg-grey-50 hover:bg-grey-100 transition-colors duration-200 group"
                >
                  <Vote className="w-5 h-5 text-grey-600 mr-3 group-hover:text-grey-800" />
                  <div>
                    <div className="font-medium text-grey-900">Vote on Proposals</div>
                    <div className="text-sm text-grey-600">Participate in governance</div>
                  </div>
                </Link>
              </div>
            </div>

            {/* DAO Overview */}
            <div className="bg-white rounded-lg border border-grey-200 p-6 mt-6">
              <h2 className="text-lg font-semibold text-grey-900 mb-4">DAO Overview</h2>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-grey-600">Total Proposals</span>
                  <span className="font-medium text-grey-900">{daoStats.totalProposals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-600">Active Proposals</span>
                  <span className="font-medium text-grey-900">{daoStats.activeProposals}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-600">Staked Tokens</span>
                  <span className="font-medium text-grey-900">
                    {treasuryInfo ? formatAPT(treasuryInfo.stakedTokens) : '0'} APT
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Proposals */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-grey-200">
              <div className="p-6 border-b border-grey-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-grey-900">Recent Proposals</h2>
                  <Link
                    to="/proposals"
                    className="text-grey-600 hover:text-grey-900 text-sm font-medium flex items-center"
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Link>
                </div>
              </div>
              <div className="p-6">
                {proposalsLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : recentProposals.length > 0 ? (
                  <div className="space-y-4">
                    {recentProposals.map((proposal) => (
                      <Link
                        key={proposal.id}
                        to={`/proposals/${proposal.id}`}
                        className="block p-4 rounded-lg border border-grey-200 hover:border-grey-300 hover:shadow-sm transition-all duration-200"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-grey-500">
                              #{proposal.id}
                            </span>
                            <StatusBadge 
                              status={
                                proposal.status === 0 ? 'Open' :
                                proposal.status === 1 ? 'Funded' : 'Rejected'
                              } 
                            />
                          </div>
                          <span className="text-sm font-medium text-grey-900">
                            {formatAPT(proposal.requestedAmount)} APT
                          </span>
                        </div>
                        <div className="text-sm text-grey-600 mb-2">
                          To: {proposal.recipient.slice(0, 10)}...{proposal.recipient.slice(-8)}
                        </div>
                        <div className="flex justify-between text-xs text-grey-500">
                          <span>Yes: {proposal.yesVotes}</span>
                          <span>No: {proposal.noVotes}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-grey-400 mx-auto mb-4" />
                    <p className="text-grey-500">No proposals yet</p>
                    <Link
                      to="/proposals/create"
                      className="text-grey-700 hover:text-grey-900 text-sm font-medium mt-2 inline-block"
                    >
                      Create the first proposal
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
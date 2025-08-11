import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Search, 
  Filter, 
  Plus, 
  FileText,
  Clock,
  TrendingUp,
  Users
} from 'lucide-react';
import { useDAO } from '../hooks/useDAO';
import { useWallet } from '../contexts/WalletContext';
import { formatAPT } from '../config/aptos';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { ProposalStatus } from '../types/dao';

const ProposalsList: React.FC = () => {
  const { wallet } = useWallet();
  const { proposals, proposalsLoading } = useDAO();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | ProposalStatus>('All');

  // Filter proposals
  const filteredProposals = proposals.filter(proposal => {
    const matchesSearch = proposal.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         proposal.id.toString().includes(searchTerm);
    
    const status: ProposalStatus = proposal.status === 0 ? 'Open' :
                                  proposal.status === 1 ? 'Funded' : 'Rejected';
    const matchesStatus = statusFilter === 'All' || status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getProgressPercentage = (yesVotes: number, noVotes: number) => {
    const total = yesVotes + noVotes;
    return total > 0 ? (yesVotes / total) * 100 : 0;
  };

  return (
    <div className="min-h-screen bg-grey-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-grey-900 mb-2">Investment Proposals</h1>
            <p className="text-grey-600">
              Review and vote on funding proposals from the community
            </p>
          </div>
          {wallet.connected && (
            <Link
              to="/proposals/create"
              className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-grey-800 transition-colors duration-200 mt-4 md:mt-0"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Proposal
            </Link>
          )}
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border border-grey-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by recipient address or proposal ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-grey-300 rounded-lg focus:ring-2 focus:ring-grey-500 focus:border-grey-500 outline-none transition-colors duration-200"
                />
              </div>
            </div>
            
            {/* Status Filter */}
            <div className="md:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400 w-5 h-5" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'All' | ProposalStatus)}
                  className="w-full pl-10 pr-4 py-2 border border-grey-300 rounded-lg focus:ring-2 focus:ring-grey-500 focus:border-grey-500 outline-none transition-colors duration-200 appearance-none bg-white"
                >
                  <option value="All">All Status</option>
                  <option value="Open">Open</option>
                  <option value="Funded">Funded</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-grey-200">
            <span className="text-sm text-grey-600">
              {filteredProposals.length} of {proposals.length} proposals
            </span>
            <div className="flex items-center space-x-4 text-sm text-grey-500">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-grey-700 rounded-full mr-2"></div>
                <span>Open</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-grey-200 rounded-full mr-2"></div>
                <span>Funded</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-grey-400 rounded-full mr-2"></div>
                <span>Rejected</span>
              </div>
            </div>
          </div>
        </div>

        {/* Proposals List */}
        {proposalsLoading ? (
          <div className="bg-white rounded-lg border border-grey-200 p-8">
            <div className="flex justify-center">
              <LoadingSpinner size="lg" />
            </div>
            <p className="text-center text-grey-600 mt-4">Loading proposals...</p>
          </div>
        ) : filteredProposals.length === 0 ? (
          <div className="bg-white rounded-lg border border-grey-200 p-12 text-center">
            <FileText className="w-16 h-16 text-grey-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-grey-900 mb-2">
              {proposals.length === 0 ? 'No proposals yet' : 'No matching proposals'}
            </h3>
            <p className="text-grey-600 mb-6">
              {proposals.length === 0 
                ? 'Be the first to create a proposal and request funding from the treasury.'
                : 'Try adjusting your search criteria to find more proposals.'
              }
            </p>
            {wallet.connected && proposals.length === 0 && (
              <Link
                to="/proposals/create"
                className="inline-flex items-center px-6 py-3 bg-black text-white rounded-lg hover:bg-grey-800 transition-colors duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create First Proposal
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProposals.map((proposal) => {
              const status: ProposalStatus = proposal.status === 0 ? 'Open' :
                                           proposal.status === 1 ? 'Funded' : 'Rejected';
              const totalVotes = proposal.yesVotes + proposal.noVotes;
              const yesPercentage = getProgressPercentage(proposal.yesVotes, proposal.noVotes);
              
              return (
                <Link
                  key={proposal.id}
                  to={`/proposals/${proposal.id}`}
                  className="block bg-white rounded-lg border border-grey-200 hover:border-grey-300 hover:shadow-md transition-all duration-200 p-6"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div className="flex items-center space-x-4 mb-4 md:mb-0">
                      <div className="text-2xl font-bold text-grey-500">
                        #{proposal.id}
                      </div>
                      <StatusBadge status={status} />
                      <div className="text-lg font-semibold text-grey-900">
                        {formatAPT(proposal.requestedAmount)} APT
                      </div>
                    </div>
                    <div className="flex items-center text-sm text-grey-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {status === 'Open' ? 'Voting Active' : 'Voting Closed'}
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center text-sm text-grey-600 mb-2">
                      <Users className="w-4 h-4 mr-2" />
                      Recipient: {proposal.recipient.slice(0, 20)}...{proposal.recipient.slice(-10)}
                    </div>
                  </div>
                  
                  {/* Voting Progress */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-grey-600">Voting Progress</span>
                      <span className="text-grey-900 font-medium">
                        {totalVotes} total votes
                      </span>
                    </div>
                    
                    <div className="w-full bg-grey-200 rounded-full h-2">
                      <div 
                        className="bg-grey-800 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${yesPercentage}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <div className="flex items-center">
                        <TrendingUp className="w-4 h-4 text-grey-600 mr-1" />
                        <span className="text-grey-600">
                          Yes: {proposal.yesVotes} ({totalVotes > 0 ? Math.round(yesPercentage) : 0}%)
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-grey-600">
                          No: {proposal.noVotes} ({totalVotes > 0 ? Math.round(100 - yesPercentage) : 0}%)
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProposalsList;
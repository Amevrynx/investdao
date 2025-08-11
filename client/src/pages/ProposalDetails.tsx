import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  ThumbsUp, 
  ThumbsDown, 
  Users, 
  Calendar,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  Target,
  ExternalLink
} from 'lucide-react';
import { useDAO } from '../hooks/useDAO';
import { useWallet } from '../contexts/WalletContext';
import { formatAPT } from '../config/aptos';
import LoadingSpinner from '../components/LoadingSpinner';
import StatusBadge from '../components/StatusBadge';
import { ProposalStatus } from '../types/dao';
import toast from 'react-hot-toast';

const ProposalDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const { 
    proposals, 
    memberTokens,
    voteProposal, 
    isVoting,
    executeProposal,
    isExecuting,
    proposalsLoading 
  } = useDAO();

  const proposalId = parseInt(id || '0');
  const proposal = proposals.find(p => p.id === proposalId);

  const handleVote = (vote: boolean) => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet to vote');
      return;
    }
    
    if (!memberTokens?.stakedBalance || memberTokens.stakedBalance === 0) {
      toast.error('You need staked tokens to vote');
      return;
    }

    voteProposal({ proposalId, vote });
  };

  const handleExecute = () => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet');
      return;
    }
    
    executeProposal(proposalId);
  };

  if (proposalsLoading) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-grey-600 mt-4">Loading proposal details...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-grey-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-grey-900 mb-2">Proposal Not Found</h2>
          <p className="text-grey-600 mb-4">The requested proposal could not be found.</p>
          <button
            onClick={() => navigate('/proposals')}
            className="inline-flex items-center px-4 py-2 bg-black text-white rounded-lg hover:bg-grey-800 transition-colors duration-200"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Proposals
          </button>
        </div>
      </div>
    );
  }

  const status: ProposalStatus = proposal.status === 0 ? 'Open' :
                                proposal.status === 1 ? 'Funded' : 'Rejected';
  const totalVotes = proposal.yesVotes + proposal.noVotes;
  const yesPercentage = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 0;
  const noPercentage = totalVotes > 0 ? (proposal.noVotes / totalVotes) * 100 : 0;
  const votingPower = memberTokens?.stakedBalance || 0;
  const canVote = wallet.connected && votingPower > 0 && status === 'Open';
  const canExecute = wallet.connected && status === 'Open' && proposal.yesVotes > proposal.noVotes; // Simplified admin check

  return (
    <div className="min-h-screen bg-grey-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/proposals')}
          className="inline-flex items-center text-grey-600 hover:text-grey-900 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Proposals
        </button>

        {/* Proposal Header */}
        <div className="bg-white rounded-lg border border-grey-200 p-8 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <h1 className="text-3xl font-bold text-grey-900">
                Proposal #{proposal.id}
              </h1>
              <StatusBadge status={status} />
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-grey-900 mb-1">
                {formatAPT(proposal.requestedAmount)} APT
              </div>
              <p className="text-grey-600">Funding Requested</p>
            </div>
          </div>

          {/* Recipient Info */}
          <div className="bg-grey-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-grey-600 mb-1">Recipient Address</p>
                <p className="font-mono text-grey-900 break-all">{proposal.recipient}</p>
              </div>
              <button
                onClick={() => window.open(`https://explorer.aptoslabs.com/account/${proposal.recipient}?network=devnet`, '_blank')}
                className="inline-flex items-center text-grey-600 hover:text-grey-900 transition-colors duration-200"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Status Timeline */}
          <div className="border-t border-grey-200 pt-6">
            <h3 className="text-lg font-semibold text-grey-900 mb-4">Proposal Status</h3>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center space-x-2 ${status !== 'Rejected' ? 'text-grey-900' : 'text-grey-400'}`}>
                <div className={`w-3 h-3 rounded-full ${status !== 'Rejected' ? 'bg-grey-900' : 'bg-grey-300'}`} />
                <span className="text-sm font-medium">Created</span>
              </div>
              <div className="flex-1 h-px bg-grey-300" />
              <div className={`flex items-center space-x-2 ${status === 'Open' ? 'text-grey-900' : 'text-grey-400'}`}>
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Voting</span>
              </div>
              <div className="flex-1 h-px bg-grey-300" />
              <div className={`flex items-center space-x-2 ${status === 'Funded' ? 'text-grey-900' : 'text-grey-400'}`}>
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Executed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Voting Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border border-grey-200 p-6 mb-6">
              <h3 className="text-xl font-semibold text-grey-900 mb-6">Voting Results</h3>
              
              {/* Vote Progress Bars */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <ThumbsUp className="w-4 h-4 text-grey-600 mr-2" />
                      <span className="text-sm font-medium text-grey-700">Yes Votes</span>
                    </div>
                    <span className="text-sm text-grey-600">
                      {proposal.yesVotes} ({Math.round(yesPercentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-grey-200 rounded-full h-3">
                    <div 
                      className="bg-grey-800 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${yesPercentage}%` }}
                    />
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <ThumbsDown className="w-4 h-4 text-grey-600 mr-2" />
                      <span className="text-sm font-medium text-grey-700">No Votes</span>
                    </div>
                    <span className="text-sm text-grey-600">
                      {proposal.noVotes} ({Math.round(noPercentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-grey-200 rounded-full h-3">
                    <div 
                      className="bg-grey-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${noPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Voting Summary */}
              <div className="bg-grey-50 rounded-lg p-4 mb-6">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-grey-900">{totalVotes}</div>
                    <div className="text-sm text-grey-600">Total Votes</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-grey-900">
                      {totalVotes > 0 ? Math.round(yesPercentage) : 0}%
                    </div>
                    <div className="text-sm text-grey-600">Approval Rate</div>
                  </div>
                </div>
              </div>

              {/* Voting Actions */}
              {canVote ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-grey-50 rounded-lg">
                    <span className="text-sm text-grey-600">Your voting power:</span>
                    <span className="font-medium text-grey-900">{formatAPT(votingPower)} tokens</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => handleVote(true)}
                      disabled={isVoting}
                      className="flex items-center justify-center px-6 py-3 bg-grey-800 text-white rounded-lg hover:bg-black transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVoting ? (
                        <LoadingSpinner size="sm" color="light" />
                      ) : (
                        <>
                          <ThumbsUp className="w-4 h-4 mr-2" />
                          Vote Yes
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleVote(false)}
                      disabled={isVoting}
                      className="flex items-center justify-center px-6 py-3 bg-grey-500 text-white rounded-lg hover:bg-grey-600 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isVoting ? (
                        <LoadingSpinner size="sm" color="light" />
                      ) : (
                        <>
                          <ThumbsDown className="w-4 h-4 mr-2" />
                          Vote No
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : status === 'Open' ? (
                <div className="text-center p-6 bg-grey-50 rounded-lg">
                  <Target className="w-8 h-8 text-grey-400 mx-auto mb-2" />
                  <p className="text-grey-600 mb-2">
                    {!wallet.connected ? 'Connect your wallet to vote' : 'You need staked tokens to vote'}
                  </p>
                  {wallet.connected && votingPower === 0 && (
                    <button
                      onClick={() => navigate('/stake')}
                      className="text-grey-700 hover:text-grey-900 text-sm font-medium"
                    >
                      Stake tokens to gain voting power
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center p-6 bg-grey-50 rounded-lg">
                  <Clock className="w-8 h-8 text-grey-400 mx-auto mb-2" />
                  <p className="text-grey-600">Voting has ended for this proposal</p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Proposal Stats */}
            <div className="bg-white rounded-lg border border-grey-200 p-6">
              <h3 className="text-lg font-semibold text-grey-900 mb-4">Proposal Info</h3>
              <div className="space-y-4 text-sm">
                <div className="flex justify-between">
                  <span className="text-grey-600">Status:</span>
                  <StatusBadge status={status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-600">Requested:</span>
                  <span className="font-medium text-grey-900">{formatAPT(proposal.requestedAmount)} APT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-600">Total Votes:</span>
                  <span className="font-medium text-grey-900">{totalVotes}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-grey-600">Executed:</span>
                  <span className={`font-medium ${proposal.executed ? 'text-grey-900' : 'text-grey-500'}`}>
                    {proposal.executed ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Actions */}
            {canExecute && (
              <div className="bg-white rounded-lg border border-grey-200 p-6">
                <h3 className="text-lg font-semibold text-grey-900 mb-4">Admin Actions</h3>
                <p className="text-sm text-grey-600 mb-4">
                  This proposal has majority approval and can be executed.
                </p>
                <button
                  onClick={handleExecute}
                  disabled={isExecuting}
                  className="w-full flex items-center justify-center px-4 py-2 bg-black text-white rounded-lg hover:bg-grey-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExecuting ? (
                    <>
                      <LoadingSpinner size="sm" color="light" className="mr-2" />
                      Executing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Execute Proposal
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Participation Stats */}
            <div className="bg-white rounded-lg border border-grey-200 p-6">
              <h3 className="text-lg font-semibold text-grey-900 mb-4">Participation</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <Users className="w-5 h-5 text-grey-600 mr-3" />
                  <div>
                    <div className="font-medium text-grey-900">{totalVotes} voters</div>
                    <div className="text-sm text-grey-600">Have participated</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <TrendingUp className="w-5 h-5 text-grey-600 mr-3" />
                  <div>
                    <div className="font-medium text-grey-900">{Math.round(yesPercentage)}%</div>
                    <div className="text-sm text-grey-600">Approval rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalDetails;
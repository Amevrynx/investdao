// Proposal Categories
export enum ProposalCategory {
  FUNDING = 0,
  GOVERNANCE = 1,
  EMERGENCY = 2
}

// Proposal Status
export enum ProposalStatus {
  OPEN = 0,
  FUNDED = 1,
  REJECTED = 2,
  EXECUTED = 3,
  QUORUM_NOT_MET = 4
}

export interface Proposal {
  id: number;
  title: string;
  category: ProposalCategory;
  recipient: string;
  requestedAmount: number; // in octas
  yesVotes: number;
  noVotes: number;
  status: ProposalStatus;
  votingEndTime: number;
  executed: boolean;
  proposer: string;
}

export interface MemberTokens {
  balance: number;
  stakedBalance: number;
  totalEarned: number;
  proposalsCreated: number;
  votesCast: number;
  reputationScore: number;
}

export interface TreasuryInfo {
  totalFunds: number; // in octas
  proposalCount: number;
  totalGovernanceTokens: number;
  stakedTokens: number;
  paused: boolean;
  admin: string;
}

export interface WalletInfo {
  address: string | null;
  connected: boolean;
  connecting: boolean;
}

export type ProposalStatusString = 'Open' | 'Funded' | 'Rejected' | 'Executed' | 'Quorum Not Met';

export interface Vote {
  proposalId: number;
  vote: boolean;
  voter: string;
  votingPower: number;
  rewardEarned: number;
  timestamp: number;
}

export interface DAOStats {
  totalMembers: number;
  totalProposals: number;
  treasuryBalance: number; // in octas
  activeProposals: number;
  totalStakedTokens: number;
  quorumRequired: number;
  isPaused: boolean;
}

// Enhanced event interfaces
export interface ProposalCreatedEvent {
  proposalId: number;
  proposer: string;
  title: string;
  category: ProposalCategory;
  requestedAmount: number;
  timestamp: number;
}

export interface VoteCastEvent {
  proposalId: number;
  voter: string;
  vote: boolean;
  votingPower: number;
  rewardEarned: number;
  timestamp: number;
}

export interface ProposalExecutedEvent {
  proposalId: number;
  result: 0 | 1 | 2; // 0=Funded, 1=Rejected, 2=QuorumNotMet
  amountTransferred: number;
  timestamp: number;
}

export interface FundsDepositedEvent {
  depositor: string;
  amount: number;
  timestamp: number;
}

export interface TokensStakedEvent {
  staker: string;
  amount: number;
  timestamp: number;
}

export interface TokensDistributedEvent {
  recipient: string;
  amount: number;
  reason: string;
  timestamp: number;
}

export interface EmergencyActionEvent {
  admin: string;
  action: 'PAUSE' | 'UNPAUSE';
  paused: boolean;
  timestamp: number;
}

// Utility interfaces for frontend
export interface VotingPowerInfo {
  baseVotingPower: number; // from staked tokens
  reputationBonus: number; // from reputation score
  totalVotingPower: number;
}

export interface ProposalWithTimeLeft extends Proposal {
  timeLeft: number; // seconds until voting ends
  canExecute: boolean;
  quorumMet: boolean;
  totalVotes: number;
}

export interface MemberProfile {
  address: string;
  tokens: MemberTokens;
  votingPower: VotingPowerInfo;
  memberSince: number;
  isAdmin: boolean;
}

// Helper type for proposal creation form
export interface CreateProposalForm {
  title: string;
  description: string;
  category: ProposalCategory;
  recipient: string;
  requestedAmount: number;
}

// Response types for view functions
export interface GetProposalInfoResponse {
  title: string;
  category: number;
  requestedAmount: number;
  yesVotes: number;
  noVotes: number;
  status: number;
  votingEndTime: number;
  executed: boolean;
  proposer: string;
}

export interface GetMemberInfoResponse {
  balance: number;
  stakedBalance: number;
  totalEarned: number;
  proposalsCreated: number;
  votesCast: number;
  reputationScore: number;
}

export interface GetTreasuryInfoResponse {
  totalFunds: number;
  proposalCount: number;
  totalGovernanceTokens: number;
  stakedTokens: number;
  paused: boolean;
  admin: string;
}

// Constants that match your contract
export const CONTRACT_CONSTANTS = {
  MIN_VOTES: 10,
  VOTING_PERIOD: 604800, // 7 days in seconds
  EXECUTION_DELAY: 86400, // 1 day in seconds
  QUORUM_PERCENTAGE: 20, // 20%
  INITIAL_TOKEN_SUPPLY: 1000000,
  MIN_PROPOSAL_AMOUNT: 1000,
  PARTICIPATION_REWARD: 10,
  WELCOME_BONUS: 100
} as const;

// Helper functions for status conversion
export function getProposalStatusString(status: ProposalStatus): ProposalStatusString {
  switch (status) {
    case ProposalStatus.OPEN:
      return 'Open';
    case ProposalStatus.FUNDED:
      return 'Funded';
    case ProposalStatus.REJECTED:
      return 'Rejected';
    case ProposalStatus.EXECUTED:
      return 'Executed';
    case ProposalStatus.QUORUM_NOT_MET:
      return 'Quorum Not Met';
    default:
      return 'Open';
  }
}

export function getCategoryString(category: ProposalCategory): string {
  switch (category) {
    case ProposalCategory.FUNDING:
      return 'Funding';
    case ProposalCategory.GOVERNANCE:
      return 'Governance';
    case ProposalCategory.EMERGENCY:
      return 'Emergency';
    default:
      return 'Funding';
  }
}
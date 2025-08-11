import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aptos, CONTRACT_FUNCTIONS, CONTRACT_VIEWS } from '../config/aptos';
import { useWallet } from '../contexts/WalletContext';
import {Proposal,  MemberTokens, TreasuryInfo, DAOStats,ProposalStatus,ProposalCategory,GetProposalInfoResponse,GetMemberInfoResponse,GetTreasuryInfoResponse } from '../types/dao';
import toast from 'react-hot-toast';

export const useDAO = (daoTreasuryAddress: string = '') => {
  const { wallet, signAndSubmitTransaction } = useWallet();
  const queryClient = useQueryClient();

  // Fetch treasury information
  const { data: treasuryInfo, isLoading: treasuryLoading } = useQuery({
    queryKey: ['treasury', daoTreasuryAddress],
    queryFn: async (): Promise<TreasuryInfo> => {
      const result = await aptos.view({
        payload: {
          function: CONTRACT_VIEWS.GET_TREASURY_INFO,
          functionArguments: [daoTreasuryAddress],
        },
      });
      const response = result as [number, number, number, number, boolean, string];
      return {
        totalFunds: Number(response[0]),
        proposalCount: Number(response[1]),
        totalGovernanceTokens: Number(response[2]),
        stakedTokens: Number(response[3]),
        paused: Boolean(response[4]),
        admin: response[5],
      };
    },
    enabled: !!wallet.connected && !!daoTreasuryAddress,
    refetchInterval: 5000, // Refetch every 5 seconds
  });

  // Fetch member tokens
  const { data: memberTokens, isLoading: tokensLoading } = useQuery({
    queryKey: ['memberTokens', wallet.address],
    queryFn: async (): Promise<MemberTokens> => {
      if (!wallet.address) throw new Error('No wallet connected');
      
      const result = await aptos.view({
        payload: {
          function: CONTRACT_VIEWS.GET_MEMBER_INFO,
          functionArguments: [wallet.address],
        },
      });
      const response = result as [number, number, number, number, number, number];
      return {
        balance: Number(response[0]),
        stakedBalance: Number(response[1]),
        totalEarned: Number(response[2]),
        proposalsCreated: Number(response[3]),
        votesCast: Number(response[4]),
        reputationScore: Number(response[5]),
      };
    },
    enabled: !!wallet.connected && !!wallet.address,
    refetchInterval: 5000,
  });

  // Fetch proposal information
  const fetchProposal = async (proposalId: number): Promise<Proposal> => {
    const result = await aptos.view({
      payload: {
        function: CONTRACT_VIEWS.GET_PROPOSAL_INFO,
        functionArguments: [daoTreasuryAddress, proposalId],
      },
    });
    const response = result as [string, number, number, number, number, number, number, boolean, string];
    
    return {
      id: proposalId,
      title: response[0],
      category: Number(response[1]) as ProposalCategory,
      recipient: '', // Not returned by the view function, would need to be stored separately
      requestedAmount: Number(response[2]),
      yesVotes: Number(response[3]),
      noVotes: Number(response[4]),
      status: Number(response[5]) as ProposalStatus,
      votingEndTime: Number(response[6]),
      executed: Boolean(response[7]),
      proposer: response[8],
    };
  };

  // Fetch all proposals
  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ['proposals', daoTreasuryAddress],
    queryFn: async (): Promise<Proposal[]> => {
      if (!treasuryInfo) return [];
      
      const proposalPromises = Array.from(
        { length: treasuryInfo.proposalCount }, 
        (_, i) => fetchProposal(i)
      );
      
      return Promise.all(proposalPromises);
    },
    enabled: !!treasuryInfo?.proposalCount && !!wallet.connected && !!daoTreasuryAddress,
    refetchInterval: 10000,
  });

  // Calculate DAO stats
  const daoStats: DAOStats = {
    totalMembers: 0, // This would need additional contract view function
    totalProposals: treasuryInfo?.proposalCount || 0,
    treasuryBalance: treasuryInfo?.totalFunds || 0,
    activeProposals: proposals.filter(p => p.status === ProposalStatus.OPEN).length,
    totalStakedTokens: treasuryInfo?.stakedTokens || 0,
    quorumRequired: Math.floor((treasuryInfo?.stakedTokens || 0) * 0.2), // 20% quorum
    isPaused: treasuryInfo?.paused || false,
  };

  // Join DAO mutation
  const joinDAOMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        function: CONTRACT_FUNCTIONS.JOIN_DAO,
        arguments: [],
      };
      return signAndSubmitTransaction(payload);
    },
    onSuccess: () => {
      toast.success('Successfully joined the DAO!');
      queryClient.invalidateQueries({ queryKey: ['memberTokens'] });
    },
    onError: (error) => {
      toast.error('Failed to join DAO');
      console.error(error);
    },
  });

  // Stake tokens mutation
  const stakeTokensMutation = useMutation({
    mutationFn: async (amount: number) => {
      const payload = {
        function: CONTRACT_FUNCTIONS.STAKE_TOKENS,
        arguments: [daoTreasuryAddress, amount],
      };
      return signAndSubmitTransaction(payload);
    },
    onSuccess: () => {
      toast.success('Tokens staked successfully!');
      queryClient.invalidateQueries({ queryKey: ['memberTokens'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
    },
    onError: (error) => {
      toast.error('Failed to stake tokens');
      console.error(error);
    },
  });

  // Deposit funds mutation
  const depositFundsMutation = useMutation({
    mutationFn: async (amount: number) => {
      const payload = {
        function: CONTRACT_FUNCTIONS.DEPOSIT_FUNDS,
        arguments: [daoTreasuryAddress, amount],
      };
      return signAndSubmitTransaction(payload);
    },
    onSuccess: () => {
      toast.success('Funds deposited successfully!');
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
    },
    onError: (error) => {
      toast.error('Failed to deposit funds');
      console.error(error);
    },
  });

  // Create proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: async ({ 
      title, 
      description, 
      category, 
      recipient, 
      requestedAmount 
    }: { 
      title: string; 
      description: string; 
      category: ProposalCategory; 
      recipient: string; 
      requestedAmount: number;
    }) => {
      const payload = {
        function: CONTRACT_FUNCTIONS.CREATE_PROPOSAL,
        arguments: [daoTreasuryAddress, title, description, category, recipient, requestedAmount],
      };
      return signAndSubmitTransaction(payload);
    },
    onSuccess: () => {
      toast.success('Proposal created successfully!');
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
    },
    onError: (error) => {
      toast.error('Failed to create proposal');
      console.error(error);
    },
  });

  // Vote on proposal mutation
  const voteProposalMutation = useMutation({
    mutationFn: async ({ proposalId, vote }: { proposalId: number; vote: boolean }) => {
      const payload = {
        function: CONTRACT_FUNCTIONS.VOTE_PROPOSAL,
        arguments: [daoTreasuryAddress, proposalId, vote],
      };
      return signAndSubmitTransaction(payload);
    },
    onSuccess: () => {
      toast.success('Vote submitted successfully!');
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
    onError: (error) => {
      toast.error('Failed to submit vote');
      console.error(error);
    },
  });

  // Execute proposal mutation
  const executeProposalMutation = useMutation({
    mutationFn: async (proposalId: number) => {
      const payload = {
        function: CONTRACT_FUNCTIONS.EXECUTE_PROPOSAL,
        arguments: [daoTreasuryAddress, proposalId],
      };
      return signAndSubmitTransaction(payload);
    },
    onSuccess: () => {
      toast.success('Proposal executed successfully!');
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
    },
    onError: (error) => {
      toast.error('Failed to execute proposal');
      console.error(error);
    },
  });

  return {
    // Data
    treasuryInfo,
    memberTokens,
    proposals,
    daoStats,
    
    // Loading states
    treasuryLoading,
    tokensLoading,
    proposalsLoading,
    
    // Mutations
    joinDAO: joinDAOMutation.mutate,
    stakeTokens: stakeTokensMutation.mutate,
    depositFunds: depositFundsMutation.mutate,
    createProposal: createProposalMutation.mutate,
    voteProposal: voteProposalMutation.mutate,
    executeProposal: executeProposalMutation.mutate,
    
    // Mutation states
    isJoining: joinDAOMutation.isPending,
    isStaking: stakeTokensMutation.isPending,
    isDepositing: depositFundsMutation.isPending,
    isCreatingProposal: createProposalMutation.isPending,
    isVoting: voteProposalMutation.isPending,
    isExecuting: executeProposalMutation.isPending,
    
    // Utilities
    fetchProposal,
  };
};
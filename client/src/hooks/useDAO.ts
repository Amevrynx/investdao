import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { aptos, CONTRACT_FUNCTIONS, CONTRACT_VIEWS } from '../config/aptos';
import { useWallet } from '../contexts/WalletContext';
import { Proposal, MemberTokens, TreasuryInfo, DAOStats, ProposalStatus, ProposalCategory } from '../types/dao';
import toast from 'react-hot-toast';

// Helper: for Move API always pass numbers as string!
export const useDAO = (daoTreasuryAddress: string) => {
  const { wallet, signAndSubmitTransaction } = useWallet();
  const queryClient = useQueryClient();

  // ---- DAO Treasury Info ----
  const { data: treasuryInfo, isLoading: treasuryLoading } = useQuery({
    queryKey: ['treasury', daoTreasuryAddress],
    queryFn: async (): Promise<TreasuryInfo | null> => {
      if (!daoTreasuryAddress) return null;
      try {
        const result = await aptos.view({
          payload: {
            function: CONTRACT_VIEWS.GET_TREASURY_INFO,
            functionArguments: [daoTreasuryAddress],
          },
        });
        // (u64, u64, u64, u64, bool, address)
        const response = result as [string, string, string, string, boolean, string];
        return {
          totalFunds: Number(response[0]),
          proposalCount: Number(response[1]),
          totalGovernanceTokens: Number(response[2]),
          stakedTokens: Number(response[3]),
          paused: Boolean(response[4]),
          admin: response[5],
        };
      } catch (error: any) {
        if (
          error?.response?.data?.error_code === 'invalid_input' &&
          error?.response?.data?.vm_error_code === 4008
        ) {
          return null; // Resource does not exist at this address
        }
        console.error(error?.response?.data || error);
        throw error;
      }
    },
    enabled: !!wallet.connected && !!daoTreasuryAddress,
    refetchInterval: 5000,
  });

  // ---- Member info ----
  const { data: memberTokens, isLoading: tokensLoading } = useQuery({
    queryKey: ['memberTokens', wallet.address],
    queryFn: async (): Promise<MemberTokens | null> => {
      if (!wallet.address) return null;
      try {
        const result = await aptos.view({
          payload: {
            function: CONTRACT_VIEWS.GET_MEMBER_INFO,
            functionArguments: [wallet.address],
          },
        });
        // (u64, u64, u64, u64, u64, u64)
        const response = result as [string, string, string, string, string, string];
        return {
          balance: Number(response[0]),
          stakedBalance: Number(response[1]),
          totalEarned: Number(response[2]),
          proposalsCreated: Number(response[3]),
          votesCast: Number(response[4]),
          reputationScore: Number(response[5]),
        };
      } catch (error: any) {
        if (
          error?.response?.data?.error_code === 'invalid_input' &&
          error?.response?.data?.vm_error_code === 4008
        ) {
          return null; // Resource does not exist for this member
        }
        console.error(error?.response?.data || error);
        throw error;
      }
    },
    enabled: !!wallet.connected && !!wallet.address,
    refetchInterval: 5000,
  });

  // ---- Fetch a proposal ----
  const fetchProposal = async (proposalId: number): Promise<Proposal | null> => {
    try {
      const result = await aptos.view({
        payload: {
          function: CONTRACT_VIEWS.GET_PROPOSAL_INFO,
          functionArguments: [daoTreasuryAddress, proposalId.toString()],
        },
      });
      const response = result as [string, number, string, string, string, number, string, boolean, string];
      return {
        id: proposalId,
        title: response[0],
        category: Number(response[1]) as ProposalCategory,
        recipient: '', // Placeholder, as it's not in this view
        requestedAmount: Number(response[2]),
        yesVotes: Number(response[3]),
        noVotes: Number(response[4]),
        status: Number(response[5]) as ProposalStatus,
        votingEndTime: Number(response[6]),
        executed: Boolean(response[7]),
        proposer: response[8],
      };
    } catch (error: any) {
      if (
        error?.response?.data?.error_code === 'invalid_input' &&
        error?.response?.data?.vm_error_code === 4008
      ) {
        return null;
      }
      console.error(error?.response?.data || error);
      throw error;
    }
  };

  // ---- View function: Get recipient details for a proposal ----
  const getRecipientDetails = async (proposalId: number): Promise<{ recipient: string; requestedAmount: number } | null> => {
    try {
      const result = await aptos.view({
        payload: {
          function: CONTRACT_VIEWS.GET_RECIPIENT_DETAILS,
          functionArguments: [daoTreasuryAddress, proposalId.toString()],
        },
      });
      const response = result as [string, string];
      return {
        recipient: response[0],
        requestedAmount: Number(response[1]),
      };
    } catch (error: any) {
      if (
        error?.response?.data?.error_code === 'invalid_input' &&
        error?.response?.data?.vm_error_code === 4008
      ) {
        return null;
      }
      console.error(error?.response?.data || error);
      return null;
    }
  };

  // ---- List all Proposals ----
  const { data: proposals = [], isLoading: proposalsLoading } = useQuery({
    queryKey: ['proposals', daoTreasuryAddress, treasuryInfo?.proposalCount],
    queryFn: async (): Promise<Proposal[]> => {
      if (!treasuryInfo) return [];
      try {
        const proposalPromises = Array.from({ length: treasuryInfo.proposalCount }, (_v, i) =>
          fetchProposal(i)
        );
        const allProposals = await Promise.all(proposalPromises);
        return allProposals.filter(Boolean) as Proposal[];
      } catch (error: any) {
        console.error(error?.response?.data || error);
        return [];
      }
    },
    enabled: !!treasuryInfo?.proposalCount && !!wallet.connected && !!daoTreasuryAddress,
    refetchInterval: 10000,
  });

  // ---- DAO stats (derived) ----
  const daoStats: DAOStats = {
    totalMembers: 0, // Only possible with a dedicated on-chain view!
    totalProposals: treasuryInfo?.proposalCount || 0,
    treasuryBalance: treasuryInfo?.totalFunds || 0,
    activeProposals: proposals.filter(p => p.status === ProposalStatus.OPEN).length,
    totalStakedTokens: treasuryInfo?.stakedTokens || 0,
    quorumRequired: Math.floor((treasuryInfo?.stakedTokens || 0) * 0.2), // 20% quorum based on your contract
    isPaused: treasuryInfo?.paused || false,
  };

  // ----- init DAO ----
  const initDAOMutation = useMutation({
    mutationFn: async (daoSeed: string) => {
      const payload = {
        type: 'entry_function_payload',
        function: CONTRACT_FUNCTIONS.INIT_DAO,
        arguments: [daoSeed],
      };
      return signAndSubmitTransaction(payload);
    },
    onSuccess: () => {
      toast.success('DAO initialized successfully!');
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      queryClient.invalidateQueries({ queryKey: ['memberTokens'] });
    },
    onError: (error) => {
      toast.error('Failed to initialize DAO');
      console.error(error);
    },
  });

  // ---- Join DAO ----
  const joinDAOMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type: 'entry_function_payload',
        function: CONTRACT_FUNCTIONS.JOIN_DAO,
        arguments: [],
        typeArguments: [] // The Move function takes `account: &signer` implicitly
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

  // ---- Transfer Tokens ----
  const transferTokensMutation = useMutation({
    mutationFn: async ({ recipient, amount }: { recipient: string; amount: number }) => {
      const payload = {
        type: 'entry_function_payload',
        function: CONTRACT_FUNCTIONS.TRANSFER_TOKENS,
        arguments: [recipient, amount.toString()],
      };
      return signAndSubmitTransaction(payload);
    },
    onSuccess: () => {
      toast.success('Tokens transferred successfully!');
      queryClient.invalidateQueries({ queryKey: ['memberTokens'] });
    },
    onError: (error) => {
      toast.error('Failed to transfer tokens');
      console.error(error);
    },
  });

  // ---- Distribute Tokens (Admin Only) ----
  const distributeTokensMutation = useMutation({
    mutationFn: async ({ recipient, amount, reason }: { recipient: string; amount: number; reason: string }) => {
      const payload = {
        type: 'entry_function_payload',
        function: CONTRACT_FUNCTIONS.DISTRIBUTE_TOKENS,
        arguments: [daoTreasuryAddress, recipient, amount.toString(), reason],
      };
      return signAndSubmitTransaction(payload);
    },
    onSuccess: () => {
      toast.success('Tokens distributed successfully!');
      queryClient.invalidateQueries({ queryKey: ['memberTokens'] });
    },
    onError: (error) => {
      toast.error('Failed to distribute tokens');
      console.error(error);
    },
  });

  // ---- Stake Tokens ----
  const stakeTokensMutation = useMutation({
    mutationFn: async (amount: number) => {
      const payload = {
        type: 'entry_function_payload',
        function: CONTRACT_FUNCTIONS.STAKE_TOKENS,
        arguments: [daoTreasuryAddress, amount.toString()],
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

  // ---- Deposit Funds ----
  const depositFundsMutation = useMutation({
    mutationFn: async (amount: number) => {
      const payload = {
        type: 'entry_function_payload',
        function: CONTRACT_FUNCTIONS.DEPOSIT_FUNDS,
        arguments: [daoTreasuryAddress, amount.toString()],
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

  // Create Proposal Mutation
  const createProposalMutation = useMutation({
    mutationFn: async ({
      title,
      description,
      category,
      recipient,
      requestedAmount,
    }: {
      title: string;
      description: string;
      category: ProposalCategory;
      recipient: string;
      requestedAmount: number;
    }) => {
      const payload = {
        type: 'entry_function_payload',
        function: CONTRACT_FUNCTIONS.CREATE_PROPOSAL,
        arguments: [
          daoTreasuryAddress,
          title,
          description,
          category,
          recipient,
          requestedAmount.toString(),
        ],
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

  // ---- Vote on Proposal ----
  const voteProposalMutation = useMutation({
    mutationFn: async ({ proposalId, vote }: { proposalId: number; vote: boolean }) => {
      const payload = {
        type: 'entry_function_payload',
        function: CONTRACT_FUNCTIONS.VOTE_PROPOSAL,
        arguments: [daoTreasuryAddress, proposalId.toString(), vote],
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

  // ---- Execute Proposal ----
  const executeProposalMutation = useMutation({
    mutationFn: async (proposalId: number) => {
      const payload = {
        type: 'entry_function_payload',
        function: CONTRACT_FUNCTIONS.EXECUTE_PROPOSAL,
        arguments: [daoTreasuryAddress, proposalId.toString()],
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

  // ---- Emergency Pause (Admin Only) ----
  const emergencyPauseMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type: 'entry_function_payload',
        function: CONTRACT_FUNCTIONS.EMERGENCY_PAUSE,
        arguments: [daoTreasuryAddress],
      };
      return signAndSubmitTransaction(payload);
    },
    onSuccess: () => {
      toast.success('DAO paused successfully!');
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
    },
    onError: (error) => {
      toast.error('Failed to pause DAO');
      console.error(error);
    },
  });

  // ---- Emergency Unpause (Admin Only) ----
  const emergencyUnpauseMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        type: 'entry_function_payload',
        function: CONTRACT_FUNCTIONS.EMERGENCY_UNPAUSE,
        arguments: [daoTreasuryAddress],
      };
      return signAndSubmitTransaction(payload);
    },
    onSuccess: () => {
      toast.success('DAO unpaused successfully!');
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
    },
    onError: (error) => {
      toast.error('Failed to unpause DAO');
      console.error(error);
    },
  });

  //expose all hooks
  return {
    treasuryInfo,
    memberTokens,
    proposals,
    daoStats,
    treasuryLoading,
    tokensLoading,
    proposalsLoading,

    initDAO: initDAOMutation.mutate,
    joinDAO: joinDAOMutation.mutate,
    stakeTokens: stakeTokensMutation.mutate,
    depositFunds: depositFundsMutation.mutate,
    createProposal: createProposalMutation.mutate,
    voteProposal: voteProposalMutation.mutate,
    executeProposal: executeProposalMutation.mutate,
    transferTokens: transferTokensMutation.mutate,
    distributeTokens: distributeTokensMutation.mutate,
    emergencyPause: emergencyPauseMutation.mutate,
    emergencyUnpause: emergencyUnpauseMutation.mutate,

    isInitializing: initDAOMutation.isPending,
    isJoining: joinDAOMutation.isPending,
    isStaking: stakeTokensMutation.isPending,
    isDepositing: depositFundsMutation.isPending,
    isCreatingProposal: createProposalMutation.isPending,
    isVoting: voteProposalMutation.isPending,
    isExecuting: executeProposalMutation.isPending,
    isTransferring: transferTokensMutation.isPending,
    isDistributing: distributeTokensMutation.isPending,
    isPausing: emergencyPauseMutation.isPending,
    isUnpausing: emergencyUnpauseMutation.isPending,

    fetchProposal,
    getRecipientDetails,
  };
};
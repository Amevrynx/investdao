import { Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// Replace this with your actual deployed contract address
export const CONTRACT_ADDRESS = "0x8fe60c1ccd7eaa5c5e48556e99d02531fd7d528428ffedd523aafc2df8dd4abf";
export const MODULE_NAME = "InvestDAO";

const config = new AptosConfig({ network: Network.DEVNET });
export const aptos = new Aptos(config);

// Utility functions for amount conversion
export const formatAPT = (octas: number): string => (octas / 100000000).toFixed(4);
export const toOctas = (apt: number): number => Math.floor(apt * 100000000);
export const formatAddress = (address: string): string => 
  `${address.slice(0, 6)}...${address.slice(-4)}`;

// Format large numbers with commas
export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat().format(num);
};

// Contract function names - matching your Move contract
export const CONTRACT_FUNCTIONS = {
  INITIALIZE_DAO: `${CONTRACT_ADDRESS}::${MODULE_NAME}::initialize_dao`,
  JOIN_DAO: `${CONTRACT_ADDRESS}::${MODULE_NAME}::join_dao`,
  DEPOSIT_FUNDS: `${CONTRACT_ADDRESS}::${MODULE_NAME}::deposit_funds`,
  STAKE_TOKENS: `${CONTRACT_ADDRESS}::${MODULE_NAME}::stake_tokens`,
  TRANSFER_TOKENS: `${CONTRACT_ADDRESS}::${MODULE_NAME}::transfer_tokens`,
  CREATE_PROPOSAL: `${CONTRACT_ADDRESS}::${MODULE_NAME}::create_investment_proposal`,
  VOTE_PROPOSAL: `${CONTRACT_ADDRESS}::${MODULE_NAME}::vote_on_proposal`,
  EXECUTE_PROPOSAL: `${CONTRACT_ADDRESS}::${MODULE_NAME}::execute_proposal`,
  DISTRIBUTE_TOKENS: `${CONTRACT_ADDRESS}::${MODULE_NAME}::distribute_tokens`,
  EMERGENCY_PAUSE: `${CONTRACT_ADDRESS}::${MODULE_NAME}::emergency_pause`,
  EMERGENCY_UNPAUSE: `${CONTRACT_ADDRESS}::${MODULE_NAME}::emergency_unpause`,
} as const;

// Contract view function names - matching your Move contract
export const CONTRACT_VIEWS = {
  GET_PROPOSAL_INFO: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_proposal_info`,
  GET_MEMBER_INFO: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_member_info`,
  GET_TREASURY_INFO: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_treasury_info`,
  GET_VOTING_POWER: `${CONTRACT_ADDRESS}::${MODULE_NAME}::get_voting_power`,
  CALCULATE_QUORUM: `${CONTRACT_ADDRESS}::${MODULE_NAME}::calculate_quorum`,
} as const;

// Network configuration
export const NETWORK_CONFIG = {
  devnet: {
    name: 'Devnet',
    url: 'https://fullnode.devnet.aptoslabs.com/v1',
    faucetUrl: 'https://faucet.devnet.aptoslabs.com',
  },
  testnet: {
    name: 'Testnet', 
    url: 'https://fullnode.testnet.aptoslabs.com/v1',
    faucetUrl: 'https://faucet.testnet.aptoslabs.com',
  },
  mainnet: {
    name: 'Mainnet',
    url: 'https://fullnode.mainnet.aptoslabs.com/v1',
    faucetUrl: null,
  },
} as const;

// Helper function to get account resources
export const getAccountResource = async (
  address: string,
  resourceType: `${string}::${string}::${string}`
) => {
  try {
    return await aptos.getAccountResource({ 
      accountAddress: address, 
      resourceType 
    });
  } catch (error) {
    console.error(`Failed to get resource ${resourceType} for ${address}:`, error);
    return null;
  }
};

// Helper function to check if account exists
export const accountExists = async (address: string): Promise<boolean> => {
  try {
    await aptos.getAccountInfo({ accountAddress: address });
    return true;
  } catch {
    return false;
  }
};

// Helper function to get APT balance
export const getAPTBalance = async (address: string): Promise<number> => {
  try {
    const resource = await aptos.getAccountResource({
      accountAddress: address,
      resourceType: "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>"
    });
    return parseInt((resource.data as any).coin.value);
  } catch (error) {
    console.error('Failed to get APT balance:', error);
    return 0;
  }
};

// Helper function to wait for transaction confirmation
export const waitForTransaction = async (txnHash: string) => {
  try {
    const txn = await aptos.waitForTransaction({ 
      transactionHash: txnHash,
      options: { timeoutSecs: 30 }
    });
    return txn;
  } catch (error) {
    console.error('Transaction failed or timed out:', error);
    throw error;
  }
};
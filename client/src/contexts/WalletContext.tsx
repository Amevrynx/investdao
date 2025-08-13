'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletInfo } from '../types/dao';
import toast from 'react-hot-toast';

// Supported wallets
export enum WalletName {
  PETRA = 'Petra',
  MARTIAN = 'Martian',
  PONTEM = 'Pontem',
  FEWCHA = 'Fewcha'
}

// Gas configuration constants
export const GAS_CONFIG = {
  maxGasAmount: "1000000",     // Increased from 100000 - this was too low
  gasUnitPrice: "100",        // Standard gas price
  expirationBuffer: 600,      // 10 minutes
};

interface WalletContextType {
  wallet: WalletInfo & { name?: WalletName };
  connectWallet: (walletName?: WalletName) => Promise<void>;
  disconnectWallet: () => void;
  signAndSubmitTransaction: (payload: any) => Promise<any>;
  getBalance: () => Promise<number>;
  network: string;
  switchNetwork: (network: 'mainnet' | 'testnet' | 'devnet') => Promise<void>;
  availableWallets: WalletName[];
  isWalletInstalled: (walletName: WalletName) => boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
  defaultNetwork?: 'mainnet' | 'testnet' | 'devnet';
}

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  defaultNetwork = 'devnet',
}) => {
  const [wallet, setWallet] = useState<WalletInfo & { name?: WalletName }>({
    address: null,
    connected: false,
    connecting: false,
    name: undefined,
  });
  const [network, setNetwork] = useState<string>(defaultNetwork);
  const [availableWallets, setAvailableWallets] = useState<WalletName[]>([]);

  const getWalletObject = (walletName: WalletName) => {
    const win = window as any;
    switch (walletName) {
      case WalletName.PETRA: return win.aptos;
      case WalletName.MARTIAN: return win.martian;
      case WalletName.PONTEM: return win.pontem;
      case WalletName.FEWCHA: return win.fewcha;
      default: return win.aptos;
    }
  };

  const isWalletInstalled = (walletName: WalletName) => !!getWalletObject(walletName);

  // Detect wallets once on mount
  useEffect(() => {
    setAvailableWallets(Object.values(WalletName).filter(isWalletInstalled));
  }, []);

  const connectWallet = async (walletName: WalletName = WalletName.PETRA) => {
    setWallet(prev => ({ ...prev, connecting: true }));
    try {
      const walletObj = getWalletObject(walletName);
      if (!walletObj) throw new Error(`${walletName} wallet not found. Please install it.`);

      const response = await walletObj.connect();
      if (response?.address) {
        let currentNetwork = defaultNetwork;
        try {
          const info = await walletObj.network();
          currentNetwork = info?.name?.toLowerCase() || defaultNetwork;
        } catch {
          console.log('Could not fetch network info, using default.');
        }

        setWallet({ address: response.address, connected: true, connecting: false, name: walletName });
        setNetwork(currentNetwork);

        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', response.address);
        localStorage.setItem('walletName', walletName);
        localStorage.setItem('walletNetwork', currentNetwork);

        toast.success(`Connected to ${walletName}`);
        console.log(`Connected to ${walletName}:`, response.address);
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      toast.error(error?.message || 'Failed to connect wallet');
      setWallet(prev => ({ ...prev, connecting: false }));
    }
  };

  const disconnectWallet = async () => {
    try {
      const storedName = localStorage.getItem('walletName') as WalletName | null;
      if (storedName) {
        const walletObj = getWalletObject(storedName);
        if (walletObj?.disconnect) await walletObj.disconnect();
      }
    } catch {
      console.log('Wallet disconnect method unavailable');
    }
    setWallet({ address: null, connected: false, connecting: false, name: undefined });
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletName');
    localStorage.removeItem('walletNetwork');
    toast.success('Wallet disconnected');
  };

  // Enhanced signAndSubmitTransaction with proper gas configuration
  const signAndSubmitTransaction = async (payload: any) => {
    const storedName = (wallet.name || (localStorage.getItem('walletName') as WalletName)) || WalletName.PETRA;
    const walletObj = getWalletObject(storedName);
    
    if (!walletObj || !wallet.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      console.log('Original payload:', payload);
      
      // Create enhanced payload with proper gas settings
      const enhancedPayload = {
        type: payload.type || 'entry_function_payload',
        function: payload.function,
        arguments: payload.arguments || [],
        type_arguments: payload.type_arguments || [],
      };

      // Add transaction options with proper gas settings
      const transactionOptions = {
        max_gas_amount: GAS_CONFIG.maxGasAmount,
        gas_unit_price: GAS_CONFIG.gasUnitPrice,
        expiration_timestamp_secs: (Math.floor(Date.now() / 1000) + GAS_CONFIG.expirationBuffer).toString(),
        sequence_number: undefined, // Let wallet handle this
      };

      console.log('Enhanced payload:', enhancedPayload);
      console.log('Transaction options:', transactionOptions);

      // Different wallets might have different interfaces
      let response;
      
      if (storedName === WalletName.PETRA) {
        // For Petra wallet
        response = await walletObj.signAndSubmitTransaction({
          ...enhancedPayload,
          options: transactionOptions
        });
      } else {
        // For other wallets, try the direct approach
        response = await walletObj.signAndSubmitTransaction(enhancedPayload, transactionOptions);
      }

      console.log('Transaction response:', response);
      
      if (response?.hash) {
        toast.success(`Transaction submitted: ${response.hash.slice(0, 8)}...`);
        
        // Optional: Wait for transaction confirmation
        try {
          await waitForTransaction(response.hash);
          toast.success('Transaction confirmed!');
        } catch (confirmError) {
          console.warn('Transaction confirmation check failed:', confirmError);
          // Don't throw error here as transaction might still be processing
        }
      }
      
      return response;
      
    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      // Handle specific error types
      if (error.message?.includes('MAX_GAS_UNITS_BELOW_MIN')) {
        toast.error('Gas limit too low. Please try again.');
        throw new Error('Gas limit insufficient');
      } else if (error.message?.includes('INSUFFICIENT_BALANCE')) {
        toast.error('Insufficient balance for transaction');
        throw new Error('Insufficient balance');
      } else if (error.message?.includes('SEQUENCE_NUMBER')) {
        toast.error('Transaction sequence error. Please try again.');
        throw new Error('Sequence number error');
      } else {
        toast.error(error?.message || 'Transaction failed');
      }
      
      throw error;
    }
  };

  // Helper function to wait for transaction confirmation
  const waitForTransaction = async (txnHash: string): Promise<void> => {
    const apiUrl = getNetworkApiUrl();
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds max wait
    
    while (attempts < maxAttempts) {
      try {
        const response = await fetch(`${apiUrl}/v1/transactions/by_hash/${txnHash}`);
        if (response.ok) {
          const txn = await response.json();
          if (txn.success !== undefined) {
            if (txn.success) {
              return; // Transaction confirmed successfully
            } else {
              throw new Error(`Transaction failed: ${txn.vm_status || 'Unknown error'}`);
            }
          }
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      } catch (error) {
        console.warn('Error checking transaction status:', error);
        break;
      }
    }
  };

  // Get the appropriate API URL for the current network
  const getNetworkApiUrl = (): string => {
    switch (network) {
      case 'mainnet':
        return 'https://fullnode.mainnet.aptoslabs.com';
      case 'testnet':
        return 'https://fullnode.testnet.aptoslabs.com';
      case 'devnet':
      default:
        return 'https://fullnode.devnet.aptoslabs.com';
    }
  };

  const getBalance = async () => {
    if (!wallet.connected || !wallet.address) return 0;
    try {
      const storedName = (wallet.name || (localStorage.getItem('walletName') as WalletName)) || WalletName.PETRA;
      const walletObj = getWalletObject(storedName);
      if (walletObj?.account) {
        const info = await walletObj.account();
        return parseInt(info.balance || '0');
      }
      
      // API fallback with proper network URL
      const apiUrl = getNetworkApiUrl();
      if (!wallet.address) {
        toast.error('WAllet address invalid or not connected');
      }
      const res = await fetch(
        `${apiUrl}/v1/accounts/${wallet.address}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`
      );
      if (res.ok) {
        const data = await res.json();
        return parseInt(data.data.coin.value);
      }
      return 0;
    } catch (err) {
      console.error('Balance fetch failed:', err);
      return 0;
    }
  };

  const switchNetwork = async (target: 'mainnet' | 'testnet' | 'devnet'): Promise<void> => {
    const storedName = (wallet.name || (localStorage.getItem('walletName') as WalletName)) || WalletName.PETRA;
    const walletObj = getWalletObject(storedName);
    if (!walletObj) {
      toast.error('No wallet connected');
      return;
    }
    try {
      if (walletObj.changeNetwork) {
        await walletObj.changeNetwork(target);
        setNetwork(target);
        localStorage.setItem('walletNetwork', target);
        toast.success(`Switched to ${target}`);
      } else {
        toast.error('Wallet does not support network switching');
      }
    } catch (e: any) {
      toast.error(`Network switch failed: ${e?.message || 'Unknown error'}`);
    }
  };

  // Auto-connect
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('walletConnected');
      const savedAddress = localStorage.getItem('walletAddress');
      const savedName = localStorage.getItem('walletName') as WalletName | null;
      const savedNetwork = localStorage.getItem('walletNetwork');
      if (wasConnected && savedAddress && savedName) {
        const walletObj = getWalletObject(savedName);
        if (walletObj) {
          let stillConnected = true;
          if (walletObj.isConnected) {
            try { 
              stillConnected = await walletObj.isConnected(); 
            } catch { 
              stillConnected = false; 
            }
          }
          if (stillConnected) {
            setWallet({ address: savedAddress, connected: true, connecting: false, name: savedName });
            if (savedNetwork) setNetwork(savedNetwork);
            console.log(`Auto-connected to ${savedName}`);
          } else {
            localStorage.clear();
          }
        }
      }
    };
    const t = setTimeout(autoConnect, 500);
    return () => clearTimeout(t);
  }, []);

  // Basic Petra events (others could be added similarly)
  useEffect(() => {
    const w: any = window;
    const handleAccountChange = (acc: any) => {
      if (acc?.address) {
        setWallet(prev => ({ ...prev, address: acc.address, connected: true }));
        localStorage.setItem('walletAddress', acc.address);
        toast('Account changed');
      } else {
        disconnectWallet();
      }
    };
    const handleNetworkChange = (net: any) => {
      const netName = net?.name?.toLowerCase() || net;
      if (netName && netName !== network) {
        setNetwork(netName);
        localStorage.setItem('walletNetwork', netName);
        toast(`Network changed to ${netName}`);
      }
    };
    if (w.aptos?.onAccountChange) w.aptos.onAccountChange(handleAccountChange);
    if (w.aptos?.onNetworkChange) w.aptos.onNetworkChange(handleNetworkChange);
    if (w.aptos?.onDisconnect) w.aptos.onDisconnect(disconnectWallet);
    return () => {
      if (w.aptos?.removeAllListeners) w.aptos.removeAllListeners();
    };
  }, [network]);

  return (
    <WalletContext.Provider
      value={{
        wallet,
        connectWallet,
        disconnectWallet,
        signAndSubmitTransaction,
        getBalance,
        network,
        switchNetwork,
        availableWallets,
        isWalletInstalled
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used within WalletProvider');
  return ctx;
};
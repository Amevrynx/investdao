import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { WalletInfo } from '../types/dao';
import toast from 'react-hot-toast';

// Supported wallet types
export enum WalletName {
  PETRA = 'Petra',
  MARTIAN = 'Martian',
  PONTEM = 'Pontem',
  FEWCHA = 'Fewcha'
}

interface WalletContextType {
  wallet: WalletInfo;
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
  defaultNetwork = 'devnet' 
}) => {
  const [wallet, setWallet] = useState<WalletInfo>({
    address: null,
    connected: false,
    connecting: false,
  });
  
  const [network, setNetwork] = useState<string>(defaultNetwork);

  // Get wallet object by name
  const getWalletObject = (walletName: WalletName) => {
    const windowAny = window as any;
    
    switch (walletName) {
      case WalletName.PETRA:
        return windowAny.aptos;
      case WalletName.MARTIAN:
        return windowAny.martian;
      case WalletName.PONTEM:
        return windowAny.pontem;
      case WalletName.FEWCHA:
        return windowAny.fewcha;
      default:
        return windowAny.aptos;
    }
  };

  // Check if wallet is installed
  const isWalletInstalled = (walletName: WalletName): boolean => {
    const walletObj = getWalletObject(walletName);
    return !!walletObj;
  };

  // Get available wallets
  const availableWallets: WalletName[] = Object.values(WalletName).filter(walletName => 
    isWalletInstalled(walletName)
  );

  const connectWallet = async (walletName: WalletName = WalletName.PETRA) => {
    setWallet(prev => ({ ...prev, connecting: true }));
    
    try {
      const walletObj = getWalletObject(walletName);
      
      if (!walletObj) {
        throw new Error(`${walletName} wallet not found. Please install the extension.`);
      }

      // Connect to wallet
      const response = await walletObj.connect();
      
      if (response.address) {
        // Get network info if available
        let currentNetwork = defaultNetwork;
        try {
          const networkInfo = await walletObj.network();
          currentNetwork = networkInfo?.name?.toLowerCase() || defaultNetwork;
        } catch (e) {
          console.log('Could not get network info, using default');
        }

        setWallet({
          address: response.address,
          connected: true,
          connecting: false,
        });
        
        setNetwork(currentNetwork);
        
        toast.success(`Connected to ${walletName} wallet`);
        localStorage.setItem('walletConnected', 'true');
        localStorage.setItem('walletAddress', response.address);
        localStorage.setItem('walletName', walletName);
        localStorage.setItem('walletNetwork', currentNetwork);
      }
    } catch (error: any) {
      console.error('Wallet connection failed:', error);
      
      // Handle specific error cases
      if (error.code === 4001) {
        toast.error('Connection rejected by user');
      } else if (error.message?.includes('not found')) {
        toast.error(`${walletName} wallet not installed`);
      } else {
        toast.error(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
      }
      
      setWallet(prev => ({ ...prev, connecting: false }));
    }
  };

  const disconnectWallet = async () => {
    try {
      // Try to disconnect from the wallet if it supports it
      const walletName = localStorage.getItem('walletName') as WalletName;
      if (walletName) {
        const walletObj = getWalletObject(walletName);
        if (walletObj?.disconnect) {
          await walletObj.disconnect();
        }
      }
    } catch (error) {
      console.log('Wallet disconnect method not available');
    }

    setWallet({
      address: null,
      connected: false,
      connecting: false,
    });
    
    localStorage.removeItem('walletConnected');
    localStorage.removeItem('walletAddress');
    localStorage.removeItem('walletName');
    localStorage.removeItem('walletNetwork');
    
    toast.success('Wallet disconnected');
  };

  const signAndSubmitTransaction = async (payload: any) => {
    const walletName = localStorage.getItem('walletName') as WalletName;
    const walletObj = getWalletObject(walletName || WalletName.PETRA);
    
    if (!walletObj || !wallet.connected) {
      throw new Error('Wallet not connected');
    }

    try {
      // Add gas and expiration if not specified
      const enhancedPayload = {
        max_gas_amount: "100000",
        gas_unit_price: "100",
        expiration_timestamp_secs: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        ...payload,
      };

      const response = await walletObj.signAndSubmitTransaction(enhancedPayload);
      
      // Show success toast with transaction hash
      if (response.hash) {
        toast.success(`Transaction submitted: ${response.hash.substring(0, 8)}...`);
      }
      
      return response;
    } catch (error: any) {
      console.error('Transaction failed:', error);
      
      // Handle specific transaction errors
      if (error.code === 4001) {
        toast.error('Transaction rejected by user');
      } else if (error.message?.includes('insufficient')) {
        toast.error('Insufficient funds for transaction');
      } else if (error.message?.includes('gas')) {
        toast.error('Transaction failed due to gas issues');
      } else {
        toast.error(`Transaction failed: ${error.message || 'Unknown error'}`);
      }
      
      throw error;
    }
  };

  const getBalance = async (): Promise<number> => {
    if (!wallet.connected || !wallet.address) {
      return 0;
    }

    try {
      const walletName = localStorage.getItem('walletName') as WalletName;
      const walletObj = getWalletObject(walletName || WalletName.PETRA);
      
      if (walletObj?.account) {
        const accountInfo = await walletObj.account();
        return parseInt(accountInfo.balance || '0');
      }
      
      // Fallback: try to get balance via API
      const response = await fetch(
        `https://fullnode.${network}.aptoslabs.com/v1/accounts/${wallet.address}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`
      );
      
      if (response.ok) {
        const data = await response.json();
        return parseInt(data.data.coin.value);
      }
      
      return 0;
    } catch (error) {
      console.error('Failed to get balance:', error);
      return 0;
    }
  };

  const switchNetwork = async (targetNetwork: 'mainnet' | 'testnet' | 'devnet') => {
    const walletName = localStorage.getItem('walletName') as WalletName;
    const walletObj = getWalletObject(walletName || WalletName.PETRA);
    
    if (!walletObj) {
      toast.error('No wallet connected');
      return;
    }

    try {
      if (walletObj.changeNetwork) {
        await walletObj.changeNetwork(targetNetwork);
        setNetwork(targetNetwork);
        localStorage.setItem('walletNetwork', targetNetwork);
        toast.success(`Switched to ${targetNetwork}`);
      } else {
        toast.error('Wallet does not support network switching');
      }
    } catch (error: any) {
      console.error('Network switch failed:', error);
      toast.error(`Failed to switch network: ${error.message || 'Unknown error'}`);
    }
  };

  // Auto-connect on page load with better error handling
  useEffect(() => {
    const autoConnect = async () => {
      const wasConnected = localStorage.getItem('walletConnected');
      const savedAddress = localStorage.getItem('walletAddress');
      const savedWalletName = localStorage.getItem('walletName') as WalletName;
      const savedNetwork = localStorage.getItem('walletNetwork');
      
      if (wasConnected && savedAddress && savedWalletName) {
        try {
          const walletObj = getWalletObject(savedWalletName);
          
          if (walletObj) {
            // Check if wallet is still connected
            const isStillConnected = walletObj.isConnected ? 
              await walletObj.isConnected() : 
              true; // Assume connected if method doesn't exist
            
            if (isStillConnected) {
              setWallet({
                address: savedAddress,
                connected: true,
                connecting: false,
              });
              
              if (savedNetwork) {
                setNetwork(savedNetwork);
              }
              
              console.log(`Auto-connected to ${savedWalletName}`);
            } else {
              // Clear stale connection
              localStorage.removeItem('walletConnected');
              localStorage.removeItem('walletAddress');
              localStorage.removeItem('walletName');
              localStorage.removeItem('walletNetwork');
            }
          }
        } catch (error) {
          console.error('Auto-connect failed:', error);
          // Clear potentially corrupted data
          localStorage.removeItem('walletConnected');
          localStorage.removeItem('walletAddress');
          localStorage.removeItem('walletName');
          localStorage.removeItem('walletNetwork');
        }
      }
    };

    // Delay auto-connect to ensure wallet extensions are loaded
    const timer = setTimeout(autoConnect, 500);
    return () => clearTimeout(timer);
  }, []);

  // Listen for wallet events
  useEffect(() => {
    const handleAccountChange = (newAccount: any) => {
      if (newAccount?.address !== wallet.address) {
        setWallet(prev => ({
          ...prev,
          address: newAccount?.address || null,
          connected: !!newAccount?.address,
        }));
        
        if (newAccount?.address) {
          localStorage.setItem('walletAddress', newAccount.address);
          toast('Account changed');
        } else {
          disconnectWallet();
        }
      }
    };

    const handleNetworkChange = (newNetwork: any) => {
      const networkName = newNetwork?.name?.toLowerCase() || newNetwork;
      if (networkName && networkName !== network) {
        setNetwork(networkName);
        localStorage.setItem('walletNetwork', networkName);
        toast(`Network changed to ${networkName}`);
      }
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    // Add event listeners for supported wallets
    const windowAny = window as any;
    
    if (windowAny.aptos?.onAccountChange) {
      windowAny.aptos.onAccountChange(handleAccountChange);
    }
    if (windowAny.aptos?.onNetworkChange) {
      windowAny.aptos.onNetworkChange(handleNetworkChange);
    }
    if (windowAny.aptos?.onDisconnect) {
      windowAny.aptos.onDisconnect(handleDisconnect);
    }

    // Cleanup function
    return () => {
      // Remove listeners if wallet supports it
      if (windowAny.aptos?.removeAllListeners) {
        windowAny.aptos.removeAllListeners();
      }
    };
  }, [wallet.address, network]);

  return (
    <WalletContext.Provider value={{
      wallet,
      connectWallet,
      disconnectWallet,
      signAndSubmitTransaction,
      getBalance,
      network,
      switchNetwork,
      availableWallets,
      isWalletInstalled,
    }}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
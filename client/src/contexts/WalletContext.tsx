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

  //used default wallet as petra
  const signAndSubmitTransaction = async (payload: any) => {
    const storedName = (wallet.name || (localStorage.getItem('walletName') as WalletName)) || WalletName.PETRA;
    const walletObj = getWalletObject(storedName);
    if (!walletObj || !wallet.connected) throw new Error('Wallet not connected');

    try {
      const enhanced = {
        max_gas_amount: "100000",
        gas_unit_price: "100",
        expiration_timestamp_secs: Math.floor(Date.now() / 1000) + 600,
        ...payload,
      };
      const resp = await walletObj.signAndSubmitTransaction(enhanced);
      if (resp?.hash) toast.success(`Transaction: ${resp.hash.slice(0, 8)}...`);
      return resp;
    } catch (error: any) {
      console.error('Tx failed:', error);
      toast.error(error?.message || 'Transaction failed');
      throw error;
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
      // API fallback
      const res = await fetch(
        `https://fullnode.${network}.aptoslabs.com/v1/accounts/${wallet.address}/resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>`
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
            try { stillConnected = await walletObj.isConnected(); } catch { stillConnected = false; }
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
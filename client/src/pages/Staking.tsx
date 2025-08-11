import React, { useState } from 'react';
import { 
  Coins, 
  TrendingUp, 
  Target,
  ArrowUp,
  AlertCircle,
  CheckCircle,
  Calculator
} from 'lucide-react';
import { useDAO } from '../hooks/useDAO';
import { useWallet } from '../contexts/WalletContext';
import { formatAPT, toOctas } from '../config/aptos';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const Staking: React.FC = () => {
  const { wallet } = useWallet();
  const { 
    memberTokens, 
    treasuryInfo,
    stakeTokens, 
    isStaking,
    tokensLoading 
  } = useDAO();
  
  const [stakeAmount, setStakeAmount] = useState('');
  const [isCalculating, setIsCalculating] = useState(false);

  const handleStake = () => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet');
      return;
    }

    const amount = parseFloat(stakeAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!memberTokens || toOctas(amount) > memberTokens.balance) {
      toast.error('Insufficient balance');
      return;
    }

    stakeTokens(toOctas(amount));
    setStakeAmount('');
  };

  const handleMaxStake = () => {
    if (memberTokens && memberTokens.balance > 0) {
      setStakeAmount(formatAPT(memberTokens.balance));
    }
  };

  const calculateVotingPower = (amount: string): number => {
    const stakeAmount = parseFloat(amount) || 0;
    const currentStaked = memberTokens ? formatAPT(memberTokens.stakedBalance) : 0;
    return parseFloat(currentStaked.toString()) + stakeAmount;
  };

  const votingPowerIncrease = calculateVotingPower(stakeAmount) - (memberTokens ? parseFloat(formatAPT(memberTokens.stakedBalance)) : 0);

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <Coins className="w-16 h-16 text-grey-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-grey-900 mb-2">Connect Wallet</h2>
          <p className="text-grey-600">Please connect your wallet to access staking features.</p>
        </div>
      </div>
    );
  }

  const currentBalance = memberTokens ? formatAPT(memberTokens.balance) : '0';
  const currentStaked = memberTokens ? formatAPT(memberTokens.stakedBalance) : '0';
  const totalStaked = treasuryInfo ? formatAPT(treasuryInfo.stakedTokens) : '0';
  const stakingPercentage = treasuryInfo && treasuryInfo.stakedTokens > 0 && memberTokens 
    ? (memberTokens.stakedBalance / treasuryInfo.stakedTokens) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-grey-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-900 mb-2">Token Staking</h1>
          <p className="text-grey-600">
            Stake your governance tokens to gain voting power and participate in DAO decisions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Staking Interface */}
          <div className="lg:col-span-2 space-y-6">
            {/* Balance Overview */}
            <div className="bg-white rounded-lg border border-grey-200 p-6">
              <h2 className="text-xl font-semibold text-grey-900 mb-6">Your Balance</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="text-center p-6 bg-grey-50 rounded-lg">
                  <Coins className="w-8 h-8 text-grey-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-grey-900 mb-1">
                    {tokensLoading ? <LoadingSpinner size="sm" /> : `${currentBalance} APT`}
                  </div>
                  <p className="text-sm text-grey-600">Available to Stake</p>
                </div>
                <div className="text-center p-6 bg-grey-50 rounded-lg">
                  <Target className="w-8 h-8 text-grey-600 mx-auto mb-3" />
                  <div className="text-2xl font-bold text-grey-900 mb-1">
                    {tokensLoading ? <LoadingSpinner size="sm" /> : `${currentStaked} APT`}
                  </div>
                  <p className="text-sm text-grey-600">Currently Staked</p>
                </div>
              </div>
            </div>

            {/* Staking Form */}
            <div className="bg-white rounded-lg border border-grey-200 p-6">
              <h2 className="text-xl font-semibold text-grey-900 mb-6">Stake Tokens</h2>
              
              {memberTokens && memberTokens.balance === 0 ? (
                <div className="bg-grey-100 rounded-lg p-6 text-center">
                  <AlertCircle className="w-8 h-8 text-grey-400 mx-auto mb-3" />
                  <h3 className="font-medium text-grey-900 mb-2">No Tokens to Stake</h3>
                  <p className="text-grey-600 text-sm">
                    You need governance tokens to participate in staking. Join the DAO first to receive tokens.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-grey-700 mb-2">
                      Amount to Stake (APT)
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        max={currentBalance}
                        value={stakeAmount}
                        onChange={(e) => setStakeAmount(e.target.value)}
                        placeholder="0.0000"
                        className="w-full px-4 py-3 pr-20 border border-grey-300 rounded-lg focus:ring-2 focus:ring-grey-500 focus:border-grey-500 outline-none transition-colors duration-200"
                        disabled={isStaking}
                      />
                      <button
                        type="button"
                        onClick={handleMaxStake}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 px-3 py-1 text-xs bg-grey-100 text-grey-700 rounded hover:bg-grey-200 transition-colors duration-200"
                        disabled={isStaking}
                      >
                        MAX
                      </button>
                    </div>
                    <p className="text-grey-500 text-sm mt-1">
                      Available: {currentBalance} APT
                    </p>
                  </div>

                  {/* Voting Power Calculator */}
                  {stakeAmount && !isNaN(parseFloat(stakeAmount)) && (
                    <div className="bg-grey-50 rounded-lg p-4 animate-fade-in">
                      <div className="flex items-center mb-3">
                        <Calculator className="w-4 h-4 text-grey-600 mr-2" />
                        <h3 className="font-medium text-grey-900">Voting Power Preview</h3>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-grey-600">Current Voting Power:</span>
                          <span className="font-medium text-grey-900">{currentStaked} tokens</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-grey-600">After Staking:</span>
                          <span className="font-medium text-grey-900">{calculateVotingPower(stakeAmount).toFixed(4)} tokens</span>
                        </div>
                        <div className="flex justify-between text-green-700">
                          <span>Increase:</span>
                          <span className="font-medium">+{votingPowerIncrease.toFixed(4)} tokens</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleStake}
                    disabled={!stakeAmount || isStaking || parseFloat(stakeAmount) <= 0}
                    className="w-full flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-grey-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isStaking ? (
                      <>
                        <LoadingSpinner size="sm" color="light" className="mr-2" />
                        Staking Tokens...
                      </>
                    ) : (
                      <>
                        <ArrowUp className="w-4 h-4 mr-2" />
                        Stake Tokens
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Staking Benefits */}
            <div className="bg-white rounded-lg border border-grey-200 p-6">
              <h3 className="text-lg font-semibold text-grey-900 mb-4">Staking Benefits</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-grey-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-grey-900">Voting Rights</h4>
                    <p className="text-grey-600 text-sm">Participate in governance decisions and vote on investment proposals</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-grey-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-grey-900">Proposal Creation</h4>
                    <p className="text-grey-600 text-sm">Create new investment proposals and request funding from the treasury</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-5 h-5 text-grey-600 mr-3 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-grey-900">Democratic Participation</h4>
                    <p className="text-grey-600 text-sm">Shape the future of the DAO and collective investment strategies</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Sidebar */}
          <div className="space-y-6">
            {/* Your Staking Stats */}
            <div className="bg-white rounded-lg border border-grey-200 p-6">
              <h3 className="text-lg font-semibold text-grey-900 mb-4">Your Statistics</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-grey-600">Voting Power</span>
                  <span className="font-bold text-grey-900">{currentStaked}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-grey-600">Share of Total</span>
                  <span className="font-bold text-grey-900">{stakingPercentage.toFixed(2)}%</span>
                </div>
                <div className="pt-2 border-t border-grey-200">
                  <div className="flex justify-between items-center">
                    <span className="text-grey-600 text-sm">Total Staked by All</span>
                    <span className="font-medium text-grey-700">{totalStaked} APT</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Staking Progress */}
            <div className="bg-white rounded-lg border border-grey-200 p-6">
              <h3 className="text-lg font-semibold text-grey-900 mb-4">Staking Progress</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-grey-600">Your Stake Progress</span>
                    <span className="text-sm font-medium text-grey-900">
                      {memberTokens ? Math.min((memberTokens.stakedBalance / memberTokens.balance * 100) || 0, 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <div className="w-full bg-grey-200 rounded-full h-2">
                    <div 
                      className="bg-grey-800 h-2 rounded-full transition-all duration-500"
                      style={{ 
                        width: `${memberTokens ? Math.min((memberTokens.stakedBalance / memberTokens.balance * 100) || 0, 100) : 0}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-grey-500 mt-1">
                    {currentStaked} of {currentBalance} tokens staked
                  </p>
                </div>
              </div>
            </div>

            {/* Network Stats */}
            <div className="bg-white rounded-lg border border-grey-200 p-6">
              <h3 className="text-lg font-semibold text-grey-900 mb-4">Network Stats</h3>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 text-grey-600 mr-2" />
                    <span className="text-grey-600">Total Staked</span>
                  </div>
                  <span className="font-medium text-grey-900">{totalStaked} APT</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="w-4 h-4 text-grey-600 mr-2" />
                    <span className="text-grey-600">Treasury Balance</span>
                  </div>
                  <span className="font-medium text-grey-900">
                    {treasuryInfo ? formatAPT(treasuryInfo.totalFunds) : '0'} APT
                  </span>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="bg-grey-100 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-4 h-4 text-grey-600 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-grey-900 mb-1">Important Notes</h4>
                  <ul className="text-xs text-grey-600 space-y-1">
                    <li>• Staked tokens give you voting power in the DAO</li>
                    <li>• Currently, unstaking is not available in this version</li>
                    <li>• Your voting power equals your staked token amount</li>
                    <li>• Staking is required to create and vote on proposals</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Staking;
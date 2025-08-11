import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Vote, TrendingUp, Shield, Coins, FileText } from 'lucide-react';
import { useWallet, WalletName } from '../contexts/WalletContext';
import { useDAO } from '../hooks/useDAO';
import { formatAPT } from '../config/aptos';

const Landing: React.FC = () => {
  const { wallet, connectWallet } = useWallet();
  const { daoStats, treasuryInfo } = useDAO();

  const features = [
    {
      icon: Users,
      title: 'Join the Community',
      description: 'Become a member of our decentralized investment community and receive governance tokens.'
    },
    {
      icon: Coins,
      title: 'Stake & Earn',
      description: 'Stake your tokens to gain voting power and participate in governance decisions.'
    },
    {
      icon: FileText,
      title: 'Create Proposals',
      description: 'Submit investment proposals and request funding from the treasury for promising opportunities.'
    },
    {
      icon: Vote,
      title: 'Democratic Voting',
      description: 'Vote on proposals using your staked tokens and help shape the future of our investments.'
    },
    {
      icon: Shield,
      title: 'Secure & Transparent',
      description: 'Built on Aptos blockchain ensuring security, transparency, and immutable governance.'
    },
    {
      icon: TrendingUp,
      title: 'Shared Growth',
      description: 'Benefit from collective investment decisions and shared returns on successful proposals.'
    }
  ];

  const stats = [
    {
      label: 'Treasury Balance',
      value: treasuryInfo ? `${formatAPT(treasuryInfo.totalFunds)} APT` : '0 APT',
      description: 'Total funds available for investment'
    },
    {
      label: 'Active Proposals',
      value: daoStats.activeProposals.toString(),
      description: 'Proposals currently being voted on'
    },
    {
      label: 'Total Proposals',
      value: daoStats.totalProposals.toString(),
      description: 'All proposals submitted to date'
    },
    {
      label: 'Staked Tokens',
      value: treasuryInfo ? formatAPT(treasuryInfo.stakedTokens) : '0',
      description: 'Tokens staked for governance'
    }
  ];

  return (
    <div className="bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="bg-gradient-to-b from-black to-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fade-in">
                Decentralized Investment
                <span className="block text-gray-300">Made Simple</span>
              </h1>
              <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto animate-fade-in">
                Join InvestDAO and participate in collective investment decisions. 
                Stake tokens, vote on proposals, and shape the future of decentralized finance on Aptos.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
                {wallet.connected ? (
                  <Link
                    to="/dashboard"
                    className="inline-flex items-center px-8 py-3 bg-white text-black rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors duration-200"
                  >
                    Go to Dashboard
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                ) : (
                  <button
                    onClick={() => connectWallet(WalletName.PETRA)}
                    className="inline-flex items-center px-8 py-3 bg-white text-black rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors duration-200"
                  >
                    Connect Wallet
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </button>
                )}
                <Link
                  to="/proposals"
                  className="inline-flex items-center px-8 py-3 border-2 border-gray-400 text-gray-200 rounded-lg text-lg font-medium hover:border-gray-300 hover:text-white transition-colors duration-200"
                >
                  View Proposals
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={stat.label} 
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200">
                  <div className="text-3xl font-bold text-black mb-2">{stat.value}</div>
                  <div className="text-lg font-medium text-gray-700 mb-1">{stat.label}</div>
                  <div className="text-sm text-gray-500">{stat.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
              How InvestDAO Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              A transparent and democratic approach to collective investment decisions 
              powered by blockchain technology and community governance.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={feature.title}
                  className="text-center animate-fade-in"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 hover:bg-gray-200 transition-colors duration-200">
                    <Icon className="w-8 h-8 text-gray-700" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-3">{feature.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-black mb-6">
              Simple 4-Step Process
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Getting started with InvestDAO is straightforward and secure
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { step: '01', title: 'Connect Wallet', description: 'Link your Aptos wallet to get started' },
              { step: '02', title: 'Join DAO', description: 'Become a member and receive governance tokens' },
              { step: '03', title: 'Stake Tokens', description: 'Stake tokens to gain voting power' },
              { step: '04', title: 'Participate', description: 'Vote on proposals and create new ones' }
            ].map((item, index) => (
              <div 
                key={item.step}
                className="text-center animate-fade-in"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                <div className="bg-black text-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Investing?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join our growing community of decentralized investors and be part of the future of finance.
          </p>
          {!wallet.connected ? (
            <button
              onClick={() => connectWallet(WalletName.PETRA)}
              disabled={wallet.connecting}
              className="inline-flex items-center px-8 py-4 bg-white text-black rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {wallet.connecting ? (
                <>Connecting...</>
              ) : (
                <>
                  Connect Wallet & Join
                  <ArrowRight className="ml-2 w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <Link
              to="/dashboard"
              className="inline-flex items-center px-8 py-4 bg-white text-black rounded-lg text-lg font-medium hover:bg-gray-100 transition-colors duration-200"
            >
              Go to Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          )}
        </div>
      </section>
    </div>
  );
};

export default Landing;
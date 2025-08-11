import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {Home, LayoutDashboard, FileText, Coins, Vault, Wallet, LogOut, Menu, X } from 'lucide-react';
import { useWallet, WalletName } from '../contexts/WalletContext';
import { formatAddress } from '../config/aptos';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { wallet, connectWallet, disconnectWallet } = useWallet();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Proposals', href: '/proposals', icon: FileText },
    { name: 'Staking', href: '/stake', icon: Coins },
    { name: 'Treasury', href: '/treasury', icon: Vault },
  ];

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation Header */}
      <nav className="bg-black border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and Desktop Navigation */}
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link to="/" className="text-white text-xl font-bold">
                  InvestDAO
                </Link>
              </div>
              <div className="hidden md:ml-6 md:flex md:space-x-8">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                        isActive(item.href)
                          ? 'border-white text-white'
                          : 'border-transparent text-gray-300 hover:border-gray-400 hover:text-gray-200'
                      }`}
                    >
                      <Icon className="w-4 h-4 mr-2" />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Wallet Connection */}
            <div className="flex items-center space-x-4">
              {wallet.connected ? (
                <div className="flex items-center space-x-3">
                  <div className="hidden sm:block">
                    <span className="text-gray-300 text-sm">
                      {formatAddress(wallet.address!)}
                    </span>
                  </div>
                  <button
                    onClick={disconnectWallet}
                    className="inline-flex items-center px-3 py-2 border border-gray-600 rounded-md text-sm font-medium text-gray-300 hover:text-white hover:border-gray-400 transition-colors duration-200"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => connectWallet(WalletName.PETRA)}
                  disabled={wallet.connecting}
                  className="inline-flex items-center px-4 py-2 bg-white text-black rounded-md text-sm font-medium hover:bg-gray-100 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  {wallet.connecting ? 'Connecting...' : 'Connect Wallet'}
                </button>
              )}

              {/* Mobile menu button */}
              <div className="md:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="text-gray-300 hover:text-white p-2"
                >
                  {mobileMenuOpen ? (
                    <X className="w-6 h-6" />
                  ) : (
                    <Menu className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                      isActive(item.href)
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-200">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              © 2025 InvestDAO. A decentralized investment platform on Aptos.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
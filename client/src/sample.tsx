import { useState } from "react";
import { AptosClient } from "aptos";

interface BalanceCheckerPageProps {
  isDarkMode: boolean;
}

const NODE_URL = "https://fullnode.testnet.aptoslabs.com/v1";
const MODULE_ADDRESS = import.meta.env.VITE_MODULE_PUBLISHER_ACCOUNT_ADDRESS;
const MODULE_NAME = "message_board";
const FUNCTION_NAME = "get_user_balance";
const client = new AptosClient(NODE_URL);

export default function BalanceCheckerPage({ isDarkMode }: BalanceCheckerPageProps) {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  async function checkBalanceFun() {
    if (!address) {
      alert("Please enter an address to check balance.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        function: `${MODULE_ADDRESS}::${MODULE_NAME}::${FUNCTION_NAME}`,
        type_arguments: [],
        arguments: [address],
      };

      const response = await client.view(payload);
      const balanceValue = response[0];
      setBalance(balanceValue.toString());
      console.log("Balance retrieved:", balanceValue);
    } catch (error) {
      console.error("Error checking balance:", error);
      if (error instanceof Error && error.message && error.message.includes("function not marked as view function")) {
        alert("The contract function is not properly configured as a view function. Please check the contract deployment.");
      } else {
        alert("Failed to check balance. Please try again.");
      }
      setBalance("");
    }
    setIsLoading(false);
  }

  const formatBalance = (balanceOctas: string) => {
    const balanceNum = parseInt(balanceOctas);
    return (balanceNum / 100000000).toFixed(8) + " APT";
  };

  return (
    <div className={`min-h-screen transition-all duration-500 ${
      isDarkMode 
        ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900' 
        : 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className={`${isDarkMode ? 'bg-gray-800/80' : 'bg-white/80'} backdrop-blur-lg rounded-3xl shadow-2xl p-8 border ${
            isDarkMode ? 'border-gray-700' : 'border-white/20'
          } transition-all duration-500`}>
            <h2 className={`text-2xl font-semibold mb-6 text-center transition-colors duration-500 ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>
              Check Wallet Balance
            </h2>
            
            <div className="mb-6">
              <label className={`block text-sm font-medium mb-2 transition-colors duration-500 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                📍 Address
              </label>
              <input 
                type="text" 
                placeholder="Enter Aptos address (e.g., 0x1234...)" 
                value={address}
                onChange={e => setAddress(e.target.value)}
                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 placeholder-gray-400 font-mono ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'border-gray-300 text-gray-700'
                }`}
              />
            </div>

            <div className="flex gap-4 mb-8">
              <button 
                onClick={checkBalanceFun}
                disabled={isLoading || !address}
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-2xl hover:from-blue-600 hover:to-purple-700 focus:ring-4 focus:ring-blue-300 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Checking...
                  </div>
                ) : (
                  "🔍 Check Balance"
                )}
              </button>
            </div>

            {balance && (
              <div className={`${isDarkMode ? 'bg-green-900/50' : 'bg-green-50'} rounded-2xl p-6 border ${
                isDarkMode ? 'border-green-700' : 'border-green-200'
              } transition-all duration-500`}>
                <div className="text-center">
                  <h3 className={`text-lg font-semibold mb-2 transition-colors duration-500 ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>
                    💰 Wallet Balance
                  </h3>
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {formatBalance(balance)}
                  </div>
                  <p className={`text-sm transition-colors duration-500 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>
                    Raw value: {balance} octas
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
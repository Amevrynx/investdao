import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  FileText, 
  Users, 
  AlertCircle,
  CheckCircle,
  Wallet
} from 'lucide-react';
import { useDAO } from '../hooks/useDAO';
import { useWallet } from '../contexts/WalletContext';
import { formatAPT, toOctas } from '../config/aptos';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';

const CreateProposal: React.FC = () => {
  const navigate = useNavigate();
  const { wallet } = useWallet();
  const { 
    treasuryInfo, 
    memberTokens,
    createProposal, 
    isCreatingProposal 
  } = useDAO();
  
  const [formData, setFormData] = useState({
    recipient: '',
    amount: '',
    description: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Redirect if not connected
  useEffect(() => {
    if (!wallet.connected) {
      toast.error('Please connect your wallet to create proposals');
      navigate('/');
    }
  }, [wallet.connected, navigate]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate recipient address
    if (!formData.recipient.trim()) {
      newErrors.recipient = 'Recipient address is required';
    } else if (!/^0x[a-fA-F0-9]{64}$/.test(formData.recipient)) {
      newErrors.recipient = 'Invalid Aptos address format';
    }

    // Validate amount
    if (!formData.amount.trim()) {
      newErrors.amount = 'Funding amount is required';
    } else {
      const amount = parseFloat(formData.amount);
      if (isNaN(amount) || amount <= 0) {
        newErrors.amount = 'Amount must be a positive number';
      } else if (treasuryInfo && toOctas(amount) > treasuryInfo.totalFunds) {
        newErrors.amount = 'Amount exceeds treasury balance';
      }
    }

    // Validate description
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    if (!memberTokens || memberTokens.balance === 0) {
      toast.error('You must be a DAO member to create proposals');
      return;
    }

    if (showPreview) {
      // Submit the proposal
      const amountInOctas = toOctas(parseFloat(formData.amount));
      createProposal({
        recipient: formData.recipient,
        amount: amountInOctas
      });
    } else {
      // Show preview
      setShowPreview(true);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const resetForm = () => {
    setFormData({ recipient: '', amount: '', description: '' });
    setErrors({});
    setShowPreview(false);
  };

  if (!wallet.connected) {
    return (
      <div className="min-h-screen bg-grey-50 flex items-center justify-center">
        <div className="text-center">
          <Wallet className="w-16 h-16 text-grey-400 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-grey-900 mb-2">Wallet Not Connected</h2>
          <p className="text-grey-600">Please connect your wallet to create proposals.</p>
        </div>
      </div>
    );
  }

  const isMember = memberTokens && memberTokens.balance > 0;
  const treasuryBalance = treasuryInfo ? treasuryInfo.totalFunds : 0;

  return (
    <div className="min-h-screen bg-grey-50">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/proposals')}
          className="inline-flex items-center text-grey-600 hover:text-grey-900 mb-6 transition-colors duration-200"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Proposals
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-grey-900 mb-2">Create Investment Proposal</h1>
          <p className="text-grey-600">
            Submit a funding request to the DAO treasury for community voting
          </p>
        </div>

        {/* Member Check */}
        {!isMember && (
          <div className="bg-grey-100 border border-grey-300 rounded-lg p-6 mb-8">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-grey-600 mr-3" />
              <div>
                <h3 className="font-medium text-grey-900">DAO Membership Required</h3>
                <p className="text-grey-600 text-sm mt-1">
                  You must be a DAO member to create proposals. Join the DAO first to get governance tokens.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Treasury Info */}
        <div className="bg-white rounded-lg border border-grey-200 p-6 mb-8">
          <h3 className="font-semibold text-grey-900 mb-4">Treasury Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-grey-600">Available Balance:</span>
              <div className="font-bold text-grey-900">{formatAPT(treasuryBalance)} APT</div>
            </div>
            <div>
              <span className="text-grey-600">Your Tokens:</span>
              <div className="font-bold text-grey-900">
                {memberTokens ? formatAPT(memberTokens.balance) : '0'} tokens
              </div>
            </div>
          </div>
        </div>

        {/* Proposal Form */}
        <div className="bg-white rounded-lg border border-grey-200 p-8">
          {!showPreview ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <h3 className="text-xl font-semibold text-grey-900 mb-6">Proposal Details</h3>
              
              {/* Recipient Address */}
              <div>
                <label className="block text-sm font-medium text-grey-700 mb-2">
                  Recipient Address *
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-grey-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.recipient}
                    onChange={(e) => handleInputChange('recipient', e.target.value)}
                    placeholder="0x..."
                    className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-grey-500 focus:border-grey-500 outline-none transition-colors duration-200 ${
                      errors.recipient ? 'border-red-300' : 'border-grey-300'
                    }`}
                    disabled={isCreatingProposal}
                  />
                </div>
                {errors.recipient && (
                  <p className="text-red-600 text-sm mt-1">{errors.recipient}</p>
                )}
                <p className="text-grey-500 text-sm mt-1">
                  Enter the Aptos address that will receive the funds
                </p>
              </div>

              {/* Funding Amount */}
              <div>
                <label className="block text-sm font-medium text-grey-700 mb-2">
                  Funding Amount (APT) *
                </label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  max={formatAPT(treasuryBalance)}
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  placeholder="0.0000"
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-grey-500 focus:border-grey-500 outline-none transition-colors duration-200 ${
                    errors.amount ? 'border-red-300' : 'border-grey-300'
                  }`}
                  disabled={isCreatingProposal}
                />
                {errors.amount && (
                  <p className="text-red-600 text-sm mt-1">{errors.amount}</p>
                )}
                <p className="text-grey-500 text-sm mt-1">
                  Maximum available: {formatAPT(treasuryBalance)} APT
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-grey-700 mb-2">
                  Proposal Description *
                </label>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your investment proposal, including purpose, expected returns, timeline, and any relevant details..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-grey-500 focus:border-grey-500 outline-none transition-colors duration-200 resize-none ${
                    errors.description ? 'border-red-300' : 'border-grey-300'
                  }`}
                  disabled={isCreatingProposal}
                />
                {errors.description && (
                  <p className="text-red-600 text-sm mt-1">{errors.description}</p>
                )}
                <p className="text-grey-500 text-sm mt-1">
                  {formData.description.length}/500 characters (minimum 20)
                </p>
              </div>

              {/* Form Actions */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-3 border border-grey-300 text-grey-700 rounded-lg hover:bg-grey-50 transition-colors duration-200"
                  disabled={isCreatingProposal}
                >
                  Reset Form
                </button>
                <button
                  type="submit"
                  disabled={!isMember || isCreatingProposal}
                  className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-grey-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FileText className="w-4 h-4 mr-2 inline" />
                  Preview Proposal
                </button>
              </div>
            </form>
          ) : (
            /* Proposal Preview */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-grey-900">Proposal Preview</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="text-grey-600 hover:text-grey-900 text-sm"
                  disabled={isCreatingProposal}
                >
                  Edit
                </button>
              </div>

              <div className="bg-grey-50 rounded-lg p-6 space-y-4">
                <div>
                  <h4 className="font-medium text-grey-900 mb-2">Recipient</h4>
                  <p className="text-grey-600 font-mono text-sm break-all">{formData.recipient}</p>
                </div>
                <div>
                  <h4 className="font-medium text-grey-900 mb-2">Funding Amount</h4>
                  <p className="text-2xl font-bold text-grey-900">{formData.amount} APT</p>
                </div>
                <div>
                  <h4 className="font-medium text-grey-900 mb-2">Description</h4>
                  <p className="text-grey-600 whitespace-pre-wrap">{formData.description}</p>
                </div>
              </div>

              <div className="bg-grey-100 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-grey-600 mr-3 mt-0.5" />
                  <div>
                    <p className="text-sm text-grey-700 font-medium mb-1">Before submitting:</p>
                    <ul className="text-sm text-grey-600 space-y-1">
                      <li>• Ensure all information is correct and complete</li>
                      <li>• The proposal will be subject to community voting</li>
                      <li>• Funds will be released only if the proposal is approved and executed</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  onClick={() => setShowPreview(false)}
                  className="px-6 py-3 border border-grey-300 text-grey-700 rounded-lg hover:bg-grey-50 transition-colors duration-200"
                  disabled={isCreatingProposal}
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isCreatingProposal}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-black text-white rounded-lg hover:bg-grey-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingProposal ? (
                    <>
                      <LoadingSpinner size="sm" color="light" className="mr-2" />
                      Creating Proposal...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Proposal
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateProposal;
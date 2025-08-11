import React from 'react';
import { ProposalStatus, getProposalStatusString } from '../types/dao';

interface StatusBadgeProps {
  status: ProposalStatus;
  className?: string;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const getStatusStyles = (status: ProposalStatus) => {
    switch (status) {
      case ProposalStatus.OPEN:
        return 'bg-blue-100 text-blue-800 border border-blue-300';
      case ProposalStatus.FUNDED:
        return 'bg-green-100 text-green-800 border border-green-300';
      case ProposalStatus.REJECTED:
        return 'bg-red-100 text-red-800 border border-red-300';
      case ProposalStatus.EXECUTED:
        return 'bg-purple-100 text-purple-800 border border-purple-300';
      case ProposalStatus.QUORUM_NOT_MET:
        return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  return (
    <span className={`
      inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
      ${getStatusStyles(status)}
      ${className}
    `}>
      {getProposalStatusString(status)}
    </span>
  );
};

export default StatusBadge;
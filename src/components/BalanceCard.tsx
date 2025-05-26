import React from 'react';

interface BalanceCardProps {
  balance: number;
  onTopUpClick: () => void;
}

const BalanceCard: React.FC<BalanceCardProps> = ({ balance, onTopUpClick }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h3 className="text-xl font-semibold text-gray-700 mb-2">Saldo Anda</h3>
      <p className="text-[20px] font-normal text-indigo-600 mb-4">
        Rp{balance}
      </p>
      <button
        onClick={onTopUpClick}
        className="w-full bg-blue-400 hover:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg transition duration-150 ease-in-out"
      >
        Top Up Saldo
      </button>
      
    </div>
  );
};

export default BalanceCard;
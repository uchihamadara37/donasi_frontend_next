// components/WithdrawalCard.tsx
import React from 'react';

interface WithdrawalCardProps {
  onWithdrawClick: () => void;
}

const WithdrawalCard: React.FC<WithdrawalCardProps> = ({ onWithdrawClick }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-md mb-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Penarikan Saldo</h3>
      <p className="text-sm text-gray-600 mb-3">Tarik saldo Anda ke rekening bank atau e-wallet.</p>
      <button
        onClick={onWithdrawClick}
        className="w-full bg-orange-500 text-white py-2 px-4 rounded-md hover:bg-orange-600 transition duration-300"
      >
        Tarik Saldo
      </button>
    </div>
  );
};

export default WithdrawalCard;
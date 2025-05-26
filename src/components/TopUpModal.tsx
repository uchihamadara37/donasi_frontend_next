import React, { useState } from 'react';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number) => void;
}

const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleConfirm = () => {
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Masukkan jumlah yang valid.');
      return;
    }
    setError('');
    onConfirm(numAmount);
    setAmount(''); // Reset amount
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-700/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Top Up Saldo</h2>
        <p className="text-sm text-gray-600 mb-1">Masukkan jumlah top up:</p>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Contoh: 50000"
          className="w-full p-2 border border-gray-300 rounded-md mb-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg"
          >
            Konfirmasi
          </button>
        </div>
      </div>
    </div>
  );
};

export default TopUpModal;
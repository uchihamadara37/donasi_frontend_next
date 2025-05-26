import React, { useState } from 'react';
import { UserProfile } from '@/interfaces';

interface DonateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, message: string, recipient: UserProfile) => void;
  recipient: UserProfile | null;
  currentUserBalance: number;
}

const DonateModal: React.FC<DonateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  recipient,
  currentUserBalance,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [pesan, setPesan] = useState<string>('');

  const handleConfirm = () => {
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Masukkan jumlah donasi yang valid.');
      return;
    }
    if (numAmount > currentUserBalance) {
        setError('Saldo tidak mencukupi untuk donasi ini.');
        return;
    }
    if (pesan.length > 100) {
      setError('Pesan tidak boleh lebih dari 100 karakter.');
      return;
    }
    if (recipient) {
      setError('');
      onConfirm(numAmount, pesan, recipient);
      setAmount(''); // Reset amount
      setPesan(''); // Reset pesan
    }
  };

  if (!isOpen || !recipient) return null;

  return (
    <div className="fixed inset-0 bg-slate-700/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-1 text-gray-800">Beri Donasi</h2>
        <p className="text-gray-600 mb-4">
          Anda akan berdonasi kepada <span className="font-semibold">{recipient.name}</span>
        </p>
        <p className="text-sm text-gray-600 mb-1">Masukkan jumlah donasi (Rp):</p>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="Contoh: 10000"
          className="w-full p-2 border border-gray-300 rounded-md mb-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        <textarea
          value={pesan}
          onChange={(e) => setPesan(e.target.value)}
          placeholder="Tuliskan pesan anda ke penerima donasi ...."
          className="w-full p-2 border border-gray-300 rounded-md mb-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
         <p className="text-xs text-gray-500 mb-3">Saldo Anda saat ini: Rp {currentUserBalance}</p>
        <div className="flex justify-end space-x-2 mt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            Batal
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 rounded-lg"
          >
            Donasi Sekarang
          </button>
        </div>
      </div>
    </div>
  );
};

export default DonateModal;
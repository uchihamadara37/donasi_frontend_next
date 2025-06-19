// components/WithdrawalModal.tsx
import React, { useState } from 'react';

interface WithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  // Menambahkan currentPin dari currentUser untuk validasi di frontend (optional, bisa juga sepenuhnya di backend)
  onConfirm: (amount: number, method: string, detail?: string, accountNumber?: string, pin?: string) => void;
  currentBalance: number;
}

type WithdrawalMethod = 'bank_transfer' | 'e_wallet' | null;

const bankOptions = [
  { id: 'bca', name: 'Bank BCA' },
  { id: 'mandiri', name: 'Bank Mandiri' },
  { id: 'bni', name: 'Bank BNI' },
];

const eWalletOptions = [
  { id: 'ovo', name: 'OVO' },
  { id: 'gopay', name: 'GoPay' },
  { id: 'dana', name: 'DANA' },
];

const WithdrawalModal: React.FC<WithdrawalModalProps> = ({ isOpen, onClose, onConfirm, currentBalance }) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  // Step 1: Choose method, Step 2: Enter details/amount, Step 3: Confirm PIN
  const [step, setStep] = useState<number>(1);
  const [selectedMethod, setSelectedMethod] = useState<WithdrawalMethod>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null);
  const [selectedEWallet, setSelectedEWallet] = useState<string | null>(null);
  const [accountNumber, setAccountNumber] = useState<string>('');
  const [pin, setPin] = useState<string>(''); // State for the PIN input

  // Fungsi untuk maju ke langkah berikutnya (ke Step 2)
  const handleMethodSelect = (method: WithdrawalMethod) => {
    setSelectedMethod(method);
    setStep(2);
  };

  // Fungsi untuk memilih bank (tidak mengubah step)
  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    setError(''); // Clear error on new selection
  };

  // Fungsi untuk memilih e-wallet (tidak mengubah step)
  const handleEWalletSelect = (eWalletId: string) => {
    setSelectedEWallet(eWalletId);
    setError(''); // Clear error on new selection
  };

  // Fungsi untuk memvalidasi input di Step 2 dan maju ke Step 3 (konfirmasi PIN)
  const handleProceedToPinConfirmation = () => {
    const numAmount = parseInt(amount, 10);

    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Masukkan jumlah yang valid.');
      return;
    }
    if (numAmount > currentBalance) {
      setError('Saldo tidak mencukupi.');
      return;
    }
    if (!selectedMethod) {
      setError('Pilih metode penarikan.'); // Should not happen if coming from step 1
      return;
    }
    if (selectedMethod === 'bank_transfer' && !selectedBank) {
      setError('Pilih bank tujuan.');
      return;
    }
    if (selectedMethod === 'e_wallet' && !selectedEWallet) {
      setError('Pilih jenis e-wallet.');
      return;
    }
    if (!accountNumber.trim()) {
        setError('Masukkan nomor rekening/e-wallet tujuan.');
        return;
    }

    setError('');
    setStep(3); // Move to PIN confirmation step
  };


  // Fungsi untuk konfirmasi akhir (di Step 3)
  const handleFinalConfirm = () => {
    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
      setError('PIN harus 6 digit angka.');
      return;
    }

    setError('');
    const numAmount = parseInt(amount, 10);
    const detail = selectedMethod === 'bank_transfer' ? selectedBank : selectedEWallet;
    // Panggil onConfirm dari parent dengan semua data, termasuk PIN
    onConfirm(numAmount, selectedMethod!, detail || undefined, accountNumber.trim(), pin);
    
    // Reset all states
    setAmount('');
    setStep(1);
    setSelectedMethod(null);
    setSelectedBank(null);
    setSelectedEWallet(null);
    setAccountNumber('');
    setPin(''); // Reset PIN
  };

  // Fungsi untuk kembali ke langkah sebelumnya
  const handleBack = () => {
    setError(''); // Clear error when going back
    if (step === 3) {
      setStep(2); // From PIN step, go back to details/amount step
      setPin(''); // Clear PIN when going back
    } else if (step === 2) {
      setStep(1); // From details/amount step, go back to method selection
      setSelectedBank(null);
      setSelectedEWallet(null);
      setAccountNumber('');
      setAmount(''); // Clear amount when going back to method selection
    }
  };

  // Fungsi helper untuk label input nomor tujuan
  const getRecipientLabel = () => {
    if (selectedMethod === 'bank_transfer') return 'Nomor Rekening Bank';
    if (selectedMethod === 'e_wallet') return 'Nomor E-Wallet (contoh: nomor HP)';
    return 'Nomor Tujuan';
  };

  // Fungsi helper untuk placeholder input nomor tujuan
  const getPlaceholderText = () => {
    if (selectedMethod === 'bank_transfer') return 'Contoh: 1234567890';
    if (selectedMethod === 'e_wallet') return 'Contoh: 081234567890';
    return '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-700/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Tarik Saldo</h2>

        {step === 1 && (
          <>
            <p className="text-sm text-gray-600 mb-2">Pilih metode penarikan:</p>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleMethodSelect('bank_transfer')}
                className="w-full p-3 border border-gray-300 rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                Transfer Bank
              </button>
              <button
                onClick={() => handleMethodSelect('e_wallet')}
                className="w-full p-3 border border-gray-300 rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                E-Wallet
              </button>
            </div>
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Batal
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            {selectedMethod === 'bank_transfer' && (
              <>
                <p className="text-sm text-gray-600 mb-1">Pilih Bank Tujuan:</p>
                <div className="space-y-2 mb-4">
                  {bankOptions.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => handleBankSelect(bank.id)}
                      className={`w-full p-3 border rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        selectedBank === bank.id ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                      }`}
                    >
                      {bank.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            {selectedMethod === 'e_wallet' && (
              <>
                <p className="text-sm text-gray-600 mb-1">Pilih E-Wallet Tujuan:</p>
                <div className="space-y-2 mb-4">
                  {eWalletOptions.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleEWalletSelect(wallet.id)}
                      className={`w-full p-3 border rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 ${
                        selectedEWallet === wallet.id ? 'border-orange-500 bg-orange-50' : 'border-gray-300'
                      }`}
                    >
                      {wallet.name}
                    </button>
                  ))}
                </div>
              </>
            )}

            <p className="text-sm text-gray-600 mb-1">{getRecipientLabel()}:</p>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => { setAccountNumber(e.target.value); setError(''); }}
              placeholder={getPlaceholderText()}
              className="w-full p-2 border border-gray-300 rounded-md mb-2 focus:ring-orange-500 focus:border-orange-500"
            />

            <p className="text-sm text-gray-600 mb-1">Masukkan jumlah penarikan:</p>
            <input
              type="number"
              value={amount}
              onChange={(e) => { setAmount(e.target.value); setError(''); }}
              placeholder="Contoh: 25000"
              className="w-full p-2 border border-gray-300 rounded-md mb-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Kembali
              </button>
              <button
                onClick={handleProceedToPinConfirmation} // New button to proceed to PIN
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg"
              >
                Lanjut
              </button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <p className="text-sm text-gray-600 mb-1">Masukkan PIN Anda untuk konfirmasi:</p>
            <input
              type="password"
              value={pin}
              onChange={(e) => { setPin(e.target.value); setError(''); }}
              maxLength={6}
              placeholder="******"
              className="w-full p-2 border border-gray-300 rounded-md mb-2 focus:ring-orange-500 focus:border-orange-500"
            />
            {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
            <div className="flex justify-end space-x-2 mt-4">
              <button
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Kembali
              </button>
              <button
                onClick={handleFinalConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-500 hover:bg-orange-600 rounded-lg"
              >
                Konfirmasi Penarikan
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WithdrawalModal;
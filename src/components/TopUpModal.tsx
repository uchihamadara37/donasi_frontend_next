import React, { useState } from 'react';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, method: string, detail?: string) => void;
}

type PaymentMethod = 'bank_transfer' | 'e_wallet' | null;

const bankOptions = [
  { id: 'bca', name: 'Bank BCA', vaNumber: '987654321098765', paymentInfo: 'Silakan melakukan top up melalui BCA Mobile ke nomor Virtual Account berikut ini **987654321098765**. Bayar pesanan ke virtual account di atas sebelum 23:59. Hanya menerima dari Bank BCA.' },
  { id: 'mandiri', name: 'Bank Mandiri', vaNumber: '123456789012345', paymentInfo: 'Silakan melakukan top up melalui Livin by Mandiri App ke nomor Virtual Account berikut ini **123456789012345**. Bayar pesanan ke virtual account di atas sebelum 23:59. Hanya menerima dari Bank Mandiri.' },
  { id: 'bni', name: 'Bank BNI', vaNumber: '543210987654321', paymentInfo: 'Silakan melakukan top up melalui BNI Mobile Banking ke nomor Virtual Account berikut ini **543210987654321**. Bayar pesanan ke virtual account di atas sebelum 23:59. Hanya menerima dari Bank BNI.' },
];

const eWalletOptions = [
  { id: 'ovo', name: 'OVO' },
  { id: 'gopay', name: 'GoPay' },
  { id: 'dana', name: 'DANA' },
];

const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [amount, setAmount] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [step, setStep] = useState<number>(1); // 1: Choose method, 2: Choose e-wallet/Enter amount
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>(null);
  const [selectedBank, setSelectedBank] = useState<string | null>(null); // New state for selected bank
  const [selectedEWallet, setSelectedEWallet] = useState<string | null>(null);

  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    setStep(2); // Move to the next step
  };

  const handleBankSelect = (bankId: string) => { // New handler for bank selection
    setSelectedBank(bankId);
  };

  const handleEWalletSelect = (eWalletId: string) => {
    setSelectedEWallet(eWalletId);
  };

  const handleConfirm = () => {
    const numAmount = parseInt(amount, 10);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Masukkan jumlah yang valid.');
      return;
    }
    if (!selectedMethod) {
      setError('Pilih metode pembayaran.');
      return;
    }
    if (selectedMethod === 'bank_transfer' && !selectedBank) { // Validation for bank selection
        setError('Pilih jenis bank.');
        return;
    }
    if (selectedMethod === 'e_wallet' && !selectedEWallet) {
      setError('Pilih jenis e-wallet.');
      return;
    }

    setError('');
    // Pass bank or e-wallet detail
    const detail = selectedMethod === 'bank_transfer' ? selectedBank : selectedEWallet;
    onConfirm(numAmount, selectedMethod, detail || undefined);
    
    // Reset all states
    setAmount('');
    setStep(1);
    setSelectedMethod(null);
    setSelectedBank(null);
    setSelectedEWallet(null);
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setSelectedBank(null); // Clear bank selection if going back
      setSelectedEWallet(null); // Clear e-wallet selection if going back
    }
  };

  const getBankPaymentInfo = () => {
    const bank = bankOptions.find(b => b.id === selectedBank);
    return bank ? bank.paymentInfo : '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-700/50 bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-sm">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Top Up Saldo</h2>

        {step === 1 && (
          <>
            <p className="text-sm text-gray-600 mb-2">Pilih metode pembayaran:</p>
            <div className="space-y-2 mb-4">
              <button
                onClick={() => handleMethodSelect('bank_transfer')}
                className="w-full p-3 border border-gray-300 rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                Transfer Bank
              </button>
              <button
                onClick={() => handleMethodSelect('e_wallet')}
                className="w-full p-3 border border-gray-300 rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
                <p className="text-sm text-gray-600 mb-1">Pilih Bank:</p>
                <div className="space-y-2 mb-4">
                  {bankOptions.map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => handleBankSelect(bank.id)}
                      className={`w-full p-3 border rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        selectedBank === bank.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                      }`}
                    >
                      {bank.name}
                    </button>
                  ))}
                </div>
                {selectedBank && (
                  <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-md text-sm mb-4"
                       dangerouslySetInnerHTML={{ __html: getBankPaymentInfo() }} />
                )}
              </>
            )}

            {selectedMethod === 'e_wallet' && (
              <>
                <p className="text-sm text-gray-600 mb-1">Pilih E-Wallet:</p>
                <div className="space-y-2 mb-4">
                  {eWalletOptions.map((wallet) => (
                    <button
                      key={wallet.id}
                      onClick={() => handleEWalletSelect(wallet.id)}
                      className={`w-full p-3 border rounded-md text-left hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                        selectedEWallet === wallet.id ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
                      }`}
                    >
                      {wallet.name}
                    </button>
                  ))}
                </div>
              </>
            )}

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
                onClick={handleBack}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Kembali
              </button>
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 rounded-lg"
              >
                Konfirmasi
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TopUpModal;
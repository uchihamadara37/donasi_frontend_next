
export default function HistoryList({ histories }: { histories: any[] }) {
  if (histories.length === 0) {
    return <div className="text-center p-4">Tidak ada riwayat transaksi.</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">Riwayat Transaksi</h2>
      <ul className="space-y-4">
        {histories.map((history, index) => (
          <li key={index} className="border-b pb-2">
            <div className="flex justify-between items-center">
              <span className="text-gray-800">{history.description}</span>
              <span className={`font-semibold ${history.type === 'debit' ? 'text-red-500' : 'text-green-500'}`}>
                Rp {history.amount.toLocaleString('id-ID')}
              </span>
            </div>
            <span className="text-sm text-gray-500">{new Date(history.date).toLocaleDateString()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { Transaksi, UserProfile } from '@/interfaces';
import { useAuth } from '@/context/authContext';
import { TransaksiItem } from './TransaksiItem';
import { format } from "date-fns";
import { id } from "date-fns/locale";
import LoadingOverlay from './LoadingOverlay';



interface UserListProps {
  users: UserProfile[];
  onDonateClick: (user: UserProfile) => void;
  currentUser: UserProfile | null;
}

const URL_SERVER = process.env.NEXT_PUBLIC_URL_SERVER;

const UserList: React.FC<UserListProps> = ({ users, onDonateClick, currentUser }) => {
  const otherUsers = users.filter(user => user.id !== currentUser?.id);

  const { user, loading, accessToken } = useAuth();

  const [loadingInteractive, setLoadingInteractive] = useState(false);

  const [subPage, setsubPage] = useState("userList");

  const [histories, setHistories] = useState<any[]>([]); // Replace 'any' with your actual history type
  const [transactions, setTransactions] = useState<any[]>([]);

  // fetch transaksi donasi
  const getAllTransaksi = async () => {
    setLoadingInteractive(true);
    try {
      const response = await fetch(`${URL_SERVER}/api/transaksi`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // Assuming you have an access token
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      const data = await response.json();
      console.log("getAllTransaksi:", data);

      const dataPribadi = data.filter((transaksi: any) => transaksi.pengirim.id === currentUser?.id || transaksi.penerima.id === currentUser?.id);
      console.log("dataPribadi:", dataPribadi);
      setTransactions(dataPribadi);
    } catch (error) {
      console.error('Error fetching transaction history:', error);

    }
    setLoadingInteractive(false);
  };
  const fetchTransactionHistory = async () => {
    setLoadingInteractive(true);
    try {
      const response = await fetch(`${URL_SERVER}/api/history/${currentUser?.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`, // Assuming you have an access token
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch transaction history');
      }
      const data = await response.json();
      console.log("Transaction history data:", data);
      setHistories(data);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    }
    setLoadingInteractive(false);
  };

  


  useEffect(() => {
    // Fetch transaction history for the current user
    console.log("Fetching transaction history and transactions...");
    fetchTransactionHistory();
    getAllTransaksi();
  }, [subPage]);

  const onPageCheckUserList = () => {
    if (subPage === "transactionHistory") {
      setsubPage("userList");
    }

  };
  const onPageCheckHistory = () => {
    if (subPage === "userList") {
      setsubPage("transactionHistory");
    }
  };
  // const onPageCheckHistory = () => {
  //   if (subPage === "userList") {
  //     setsubPage("transactionHistory");
  //   }
  // };

  return (
    <div className="bg-slate-200 shadow-md rounded-lg p-6">
      <div className="flex gap-3">
        <h3
          className={`text-lg cursor-pointer  mb-4 py-2 px-4 rounded-md ${subPage == "userList" ? 'font-semibold text-gray-100 bg-blue-400' : 'font-normal text-gray-600 bg-slate-300'}`}
          onClick={() => { setsubPage("userList") }}
        >Pengguna Lain</h3>
        <h3
          className={`text-lg cursor-pointer  mb-4 py-2 px-4 rounded-md ${subPage == "history" ? 'font-semibold text-gray-100 bg-blue-400' : 'font-normal text-gray-600 bg-slate-300'}`}
          onClick={() => { setsubPage("history") }}
        >History Saldo</h3>
        <h3
          className={`text-lg cursor-pointer  mb-4 py-2 px-4 rounded-md ${subPage == "transaksi" ? 'font-semibold text-gray-100 bg-blue-400' : 'font-normal text-gray-600 bg-slate-300'}`}
          onClick={() => { setsubPage("transaksi") }}
        >History Donasi</h3>
      </div>
      {subPage === "userList" ?
        (
          <div className="">
            <h2 className=" font-normal text-gray-700 mb-4">Ini adalah daftar user yang bisa anda kirim donasi dari saldo anda. Pastikan saldo anda mencukupi sebelum melakukan donasi!</h2>

            <ul className="space-y-4">
              {otherUsers.length === 0 ? (
                <p className="text-gray-600">Tidak ada pengguna lain yang tersedia untuk donasi.</p>
              ) : (
                <p className="text-gray-600">Silakan pilih pengguna untuk melakukan donasi:</p>
              )}
              {otherUsers.map((user) => (

                <li
                  key={user.id}
                  className="flex items-center justify-between shadow-sm p-3 bg-slate-100 rounded-lg hover:bg-slate-300 transition duration-150 ease-in-out"
                >
                  <div className="flex items-center space-x-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full border border-slate-500 bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-gray-800 font-medium">{user.name}</span>
                  </div>
                  <button
                    onClick={() => onDonateClick(user)}
                    className="bg-blue-400 hover:bg-blue-300 text-white font-semibold py-2 px-4 rounded-lg text-sm transition duration-150 ease-in-out"
                  >
                    Donasi
                  </button>
                </li>
              ))}
            </ul>
          </div>

        ) : subPage === "history" ? (
          <div className="">

            {
              histories.length === 0 ? (
                <p className="text-gray-600">Tidak ada riwayat transaksi.</p>
              ) : (
                <div className="">
                  <h2 className=" font-normal text-gray-700 mb-4">Ini adalah riwayat aktivitas saldo anda. Untuk mengecek aktivitas transaksi keluar atau donasi silakan klik pada navigasi transaksi di atas.</h2>
                  <ul className="space-y-4">
                    {histories.map((history, index) => (
                      <li
                        key={history.id}
                        className="flex items-center justify-between shadow-sm p-3 bg-slate-100 rounded-lg hover:bg-slate-300 transition duration-150 ease-in-out"
                      >
                        <div className="flex items-center space-x-3">
                          <span className={`${history.jenis == "PEMASUKAN" ? 'text-green-500' : 'text-red-400'} font-medium`}>{history.jenis}</span>
                          <span className="text-blue-500 font-medium">{history.sumber}</span>
                          {history.sumber === "DONASI" && (
                            <span className="text-slate-600 font-normal">
                              {(() => {
                                const correspondingTransaction = transactions.find(
                                  (trans) => trans.id === history.transaksiId
                                );

                                if (correspondingTransaction && correspondingTransaction.penerima) {
                                  return `kepada ${correspondingTransaction.penerima.name}`;
                                }
                                return 'kepada (Pengguna tidak dikenal)'; // Pesan default jika data tidak lengkap
                              })()}
                            </span>
                          )}

                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-800 font-light">
                            {format(new Date(history.waktu), "d MMMM yyyy HH:mm", { locale: id })}
                          </span>
                          <span className="text-gray-800 font-normal">Rp{history.jumlah}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            }
          </div>
        ) : (
          <div className="">
            {
              transactions.length === 0 ? (
                <p className="text-gray-600">Tidak ada riwayat donasi.</p>
              ) : (
                <div className="">
                  <h2 className=" font-normal text-gray-700 mb-4">Ini adalah riwayat donasi anda. Untuk mengecek aktivitas saldo silakan klik pada navigasi saldo di atas.</h2>
                  <ul className="">
                    {transactions.map((transaction) => (
                      <TransaksiItem key={transaction.id} transaction={transaction} />
                    ))}
                  </ul>
                </div>
              )
            }
          </div>
        )
      }
      {loadingInteractive && <LoadingOverlay />}
    </div>
  );
};

export default UserList;
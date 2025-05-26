import React, { useEffect, useState } from 'react';
import { Transaksi, UserProfile } from '@/interfaces';
import { useAuth } from '@/context/authContext';
import { Button } from './ui/button';
import { Input } from './ui/input';

import { format } from "date-fns";
import { id } from "date-fns/locale";

const URL_SERVER = process.env.NEXT_PUBLIC_URL_SERVER;


export const TransaksiItem: React.FC<{
    transaction: any
}> = ({ transaction }) => {

    const { user, loading, accessToken } = useAuth();

    const [checked, setChecked] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [keterangan, setKeterangan] = useState(transaction.pesanDonasi);
    const [transaksi, setTransaksi] = useState<any | null>(transaction);

    // const [transaction, setTransaction] = useState<any[]>([]);
    const editTransactionById = async () => {
        try {
            const response = await fetch(`${URL_SERVER}/api/transaksi/${transaction.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`, // Assuming you have an access token
                },
                body: JSON.stringify({
                    pesanDonasi: keterangan,
                }),
            });
            if (!response.ok) {
                throw new Error('Failed to fetch transaction history');
            }
            const data = await response.json();
            console.log("updatedTransaksi:", data);
            setTransaksi(data.transaksi);

        } catch (error) {
            console.error('Error fetching transaction history:', error);

        }
    };

    const deleteTransactionById = async () => {
        const jadi = confirm("Apakah anda yakin ingin menghapus history donasi ini?");
        if (!jadi) return;

        try {
            const response = await fetch(`${URL_SERVER}/api/transaksi/${transaction.id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${accessToken}`, // Assuming you have an access token
                },
            });
            if (!response.ok) {
                throw new Error('Failed to delete transaction history');
            }
            const data = await response.json();
            console.log("deletedTransaksi:", data);
            alert(data.message);
            setTransaksi(null); // Clear the transaction from state
            setChecked(false); // Uncheck the item
            // Optionally, you can update the state or notify the user
        } catch (error) {
            console.error('Error deleting transaction history:', error);
        }
    }

    return transaksi && (
        <div className="mb-3">
            <li key={transaksi.id} onClick={() => setChecked(!checked)}
                className="cursor-pointer relative z-10 flex items-center justify-between shadow-sm p-3 bg-slate-100 rounded-lg hover:bg-slate-300 transition duration-150 ease-in-out"
            >
                <div className="flex items-center space-x-3">
                    <span className=" font-medium">{
                        transaksi.penerima.id === user?.id ? "Dikirim oleh" : "Kepada"
                    }</span>
                    <span className={`${transaksi.penerima.id === user?.id ? "text-red-500" : "text-green-500"} font-medium`}> {
                        transaksi.penerima.id === user?.id ? transaksi.pengirim.name : transaksi.penerima.name
                    }</span>
                    <span className="text-slate-600 font-normal">{transaksi.pesanDonasi ? transaksi.pesanDonasi : "Tanpa keterangan"}</span>
                </div>
                <div className="flex items-center space-x-3">
                    <span className="text-gray-800 font-light">
                        {format(new Date(transaksi.waktu), "d MMMM yyyy HH:mm", { locale: id })}
                    </span>
                    <span className="text-gray-800 font-normal">Rp{transaksi.jumlahDonasi}</span>
                </div>
            </li>
            {checked && (
                <div className="flex items-center justify-between p-3 bg-blue-200 rounded-lg -mt-2 pt-5">
                    <div className="flex items-center space-x-3">
                        {isEdit && (
                            <Input
                                type='text'
                                value={keterangan}
                                onChange={(e) => setKeterangan(e.target.value)}
                                className='bg-slate-100 w-160'
                                placeholder='Edit Keterangan ...'
                            />
                        )}
                        {transaksi.penerima.id === user?.id ? (
                            <span className="text-red-500 font-normal">Anda tidak bisa mengedit pesan dan menghapus history ini, karena anda adalah penerima donasi!</span>
                        ) : (
                            <Button
                                className='bg-green-500 text-white'
                                onClick={() => {
                                    if (isEdit) {
                                        editTransactionById();
                                    }
                                    setIsEdit(!isEdit);
                                }}
                            >
                                Edit Keterangan
                            </Button>
                        )}
                    </div>
                    <div className="">
                        {transaksi.penerima.id !== user?.id && (
                            <Button
                                className='bg-red-500 text-white'
                                onClick={deleteTransactionById}
                            >
                                Hapus History Donasi
                            </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
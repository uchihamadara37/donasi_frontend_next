"use client"
import { useRouter } from "next/navigation";

import { useAuth } from "@/context/authContext";

import React, { useState, useEffect } from 'react';
import { UserProfile } from '@/interfaces';
import ProfileCard from '@/components/ProfileCard';
import BalanceCard from '@/components/BalanceCard';
import UserList from '@/components/UserList';
import TopUpModal from '@/components/TopUpModal';
import DonateModal from '@/components/DonateModal';
import LoadingOverlay from "@/components/LoadingOverlay";

import WithdrawalCard from "@/components/WithdrawalCard"; // Import the new component
import WithdrawalModal from "@/components/WithdrawalModal"; // Import the new modal

import { URL_SERVER } from "@/interfaces";

// Membuat UserProfile dari data API
export default function Home() {

  const router = useRouter();
  const {
    user,
    accessToken,
    loading,
  } = useAuth(); // Ambil user dari context

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(user as UserProfile | null); // Cast user to UserProfile or null
  const [otherUsers, setOtherUsers] = useState<UserProfile[]>([]);
  const [isTopUpModalOpen, setIsTopUpModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [selectedUserForDonation, setSelectedUserForDonation] = useState<UserProfile | null>(null);

  const [loadingInteractive, setLoadingInteractive] = useState(false);

  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false); // New state for withdrawal modal





  useEffect(() => {
    if (loading) {
      console.log("masih loading /");
      return;
    }

    const getOtherUsers = async () => {
      try {
        const res = await fetch(`${URL_SERVER}/api/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          credentials: 'include', // Pastikan untuk mengirim cookie
        });
        const data = await res.json();
        console.log("Data other users:", data);
        if (!res.ok) {
          throw new Error(data.message || 'Gagal mengambil data pengguna lain');
        }
        setOtherUsers(data);
      } catch (error) {
        console.error("Error fetching other users:", error);
        alert("Gagal mengambil data pengguna lain. Silakan coba lagi.");
      }
    }

    if (!accessToken || !user) {
      console.log("refreshToken /home masih kosong");
      router.replace('/login')
    } else {
      getOtherUsers();
      console.log("getOtherUsers /home");
      // Jika ada user, kita set currentUser
      setCurrentUser(user as UserProfile); // Cast user to UserProfile
      console.log("page1 verify200 user:", user, "accessToken di /:", accessToken,)
      // cek apakah accessToken masih valid
      // verifyRefreshToken(refreshToken)
    }

  }, [loading, accessToken, user, router]);
  // Jika user berubah, update currentUser



  const handleOpenTopUpModal = () => {
    setIsTopUpModalOpen(true);
  };

  const handleCloseTopUpModal = () => {
    setIsTopUpModalOpen(false);
  };

  const handleConfirmTopUp = async (amount: number) => {
    setLoadingInteractive(true);
    if (currentUser) {
      console.log("Top up amount:", amount);
      // top up di currentUser
      try {
        const res = await fetch(`${URL_SERVER}/api/users/${user?.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            saldo: currentUser.saldo + amount,
            amount,
          }),
          credentials: 'include',
        });

        const updatedUser = await res.json();

        if (!res.ok) {
          throw new Error(updatedUser.message || 'Gagal memperbarui saldo');
        }
        // add History
        try {
          const res = await fetch(`${URL_SERVER}/api/history`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
              userId: currentUser.id,
              jumlah: amount,
              jenis: "PEMASUKAN",
              sumber: "TOPUP",
              transaksiId: null,
              waktu: new Date().toISOString(),
            }),
            credentials: 'include',
          });
          const updatedHistory = await res.json();
          if (!res.ok) {
            throw new Error(updatedHistory.message || 'Gagal memperbarui history');
          }
          console.log("TOPUP : history added", updatedHistory);
        } catch (error) {
          console.error("Error updating history:", error);
          alert("Gagal memperbarui history. Silakan coba lagi.");
        }

        // Update state dengan saldo baru
        setCurrentUser({ ...currentUser, saldo: currentUser.saldo + amount });
        alert(`Top up sejumlah Rp ${amount} berhasil! Saldo baru Anda Rp ${(currentUser.saldo + amount)}`);
      } catch (error) {
        console.error("Error updating user saldo:", error);
        alert("Gagal memperbarui saldo. Silakan coba lagi.");
      }

    }
    setIsTopUpModalOpen(false);

    setLoadingInteractive(false);
  };

  const handleOpenDonateModal = (user: UserProfile) => {
    setSelectedUserForDonation(user);
    setIsDonateModalOpen(true);
  };

  const handleCloseDonateModal = () => {
    setSelectedUserForDonation(null);
    setIsDonateModalOpen(false);
  };

  const handleConfirmDonation = async (amount: number, message: string, recipient: UserProfile,) => {
    setLoadingInteractive(true);
    if (currentUser && currentUser.saldo >= amount) {

      // Menambahkan transaksi untuk masing-masing user
      try {
        const res = await fetch(`${URL_SERVER}/api/transaksi`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            pengirimId: currentUser.id,
            penerimaId: recipient.id,
            jumlahDonasi: amount,
            pesanDonasi: message,
          }),
          credentials: 'include',
        });
        const newTransaksi = await res.json();
        if (!res.ok) {
          throw new Error(newTransaksi.message || 'Gagal memperbarui history');
        }
        console.log("DONASI : transaksi added", newTransaksi);

        setCurrentUser({ ...currentUser, saldo: currentUser.saldo - amount });
        setOtherUsers((prevUsers) =>
          prevUsers.map((user) =>
            user.id === recipient.id ? { ...user, saldo: user.saldo + amount } : user
          )
        );

      } catch (error) {
        console.error("Error buat transaksi:", error);
        alert("Gagal transaksi. Silakan coba lagi.");
      }

      alert(`Donasi sejumlah Rp ${amount} kepada ${recipient.name} berhasil!`);
      console.log(`Donasi: ${amount} dari ${currentUser.name} ke ${recipient.name}`);
    } else {
      alert('Saldo tidak mencukupi!');
    }
    setIsDonateModalOpen(false);
    setSelectedUserForDonation(null);

    setLoadingInteractive(false);
  };

  const handleOpenWithdrawalModal = () => {
    setIsWithdrawalModalOpen(true);
  };

  const handleCloseWithdrawalModal = () => {
    setIsWithdrawalModalOpen(false);
  };

  const handleConfirmWithdrawal = async (amount: number, method: string, detail?: string, accountNumber?: string, pin?: string) => {
    setLoadingInteractive(true);
    if (currentUser) {
      console.log("Withdrawal amount:", amount, "Method:", method, "Detail:", detail, "Account:", accountNumber, "Pin:", pin);
      if (currentUser.saldo < amount) {
        alert('Saldo tidak mencukupi untuk penarikan ini.');
        setLoadingInteractive(false);
        return;
      }

      try {
        const dataJson = JSON.stringify({
          saldo: currentUser.saldo - amount,
          pin: pin, // Pastikan untuk mengirim PIN jika diperlukan
          amount: amount,
        });
        console.log("Withdrawal data JSON:", dataJson);
        const res = await fetch(`${URL_SERVER}/api/users/${user?.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: dataJson,
          credentials: 'include',
        });

        const updatedUser = await res.json();

        if (!res.ok) {
          throw new Error(updatedUser.error || 'Gagal memperbarui saldo untuk penarikan');
        }


        setCurrentUser({ ...currentUser, saldo: currentUser.saldo - amount });
        alert(`Penarikan sejumlah Rp ${amount} berhasil! Saldo baru Anda Rp ${(currentUser.saldo - amount)}`);
      } catch (error) {
        console.error("Error processing withdrawal:", error);
        alert("Gagal melakukan penarikan. Silakan coba lagi.");
      }
    }
    setIsWithdrawalModalOpen(false);
    setLoadingInteractive(false);
  };

  if (!currentUser || loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-lg text-gray-600">Memuat data pengguna...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-slate-200 text-slate-800 px-50">
      <div className="flex-none mt-8 mb-8">
        <h1 className="text-4xl font-bold text-center text-blue-400">
          Donate App
        </h1>
      </div>
      <div className="flex-1 flex flex-row rounded-xl bg-slate-300">

        <div className="w-80  p-4">
          <div className="flex flex-col">
            <ProfileCard />
            <BalanceCard
              balance={currentUser.saldo ?? 0}
              onTopUpClick={handleOpenTopUpModal}
            />
            <WithdrawalCard
              onWithdrawClick={handleOpenWithdrawalModal}
            />
          </div>
        </div>

        <div className="flex-1  p-4 overflow-y-auto">
          <UserList
            users={otherUsers}
            onDonateClick={handleOpenDonateModal}
            currentUser={currentUser}
          />
        </div>

        {/* Modals */}
        <TopUpModal
          isOpen={isTopUpModalOpen}
          onClose={handleCloseTopUpModal}
          onConfirm={handleConfirmTopUp}
        />
        <DonateModal
          isOpen={isDonateModalOpen}
          onClose={handleCloseDonateModal}
          onConfirm={handleConfirmDonation}
          recipient={selectedUserForDonation}
          currentUserBalance={currentUser.saldo}
        />
        <WithdrawalModal
          isOpen={isWithdrawalModalOpen}
          onClose={handleCloseWithdrawalModal}
          onConfirm={handleConfirmWithdrawal}
          currentBalance={currentUser.saldo ?? 0}
        />

      </div>
      {loadingInteractive && <LoadingOverlay />}
    </div>
  );
}

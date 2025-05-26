export interface BaseUser {
  id: number;
  name: string;
  email: string; // Ditambahkan
  avatar?: string; // URL ke gambar avatar
}

export interface UserProfile extends BaseUser {
  saldo: number;
}

export interface History {
  id: number;
  userId: number;
  jumlah: number;
  jenis: "PEMASUKAN" | "PENGELUARAN";
  sumber: "TOPUP" | "PENARIKAN" | "DONASI";
  transaksiId?: string;
  waktu: string;
}

export interface Transaksi {
  id: number;
  pengirimId: number;
  penerimaId: number;
  jumlahDonasi: number;
  pesanDonasi?: string;  
  waktu: string;
}
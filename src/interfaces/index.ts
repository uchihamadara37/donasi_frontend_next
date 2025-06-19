// export interface BaseUser {
//   id: number;
//   name: string;
//   email: string; // Ditambahkan
//   avatar?: string; // URL ke gambar avatar
// }

export interface UserProfile{
  id: number;
  name: string;
  email: string; // Ditambahkan
  avatar?: string; // URL ke gambar avatar
  saldo: number;
  pin?: number; // PIN untuk keamanan transaksi
  signIn: () => void; 
  register: (user: UserProfile) => void// Fungsi untuk melakukan sign-in
  topUp: (amount: number) => void; // Fungsi untuk melakukan top-up saldo
  cekSaldo: () => number; // Fungsi untuk mengecek saldo
  cekTransaksi: () => Transaksi[]; // Fungsi untuk mengecek riwayat transaksi
  cekOtherUsers: () => UserProfile[]; // Fungsi untuk mengecek daftar pengguna lain
}

export interface History {
  id: number;
  userId: number;
  jumlah: number;
  jenis: "PEMASUKAN" | "PENGELUARAN";
  sumber: "TOPUP" | "PENARIKAN" | "DONASI";
  transaksiId?: string;
  waktu: string;
  lihatDetailTransaksi?: () => Transaksi | null; // Fungsi untuk melihat detail transaksi

}

export interface Transaksi {
  id: number;
  pengirimId: number;
  penerimaId: number;
  jumlahDonasi: number;
  pesanDonasi?: string;  
  waktu: string;
  setUserPenerima: (user: UserProfile) => void; // Fungsi untuk mengatur penerima donasi
  setUserPengirim: (user: UserProfile) => void; // Fungsi untuk mengatur pengirim donasi
  lihatDetail: () => Transaksi | null; // Fungsi untuk melihat detail transaksi
  lihatRiwayat: () => Transaksi[]; // Fungsi untuk melihat riwayat transaksi
}

// export const URL_SERVER="https://donasi-backend-948060519163.asia-southeast2.run.app"
export const URL_SERVER="http://localhost:3000"
"use client"

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useEffect } from "react"; // Import useState untuk preview gambar
import LoadingOverlay from "@/components/LoadingOverlay";
import Image from "next/image";

// Schema Zod yang diperbarui untuk menyertakan avatar
const schema = z
  .object({
    name: z.string().min(1, "Nama tidak boleh kosong"), // Tambahkan validasi min(1)
    email: z.string().email("Email tidak valid"),
    password: z
      .string()
      .min(6, "Password minimal 6 karakter"),
    // .regex(/[A-Z]/, "Harus ada huruf besar")
    // .regex(/[a-z]/, "Harus ada huruf kecil")
    // .regex(/[0-9]/, "Harus ada angka")
    // .regex(/[\W_]/, "Harus ada simbol (!@#$%^&*)"),
    confirmPassword: z.string(),
    // Tambahkan validasi untuk avatar
    // make it optional because not all users might upload an avatar
    avatar: z
      .any() // Multer expects a FileList, so use .any() or .instanceof(FileList)
      .refine((file) => file?.length === 0 || file?.[0]?.type?.startsWith('image/'), "File harus berupa gambar")
      // .optional() // Avatar bersifat opsional
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords tidak sama",
    path: ["confirmPassword"],
  });

// Interface formValues yang diperbarui untuk menyertakan avatar
interface formValues {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  avatar?: FileList; // Multer akan menerima ini sebagai FileList
}

export default function RegisterPage() {
  const router = useRouter();
  // const { login } = useAuth(); // Asumsi Anda memiliki fungsi login di authContext
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // State untuk preview gambar

  const [loadingInteractive, setLoadingInteractive] = useState(false);

  const {
    register,
    handleSubmit,
    watch, // Digunakan untuk memantau perubahan nilai field
    formState: { errors },
  } = useForm<formValues>({ // Tentukan tipe generik untuk useForm
    resolver: zodResolver(schema),
    defaultValues: { // Opsional: set nilai default
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      avatar: undefined,
    }
  });

  const avatarWatch = watch("avatar"); // Memantau perubahan pada input avatar

  // Efek untuk membuat URL preview saat file avatar berubah

  useEffect(() => {
    if (avatarWatch && avatarWatch.length > 0) {
      const file = avatarWatch[0];
      const objectUrl = URL.createObjectURL(file);
      setAvatarPreview(objectUrl);
      console.log("Avatar preview URL:", objectUrl);
      // Cleanup URL object saat komponen unmount atau file berubah
      return () => URL.revokeObjectURL(objectUrl);
    } else {
      setAvatarPreview(null);
    }
  }, [avatarWatch]);

  const onSubmit = async (data: formValues) => {
    setLoadingInteractive(true); // Set loadingInteractive ke true saat mulai submit

    setLoading(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    formData.append('name', data.name);
    formData.append('email', data.email);
    formData.append('password', data.password);
    // Jika ada file avatar yang dipilih, tambahkan ke FormData
    if (data.avatar && data.avatar.length > 0) {
      formData.append('avatar', data.avatar[0]); // 'avatar' harus sesuai dengan nama field di Multer backend
    }

    try {
      // Ganti URL ini dengan endpoint API register Anda
      const response = await fetch(`${process.env.NEXT_PUBLIC_URL_SERVER}/api/register`, {
        method: 'POST',
        body: formData, // FormData akan secara otomatis mengatur Content-Type: multipart/form-data
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Pendaftaran gagal');
      }

      setSuccess("Pendaftaran berhasil! Anda akan diarahkan ke halaman login...");
      console.log("Pendaftaran berhasil:", result);
      router.push("/");

    } catch (err: unknown) {
      console.error("Error pendaftaran", err);
      setError("Terjadi kesalahan saat pendaftaran.");
    } finally {
      setLoading(false);

      setLoadingInteractive(false); // Set loadingInteractive ke false setelah selesai
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4"> {/* Tambahkan padding untuk responsivitas */}
      <Card className="w-full max-w-md p-5 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl font-bold text-blue-400">Register Donate App</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <Input
                type="text"
                id="name"
                {...register('name')}
                placeholder="Enter your name"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                id="email"
                {...register('email')}
                placeholder="Enter your email"
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input
                type="password"
                id="password"
                {...register('password')}
                placeholder="Enter your password"
                className={errors.password ? "border-red-500" : ""}
              />
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
            </div>
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <Input
                type="password"
                id="confirmPassword"
                {...register('confirmPassword')}
                placeholder="Confirm your password"
                className={errors.confirmPassword ? "border-red-500" : ""}
              />
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Input untuk Upload Avatar */}
            <div>
              <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-1">Avatar profile</label>
              <Input
                type="file"
                id="avatar"
                accept="image/*" // Hanya menerima file gambar
                {...register('avatar')}
                className={errors.avatar ? "border-red-500" : ""}
              />
              {errors.avatar && <p className="text-red-500 text-sm mt-1">{errors.avatar.message as string}</p>}
              {avatarPreview && (
                <div className="mt-4 flex flex-col items-center">
                  <p className="text-sm text-gray-600 mb-2">Image Preview:</p>
                  <Image src={avatarPreview} alt="Avatar Preview" className="w-24 h-24 object-cover rounded-full border border-gray-300 shadow-sm" />
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-500 text-sm text-center">{error}</p>
            )}
            {success && (
              <p className="text-green-600 text-sm text-center">{success}</p>
            )}

            <Button type="submit" className="w-full bg-blue-500" disabled={loading}>
              {loading ? "Registering..." : "Register"}
            </Button>
            <Button
              type="button"
              className="w-full mt-2 bg-gray-50 hover:bg-gray-300 text-slate-700"
              onClick={() => router.push("/")}
              disabled={loading}
            >
              Back to Login
            </Button>
          </form>
        </CardContent>
      </Card>
      {loadingInteractive && <LoadingOverlay />}
    </div>
  );
}
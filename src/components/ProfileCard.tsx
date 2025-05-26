"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/interfaces'; // Asumsi UserProfile sudah ada dan memiliki 'avatar?: string | null;'
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, XCircle } from 'lucide-react'; // Import XCircle untuk tombol hapus avatar

import { useAuth } from '@/context/authContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import LoadingOverlay from './LoadingOverlay';
import Image from 'next/image';

// Asumsi URL_SERVER sudah didefinisikan di .env.local
import { URL_SERVER } from '@/interfaces';

// --- Zod Schema for Edit Profile Form ---
const editProfileSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong").optional(), // Nama bisa diupdate, tapi tidak boleh kosong jika ada
  avatar: z
    .any() // Multer expects a FileList, so use .any()
    .refine((file) => file?.length === 0 || file?.[0]?.type?.startsWith('image/'), "File harus berupa gambar")
    .optional(),
  // Field tersembunyi untuk menandakan penghapusan avatar
  clearAvatar: z.boolean().optional().default(false),
});

// --- Interface for Form Values ---
interface EditProfileFormValues {
  name?: string;
  avatar?: FileList;
  clearAvatar?: boolean;
}

interface ProfileCardProps {
  user: UserProfile | null;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ user }) => {
  const {logout, accessToken } = useAuth(); // Ambil accessToken dari context
  const [isModalOpen, setIsModalOpen] = useState(false); // State untuk mengontrol buka/tutup modal
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null); // State untuk preview gambar
  const [formError, setFormError] = useState<string | null>(null); // State untuk error form
  const [formLoading, setFormLoading] = useState(false); // State untuk loading form

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(user); // Local state untuk user, bisa diupdate setelah edit

  const [loadingInteractive, setLoadingInteractive] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset, // Untuk mereset form saat modal ditutup
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: currentUser?.name || '', // Set default name dari user prop
      avatar: undefined,
      clearAvatar: false,
    },
  });

  const watchAvatar = watch("avatar"); // Memantau perubahan pada input avatar
  const watchClearAvatar = watch("clearAvatar"); // Memantau state clearAvatar

  // Effect untuk mengatur default values saat user prop berubah atau modal dibuka
  useEffect(() => {
    if (isModalOpen && currentUser) {
      reset({
        name: currentUser.name || '',
        avatar: undefined, // Reset avatar input
        clearAvatar: false,
      });
      setAvatarPreview(currentUser.avatar || null); // Set preview ke avatar currentUser saat ini
      setFormError(null); // Reset error
    }
  }, [isModalOpen, currentUser, reset]);

  // Effect untuk membuat URL preview saat file avatar berubah
  useEffect(() => {
    if (watchAvatar && watchAvatar.length > 0) {
      const file = watchAvatar[0];
      setAvatarPreview(URL.createObjectURL(file));
      setValue('clearAvatar', false); // Jika user upload baru, batalkan clear avatar
      return () => URL.revokeObjectURL(file.name); // Cleanup URL object
    } else if (!watchClearAvatar && currentUser?.avatar) {
      // Jika tidak ada file baru diupload dan clearAvatar tidak aktif,
      // tampilkan avatar user yang sudah ada
      setAvatarPreview(currentUser.avatar);
    } else if (watchClearAvatar) {
      // Jika clearAvatar aktif, hapus preview
      setAvatarPreview(null);
    } else {
      // Jika tidak ada avatar dan tidak ada yang diupload/dibersihkan
      setAvatarPreview(null);
    }
  }, [watchAvatar, watchClearAvatar, currentUser?.avatar, setValue]);

  // Handler untuk menghapus avatar
  const handleClearAvatar = useCallback(() => {
    setValue('avatar', undefined); // Hapus file dari input form
    setValue('clearAvatar', true); // Set flag untuk menghapus avatar di backend
    setAvatarPreview(null); // Hapus preview
  }, [setValue]);

  // Handler submit form edit profile
  const onSubmitEditProfile = async (data: EditProfileFormValues) => {
    setLoadingInteractive(true); // Set loadingInteractive ke true saat mulai submit

    setFormLoading(true);
    setFormError(null);

    const formData = new FormData();
    // if (data.name !== user?.name && data.name !== undefined) { // Hanya tambahkan jika nama berubah
    // }
    formData.append('name', data.name!);
    if (data.avatar && data.avatar.length > 0) {
      formData.append('avatar', data.avatar[0]);
    } else if (data.clearAvatar) {
      formData.append('clearAvatar', 'true'); // Kirim flag ke backend untuk menghapus avatar
    }

    if (formData.entries().next().done) { // Cek apakah formData kosong
      setFormError("Tidak ada perubahan untuk disimpan.");
      setFormLoading(false);
      return;
    }

    try {
      const response = await fetch(`${URL_SERVER}/api/editProfile/${user?.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}` }, // Jika Anda menggunakan token di header
        body: formData, // FormData akan otomatis mengatur Content-Type
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      console.log('Profile updated successfully:', result.user);
      
      // await refreshAccessTokenAndUser(); // Ini akan memicu update user di context
      // login(accessToken!, result.user); // Update user di context dengan data terbaru

      setCurrentUser(result.user); // Update user lokal dengan data terbaru

      setIsModalOpen(false); // Tutup modal
      reset(); // Reset form setelah sukses (opsional, tergantung UX)

    } catch (err: unknown ) {

      console.error("Error updating profile:", err);
      setFormError("Terjadi kesalahan saat memperbarui profil. Cobalah menggunakan gambar berukuran lebih kecil");
    } finally {
      setFormLoading(false);

      setLoadingInteractive(false); // Set loadingInteractive ke false setelah selesai
    }
  };

  if (!currentUser) {
    return <div className="text-center p-4">Memuat profil...</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex flex-col items-center">
        {/* Avatar Display */}
        {currentUser.avatar ? (
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-30 h-30 rounded-full object-cover mt-5"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center text-white text-xl font-bold mt-5">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className="mt-2">
          <h2 className="text-2xl font-semibold text-center text-blue-400">{currentUser.name}</h2>
          <p className="text-gray-600">Email: {currentUser.email}</p>
        </div>

        <div className="w-full flex justify-between mt-5">
          {/* Logout Button */}
          <Button
            type="button"
            className="bg-red-500 text-white hover:bg-red-600 px-3 py-1 rounded-md"
            onClick={() => { logout(); }}
          >
            Log out
          </Button>

          {/* Settings/Edit Profile Button (Dialog Trigger) */}
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button
                type="button"
                className="bg-green-500 text-white hover:bg-green-600 p-1 px-1.5 rounded-md"
              >
                <Settings className='h-5 w-5' />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit Profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you&apos;re done.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmitEditProfile)} className="flex flex-col gap-2 py-4">
                {/* Name Input */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="name" className="text-right w-50">
                    Name
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className="col-span-3"
                  />
                  {errors.name && <p className="col-span-4 text-right text-red-500 text-sm">{errors.name.message}</p>}
                </div>

                {/* Avatar Input */}
                <div className="flex items-center gap-2">
                  <Label htmlFor="avatar" className="text-right w-50">
                    Avatar
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    {...register('avatar')}
                    className="col-span-3"
                  />
                  {errors.avatar && <p className="col-span-4 text-right text-red-500 text-sm">Cobalah menggunakan gambar yang ukurannya lebih kecil</p>}
                </div>

                {/* Avatar Preview & Clear Button */}
                {(avatarPreview || currentUser.avatar) && (
                  <div className="col-span-4 flex flex-col items-center gap-2">
                    <Image
                      src={avatarPreview || currentUser.avatar || ''}
                      alt="Avatar Preview"
                      className="w-24 h-24 rounded-full object-cover border border-gray-300 shadow-sm"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleClearAvatar}
                      disabled={watchClearAvatar} // Disable if already marked for clearing
                      className="flex items-center gap-1"
                    >
                      <XCircle className="h-4 w-4" /> Clear Avatar
                    </Button>
                  </div>
                )}
                {/* Message for no avatar */}
                {!avatarPreview && !currentUser.avatar && !watchClearAvatar && (
                    <p className="col-span-4 text-center text-gray-500 text-sm">No avatar set.</p>
                )}


                {formError && (
                  <p className="col-span-4 text-center text-red-500 text-sm">{formError}</p>
                )}

                <DialogFooter className="col-span-4">
                  <Button type="submit" disabled={formLoading}>
                    {formLoading ? "Saving..." : "Save changes"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      {loadingInteractive && <LoadingOverlay />}
    </div>
  );
};

export default ProfileCard;
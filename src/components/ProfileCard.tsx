"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile } from '@/interfaces';
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
import { Settings, XCircle } from 'lucide-react';

import { useAuth } from '@/context/authContext';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import LoadingOverlay from './LoadingOverlay';
import Image from 'next/image';

import { URL_SERVER } from '@/interfaces';

// --- Zod Schema for Edit Profile Form ---
const editProfileSchema = z.object({
  name: z.string().min(1, "Nama tidak boleh kosong").optional(),
  avatar: z
    .any()
    .refine((file) => file?.length === 0 || file?.[0]?.type?.startsWith('image/'), "File harus berupa gambar")
    .optional(),
  clearAvatar: z.boolean().optional().default(false),
  // --- New: PIN fields ---
  currentPin: z
    .string()
    .optional()
    .or(z.literal(''))
    .refine((val) => {
      // If a newPin is provided, currentPin must be 6 digits and not empty
      // Otherwise, currentPin is optional if no newPin is set
      // This refinement will be further handled by .superRefine
      return true;
    }, { message: "PIN lama harus 6 digit angka" }),
  newPin: z
    .string()
    .length(6, "PIN baru harus 6 digit angka")
    .regex(/^\d+$/, "PIN baru harus berupa angka")
    .optional()
    .or(z.literal('')), // Allow empty string for optional behavior
  confirmNewPin: z
    .string()
    .optional()
    .or(z.literal('')), // Allow empty string for optional behavior
}).superRefine((data, ctx) => {
  // Custom validation for PIN
  const hasNewPin = data.newPin && data.newPin !== '';
  const hasCurrentPinInput = data.currentPin && data.currentPin !== '';

  if (hasNewPin) {
    // If a new PIN is provided, then currentPin is required
    if (!hasCurrentPinInput) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PIN lama diperlukan untuk mengubah PIN baru.",
        path: ['currentPin'],
      });
    } else if (data.currentPin!.length !== 6 || !/^\d+$/.test(data.currentPin!)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "PIN lama harus 6 digit angka.",
        path: ['currentPin'],
      });
    }

    // New PIN and Confirm New PIN must match
    if (data.newPin !== data.confirmNewPin) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Konfirmasi PIN baru tidak cocok dengan PIN baru.",
        path: ['confirmNewPin'],
      });
    }
  }

  // If currentPin is provided, but newPin is not
  if (hasCurrentPinInput && !hasNewPin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Jika Anda memasukkan PIN lama, Anda harus memasukkan PIN baru.",
      path: ['newPin'],
    });
  }
});


// --- Interface for Form Values ---
interface EditProfileFormValues {
  name?: string;
  avatar?: FileList;
  clearAvatar?: boolean;
  currentPin?: string; // New: Current PIN field
  newPin?: string;    // New: New PIN field
  confirmNewPin?: string; // New: Confirm New PIN field
}

const ProfileCard = () => {
  const { logout, accessToken, refreshAccessTokenAndUser, user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const [currentUser, setCurrentUser] = useState<UserProfile | null>(user);

  const [loadingInteractive, setLoadingInteractive] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<EditProfileFormValues>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      name: currentUser?.name || '',
      avatar: undefined,
      clearAvatar: false,
      currentPin: '', // Always start empty for security
      newPin: '',     // Always start empty
      confirmNewPin: '', // Always start empty
    },
  });

  const watchAvatar = watch("avatar");
  const watchClearAvatar = watch("clearAvatar");
  const watchNewPin = watch("newPin"); // Watch newPin for conditional validation/display


  // Effect to set default values when user prop changes or modal opens
  useEffect(() => {
    if (isModalOpen && currentUser) {
      reset({
        name: currentUser.name || '',
        avatar: undefined,
        clearAvatar: false,
        currentPin: '', // Always reset these to empty
        newPin: '',
        confirmNewPin: '',
      });
      setAvatarPreview(currentUser.avatar || null);
      setFormError(null);
    }
  }, [isModalOpen, currentUser, reset]);

  // Effect to create preview URL when avatar file changes
  useEffect(() => {
    if (watchAvatar && watchAvatar.length > 0) {
      const file = watchAvatar[0];
      setAvatarPreview(URL.createObjectURL(file));
      setValue('clearAvatar', false);
      return () => URL.revokeObjectURL(file.name);
    } else if (!watchClearAvatar && currentUser?.avatar) {
      setAvatarPreview(currentUser.avatar);
    } else if (watchClearAvatar) {
      setAvatarPreview(null);
    } else {
      setAvatarPreview(null);
    }
  }, [watchAvatar, watchClearAvatar, currentUser?.avatar, setValue]);

  // Handler to clear avatar
  const handleClearAvatar = useCallback(() => {
    setValue('avatar', undefined);
    setValue('clearAvatar', true);
    setAvatarPreview(null);
  }, [setValue]);

  // Handler submit form edit profile
  const onSubmitEditProfile = async (data: EditProfileFormValues) => {
    setLoadingInteractive(true);
    console.log('Submitting profile update with data:', data);

    setFormLoading(true);
    setFormError(null);

    const formData = new FormData();
    let hasChanges = false; // Track if any actual changes are made

    if (data.name !== undefined) {
      formData.append('name', data.name);
      // hasChanges = true;
    }

    console.log('Appending avatar to formData:', data.avatar && data.avatar[0]);
    if (data.clearAvatar === false && data.avatar && data.avatar.length > 0) {
      formData.append('avatar', data.avatar[0]);
      // hasChanges = true;
    } else if (data.clearAvatar) {
      console.log('Clearing avatar in formData');
      formData.append('clearAvatar', 'true'); // Indicate that we want to clear the avatar
      // hasChanges = true;
    } else {
      console.log('No avatar change detected, not appending avatar to formData');
    }

    // --- New: Append PIN fields if newPin is provided ---
    if (data.newPin && data.newPin !== '') { // If new PIN is entered, send all PIN related data
      formData.append('currentPin', data.currentPin ?? ''); // Send currentPin as string (empty if not entered by user)
      formData.append('newPin', data.newPin);
      formData.append('confirmNewPin', data.newPin);

      // hasChanges = true;
    } else {
      // Edge case: User only enters currentPin but no newPin (Zod catches this but backend should handle gracefully)
      // For now, we'll rely on Zod to prevent this, but robust backend should also validate.
      console.log('Tidak ada pin baru');
    }
    console.log('Formdata ne mas before submission XX:', Object.fromEntries(formData.entries()));

    // if (!hasChanges) {
    //   setFormError("Tidak ada perubahan untuk disimpan.");
    //   setFormLoading(false);
    //   setLoadingInteractive(false);
    //   return;
    // }

    try {
      console.log('Submitting profile update mas andre');
      const response = await fetch(`${URL_SERVER}/api/editProfile/${user?.id}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${accessToken}` },
        body: formData,
        credentials: 'include',
      });

      const result = await response.json();

      // Handle specific error for incorrect current PIN
      if (response.status === 400 && result.error === 'Incorrect current PIN') {
        setFormError("PIN lama Anda salah.");
        return; // Stop execution here
      }

      if (response.status === 403) {
        await refreshAccessTokenAndUser();
        setFormError("Sesi Anda berakhir. Silakan coba lagi.");
        return;
      }

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update profile');
      }

      console.log('Profile updated successfully:', result.user);

      setCurrentUser(result.user);

      setIsModalOpen(false);
      reset();
      alert("Profil berhasil diperbarui!");

    } catch (err: unknown) {
      console.error("Error updating profile:", err);
      if (err instanceof Error) {
        setFormError(err.message); // Use the error message from throw new Error
      } else {
        setFormError("Terjadi kesalahan saat memperbarui profil. Silakan coba lagi.");
      }
    } finally {
      setFormLoading(false);
      setLoadingInteractive(false);
    }
  };

  // Ensure currentUser is updated when user from context changes
  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  if (!currentUser) {
    return <div className="text-center p-4">Memuat profil...</div>;
  }

  return (
    <div className="bg-white shadow-md rounded-lg p-6 mb-6">
      <div className="flex flex-col items-center">
        {/* Avatar Display */}
        {currentUser.avatar ? (
          <Image
            src={currentUser.avatar}
            alt={currentUser.name}
            className="w-30 h-30 rounded-full object-cover mt-5"
            width={120}
            height={120}
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
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label htmlFor="name" className="text-right col-span-2">
                    Name
                  </Label>
                  <Input
                    id="name"
                    {...register('name')}
                    className="col-span-3"
                  />
                  {errors.name && <p className="col-span-4 text-right text-red-500 text-sm">{errors.name.message}</p>}
                </div>

                {/* --- PIN Section --- */}
                {/* Current PIN Input (always visible when changing PIN) */}
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label htmlFor="currentPin" className="text-right col-span-2">
                    PIN Lama
                  </Label>
                  <Input
                    id="currentPin"
                    type="password"
                    maxLength={6}
                    {...register('currentPin')}
                    className="col-span-3"
                    placeholder="Masukkan PIN lama (jika ada)"
                  />
                  {errors.currentPin && <p className="col-span-4 text-right text-red-500 text-sm">{errors.currentPin.message}</p>}
                </div>

                {/* New PIN Input */}
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label htmlFor="newPin" className="text-right  col-span-2">
                    PIN Baru (6 digit)
                  </Label>
                  <Input
                    id="newPin"
                    type="password"
                    maxLength={6}
                    {...register('newPin')}
                    className="col-span-3"
                    placeholder="Biarkan kosong untuk tidak mengubah"
                  />
                  {errors.newPin && <p className="col-span-4 text-right text-red-500 text-sm">{errors.newPin.message}</p>}
                </div>

                {/* Confirm New PIN Input (only visible if newPin has a value) */}

                <div className="grid grid-cols-5 items-center gap-4">
                  <Label htmlFor="confirmNewPin" className="text-right col-span-2">
                    Konfirmasi PIN Baru
                  </Label>
                  <Input
                    id="confirmNewPin"
                    type="password"
                    maxLength={6}
                    {...register('confirmNewPin')}
                    className="col-span-3"
                    placeholder="Konfirmasi PIN baru"
                  />
                  {errors.confirmNewPin && <p className="col-span-4 text-right text-red-500 text-sm">{errors.confirmNewPin.message}</p>}
                </div>

                {/* {!currentUser.pin && !watchNewPin && ( // Hint if no PIN set yet
                  <p className="col-span-4 text-center text-gray-500 text-sm">Anda belum memiliki PIN. Masukkan PIN baru di atas.</p>
                )} */}
                {/* --- End PIN Section --- */}

                {/* Avatar Input */}
                <div className="grid grid-cols-5 items-center gap-4">
                  <Label htmlFor="avatar" className="text-right col-span-2">
                    Avatar
                  </Label>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    {...register('avatar')}
                    className="col-span-3"
                  />
                  {errors.avatar && <p className="col-span-4 text-right text-red-500 text-sm">Ukuran gambar terlalu besar atau format tidak didukung</p>}
                </div>

                {/* Avatar Preview & Clear Button */}
                {(avatarPreview || currentUser.avatar) && (
                  <div className="col-span-4 flex flex-col items-center gap-2">
                    <Image
                      src={avatarPreview || currentUser.avatar || ''}
                      alt="Avatar Preview"
                      className="w-24 h-24 rounded-full object-cover border border-gray-300 shadow-sm"
                      width={96}
                      height={96}
                    />

                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={handleClearAvatar}
                      disabled={watchClearAvatar}
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
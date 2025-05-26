"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { useAuth } from "@/context/authContext";
import LoadingOverlay from "@/components/LoadingOverlay";


const loginScheme = z.object({
  email: z.string().email("email tidak valid").min(1, "tidak boleh kosong"),
  password: z.string().min(1, "minimal 1 huruf").min(1, "tidak boleh kosong"),
})

type typeLoginValues = z.infer<typeof loginScheme>

import {URL_SERVER} from "@/interfaces";  

export default function LoginPage() {

  const router = useRouter();
  const {
    user,
    loading,
    login,
  } = useAuth(); // Ambil user dari context

  const [loadingInteractive, setLoadingInteractive] = useState(false);

  useEffect(() => {
    if (loading) {
      // router.replace('/login')
      console.log("/LOGIN : masih loading");
    } else {
      // cek apakah accessToken masih valid
      if (user){
        console.log("/LOGIN : Sudah ada user");
        
      }else{
        console.log("/LOGIN : Belum ada user");
        // verifyRefreshToken(refreshToken, user, accessToken, () => {
        //   router.replace("/");
        // })
      }
    }

  }, [loading, user]);

  const {
    register: loginField,
    handleSubmit,
    formState: { errors: errorsForm },
  } = useForm<typeLoginValues>({
    resolver: zodResolver(loginScheme),
  })

  const onSubmitLogin = async (data: typeLoginValues) => {
    setLoadingInteractive(true);
    // logic authentication
    try {
      const res = await fetch(`${URL_SERVER}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: data.email,
          password: data.password
        }),
      })

      const result = await res.json();
      console.log("Response from /api/login (cookie-based):", result);
      
      if (res.ok){
        console.log("hasil login :", result);
        
        login(result.accessToken, result.user);


        router.push("/"); // Redirect ke dashboard setelah login
      } else {
        alert(`Login failed: \n${result.message}`)
      }
    } catch (error: unknown) {
      console.error("Login gagal:", error);
    }
    setLoadingInteractive(false);

    router.push("/");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <Card className="md:w-[80%] max-w-md p-6 shadow-lg">
        <CardHeader>
          <CardTitle className="text-center text-2xl text-blue-400">Donate App</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmitLogin)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <Input
                type="email"
                {...loginField('email')}
                required
                placeholder="Enter your email"
              />
              {errorsForm.email && <p className="text-red-500 text-sm">{errorsForm.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <Input
                type="password"
                {...loginField("password")}
                required
                placeholder="Enter your password"
              />
              {errorsForm.password && <p className="text-red-500 text-sm">{errorsForm.password.message}</p>}
            </div>
            <Button type="submit" className="w-full bg-blue-400">Login</Button>

            <Button
              type="button"
              className="w-full mt-2 bg-gray-50 hover:bg-gray-300 text-slate-700"
              onClick={() => router.push("/register")}
            >
              Register Now!
            </Button>
          </form>
        </CardContent>
      </Card>
      {loadingInteractive && <LoadingOverlay />}
    </div>
  );
}

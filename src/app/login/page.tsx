"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { GraduationCap, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [schoolName, setSchoolName] = useState("School ERP"); // স্কুলের নামের স্টেট
  const router = useRouter();

  useEffect(() => {
    fetchSchoolSettings();
  }, []);

  const fetchSchoolSettings = async () => {
    const { data } = await supabase.from("school_settings").select("institution_name").eq("id", 1).single();
    if (data) setSchoolName(data.institution_name);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("username", username)
      .eq("password_hash", password)
      .single();

    setLoading(false);

    if (error) {
      toast.error(`Error: ${error.message}`);
      return;
    }

    if (data) {
      toast.success(`Welcome back, ${data.role}!`);
      localStorage.setItem("userRole", data.role);
      localStorage.setItem("userName", data.username);
      router.push("/dashboard"); 
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      <div className="hidden lg:flex flex-col justify-center items-center w-1/2 bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 text-white p-12 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
        
        <div className="z-10 text-center flex flex-col items-center">
          <GraduationCap className="w-20 h-20 mb-6 text-blue-300" />
          <h1 className="text-5xl font-extrabold mb-6 tracking-tight text-center">{schoolName}</h1> {/* ডাইনামিক নাম */}
          <p className="text-lg text-blue-200 max-w-md mx-auto leading-relaxed text-center">
            A comprehensive, modern, and intelligent management system for educational institutions in Bangladesh.
          </p>
        </div>
      </div>

      <div className="flex flex-col justify-center items-center w-full lg:w-1/2 p-6 sm:p-12">
        <div className="w-full max-w-md">
          <div className="text-center lg:hidden mb-8 flex flex-col items-center">
            <GraduationCap className="w-12 h-12 mb-2 text-blue-600" />
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{schoolName}</h1> {/* ডাইনামিক নাম */}
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-2xl shadow-xl shadow-blue-900/5 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome Back!</h2>
            <p className="text-sm text-gray-500 mb-8">Please enter your credentials to access the portal.</p>
            
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Username</label>
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} required placeholder="e.g. admin" className="w-full border border-gray-200 rounded-lg p-3 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" className="w-full border border-gray-200 rounded-lg p-3 pr-12 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all bg-gray-50 focus:bg-white" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
              
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3.5 rounded-lg transition-all shadow-md shadow-blue-500/30 disabled:opacity-70 flex justify-center items-center mt-4 cursor-pointer">
                {loading ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Signing in...</> : "Sign In"}
              </button>
            </form>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center text-center bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
            <p className="text-sm text-slate-500 mb-2">Are you a new student?</p>
            <Link href="/apply" className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 transition-colors">
              Apply for Online Admission <ArrowRight className="w-4 h-4 ml-1" />
            </Link>
          </div>

          <div className="mt-6 bg-blue-50 border border-blue-100 p-4 rounded-xl text-sm text-blue-800 text-center">
            <p className="font-semibold mb-2">Test Accounts (Password: 1234)</p>
            <div className="flex flex-wrap justify-center gap-3">
              <span className="bg-white px-3 py-1 rounded-md shadow-sm border border-blue-100 font-medium">admin</span>
              <span className="bg-white px-3 py-1 rounded-md shadow-sm border border-blue-100 font-medium">teacher</span>
              <span className="bg-white px-3 py-1 rounded-md shadow-sm border border-blue-100 font-medium">accountant</span>
              <span className="bg-white px-3 py-1 rounded-md shadow-sm border border-blue-100 font-medium">student</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
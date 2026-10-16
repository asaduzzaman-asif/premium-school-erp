"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../../components/Sidebar"; 
import Navbar from "../../components/Navbar";     

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const role = localStorage.getItem("userRole");
    if (!role) {
      router.push("/login");
    }
  }, [router]);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans print:h-auto print:overflow-visible print:bg-white">
      {/* Sidebar - Print korar somoy hide kora hobe */}
      <div className="print:hidden">
        <Sidebar />
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden print:overflow-visible">
        {/* Navbar - Print korar somoy hide kora hobe */}
        <div className="print:hidden">
          <Navbar />
        </div>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 print:p-0 print:overflow-visible">
          <div className="max-w-7xl mx-auto print:max-w-none print:m-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
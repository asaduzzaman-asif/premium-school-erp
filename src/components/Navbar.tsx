"use client";

import { useEffect, useState } from "react";

export default function Navbar() {
  const [userName, setUserName] = useState("");
  const [role, setRole] = useState("");

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "User");
    setRole(localStorage.getItem("userRole") || "Role");
  }, []);

  return (
    <header className="bg-white h-16 flex items-center justify-between px-6 border-b border-gray-200 sticky top-0 z-10">
      <h2 className="text-xl font-bold text-slate-800 hidden sm:block">Overview</h2>
      
      <div className="flex items-center gap-4 ml-auto">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-slate-800 capitalize">{userName}</p>
          <p className="text-xs text-blue-600 font-medium">{role}</p>
        </div>
        <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold shadow-md shadow-blue-200 uppercase">
          {userName.charAt(0)}
        </div>
      </div>
    </header>
  );
}
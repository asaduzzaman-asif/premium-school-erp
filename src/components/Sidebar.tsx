"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  LayoutDashboard, Users, UserCheck, BookOpen, 
  FileText, LogOut, DollarSign, Settings, GraduationCap, 
  Award, BellRing, UserPlus, Library, ClipboardList, FileBadge
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    router.push("/login");
  };

  let menus: any[] = [];

  if (role === "School Admin" || role === "Super Admin") {
    menus = [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Manage Admissions", path: "/dashboard/admissions", icon: UserPlus },
      { name: "Academic Setup", path: "/dashboard/academic", icon: BookOpen },
      { name: "Students", path: "/dashboard/students", icon: Users },
      { name: "Teachers & Staff", path: "/dashboard/teachers", icon: UserCheck },
      { name: "Attendance", path: "/dashboard/attendance", icon: FileText },
      { name: "Homework", path: "/dashboard/homework", icon: ClipboardList },
      { name: "Exams & Marks", path: "/dashboard/exams", icon: Award },
      { name: "Certificates", path: "/dashboard/certificates", icon: FileBadge },
      { name: "Notice Board", path: "/dashboard/notices", icon: BellRing }, 
      { name: "Finance & Fees", path: "/dashboard/finance", icon: DollarSign },
      { name: "Library", path: "/dashboard/library", icon: Library },
      { name: "Settings", path: "/dashboard/settings", icon: Settings },
    ];
  } else if (role === "Teacher") {
    menus = [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "My Students", path: "/dashboard/students", icon: Users },
      { name: "Take Attendance", path: "/dashboard/attendance", icon: FileText },
      { name: "Homework", path: "/dashboard/homework", icon: ClipboardList },
      { name: "Exams & Marks", path: "/dashboard/exams", icon: Award },
      { name: "Notice Board", path: "/dashboard/notices", icon: BellRing }, 
      { name: "Library", path: "/dashboard/library", icon: Library },
    ];
  } else if (role === "Accountant") {
    menus = [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "Finance & Fees", path: "/dashboard/finance", icon: DollarSign },
      { name: "Notice Board", path: "/dashboard/notices", icon: BellRing }, 
    ];
  } else if (role === "Parent" || role === "Student") {
    menus = [
      { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { name: "My Profile", path: "/dashboard/students", icon: Users },
      { name: "Homework", path: "/dashboard/homework", icon: ClipboardList },
      { name: "Notice Board", path: "/dashboard/notices", icon: BellRing }, 
      { name: "Library", path: "/dashboard/library", icon: Library },
    ];
  }

  return (
    <div className="w-64 bg-slate-900 text-slate-300 h-screen flex flex-col justify-between border-r border-slate-800 transition-all duration-300">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
          <GraduationCap className="w-8 h-8 text-blue-500 mr-3" />
          <span className="text-xl font-bold text-white tracking-wide">School ERP</span>
        </div>
        
        <div className="p-4 space-y-1 mt-4 overflow-y-auto max-h-[calc(100vh-140px)]">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Main Menu</p>
          {menus.map((menu, index) => {
            const Icon = menu.icon;
            const isActive = pathname === menu.path;
            
            return (
              <Link
                key={index}
                href={menu.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-900/20" 
                  : "hover:bg-slate-800 hover:text-white"
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-white" : "text-slate-400"}`} />
                <span className="font-medium text-sm">{menu.name}</span>
              </Link>
            );
          })}
        </div>
      </div>

      <div className="p-4 border-t border-slate-800 bg-slate-900">
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full bg-slate-800 hover:bg-red-600 text-slate-300 hover:text-white py-3 rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" /> Logout
        </button>
      </div>
    </div>
  );
}
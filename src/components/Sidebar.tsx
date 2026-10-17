"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserCheck, DollarSign, BellRing, BookOpen, Award, User, Phone, GraduationCap, ShieldCheck, Clock } from "lucide-react";

export default function DashboardPage() {
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({ students: 0, teachers: 0, notices: 0 });
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [studentInfo, setStudentInfo] = useState<any>(null);

  useEffect(() => {
    const currentRole = localStorage.getItem("userRole") || "";
    const currentUserName = localStorage.getItem("userName") || "";
    setRole(currentRole);
    setUserName(currentUserName);
    fetchDashboardData(currentRole, currentUserName);
  }, []);

  const fetchDashboardData = async (currentRole: string, currentUserName: string) => {
    const { count: sCount } = await supabase.from("students").select("*", { count: "exact", head: true });
    const { count: tCount } = await supabase.from("teachers").select("*", { count: "exact", head: true });
    const { count: nCount } = await supabase.from("notices").select("*", { count: "exact", head: true });
    
    setStats({ students: sCount || 0, teachers: tCount || 0, notices: nCount || 0 });

    const { data: nData } = await supabase.from("notices").select("*").order("created_at", { ascending: false }).limit(3);
    if (nData) setRecentNotices(nData);

    if (currentRole === "Student") {
      const { data: userData } = await supabase.from("users").select("id, created_at").eq("username", currentUserName).single();
      if (userData) {
        const { data: sData } = await supabase.from("students").select("*, classes(class_name), sections(section_name)").eq("user_id", userData.id).single();
        if (sData) setStudentInfo({ ...userData, ...sData });
      }
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Student Portal</h2>
        <p className="text-slate-500 mt-1">Welcome back, <span className="font-semibold text-slate-700">{userName}</span>! Here is your personal academic overview.</p>
      </div>

      {/* Student Specific View */}
      {role === "Student" ? (
        <div className="space-y-6">
          
          {/* Student Profile Top Banner Card */}
          <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-6">
            <div className="w-24 h-24 rounded-full border-4 border-white/30 bg-white text-blue-600 flex items-center justify-center text-3xl font-black shadow-lg shrink-0">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 text-center md:text-left space-y-1">
              <h1 className="text-3xl font-black">
                {studentInfo?.first_name ? `${studentInfo.first_name} ${studentInfo.last_name}` : userName}
              </h1>
              <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 pt-1">
                <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> Student
                </span>
                {studentInfo?.admission_no && (
                  <span className="text-xs text-blue-100 font-medium">ID: {studentInfo.admission_no}</span>
                )}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-6 py-4 rounded-xl border border-white/20 text-center shrink-0">
              <p className="text-xs text-blue-100 uppercase font-semibold">Attendance</p>
              <p className="text-2xl font-black mt-0.5">75%</p>
            </div>
          </div>

          {/* Student Personal & Academic Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                  <User className="w-5 h-5 text-blue-600" /> Academic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm font-semibold text-slate-400">Class & Section</span>
                  <span className="text-sm font-bold text-slate-700">{studentInfo?.classes?.class_name || "N/A"} ({studentInfo?.sections?.section_name || "N/A"})</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm font-semibold text-slate-400">Class Roll</span>
                  <span className="text-sm font-bold text-slate-700">{studentInfo?.roll_no || "N/A"}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm font-semibold text-slate-400">Shift</span>
                  <span className="text-sm font-bold text-slate-700">{studentInfo?.shift || "Morning"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-slate-400">Guardian Name</span>
                  <span className="text-sm font-bold text-slate-700">{studentInfo?.parent_name || "N/A"}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-3">
                <CardTitle className="text-base font-bold flex items-center gap-2 text-slate-800">
                  <Phone className="w-5 h-5 text-emerald-600" /> Contact & Account
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm font-semibold text-slate-400">Username</span>
                  <span className="text-sm font-bold text-slate-700">{userName}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-50">
                  <span className="text-sm font-semibold text-slate-400">Guardian Phone</span>
                  <span className="text-sm font-bold text-slate-700">{studentInfo?.parent_phone || "Not Provided"}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm font-semibold text-slate-400">Account Created</span>
                  <span className="text-sm font-bold text-slate-700">{studentInfo?.created_at ? new Date(studentInfo.created_at).toLocaleDateString() : "N/A"}</span>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Results & Fee Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50"><CardTitle className="text-lg font-bold flex items-center gap-2"><Award className="w-5 h-5 text-purple-600"/> Recent Exam Results</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Exam</TableHead><TableHead className="px-6 py-3">Subject</TableHead><TableHead className="px-6 py-3 text-right">Marks</TableHead></TableRow></TableHeader>
                  <TableBody><TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400 text-sm">No exam results published yet.</TableCell></TableRow></TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm">
              <CardHeader className="border-b border-slate-50 bg-slate-50/50"><CardTitle className="text-lg font-bold flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-600"/> Fee Status</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Month</TableHead><TableHead className="px-6 py-3">Amount</TableHead><TableHead className="px-6 py-3 text-right">Status</TableHead></TableRow></TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="px-6 py-4 font-medium">January</TableCell>
                      <TableCell className="px-6 py-4">৳ 500</TableCell>
                      <TableCell className="px-6 py-4 text-right"><span className="bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full text-xs font-bold">Paid</span></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

        </div>
      ) : (
        /* Admin / Teacher Overview View (Ager Moto Thakbe) */
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <Card className="border-slate-100 shadow-sm border-t-4 border-t-blue-500">
              <CardContent className="p-6 flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Total Students</p><h3 className="text-3xl font-black text-slate-800 mt-1">{stats.students}</h3></div>
                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600"><Users className="w-7 h-7"/></div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 shadow-sm border-t-4 border-t-emerald-500">
              <CardContent className="p-6 flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Total Teachers</p><h3 className="text-3xl font-black text-slate-800 mt-1">{stats.teachers}</h3></div>
                <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><UserCheck className="w-7 h-7"/></div>
              </CardContent>
            </Card>
            <Card className="border-slate-100 shadow-sm border-t-4 border-t-purple-500">
              <CardContent className="p-6 flex items-center justify-between">
                <div><p className="text-xs font-bold text-slate-400 uppercase">Published Notices</p><h3 className="text-3xl font-black text-slate-800 mt-1">{stats.notices}</h3></div>
                <div className="p-4 bg-purple-50 rounded-2xl text-purple-600"><BellRing className="w-7 h-7"/></div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-50 bg-slate-50/50"><CardTitle className="text-lg font-bold">Recent Notice Board</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Title</TableHead><TableHead className="px-6 py-3">Category</TableHead><TableHead className="px-6 py-3 text-right">Date</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recentNotices.map((n) => (
                    <TableRow key={n.id}>
                      <TableCell className="px-6 py-4 font-bold text-slate-800">{n.title}</TableCell>
                      <TableCell className="px-6 py-4"><span className="bg-blue-50 text-blue-600 px-2.5 py-1 rounded text-xs font-bold">{n.notice_type}</span></TableCell>
                      <TableCell className="px-6 py-4 text-right text-xs text-slate-500">{new Date(n.created_at).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}
                  {recentNotices.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">No notices found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, FileText, DollarSign, Award, GraduationCap, Clock } from "lucide-react";

export default function DashboardOverview() {
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  // অ্যাডমিনদের জন্য স্ট্যাটিস্টিকস স্টেট
  const [adminStats, setAdminStats] = useState({
    students: 0,
    teachers: 0,
    totalFees: 0,
    totalExpenses: 0,
  });

  // স্টুডেন্ট/পেরেন্টদের জন্য ডেটা স্টেট
  const [studentData, setStudentData] = useState({
    profile: null as any,
    attendanceStats: { present: 0, total: 0 },
    recentResults: [] as any[],
    recentFees: [] as any[],
  });

  useEffect(() => {
    const currentRole = localStorage.getItem("userRole") || "";
    const currentUserName = localStorage.getItem("userName") || "";
    setRole(currentRole);
    setUserName(currentUserName);

    if (currentRole === "School Admin" || currentRole === "Super Admin") {
      fetchAdminStats();
    } else if (currentRole === "Student" || currentRole === "Parent") {
      fetchStudentDashboardData(currentUserName);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAdminStats = async () => {
    const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true });
    const { count: teacherCount } = await supabase.from("teachers").select("*", { count: "exact", head: true });
    
    const { data: expensesData } = await supabase.from("expenses").select("amount");
    const totalExpenses = expensesData ? expensesData.reduce((sum, item) => sum + Number(item.amount), 0) : 0;

    let totalFees = 0;
    const { data: feesData } = await supabase.from("fees").select("amount").eq("status", "Paid");
    if(feesData) totalFees = feesData.reduce((sum, item) => sum + Number(item.amount), 0);

    setAdminStats({
      students: studentCount || 0,
      teachers: teacherCount || 0,
      totalFees,
      totalExpenses,
    });
    setLoading(false);
  };

  const fetchStudentDashboardData = async (username: string) => {
    // প্রথমে ইউজারের আইডি দিয়ে স্টুডেন্ট প্রোফাইল বের করা
    const { data: userData } = await supabase.from("users").select("id").eq("username", username).single();
    if (!userData) {
      setLoading(false);
      return;
    }

    const { data: profileData } = await supabase
      .from("students")
      .select("*, classes(class_name), sections(section_name)")
      .eq("user_id", userData.id)
      .single();

    if (profileData) {
      // হাজিরা ডেটা আনা
      const { data: attendanceData } = await supabase
        .from("attendance")
        .select("status")
        .eq("student_id", profileData.id);
      
      const totalDays = attendanceData ? attendanceData.length : 0;
      const presentDays = attendanceData ? attendanceData.filter(a => a.status === "Present").length : 0;

      // রেজাল্ট আনা
      const { data: resultsData } = await supabase
        .from("exam_marks")
        .select("*, subjects(subject_name), exams(exam_name)")
        .eq("student_id", profileData.id)
        .order("id", { ascending: false })
        .limit(5);

      // ফি ডেটা আনা
      const { data: feesData } = await supabase
        .from("fees")
        .select("*")
        .eq("student_id", profileData.id)
        .order("created_at", { ascending: false })
        .limit(5);

      setStudentData({
        profile: profileData,
        attendanceStats: { present: presentDays, total: totalDays },
        recentResults: resultsData || [],
        recentFees: feesData || [],
      });
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><p className="text-slate-500 flex items-center gap-2"><Clock className="w-5 h-5 animate-spin" /> Loading Dashboard...</p></div>;
  }

  // ================= স্টুডেন্ট ও পেরেন্ট ভিউ =================
  if (role === "Student" || role === "Parent") {
    const { profile, attendanceStats, recentResults, recentFees } = studentData;
    const attendancePercentage = attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-md text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, {profile ? `${profile.first_name}` : userName}!</h2>
            <p className="text-blue-100">
              {profile ? `Class: ${profile.classes?.class_name} | Section: ${profile.sections?.section_name} | Roll: ${profile.admission_no}` : "Student Portal"}
            </p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/30 text-center min-w-[150px]">
            <p className="text-sm font-medium text-blue-100">Attendance</p>
            <p className="text-4xl font-extrabold">{attendancePercentage}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Exam Results */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-600" /> Recent Exam Results
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="px-6 py-3">Exam</TableHead>
                    <TableHead className="px-6 py-3">Subject</TableHead>
                    <TableHead className="px-6 py-3 text-right">Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentResults.map((result) => (
                    <TableRow key={result.id}>
                      <TableCell className="px-6 py-4 font-medium text-slate-800">{result.exams?.exam_name}</TableCell>
                      <TableCell className="px-6 py-4 text-slate-600">{result.subjects?.subject_name}</TableCell>
                      <TableCell className="px-6 py-4 text-right font-bold text-emerald-600">{result.marks_obtained} / {result.max_marks}</TableCell>
                    </TableRow>
                  ))}
                  {recentResults.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-slate-400">No exam results published yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Recent Fee Payments */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" /> Fee Status
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="px-6 py-3">Month</TableHead>
                    <TableHead className="px-6 py-3">Amount</TableHead>
                    <TableHead className="px-6 py-3 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFees.map((fee) => (
                    <TableRow key={fee.id}>
                      <TableCell className="px-6 py-4 font-medium text-slate-800">{fee.month}</TableCell>
                      <TableCell className="px-6 py-4 text-slate-600">৳ {fee.amount}</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${fee.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                          {fee.status}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {recentFees.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-slate-400">No fee records found.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ================= ডিফল্ট অ্যাডমিন ভিউ =================
  const netBalance = adminStats.totalFees - adminStats.totalExpenses;
  
  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            Welcome back, <span className="text-blue-600 capitalize">{userName}</span>!
          </h2>
          <p className="text-slate-500 mt-2">
            You are logged in to the Premium School ERP System as a <span className="font-semibold text-slate-700">{role}</span>.
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-100 shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider flex items-center gap-2"><Users className="w-4 h-4" /> Total Students</h3>
            <p className="text-3xl font-bold text-slate-800 mt-3">{adminStats.students}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider flex items-center gap-2"><GraduationCap className="w-4 h-4" /> Total Teachers</h3>
            <p className="text-3xl font-bold text-slate-800 mt-3">{adminStats.teachers}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-6">
            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider flex items-center gap-2"><DollarSign className="w-4 h-4" /> Total Fees</h3>
            <p className="text-3xl font-bold text-emerald-600 mt-3">৳ {adminStats.totalFees}</p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-6">
            <h3 className="text-slate-500 text-sm font-medium uppercase tracking-wider flex items-center gap-2"><DollarSign className="w-4 h-4" /> Total Expenses</h3>
            <p className="text-3xl font-bold text-red-600 mt-3">৳ {adminStats.totalExpenses}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 shadow-sm max-w-2xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-800">Financial Overview</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="flex justify-between items-center text-slate-700">
            <span>Total Income (From Student Fees)</span>
            <span className="font-semibold text-emerald-600">+ ৳ {adminStats.totalFees}</span>
          </div>
          <div className="flex justify-between items-center text-slate-700">
            <span>Total Institutional Expenses</span>
            <span className="font-semibold text-red-600">- ৳ {adminStats.totalExpenses}</span>
          </div>
          <div className="flex justify-between items-center pt-4 border-t border-slate-200 text-xl">
            <span className="font-bold text-slate-900">Net Balance</span>
            <span className={`font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ৳ {netBalance}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
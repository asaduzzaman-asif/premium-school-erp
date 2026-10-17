"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, DollarSign, Award, GraduationCap, Clock, UserCheck, UserX, FileText, BellRing, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function DashboardOverview() {
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(true);

  // ================= ADMIN STATS STATE =================
  const [adminStats, setAdminStats] = useState({
    students: 0,
    teachers: 0,
    staff: 0,
    presentToday: 0,
    absentToday: 0,
    totalFees: 0,
    dueAmount: 0,
    totalExpenses: 0,
  });

  const [notices, setNotices] = useState<any[]>([]);
  const [classStats, setClassStats] = useState<any[]>([]);

  // ================= STUDENT/PARENT STATS STATE =================
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

    if (currentRole === "School Admin" || currentRole === "Super Admin" || currentRole === "Teacher" || currentRole === "Accountant") {
      fetchAdminStats();
    } else if (currentRole === "Student" || currentRole === "Parent") {
      fetchStudentDashboardData(currentUserName);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchAdminStats = async () => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Total Students, Teachers & Staff
    const { count: studentCount } = await supabase.from("students").select("*", { count: "exact", head: true });
    const { count: teacherCount } = await supabase.from("teachers").select("*", { count: "exact", head: true });
    
    // 2. Today's Attendance & Absence
    const { data: attendanceData } = await supabase.from("attendance").select("status").eq("date", today);
    const presentToday = attendanceData?.filter(a => a.status === "Present" || a.status === "Late").length || 0;
    const absentToday = attendanceData?.filter(a => a.status === "Absent").length || 0;

    // 3. Monthly Fee Collection & Due Amount
    let totalFees = 0;
    const { data: feesData } = await supabase.from("fees").select("amount, status");
    if(feesData) {
      totalFees = feesData.filter(f => f.status === "Paid").reduce((sum, item) => sum + Number(item.amount), 0);
    }
    // (Mock due calculation: Assuming average fee per student is 1500 for demo)
    const expectedRevenue = (studentCount || 0) * 1500;
    const dueAmount = expectedRevenue > totalFees ? expectedRevenue - totalFees : 0;

    // 4. Expenses
    const { data: expensesData } = await supabase.from("expenses").select("amount");
    const totalExpenses = expensesData ? expensesData.reduce((sum, item) => sum + Number(item.amount), 0) : 0;

    // 5. Upcoming Exams, Events & Notices
    const { data: noticeData } = await supabase.from("notices").select("*").order("created_at", { ascending: false }).limit(4);
    if(noticeData) setNotices(noticeData);

    // 6. Class/Section Quick Statistics
    const { data: classesData } = await supabase.from("classes").select("id, class_name");
    const { data: allStudents } = await supabase.from("students").select("class_id");
    
    if (classesData && allStudents) {
      const stats = classesData.map(cls => ({
        name: cls.class_name,
        count: allStudents.filter(s => s.class_id === cls.id).length
      }));
      setClassStats(stats);
    }

    setAdminStats({
      students: studentCount || 0,
      teachers: teacherCount || 0,
      staff: 12, // Placeholder for staff count
      presentToday,
      absentToday,
      totalFees,
      dueAmount,
      totalExpenses,
    });
    setLoading(false);
  };

  const fetchStudentDashboardData = async (username: string) => {
    const { data: userData } = await supabase.from("users").select("id").eq("username", username).single();
    if (!userData) { setLoading(false); return; }

    const { data: profileData } = await supabase.from("students").select("*, classes(class_name), sections(section_name)").eq("user_id", userData.id).single();

    if (profileData) {
      const { data: attendanceData } = await supabase.from("attendance").select("status").eq("student_id", profileData.id);
      const totalDays = attendanceData ? attendanceData.length : 0;
      const presentDays = attendanceData ? attendanceData.filter(a => a.status === "Present").length : 0;

      const { data: resultsData } = await supabase.from("exam_marks").select("*, subjects(subject_name), exams(exam_name)").eq("student_id", profileData.id).order("id", { ascending: false }).limit(5);
      const { data: feesData } = await supabase.from("fees").select("*").eq("student_id", profileData.id).order("created_at", { ascending: false }).limit(5);

      setStudentData({
        profile: profileData, attendanceStats: { present: presentDays, total: totalDays }, recentResults: resultsData || [], recentFees: feesData || [],
      });
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="flex h-64 items-center justify-center"><p className="text-slate-500 flex items-center gap-2"><Clock className="w-5 h-5 animate-spin" /> Loading Dashboard...</p></div>;
  }

  // ================= স্টুডেন্ট ও পেরেন্ট ভিউ (আগের মতোই থাকবে) =================
  if (role === "Student" || role === "Parent") {
    const { profile, attendanceStats, recentResults, recentFees } = studentData;
    const attendancePercentage = attendanceStats.total > 0 ? Math.round((attendanceStats.present / attendanceStats.total) * 100) : 0;

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 rounded-2xl shadow-md text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, {profile ? `${profile.first_name}` : userName}!</h2>
            <p className="text-blue-100">{profile ? `Class: ${profile.classes?.class_name} | Section: ${profile.sections?.section_name} | Roll: ${profile.admission_no}` : "Student Portal"}</p>
          </div>
          <div className="bg-white/20 p-4 rounded-xl backdrop-blur-sm border border-white/30 text-center min-w-[150px]">
            <p className="text-sm font-medium text-blue-100">Attendance</p>
            <p className="text-4xl font-extrabold">{attendancePercentage}%</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2"><Award className="w-5 h-5 text-purple-600" /> Recent Exam Results</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Exam</TableHead><TableHead className="px-6 py-3">Subject</TableHead><TableHead className="px-6 py-3 text-right">Marks</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recentResults.map((result) => (
                    <TableRow key={result.id}><TableCell className="px-6 py-4 font-medium text-slate-800">{result.exams?.exam_name}</TableCell><TableCell className="px-6 py-4 text-slate-600">{result.subjects?.subject_name}</TableCell><TableCell className="px-6 py-4 text-right font-bold text-emerald-600">{result.marks_obtained} / {result.max_marks}</TableCell></TableRow>
                  ))}
                  {recentResults.length === 0 && (<TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">No exam results published yet.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-600" /> Fee Status</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Month</TableHead><TableHead className="px-6 py-3">Amount</TableHead><TableHead className="px-6 py-3 text-right">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {recentFees.map((fee) => (
                    <TableRow key={fee.id}><TableCell className="px-6 py-4 font-medium text-slate-800">{fee.month}</TableCell><TableCell className="px-6 py-4 text-slate-600">৳ {fee.amount}</TableCell><TableCell className="px-6 py-4 text-right"><span className={`px-3 py-1 rounded-full text-xs font-semibold ${fee.status === 'Paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>{fee.status}</span></TableCell></TableRow>
                  ))}
                  {recentFees.length === 0 && (<TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">No fee records found.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // ================= ADMIN, TEACHER & ACCOUNTANT VIEW =================
  
  // Charts Data Format
  const revenueData = [
    { name: 'Financials', Income: adminStats.totalFees, Expense: adminStats.totalExpenses, Due: adminStats.dueAmount }
  ];
  const attendancePieData = [
    { name: 'Present', value: adminStats.presentToday, color: '#10b981' },
    { name: 'Absent', value: adminStats.absentToday, color: '#ef4444' },
    { name: 'Not Recorded', value: adminStats.students - (adminStats.presentToday + adminStats.absentToday), color: '#cbd5e1' }
  ];

  return (
    <div className="space-y-6">
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Welcome back, <span className="text-blue-600 capitalize">{userName}</span>!</h2>
          <p className="text-slate-500 mt-1 text-sm">System Overview & Management Analytics</p>
        </div>
        <div className="bg-slate-100 px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 border border-slate-200">
          Role: {role}
        </div>
      </div>
      
      {/* 1. Total Students, Teachers & Staff | 2. Today's Attendance | 3. Fee Collection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-slate-100 shadow-sm border-t-4 border-t-blue-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Total People</p>
              <h3 className="text-2xl font-black text-slate-800 mt-1">{adminStats.students} <span className="text-sm font-medium text-slate-500">St.</span></h3>
              <p className="text-xs text-slate-400 mt-1">{adminStats.teachers} Teachers, {adminStats.staff} Staff</p>
            </div>
            <Users className="w-10 h-10 text-blue-100" />
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm border-t-4 border-t-emerald-500">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Today's Attendance</p>
              <h3 className="text-2xl font-black text-emerald-600 mt-1">{adminStats.presentToday}</h3>
              <p className="text-xs text-red-400 mt-1 font-semibold">{adminStats.absentToday} Absent Today</p>
            </div>
            <UserCheck className="w-10 h-10 text-emerald-100" />
          </CardContent>
        </Card>

        {(role === "School Admin" || role === "Super Admin" || role === "Accountant") && (
          <>
            <Card className="border-slate-100 shadow-sm border-t-4 border-t-indigo-500">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Collected Fees</p>
                  <h3 className="text-2xl font-black text-indigo-600 mt-1">৳ {adminStats.totalFees}</h3>
                  <p className="text-xs text-slate-400 mt-1">This month collection</p>
                </div>
                <DollarSign className="w-10 h-10 text-indigo-100" />
              </CardContent>
            </Card>

            <Card className="border-slate-100 shadow-sm border-t-4 border-t-amber-500">
              <CardContent className="p-5 flex items-center justify-between">
                <div>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-wider">Due Amount</p>
                  <h3 className="text-2xl font-black text-amber-600 mt-1">৳ {adminStats.dueAmount}</h3>
                  <p className="text-xs text-slate-400 mt-1">Pending payments</p>
                </div>
                <FileText className="w-10 h-10 text-amber-100" />
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* 5. Revenue & Expense Chart */}
        {(role === "School Admin" || role === "Super Admin" || role === "Accountant") && (
          <Card className="border-slate-100 shadow-sm xl:col-span-2">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-indigo-600"/> Revenue & Expense Overview</CardTitle>
            </CardHeader>
            <CardContent className="p-6 h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <Tooltip cursor={{fill: '#f8fafc'}} />
                  <Legend />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Due" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* 5. Today's Attendance Chart */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2"><UserCheck className="w-4 h-4 text-emerald-600"/> Today's Attendance Ratio</CardTitle>
          </CardHeader>
          <CardContent className="p-6 h-[300px] flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={attendancePieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {attendancePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 4. Upcoming Notices & Events */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2"><BellRing className="w-4 h-4 text-blue-600"/> Latest Notices & Events</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {notices.map((notice) => (
                <div key={notice.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-slate-800 text-sm">{notice.title}</h4>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-bold">{new Date(notice.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{notice.description}</p>
                </div>
              ))}
              {notices.length === 0 && <p className="text-center text-sm text-slate-400 py-8">No recent notices found.</p>}
            </div>
          </CardContent>
        </Card>

        {/* 6. Class/Section Quick Statistics */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2"><Users className="w-4 h-4 text-purple-600"/> Class Quick Statistics</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-6 py-3">Class Name</TableHead>
                  <TableHead className="px-6 py-3 text-right">Total Enrolled Students</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classStats.map((cls, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="px-6 py-3 font-semibold text-slate-700">{cls.name}</TableCell>
                    <TableCell className="px-6 py-3 text-right">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-bold">{cls.count} Students</span>
                    </TableCell>
                  </TableRow>
                ))}
                {classStats.length === 0 && (
                  <TableRow><TableCell colSpan={2} className="text-center py-8 text-slate-400">No classes found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
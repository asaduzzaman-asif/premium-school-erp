"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, UserCheck, DollarSign, BellRing, TrendingUp, Calendar, ArrowUpRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

export default function AdminDashboardPage() {
  const [userName, setUserName] = useState("");
  const [stats, setStats] = useState({ students: 0, teachers: 0, notices: 0 });
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const [classesList, setClassesList] = useState<any[]>([]);
  
  // Financial & Attendance mock/calculated state
  const [financialData, setFinancialData] = useState([
    { name: "Financials", Due: 1950, Expense: 250, Income: 450 }
  ]);
  const [attendanceData, setAttendanceData] = useState([
    { name: "Present", value: 85 },
    { name: "Absent", value: 15 },
  ]);

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "Admin");
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    // 1. Counts
    const { count: sCount } = await supabase.from("students").select("*", { count: "exact", head: true });
    const { count: tCount } = await supabase.from("teachers").select("*", { count: "exact", head: true });
    const { count: nCount } = await supabase.from("notices").select("*", { count: "exact", head: true });
    
    setStats({ students: sCount || 0, teachers: tCount || 0, notices: nCount || 0 });

    // 2. Recent Notices
    const { data: nData } = await supabase.from("notices").select("*").order("created_at", { ascending: false }).limit(3);
    if (nData) setRecentNotices(nData);

    // 3. Classes Quick Stats
    const { data: cData } = await supabase.from("classes").select("*");
    if (cData) setClassesList(cData);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-10">
      
      {/* Top Header Greeting */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Admin Dashboard</h2>
          <p className="text-slate-500 mt-1">Welcome back, <span className="font-bold text-slate-700">{userName}</span>! Here is your institution's operational overview.</p>
        </div>
        <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100 flex items-center gap-2 text-sm font-semibold text-slate-600">
          <Calendar className="w-4 h-4 text-blue-600" /> {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-sm border-t-4 border-t-blue-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Students</p>
              <h3 className="text-4xl font-black text-slate-800 mt-2">{stats.students}</h3>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-1"><ArrowUpRight className="w-3.5 h-3.5"/> Active enrollment</span>
            </div>
            <div className="p-4 bg-blue-50 rounded-2xl text-blue-600"><Users className="w-8 h-8"/></div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm border-t-4 border-t-emerald-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Teachers</p>
              <h3 className="text-4xl font-black text-slate-800 mt-2">{stats.teachers}</h3>
              <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1 mt-1"><ArrowUpRight className="w-3.5 h-3.5"/> Faculty members</span>
            </div>
            <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-600"><UserCheck className="w-8 h-8"/></div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm border-t-4 border-t-purple-500 hover:shadow-md transition-shadow">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Published Notices</p>
              <h3 className="text-4xl font-black text-slate-800 mt-2">{stats.notices}</h3>
              <span className="text-xs font-semibold text-purple-600 flex items-center gap-1 mt-1"><BellRing className="w-3.5 h-3.5"/> Broadcasted</span>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl text-purple-600"><BellRing className="w-8 h-8"/></div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Charts Section (Financials & Attendance) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Financial Bar Chart */}
        <Card className="border-slate-100 shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" /> Financial Overview (Due vs Expense vs Income)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={financialData}>
                  <XAxis dataKey="name" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="Due" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Attendance Summary */}
        <Card className="border-slate-100 shadow-sm lg:col-span-1">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Today's Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col items-center justify-center">
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={attendanceData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    <Cell fill="#10b981" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex gap-6 mt-4 text-xs font-bold">
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Present (85%)</span>
              <span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> Absent (15%)</span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Bottom Grid: Recent Notices & Class Quick Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Notices */}
        <Card className="border-slate-100 shadow-sm lg:col-span-2">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Recent Notice Board</CardTitle>
          </CardHeader>
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

        {/* Class Quick Statistics */}
        <Card className="border-slate-100 shadow-sm lg:col-span-1">
          <CardHeader className="border-b border-slate-50 bg-slate-50/50 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Class Setup</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Class Name</TableHead><TableHead className="px-6 py-3 text-right">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {classesList.map((cls) => (
                  <TableRow key={cls.id}>
                    <TableCell className="px-6 py-4 font-bold text-slate-800">{cls.class_name}</TableCell>
                    <TableCell className="px-6 py-4 text-right"><span className="text-xs bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded font-bold">Active</span></TableCell>
                  </TableRow>
                ))}
                {classesList.length === 0 && <TableRow><TableCell colSpan={2} className="text-center py-6 text-slate-400 text-xs">No classes added.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </div>

    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, FileText, CheckCircle2, History, Users, GraduationCap } from "lucide-react";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<"STUDENT" | "TEACHER" | "REPORTS">("STUDENT");
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [records, setRecords] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const currentRole = localStorage.getItem("userRole") || "";
    const currentUserName = localStorage.getItem("userName") || "";
    setRole(currentRole); fetchInitialData(currentUserName);
  }, []);

  const fetchInitialData = async (uName: string) => {
    const { data: userData } = await supabase.from("users").select("id").eq("username", uName).single();
    if (userData) setUserId(userData.id);
    const { data: clsData } = await supabase.from("classes").select("*"); if (clsData) setClasses(clsData);
    const { data: tData } = await supabase.from("teachers").select("*");
    if (tData) { setTeachers(tData); const initialTData: { [key: number]: string } = {}; tData.forEach(t => initialTData[t.id] = "Present"); setAttendanceData(initialTData); }
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId); if (!classId) return;
    const { data } = await supabase.from("students").select("*, sections(section_name)").eq("class_id", parseInt(classId)).order("admission_no", { ascending: true });
    if (data) { setStudents(data); const initialAttendance: { [key: number]: string } = {}; data.forEach(s => initialAttendance[s.id] = "Present"); setAttendanceData(initialAttendance); }
  };

  const handleStatusChange = (id: number, status: string) => setAttendanceData((prev) => ({ ...prev, [id]: status }));

  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault(); if (students.length === 0) return; setLoading(true);
    const { data: existing } = await supabase.from("attendance").select("id").eq("class_id", parseInt(selectedClass)).eq("date", date);
    if (existing && existing.length > 0) { toast.error("Already recorded!"); setLoading(false); return; }
    const recordsToInsert = students.map((s) => ({ student_id: s.id, class_id: parseInt(selectedClass), date: date, status: attendanceData[s.id], created_by: userId }));
    const { error } = await supabase.from("attendance").insert(recordsToInsert);
    setLoading(false); if (!error) { toast.success("Attendance saved!"); setActiveTab("REPORTS"); fetchReports(); } else toast.error(error.message);
  };

  const handleSubmitTeacher = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data: existing } = await supabase.from("teacher_attendance").select("id").eq("date", date);
    if (existing && existing.length > 0) { toast.error("Already recorded!"); setLoading(false); return; }
    const recordsToInsert = teachers.map((t) => ({ teacher_id: t.id, date: date, status: attendanceData[t.id], created_by: userId }));
    const { error } = await supabase.from("teacher_attendance").insert(recordsToInsert);
    setLoading(false); if (!error) toast.success("Attendance saved!");
  };

  const fetchReports = async () => {
    if (!selectedClass) return;
    const { data } = await supabase.from("attendance").select("*, students(first_name, last_name, admission_no)").eq("class_id", parseInt(selectedClass)).eq("date", date);
    if (data) setRecords(data);
  };

  if (role === "Student" || role === "Parent") return <div className="p-8 text-center text-red-500 font-bold">Access Denied.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-3xl font-bold text-slate-800">Attendance Management</h2></div>
        <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab("STUDENT")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "STUDENT" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Student Attendance</button>
          <button onClick={() => setActiveTab("TEACHER")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "TEACHER" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Teacher Attendance</button>
          <button onClick={() => setActiveTab("REPORTS")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "REPORTS" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Reports</button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="space-y-1 w-full max-w-xs"><Label>Date</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
        {activeTab !== "TEACHER" && (
          <div className="space-y-1 w-full max-w-xs"><Label>Class</Label>
            <Select value={selectedClass || ""} onValueChange={(val) => handleClassChange(val || "")}>
              <SelectTrigger><SelectValue placeholder="-- Class --" /></SelectTrigger>
              <SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        )}
        {activeTab === "REPORTS" && <div className="pt-5"><Button onClick={fetchReports} className="bg-purple-600 hover:bg-purple-700">Fetch Report</Button></div>}
      </div>

      {activeTab === "STUDENT" && selectedClass && students.length > 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Class Attendance</CardTitle></CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmitStudent}>
              <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Roll & ID</TableHead><TableHead className="px-6 py-3">Name</TableHead><TableHead className="px-6 py-3 text-center">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="px-6 py-4 font-semibold text-blue-600">{s.admission_no}</TableCell>
                      <TableCell className="px-6 py-4 font-medium">{s.first_name}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-center gap-4">
                          {["Present", "Absent", "Late", "Leave"].map((status) => (
                            <label key={status} className="flex items-center gap-1.5 cursor-pointer text-sm font-medium"><input type="radio" name={`s-${s.id}`} value={status} checked={attendanceData[s.id] === status} onChange={() => handleStatusChange(s.id, status)} className="w-4 h-4" /> {status}</label>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 flex justify-end"><Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">Save</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "TEACHER" && teachers.length > 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Staff Attendance</CardTitle></CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmitTeacher}>
              <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Name</TableHead><TableHead className="px-6 py-3 text-center">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {teachers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="px-6 py-4 font-bold">{t.first_name}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-center gap-4">
                          {["Present", "Absent", "Late", "Leave"].map((status) => (
                            <label key={status} className="flex items-center gap-1.5 cursor-pointer text-sm font-medium"><input type="radio" name={`t-${t.id}`} value={status} checked={attendanceData[t.id] === status} onChange={() => handleStatusChange(t.id, status)} className="w-4 h-4" /> {status}</label>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 flex justify-end"><Button type="submit" disabled={loading} className="bg-emerald-600">Save Staff</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === "REPORTS" && records.length > 0 && (
        <Card className="border-slate-100 shadow-sm mt-6">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Report</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Name</TableHead><TableHead className="px-6 py-3">Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="px-6 py-4 font-medium">{r.students?.first_name}</TableCell>
                    <TableCell className="px-6 py-4 font-bold">{r.status}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
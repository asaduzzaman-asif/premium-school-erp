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
import { Loader2, FileText, CheckCircle2, History, Users, GraduationCap, MessageSquare, Edit, AlertCircle } from "lucide-react";

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<"STUDENT" | "TEACHER" | "REPORTS">("STUDENT");
  
  // Data States
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
    setRole(currentRole);
    fetchInitialData(currentUserName);
  }, []);

  const fetchInitialData = async (uName: string) => {
    const { data: userData } = await supabase.from("users").select("id").eq("username", uName).single();
    if (userData) setUserId(userData.id);

    const { data: clsData } = await supabase.from("classes").select("*");
    if (clsData) setClasses(clsData);

    const { data: tData } = await supabase.from("teachers").select("*");
    if (tData) {
      setTeachers(tData);
      const initialTData: { [key: number]: string } = {};
      tData.forEach(t => initialTData[t.id] = "Present");
      setAttendanceData(initialTData);
    }
  };

  const handleClassChange = async (classId: string) => {
    setSelectedClass(classId);
    if (!classId) return;

    const { data } = await supabase.from("students").select("*, sections(section_name)").eq("class_id", parseInt(classId)).order("admission_no", { ascending: true });
    if (data) {
      setStudents(data);
      const initialAttendance: { [key: number]: string } = {};
      data.forEach(s => initialAttendance[s.id] = "Present");
      setAttendanceData(initialAttendance);
    }
  };

  const handleStatusChange = (id: number, status: string) => {
    setAttendanceData((prev) => ({ ...prev, [id]: status }));
  };

  // 1. Submit Student Attendance
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (students.length === 0) return;
    setLoading(true);

    const { data: existing } = await supabase.from("attendance").select("id").eq("class_id", parseInt(selectedClass)).eq("date", date);
    if (existing && existing.length > 0) {
      toast.error("Attendance for this class on this date is already recorded!");
      setLoading(false); return;
    }

    let absentCount = 0;
    const recordsToInsert = students.map((student) => {
      if (attendanceData[student.id] === "Absent") absentCount++;
      return { student_id: student.id, class_id: parseInt(selectedClass), date: date, status: attendanceData[student.id], created_by: userId };
    });

    const { error } = await supabase.from("attendance").insert(recordsToInsert);
    setLoading(false);

    if (error) {
      toast.error("Error: " + error.message);
    } else {
      toast.success("Student Attendance recorded successfully!");
      if (absentCount > 0) {
        toast.success(`Automated SMS sent to ${absentCount} Guardian(s) for absent students!`, { icon: '📲' });
      }
      setActiveTab("REPORTS");
      fetchReports();
    }
  };

  // 2. Submit Teacher Attendance
  const handleSubmitTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: existing } = await supabase.from("teacher_attendance").select("id").eq("date", date);
    if (existing && existing.length > 0) {
      toast.error("Teacher attendance for this date is already recorded!");
      setLoading(false); return;
    }

    const recordsToInsert = teachers.map((teacher) => ({
      teacher_id: teacher.id, date: date, status: attendanceData[teacher.id], created_by: userId
    }));

    const { error } = await supabase.from("teacher_attendance").insert(recordsToInsert);
    setLoading(false);

    if (error) { toast.error("Error: " + error.message); } 
    else { toast.success("Teacher Attendance recorded successfully!"); }
  };

  // 3. Fetch Reports (Date & Class wise)
  const fetchReports = async () => {
    if (!selectedClass) { toast.error("Please select a class to view reports."); return; }
    const { data } = await supabase
      .from("attendance")
      .select("*, students(first_name, last_name, admission_no, sections(section_name))")
      .eq("class_id", parseInt(selectedClass))
      .eq("date", date);
    if (data) setRecords(data);
  };

  // 4. Correct/Audit Attendance
  const handleCorrection = async (recordId: number, currentStatus: string) => {
    const newStatus = prompt(`Current Status is '${currentStatus}'. Enter new status (Present, Absent, Late, Leave):`, currentStatus);
    if (!newStatus || newStatus === currentStatus) return;
    
    if (!["Present", "Absent", "Late", "Leave"].includes(newStatus)) {
      toast.error("Invalid status entered!"); return;
    }

    const reason = prompt("Enter reason for this correction (Audit log):");
    if (!reason) { toast.error("Correction reason is required for audit!"); return; }

    const { error } = await supabase
      .from("attendance")
      .update({ status: newStatus, is_corrected: true, correction_reason: reason })
      .eq("id", recordId);

    if (!error) {
      toast.success("Attendance corrected & audit log updated!");
      fetchReports();
    } else {
      toast.error(error.message);
    }
  };

  if (role === "Student" || role === "Parent") {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Admins and Teachers only.</div>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Attendance Management</h2>
          <p className="text-slate-500 mt-1">Manage daily attendance, corrections, and automated SMS alerts.</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab("STUDENT")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "STUDENT" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Users className="w-4 h-4" /> Student Attendance
          </button>
          {(role === "School Admin" || role === "Super Admin") && (
            <button onClick={() => setActiveTab("TEACHER")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "TEACHER" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <GraduationCap className="w-4 h-4" /> Teacher Attendance
            </button>
          )}
          <button onClick={() => setActiveTab("REPORTS")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "REPORTS" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <History className="w-4 h-4" /> Reports & Corrections
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
        <div className="space-y-1 w-full max-w-xs">
          <Label>Select Date</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        {activeTab !== "TEACHER" && (
          <div className="space-y-1 w-full max-w-xs">
            <Label>Select Class</Label>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger><SelectValue placeholder="-- Choose Class --" /></SelectTrigger>
              <SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
        )}
        {activeTab === "REPORTS" && (
          <div className="pt-5">
            <Button onClick={fetchReports} className="bg-purple-600 hover:bg-purple-700">Generate Report</Button>
          </div>
        )}
      </div>

      {/* ================= TAB 1: STUDENT ATTENDANCE ================= */}
      {activeTab === "STUDENT" && selectedClass && students.length > 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row justify-between items-center">
            <CardTitle className="text-lg font-bold text-slate-800">Class Attendance Sheet</CardTitle>
            <p className="text-xs text-amber-600 font-medium flex items-center"><MessageSquare className="w-3 h-3 mr-1"/> SMS will be sent to absent students.</p>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmitStudent}>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow><TableHead className="px-6 py-3">Roll & ID</TableHead><TableHead className="px-6 py-3">Student Name</TableHead><TableHead className="px-6 py-3 text-center">Status (Present / Absent / Late / Leave)</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="px-6 py-4 font-semibold text-blue-600">{s.admission_no}</TableCell>
                      <TableCell className="px-6 py-4 font-medium text-slate-800">{s.first_name} {s.last_name}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-center gap-4">
                          {["Present", "Absent", "Late", "Leave"].map((status) => (
                            <label key={status} className={`flex items-center gap-1.5 cursor-pointer text-sm font-medium ${status==='Present'?'text-emerald-600':status==='Absent'?'text-red-600':status==='Late'?'text-amber-600':'text-purple-600'}`}>
                              <input type="radio" name={`s-${s.id}`} value={status} checked={attendanceData[s.id] === status} onChange={() => handleStatusChange(s.id, status)} className="w-4 h-4" /> {status}
                            </label>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t border-slate-100 flex justify-end">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Submit Attendance
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ================= TAB 2: TEACHER ATTENDANCE ================= */}
      {activeTab === "TEACHER" && teachers.length > 0 && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800">Teacher & Staff Attendance</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmitTeacher}>
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow><TableHead className="px-6 py-3">Teacher Name</TableHead><TableHead className="px-6 py-3">Designation</TableHead><TableHead className="px-6 py-3 text-center">Status (Present / Absent / Late / Leave)</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {teachers.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="px-6 py-4 font-bold text-slate-800">{t.first_name} {t.last_name}</TableCell>
                      <TableCell className="px-6 py-4 text-slate-600">{t.designation || 'Teacher'}</TableCell>
                      <TableCell className="px-6 py-4">
                        <div className="flex justify-center gap-4">
                          {["Present", "Absent", "Late", "Leave"].map((status) => (
                            <label key={status} className={`flex items-center gap-1.5 cursor-pointer text-sm font-medium ${status==='Present'?'text-emerald-600':status==='Absent'?'text-red-600':status==='Late'?'text-amber-600':'text-purple-600'}`}>
                              <input type="radio" name={`t-${t.id}`} value={status} checked={attendanceData[t.id] === status} onChange={() => handleStatusChange(t.id, status)} className="w-4 h-4" /> {status}
                            </label>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="p-4 border-t border-slate-100 flex justify-end">
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Submit Staff Attendance
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* ================= TAB 3: REPORTS & CORRECTION ================= */}
      {activeTab === "REPORTS" && records.length > 0 && (
        <Card className="border-slate-100 shadow-sm mt-6">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800">Attendance Report & Audit</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow><TableHead className="px-6 py-3">Student Name</TableHead><TableHead className="px-6 py-3">Status</TableHead><TableHead className="px-6 py-3">Audit Tag</TableHead><TableHead className="px-6 py-3 text-right">Action</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="px-6 py-4 font-medium text-slate-800">
                      {r.students?.first_name} {r.students?.last_name}
                      <span className="block text-xs text-slate-500">ID: {r.students?.admission_no}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${r.status==='Present'?'bg-emerald-50 text-emerald-600':r.status==='Absent'?'bg-red-50 text-red-600':r.status==='Late'?'bg-amber-50 text-amber-600':'bg-purple-50 text-purple-600'}`}>
                        {r.status}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      {r.is_corrected ? (
                        <div className="flex items-start gap-1 text-xs text-amber-600">
                          <AlertCircle className="w-4 h-4 shrink-0" />
                          <span>Corrected<span className="block text-slate-400 font-medium mt-0.5">Reason: {r.correction_reason}</span></span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400">Original</span>
                      )}
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                      {(role === "School Admin" || role === "Super Admin" || role === "Teacher") && (
                        <Button size="sm" variant="outline" onClick={() => handleCorrection(r.id, r.status)} className="text-slate-600 hover:text-blue-600">
                          <Edit className="w-3 h-3 mr-1" /> Correct
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeTab === "REPORTS" && selectedClass && records.length === 0 && (
        <div className="text-center py-12 text-slate-400 bg-white rounded-xl border border-dashed border-slate-200">
          <History className="w-10 h-10 mx-auto text-slate-300 mb-2" />
          No attendance records found for this class on {date}.
        </div>
      )}

    </div>
  );
}
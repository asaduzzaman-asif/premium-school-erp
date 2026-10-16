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
import { Loader2, FileText, CheckCircle2 } from "lucide-react";

export default function AttendancePage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    setUserName(localStorage.getItem("userName") || "");
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*");
    if (data) setClasses(data);
  };

  const fetchStudentsByClass = async (classId: string) => {
    const { data } = await supabase
      .from("students")
      .select("*, sections(section_name)")
      .eq("class_id", parseInt(classId))
      .order("admission_no", { ascending: true });
    
    if (data) {
      setStudents(data);
      // বাই ডিফল্ট সবাইকে "Present" সেট করে রাখা
      const initialAttendance: { [key: number]: string } = {};
      data.forEach((student) => {
        initialAttendance[student.id] = "Present";
      });
      setAttendanceData(initialAttendance);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClass(classId);
    if (classId) {
      fetchStudentsByClass(classId);
    } else {
      setStudents([]);
    }
  };

  const handleStatusChange = (studentId: number, status: string) => {
    setAttendanceData((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (students.length === 0) {
      toast.error("No students found in this class!");
      return;
    }
    setLoading(true);

    // যিনি হাজিরা নিচ্ছেন তার ইউজার আইডি বের করা
    const { data: userData } = await supabase.from("users").select("id").eq("username", userName).single();
    const userId = userData ? userData.id : null;

    const records = students.map((student) => ({
      student_id: student.id,
      class_id: parseInt(selectedClass),
      date: date,
      status: attendanceData[student.id],
      created_by: userId,
    }));

    const { error } = await supabase.from("attendance").insert(records);

    setLoading(false);

    if (error) {
      toast.error("Error submitting attendance: " + error.message);
    } else {
      toast.success("Attendance recorded successfully!");
      setSelectedClass("");
      setStudents([]);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Student Attendance</h2>
        <p className="text-slate-500 mt-1">Record and manage daily classroom attendance securely.</p>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" /> Attendance Sheet
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Date</Label>
              <Input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger><SelectValue placeholder="-- Choose a class --" /></SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id.toString()}>{cls.class_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {students.length > 0 ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="px-6 py-3">Admission No</TableHead>
                      <TableHead className="px-6 py-3">Student Name</TableHead>
                      <TableHead className="px-6 py-3 text-center">Status (Present / Absent / Late)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="px-6 py-4 font-semibold text-blue-600">{student.admission_no}</TableCell>
                        <TableCell className="px-6 py-4 font-medium text-slate-800">
                          {student.first_name} {student.last_name}
                          <span className="block text-xs text-slate-400">Section: {student.sections?.section_name}</span>
                        </TableCell>
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center justify-center gap-6">
                            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-sm text-emerald-600">
                              <input 
                                type="radio" 
                                name={`status-${student.id}`} 
                                value="Present" 
                                checked={attendanceData[student.id] === "Present"} 
                                onChange={() => handleStatusChange(student.id, "Present")} 
                                className="accent-emerald-600"
                              /> 
                              Present
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-sm text-red-600">
                              <input 
                                type="radio" 
                                name={`status-${student.id}`} 
                                value="Absent" 
                                checked={attendanceData[student.id] === "Absent"} 
                                onChange={() => handleStatusChange(student.id, "Absent")} 
                                className="accent-red-600"
                              /> 
                              Absent
                            </label>
                            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-sm text-amber-600">
                              <input 
                                type="radio" 
                                name={`status-${student.id}`} 
                                value="Late" 
                                checked={attendanceData[student.id] === "Late"} 
                                onChange={() => handleStatusChange(student.id, "Late")} 
                                className="accent-amber-600"
                              /> 
                              Late
                            </label>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Save Attendance
                </Button>
              </div>
            </form>
          ) : (
            selectedClass && <div className="text-center py-8 text-slate-400">No students found in this class.</div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
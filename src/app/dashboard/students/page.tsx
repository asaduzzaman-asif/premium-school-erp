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
import { Loader2, UserPlus, Users, UserCircle, Filter, Archive, Search, Download, Edit, Trash2 } from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  
  const [myClasses, setMyClasses] = useState<any[]>([]);
  const [filterClassId, setFilterClassId] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState(""); 

  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [userName, setUserName] = useState("");

  const [formData, setFormData] = useState({
    first_name: "", last_name: "", admission_no: "", roll_no: "", dob: "",
    parent_name: "", parent_phone: "", class_id: "", section_id: "", shift: "Morning",
    username: "", password: "password123",
  });

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    const uName = localStorage.getItem("userName") || "";
    setUserRole(role);
    setUserName(uName);
    fetchClasses();
    fetchSections();
    fetchStudents(role, uName);
  }, []);

  useEffect(() => {
    if (formData.class_id) {
      const filtered = sections.filter((sec) => sec.class_id.toString() === formData.class_id);
      setFilteredSections(filtered);
    } else {
      setFilteredSections([]);
    }
  }, [formData.class_id, sections]);

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*");
    if (data) setClasses(data);
  };

  const fetchSections = async () => {
    const { data } = await supabase.from("sections").select("*");
    if (data) setSections(data);
  };

  const fetchStudents = async (role: string, uName: string) => {
    let query = supabase
      .from("students")
      .select(`*, classes(class_name), sections(section_name)`)
      .neq("status", "Archived") // Archive হওয়া স্টুডেন্টদের হাইড করবে
      .order("created_at", { ascending: false });
    
    if (role === "Student" || role === "Parent") {
      const { data: userData } = await supabase.from("users").select("id").eq("username", uName).single();
      if (userData) {
        // এই লজিকটি নিজের আইডি অথবা প্যারেন্ট আইডির সব বাচ্চাকে একসাথে খুঁজে বের করবে
        const { data } = await query.or(`user_id.eq.${userData.id},parent_user_id.eq.${userData.id}`);
        if (data) setStudents(data);
      }
    } 
    else if (role === "Teacher") {
      const { data: userData } = await supabase.from("users").select("id").eq("username", uName).single();
      if (userData) {
        const { data: teacherData } = await supabase.from("teachers").select("id").eq("user_id", userData.id).single();
        if (teacherData) {
          const { data: assignments } = await supabase.from("teacher_assignments").select("class_id, section_id, classes(class_name)").eq("teacher_id", teacherData.id);
          if (assignments && assignments.length > 0) {
            const uniqueClasses: any[] = [];
            const map = new Map();
            assignments.forEach(item => {
              if(!map.has(item.class_id)){ map.set(item.class_id, true); // আগের কোড: uniqueClasses.push({ id: item.class_id, name: item.classes?.class_name });
// নতুন কোড:
uniqueClasses.push({ id: item.class_id, name: (item.classes as any)?.class_name });; }
            });
            setMyClasses(uniqueClasses);

            const classIds = assignments.map(a => a.class_id);
            const { data: studentData } = await query.in("class_id", classIds);
            if (studentData) {
              const exactAssigned = studentData.filter(student => assignments.some(a => a.class_id === student.class_id && a.section_id === student.section_id));
              setStudents(exactAssigned);
            }
          } else { setStudents([]); }
        }
      }
    } 
    else {
      const { data } = await query;
      if (data) setStudents(data);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{ username: formData.username, password_hash: formData.password, role: "Student" }])
      .select()
      .single();

    if (userError) {
      toast.error(`Error: Username already exists!`);
      setLoading(false); return;
    }

    const { error: studentError } = await supabase.from("students").insert([
      {
        user_id: userData.id, first_name: formData.first_name, last_name: formData.last_name,
        admission_no: formData.admission_no, roll_no: formData.roll_no, dob: formData.dob, shift: formData.shift,
        parent_name: formData.parent_name, parent_phone: formData.parent_phone,
        class_id: parseInt(formData.class_id), section_id: parseInt(formData.section_id),
      },
    ]);

    setLoading(false);
    if (studentError) {
      await supabase.from("users").delete().eq("id", userData.id);
      toast.error(studentError.message);
    } else {
      toast.success("Student admitted successfully!");
      fetchStudents(userRole, userName);
      setFormData({
        first_name: "", last_name: "", admission_no: "", roll_no: "", dob: "",
        parent_name: "", parent_phone: "", class_id: "", section_id: "", shift: "Morning",
        username: "", password: "password123"
      });
    }
  };

  // স্টুডেন্ট Archive (Soft Delete) করার ফাংশন
  const handleArchiveStudent = async (studentId: number) => {
    if (!window.confirm("Are you sure you want to Archive this student? They will be removed from the active list.")) return;
    const { error } = await supabase.from("students").update({ status: 'Archived' }).eq("id", studentId);
    if (error) {
      toast.error("Failed to archive: " + error.message);
    } else {
      toast.success("Student Archived (TC / Passed out) successfully!");
      fetchStudents(userRole, userName);
    }
  };

  // স্টুডেন্টকে একেবারে মুছে ফেলা (Hard Delete)
  const handleDeleteStudent = async (studentId: number, userId: number) => {
    if (!window.confirm("Are you sure you want to permanently delete this student? This action cannot be undone.")) return;

    const { error: studentError } = await supabase.from("students").delete().eq("id", studentId);

    if (studentError) {
      toast.error("Failed to delete student: " + studentError.message);
      return;
    }

    if (userId) {
      await supabase.from("users").delete().eq("id", userId);
    }

    toast.success("Student deleted successfully!");
    fetchStudents(userRole, userName);
  };

  // CSV Export (Bulk Export)
  const exportToCSV = () => {
    const headers = ["Admission ID", "Roll No", "Student Name", "Class", "Section", "Shift", "Guardian Name", "Phone"];
    const csvData = displayedStudents.map(s => [
      s.admission_no, s.roll_no || "", `${s.first_name} ${s.last_name}`, 
      s.classes?.class_name || "", s.sections?.section_name || "", 
      s.shift || "Morning", s.parent_name, s.parent_phone
    ]);
    const csvContent = [headers.join(","), ...csvData.map(e => e.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Students_Export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Search & Filter Logic
  const displayedStudents = students.filter(student => {
    const matchesClass = filterClassId === "ALL" || student.class_id.toString() === filterClassId;
    const searchString = `${student.first_name} ${student.last_name} ${student.admission_no} ${student.roll_no}`.toLowerCase();
    const matchesSearch = searchString.includes(searchQuery.toLowerCase());
    return matchesClass && matchesSearch;
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">
            {userRole === "School Admin" || userRole === "Super Admin" || userRole === "Principal" ? "Student Management" : (userRole === "Parent") ? "My Children" : (userRole === "Student") ? "My Profile" : "My Assigned Students"}
          </h2>
          <p className="text-slate-500 mt-1">Manage admissions, profiles, and directory records.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Search Bar */}
          {(userRole === "School Admin" || userRole === "Super Admin" || userRole === "Principal" || userRole === "Teacher") && (
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input placeholder="Search by name or ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
          )}

          {/* Export Button */}
          {(userRole === "School Admin" || userRole === "Super Admin" || userRole === "Principal") && (
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2 bg-white text-slate-700">
              <Download className="w-4 h-4" /> Export CSV
            </Button>
          )}

          {/* Class Filter */}
          {userRole === "Teacher" && myClasses.length > 0 && (
            <div className="w-full sm:w-48 bg-white p-1 rounded-md shadow-sm border border-slate-200 flex items-center">
              <Filter className="w-4 h-4 text-slate-400 ml-2 mr-1" />
              <Select value={filterClassId || "ALL"} onValueChange={(val) => setFilterClassId(val || "ALL")}>
                <SelectTrigger className="border-0 shadow-none focus:ring-0 text-sm font-semibold h-8"><SelectValue placeholder="Class" /></SelectTrigger>
                <SelectContent><SelectItem value="ALL">All Classes</SelectItem>{myClasses.map((c: any) => (<SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {(userRole === "School Admin" || userRole === "Super Admin" || userRole === "Principal") && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" /> New Student Admission
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Row 1: Name & IDs */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input name="first_name" value={formData.first_name} onChange={handleInputChange} required /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input name="last_name" value={formData.last_name} onChange={handleInputChange} required /></div>
                <div className="space-y-2"><Label>Admission ID</Label><Input name="admission_no" value={formData.admission_no} onChange={handleInputChange} required placeholder="ST-2026-001" /></div>
                <div className="space-y-2"><Label>Class Roll No</Label><Input name="roll_no" value={formData.roll_no} onChange={handleInputChange} required placeholder="e.g. 101" /></div>
              </div>

              {/* Row 2: Academic & Demographics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Assign Class</Label>
                  <Select value={formData.shift || ""} onValueChange={(val) => setFormData({ ...formData, shift: val })}>
                    <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                    <SelectContent>{classes.map(cls => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.class_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign Section</Label>
                  <Select value={filterClassId || ""} onValueChange={setFilterClassId}>
                    <SelectTrigger><SelectValue placeholder="Select Section" /></SelectTrigger>
                    <SelectContent>{filteredSections.map(sec => <SelectItem key={sec.id} value={sec.id.toString()}>Section {sec.section_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Shift</Label>
                  <Select value={formData.shift} onValueChange={(val) => setFormData({ ...formData, shift: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="Morning">Morning Shift</SelectItem><SelectItem value="Day">Day Shift</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Birth Registration (DOB)</Label><Input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required /></div>
              </div>

              {/* Row 3: Guardian Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Guardian / Parent Name</Label><Input name="parent_name" value={formData.parent_name} onChange={handleInputChange} required /></div>
                <div className="space-y-2"><Label>Parent Phone No</Label><Input name="parent_phone" value={formData.parent_phone} onChange={handleInputChange} required /></div>
              </div>

              <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 flex flex-col md:flex-row gap-4">
                <div className="flex-1 space-y-2"><Label className="text-xs text-blue-900 font-bold">Portal Username</Label><Input name="username" value={formData.username} onChange={handleInputChange} required /></div>
                <div className="flex-1 space-y-2"><Label className="text-xs text-blue-900 font-bold">Default Password</Label><Input name="password" value={formData.password} onChange={handleInputChange} required /></div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />} Enroll Student
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* স্টুডেন্ট ডিরেক্টরি টেবিল */}
      <Card className="border-slate-100 shadow-sm mt-6">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            {userRole === "Student" || userRole === "Parent" ? <UserCircle className="w-5 h-5 text-indigo-600" /> : <Users className="w-5 h-5 text-indigo-600" />} 
            {userRole === "Parent" ? "My Children Directory" : "Active Students Directory"}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6 py-3">Roll & ID</TableHead>
                <TableHead className="px-6 py-3">Student Name</TableHead>
                <TableHead className="px-6 py-3">Class Info</TableHead>
                <TableHead className="px-6 py-3">Guardian Info</TableHead>
                {(userRole === "School Admin" || userRole === "Super Admin" || userRole === "Principal") && <TableHead className="px-6 py-3 text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayedStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="px-6 py-4">
                    <p className="font-bold text-blue-600">Roll: {student.roll_no || 'N/A'}</p>
                    <p className="text-xs text-slate-500">ID: {student.admission_no}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4 font-medium text-slate-800">{student.first_name} {student.last_name}</TableCell>
                  <TableCell className="px-6 py-4 text-slate-600">
                    <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{student.classes?.class_name}</span> 
                    <span className="block text-xs mt-1">Sec: {student.sections?.section_name} | {student.shift || 'Morning'}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="font-medium text-slate-800">{student.parent_name}</p>
                    <p className="text-xs text-slate-500">{student.parent_phone}</p>
                  </TableCell>
                  
                  {/* Actions: Edit & Archive */}
                  {(userRole === "School Admin" || userRole === "Super Admin" || userRole === "Principal") && (
                    <TableCell className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" variant="ghost" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 h-8 w-8 p-0" title="Edit Student">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" variant="ghost" title="Archive / Transfer"
                          className="text-slate-400 hover:text-amber-600 hover:bg-amber-50 h-8 w-8 p-0" 
                          onClick={() => handleArchiveStudent(student.id)}
                        >
                          <Archive className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="sm" variant="ghost" title="Permanently Delete"
                          className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0" 
                          onClick={() => handleDeleteStudent(student.id, student.user_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {displayedStudents.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400">No active students found matching your criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
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
import { Loader2, UserPlus, Users } from "lucide-react";

export default function StudentsPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [filteredSections, setFilteredSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    admission_no: "",
    parent_name: "",
    parent_phone: "",
    class_id: "",
    section_id: "",
    username: "",
    password: "password123",
  });

  useEffect(() => {
    setUserRole(localStorage.getItem("userRole") || "");
    fetchClasses();
    fetchSections();
    fetchStudents();
  }, []);

  // ক্লাস পরিবর্তন হলে শুধু ওই ক্লাসের সেকশন ফিল্টার করা
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

  const fetchStudents = async () => {
    const { data, error } = await supabase
      .from("students")
      .select(`
        *,
        classes (class_name),
        sections (section_name)
      `)
      .order("created_at", { ascending: false });
    
    if (!error && data) setStudents(data);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ধাপ ১: ইউজারের লগিন অ্যাকাউন্ট তৈরি করা
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{ username: formData.username, password_hash: formData.password, role: "Student" }])
      .select()
      .single();

    if (userError) {
      toast.error(`Login Error: Username already exists! Try a different one.`);
      setLoading(false);
      return;
    }

    // ধাপ ২: স্টুডেন্ট প্রোফাইল তৈরি করা
    const { error: studentError } = await supabase.from("students").insert([
      {
        user_id: userData.id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        admission_no: formData.admission_no,
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone,
        class_id: parseInt(formData.class_id),
        section_id: parseInt(formData.section_id),
      },
    ]);

    setLoading(false);

    if (studentError) {
      await supabase.from("users").delete().eq("id", userData.id);
      toast.error(`Profile Error: ${studentError.message}`);
    } else {
      toast.success("Student admitted successfully!");
      fetchStudents();
      setFormData({
        first_name: "", last_name: "", admission_no: "", parent_name: "", parent_phone: "", class_id: "", section_id: "", username: "", password: "password123"
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">
          {userRole === "School Admin" || userRole === "Super Admin" ? "New Student Admission" : "Enrolled Students"}
        </h2>
        <p className="text-slate-500 mt-1">Manage student admissions, profiles, and directory records.</p>
      </div>

      {/* শুধু অ্যাডমিন হলে ভর্তির ফর্ম দেখতে পাবে */}
      {(userRole === "School Admin" || userRole === "Super Admin") && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-blue-600" /> Student Information & Portal Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input name="first_name" value={formData.first_name} onChange={handleInputChange} required placeholder="e.g. Asaduzzaman" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input name="last_name" value={formData.last_name} onChange={handleInputChange} required placeholder="e.g. Asif" />
                </div>
                <div className="space-y-2">
                  <Label>Admission No</Label>
                  <Input name="admission_no" value={formData.admission_no} onChange={handleInputChange} required placeholder="e.g. ST-2026-001" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Assign Class</Label>
                  <Select value={formData.class_id} onValueChange={(val) => setFormData({ ...formData, class_id: val })}>
                    <SelectTrigger><SelectValue placeholder="-- Select Class --" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(cls => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.class_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Assign Section</Label>
                  <Select value={formData.section_id} onValueChange={(val) => setFormData({ ...formData, section_id: val })} disabled={!formData.class_id}>
                    <SelectTrigger><SelectValue placeholder="-- Select Section --" /></SelectTrigger>
                    <SelectContent>
                      {filteredSections.map(sec => <SelectItem key={sec.id} value={sec.id.toString()}>Section {sec.section_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Guardian / Parent Name</Label>
                  <Input name="parent_name" value={formData.parent_name} onChange={handleInputChange} required placeholder="Guardian name" />
                </div>
                <div className="space-y-2">
                  <Label>Parent Phone No</Label>
                  <Input name="parent_phone" value={formData.parent_phone} onChange={handleInputChange} required placeholder="017XXXXXXXX" />
                </div>
              </div>

              <div className="bg-blue-50/50 p-5 rounded-xl border border-blue-100 space-y-4">
                <h4 className="text-sm font-bold text-blue-900">Student Portal Login Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Login Username (Unique)</Label>
                    <Input name="username" value={formData.username} onChange={handleInputChange} required placeholder="e.g. student_asif" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Default Password</Label>
                    <Input name="password" value={formData.password} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />} Complete Admission
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* স্টুডেন্ট ডিরেক্টরি টেবিল */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" /> Enrolled Students Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6 py-3">Admission No</TableHead>
                <TableHead className="px-6 py-3">Student Name</TableHead>
                <TableHead className="px-6 py-3">Class & Section</TableHead>
                <TableHead className="px-6 py-3">Guardian Info</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="px-6 py-4 font-semibold text-blue-600">{student.admission_no}</TableCell>
                  <TableCell className="px-6 py-4 font-medium text-slate-800">{student.first_name} {student.last_name}</TableCell>
                  <TableCell className="px-6 py-4 text-slate-600">
                    <span className="font-semibold">{student.classes?.class_name}</span> - Section {student.sections?.section_name}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="font-medium text-slate-800">{student.parent_name}</p>
                    <p className="text-xs text-slate-500">{student.parent_phone}</p>
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-400">No students enrolled yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
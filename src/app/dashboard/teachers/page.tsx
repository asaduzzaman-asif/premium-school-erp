"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserCheck, UserPlus } from "lucide-react";

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    employee_id: "",
    phone: "",
    email: "",
    designation: "Assistant Teacher",
    basic_salary: "",
    username: "",
    password: "password123",
  });

  useEffect(() => {
    setUserRole(localStorage.getItem("userRole") || "");
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    const { data, error } = await supabase
      .from("teachers")
      .select("*")
      .order("id", { ascending: false });
    
    if (!error && data) setTeachers(data);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // ধাপ ১: টিচারের লগিন অ্যাকাউন্ট তৈরি করা
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{ username: formData.username, password_hash: formData.password, role: "Teacher" }])
      .select()
      .single();

    if (userError) {
      toast.error(`Login Error: Username already exists! Try a different one.`);
      setLoading(false);
      return;
    }

    // ধাপ ২: টিচার প্রোফাইল তৈরি করা
    const { error: teacherError } = await supabase.from("teachers").insert([
      {
        user_id: userData.id,
        employee_id: formData.employee_id,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
        email: formData.email,
        designation: formData.designation,
        basic_salary: parseFloat(formData.basic_salary) || 0,
      },
    ]);

    setLoading(false);

    if (teacherError) {
      await supabase.from("users").delete().eq("id", userData.id);
      toast.error(`Profile Error: ${teacherError.message}`);
    } else {
      toast.success("Teacher added successfully!");
      fetchTeachers();
      setFormData({
        first_name: "", last_name: "", employee_id: "", phone: "", email: "", designation: "Assistant Teacher", basic_salary: "", username: "", password: "password123"
      });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Teachers & Staff Management</h2>
        <p className="text-slate-500 mt-1">Manage teacher profiles, designations, salaries, and portal credentials.</p>
      </div>

      {/* শুধু অ্যাডমিন হলে টিচার অ্যাড করার ফর্ম দেখতে পাবে */}
      {(userRole === "School Admin" || userRole === "Super Admin") && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-600" /> Add New Teacher Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input name="first_name" value={formData.first_name} onChange={handleInputChange} required placeholder="e.g. Md. Rohim" />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input name="last_name" value={formData.last_name} onChange={handleInputChange} required placeholder="e.g. Uddin" />
                </div>
                <div className="space-y-2">
                  <Label>Employee ID</Label>
                  <Input name="employee_id" value={formData.employee_id} onChange={handleInputChange} required placeholder="e.g. TR-2026-01" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input name="phone" value={formData.phone} onChange={handleInputChange} required placeholder="017XXXXXXXX" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="teacher@school.com" />
                </div>
                <div className="space-y-2">
                  <Label>Basic Salary (৳)</Label>
                  <Input type="number" name="basic_salary" value={formData.basic_salary} onChange={handleInputChange} required placeholder="Amount in BDT" />
                </div>
              </div>

              <div className="bg-purple-50/50 p-5 rounded-xl border border-purple-100 space-y-4">
                <h4 className="text-sm font-bold text-purple-900">Teacher Portal Login Credentials</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Login Username (Unique)</Label>
                    <Input name="username" value={formData.username} onChange={handleInputChange} required placeholder="e.g. teacher_rohim" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Default Password</Label>
                    <Input name="password" value={formData.password} onChange={handleInputChange} required />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 px-8">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <UserPlus className="w-4 h-4 mr-2" />} Save Teacher
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* টিচার্স ডিরেক্টরি টেবিল */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" /> Teachers Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6 py-3">Employee ID</TableHead>
                <TableHead className="px-6 py-3">Teacher Name</TableHead>
                <TableHead className="px-6 py-3">Contact Info</TableHead>
                <TableHead className="px-6 py-3">Joining Date</TableHead>
                {(userRole === "School Admin" || userRole === "Super Admin") && (
                  <TableHead className="px-6 py-3">Basic Salary</TableHead>
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teachers.map((teacher) => (
                <TableRow key={teacher.id}>
                  <TableCell className="px-6 py-4 font-semibold text-purple-600">{teacher.employee_id}</TableCell>
                  <TableCell className="px-6 py-4 font-medium text-slate-800">{teacher.first_name} {teacher.last_name}</TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="text-slate-800">{teacher.phone}</p>
                    <p className="text-xs text-slate-500">{teacher.email || "N/A"}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-slate-600">
                    {new Date(teacher.joining_date).toLocaleDateString()}
                  </TableCell>
                  {(userRole === "School Admin" || userRole === "Super Admin") && (
                    <TableCell className="px-6 py-4 font-semibold text-slate-800">
                      ৳ {teacher.basic_salary}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {teachers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400">No teachers added yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
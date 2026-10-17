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
import { Loader2, UserCheck, Briefcase, Banknote, Trash2 } from "lucide-react";

export default function TeachersPage() {
  const [staffList, setStaffList] = useState<any[]>([]);
  const [payrollHistory, setPayrollHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<"DIRECTORY" | "PAYROLL">("DIRECTORY");
  const [role, setRole] = useState("");

  const [formData, setFormData] = useState({ first_name: "", last_name: "", subject: "", phone: "", designation: "Teacher", joining_date: "", basic_salary: "", document_url: "", username: "", password: "password123" });
  const [payrollData, setPayrollData] = useState({ teacher_id: "", month: "", allowance: "0", deduction: "0" });

  useEffect(() => { setRole(localStorage.getItem("userRole") || ""); fetchStaff(); fetchPayroll(); }, []);

  const fetchStaff = async () => { const { data } = await supabase.from("teachers").select("*, teacher_assignments(id)").order("created_at", { ascending: false }); if (data) setStaffList(data); };
  const fetchPayroll = async () => { const { data } = await supabase.from("payroll").select("*, teachers(first_name, last_name, designation)").order("created_at", { ascending: false }); if (data) setPayrollHistory(data); };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { data: userData, error: userError } = await supabase.from("users").insert([{ username: formData.username, password_hash: formData.password, role: formData.designation === "Teacher" ? "Teacher" : "Accountant" }]).select().single();
    if (userError) { toast.error(`Error: Username already exists!`); setLoading(false); return; }

    const { error: staffError } = await supabase.from("teachers").insert([{ user_id: userData.id, first_name: formData.first_name, last_name: formData.last_name, subject: formData.subject, phone: formData.phone, designation: formData.designation, joining_date: formData.joining_date, basic_salary: Number(formData.basic_salary), document_url: formData.document_url }]);
    setLoading(false);
    if (staffError) { await supabase.from("users").delete().eq("id", userData.id); toast.error(staffError.message); } 
    else { toast.success("Staff profile created!"); fetchStaff(); setFormData({ first_name: "", last_name: "", subject: "", phone: "", designation: "Teacher", joining_date: "", basic_salary: "", document_url: "", username: "", password: "password123" }); }
  };

  const handlePayrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); const staff = staffList.find(s => s.id.toString() === payrollData.teacher_id); if (!staff) return;
    const basic = Number(staff.basic_salary); const allowance = Number(payrollData.allowance); const deduction = Number(payrollData.deduction); const netSalary = basic + allowance - deduction;
    setLoading(true);
    const { error } = await supabase.from("payroll").insert([{ teacher_id: staff.id, month: payrollData.month, basic_salary: basic, allowance, deduction, net_salary: netSalary }]);
    await supabase.from("expenses").insert([{ title: `Salary - ${staff.first_name}`, category: "Salary", amount: netSalary, date: new Date().toISOString().split('T')[0] }]);
    setLoading(false); if (!error) { toast.success(`Payroll generated!`); fetchPayroll(); } else { toast.error(error.message); }
  };

  const deleteStaff = async (staffId: number, userId: number) => { if (!window.confirm("Delete employee?")) return; await supabase.from("teachers").delete().eq("id", staffId); if (userId) await supabase.from("users").delete().eq("id", userId); toast.success("Removed."); fetchStaff(); };

  if (role !== "School Admin" && role !== "Super Admin") return <div className="p-8 text-center text-red-500 font-bold">Access Denied.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-3xl font-bold text-slate-800">HR & Payroll</h2></div>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          <button onClick={() => setViewMode("DIRECTORY")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === "DIRECTORY" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}><UserCheck className="w-4 h-4" /> Directory</button>
          <button onClick={() => setViewMode("PAYROLL")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${viewMode === "PAYROLL" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"}`}><Banknote className="w-4 h-4" /> Payroll</button>
        </div>
      </div>

      {viewMode === "DIRECTORY" && (
        <>
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">New Employee</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-2"><Label>First Name</Label><Input name="first_name" value={formData.first_name} onChange={handleInputChange} required /></div>
                  <div className="space-y-2"><Label>Last Name</Label><Input name="last_name" value={formData.last_name} onChange={handleInputChange} required /></div>
                  <div className="space-y-2"><Label>Designation</Label>
                    <Select value={formData.designation || ""} onValueChange={(val: any) => setFormData({ ...formData, designation: val || "" })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent><SelectItem value="Teacher">Senior Teacher</SelectItem><SelectItem value="Accountant">Accountant</SelectItem><SelectItem value="Staff">Office Staff</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Specialization</Label><Input name="subject" value={formData.subject} onChange={handleInputChange} /></div>
                </div>
                <div className="flex justify-end"><Button type="submit" disabled={loading} className="bg-blue-600">Register</Button></div>
              </form>
            </CardContent>
          </Card>
          <Card className="mt-6"><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead className="px-6 py-3">Employee</TableHead><TableHead className="px-6 py-3">Role</TableHead><TableHead className="px-6 py-3">Salary</TableHead><TableHead className="px-6 py-3 text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {staffList.map((staff) => (
                  <TableRow key={staff.id}>
                    <TableCell className="px-6 py-4 font-bold">{staff.first_name} {staff.last_name}</TableCell>
                    <TableCell className="px-6 py-4"><span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs font-bold">{staff.designation}</span></TableCell>
                    <TableCell className="px-6 py-4 font-bold">৳ {staff.basic_salary}</TableCell>
                    <TableCell className="px-6 py-4 text-right"><Button size="sm" variant="ghost" onClick={() => deleteStaff(staff.id, staff.user_id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </>
      )}

      {viewMode === "PAYROLL" && (
        <Card className="border-slate-100 shadow-sm h-fit">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Generate Payroll</CardTitle></CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handlePayrollSubmit} className="space-y-4">
              <div className="space-y-2"><Label>Select Employee</Label>
                <Select value={payrollData.teacher_id || ""} onValueChange={(val: any) => setPayrollData({...payrollData, teacher_id: val || ""})}>
                  <SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{staffList.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.first_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-emerald-600">Generate & Pay</Button>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
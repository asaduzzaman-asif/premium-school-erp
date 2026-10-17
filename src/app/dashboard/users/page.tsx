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
import { Loader2, Shield, Link as LinkIcon, Trash2 } from "lucide-react";

export default function UsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");

  const [formData, setFormData] = useState({ username: "", password: "", role: "Parent" });
  const [linkData, setLinkData] = useState({ parent_user_id: "", student_id: "" });

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: uData } = await supabase.from("users").select("*").order("id", { ascending: false });
    if (uData) setUsers(uData);
    const { data: sData } = await supabase.from("students").select("id, first_name, last_name, admission_no, parent_user_id");
    if (sData) setStudents(sData);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("users").insert([{ username: formData.username, password_hash: formData.password, role: formData.role }]);
    setLoading(false);
    if (!error) { toast.success(`${formData.role} account created!`); setFormData({ username: "", password: "", role: "Parent" }); fetchData(); } 
    else toast.error(error.message);
  };

  const handleLinkParent = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("students").update({ parent_user_id: parseInt(linkData.parent_user_id) }).eq("id", parseInt(linkData.student_id));
    setLoading(false);
    if (!error) { toast.success("Student successfully linked to Parent account!"); setLinkData({ parent_user_id: "", student_id: "" }); fetchData(); } 
    else toast.error(error.message);
  };

  const deleteUser = async (id: number) => {
    if(!window.confirm("Delete this user?")) return;
    await supabase.from("users").delete().eq("id", id);
    toast.success("User deleted!"); fetchData();
  };

  if (role !== "Super Admin" && role !== "School Admin" && role !== "Principal") return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Admins only.</div>;

  return (
    <div className="space-y-8">
      <div><h2 className="text-3xl font-bold text-slate-800">User Roles & Access Control</h2></div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-slate-100 shadow-sm border-t-4 border-t-purple-500">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Create Portal User</CardTitle></CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Role</Label>
                <Select value={formData.role || undefined} onValueChange={(val: string | null) => setFormData({...formData, role: val || ""})}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent><SelectItem value="Super Admin">Super Admin</SelectItem><SelectItem value="School Admin">School Admin</SelectItem><SelectItem value="Principal">Principal</SelectItem><SelectItem value="Parent">Parent/Guardian</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Username</Label><Input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} /></div>
                <div className="space-y-2"><Label>Password</Label><Input required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">Create Account</Button>
            </form>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm border-t-4 border-t-blue-500">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Link Children to Parent</CardTitle></CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleLinkParent} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Parent Account</Label>
                <Select value={linkData.parent_user_id || undefined} onValueChange={(val: string | null) => setLinkData({...linkData, parent_user_id: val || ""})}>
                  <SelectTrigger><SelectValue placeholder="-- Parent --"/></SelectTrigger>
                  <SelectContent>{users.filter(u => u.role === "Parent").map(u => <SelectItem key={u.id} value={u.id.toString()}>{u.username}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Select Student to Link</Label>
                <Select value={linkData.student_id || undefined} onValueChange={(val: string | null) => setLinkData({...linkData, student_id: val || ""})}>
                  <SelectTrigger><SelectValue placeholder="-- Student --"/></SelectTrigger>
                  <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.first_name} {s.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Link Student</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">System Users Directory</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Username</TableHead><TableHead className="px-6 py-3">Role</TableHead><TableHead className="px-6 py-3 text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="px-6 py-4 font-bold text-slate-800">{u.username}</TableCell>
                  <TableCell className="px-6 py-4 font-semibold text-blue-600">{u.role}</TableCell>
                  <TableCell className="px-6 py-4 text-right"><Button size="sm" variant="ghost" onClick={() => deleteUser(u.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
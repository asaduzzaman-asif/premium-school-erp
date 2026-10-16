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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, UserPlus, CheckCircle, XCircle, Clock } from "lucide-react";

export default function AdmissionsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]); // সেকশনের স্টেট যোগ করা হলো
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  
  // Dialog (Pop-up) এর স্টেট
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [formData, setFormData] = useState({
    admission_no: "",
    username: "",
    password: "password123",
    section_id: "" // সেকশন আইডি যুক্ত করা হলো
  });

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
    fetchData();
  }, []);

  const fetchData = async () => {
    // অ্যাপ্লিকেশনগুলো নিয়ে আসা
    const { data: appData } = await supabase
      .from("admission_applications")
      .select("*, classes(class_name)")
      .order("applied_at", { ascending: false });
    if (appData) setApplications(appData);

    // ডাটাবেস থেকে সব সেকশন নিয়ে আসা
    const { data: secData } = await supabase.from("sections").select("*");
    if (secData) setSections(secData);
  };

  // আবেদন বাতিল করা
  const handleReject = async (id: number) => {
    const confirmReject = window.confirm("Are you sure you want to reject this application?");
    if (!confirmReject) return;
    
    const { error } = await supabase.from("admission_applications").update({ status: 'Rejected' }).eq("id", id);
    if (!error) {
      toast.success("Application rejected.");
      fetchData();
    } else {
      toast.error(error.message);
    }
  };

  // Approve বাটনে ক্লিক করলে পপ-আপ খোলা
  const openApproveDialog = (app: any) => {
    setSelectedApp(app);
    setFormData({
      admission_no: `ST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      username: `std_${app.first_name.toLowerCase()}${Math.floor(100 + Math.random() * 900)}`,
      password: "password123",
      section_id: "" // ডায়লগ ওপেন হলে সেকশন ফাঁকা থাকবে
    });
    setIsDialogOpen(true);
  };

  // আবেদন গ্রহণ করে স্টুডেন্ট বানানো
  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.section_id) {
      toast.error("Please select a section for the student.");
      return;
    }
    setLoading(true);

    // ১. ইউজারের লগিন অ্যাকাউন্ট তৈরি করা
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert([{ username: formData.username, password_hash: formData.password, role: "Student" }])
      .select()
      .single();

    if (userError) {
      toast.error(`Error: Username already exists!`);
      setLoading(false);
      return;
    }

    // ২. স্টুডেন্ট প্রোফাইল তৈরি করা
    const { error: studentError } = await supabase.from("students").insert([
      {
        user_id: userData.id,
        first_name: selectedApp.first_name,
        last_name: selectedApp.last_name,
        dob: selectedApp.dob,
        gender: selectedApp.gender,
        parent_name: selectedApp.parent_name,
        parent_phone: selectedApp.parent_phone,
        class_id: selectedApp.class_id,
        section_id: parseInt(formData.section_id), // ফর্মে সিলেক্ট করা সেকশনটি এখানে যাবে
        admission_no: formData.admission_no,
      }
    ]);

    if (studentError) {
      await supabase.from("users").delete().eq("id", userData.id); // Rollback
      toast.error(`Profile Error: ${studentError.message}`);
      setLoading(false);
      return;
    }

    // ৩. অ্যাপ্লিকেশনের স্ট্যাটাস আপডেট করা
    await supabase.from("admission_applications").update({ status: 'Approved' }).eq("id", selectedApp.id);

    setLoading(false);
    toast.success("Application approved & student enrolled successfully!");
    setIsDialogOpen(false);
    fetchData();
  };

  if (role !== "School Admin" && role !== "Super Admin") {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Manage Admissions</h2>
        <p className="text-slate-500 mt-1">Review, approve, or reject online student applications.</p>
      </div>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" /> Recent Applications
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6 py-3">Date</TableHead>
                <TableHead className="px-6 py-3">Applicant Name</TableHead>
                <TableHead className="px-6 py-3">Class</TableHead>
                <TableHead className="px-6 py-3">Guardian Info</TableHead>
                <TableHead className="px-6 py-3">Status</TableHead>
                <TableHead className="px-6 py-3 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {applications.map((app) => (
                <TableRow key={app.id}>
                  <TableCell className="px-6 py-4 text-slate-500 text-sm">
                    {new Date(app.applied_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-6 py-4 font-semibold text-slate-800">
                    {app.first_name} {app.last_name}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-slate-600">
                    {app.classes?.class_name}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="text-sm font-medium text-slate-800">{app.parent_name}</p>
                    <p className="text-xs text-slate-500">{app.parent_phone}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {app.status === 'Pending' && <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1"><Clock className="w-3 h-3"/> Pending</span>}
                    {app.status === 'Approved' && <span className="bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1"><CheckCircle className="w-3 h-3"/> Approved</span>}
                    {app.status === 'Rejected' && <span className="bg-red-50 text-red-600 px-3 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1"><XCircle className="w-3 h-3"/> Rejected</span>}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    {app.status === 'Pending' && (
                      <div className="flex justify-end gap-2">
                        <Button onClick={() => openApproveDialog(app)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8">Approve</Button>
                        <Button onClick={() => handleReject(app.id)} size="sm" variant="destructive" className="h-8">Reject</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {applications.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400">No applications found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Approve Application Dialog (Pop-up) */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approve Admission</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApprove} className="space-y-4 py-4">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 text-sm text-blue-800 mb-4">
              Enrolling: <span className="font-bold">{selectedApp?.first_name} {selectedApp?.last_name}</span> to {selectedApp?.classes?.class_name}
            </div>

            {/* নতুন যুক্ত করা Section ড্রপডাউন */}
            <div className="space-y-2">
              <Label>Assign Section <span className="text-red-500">*</span></Label>
              <Select value={formData.section_id} onValueChange={(val) => setFormData({...formData, section_id: val})} required>
                <SelectTrigger><SelectValue placeholder="-- Select Section --" /></SelectTrigger>
                <SelectContent>
                  {sections
                    .filter((sec) => sec.class_id === selectedApp?.class_id) // শুধু আবেদন করা ক্লাসের সেকশনগুলোই দেখাবে
                    .map((sec) => (
                      <SelectItem key={sec.id} value={sec.id.toString()}>Section {sec.section_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Assign Admission No</Label>
              <Input value={formData.admission_no} onChange={(e) => setFormData({...formData, admission_no: e.target.value})} required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Login Username</Label>
                <Input value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} required />
              </div>
              <div className="space-y-2">
                <Label>Default Password</Label>
                <Input value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required />
              </div>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Confirm Enrollment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
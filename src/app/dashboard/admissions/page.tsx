"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, UserPlus, CheckCircle2, XCircle, Trash2, FileText, Send, Printer, Award } from "lucide-react";

export default function ManageAdmissionsPage() {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admissions")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) setApplications(data);
    setLoading(false);
  };

  // 1. Review & Approve + ID Generation + Confirmation SMS
  const handleApprove = async (app: any) => {
    if (app.application_fee_status === 'Unpaid') {
      toast.error("Application fee is unpaid. Cannot approve yet!");
      return;
    }

    // Auto Student ID Generation (e.g. ST-2026-001)
    const newStudentId = `ST-${new Date().getFullYear()}-00${app.id}`;

    const { error } = await supabase
      .from("admissions")
      .update({ 
        status: "Approved", 
        merit_status: "Merit List",
        generated_student_id: newStudentId 
      })
      .eq("id", app.id);

    if (!error) {
      toast.success(`Application Approved! Student ID: ${newStudentId} generated.`);
      // Mock SMS Send
      toast.success(`Confirmation SMS sent to Guardian (${app.parent_phone})!`, { icon: '📩' });
      fetchApplications();
    } else {
      toast.error(error.message);
    }
  };

  const updateStatus = async (id: number, newStatus: string) => {
    const { error } = await supabase.from("admissions").update({ status: newStatus }).eq("id", id);
    if (!error) {
      toast.success(`Application marked as ${newStatus}!`);
      fetchApplications();
    }
  };

  // 2. Admission Test Marks & Merit List Update
  const updateMeritInfo = async (id: number) => {
    const marks = prompt("Enter Admission Test Marks (out of 100):");
    if (!marks || isNaN(Number(marks))) return;
    
    const meritStatus = Number(marks) >= 40 ? "Merit List" : "Waiting List";

    const { error } = await supabase
      .from("admissions")
      .update({ admission_test_marks: Number(marks), merit_status: meritStatus })
      .eq("id", id);

    if (!error) {
      toast.success(`Marks updated. Added to ${meritStatus}!`);
      fetchApplications();
    }
  };

  // 3. Mark Application Fee as Paid
  const markFeePaid = async (id: number) => {
    const { error } = await supabase.from("admissions").update({ application_fee_status: "Paid" }).eq("id", id);
    if (!error) {
      toast.success("Application fee marked as Paid!");
      fetchApplications();
    }
  };

  const deleteApplication = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this application?")) return;
    const { error } = await supabase.from("admissions").delete().eq("id", id);
    if (!error) {
      toast.success("Application deleted successfully!");
      fetchApplications();
    }
  };

  const printReceipt = (app: any) => {
    // A simple mock for receipt printing functionality
    window.print();
    toast.success("Admission receipt generated!");
  };

  if (role !== "School Admin" && role !== "Super Admin") {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-8 print:m-0 print:p-0">
      <div className="print:hidden">
        <h2 className="text-3xl font-bold text-slate-800">Online Admission Management</h2>
        <p className="text-slate-500 mt-1">Review applications, conduct tests, manage merit lists, and confirm admissions.</p>
      </div>

      <Card className="border-slate-100 shadow-sm print:shadow-none print:border-none">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50 print:hidden">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-blue-600" /> Recent Applications & Merit List
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-4 py-3">Applicant Info</TableHead>
                <TableHead className="px-4 py-3">Fee & Docs</TableHead>
                <TableHead className="px-4 py-3">Test & Merit List</TableHead>
                <TableHead className="px-4 py-3">Status & ID</TableHead>
                <TableHead className="px-4 py-3 text-right print:hidden">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-blue-500" /></TableCell></TableRow>
              ) : applications.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-400">No applications found.</TableCell></TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    {/* 1. Applicant Info */}
                    <TableCell className="px-4 py-4">
                      <p className="font-bold text-slate-800 capitalize">{app.first_name} {app.last_name} {app.student_name && !app.first_name && app.student_name}</p>
                      <p className="text-xs text-slate-600 font-medium">Class: {app.class_name || app.class}</p>
                      <p className="text-xs text-slate-500 mt-1">Guardian: {app.parent_name}</p>
                      <p className="text-[11px] text-slate-400">📞 {app.parent_phone}</p>
                    </TableCell>

                    {/* 2. Fee & Docs */}
                    <TableCell className="px-4 py-4">
                      <div className="space-y-2">
                        {app.application_fee_status === 'Paid' ? (
                          <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded text-[10px] font-bold">Fee: Paid</span>
                        ) : (
                          <button onClick={() => markFeePaid(app.id)} className="bg-red-50 text-red-600 hover:bg-red-100 px-2 py-1 rounded text-[10px] font-bold transition">Fee: Unpaid (Click to Pay)</button>
                        )}
                        <div className="flex items-center gap-1 text-[11px] text-blue-600 font-semibold cursor-pointer hover:underline">
                          <FileText className="w-3 h-3" /> {app.document_url ? 'View Uploaded Docs' : 'No Docs Uploaded'}
                        </div>
                      </div>
                    </TableCell>

                    {/* 3. Admission Test & Merit List */}
                    <TableCell className="px-4 py-4">
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-slate-700">Marks: <span className="text-blue-600">{app.admission_test_marks}</span></p>
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          app.merit_status === 'Merit List' ? 'bg-emerald-100 text-emerald-700' :
                          app.merit_status === 'Waiting List' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {app.merit_status}
                        </span>
                        {app.status === 'Pending' && (
                          <button onClick={() => updateMeritInfo(app.id)} className="block text-[10px] text-blue-500 hover:underline mt-1 font-medium">
                            Update Marks
                          </button>
                        )}
                      </div>
                    </TableCell>

                    {/* 4. Status & Generated ID */}
                    <TableCell className="px-4 py-4">
                      <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${
                        app.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' :
                        app.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {app.status || 'Pending'}
                      </span>
                      {app.generated_student_id && (
                        <p className="mt-2 text-xs font-bold text-slate-800 bg-slate-100 inline-block px-2 py-1 rounded border border-slate-200">
                          ID: {app.generated_student_id}
                        </p>
                      )}
                    </TableCell>

                    {/* 5. Actions */}
                    <TableCell className="px-4 py-4 text-right print:hidden">
                      <div className="flex justify-end gap-1 flex-wrap w-24">
                        {(app.status === 'Pending' || !app.status) && (
                          <>
                            <Button size="sm" variant="outline" title="Confirm Admission" className="text-emerald-600 border-emerald-200 hover:bg-emerald-50 h-7 w-7 p-0" onClick={() => handleApprove(app)}>
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="outline" title="Reject" className="text-red-600 border-red-200 hover:bg-red-50 h-7 w-7 p-0" onClick={() => updateStatus(app.id, "Rejected")}>
                              <XCircle className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {app.status === 'Approved' && (
                          <Button size="sm" variant="outline" title="Print Receipt" className="text-blue-600 border-blue-200 hover:bg-blue-50 h-7 w-7 p-0" onClick={() => printReceipt(app)}>
                            <Printer className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" title="Delete" className="text-slate-400 hover:text-red-600 hover:bg-red-50 h-7 w-7 p-0" onClick={() => deleteApplication(app.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
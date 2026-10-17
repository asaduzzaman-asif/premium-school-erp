"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileBadge, Printer, IdCard, GraduationCap } from "lucide-react";

export default function CertificatesPage() {
  const [role, setRole] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [docType, setDocType] = useState("ID_CARD");
  const [photoUrl, setPhotoUrl] = useState("");
  const [schoolName, setSchoolName] = useState("School ERP");
  const [academicYear, setAcademicYear] = useState("2026-2027");

  useEffect(() => { setRole(localStorage.getItem("userRole") || ""); fetchStudents(); fetchSchoolSettings(); }, []);

  const fetchSchoolSettings = async () => {
    const { data } = await supabase.from("school_settings").select("*").eq("id", 1).single();
    if (data) { setSchoolName(data.institution_name); setAcademicYear(data.academic_year); }
  };

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("*, classes(class_name), sections(section_name)").order("first_name", { ascending: true });
    if (data) setStudents(data);
  };

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id.toString() === studentId);
    setSelectedStudent(student); setPhotoUrl(student?.photo_url || "");
  };

  const handlePhotoUpdate = async () => {
    if (!selectedStudent) return;
    const { error } = await supabase.from("students").update({ photo_url: photoUrl }).eq("id", selectedStudent.id);
    if (!error) { toast.success("Photo updated!"); setSelectedStudent({ ...selectedStudent, photo_url: photoUrl }); fetchStudents(); }
  };

  if (role !== "School Admin" && role !== "Super Admin" && role !== "Principal") return <div className="p-8 text-center text-red-500 font-bold">Access Denied.</div>;

  return (
    <div className="space-y-8 print:m-0 print:p-0">
      <div className="print:hidden"><h2 className="text-3xl font-bold text-slate-800">Document Generator</h2></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-sm print:hidden lg:col-span-1 h-fit">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Settings</CardTitle></CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2"><Label>Document Type</Label>
              <Select value={docType || ""} onValueChange={(val) => setDocType(val || "")}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="ID_CARD">ID Card</SelectItem><SelectItem value="ADMIT_CARD">Admit Card</SelectItem><SelectItem value="TC">Transfer Certificate</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Select Student</Label>
              <Select value={selectedStudent ? selectedStudent.id.toString() : ""} onValueChange={(val) => handleStudentSelect(val || "")}>
                <SelectTrigger><SelectValue placeholder="-- Choose Student --" /></SelectTrigger>
                <SelectContent>{students.map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.first_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            {selectedStudent && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label>Student Photo (URL)</Label>
                <div className="flex gap-2"><Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} /><Button onClick={handlePhotoUpdate} size="sm">Save</Button></div>
              </div>
            )}
            <Button onClick={() => window.print()} disabled={!selectedStudent} className="w-full bg-slate-900 mt-4"><Printer className="w-4 h-4 mr-2" /> Print</Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-2 flex justify-center items-start">
          {!selectedStudent ? (
            <div className="text-center py-20 text-slate-400 print:hidden w-full border-2 border-dashed border-slate-200 rounded-2xl">Select a student</div>
          ) : (
            <div className="w-full flex justify-center">
              {docType === "ID_CARD" && (
                <div className="w-[350px] h-[550px] bg-white border-2 border-blue-600 rounded-2xl shadow-xl overflow-hidden relative print:shadow-none print:border-blue-600">
                  <div className="bg-blue-600 h-32 flex flex-col items-center justify-center text-white text-center px-4 rounded-b-[50%]">
                    <h3 className="font-bold text-lg uppercase">{schoolName}</h3>
                  </div>
                  <div className="pt-20 pb-6 px-6 text-center space-y-4">
                    <h2 className="text-2xl font-bold uppercase">{selectedStudent.first_name}</h2>
                    <p className="text-sm">ID: {selectedStudent.admission_no}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Printer, IdCard, GraduationCap } from "lucide-react";

export default function CertificatesPage() {
  const [role, setRole] = useState("");
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [docType, setDocType] = useState("ID_CARD");
  const [photoUrl, setPhotoUrl] = useState("");
  const [schoolName, setSchoolName] = useState("School ERP");
  const [academicYear, setAcademicYear] = useState("2026-2027");

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
    fetchStudents();
    fetchSchoolSettings();
  }, []);

  const fetchSchoolSettings = async () => {
    const { data } = await supabase.from("school_settings").select("*").eq("id", 1).single();
    if (data) {
      setSchoolName(data.institution_name);
      setAcademicYear(data.academic_year);
    }
  };

  const fetchStudents = async () => {
    const { data } = await supabase
      .from("students")
      .select("*, classes(class_name), sections(section_name)")
      .order("first_name", { ascending: true });
    if (data) setStudents(data);
  };

  const handleStudentSelect = (studentId: string) => {
    const student = students.find((s) => s.id.toString() === studentId);
    setSelectedStudent(student);
    setPhotoUrl(student?.photo_url || "");
  };

  const handlePhotoUpdate = async () => {
    if (!selectedStudent) return;
    const { error } = await supabase.from("students").update({ photo_url: photoUrl }).eq("id", selectedStudent.id);
    if (!error) {
      toast.success("Photo updated!");
      setSelectedStudent({ ...selectedStudent, photo_url: photoUrl });
      fetchStudents();
    } else {
      toast.error(error.message);
    }
  };

  if (role !== "School Admin" && role !== "Super Admin" && role !== "Principal") {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-8 print:m-0 print:p-0 w-full">
      <div className="print:hidden">
        <h2 className="text-3xl font-bold text-slate-800">Document Generator</h2>
        <p className="text-slate-500 mt-1">Generate ID cards, Admit cards, and official certificates for students.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
        
        {/* Controls Section */}
        <Card className="border-slate-100 shadow-sm print:hidden lg:col-span-1 h-fit">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold">Settings</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Document Type</Label>
              <Select value={docType} onValueChange={(val: any) => setDocType(val)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ID_CARD">Student ID Card</SelectItem>
                  <SelectItem value="ADMIT_CARD">Examination Admit Card</SelectItem>
                  <SelectItem value="TC">Transfer Certificate (TC)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Select Student</Label>
              <Select 
                value={selectedStudent ? selectedStudent.id.toString() : ""} 
                onValueChange={(val: any) => handleStudentSelect(val)}
              >
                <SelectTrigger><SelectValue placeholder="-- Choose Student --" /></SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.admission_no} - {s.first_name} {s.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedStudent && (
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <Label>Student Photo (Image URL)</Label>
                <div className="flex gap-2">
                  <Input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} placeholder="Paste link..." />
                  <Button onClick={handlePhotoUpdate} size="sm" className="bg-slate-900">Save</Button>
                </div>
              </div>
            )}

            <Button onClick={() => window.print()} disabled={!selectedStudent} className="w-full bg-slate-900 mt-4">
              <Printer className="w-4 h-4 mr-2" /> Print Document
            </Button>
          </CardContent>
        </Card>

        {/* Document Preview Section */}
        <div className="lg:col-span-2 flex justify-center items-start w-full overflow-x-auto pb-8">
          {!selectedStudent ? (
            <div className="text-center py-20 text-slate-400 print:hidden w-full border-2 border-dashed border-slate-200 rounded-2xl bg-white">
              <IdCard className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p>Select a student to preview the document.</p>
            </div>
          ) : (
            <div className="w-full flex justify-center items-center">
              
              {/* ID CARD TEMPLATE */}
              {docType === "ID_CARD" && (
                <div className="w-[350px] h-[550px] bg-white border-2 border-blue-600 rounded-2xl shadow-xl overflow-hidden relative print:shadow-none print:border-blue-600 shrink-0 mx-auto">
                  <div className="bg-blue-600 h-32 flex flex-col items-center justify-center text-white text-center px-4 rounded-b-[50%]">
                    <GraduationCap className="w-10 h-10 mb-1" />
                    <h3 className="font-bold text-lg leading-tight uppercase">{schoolName}</h3>
                  </div>
                  <div className="absolute top-24 left-1/2 -translate-x-1/2 w-24 h-24 bg-white rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                    {selectedStudent.photo_url ? (
                      <img src={selectedStudent.photo_url} alt="Student" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-slate-200 flex items-center justify-center text-slate-400 font-bold text-2xl">
                        {selectedStudent.first_name.charAt(0)}{selectedStudent.last_name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="pt-20 pb-6 px-6 text-center space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-800 uppercase truncate px-2">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                      <p className="text-blue-600 font-semibold tracking-widest mt-1">STUDENT</p>
                    </div>
                    <div className="text-left bg-slate-50 p-4 rounded-xl space-y-2 text-sm border border-slate-100">
                      <p><span className="font-bold text-slate-600">ID No:</span> {selectedStudent.admission_no}</p>
                      <p><span className="font-bold text-slate-600">Class:</span> {selectedStudent.classes?.class_name}</p>
                      <p><span className="font-bold text-slate-600">Section:</span> {selectedStudent.sections?.section_name}</p>
                      <p><span className="font-bold text-slate-600">Shift:</span> {selectedStudent.shift || "Morning"}</p>
                      <p className="truncate"><span className="font-bold text-slate-600">Contact:</span> {selectedStudent.parent_phone}</p>
                    </div>
                  </div>
                  <div className="absolute bottom-0 w-full bg-slate-900 text-white text-center py-2 text-xs">
                    Valid for Academic Year {academicYear}
                  </div>
                </div>
              )}

              {/* ADMIT CARD TEMPLATE */}
              {docType === "ADMIT_CARD" && (
                <div className="w-full max-w-2xl bg-white border border-slate-300 p-8 shadow-xl print:shadow-none print:border-none mx-auto">
                  <div className="text-center border-b-2 border-slate-800 pb-4 mb-6">
                    <GraduationCap className="w-12 h-12 mx-auto text-slate-800 mb-2" />
                    <h1 className="text-2xl font-bold uppercase tracking-wider">{schoolName}</h1>
                    <p className="text-sm font-semibold mt-1 bg-slate-800 text-white inline-block px-4 py-1 rounded-full">EXAMINATION ADMIT CARD {academicYear}</p>
                  </div>
                  <div className="flex justify-between items-start mb-8 gap-4">
                    <div className="space-y-3 text-sm flex-1">
                      <p className="flex"><span className="font-bold w-32 shrink-0">Student Name:</span> <span className="uppercase">{selectedStudent.first_name} {selectedStudent.last_name}</span></p>
                      <p className="flex"><span className="font-bold w-32 shrink-0">Admission No:</span> <span>{selectedStudent.admission_no}</span></p>
                      <p className="flex"><span className="font-bold w-32 shrink-0">Roll No:</span> <span>{selectedStudent.roll_no || "N/A"}</span></p>
                      <p className="flex"><span className="font-bold w-32 shrink-0">Class & Section:</span> <span>{selectedStudent.classes?.class_name} ({selectedStudent.sections?.section_name})</span></p>
                      <p className="flex"><span className="font-bold w-32 shrink-0">Guardian Name:</span> <span>{selectedStudent.parent_name}</span></p>
                    </div>
                    <div className="w-28 h-36 bg-slate-100 border-2 border-dashed border-slate-300 shrink-0 overflow-hidden flex items-center justify-center text-xs text-slate-400 text-center">
                      {selectedStudent.photo_url ? (
                        <img src={selectedStudent.photo_url} alt="Student" className="w-full h-full object-cover" />
                      ) : (
                        "Paste Photo Here"
                      )}
                    </div>
                  </div>
                  <div className="border border-slate-300 p-4 mb-16 text-sm text-slate-600 bg-slate-50">
                    <h4 className="font-bold text-slate-800 mb-2">Examination Rules:</h4>
                    <ul className="list-disc pl-5 space-y-1">
                      <li>Bring this admit card to every examination.</li>
                      <li>Electronic devices are strictly prohibited inside the exam hall.</li>
                      <li>Students must report 30 minutes before the exam starts.</li>
                    </ul>
                  </div>
                  <div className="flex justify-between items-end px-10 mt-12">
                    <div className="text-center">
                      <div className="w-32 border-b border-slate-800 mb-2"></div>
                      <p className="text-xs font-bold uppercase">Student Signature</p>
                    </div>
                    <div className="text-center">
                      <div className="w-32 border-b border-slate-800 mb-2"></div>
                      <p className="text-xs font-bold uppercase">Principal Signature</p>
                    </div>
                  </div>
                </div>
              )}

              {/* TRANSFER CERTIFICATE TEMPLATE */}
              {docType === "TC" && (
                <div className="w-full max-w-2xl bg-white border-[10px] border-double border-slate-200 p-10 shadow-xl text-center print:shadow-none print:border-slate-800 mx-auto">
                  <GraduationCap className="w-16 h-16 mx-auto text-blue-800 mb-4" />
                  <h1 className="text-3xl font-extrabold text-blue-900 uppercase tracking-widest mb-1">{schoolName}</h1>
                  <p className="text-sm text-slate-500 mb-8">Academic Session: {academicYear}</p>
                  
                  <h2 className="text-xl font-bold bg-blue-100 text-blue-800 py-2 px-8 inline-block rounded-full mb-10 border border-blue-200">TRANSFER CERTIFICATE</h2>
                  
                  <div className="text-left space-y-6 text-lg leading-relaxed text-slate-700">
                    <p>
                      This is to certify that <span className="font-bold uppercase border-b border-slate-400 px-2">{selectedStudent.first_name} {selectedStudent.last_name}</span>, 
                      son/daughter of <span className="font-bold border-b border-slate-400 px-2">{selectedStudent.parent_name}</span>, 
                      was a bona fide student of this institution.
                    </p>
                    <p>
                      He/She was studying in Class <span className="font-bold border-b border-slate-400 px-2">{selectedStudent.classes?.class_name}</span> 
                      (Section: <span className="font-bold border-b border-slate-400 px-2">{selectedStudent.sections?.section_name}</span>) 
                      under Admission No <span className="font-bold border-b border-slate-400 px-2">{selectedStudent.admission_no}</span>.
                    </p>
                    <p>
                      His/Her date of birth, according to the school register, is <span className="font-bold border-b border-slate-400 px-2">{selectedStudent.dob ? new Date(selectedStudent.dob).toLocaleDateString() : "Not Provided"}</span>.
                    </p>
                    <p>
                      His/Her conduct and character have been <span className="font-bold border-b border-slate-400 px-2">GOOD</span> during the period of study in this school. All school dues have been paid.
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-end mt-24">
                    <div className="text-left">
                      <p className="font-bold">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div className="text-center">
                      <div className="w-40 border-b border-slate-800 mb-2"></div>
                      <p className="text-sm font-bold uppercase">Principal Signature & Seal</p>
                    </div>
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
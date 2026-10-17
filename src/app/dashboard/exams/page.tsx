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
import { Loader2, Award, FileSpreadsheet, CheckCircle2, PenTool, Printer, GraduationCap, FileCheck2, Globe } from "lucide-react";

export default function ExamsPage() {
  const [activeTab, setActiveTab] = useState<"SETUP" | "MARKS" | "REPORT">("SETUP");
  const [role, setRole] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  // Data States
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [reportMarks, setReportMarks] = useState<any[]>([]);

  // Form States
  const [examData, setExamData] = useState({ exam_name: "", exam_type: "Terminal", start_date: "", end_date: "", status: "Draft" });
  
  // Marks Entry States
  const [filterData, setFilterData] = useState({ exam_id: "", class_id: "", section_id: "", subject_id: "" });
  const [marksInput, setMarksInput] = useState<{ [key: number]: any }>({});
  
  // Report States
  const [selectedStudent, setSelectedStudent] = useState<any>(null);

  useEffect(() => {
    const currentRole = localStorage.getItem("userRole") || "";
    const uName = localStorage.getItem("userName") || "";
    setRole(currentRole);
    fetchInitialData(uName);
  }, []);

  const fetchInitialData = async (uName: string) => {
    const { data: userData } = await supabase.from("users").select("id").eq("username", uName).single();
    if (userData) setUserId(userData.id);

    const [exData, clsData, secData, subData] = await Promise.all([
      supabase.from("exams").select("*").order("created_at", { ascending: false }),
      supabase.from("classes").select("*"),
      supabase.from("sections").select("*"),
      supabase.from("subjects").select("*")
    ]);
    
    if (exData.data) setExams(exData.data);
    if (clsData.data) setClasses(clsData.data);
    if (secData.data) setSections(secData.data);
    if (subData.data) setSubjects(subData.data);
  };

  // ================= 1. EXAM SETUP =================
  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("exams").insert([examData]);
    setLoading(false);
    if (!error) { 
      toast.success("Exam schedule created!"); 
      setExamData({ exam_name: "", exam_type: "Terminal", start_date: "", end_date: "", status: "Draft" });
      fetchInitialData(localStorage.getItem("userName") || "");
    } else toast.error(error.message);
  };

  const publishResult = async (examId: number) => {
    if(!window.confirm("Are you sure? This will make the results visible to students & parents.")) return;
    const { error } = await supabase.from("exams").update({ status: "Published" }).eq("id", examId);
    if(!error) { toast.success("Result Published Successfully!"); fetchInitialData(localStorage.getItem("userName") || ""); }
  };

  // ================= 2. MARKS ENTRY =================
  const fetchStudentsForMarks = async () => {
    if (!filterData.exam_id || !filterData.class_id || !filterData.section_id || !filterData.subject_id) {
      toast.error("Select Exam, Class, Section and Subject first!"); return;
    }
    
    // Fetch Students
    const { data: sData } = await supabase.from("students").select("*").eq("class_id", parseInt(filterData.class_id)).eq("section_id", parseInt(filterData.section_id));
    if (sData) setStudents(sData);

    // Fetch existing marks if any
    const { data: mData } = await supabase.from("exam_marks")
      .select("*")
      .eq("exam_id", parseInt(filterData.exam_id))
      .eq("subject_id", parseInt(filterData.subject_id));
    
    const marksObj: any = {};
    if (sData) {
      sData.forEach(s => {
        const existing = mData?.find(m => m.student_id === s.id);
        marksObj[s.id] = {
          cq_marks: existing?.cq_marks || 0,
          mcq_marks: existing?.mcq_marks || 0,
          practical_marks: existing?.practical_marks || 0,
          viva_marks: existing?.viva_marks || 0,
          max_marks: existing?.max_marks || 100,
          pass_marks: existing?.pass_marks || 33
        };
      });
    }
    setMarksInput(marksObj);
  };

  const handleMarkChange = (studentId: number, field: string, value: string) => {
    setMarksInput(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [field]: Number(value) }
    }));
  };

  const calculateGradeAndGPA = (total: number, max: number, pass: number) => {
    if (total < pass) return { grade: "F", gpa: 0.0 };
    const percentage = (total / max) * 100;
    if (percentage >= 80) return { grade: "A+", gpa: 5.0 };
    if (percentage >= 70) return { grade: "A", gpa: 4.0 };
    if (percentage >= 60) return { grade: "A-", gpa: 3.5 };
    if (percentage >= 50) return { grade: "B", gpa: 3.0 };
    if (percentage >= 40) return { grade: "C", gpa: 2.0 };
    if (percentage >= 33) return { grade: "D", gpa: 1.0 };
    return { grade: "F", gpa: 0.0 };
  };

  const handleSubmitMarks = async () => {
    setLoading(true);
    const recordsToUpsert = students.map(s => {
      const marks = marksInput[s.id];
      const total = marks.cq_marks + marks.mcq_marks + marks.practical_marks + marks.viva_marks;
      const { grade, gpa } = calculateGradeAndGPA(total, marks.max_marks, marks.pass_marks);

      return {
        exam_id: parseInt(filterData.exam_id),
        student_id: s.id,
        subject_id: parseInt(filterData.subject_id),
        marks_obtained: total,
        cq_marks: marks.cq_marks, mcq_marks: marks.mcq_marks, practical_marks: marks.practical_marks, viva_marks: marks.viva_marks,
        max_marks: marks.max_marks, pass_marks: marks.pass_marks,
        grade, gpa
      };
    });

    const { error } = await supabase.from("exam_marks").upsert(recordsToUpsert, { onConflict: 'exam_id,student_id,subject_id' });
    setLoading(false);
    if (!error) toast.success("Marks saved & GPA calculated successfully!");
    else toast.error(error.message);
  };

  // ================= 3. REPORT CARD =================
  const generateReportCard = async () => {
    if (!filterData.exam_id || !filterData.class_id || !filterData.section_id) { toast.error("Select Exam, Class and Section!"); return; }
    
    // Fetch students of this class
    const { data: sData } = await supabase.from("students").select("*, classes(class_name), sections(section_name)").eq("class_id", parseInt(filterData.class_id)).eq("section_id", parseInt(filterData.section_id));
    if (sData) setStudents(sData);

    // Fetch marks for this exam and class
    const { data: mData } = await supabase.from("exam_marks")
      .select("*, subjects(subject_name), students(first_name, last_name, admission_no)")
      .eq("exam_id", parseInt(filterData.exam_id));
    
    if (mData) setReportMarks(mData);
  };

  const handlePrint = () => window.print();

  if (role === "Student" || role === "Parent") {
    return <div className="p-8 text-center text-red-500 font-bold">Access Denied. Marksheets are available in Student Profile.</div>;
  }

  return (
    <div className="space-y-8 print:m-0 print:p-0">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Exam & Result Processing</h2>
          <p className="text-slate-500 mt-1">Manage exam schedules, subject-wise marks entry, and GPA calculation.</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          {(role === "School Admin" || role === "Super Admin") && (
            <button onClick={() => setActiveTab("SETUP")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "SETUP" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <Award className="w-4 h-4" /> Exam Setup
            </button>
          )}
          <button onClick={() => setActiveTab("MARKS")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "MARKS" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <PenTool className="w-4 h-4" /> Marks Entry
          </button>
          <button onClick={() => {setActiveTab("REPORT"); setStudents([]); setSelectedStudent(null);}} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "REPORT" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <FileSpreadsheet className="w-4 h-4" /> Tabulation & Report Card
          </button>
        </div>
      </div>

      {/* ================= TAB 1: EXAM SETUP ================= */}
      {activeTab === "SETUP" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2"><Award className="w-5 h-5 text-blue-600"/> Create New Exam</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddExam} className="space-y-4">
                <div className="space-y-2"><Label>Exam Name</Label><Input value={examData.exam_name} onChange={(e) => setExamData({...examData, exam_name: e.target.value})} required placeholder="e.g. Half Yearly Exam 2026" /></div>
                <div className="space-y-2"><Label>Exam Type</Label>
                  <Select value={examData.exam_type} onValueChange={(val) => setExamData({...examData, exam_type: val})}>
                    <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Terminal">Terminal</SelectItem><SelectItem value="Monthly">Monthly Test</SelectItem><SelectItem value="Model Test">Model Test</SelectItem><SelectItem value="Board">Board Exam</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={examData.start_date} onChange={(e) => setExamData({...examData, start_date: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>End Date</Label><Input type="date" value={examData.end_date} onChange={(e) => setExamData({...examData, end_date: e.target.value})} required /></div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Save Exam Schedule</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold text-slate-800">Exam List & Result Publishing</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow><TableHead className="px-4 py-3">Exam Name</TableHead><TableHead className="px-4 py-3">Schedule</TableHead><TableHead className="px-4 py-3">Status</TableHead><TableHead className="px-4 py-3 text-right">Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {exams.map((ex) => (
                    <TableRow key={ex.id}>
                      <TableCell className="px-4 py-4 font-bold text-slate-800">{ex.exam_name} <span className="block text-xs text-blue-600 font-semibold">{ex.exam_type}</span></TableCell>
                      <TableCell className="px-4 py-4 text-sm text-slate-600">{ex.start_date} to {ex.end_date}</TableCell>
                      <TableCell className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${ex.status === 'Published' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>{ex.status}</span>
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        {ex.status === 'Draft' && (
                          <Button size="sm" onClick={() => publishResult(ex.id)} className="bg-emerald-600 hover:bg-emerald-700 text-xs h-8"><Globe className="w-3 h-3 mr-1"/> Publish Result</Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= TAB 2 & 3 FILTERS ================= */}
      {(activeTab === "MARKS" || activeTab === "REPORT") && (
        <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100 print:hidden flex-wrap">
          <div className="space-y-1 w-full md:w-48">
            <Label>Select Exam</Label>
            <Select value={filterData.exam_id} onValueChange={(val) => setFilterData({...filterData, exam_id: val})}>
              <SelectTrigger><SelectValue placeholder="-- Exam --" /></SelectTrigger>
              <SelectContent>{exams.map((e) => (<SelectItem key={e.id} value={e.id.toString()}>{e.exam_name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-full md:w-32">
            <Label>Select Class</Label>
            <Select value={filterData.class_id} onValueChange={(val) => setFilterData({...filterData, class_id: val})}>
              <SelectTrigger><SelectValue placeholder="-- Class --" /></SelectTrigger>
              <SelectContent>{classes.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          <div className="space-y-1 w-full md:w-32">
            <Label>Select Section</Label>
            <Select value={filterData.section_id} onValueChange={(val) => setFilterData({...filterData, section_id: val})}>
              <SelectTrigger><SelectValue placeholder="-- Sec --" /></SelectTrigger>
              <SelectContent>{sections.filter(s => s.class_id.toString() === filterData.class_id).map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.section_name}</SelectItem>))}</SelectContent>
            </Select>
          </div>
          {activeTab === "MARKS" && (
            <div className="space-y-1 w-full md:w-48">
              <Label>Select Subject</Label>
              <Select value={filterData.subject_id} onValueChange={(val) => setFilterData({...filterData, subject_id: val})}>
                <SelectTrigger><SelectValue placeholder="-- Subject --" /></SelectTrigger>
                <SelectContent>{subjects.filter(s => s.class_id.toString() === filterData.class_id).map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.subject_name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
          )}
          <div className="pt-5 w-full md:w-auto">
            {activeTab === "MARKS" ? (
              <Button onClick={fetchStudentsForMarks} className="bg-emerald-600 hover:bg-emerald-700 w-full md:w-auto">Load Students</Button>
            ) : (
              <Button onClick={generateReportCard} className="bg-purple-600 hover:bg-purple-700 w-full md:w-auto">Generate Report</Button>
            )}
          </div>
        </div>
      )}

      {/* ================= TAB 2: MARKS ENTRY ================= */}
      {activeTab === "MARKS" && students.length > 0 && (
        <Card className="border-slate-100 shadow-sm border-t-4 border-t-emerald-500">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 flex flex-row justify-between items-center">
            <CardTitle className="text-lg font-bold text-slate-800">Subject Marks Entry</CardTitle>
            <p className="text-xs text-emerald-600 font-semibold flex items-center"><FileCheck2 className="w-4 h-4 mr-1"/> Auto GPA Calculation Enabled</p>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="px-4 py-3 min-w-[200px]">Student Name</TableHead>
                  <TableHead className="px-2 py-3 w-20 text-center">CQ Marks</TableHead>
                  <TableHead className="px-2 py-3 w-20 text-center">MCQ Marks</TableHead>
                  <TableHead className="px-2 py-3 w-20 text-center">Practical</TableHead>
                  <TableHead className="px-2 py-3 w-20 text-center">Viva</TableHead>
                  <TableHead className="px-2 py-3 w-24 text-center">Pass Marks</TableHead>
                  <TableHead className="px-2 py-3 w-24 text-center">Max Marks</TableHead>
                  <TableHead className="px-4 py-3 text-right">Total & Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const m = marksInput[s.id] || { cq_marks: 0, mcq_marks: 0, practical_marks: 0, viva_marks: 0, max_marks: 100, pass_marks: 33 };
                  const total = m.cq_marks + m.mcq_marks + m.practical_marks + m.viva_marks;
                  const { grade, gpa } = calculateGradeAndGPA(total, m.max_marks, m.pass_marks);
                  
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="px-4 py-3 font-semibold text-slate-800">{s.first_name} {s.last_name}<span className="block text-xs text-slate-500 font-normal">Roll: {s.roll_no}</span></TableCell>
                      <TableCell className="px-2 py-3"><Input type="number" min="0" value={m.cq_marks} onChange={(e) => handleMarkChange(s.id, "cq_marks", e.target.value)} className="h-8 text-center text-sm font-semibold text-blue-600" /></TableCell>
                      <TableCell className="px-2 py-3"><Input type="number" min="0" value={m.mcq_marks} onChange={(e) => handleMarkChange(s.id, "mcq_marks", e.target.value)} className="h-8 text-center text-sm font-semibold text-blue-600" /></TableCell>
                      <TableCell className="px-2 py-3"><Input type="number" min="0" value={m.practical_marks} onChange={(e) => handleMarkChange(s.id, "practical_marks", e.target.value)} className="h-8 text-center text-sm font-semibold text-blue-600" /></TableCell>
                      <TableCell className="px-2 py-3"><Input type="number" min="0" value={m.viva_marks} onChange={(e) => handleMarkChange(s.id, "viva_marks", e.target.value)} className="h-8 text-center text-sm font-semibold text-blue-600" /></TableCell>
                      <TableCell className="px-2 py-3"><Input type="number" min="0" value={m.pass_marks} onChange={(e) => handleMarkChange(s.id, "pass_marks", e.target.value)} className="h-8 text-center text-xs" /></TableCell>
                      <TableCell className="px-2 py-3"><Input type="number" min="0" value={m.max_marks} onChange={(e) => handleMarkChange(s.id, "max_marks", e.target.value)} className="h-8 text-center text-xs" /></TableCell>
                      <TableCell className="px-4 py-3 text-right">
                        <span className="font-black text-lg text-slate-800">{total}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs font-bold ${grade === 'F' ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-700'}`}>{grade}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            <div className="p-4 border-t border-slate-100 flex justify-end">
              <Button onClick={handleSubmitMarks} disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Save All Marks & Calculate
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ================= TAB 3: REPORT CARD & TABULATION ================= */}
      {activeTab === "REPORT" && students.length > 0 && !selectedStudent && (
        <Card className="border-slate-100 shadow-sm print:hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800">Tabulation Sheet (Select Student for Marksheet)</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow><TableHead className="px-6 py-3">Roll</TableHead><TableHead className="px-6 py-3">Student Name</TableHead><TableHead className="px-6 py-3 text-center">Subjects Evaluated</TableHead><TableHead className="px-6 py-3 text-right">Action</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {students.map((s) => {
                  const studentMarks = reportMarks.filter(m => m.student_id === s.id);
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="px-6 py-4 font-bold text-slate-600">{s.roll_no}</TableCell>
                      <TableCell className="px-6 py-4 font-semibold text-slate-800">{s.first_name} {s.last_name}</TableCell>
                      <TableCell className="px-6 py-4 text-center text-sm font-medium text-purple-600">{studentMarks.length} Subjects</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        <Button size="sm" onClick={() => setSelectedStudent(s)} className="bg-purple-100 text-purple-700 hover:bg-purple-200">View Marksheet</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* MARK SHEET PRINT VIEW */}
      {activeTab === "REPORT" && selectedStudent && (
        <div className="w-full max-w-4xl mx-auto">
          <div className="mb-4 print:hidden flex justify-between items-center">
            <Button variant="outline" onClick={() => setSelectedStudent(null)}>← Back to Tabulation</Button>
            <Button onClick={handlePrint} className="bg-slate-900 hover:bg-slate-800"><Printer className="w-4 h-4 mr-2"/> Print Report Card</Button>
          </div>
          
          <div className="bg-white border-[8px] border-double border-slate-200 p-10 shadow-xl print:shadow-none print:border-slate-400 relative">
            <div className="text-center border-b-2 border-slate-800 pb-6 mb-6">
              <GraduationCap className="w-14 h-14 mx-auto text-slate-800 mb-2" />
              <h1 className="text-3xl font-extrabold uppercase tracking-wider text-slate-900">Premium School ERP</h1>
              <p className="text-sm font-bold text-slate-600 mt-1">ACADEMIC REPORT CARD</p>
            </div>
            
            <div className="flex justify-between items-start mb-8 text-sm bg-slate-50 p-4 border border-slate-100 rounded-lg">
              <div className="space-y-2">
                <p><span className="font-bold inline-block w-28">Student Name:</span> <span className="font-bold text-lg">{selectedStudent.first_name} {selectedStudent.last_name}</span></p>
                <p><span className="font-bold inline-block w-28">Admission No:</span> {selectedStudent.admission_no}</p>
              </div>
              <div className="space-y-2">
                <p><span className="font-bold inline-block w-20">Class:</span> <span className="font-semibold">{selectedStudent.classes?.class_name}</span></p>
                <p><span className="font-bold inline-block w-20">Section:</span> {selectedStudent.sections?.section_name}</p>
                <p><span className="font-bold inline-block w-20">Roll No:</span> {selectedStudent.roll_no}</p>
              </div>
            </div>

            <table className="w-full text-sm border-collapse border border-slate-300 mb-8">
              <thead>
                <tr className="bg-slate-100">
                  <th className="border border-slate-300 px-4 py-2 text-left">Subject</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">CQ</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">MCQ</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">Practical</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">Viva</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">Total Marks</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">Grade</th>
                  <th className="border border-slate-300 px-2 py-2 text-center">GPA</th>
                </tr>
              </thead>
              <tbody>
                {reportMarks.filter(m => m.student_id === selectedStudent.id).map(m => (
                  <tr key={m.id}>
                    <td className="border border-slate-300 px-4 py-2 font-semibold text-slate-800">{m.subjects?.subject_name}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center">{m.cq_marks}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center">{m.mcq_marks}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center">{m.practical_marks}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center">{m.viva_marks}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center font-bold">{m.marks_obtained} <span className="text-[10px] text-slate-400 font-normal">/ {m.max_marks}</span></td>
                    <td className="border border-slate-300 px-2 py-2 text-center font-bold text-emerald-600">{m.grade}</td>
                    <td className="border border-slate-300 px-2 py-2 text-center font-bold">{m.gpa.toFixed(2)}</td>
                  </tr>
                ))}
                {reportMarks.filter(m => m.student_id === selectedStudent.id).length === 0 && (
                  <tr><td colSpan={8} className="border border-slate-300 px-4 py-6 text-center text-slate-400">No marks entered for this exam yet.</td></tr>
                )}
              </tbody>
            </table>

            <div className="flex justify-between items-end px-4 mt-20">
              <div className="text-center">
                <div className="w-40 border-b border-slate-800 mb-2"></div>
                <p className="text-xs font-bold uppercase">Class Teacher</p>
              </div>
              <div className="text-center">
                <div className="w-40 border-b border-slate-800 mb-2"></div>
                <p className="text-xs font-bold uppercase">Principal Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
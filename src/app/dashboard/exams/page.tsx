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
import { Loader2, Award, Plus, BookOpen } from "lucide-react"; // BookOpen ekhane import kora holo

export default function ExamsPage() {
  const [role, setRole] = useState("");
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  
  const [examName, setExamName] = useState("");
  const [subjectData, setSubjectData] = useState({ name: "", class_id: "" });
  
  const [filter, setFilter] = useState({ exam_id: "", class_id: "", subject_id: "" });
  const [marksData, setMarksData] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
    fetchData();
  }, []);

  const fetchData = async () => {
    const [examRes, classRes, subRes] = await Promise.all([
      supabase.from("exams").select("*"),
      supabase.from("classes").select("*"),
      supabase.from("subjects").select("*")
    ]);
    if (examRes.data) setExams(examRes.data);
    if (classRes.data) setClasses(classRes.data);
    if (subRes.data) setSubjects(subRes.data);
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("exams").insert([{ exam_name: examName }]);
    if (!error) { 
      toast.success("Exam added successfully!"); 
      setExamName(""); 
      fetchData(); 
    } else toast.error(error.message);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase.from("subjects").insert([{ 
      subject_name: subjectData.name, 
      class_id: parseInt(subjectData.class_id) 
    }]);
    if (!error) { 
      toast.success("Subject added successfully!"); 
      setSubjectData({ name: "", class_id: "" }); 
      fetchData(); 
    } else toast.error(error.message);
  };

  const handleLoadStudents = async () => {
    if (!filter.exam_id || !filter.class_id || !filter.subject_id) {
      toast.error("Please select Exam, Class, and Subject first!"); 
      return;
    }
    
    const { data, error } = await supabase
      .from("students")
      .select("*")
      .eq("class_id", parseInt(filter.class_id))
      .order("admission_no", { ascending: true });
      
    if (!error && data) {
      setStudents(data);
      const initialMarks: { [key: number]: string } = {};
      data.forEach(s => initialMarks[s.id] = "");
      setMarksData(initialMarks);
      if(data.length === 0) toast.error("No students found in this class.");
    }
  };

  const handleSaveMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const records = students.map(s => ({
      exam_id: parseInt(filter.exam_id),
      subject_id: parseInt(filter.subject_id),
      student_id: s.id,
      marks_obtained: parseFloat(marksData[s.id]) || 0,
      max_marks: 100
    }));

    const { error } = await supabase.from("exam_marks").insert(records);
    setLoading(false);
    
    if (!error) { 
      toast.success("Marks saved successfully!"); 
      setStudents([]); 
    } else toast.error(error.message);
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Examinations & Marks</h2>
        <p className="text-slate-500 mt-1">Configure exams, manage subjects, and enter student marks.</p>
      </div>

      {(role === "School Admin" || role === "Super Admin") && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" /> Create Exam
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddExam} className="flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                  <Label>Exam Name</Label>
                  <Input value={examName} onChange={(e) => setExamName(e.target.value)} required placeholder="e.g. Mid Term 2026" />
                </div>
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-1" /> Save
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-600" /> Add Subject
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Class</Label>
                  <Select value={subjectData.class_id} onValueChange={(val) => setSubjectData({ ...subjectData, class_id: val })}>
                    <SelectTrigger><SelectValue placeholder="Choose class..." /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject Name</Label>
                  <div className="flex gap-3">
                    <Input value={subjectData.name} onChange={(e) => setSubjectData({ ...subjectData, name: e.target.value })} required placeholder="e.g. Mathematics" />
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                      <Plus className="w-4 h-4 mr-1" /> Save
                    </Button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Marks Entry Section */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-800">Enter Student Marks</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <Label>Select Exam</Label>
              <Select value={filter.exam_id} onValueChange={(val) => setFilter({ ...filter, exam_id: val })}>
                <SelectTrigger><SelectValue placeholder="Choose exam..." /></SelectTrigger>
                <SelectContent>
                  {exams.map(ex => <SelectItem key={ex.id} value={ex.id.toString()}>{ex.exam_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={filter.class_id} onValueChange={(val) => setFilter({ ...filter, class_id: val })}>
                <SelectTrigger><SelectValue placeholder="Choose class..." /></SelectTrigger>
                <SelectContent>
                  {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Select Subject</Label>
              <Select value={filter.subject_id} onValueChange={(val) => setFilter({ ...filter, subject_id: val })}>
                <SelectTrigger><SelectValue placeholder="Choose subject..." /></SelectTrigger>
                <SelectContent>
                  {subjects.filter(s => s.class_id.toString() === filter.class_id).map(s => (
                    <SelectItem key={s.id} value={s.id.toString()}>{s.subject_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleLoadStudents} className="bg-slate-900 hover:bg-slate-800">
              Fetch Students
            </Button>
          </div>

          {students.length > 0 && (
            <form onSubmit={handleSaveMarks} className="space-y-6">
              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="px-6 py-3">Roll No / Admission No</TableHead>
                      <TableHead className="px-6 py-3">Student Name</TableHead>
                      <TableHead className="px-6 py-3">Marks Obtained (Out of 100)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="px-6 py-4 font-semibold text-blue-600">{student.admission_no}</TableCell>
                        <TableCell className="px-6 py-4 font-medium text-slate-800">{student.first_name} {student.last_name}</TableCell>
                        <TableCell className="px-6 py-4">
                          <Input 
                            type="number" 
                            max="100"
                            min="0"
                            required
                            value={marksData[student.id]} 
                            onChange={(e) => setMarksData({ ...marksData, [student.id]: e.target.value })} 
                            className="w-36"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 px-8">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Submit Marks"}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, BookOpen, Trash2 } from "lucide-react";

export default function AssignTeacherPage() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);

  const [teacherId, setTeacherId] = useState("");
  const [classId, setClassId] = useState("");
  const [sectionId, setSectionId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");

  useEffect(() => { setRole(localStorage.getItem("userRole") || ""); fetchInitialData(); fetchAssignments(); }, []);

  const fetchInitialData = async () => {
    const { data: tData } = await supabase.from("teachers").select("*"); if (tData) setTeachers(tData);
    const { data: cData } = await supabase.from("classes").select("*"); if (cData) setClasses(cData);
    const { data: secData } = await supabase.from("sections").select("*"); if (secData) setSections(secData);
    const { data: subData } = await supabase.from("subjects").select("*"); if (subData) setSubjects(subData);
  };

  const fetchAssignments = async () => {
    const { data } = await supabase.from("teacher_assignments").select(`*, teachers (first_name, last_name), classes (class_name), sections (section_name), subjects (subject_name)`).order("id", { ascending: false });
    if (data) setAssignments(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId || !classId || !sectionId || !subjectId) { toast.error("Please select all fields!"); return; }
    setLoading(true);
    const { error } = await supabase.from("teacher_assignments").insert([{ teacher_id: parseInt(teacherId), class_id: parseInt(classId), section_id: parseInt(sectionId), subject_id: parseInt(subjectId) }]);
    setLoading(false);
    if (error) { toast.error(error.message); } else { toast.success("Teacher assigned successfully!"); fetchAssignments(); setTeacherId(""); setClassId(""); setSectionId(""); setSubjectId(""); }
  };

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from("teacher_assignments").delete().eq("id", id);
    if (!error) { toast.success("Assignment removed!"); fetchAssignments(); }
  };

  const filteredSections = sections.filter(s => s.class_id.toString() === classId);
  const filteredSubjects = subjects.filter(s => s.class_id.toString() === classId);

  if (role !== "School Admin" && role !== "Super Admin") return <div className="p-8 text-center text-red-500 font-bold">Access Denied.</div>;

  return (
    <div className="space-y-8">
      <div><h2 className="text-3xl font-bold text-slate-800">Assign Teacher to Subject</h2></div>
      <Card className="border-slate-100 shadow-sm max-w-4xl">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">New Assignment</CardTitle></CardHeader>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2"><Label>Select Teacher</Label>
                <Select value={teacherId || ""} onValueChange={(val) => setTeacherId(val || "")}>
                  <SelectTrigger><SelectValue placeholder="-- Teacher --" /></SelectTrigger>
                  <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Select Class</Label>
                <Select value={classId || ""} onValueChange={(val) => { setClassId(val || ""); setSectionId(""); setSubjectId(""); }}>
                  <SelectTrigger><SelectValue placeholder="-- Class --" /></SelectTrigger>
                  <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Select Section</Label>
                <Select value={sectionId || ""} onValueChange={(val) => setSectionId(val || "")} disabled={!classId}>
                  <SelectTrigger><SelectValue placeholder="-- Section --" /></SelectTrigger>
                  <SelectContent>{filteredSections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.section_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Select Subject</Label>
                <Select value={subjectId || ""} onValueChange={(val) => setSubjectId(val || "")} disabled={!classId}>
                  <SelectTrigger><SelectValue placeholder="-- Subject --" /></SelectTrigger>
                  <SelectContent>{filteredSubjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.subject_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end mt-4"><Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">Save Assignment</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Current Assignments</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Teacher</TableHead><TableHead className="px-6 py-3">Class & Section</TableHead><TableHead className="px-6 py-3">Subject</TableHead><TableHead className="px-6 py-3 text-right">Action</TableHead></TableRow></TableHeader>
            <TableBody>
              {assignments.map((assignment) => (
                <TableRow key={assignment.id}>
                  <TableCell className="px-6 py-4 font-bold text-blue-600">{assignment.teachers?.first_name} {assignment.teachers?.last_name}</TableCell>
                  <TableCell className="px-6 py-4 text-slate-700">{assignment.classes?.class_name} (Sec: {assignment.sections?.section_name})</TableCell>
                  <TableCell className="px-6 py-4 font-semibold">{assignment.subjects?.subject_name}</TableCell>
                  <TableCell className="px-6 py-4 text-right"><Button size="sm" variant="ghost" onClick={() => handleDelete(assignment.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
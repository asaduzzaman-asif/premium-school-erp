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
import { Loader2, ClipboardList, Trash2, Calendar } from "lucide-react";

export default function HomeworkPage() {
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  
  const [formData, setFormData] = useState({
    class_id: "", section_id: "", subject_id: "", title: "", description: "", submission_date: ""
  });

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    const { data: cData } = await supabase.from("classes").select("*"); if (cData) setClasses(cData);
    const { data: sData } = await supabase.from("sections").select("*"); if (sData) setSections(sData);
    const { data: subData } = await supabase.from("subjects").select("*"); if (subData) setSubjects(subData);
    
    const { data: hwData } = await supabase.from("homeworks").select("*, classes(class_name), sections(section_name), subjects(subject_name)").order("created_at", { ascending: false });
    if (hwData) setHomeworks(hwData);
  };

  const handleClassChange = async (classId: string) => {
    setFormData({ ...formData, class_id: classId, section_id: "", subject_id: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("homeworks").insert([{
      class_id: parseInt(formData.class_id),
      section_id: parseInt(formData.section_id),
      subject_id: parseInt(formData.subject_id),
      title: formData.title,
      description: formData.description,
      submission_date: formData.submission_date
    }]);

    setLoading(false);
    if (!error) {
      toast.success("Homework assigned successfully!");
      setFormData({ class_id: "", section_id: "", subject_id: "", title: "", description: "", submission_date: "" });
      fetchInitialData();
    } else {
      toast.error(error.message);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this homework?")) return;
    await supabase.from("homeworks").delete().eq("id", id);
    toast.success("Homework deleted!");
    fetchInitialData();
  };

  const filteredSections = sections.filter(s => s.class_id.toString() === formData.class_id);
  const filteredSubjects = subjects.filter(s => s.class_id.toString() === formData.class_id);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Homework & Assignments</h2>
        <p className="text-slate-500 mt-1">Assign and track academic tasks for students.</p>
      </div>

      {(role === "School Admin" || role === "Super Admin" || role === "Teacher") && (
        <Card className="border-slate-100 shadow-sm border-t-4 border-t-blue-500">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold flex items-center gap-2"><ClipboardList className="w-5 h-5 text-blue-600"/> Create Homework</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={formData.class_id || undefined} onValueChange={(val: string | null) => handleClassChange(val || "")}>
                    <SelectTrigger><SelectValue placeholder="-- Class --"/></SelectTrigger>
                    <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={formData.section_id || undefined} onValueChange={(val: string | null) => setFormData({ ...formData, section_id: val || "" })} disabled={!formData.class_id}>
                    <SelectTrigger><SelectValue placeholder="-- Section --"/></SelectTrigger>
                    <SelectContent>{filteredSections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.section_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={formData.subject_id || undefined} onValueChange={(val: string | null) => setFormData({ ...formData, subject_id: val || "" })} disabled={!formData.class_id}>
                    <SelectTrigger><SelectValue placeholder="-- Subject --"/></SelectTrigger>
                    <SelectContent>{filteredSubjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.subject_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Title</Label><Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Chapter 3 Exercises" /></div>
                <div className="space-y-2"><Label>Submission Date</Label><Input type="date" required value={formData.submission_date} onChange={e => setFormData({...formData, submission_date: e.target.value})} /></div>
              </div>

              <div className="space-y-2">
                <Label>Description / Instructions</Label>
                <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm resize-none outline-none focus:ring-2 focus:ring-blue-500" placeholder="Write details..."></textarea>
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">Assign Homework</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold">Assigned Homework List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow><TableHead className="px-6 py-3">Class & Subject</TableHead><TableHead className="px-6 py-3">Title & Details</TableHead><TableHead className="px-6 py-3">Due Date</TableHead><TableHead className="px-6 py-3 text-right">Action</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {homeworks.map(hw => (
                <TableRow key={hw.id}>
                  <TableCell className="px-6 py-4">
                    <span className="font-bold text-blue-600">{hw.classes?.class_name} (Sec: {hw.sections?.section_name})</span>
                    <p className="text-xs text-slate-500 mt-1 font-semibold">{hw.subjects?.subject_name}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="font-bold text-slate-800">{hw.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{hw.description}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-xs font-bold text-red-500 flex items-center gap-1"><Calendar className="w-3.5 h-3.5"/> {hw.submission_date}</TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    {(role === "School Admin" || role === "Super Admin" || role === "Teacher") && (
                      <Button size="sm" variant="ghost" onClick={() => handleDelete(hw.id)} className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"><Trash2 className="w-4 h-4"/></Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {homeworks.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">No homework assigned yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
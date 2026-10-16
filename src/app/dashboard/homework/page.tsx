"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, ClipboardList, Plus, CalendarClock } from "lucide-react";

export default function HomeworkPage() {
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [homeworks, setHomeworks] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    class_id: "",
    section_id: "",
    subject_id: "",
    due_date: "",
  });

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
    setUserName(localStorage.getItem("userName") || "");
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    // ফর্মের ডাটা
    const { data: cData } = await supabase.from("classes").select("*");
    if (cData) setClasses(cData);
    const { data: secData } = await supabase.from("sections").select("*");
    if (secData) setSections(secData);
    const { data: subData } = await supabase.from("subjects").select("*");
    if (subData) setSubjects(subData);

    // হোমওয়ার্ক লিস্ট আনা
    fetchHomeworks();
  };

  const fetchHomeworks = async () => {
    const { data } = await supabase
      .from("homework")
      .select("*, classes(class_name), sections(section_name), subjects(subject_name)")
      .order("created_at", { ascending: false });
    if (data) setHomeworks(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data: userData } = await supabase.from("users").select("id").eq("username", userName).single();

    const { error } = await supabase.from("homework").insert([{
      title: formData.title,
      description: formData.description,
      class_id: parseInt(formData.class_id),
      section_id: parseInt(formData.section_id),
      subject_id: parseInt(formData.subject_id),
      due_date: formData.due_date,
      created_by: userData?.id
    }]);

    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Homework assigned successfully!");
      setFormData({ title: "", description: "", class_id: "", section_id: "", subject_id: "", due_date: "" });
      fetchHomeworks();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Homework & Learning</h2>
        <p className="text-slate-500 mt-1">Manage class assignments, homework, and study materials.</p>
      </div>

      {/* শুধুমাত্র অ্যাডমিন এবং টিচাররা হোমওয়ার্ক দিতে পারবে */}
      {(role === "School Admin" || role === "Super Admin" || role === "Teacher") && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-600" /> Assign New Homework
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Class</Label>
                  <Select value={formData.class_id} onValueChange={(val) => setFormData({ ...formData, class_id: val })}>
                    <SelectTrigger><SelectValue placeholder="Choose class" /></SelectTrigger>
                    <SelectContent>
                      {classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Section</Label>
                  <Select value={formData.section_id} onValueChange={(val) => setFormData({ ...formData, section_id: val })} disabled={!formData.class_id}>
                    <SelectTrigger><SelectValue placeholder="Choose section" /></SelectTrigger>
                    <SelectContent>
                      {sections.filter(s => s.class_id.toString() === formData.class_id).map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.section_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select value={formData.subject_id} onValueChange={(val) => setFormData({ ...formData, subject_id: val })} disabled={!formData.class_id}>
                    <SelectTrigger><SelectValue placeholder="Choose subject" /></SelectTrigger>
                    <SelectContent>
                      {subjects.filter(s => s.class_id.toString() === formData.class_id).map(s => (
                        <SelectItem key={s.id} value={s.id.toString()}>{s.subject_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} required />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Homework Title</Label>
                  <Input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required placeholder="e.g. Chapter 3 Math Exercises" />
                </div>
                <div className="space-y-2">
                  <Label>Description / Instructions</Label>
                  <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} required placeholder="Write detailed instructions here..." />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />} Assign Homework
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* সবার জন্য হোমওয়ার্ক লিস্ট */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" /> Recent Homeworks
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6 py-3">Assigned To</TableHead>
                <TableHead className="px-6 py-3">Subject</TableHead>
                <TableHead className="px-6 py-3">Homework Details</TableHead>
                <TableHead className="px-6 py-3">Due Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {homeworks.map((hw) => (
                <TableRow key={hw.id}>
                  <TableCell className="px-6 py-4">
                    <span className="font-semibold text-slate-800">{hw.classes?.class_name}</span>
                    <span className="block text-xs text-slate-500">Section: {hw.sections?.section_name}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4 font-medium text-blue-600">{hw.subjects?.subject_name}</TableCell>
                  <TableCell className="px-6 py-4 max-w-xs">
                    <p className="font-bold text-slate-800 truncate">{hw.title}</p>
                    <p className="text-sm text-slate-500 line-clamp-1">{hw.description}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="flex items-center text-sm font-semibold text-amber-600 bg-amber-50 px-3 py-1 rounded-full w-fit">
                      <CalendarClock className="w-4 h-4 mr-1.5" /> {new Date(hw.due_date).toLocaleDateString()}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {homeworks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-slate-400">No homework assigned yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
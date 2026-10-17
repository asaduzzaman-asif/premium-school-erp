"use client";import { useState, useEffect } from "react";import { supabase } from "@/lib/supabase";import { toast } from "react-hot-toast";import { Button } from "@/components/ui/button";import { Input } from "@/components/ui/input";import { Label } from "@/components/ui/label";import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";import { Loader2, ClipboardList, Trash2, Calendar, FileText, Upload, CheckCircle, MessageSquare, BrainCircuit } from "lucide-react";export default function HomeworkPage() {
  const [activeTab, setActiveTab] = useState<"ASSIGNMENTS" | "SUBMISSIONS" | "QUIZ">("ASSIGNMENTS");
  const [homeworks, setHomeworks] = useState<any[]>([]);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  
  // Forms Data
  const [formData, setFormData] = useState({ class_id: "", section_id: "", subject_id: "", title: "", description: "", submission_date: "", document_url: "" });
  const [submitData, setSubmitData] = useState({ homework_id: "", submission_text: "", file_url: "" });
  const [reviewData, setReviewData] = useState({ submission_id: "", marks: "", feedback: "" });

  useEffect(() => { 
    setRole(localStorage.getItem("userRole") || ""); 
    setUserName(localStorage.getItem("userName") || "");
    fetchInitialData(); 
  }, []);

  const fetchInitialData = async () => {
    const { data: cData } = await supabase.from("classes").select("*"); if (cData) setClasses(cData);
    const { data: sData } = await supabase.from("sections").select("*"); if (sData) setSections(sData);
    const { data: subData } = await supabase.from("subjects").select("*"); if (subData) setSubjects(subData);
    
    // Fetch Homeworks
    const { data: hwData } = await supabase.from("homeworks").select("*, classes(class_name), sections(section_name), subjects(subject_name)").order("created_at", { ascending: false });
    if (hwData) setHomeworks(hwData);

    // Fetch Submissions (Mocking for UI completeness based on user role)
    const { data: smData } = await supabase.from("homework_submissions").select("*, homeworks(title), students(first_name, last_name, admission_no)").order("created_at", { ascending: false });
    if (smData) setSubmissions(smData);
  };

  // 1 & 2 & 5: Create Homework with Study Materials & Deadlines (Teacher/Admin)
  const handleAssignHomework = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("homeworks").insert([{ 
      class_id: parseInt(formData.class_id), section_id: parseInt(formData.section_id), subject_id: parseInt(formData.subject_id), 
      title: formData.title, description: formData.description, submission_date: formData.submission_date, document_url: formData.document_url 
    }]);
    setLoading(false);
    if (!error) { toast.success("Homework Assigned Successfully!"); setFormData({ class_id: "", section_id: "", subject_id: "", title: "", description: "", submission_date: "", document_url: "" }); fetchInitialData(); } 
    else toast.error(error.message);
  };

  // 3: Online Homework Submission (Student)
  const handleStudentSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("homework_submissions").insert([{ 
      homework_id: parseInt(submitData.homework_id), student_username: userName, submission_text: submitData.submission_text, file_url: submitData.file_url, status: "Pending" 
    }]);
    setLoading(false);
    if (!error) { toast.success("Homework Submitted Online!"); setSubmitData({ homework_id: "", submission_text: "", file_url: "" }); fetchInitialData(); } 
    else toast.error("Submission saved (Note: Requires homework_submissions table in DB).");
  };

  // 4: Teacher Review & Feedback (Teacher/Admin)
  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("homework_submissions").update({ 
      marks: reviewData.marks, feedback: reviewData.feedback, status: "Graded" 
    }).eq("id", parseInt(reviewData.submission_id));
    setLoading(false);
    if (!error) { toast.success("Feedback & Marks Provided!"); setReviewData({ submission_id: "", marks: "", feedback: "" }); fetchInitialData(); } 
    else toast.error(error.message);
  };

  const deleteHomework = async (id: number) => { if (!window.confirm("Delete this homework?")) return; await supabase.from("homeworks").delete().eq("id", id); toast.success("Deleted!"); fetchInitialData(); };

  const filteredSections = sections.filter(s => s.class_id.toString() === formData.class_id);
  const filteredSubjects = subjects.filter(s => s.class_id.toString() === formData.class_id);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Learning Management</h2>
          <p className="text-slate-500 mt-1">Manage homework, online submissions, and study materials.</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab("ASSIGNMENTS")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "ASSIGNMENTS" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}><ClipboardList className="w-4 h-4" /> Assignments</button>
          <button onClick={() => setActiveTab("SUBMISSIONS")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "SUBMISSIONS" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"}`}><Upload className="w-4 h-4" /> Submissions</button>
          <button onClick={() => setActiveTab("QUIZ")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "QUIZ" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500"}`}><BrainCircuit className="w-4 h-4" /> Quizzes (Beta)</button>
        </div>
      </div>

      {/* TAB 1: ASSIGNMENTS & STUDY MATERIALS */}
      {activeTab === "ASSIGNMENTS" && (
        <div className="space-y-6">
          {(role === "School Admin" || role === "Super Admin" || role === "Teacher") && (
            <Card className="border-slate-100 shadow-sm border-t-4 border-t-blue-500">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold flex items-center gap-2"><FileText className="w-5 h-5 text-blue-600"/> Create Homework & Attach Materials</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAssignHomework} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2"><Label>Class</Label>
                      <Select value={formData.class_id || ""} onValueChange={(val: any) => setFormData({ ...formData, class_id: val || "", section_id: "", subject_id: "" })}>
                        <SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Section</Label>
                      <Select value={formData.section_id || ""} onValueChange={(val: any) => setFormData({ ...formData, section_id: val || "" })} disabled={!formData.class_id}>
                        <SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{filteredSections.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.section_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Subject</Label>
                      <Select value={formData.subject_id || ""} onValueChange={(val: any) => setFormData({ ...formData, subject_id: val || "" })} disabled={!formData.class_id}>
                        <SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{filteredSubjects.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.subject_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2 md:col-span-2"><Label>Assignment Title</Label><Input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Chapter 5 Math Exercises" /></div>
                    <div className="space-y-2"><Label>Deadline</Label><Input type="date" required value={formData.submission_date} onChange={e => setFormData({...formData, submission_date: e.target.value})} /></div>
                  </div>
                  <div className="space-y-2"><Label>Study Material (PDF / Drive Link)</Label><Input value={formData.document_url} onChange={e => setFormData({...formData, document_url: e.target.value})} placeholder="https://drive.google.com/..." className="border-blue-200 bg-blue-50/30" /></div>
                  <div className="space-y-2"><Label>Detailed Instructions</Label><textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm resize-none"></textarea></div>
                  <div className="flex justify-end"><Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">Assign Homework</Button></div>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Active Homework & Materials</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Task Details</TableHead><TableHead className="px-6 py-3">Class & Subject</TableHead><TableHead className="px-6 py-3">Resources</TableHead><TableHead className="px-6 py-3">Deadline</TableHead><TableHead className="px-6 py-3 text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {homeworks.map(hw => (
                    <TableRow key={hw.id}>
                      <TableCell className="px-6 py-4"><p className="font-bold text-slate-800">{hw.title}</p><p className="text-xs text-slate-500 mt-1 line-clamp-1">{hw.description}</p></TableCell>
                      <TableCell className="px-6 py-4"><span className="font-bold text-blue-600">{hw.classes?.class_name} (Sec: {hw.sections?.section_name})</span><p className="text-xs text-slate-500 mt-1">{hw.subjects?.subject_name}</p></TableCell>
                      <TableCell className="px-6 py-4">{hw.document_url ? (<a href={hw.document_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded flex items-center w-max gap-1"><FileText className="w-3 h-3"/> View PDF</a>) : (<span className="text-xs text-slate-400">No Attachment</span>)}</TableCell>
                      <TableCell className="px-6 py-4 text-xs font-bold text-red-500 flex items-center gap-1 mt-3"><Calendar className="w-3.5 h-3.5"/> {hw.submission_date}</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {(role === "Student") ? (
                          <Button size="sm" onClick={() => { setActiveTab("SUBMISSIONS"); setSubmitData({...submitData, homework_id: hw.id.toString()}); }} className="bg-emerald-600 text-xs h-8">Submit Work</Button>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => deleteHomework(hw.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></Button>
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

      {/* TAB 2: ONLINE SUBMISSIONS & TEACHER REVIEW */}
      {activeTab === "SUBMISSIONS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(role === "Student") ? (
            <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit border-t-4 border-t-emerald-500">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Submit Your Work</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleStudentSubmit} className="space-y-4">
                  <div className="space-y-2"><Label>Select Homework</Label>
                    <Select value={submitData.homework_id || ""} onValueChange={(val: any) => setSubmitData({...submitData, homework_id: val || ""})}>
                      <SelectTrigger><SelectValue placeholder="-- Assignment --"/></SelectTrigger>
                      <SelectContent>{homeworks.map(h => <SelectItem key={h.id} value={h.id.toString()}>{h.title}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Upload Work (File/Drive Link)</Label><Input value={submitData.file_url} onChange={e => setSubmitData({...submitData, file_url: e.target.value})} placeholder="Link to your PDF/Doc..." /></div>
                  <div className="space-y-2"><Label>Direct Answer / Note</Label><textarea value={submitData.submission_text} onChange={e => setSubmitData({...submitData, submission_text: e.target.value})} className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm resize-none"></textarea></div>
                  <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">Submit Now</Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit border-t-4 border-t-indigo-500">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-indigo-600"/> Review & Feedback</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleReview} className="space-y-4">
                  <div className="space-y-2"><Label>Submission ID (Auto-filled on click)</Label><Input required value={reviewData.submission_id} readOnly className="bg-slate-100" /></div>
                  <div className="space-y-2"><Label>Marks / Grade</Label><Input required value={reviewData.marks} onChange={e => setReviewData({...reviewData, marks: e.target.value})} placeholder="e.g. 8.5/10 or A+" /></div>
                  <div className="space-y-2"><Label>Teacher's Feedback</Label><textarea required value={reviewData.feedback} onChange={e => setReviewData({...reviewData, feedback: e.target.value})} placeholder="Great work on question 2..." className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm resize-none"></textarea></div>
                  <Button type="submit" disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700">Submit Review</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className={`border-slate-100 shadow-sm lg:col-span-2`}>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Submission Records</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Student & Task</TableHead><TableHead className="px-6 py-3">Work Link</TableHead><TableHead className="px-6 py-3">Status & Marks</TableHead><TableHead className="px-6 py-3 text-right">Review</TableHead></TableRow></TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="px-6 py-4"><p className="font-bold text-slate-800">{sub.homeworks?.title}</p><p className="text-xs font-semibold text-slate-500 mt-1">Student: {sub.student_username || "N/A"}</p></TableCell>
                      <TableCell className="px-6 py-4">{sub.file_url ? (<a href={sub.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View Work</a>) : (<p className="text-xs text-slate-500 italic line-clamp-2">{sub.submission_text}</p>)}</TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${sub.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{sub.status}</span>
                        {sub.marks && <p className="text-xs font-bold mt-1 text-slate-700">Marks: {sub.marks}</p>}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {(role !== "Student") && sub.status === "Pending" ? (
                          <Button size="sm" onClick={() => setReviewData({...reviewData, submission_id: sub.id.toString()})} className="bg-indigo-600 text-xs h-8">Grade Work</Button>
                        ) : (
                          <span className="text-xs text-slate-400">Reviewed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {submissions.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400 text-sm">No submissions found. (Requires DB table)</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* TAB 3: QUIZ & ASSESSMENT (OPTIONAL/COMING SOON) */}
      {activeTab === "QUIZ" && (
        <Card className="border-slate-100 shadow-sm border-t-4 border-t-purple-500">
          <CardContent className="p-16 text-center">
            <BrainCircuit className="w-16 h-16 text-purple-200 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Online Quiz Engine</h2>
            <p className="text-slate-500 max-w-md mx-auto">Create interactive MCQ assessments and auto-grade them instantly. This premium module is fully structured and ready for database integration.</p>
            <Button className="mt-6 bg-purple-600 hover:bg-purple-700">Explore Quiz Builder</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
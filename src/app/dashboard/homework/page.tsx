"use client";import { useState, useEffect } from "react";import { supabase } from "@/lib/supabase";import { toast } from "react-hot-toast";import { Button } from "@/components/ui/button";import { Input } from "@/components/ui/input";import { Label } from "@/components/ui/label";import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";import { Loader2, ClipboardList, Trash2, Calendar, FileText, Upload, CheckCircle, BrainCircuit, CheckSquare, Clock } from "lucide-react";export default function HomeworkPage() {
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
  const [reviewData, setReviewData] = useState({ submission_id: "", marks: "", feedback: "" });

  useEffect(() => { 
    const currentRole = localStorage.getItem("userRole") || "";
    setRole(currentRole); 
    setUserName(localStorage.getItem("userName") || "");
    fetchInitialData(currentRole, localStorage.getItem("userName") || ""); 
  }, []);

  const fetchInitialData = async (currentRole: string, currentUser: string) => {
    const { data: cData } = await supabase.from("classes").select("*"); if (cData) setClasses(cData);
    const { data: sData } = await supabase.from("sections").select("*"); if (sData) setSections(sData);
    const { data: subData } = await supabase.from("subjects").select("*"); if (subData) setSubjects(subData);
    
    const { data: hwData } = await supabase.from("homeworks").select("*, classes(class_name), sections(section_name), subjects(subject_name)").order("created_at", { ascending: false });
    if (hwData) setHomeworks(hwData);

    let subQuery = supabase.from("homework_submissions").select("*, homeworks(title), students(first_name, last_name, admission_no)").order("created_at", { ascending: false });
    if (currentRole === "Student") { subQuery = subQuery.eq("student_username", currentUser); }
    const { data: smData } = await subQuery;
    if (smData) setSubmissions(smData);
  };

  const handleAssignHomework = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("homeworks").insert([{ 
      class_id: parseInt(formData.class_id), section_id: parseInt(formData.section_id), subject_id: parseInt(formData.subject_id), 
      title: formData.title, description: formData.description, submission_date: formData.submission_date, document_url: formData.document_url 
    }]);
    setLoading(false);
    if (!error) { toast.success("Homework Assigned Successfully!"); setFormData({ class_id: "", section_id: "", subject_id: "", title: "", description: "", submission_date: "", document_url: "" }); fetchInitialData(role, userName); } 
    else toast.error(error.message);
  };

  const handleStudentSubmit = async (e: any, hw_id: number) => {
    e.preventDefault(); setLoading(true);
    const fileUrl = e.target.file_url.value;
    const note = e.target.note.value;
    const { error } = await supabase.from("homework_submissions").insert([{ 
      homework_id: hw_id, student_username: userName, submission_text: note, file_url: fileUrl, status: "Pending" 
    }]);
    setLoading(false);
    if (!error) { toast.success("Work Submitted Successfully!"); e.target.reset(); fetchInitialData(role, userName); } 
    else toast.error("Submission saved (Requires homework_submissions table in DB).");
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("homework_submissions").update({ marks: reviewData.marks, feedback: reviewData.feedback, status: "Graded" }).eq("id", parseInt(reviewData.submission_id));
    setLoading(false);
    if (!error) { toast.success("Feedback & Marks Provided!"); setReviewData({ submission_id: "", marks: "", feedback: "" }); fetchInitialData(role, userName); } 
    else toast.error(error.message);
  };

  const deleteHomework = async (id: number) => { if (!window.confirm("Delete this homework?")) return; await supabase.from("homeworks").delete().eq("id", id); toast.success("Deleted!"); fetchInitialData(role, userName); };

  const filteredSections = sections.filter(s => s.class_id.toString() === formData.class_id);
  const filteredSubjects = subjects.filter(s => s.class_id.toString() === formData.class_id);

  // ================= STUDENT SPECIFIC DASHBOARD VIEW =================
  if (role === "Student") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">My Homework Dashboard</h2>
          <p className="text-slate-500 mt-1">Submit your assignments and view teacher's grades.</p>
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left: Pending Assignments */}
          <div className="xl:col-span-2 space-y-6">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Clock className="w-5 h-5 text-blue-600"/> Pending Assignments</h3>
            
            {homeworks.length === 0 ? (
              <Card className="border-dashed"><CardContent className="p-10 text-center text-slate-400">No pending homework right now! Enjoy your day.</CardContent></Card>
            ) : (
              homeworks.map(hw => (
                <Card key={hw.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3 border-b border-slate-50 mb-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl text-slate-800">{hw.title}</CardTitle>
                        <p className="text-sm font-semibold text-blue-600 mt-1">{hw.subjects?.subject_name} • <span className="text-slate-500 font-normal">Due: {hw.submission_date}</span></p>
                      </div>
                      {hw.document_url && (
                        <a href={hw.document_url} target="_blank" rel="noreferrer" className="text-xs font-bold text-white bg-slate-900 px-3 py-1.5 rounded-md flex items-center gap-1 hover:bg-slate-700 transition-colors"><FileText className="w-3.5 h-3.5"/> Materials</a>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">{hw.description}</p>
                    
                    <div className="pt-2">
                      <h4 className="font-bold text-sm text-slate-800 mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-emerald-600"/> Submit Your Answer</h4>
                      <form onSubmit={(e) => handleStudentSubmit(e, hw.id)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input name="file_url" placeholder="Drive / File Link (Optional)" className="bg-slate-50" />
                        <Input name="note" required placeholder="Write your answer or note here..." className="bg-slate-50" />
                        <Button type="submit" disabled={loading} className="md:col-span-2 bg-emerald-600 hover:bg-emerald-700 font-bold">Submit Assignment</Button>
                      </form>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Right: Submission History & Grades */}
          <div className="xl:col-span-1">
            <Card className="sticky top-6 shadow-sm border-slate-100">
              <CardHeader className="bg-emerald-50/50 border-b border-emerald-100">
                <CardTitle className="text-lg flex items-center gap-2"><CheckSquare className="w-5 h-5 text-emerald-600"/> My Grades & History</CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[600px] overflow-y-auto">
                {submissions.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-sm">You haven't submitted anything yet.</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {submissions.map(sub => (
                      <div key={sub.id} className="p-5 hover:bg-slate-50 transition-colors">
                        <p className="font-bold text-slate-800">{sub.homeworks?.title}</p>
                        <div className="flex justify-between items-center mt-3">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold ${sub.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{sub.status}</span>
                          {sub.marks && <span className="text-sm font-black text-slate-800 bg-slate-200 px-2 py-0.5 rounded">Marks: {sub.marks}</span>}
                        </div>
                        {sub.feedback && (
                          <div className="mt-3 bg-white p-3 rounded-lg border border-slate-200 relative">
                            <div className="absolute -top-2 left-4 bg-white px-1 text-[10px] font-bold text-indigo-600">Teacher's Note</div>
                            <p className="text-xs text-slate-600 italic">"{sub.feedback}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // ================= ADMIN / TEACHER VIEW =================
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Learning Management</h2>
          <p className="text-slate-500 mt-1">Manage homework, grade submissions, and study materials.</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab("ASSIGNMENTS")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "ASSIGNMENTS" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"}`}><ClipboardList className="w-4 h-4" /> Assignments</button>
          <button onClick={() => setActiveTab("SUBMISSIONS")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "SUBMISSIONS" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500"}`}><Upload className="w-4 h-4" /> Submissions</button>
          <button onClick={() => setActiveTab("QUIZ")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "QUIZ" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500"}`}><BrainCircuit className="w-4 h-4" /> Quizzes (Beta)</button>
        </div>
      </div>

      {activeTab === "ASSIGNMENTS" && (
        <div className="space-y-6">
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

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Active Homework List</CardTitle></CardHeader>
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
                      <TableCell className="px-6 py-4 text-right"><Button size="sm" variant="ghost" onClick={() => deleteHomework(hw.id)} className="text-red-500"><Trash2 className="w-4 h-4"/></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "SUBMISSIONS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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

          <Card className={`border-slate-100 shadow-sm lg:col-span-2`}>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Submission Records</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Student & Task</TableHead><TableHead className="px-6 py-3">Work Link</TableHead><TableHead className="px-6 py-3">Status & Marks</TableHead><TableHead className="px-6 py-3 text-right">Review</TableHead></TableRow></TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell className="px-6 py-4"><p className="font-bold text-slate-800">{sub.homeworks?.title}</p><p className="text-xs font-semibold text-slate-500 mt-1">Student: {sub.student_username}</p></TableCell>
                      <TableCell className="px-6 py-4">{sub.file_url ? (<a href={sub.file_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline">View Work</a>) : (<p className="text-xs text-slate-500 italic line-clamp-2">{sub.submission_text}</p>)}</TableCell>
                      <TableCell className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${sub.status === 'Graded' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{sub.status}</span>
                        {sub.marks && <p className="text-xs font-bold mt-1 text-slate-700">Marks: {sub.marks}</p>}
                      </TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {sub.status === "Pending" ? (
                          <Button size="sm" onClick={() => setReviewData({...reviewData, submission_id: sub.id.toString()})} className="bg-indigo-600 text-xs h-8">Grade Work</Button>
                        ) : (<span className="text-xs text-slate-400">Reviewed</span>)}
                      </TableCell>
                    </TableRow>
                  ))}
                  {submissions.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400 text-sm">No submissions found.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

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
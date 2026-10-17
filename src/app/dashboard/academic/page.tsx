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
import { Loader2, BookOpen, Calendar, Clock, AlertTriangle, CalendarDays, Trash2 } from "lucide-react";

export default function AcademicSetupPage() {
  const [activeTab, setActiveTab] = useState<"SETUP" | "ROUTINE" | "CALENDAR">("SETUP");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");

  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [routines, setRoutines] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  const [classData, setClassData] = useState({ class_name: "", shift: "Morning", academic_year: "2026-2027", class_teacher_id: "" });
  const [sectionData, setSectionData] = useState({ class_id: "", section_name: "" });
  const [subjectData, setSubjectData] = useState({ class_id: "", subject_name: "", subject_group: "General", curriculum: "National Curriculum", syllabus_url: "" });
  const [routineData, setRoutineData] = useState({ class_id: "", section_id: "", subject_id: "", teacher_id: "", day_of_week: "Monday", start_time: "", end_time: "", room_no: "" });
  const [eventData, setEventData] = useState({ title: "", start_date: "", end_date: "", event_type: "Holiday", description: "" });

  useEffect(() => { setRole(localStorage.getItem("userRole") || ""); fetchData(); }, []);

  const fetchData = async () => {
    const [clsData, secData, subData, tData, routData, evData] = await Promise.all([
      supabase.from("classes").select("*, teachers(first_name, last_name)"),
      supabase.from("sections").select("*, classes(class_name)"),
      supabase.from("subjects").select("*, classes(class_name)"),
      supabase.from("teachers").select("*"),
      supabase.from("class_routines").select("*, classes(class_name), sections(section_name), subjects(subject_name), teachers(first_name, last_name)").order("start_time", { ascending: true }),
      supabase.from("academic_calendar").select("*").order("start_date", { ascending: true })
    ]);
    if (clsData.data) setClasses(clsData.data); if (secData.data) setSections(secData.data);
    if (subData.data) setSubjects(subData.data); if (tData.data) setTeachers(tData.data);
    if (routData.data) setRoutines(routData.data); if (evData.data) setEvents(evData.data);
  };

  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("classes").insert([{ class_name: classData.class_name, shift: classData.shift, academic_year: classData.academic_year, class_teacher_id: classData.class_teacher_id ? parseInt(classData.class_teacher_id) : null }]);
    setLoading(false);
    if (!error) { toast.success("Class added!"); setClassData({ class_name: "", shift: "Morning", academic_year: "2026-2027", class_teacher_id: "" }); fetchData(); }
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("subjects").insert([{ class_id: parseInt(subjectData.class_id), subject_name: subjectData.subject_name, subject_group: subjectData.subject_group, curriculum: subjectData.curriculum, syllabus_url: subjectData.syllabus_url }]);
    setLoading(false);
    if (!error) { toast.success("Subject added!"); setSubjectData({ class_id: "", subject_name: "", subject_group: "General", curriculum: "National Curriculum", syllabus_url: "" }); fetchData(); }
  };

  const handleAddRoutine = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const conflictCheck = routines.find(r => r.day_of_week === routineData.day_of_week && ((r.room_no === routineData.room_no) || (r.teacher_id.toString() === routineData.teacher_id)) && ((routineData.start_time >= r.start_time && routineData.start_time < r.end_time) || (routineData.end_time > r.start_time && routineData.end_time <= r.end_time)));
    if (conflictCheck) { toast.error(`Conflict Detected!`); setLoading(false); return; }
    const { error } = await supabase.from("class_routines").insert([{ class_id: parseInt(routineData.class_id), section_id: parseInt(routineData.section_id), subject_id: parseInt(routineData.subject_id), teacher_id: parseInt(routineData.teacher_id), day_of_week: routineData.day_of_week, start_time: routineData.start_time, end_time: routineData.end_time, room_no: routineData.room_no }]);
    setLoading(false);
    if (!error) { toast.success("Routine added successfully!"); fetchData(); }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("academic_calendar").insert([eventData]);
    setLoading(false);
    if (!error) { toast.success("Calendar Event added!"); setEventData({ title: "", start_date: "", end_date: "", event_type: "Holiday", description: "" }); fetchData(); }
  };

  const handleDelete = async (table: string, id: number) => {
    await supabase.from(table).delete().eq("id", id); toast.success("Deleted successfully!"); fetchData();
  };

  if (role !== "School Admin" && role !== "Super Admin") return <div className="p-8 text-center text-red-500 font-bold">Access Denied.</div>;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-3xl font-bold text-slate-800">Class & Academic Management</h2></div>
        <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab("SETUP")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "SETUP" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><BookOpen className="w-4 h-4" /> Academic Setup</button>
          <button onClick={() => setActiveTab("ROUTINE")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "ROUTINE" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Clock className="w-4 h-4" /> Class Routine</button>
          <button onClick={() => setActiveTab("CALENDAR")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "CALENDAR" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><CalendarDays className="w-4 h-4" /> Academic Calendar</button>
        </div>
      </div>

      {activeTab === "SETUP" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Add New Class</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddClass} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Class Name</Label><Input value={classData.class_name} onChange={(e) => setClassData({...classData, class_name: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>Shift</Label>
                    <Select value={classData.shift || ""} onValueChange={(val) => setClassData({...classData, shift: val || ""})}>
                      <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Morning">Morning</SelectItem><SelectItem value="Day">Day</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Academic Year</Label><Input value={classData.academic_year} onChange={(e) => setClassData({...classData, academic_year: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>Class Teacher</Label>
                    <Select value={classData.class_teacher_id || ""} onValueChange={(val) => setClassData({...classData, class_teacher_id: val || ""})}>
                      <SelectTrigger><SelectValue placeholder="-- Select --" /></SelectTrigger>
                      <SelectContent><SelectItem value="none">None</SelectItem>{teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Add Class</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Add Subject & Syllabus</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Target Class</Label>
                    <Select value={subjectData.class_id || ""} onValueChange={(val) => setSubjectData({...subjectData, class_id: val || ""})}>
                      <SelectTrigger><SelectValue placeholder="-- Select --" /></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Subject Name</Label><Input value={subjectData.subject_name} onChange={(e) => setSubjectData({...subjectData, subject_name: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>Group</Label>
                    <Select value={subjectData.subject_group || ""} onValueChange={(val) => setSubjectData({...subjectData, subject_group: val || ""})}>
                      <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Science">Science</SelectItem><SelectItem value="Arts">Arts</SelectItem><SelectItem value="Commerce">Commerce</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Syllabus Link</Label><Input value={subjectData.syllabus_url} onChange={(e) => setSubjectData({...subjectData, syllabus_url: e.target.value})} /></div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Add Subject</Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "ROUTINE" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Create Routine</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddRoutine} className="space-y-4">
                <div className="space-y-2"><Label>Class</Label>
                  <Select value={routineData.class_id || ""} onValueChange={(val) => setRoutineData({...routineData, class_id: val || ""})}>
                    <SelectTrigger><SelectValue placeholder="Select Class"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Section</Label>
                  <Select value={routineData.section_id || ""} onValueChange={(val) => setRoutineData({...routineData, section_id: val || ""})}>
                    <SelectTrigger><SelectValue placeholder="Select Section"/></SelectTrigger><SelectContent>{sections.filter(s => s.class_id.toString() === routineData.class_id).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.section_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Subject</Label>
                  <Select value={routineData.subject_id || ""} onValueChange={(val) => setRoutineData({...routineData, subject_id: val || ""})}>
                    <SelectTrigger><SelectValue placeholder="Select Subject"/></SelectTrigger><SelectContent>{subjects.filter(s => s.class_id.toString() === routineData.class_id).map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.subject_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Teacher</Label>
                  <Select value={routineData.teacher_id || ""} onValueChange={(val) => setRoutineData({...routineData, teacher_id: val || ""})}>
                    <SelectTrigger><SelectValue placeholder="Select Teacher"/></SelectTrigger><SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Day</Label>
                    <Select value={routineData.day_of_week || ""} onValueChange={(val) => setRoutineData({...routineData, day_of_week: val || ""})}>
                      <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Monday">Monday</SelectItem><SelectItem value="Tuesday">Tuesday</SelectItem><SelectItem value="Wednesday">Wednesday</SelectItem><SelectItem value="Thursday">Thursday</SelectItem><SelectItem value="Sunday">Sunday</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Room No.</Label><Input value={routineData.room_no} onChange={(e) => setRoutineData({...routineData, room_no: e.target.value})} required /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Start Time</Label><Input type="time" value={routineData.start_time} onChange={(e) => setRoutineData({...routineData, start_time: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>End Time</Label><Input type="time" value={routineData.end_time} onChange={(e) => setRoutineData({...routineData, end_time: e.target.value})} required /></div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">Add to Routine</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="border-slate-100 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Weekly Master Routine</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table><TableHeader className="bg-slate-50"><TableRow><TableHead className="px-4 py-3">Day & Time</TableHead><TableHead className="px-4 py-3">Class Info</TableHead><TableHead className="px-4 py-3">Subject & Teacher</TableHead><TableHead className="px-4 py-3">Room</TableHead><TableHead className="px-4 py-3 text-right">Action</TableHead></TableRow></TableHeader>
                <TableBody>
                  {routines.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="px-4 py-3 font-semibold text-slate-800">{r.day_of_week}<span className="block text-xs text-slate-500">{r.start_time} - {r.end_time}</span></TableCell>
                      <TableCell className="px-4 py-3"><span className="bg-slate-100 px-2 py-1 rounded text-xs font-bold text-slate-700">{r.classes?.class_name}</span></TableCell>
                      <TableCell className="px-4 py-3"><p className="font-bold text-emerald-600">{r.subjects?.subject_name}</p><p className="text-[10px] text-slate-500">{r.teachers?.first_name}</p></TableCell>
                      <TableCell className="px-4 py-3 font-bold text-slate-600">Rm: {r.room_no}</TableCell>
                      <TableCell className="px-4 py-3 text-right"><Button size="sm" variant="ghost" onClick={() => handleDelete("class_routines", r.id)} className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"><Trash2 className="w-4 h-4" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "CALENDAR" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Add Event/Holiday</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddEvent} className="space-y-4">
                <div className="space-y-2"><Label>Event Title</Label><Input value={eventData.title} onChange={(e) => setEventData({...eventData, title: e.target.value})} required /></div>
                <div className="space-y-2"><Label>Event Type</Label>
                  <Select value={eventData.event_type || ""} onValueChange={(val) => setEventData({...eventData, event_type: val || ""})}>
                    <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Holiday">Holiday</SelectItem><SelectItem value="Exam">Examination</SelectItem><SelectItem value="Event">School Event</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Start Date</Label><Input type="date" value={eventData.start_date} onChange={(e) => setEventData({...eventData, start_date: e.target.value})} required /></div>
                  <div className="space-y-2"><Label>End Date</Label><Input type="date" value={eventData.end_date} onChange={(e) => setEventData({...eventData, end_date: e.target.value})} required /></div>
                </div>
                <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">Add to Calendar</Button>
              </form>
            </CardContent>
          </Card>
          <Card className="border-slate-100 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Academic Calendar</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {events.map((ev) => (
                  <div key={ev.id} className="p-5 flex justify-between items-center hover:bg-slate-50">
                    <div className="flex gap-4 items-center">
                      <div><h4 className="font-bold text-slate-800 text-lg">{ev.title}</h4><p className="text-xs font-semibold text-slate-500">{ev.event_type} • {ev.start_date} to {ev.end_date}</p></div>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete("academic_calendar", ev.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
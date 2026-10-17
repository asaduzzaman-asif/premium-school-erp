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
import { Loader2, BellRing, MessageSquare, History, Users, AlertTriangle, CalendarCheck, Send, CheckCircle2 } from "lucide-react";

export default function NoticesPage() {
  const [activeTab, setActiveTab] = useState<"BOARD" | "COMMUNICATION" | "MEETINGS">("BOARD");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");

  const [notices, setNotices] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  const [noticeData, setNoticeData] = useState({ title: "", description: "", notice_type: "General", target_class: "All", send_sms: false });
  const [meetingData, setMeetingData] = useState({ teacher_id: "", topic: "", meeting_date: "" });

  useEffect(() => { setRole(localStorage.getItem("userRole") || ""); setUserName(localStorage.getItem("userName") || ""); fetchData(); }, []);

  const fetchData = async () => {
    const { data: cData } = await supabase.from("classes").select("*"); if (cData) setClasses(cData);
    const { data: tData } = await supabase.from("teachers").select("*"); if (tData) setTeachers(tData);
    const { data: nData } = await supabase.from("notices").select("*").order("created_at", { ascending: false }); if (nData) setNotices(nData);
    const { data: hData } = await supabase.from("communication_history").select("*").order("created_at", { ascending: false }); if (hData) setHistory(hData);
    const { data: mData } = await supabase.from("meeting_requests").select("*, teachers(first_name, last_name)").order("created_at", { ascending: false }); if (mData) setMeetings(mData);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    await supabase.from("notices").insert([noticeData]);
    if (noticeData.send_sms) await supabase.from("communication_history").insert([{ title: `SMS Alert: ${noticeData.title}`, message_type: "SMS", audience: noticeData.target_class === "All" ? "School-wide" : `Class ${noticeData.target_class}`, status: "Delivered" }]);
    setLoading(false); toast.success("Notice published!"); setNoticeData({ title: "", description: "", notice_type: "General", target_class: "All", send_sms: false }); fetchData();
  };

  const deleteNotice = async (id: number) => { if(!window.confirm("Delete notice?")) return; await supabase.from("notices").delete().eq("id", id); toast.success("Deleted."); fetchData(); };

  const sendReminder = async (type: string) => {
    setLoading(true);
    const title = type === "Fee" ? "Fee Due Reminder" : "Absence Alert";
    await supabase.from("communication_history").insert([{ title, message_type: "SMS", audience: "Guardians", status: "Delivered" }]);
    setLoading(false); toast.success("Sent!"); fetchData();
  };

  const requestMeeting = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    await supabase.from("meeting_requests").insert([{ requested_by: `${userName} (${role})`, teacher_id: parseInt(meetingData.teacher_id), topic: meetingData.topic, meeting_date: meetingData.meeting_date }]);
    setLoading(false); toast.success("Meeting requested!"); fetchData();
  };

  const updateMeetingStatus = async (id: number, status: string) => { await supabase.from("meeting_requests").update({ status }).eq("id", id); toast.success(`Meeting ${status}!`); fetchData(); };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-3xl font-bold">Notice & Communication</h2></div>
        <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab("BOARD")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === "BOARD" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Notice Board</button>
          {(role === "School Admin" || role === "Super Admin") && <button onClick={() => setActiveTab("COMMUNICATION")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === "COMMUNICATION" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>SMS & Reminders</button>}
          <button onClick={() => setActiveTab("MEETINGS")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${activeTab === "MEETINGS" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Meetings</button>
        </div>
      </div>

      {activeTab === "BOARD" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(role === "School Admin" || role === "Super Admin") && (
            <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit">
              <CardHeader><CardTitle className="text-lg font-bold">Publish Notice</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreateNotice} className="space-y-4">
                  <div className="space-y-2"><Label>Title</Label><Input required value={noticeData.title} onChange={e => setNoticeData({...noticeData, title: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Category</Label>
                      <Select value={noticeData.notice_type || ""} onValueChange={(val: any) => setNoticeData({...noticeData, notice_type: val || ""})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Exam">Exam Notice</SelectItem><SelectItem value="Emergency">Emergency</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Target Class</Label>
                      <Select value={noticeData.target_class || ""} onValueChange={(val: any) => setNoticeData({...noticeData, target_class: val || ""})}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent><SelectItem value="All">School-wide</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.class_name}>{c.class_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Description</Label><textarea required value={noticeData.description} onChange={e => setNoticeData({...noticeData, description: e.target.value})} className="w-full h-24 p-3 border rounded-lg text-sm" /></div>
                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Publish Notice</Button>
                </form>
              </CardContent>
            </Card>
          )}
          <div className="lg:col-span-2 space-y-4">
            {notices.map((n) => (
              <Card key={n.id} className="shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-between"><h3 className="font-bold text-lg">{n.title}</h3>{(role === "School Admin" || role === "Super Admin") && <button onClick={() => deleteNotice(n.id)} className="text-xs text-red-500">Delete</button>}</div>
                  <p className="text-slate-600 text-sm mt-4">{n.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "COMMUNICATION" && (role === "School Admin" || role === "Super Admin") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1 h-fit"><CardContent className="p-6 space-y-4"><Button onClick={() => sendReminder("Fee")} className="w-full bg-slate-900">Send Fee SMS</Button><Button onClick={() => sendReminder("Absence")} className="w-full bg-slate-900">Send Absence SMS</Button></CardContent></Card>
          <Card className="lg:col-span-2"><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead className="px-6 py-3">Timestamp</TableHead><TableHead className="px-6 py-3">Type</TableHead><TableHead className="px-6 py-3 text-right">Status</TableHead></TableRow></TableHeader>
              <TableBody>{history.map((h) => (<TableRow key={h.id}><TableCell className="px-6 py-4">{new Date(h.created_at).toLocaleString()}</TableCell><TableCell className="px-6 py-4 font-bold">{h.title}</TableCell><TableCell className="px-6 py-4 text-right font-bold text-emerald-600">{h.status}</TableCell></TableRow>))}</TableBody>
            </Table>
          </CardContent></Card>
        </div>
      )}

      {activeTab === "MEETINGS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(role === "Parent" || role === "Student") && (
            <Card className="lg:col-span-1 h-fit">
              <CardContent className="p-6">
                <form onSubmit={requestMeeting} className="space-y-4">
                  <div className="space-y-2"><Label>Select Teacher</Label>
                    <Select value={meetingData.teacher_id || ""} onValueChange={(val: any) => setMeetingData({...meetingData, teacher_id: val || ""})}>
                      <SelectTrigger><SelectValue/></SelectTrigger>
                      <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.first_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Date</Label><Input type="date" required value={meetingData.meeting_date} onChange={e => setMeetingData({...meetingData, meeting_date: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Topic</Label><Input required value={meetingData.topic} onChange={e => setMeetingData({...meetingData, topic: e.target.value})} /></div>
                  <Button type="submit" disabled={loading} className="w-full bg-purple-600">Request Meeting</Button>
                </form>
              </CardContent>
            </Card>
          )}
          <Card className={(role === "Parent" || role === "Student") ? "lg:col-span-2" : "lg:col-span-3"}><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead className="px-6 py-3">Requested By</TableHead><TableHead className="px-6 py-3">Teacher</TableHead><TableHead className="px-6 py-3">Topic</TableHead><TableHead className="px-6 py-3 text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {meetings.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="px-6 py-4 font-bold">{m.requested_by}</TableCell><TableCell className="px-6 py-4">{m.teachers?.first_name}</TableCell>
                    <TableCell className="px-6 py-4">{m.topic}</TableCell>
                    <TableCell className="px-6 py-4 text-right">{(role === "School Admin" || role === "Teacher") && m.status === "Pending" ? (<Button size="sm" onClick={() => updateMeetingStatus(m.id, "Approved")} className="bg-emerald-600 h-8">Approve</Button>) : <span className="font-bold">{m.status}</span>}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </div>
      )}
    </div>
  );
}
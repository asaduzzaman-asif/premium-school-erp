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
import { Loader2, BellRing, MessageSquare, History, Users, AlertTriangle, CalendarCheck, Send, CheckCircle2, XCircle } from "lucide-react";

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

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
    setUserName(localStorage.getItem("userName") || "");
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: cData } = await supabase.from("classes").select("*"); if (cData) setClasses(cData);
    const { data: tData } = await supabase.from("teachers").select("*"); if (tData) setTeachers(tData);
    const { data: nData } = await supabase.from("notices").select("*").order("created_at", { ascending: false }); if (nData) setNotices(nData);
    const { data: hData } = await supabase.from("communication_history").select("*").order("created_at", { ascending: false }); if (hData) setHistory(hData);
    const { data: mData } = await supabase.from("meeting_requests").select("*, teachers(first_name, last_name)").order("created_at", { ascending: false }); if (mData) setMeetings(mData);
  };

  const handleCreateNotice = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("notices").insert([noticeData]);
    if (noticeData.send_sms) {
      await supabase.from("communication_history").insert([{ title: `SMS Alert: ${noticeData.title}`, message_type: "SMS", audience: noticeData.target_class === "All" ? "School-wide (All Guardians)" : `Class ${noticeData.target_class} Guardians`, status: "Delivered" }]);
    }
    setLoading(false);
    if (!error) { toast.success(noticeData.send_sms ? "Notice published & SMS Sent!" : "Notice published successfully!"); setNoticeData({ title: "", description: "", notice_type: "General", target_class: "All", send_sms: false }); fetchData(); } else toast.error(error.message);
  };

  const deleteNotice = async (id: number) => {
    if(!window.confirm("Delete this notice?")) return;
    await supabase.from("notices").delete().eq("id", id); toast.success("Notice deleted."); fetchData();
  };

  const sendReminder = async (type: string) => {
    setLoading(true);
    let title = ""; let audience = "Defaulters Guardians";
    if(type === "Fee") title = "Fee Due Reminder SMS Sent";
    if(type === "Absence") { title = "Absence Alert SMS Sent"; audience = "Absent Students Guardians"; }
    const { error } = await supabase.from("communication_history").insert([{ title, message_type: "SMS", audience, status: "Delivered" }]);
    setLoading(false);
    if(!error) { toast.success(`${title} Successfully!`); fetchData(); }
  };

  const requestMeeting = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const { error } = await supabase.from("meeting_requests").insert([{ requested_by: `${userName} (${role})`, teacher_id: parseInt(meetingData.teacher_id), topic: meetingData.topic, meeting_date: meetingData.meeting_date }]);
    setLoading(false);
    if(!error) { toast.success("Meeting request sent!"); setMeetingData({ teacher_id: "", topic: "", meeting_date: "" }); fetchData(); } else toast.error(error.message);
  };

  const updateMeetingStatus = async (id: number, status: string) => {
    const { error } = await supabase.from("meeting_requests").update({ status }).eq("id", id);
    if(!error) { toast.success(`Meeting ${status}!`); fetchData(); }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div><h2 className="text-3xl font-bold text-slate-800">Notice & Communication</h2></div>
        <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          <button onClick={() => setActiveTab("BOARD")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "BOARD" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><BellRing className="w-4 h-4" /> Notice Board</button>
          {(role === "School Admin" || role === "Super Admin") && <button onClick={() => setActiveTab("COMMUNICATION")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "COMMUNICATION" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><MessageSquare className="w-4 h-4" /> SMS & Reminders</button>}
          <button onClick={() => setActiveTab("MEETINGS")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "MEETINGS" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}><Users className="w-4 h-4" /> Meetings</button>
        </div>
      </div>

      {activeTab === "BOARD" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(role === "School Admin" || role === "Super Admin") && (
            <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit border-t-4 border-t-blue-500">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Publish Notice</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleCreateNotice} className="space-y-4">
                  <div className="space-y-2"><Label>Title</Label><Input required value={noticeData.title} onChange={e => setNoticeData({...noticeData, title: e.target.value})} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label>Category</Label>
                      <Select value={noticeData.notice_type || undefined} onValueChange={(val: string | null) => setNoticeData({...noticeData, notice_type: val || ""})}>
                        <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="General">General</SelectItem><SelectItem value="Exam">Exam Notice</SelectItem><SelectItem value="Holiday">Holiday</SelectItem><SelectItem value="Emergency">Emergency</SelectItem></SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2"><Label>Target Class</Label>
                      <Select value={noticeData.target_class || undefined} onValueChange={(val: string | null) => setNoticeData({...noticeData, target_class: val || ""})}>
                        <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="All">School-wide</SelectItem>{classes.map(c => <SelectItem key={c.id} value={c.class_name}>{c.class_name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2"><Label>Description</Label><textarea required value={noticeData.description} onChange={e => setNoticeData({...noticeData, description: e.target.value})} className="w-full h-24 p-3 border border-slate-200 rounded-lg text-sm resize-none" /></div>
                  <div className="flex items-center gap-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                    <input type="checkbox" id="sms" checked={noticeData.send_sms} onChange={e => setNoticeData({...noticeData, send_sms: e.target.checked})} className="w-4 h-4 accent-emerald-600" /><Label htmlFor="sms" className="text-emerald-800 cursor-pointer">Send SMS</Label>
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Publish Notice</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <div className={`space-y-4 ${role === "School Admin" || role === "Super Admin" ? "lg:col-span-2" : "lg:col-span-3"}`}>
            {notices.map((n) => (
              <Card key={n.id} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${n.notice_type === 'Emergency' ? 'bg-red-500' : n.notice_type === 'Exam' ? 'bg-purple-500' : n.notice_type === 'Holiday' ? 'bg-emerald-500' : 'bg-blue-500'}`}>{n.notice_type === 'Emergency' ? <AlertTriangle className="w-5 h-5"/> : <BellRing className="w-5 h-5"/>}</div>
                      <div><h3 className="font-bold text-lg text-slate-800">{n.title}</h3><p className="text-xs font-semibold text-slate-500">{new Date(n.created_at).toLocaleString()} • <span className="text-blue-600">Target: {n.target_class}</span></p></div>
                    </div>
                    {(role === "School Admin" || role === "Super Admin") && <button onClick={() => deleteNotice(n.id)} className="text-xs text-red-500 hover:underline">Delete</button>}
                  </div>
                  <p className="text-slate-600 text-sm mt-4 whitespace-pre-wrap">{n.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeTab === "COMMUNICATION" && (role === "School Admin" || role === "Super Admin") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Automated Reminders</CardTitle></CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h4 className="font-bold text-sm mb-1">Fee Due Reminder</h4><Button onClick={() => sendReminder("Fee")} disabled={loading} className="w-full bg-slate-900"><Send className="w-4 h-4 mr-2"/> Send Fee SMS</Button></div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200"><h4 className="font-bold text-sm mb-1">Absence Alert</h4><Button onClick={() => sendReminder("Absence")} disabled={loading} className="w-full bg-slate-900"><Send className="w-4 h-4 mr-2"/> Send Absence SMS</Button></div>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold flex items-center gap-2"><History className="w-5 h-5 text-emerald-600"/> Delivery History</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Timestamp</TableHead><TableHead className="px-6 py-3">Communication Type</TableHead><TableHead className="px-6 py-3">Target Audience</TableHead><TableHead className="px-6 py-3 text-right">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {history.map((h) => (
                    <TableRow key={h.id}>
                      <TableCell className="px-6 py-4 text-xs font-semibold text-slate-500">{new Date(h.created_at).toLocaleString()}</TableCell>
                      <TableCell className="px-6 py-4"><p className="font-bold text-slate-800">{h.title}</p><span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">{h.message_type}</span></TableCell>
                      <TableCell className="px-6 py-4 text-sm text-slate-600">{h.audience}</TableCell>
                      <TableCell className="px-6 py-4 text-right"><span className="text-xs font-bold text-emerald-600 flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3"/> {h.status}</span></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "MEETINGS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(role === "Parent" || role === "Student") && (
            <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit border-t-4 border-t-purple-500">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Request Meeting</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={requestMeeting} className="space-y-4">
                  <div className="space-y-2"><Label>Select Teacher</Label>
                    <Select value={meetingData.teacher_id || undefined} onValueChange={(val: string | null) => setMeetingData({...meetingData, teacher_id: val || ""})}>
                      <SelectTrigger><SelectValue placeholder="-- Teacher --"/></SelectTrigger>
                      <SelectContent>{teachers.map(t => <SelectItem key={t.id} value={t.id.toString()}>{t.first_name} {t.last_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Proposed Date</Label><Input type="date" required value={meetingData.meeting_date} onChange={e => setMeetingData({...meetingData, meeting_date: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Discussion Topic</Label><Input required value={meetingData.topic} onChange={e => setMeetingData({...meetingData, topic: e.target.value})} /></div>
                  <Button type="submit" disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700">Submit Request</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className={`border-slate-100 shadow-sm ${(role === "Parent" || role === "Student") ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-purple-600"/> Meeting Requests</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Requested By</TableHead><TableHead className="px-6 py-3">Teacher</TableHead><TableHead className="px-6 py-3">Topic & Date</TableHead><TableHead className="px-6 py-3 text-center">Status</TableHead><TableHead className="px-6 py-3 text-right">Actions</TableHead></TableRow></TableHeader>
                <TableBody>
                  {meetings.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="px-6 py-4 font-bold text-slate-800">{m.requested_by}</TableCell>
                      <TableCell className="px-6 py-4 font-medium text-slate-600">{m.teachers?.first_name} {m.teachers?.last_name}</TableCell>
                      <TableCell className="px-6 py-4"><p className="font-semibold text-slate-800">{m.topic}</p><p className="text-xs text-purple-600 font-bold">{m.meeting_date}</p></TableCell>
                      <TableCell className="px-6 py-4 text-center"><span className={`px-2 py-1 rounded-full text-[10px] font-bold ${m.status === 'Approved' ? 'bg-emerald-50 text-emerald-600' : m.status === 'Rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{m.status}</span></TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {(role === "School Admin" || role === "Super Admin" || role === "Teacher") && m.status === "Pending" ? (
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => updateMeetingStatus(m.id, "Approved")} className="text-emerald-600 border-emerald-200 h-8"><CheckCircle2 className="w-3 h-3 mr-1"/> Approve</Button>
                            <Button size="sm" variant="outline" onClick={() => updateMeetingStatus(m.id, "Rejected")} className="text-red-600 border-red-200 h-8"><XCircle className="w-3 h-3 mr-1"/> Reject</Button>
                          </div>
                        ) : <span className="text-xs text-slate-400">N/A</span>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
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
import { Loader2, BellRing, Send, Calendar } from "lucide-react";

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    target_audience: "All",
  });

  useEffect(() => {
    const role = localStorage.getItem("userRole") || "";
    setUserRole(role);
    fetchNotices(role);
  }, []);

  const fetchNotices = async (role: string) => {
    let query = supabase.from("notices").select("*").order("created_at", { ascending: false });
    
    // যার যার রোল অনুযায়ী নোটিশ ফিল্টার করে দেখানো হবে
    if (role === "Teacher") {
      query = query.in("target_audience", ["All", "Teachers"]);
    } else if (role === "Student") {
      query = query.in("target_audience", ["All", "Students"]);
    } else if (role === "Parent") {
      query = query.in("target_audience", ["All", "Parents"]);
    }

    const { data, error } = await query;
    if (!error && data) setNotices(data);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("notices").insert([formData]);

    setLoading(false);
    if (error) {
      toast.error(error.message || "Failed to publish notice");
    } else {
      toast.success("Notice published successfully!");
      setFormData({ title: "", content: "", target_audience: "All" });
      fetchNotices(userRole);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Notice & Communication</h2>
        <p className="text-slate-500 mt-1">Official announcements and school updates.</p>
      </div>

      {/* শুধুমাত্র অ্যাডমিন বা প্রিন্সিপাল নোটিশ পাবলিশ করতে পারবে */}
      {(userRole === "School Admin" || userRole === "Super Admin" || userRole === "Principal") && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Send className="w-5 h-5 text-blue-600" /> Publish New Notice
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Notice Title</Label>
                  <Input 
                    value={formData.title} 
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                    required 
                    placeholder="e.g. Summer Vacation Start Date" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Audience</Label>
                  <Select value={formData.target_audience} onValueChange={(val) => setFormData({ ...formData, target_audience: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="All">All (Everyone)</SelectItem>
                      <SelectItem value="Teachers">Teachers Only</SelectItem>
                      <SelectItem value="Students">Students Only</SelectItem>
                      <SelectItem value="Parents">Parents Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notice Details</Label>
                <Textarea 
                  value={formData.content} 
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })} 
                  required 
                  placeholder="Type the full notice message here..." 
                  className="min-h-[120px]"
                />
              </div>
              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 px-8">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />} Publish Notice
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* নোটিশ বোর্ড - সবাই দেখতে পারবে */}
      <div className="grid grid-cols-1 gap-6">
        {notices.map((notice) => (
          <Card key={notice.id} className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-2">
                  <BellRing className="w-5 h-5 text-blue-600" />
                  <h3 className="text-xl font-bold text-slate-800">{notice.title}</h3>
                </div>
                <div className="flex flex-col items-end">
                  <span className="flex items-center text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    <Calendar className="w-3 h-3 mr-1" /> {new Date(notice.publish_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  {(userRole === "School Admin" || userRole === "Super Admin") && (
                    <span className="text-[10px] uppercase font-bold text-blue-500 mt-1">To: {notice.target_audience}</span>
                  )}
                </div>
              </div>
              <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{notice.content}</p>
            </CardContent>
          </Card>
        ))}
        
        {notices.length === 0 && (
          <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <BellRing className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">No notices published yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
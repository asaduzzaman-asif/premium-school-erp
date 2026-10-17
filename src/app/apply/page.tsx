"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ApplyPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const [formData, setFormData] = useState({ first_name: "", last_name: "", class_id: "", parent_name: "", parent_phone: "", document_url: "" });

  useEffect(() => { fetchClasses(); }, []);
  const fetchClasses = async () => { const { data } = await supabase.from("classes").select("*"); if (data) setClasses(data); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true);
    const selectedClass = classes.find(c => c.id.toString() === formData.class_id);
    const { error } = await supabase.from("admissions").insert([{ first_name: formData.first_name, last_name: formData.last_name, class_name: selectedClass ? selectedClass.class_name : "General", parent_name: formData.parent_name, parent_phone: formData.parent_phone, document_url: formData.document_url, status: "Pending", application_fee_status: "Unpaid" }]);
    setLoading(false);
    if (error) { toast.error(error.message); } else { toast.success("Application submitted! Redirecting..."); setTimeout(() => router.push("/login"), 2000); }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-xl">
        <div className="mb-4"><Link href="/login" className="text-sm font-semibold text-blue-600 hover:underline flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to Login</Link></div>
        <Card className="border-slate-100 shadow-xl">
          <CardHeader className="border-b border-slate-100 bg-slate-900 text-white rounded-t-xl text-center py-6"><GraduationCap className="w-12 h-12 mx-auto text-blue-400 mb-2" /><CardTitle className="text-2xl font-bold">Online Admission Application</CardTitle></CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>First Name</Label><Input required value={formData.first_name} onChange={e => setFormData({...formData, first_name: e.target.value})} /></div>
                <div className="space-y-2"><Label>Last Name</Label><Input required value={formData.last_name} onChange={e => setFormData({...formData, last_name: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Applying for Class</Label>
                <Select value={formData.class_id || ""} onValueChange={(val: any) => setFormData({...formData, class_id: val || ""})}>
                  <SelectTrigger><SelectValue placeholder="-- Select Class --" /></SelectTrigger>
                  <SelectContent>{classes.map(c => (<SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Guardian Name</Label><Input required value={formData.parent_name} onChange={e => setFormData({...formData, parent_name: e.target.value})} /></div>
                <div className="space-y-2"><Label>Guardian Phone</Label><Input required value={formData.parent_phone} onChange={e => setFormData({...formData, parent_phone: e.target.value})} /></div>
              </div>
              <div className="space-y-2"><Label>Document Link</Label><Input value={formData.document_url} onChange={e => setFormData({...formData, document_url: e.target.value})} /></div>
              <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 h-11 mt-4">{loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Submit Application"}</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, GraduationCap, Send, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function OnlineAdmissionPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    dob: "",
    gender: "",
    parent_name: "",
    parent_phone: "",
    class_id: "",
  });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*").order("id", { ascending: true });
    if (data) setClasses(data);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.from("admission_applications").insert([
      {
        first_name: formData.first_name,
        last_name: formData.last_name,
        dob: formData.dob,
        gender: formData.gender,
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone,
        class_id: parseInt(formData.class_id),
      },
    ]);

    setLoading(false);

    if (error) {
      toast.error(error.message || "Failed to submit application.");
    } else {
      toast.success("Application submitted successfully!");
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
        <Card className="max-w-md w-full text-center p-8 border-emerald-100 shadow-xl shadow-emerald-900/5">
          <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Send className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 mb-2">Application Received!</h2>
          <p className="text-slate-500 mb-8">
            Thank you for applying. The school administration will review your application and contact you soon.
          </p>
          <Link href="/login">
            <Button className="bg-blue-600 hover:bg-blue-700 w-full">Go to Login Page</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        
        <div className="text-center mb-10">
          <GraduationCap className="w-16 h-16 text-blue-300 mx-auto mb-4" />
          <h1 className="text-4xl font-extrabold text-white tracking-tight">Online Admission Portal</h1>
          <p className="text-blue-200 mt-2 text-lg">Apply for admission to the upcoming academic session.</p>
        </div>

        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-white border-b border-slate-100 rounded-t-xl px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-2xl font-bold text-slate-800">Student Application Form</CardTitle>
                <CardDescription className="text-slate-500 mt-1">Please fill out all the required information accurately.</CardDescription>
              </div>
              <Link href="/login" className="hidden sm:flex items-center text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back to Login
              </Link>
            </div>
          </CardHeader>

          <CardContent className="p-8 bg-slate-50 rounded-b-xl">
            <form onSubmit={handleSubmit} className="space-y-8">
              
              {/* Student Details Section */}
              <div>
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Student Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-slate-700">First Name <span className="text-red-500">*</span></Label>
                    <Input name="first_name" value={formData.first_name} onChange={handleInputChange} required placeholder="e.g. Asaduzzaman" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Last Name <span className="text-red-500">*</span></Label>
                    <Input name="last_name" value={formData.last_name} onChange={handleInputChange} required placeholder="e.g. Asif" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Date of Birth <span className="text-red-500">*</span></Label>
                    <Input type="date" name="dob" value={formData.dob} onChange={handleInputChange} required className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Gender <span className="text-red-500">*</span></Label>
                    <Select value={formData.class_id || ""} onValueChange={(val) => setFormData({...formData, class_id: val || ""})}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male">Male</SelectItem>
                        <SelectItem value="Female">Female</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Admission & Guardian Section */}
              <div>
                <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2">Admission & Guardian Info</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-700">Applying for Class <span className="text-red-500">*</span></Label>
                    <Select value={formData.class_id} onValueChange={(val) => setFormData({ ...formData, class_id: val })} required>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="-- Select a Class --" /></SelectTrigger>
                      <SelectContent>
                        {classes.map(cls => <SelectItem key={cls.id} value={cls.id.toString()}>{cls.class_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Guardian / Parent Name <span className="text-red-500">*</span></Label>
                    <Input name="parent_name" value={formData.parent_name} onChange={handleInputChange} required placeholder="Guardian's full name" className="bg-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-slate-700">Parent Phone Number <span className="text-red-500">*</span></Label>
                    <Input name="parent_phone" value={formData.parent_phone} onChange={handleInputChange} required placeholder="e.g. 017XXXXXXXX" className="bg-white" />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4 items-center justify-between border-t border-slate-200 mt-8">
                <p className="text-xs text-slate-500">By submitting, you agree to the school's admission policies.</p>
                <Button type="submit" disabled={loading} className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-blue-600/30">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Send className="w-5 h-5 mr-2" />} 
                  Submit Application
                </Button>
              </div>

            </form>
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "react-hot-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Shield, Loader2 } from "lucide-react";

export default function SettingsPage() {
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  
  // General Settings State
  const [schoolData, setSchoolData] = useState({
    institution_name: "",
    academic_year: "",
    contact_email: ""
  });
  const [loadingSchool, setLoadingSchool] = useState(false);

  // Password Settings State
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: ""
  });
  const [loadingPassword, setLoadingPassword] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
    setUserName(localStorage.getItem("userName") || "");
    fetchSchoolSettings();
  }, []);

  const fetchSchoolSettings = async () => {
    const { data } = await supabase.from("school_settings").select("*").eq("id", 1).single();
    if (data) {
      setSchoolData({
        institution_name: data.institution_name,
        academic_year: data.academic_year,
        contact_email: data.contact_email
      });
    }
  };

  // ১. স্কুলের তথ্য আপডেট করা
  const handleSchoolSettingsUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingSchool(true);

    const { error } = await supabase
      .from("school_settings")
      .update({
        institution_name: schoolData.institution_name,
        academic_year: schoolData.academic_year,
        contact_email: schoolData.contact_email,
        updated_at: new Date().toISOString()
      })
      .eq("id", 1);

    setLoadingSchool(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Institution settings updated successfully!");
    }
  };

  // ২. পাসওয়ার্ড আপডেট করা
  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword.length < 4) {
      toast.error("New password must be at least 4 characters long.");
      return;
    }

    setLoadingPassword(true);

    // বর্তমান পাসওয়ার্ড সঠিক কিনা চেক করা
    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("username", userName)
      .eq("password_hash", passwordData.currentPassword)
      .single();

    if (!user) {
      toast.error("Incorrect current password!");
      setLoadingPassword(false);
      return;
    }

    // পাসওয়ার্ড আপডেট করা
    const { error } = await supabase
      .from("users")
      .update({ password_hash: passwordData.newPassword })
      .eq("id", user.id);

    setLoadingPassword(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Password updated successfully!");
      setPasswordData({ currentPassword: "", newPassword: "" });
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">System Settings</h2>
        <p className="text-slate-500 mt-1">Configure institutional details, preferences, and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* General Institution Settings Form */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" /> General Institution Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleSchoolSettingsUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Institution Name</Label>
                <Input 
                  value={schoolData.institution_name} 
                  onChange={(e) => setSchoolData({...schoolData, institution_name: e.target.value})} 
                  disabled={role !== "School Admin" && role !== "Super Admin"}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input 
                  value={schoolData.academic_year} 
                  onChange={(e) => setSchoolData({...schoolData, academic_year: e.target.value})} 
                  disabled={role !== "School Admin" && role !== "Super Admin"}
                  required 
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input 
                  value={schoolData.contact_email} 
                  onChange={(e) => setSchoolData({...schoolData, contact_email: e.target.value})} 
                  disabled={role !== "School Admin" && role !== "Super Admin"}
                  required 
                />
              </div>
              
              {(role === "School Admin" || role === "Super Admin") && (
                <Button type="submit" disabled={loadingSchool} className="bg-blue-600 hover:bg-blue-700 w-full mt-2">
                  {loadingSchool ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Changes"}
                </Button>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Security & Password Form */}
        <Card className="border-slate-100 shadow-sm h-fit">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" /> Security & Password
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div className="space-y-2">
                <Label>Current Password</Label>
                <Input 
                  type="password" 
                  value={passwordData.currentPassword} 
                  onChange={(e) => setPasswordData({...passwordData, currentPassword: e.target.value})} 
                  required 
                  placeholder="••••••••" 
                />
              </div>
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password" 
                  value={passwordData.newPassword} 
                  onChange={(e) => setPasswordData({...passwordData, newPassword: e.target.value})} 
                  required 
                  placeholder="••••••••" 
                />
              </div>
              <Button type="submit" disabled={loadingPassword} className="bg-purple-600 hover:bg-purple-700 w-full mt-2">
                {loadingPassword ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Update Password"}
              </Button>
            </form>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Phone, MapPin, Mail, BookOpen, Clock, ShieldCheck, GraduationCap, Camera } from "lucide-react";

export default function MyProfilePage() {
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentRole = localStorage.getItem("userRole") || "";
    const currentUserName = localStorage.getItem("userName") || "";
    setRole(currentRole);
    setUserName(currentUserName);
    
    if (currentUserName) {
      fetchProfileData(currentRole, currentUserName);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchProfileData = async (currentRole: string, currentUserName: string) => {
    try {
      // 1. Fetch User Data
      const { data: userData } = await supabase
        .from("users")
        .select("id, created_at")
        .eq("username", currentUserName)
        .single();

      let specificData = null;

      // 2. Fetch specific profile data based on role
      if (currentRole === "Student") {
        const { data } = await supabase
          .from("students")
          .select("*, classes(class_name), sections(section_name)")
          .eq("user_id", userData?.id)
          .single();
        specificData = data;
      } else if (currentRole === "Teacher" || currentRole === "Accountant" || currentRole === "Staff") {
        const { data } = await supabase
          .from("teachers")
          .select("*")
          .eq("user_id", userData?.id)
          .single();
        specificData = data;
      }

      setProfileData({ ...userData, ...specificData });
    } catch (error) {
      console.error("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-[60vh]"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      
      {/* Header Profile Card */}
      <Card className="border-none shadow-lg overflow-hidden rounded-2xl">
        {/* Cover Photo */}
        <div className="h-48 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 relative">
          <div className="absolute inset-0 bg-black/10"></div>
        </div>
        
        <CardContent className="p-8 relative">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-end -mt-20">
            {/* Profile Picture */}
            <div className="relative group">
              <div className="w-32 h-32 rounded-full border-4 border-white shadow-xl bg-white overflow-hidden flex items-center justify-center">
                {profileData?.photo_url ? (
                  <img src={profileData.photo_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400">
                    <User className="w-16 h-16" />
                  </div>
                )}
              </div>
              <button className="absolute bottom-2 right-2 p-2 bg-blue-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-4 h-4" />
              </button>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-2 mb-2">
              <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
                {profileData?.first_name ? `${profileData.first_name} ${profileData.last_name}` : userName}
              </h1>
              <div className="flex flex-wrap items-center gap-3">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> {role}
                </span>
                {profileData?.admission_no && (
                  <span className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span> ID: {profileData.admission_no}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Personal Information */}
        <Card className="border-slate-100 shadow-sm md:col-span-1 h-fit">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <User className="w-5 h-5 text-blue-500" /> Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-400"><User className="w-4 h-4" /></div>
                <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Username</p><p className="font-medium text-slate-700">{userName}</p></div>
              </div>
              
              {profileData?.parent_phone || profileData?.phone ? (
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-50 rounded-lg text-emerald-500"><Phone className="w-4 h-4" /></div>
                  <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contact</p><p className="font-medium text-slate-700">{profileData.parent_phone || profileData.phone}</p></div>
                </div>
              ) : null}

              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-50 rounded-lg text-purple-500"><Clock className="w-4 h-4" /></div>
                <div><p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Joined System</p><p className="font-medium text-slate-700">{new Date(profileData?.created_at).toLocaleDateString()}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column: Academic / Professional Information */}
        <Card className="border-slate-100 shadow-sm md:col-span-2 h-fit">
          <CardHeader className="border-b border-slate-50 pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-slate-800">
              <GraduationCap className="w-5 h-5 text-indigo-500" /> {role === "Student" ? "Academic Information" : "Professional Details"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            {role === "Student" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Class</p>
                  <p className="text-lg font-bold text-slate-800">{profileData?.classes?.class_name || "N/A"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Section</p>
                  <p className="text-lg font-bold text-slate-800">{profileData?.sections?.section_name || "N/A"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Roll Number</p>
                  <p className="text-lg font-bold text-slate-800">{profileData?.roll_no || "N/A"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Shift</p>
                  <p className="text-lg font-bold text-slate-800">{profileData?.shift || "N/A"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 sm:col-span-2">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Guardian Name</p>
                  <p className="text-lg font-bold text-slate-800">{profileData?.parent_name || "N/A"}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Designation</p>
                  <p className="text-lg font-bold text-slate-800">{profileData?.designation || role}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Subject / Department</p>
                  <p className="text-lg font-bold text-slate-800">{profileData?.subject || "N/A"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Joining Date</p>
                  <p className="text-lg font-bold text-slate-800">{profileData?.joining_date ? new Date(profileData.joining_date).toLocaleDateString() : "N/A"}</p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Basic Salary</p>
                  <p className="text-lg font-bold text-slate-800">৳ {profileData?.basic_salary || "N/A"}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
      </div>
    </div>
  );
}
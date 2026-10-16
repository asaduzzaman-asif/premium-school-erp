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
import { Loader2, Plus, BookOpen, Layers } from "lucide-react";

export default function AcademicSetupPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [className, setClassName] = useState("");
  const [selectedClassId, setSelectedClassId] = useState("");
  const [sectionName, setSectionName] = useState("");
  
  const [loadingClass, setLoadingClass] = useState(false);
  const [loadingSection, setLoadingSection] = useState(false);

  useEffect(() => {
    fetchClasses();
    fetchSections();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase.from("classes").select("*").order("id", { ascending: true });
    if (data) setClasses(data);
  };

  const fetchSections = async () => {
    const { data } = await supabase
      .from("sections")
      .select("*, classes(class_name)")
      .order("class_id", { ascending: true });
    if (data) setSections(data);
  };

  // ক্লাস অ্যাড করার ফাংশন
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!className.trim()) return;
    setLoadingClass(true);

    const { error } = await supabase.from("classes").insert([{ class_name: className }]);
    
    setLoadingClass(false);
    if (error) {
      toast.error(error.message || "Failed to add class");
    } else {
      toast.success("Class added successfully!");
      setClassName("");
      fetchClasses();
    }
  };

  // সেকশন অ্যাড করার ফাংশন
  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassId || !sectionName.trim()) {
      toast.error("Please select a class and enter a section name");
      return;
    }
    setLoadingSection(true);

    const { error } = await supabase.from("sections").insert([
      {
        class_id: parseInt(selectedClassId),
        section_name: sectionName,
      },
    ]);

    setLoadingSection(false);
    if (error) {
      toast.error(error.message || "Failed to add section");
    } else {
      toast.success("Section added successfully!");
      setSectionName("");
      fetchSections();
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Academic Setup</h2>
        <p className="text-slate-500 mt-1">Manage school classes and sections efficiently.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= ক্লাস ম্যানেজমেন্ট কার্ড ================= */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" /> Manage Classes
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleAddClass} className="flex gap-3 items-end">
              <div className="flex-1 space-y-2">
                <Label htmlFor="className">Class Name</Label>
                <Input
                  id="className"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Class 6, Class 7"
                  required
                />
              </div>
              <Button type="submit" disabled={loadingClass} className="bg-blue-600 hover:bg-blue-700">
                {loadingClass ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Add Class
              </Button>
            </form>

            <div className="border border-slate-100 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead>Class Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium text-slate-500">{cls.id}</TableCell>
                      <TableCell className="font-semibold text-slate-800">{cls.class_name}</TableCell>
                    </TableRow>
                  ))}
                  {classes.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-6 text-slate-400">No classes added yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* ================= সেকশন ম্যানেজমেন্ট কার্ড ================= */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600" /> Manage Sections
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <form onSubmit={handleAddSection} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Class</Label>
                <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="-- Choose a class --" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>{cls.class_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sectionName">Section Name</Label>
                <div className="flex gap-3">
                  <Input
                    id="sectionName"
                    value={sectionName}
                    onChange={(e) => setSectionName(e.target.value)}
                    placeholder="e.g. A, B, Science"
                    required
                  />
                  <Button type="submit" disabled={loadingSection} className="bg-purple-600 hover:bg-purple-700">
                    {loadingSection ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />} Add
                  </Button>
                </div>
              </div>
            </form>

            <div className="border border-slate-100 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Class</TableHead>
                    <TableHead>Section Name</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sections.map((sec) => (
                    <TableRow key={sec.id}>
                      <TableCell className="font-medium text-slate-800">{sec.classes?.class_name}</TableCell>
                      <TableCell className="font-semibold text-purple-600">Section {sec.section_name}</TableCell>
                    </TableRow>
                  ))}
                  {sections.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center py-6 text-slate-400">No sections added yet.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
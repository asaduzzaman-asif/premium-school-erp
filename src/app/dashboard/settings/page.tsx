"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Shield, Bell } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">System Settings</h2>
        <p className="text-slate-500 mt-1">Configure institutional details, preferences, and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-600" /> General Institution Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Institution Name</Label>
              <defaultValue value="Ideal School & College" />
              <Input defaultValue="Ideal School & College" />
            </div>
            <div className="space-y-2">
              <Label>Academic Year</Label>
              <Input defaultValue="2026 - 2027" />
            </div>
            <div className="space-y-2">
              <Label>Contact Email</Label>
              <Input defaultValue="info@schoolerp.edu.bd" />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">Save Changes</Button>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" /> Security & Password
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label>Current Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div className="space-y-2">
              <Label>New Password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700">Update Password</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
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
import { Loader2, DollarSign, PlusCircle, TrendingUp, TrendingDown } from "lucide-react";

export default function FinancePage() {
  const [students, setStudents] = useState<any[]>([]);
  const [fees, setFees] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  
  const [loadingFee, setLoadingFee] = useState(false);
  const [loadingExpense, setLoadingExpense] = useState(false);

  // ফি ফর্ম স্টেট
  const [feeData, setFeeData] = useState({
    student_id: "",
    amount: "",
    month: "January",
    status: "Paid",
  });

  // খরচ ফর্ম স্টেট
  const [expenseData, setExpenseData] = useState({
    title: "",
    amount: "",
    expense_date: new Date().toISOString().split('T')[0],
  });

  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  useEffect(() => {
    fetchStudents();
    fetchFees();
    fetchExpenses();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase.from("students").select("id, first_name, last_name, admission_no, class_id, classes(class_name)");
    if (data) setStudents(data);
  };

  const fetchFees = async () => {
    const { data } = await supabase
      .from("fees")
      .select("*, students (first_name, last_name, admission_no, classes(class_name))")
      .order("created_at", { ascending: false });
    if (data) setFees(data);
  };

  const fetchExpenses = async () => {
    const { data } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });
    if (data) setExpenses(data);
  };

  // ফি কালেকশন সাবমিট
  const handleFeeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feeData.student_id) {
      toast.error("Please select a student");
      return;
    }
    setLoadingFee(true);

    const { error } = await supabase.from("fees").insert([
      {
        student_id: parseInt(feeData.student_id),
        amount: parseFloat(feeData.amount),
        month: feeData.month,
        status: feeData.status,
      },
    ]);

    setLoadingFee(false);
    if (error) {
      toast.error(error.message || "Failed to collect fee");
    } else {
      toast.success("Fee collected successfully!");
      fetchFees();
      setFeeData({ ...feeData, amount: "" });
    }
  };

  // খরচ সাবমিট
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoadingExpense(true);

    const { error } = await supabase.from("expenses").insert([
      {
        title: expenseData.title,
        amount: parseFloat(expenseData.amount),
        expense_date: expenseData.expense_date,
      },
    ]);

    setLoadingExpense(false);
    if (error) {
      toast.error(error.message || "Failed to add expense");
    } else {
      toast.success("Expense added successfully!");
      fetchExpenses();
      setExpenseData({ title: "", amount: "", expense_date: new Date().toISOString().split('T')[0] });
    }
  };

  // মোট আয় ও খরচ হিসাব করা
  const totalIncome = fees.reduce((sum, item) => sum + Number(item.amount), 0);
  const totalExpense = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const netBalance = totalIncome - totalExpense;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Finance & Fee Management</h2>
        <p className="text-slate-500 mt-1">Track student fee collections, institutional expenses, and net balance.</p>
      </div>

      {/* সামারি কার্ড */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-slate-100 shadow-sm border-l-4 border-l-emerald-500">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase">Total Income</p>
              <h3 className="text-3xl font-bold text-emerald-600 mt-1">৳ {totalIncome}</h3>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm border-l-4 border-l-red-500">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase">Total Expenses</p>
              <h3 className="text-3xl font-bold text-red-600 mt-1">৳ {totalExpense}</h3>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center text-red-600">
              <TrendingDown className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-100 shadow-sm border-l-4 border-l-blue-500">
          <CardContent className="p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase">Net Balance</p>
              <h3 className={`text-3xl font-bold mt-1 ${netBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                ৳ {netBalance}
              </h3>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <DollarSign className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* দুটি ফর্ম: ফি কালেকশন এবং খরচ অ্যাড */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ফি কালেকশন ফর্ম */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-emerald-600" /> Collect Student Fee
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleFeeSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Student</Label>
                <Select value={feeData.student_id} onValueChange={(val) => setFeeData({ ...feeData, student_id: val })}>
                  <SelectTrigger><SelectValue placeholder="-- Choose a student --" /></SelectTrigger>
                  <SelectContent>
                    {students.map((st) => (
                      <SelectItem key={st.id} value={st.id.toString()}>
                        {st.admission_no} - {st.first_name} {st.last_name} ({st.classes?.class_name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (৳)</Label>
                  <Input 
                    type="number" 
                    value={feeData.amount} 
                    onChange={(e) => setFeeData({ ...feeData, amount: e.target.value })} 
                    required 
                    placeholder="e.g. 1500" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Month</Label>
                  <Select value={feeData.month} onValueChange={(val) => setFeeData({ ...feeData, month: val })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {months.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loadingFee} className="bg-emerald-600 hover:bg-emerald-700 w-full">
                  {loadingFee ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Fee Record"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* খরচ এন্ট্রি ফর্ম */}
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <PlusCircle className="w-5 h-5 text-red-600" /> Add Institutional Expense
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Expense Title / Description</Label>
                <Input 
                  value={expenseData.title} 
                  onChange={(e) => setExpenseData({ ...expenseData, title: e.target.value })} 
                  required 
                  placeholder="e.g. Electricity Bill, Markers" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Amount (৳)</Label>
                  <Input 
                    type="number" 
                    value={expenseData.amount} 
                    onChange={(e) => setExpenseData({ ...expenseData, amount: e.target.value })} 
                    required 
                    placeholder="Amount" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input 
                    type="date" 
                    value={expenseData.expense_date} 
                    onChange={(e) => setExpenseData({ ...expenseData, expense_date: e.target.value })} 
                    required 
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={loadingExpense} className="bg-red-600 hover:bg-red-700 w-full">
                  {loadingExpense ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Save Expense"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

      </div>

      {/* ফি কালেকশন টেবিল */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-800">Recent Fee Collections</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6 py-3">Date</TableHead>
                <TableHead className="px-6 py-3">Student Info</TableHead>
                <TableHead className="px-6 py-3">Month</TableHead>
                <TableHead className="px-6 py-3">Amount</TableHead>
                <TableHead className="px-6 py-3">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {fees.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell className="px-6 py-4 text-slate-500">
                    {new Date(fee.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="font-semibold text-slate-800">{fee.students?.first_name} {fee.students?.last_name}</p>
                    <p className="text-xs text-slate-500">ID: {fee.students?.admission_no} | Class: {fee.students?.classes?.class_name}</p>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-slate-700">{fee.month}</TableCell>
                  <TableCell className="px-6 py-4 font-bold text-emerald-600">৳ {fee.amount}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold">
                      {fee.status}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {fees.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-400">No fee records found.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
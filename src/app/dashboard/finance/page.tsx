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
import { Loader2, DollarSign, FileText, Receipt, Printer, CreditCard, Building, ShieldCheck, Download } from "lucide-react";

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState<"STRUCTURE" | "INVOICES" | "RECEIPTS">("INVOICES");
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");
  const [userName, setUserName] = useState("");

  // Data
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [structures, setStructures] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);

  // Forms
  const [structData, setStructData] = useState({ class_id: "", fee_type: "Tuition Fee", amount: "" });
  const [invoiceData, setInvoiceData] = useState({ class_id: "", student_id: "", fee_type: "Tuition Fee", month: "January", due_date: "", amount: "" });
  
  // Payment Modal
  const [payModal, setPayModal] = useState<any>(null);
  const [payInput, setPayInput] = useState({ amount: "", method: "bKash", trx_id: "", discount: "0", fine: "0" });
  
  // Print Receipt
  const [printData, setPrintData] = useState<any>(null);

  useEffect(() => {
    const r = localStorage.getItem("userRole") || "";
    const u = localStorage.getItem("userName") || "";
    setRole(r); setUserName(u);
    fetchInitialData(r, u);
  }, []);

  const fetchInitialData = async (userRole: string, uName: string) => {
    const { data: clsData } = await supabase.from("classes").select("*");
    if (clsData) setClasses(clsData);

    const { data: strData } = await supabase.from("fee_structures").select("*, classes(class_name)");
    if (strData) setStructures(strData);

    let invQuery = supabase.from("fees").select("*, students(first_name, last_name, admission_no, classes(class_name))").order("created_at", { ascending: false });
    
    if (userRole === "Student" || userRole === "Parent") {
      const { data: uData } = await supabase.from("users").select("id").eq("username", uName).single();
      if (uData) {
        const { data: sData } = await supabase.from("students").select("id").eq("user_id", uData.id).single();
        if (sData) invQuery = invQuery.eq("student_id", sData.id);
      }
    }
    
    const { data: invData } = await invQuery;
    if (invData) setInvoices(invData);
  };

  const handleClassChange = async (classId: string) => {
    setInvoiceData({ ...invoiceData, class_id: classId, amount: "" });
    const { data } = await supabase.from("students").select("*").eq("class_id", parseInt(classId));
    if (data) setStudents(data);
  };

  const handleTypeChange = (type: string) => {
    const match = structures.find(s => s.class_id.toString() === invoiceData.class_id && s.fee_type === type);
    setInvoiceData({ ...invoiceData, fee_type: type, amount: match ? match.amount.toString() : "" });
  };

  // ================ 1. ADD FEE STRUCTURE ================
  const handleAddStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("fee_structures").insert([{ class_id: parseInt(structData.class_id), fee_type: structData.fee_type, amount: Number(structData.amount) }]);
    setLoading(false);
    if (!error) { toast.success("Fee Structure Added!"); fetchInitialData(role, userName); }
    else toast.error(error.message);
  };

  // ================ 2. GENERATE INVOICE ================
  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const invId = `INV-${new Date().getTime().toString().slice(-6)}`;
    
    // Fix: Send null if due_date is empty, otherwise database crashes
    const validDueDate = invoiceData.due_date ? invoiceData.due_date : null;

    const { error } = await supabase.from("fees").insert([{
      invoice_id: invId, 
      student_id: parseInt(invoiceData.student_id), 
      fee_type: invoiceData.fee_type,
      month: invoiceData.month, 
      due_date: validDueDate, 
      amount: Number(invoiceData.amount),
      status: "Unpaid"
    }]);

    setLoading(false);
    if (!error) { 
      toast.success("Invoice Generated successfully!"); 
      fetchInitialData(role, userName);
      setInvoiceData({ ...invoiceData, student_id: "", amount: "", due_date: "" });
    }
    else toast.error(error.message);
  };

  // ================ 3. PROCESS PAYMENT (GATEWAY MOCK) ================
  const openPaymentModal = (inv: any) => {
    const due = Number(inv.amount) + Number(inv.fine) - Number(inv.discount) - Number(inv.paid_amount);
    setPayModal(inv);
    setPayInput({ amount: due.toString(), method: "bKash", trx_id: "", discount: "0", fine: "0" });
  };

  const submitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const prevPaid = Number(payModal.paid_amount);
    const currentPay = Number(payInput.amount);
    const discount = Number(payModal.discount) + Number(payInput.discount);
    const fine = Number(payModal.fine) + Number(payInput.fine);
    
    const totalPaid = prevPaid + currentPay;
    const finalTotal = Number(payModal.amount) + fine - discount;
    let newStatus = "Unpaid";
    if (totalPaid >= finalTotal) newStatus = "Paid";
    else if (totalPaid > 0) newStatus = "Partial";

    const { error } = await supabase.from("fees").update({
      paid_amount: totalPaid, discount, fine, payment_method: payInput.method,
      transaction_id: payInput.trx_id, status: newStatus
    }).eq("id", payModal.id);

    setLoading(false);
    if (!error) {
      toast.success(`Payment of ৳${currentPay} via ${payInput.method} successful!`);
      setPayModal(null);
      fetchInitialData(role, userName);
    } else toast.error(error.message);
  };

  // ================ 4. REFUND & DELETE ================
  const processRefund = async (id: number) => {
    if(!window.confirm("Are you sure you want to refund this amount? Status will change to Refunded.")) return;
    const { error } = await supabase.from("fees").update({ status: "Refunded", paid_amount: 0 }).eq("id", id);
    if(!error) { toast.success("Refund Processed!"); fetchInitialData(role, userName); }
  };

  if (printData) {
    return (
      <div className="w-full max-w-3xl mx-auto bg-white p-10 border border-slate-300 shadow-xl print:shadow-none print:border-none">
        <div className="flex justify-between items-center border-b-2 border-slate-800 pb-4 mb-6 print:hidden">
          <Button variant="outline" onClick={() => setPrintData(null)}>Back</Button>
          <Button onClick={() => window.print()} className="bg-slate-900"><Printer className="w-4 h-4 mr-2"/> Print Receipt</Button>
        </div>
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold uppercase tracking-wider text-slate-900">Premium School ERP</h1>
          <p className="text-sm font-bold text-slate-600 mt-1">OFFICIAL MONEY RECEIPT</p>
        </div>
        <div className="flex justify-between items-start mb-6 text-sm">
          <div>
            <p><span className="font-bold w-24 inline-block">Invoice No:</span> {printData.invoice_id}</p>
            <p><span className="font-bold w-24 inline-block">Student:</span> {printData.students?.first_name} {printData.students?.last_name}</p>
            <p><span className="font-bold w-24 inline-block">Class:</span> {printData.students?.classes?.class_name}</p>
          </div>
          <div className="text-right">
            <p><span className="font-bold">Date:</span> {new Date().toLocaleDateString()}</p>
            <p><span className="font-bold">Method:</span> {printData.payment_method}</p>
            <p><span className="font-bold">TrxID:</span> {printData.transaction_id || 'N/A'}</p>
          </div>
        </div>
        <table className="w-full border-collapse border border-slate-300 text-sm mb-8">
          <thead><tr className="bg-slate-100"><th className="border border-slate-300 p-2 text-left">Description</th><th className="border border-slate-300 p-2 text-right">Amount (৳)</th></tr></thead>
          <tbody>
            <tr><td className="border border-slate-300 p-2">{printData.fee_type} ({printData.month})</td><td className="border border-slate-300 p-2 text-right">{printData.amount}</td></tr>
            {Number(printData.fine) > 0 && <tr><td className="border border-slate-300 p-2 text-red-600">Late Fine</td><td className="border border-slate-300 p-2 text-right text-red-600">{printData.fine}</td></tr>}
            {Number(printData.discount) > 0 && <tr><td className="border border-slate-300 p-2 text-emerald-600">Discount/Waiver</td><td className="border border-slate-300 p-2 text-right text-emerald-600">-{printData.discount}</td></tr>}
            <tr className="bg-slate-50 font-bold"><td className="border border-slate-300 p-2 text-right">Total Payable</td><td className="border border-slate-300 p-2 text-right">{Number(printData.amount) + Number(printData.fine) - Number(printData.discount)}</td></tr>
            <tr className="font-black text-emerald-700"><td className="border border-slate-300 p-2 text-right">Amount Paid</td><td className="border border-slate-300 p-2 text-right">{printData.paid_amount}</td></tr>
          </tbody>
        </table>
        <div className="flex justify-between items-end mt-20">
          <div className="border-t border-slate-800 pt-1 text-xs font-bold w-40 text-center">Student/Guardian</div>
          <div className="border-t border-slate-800 pt-1 text-xs font-bold w-40 text-center">Authorized Signature</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 print:hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Fee & Payment Management</h2>
          <p className="text-slate-500 mt-1">Manage billing, structures, waivers, and track gateway collections.</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          {(role === "School Admin" || role === "Accountant") && (
            <button onClick={() => setActiveTab("STRUCTURE")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "STRUCTURE" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              <Building className="w-4 h-4" /> Fee Structure
            </button>
          )}
          <button onClick={() => setActiveTab("INVOICES")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "INVOICES" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <FileText className="w-4 h-4" /> Invoices & Payments
          </button>
          <button onClick={() => setActiveTab("RECEIPTS")} className={`whitespace-nowrap px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "RECEIPTS" ? "bg-white text-purple-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Receipt className="w-4 h-4" /> Collection & Receipts
          </button>
        </div>
      </div>

      {/* ================= PAYMENT MODAL (MOCK GATEWAY) ================= */}
      {payModal && (
        <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-md shadow-2xl border-0 overflow-hidden relative">
            <div className="bg-slate-900 text-white p-4 text-center">
              <ShieldCheck className="w-10 h-10 mx-auto text-emerald-400 mb-2" />
              <h2 className="text-lg font-bold">Secure Payment Gateway</h2>
              <p className="text-xs text-slate-400">Invoice: {payModal.invoice_id} | Total Due: ৳{Number(payModal.amount) + Number(payModal.fine) - Number(payModal.discount) - Number(payModal.paid_amount)}</p>
            </div>
            <CardContent className="p-6">
              <form onSubmit={submitPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Payment Method</Label>
                  <Select value={payInput.method || ""} onValueChange={(val) => setPayInput({...payInput, method: val || ""})}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent><SelectItem value="bKash">bKash Mobile Banking</SelectItem><SelectItem value="Nagad">Nagad</SelectItem><SelectItem value="Bank Transfer">Bank Transfer</SelectItem><SelectItem value="Cash">Cash (Counter)</SelectItem></SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2"><Label>Pay Amount (৳)</Label><Input type="number" required value={payInput.amount} onChange={e => setPayInput({...payInput, amount: e.target.value})} /></div>
                  <div className="space-y-2"><Label>Transaction ID</Label><Input required value={payInput.trx_id} onChange={e => setPayInput({...payInput, trx_id: e.target.value})} placeholder="e.g. 9BEX..." /></div>
                </div>

                {(role === "School Admin" || role === "Accountant") && (
                  <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-2">
                    <div className="space-y-2"><Label className="text-xs text-emerald-600">Add Discount (-)</Label><Input type="number" value={payInput.discount} onChange={e => setPayInput({...payInput, discount: e.target.value})} /></div>
                    <div className="space-y-2"><Label className="text-xs text-red-600">Add Fine (+)</Label><Input type="number" value={payInput.fine} onChange={e => setPayInput({...payInput, fine: e.target.value})} /></div>
                  </div>
                )}
                
                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="ghost" onClick={() => setPayModal(null)}>Cancel</Button>
                  <Button type="submit" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700">Confirm Payment</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= TAB 1: STRUCTURE ================= */}
      {activeTab === "STRUCTURE" && (role === "School Admin" || role === "Accountant") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Class-wise Structure</CardTitle></CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddStructure} className="space-y-4">
                <div className="space-y-2"><Label>Select Class</Label>
                  <Select value={structData.class_id || ""} onValueChange={(val) => setStructData({...structData, class_id: val || ""})}>
                    <SelectTrigger><SelectValue placeholder="Class"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Fee Type</Label>
                  <Select value={structData.fee_type || ""} onValueChange={(val) => setStructData({...structData, fee_type: val || ""})}>
                    <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Admission Fee">Admission Fee</SelectItem><SelectItem value="Tuition Fee">Monthly Tuition Fee</SelectItem><SelectItem value="Exam Fee">Exam Fee</SelectItem><SelectItem value="Other Fees">Other Fees</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2"><Label>Fixed Amount (৳)</Label><Input type="number" required value={structData.amount} onChange={e => setStructData({...structData, amount: e.target.value})} /></div>
                <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Save Structure</Button>
              </form>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm lg:col-span-2">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Current Fee Structures</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50"><TableRow><TableHead className="px-6 py-3">Class</TableHead><TableHead className="px-6 py-3">Fee Type</TableHead><TableHead className="px-6 py-3 text-right">Amount (৳)</TableHead></TableRow></TableHeader>
                <TableBody>
                  {structures.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="px-6 py-4 font-bold text-slate-800">{s.classes?.class_name}</TableCell>
                      <TableCell className="px-6 py-4 text-slate-600">{s.fee_type}</TableCell>
                      <TableCell className="px-6 py-4 text-right font-black text-indigo-600">৳ {s.amount}</TableCell>
                    </TableRow>
                  ))}
                  {structures.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-8 text-slate-400">No structures added.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= TAB 2: INVOICES & PAYMENTS ================= */}
      {activeTab === "INVOICES" && (
        <div className="space-y-6">
          {(role === "School Admin" || role === "Accountant") && (
            <Card className="border-slate-100 shadow-sm border-t-4 border-t-emerald-500">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Generate New Invoice</CardTitle></CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleGenerateInvoice} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-end">
                  <div className="space-y-2"><Label>Class</Label>
                    <Select value={invoiceData.class_id || ""} onValueChange={(val) => handleClassChange(val || "")}>
                      <SelectTrigger><SelectValue placeholder="Class"/></SelectTrigger><SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id.toString()}>{c.class_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Student</Label>
                    <Select value={invoiceData.student_id || ""} onValueChange={(val) => setInvoiceData({...invoiceData, student_id: val || ""})}>
                      <SelectTrigger><SelectValue placeholder="Student"/></SelectTrigger><SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.first_name} {s.last_name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Fee Type</Label>
                    <Select value={invoiceData.fee_type || ""} onValueChange={(val) => handleTypeChange(val || "")}>
                      <SelectTrigger><SelectValue/></SelectTrigger><SelectContent><SelectItem value="Admission Fee">Admission Fee</SelectItem><SelectItem value="Tuition Fee">Tuition Fee</SelectItem><SelectItem value="Exam Fee">Exam Fee</SelectItem><SelectItem value="Other Fees">Other Fees</SelectItem></SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2"><Label>Month</Label><Input value={invoiceData.month} onChange={e => setInvoiceData({...invoiceData, month: e.target.value})} placeholder="e.g. January"/></div>
                  
                  {/* নতুন Due Date ফিল্ড */}
                  <div className="space-y-2"><Label>Due Date</Label><Input type="date" value={invoiceData.due_date} onChange={e => setInvoiceData({...invoiceData, due_date: e.target.value})} /></div>
                  
                  <div className="space-y-2"><Label>Amount (৳)</Label><Input type="number" required value={invoiceData.amount} onChange={e => setInvoiceData({...invoiceData, amount: e.target.value})} /></div>
                  <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">Generate</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Invoices & Due Tracking</CardTitle></CardHeader>
            <CardContent className="p-0 overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow><TableHead className="px-4 py-3">Invoice & Date</TableHead><TableHead className="px-4 py-3">Student Info</TableHead><TableHead className="px-4 py-3">Description</TableHead><TableHead className="px-4 py-3 text-center">Amount Info</TableHead><TableHead className="px-4 py-3 text-center">Status</TableHead><TableHead className="px-4 py-3 text-right">Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const base = Number(inv.amount);
                    const fine = Number(inv.fine);
                    const disc = Number(inv.discount);
                    const paid = Number(inv.paid_amount);
                    const due = base + fine - disc - paid;
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="px-4 py-3"><p className="font-bold text-slate-800 text-xs">{inv.invoice_id}</p><p className="text-[10px] text-slate-500">{new Date(inv.created_at).toLocaleDateString()}</p></TableCell>
                        <TableCell className="px-4 py-3"><p className="font-semibold text-slate-800">{inv.students?.first_name} {inv.students?.last_name}</p><p className="text-[10px] text-slate-500">{inv.students?.classes?.class_name}</p></TableCell>
                        <TableCell className="px-4 py-3">
                          <span className="bg-slate-100 px-2 py-1 rounded text-xs font-semibold">{inv.fee_type}</span>
                          <p className="text-xs mt-1 text-slate-600">{inv.month}</p>
                          {inv.due_date && <p className="text-[10px] text-red-500 font-bold mt-0.5">Due: {inv.due_date}</p>}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center text-xs">
                          <p>Total: ৳{base+fine-disc}</p>
                          <p className="text-red-500 font-bold">Due: ৳{due}</p>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${inv.status === 'Paid' ? 'bg-emerald-50 text-emerald-600' : inv.status === 'Partial' ? 'bg-blue-50 text-blue-600' : inv.status === 'Refunded' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600'}`}>{inv.status}</span>
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          {(inv.status === 'Unpaid' || inv.status === 'Partial') && (
                            <Button size="sm" onClick={() => openPaymentModal(inv)} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs"><CreditCard className="w-3 h-3 mr-1"/> Pay Now</Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ================= TAB 3: RECEIPTS & REPORTS ================= */}
      {activeTab === "RECEIPTS" && (
        <Card className="border-slate-100 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50"><CardTitle className="text-lg font-bold">Collection & Receipts Report</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow><TableHead className="px-4 py-3">Invoice No</TableHead><TableHead className="px-4 py-3">Student Info</TableHead><TableHead className="px-4 py-3">Method & TrxID</TableHead><TableHead className="px-4 py-3 text-right">Paid Amount</TableHead><TableHead className="px-4 py-3 text-right">Receipt & Action</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {invoices.filter(i => i.status === 'Paid' || i.status === 'Partial' || i.status === 'Refunded').map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell className="px-4 py-3 font-bold text-slate-800 text-sm">{inv.invoice_id}</TableCell>
                    <TableCell className="px-4 py-3"><p className="font-semibold text-slate-800">{inv.students?.first_name} {inv.students?.last_name}</p><p className="text-xs text-slate-500">{inv.students?.classes?.class_name}</p></TableCell>
                    <TableCell className="px-4 py-3"><p className="font-semibold text-blue-600">{inv.payment_method}</p><p className="text-xs text-slate-500 uppercase">{inv.transaction_id || 'N/A'}</p></TableCell>
                    <TableCell className="px-4 py-3 text-right font-black text-emerald-600">৳ {inv.paid_amount}</TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      {inv.status !== 'Refunded' && (
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => setPrintData(inv)} className="text-blue-600 border-blue-200 h-8"><Printer className="w-3 h-3 mr-1"/> Receipt</Button>
                          {(role === "School Admin" || role === "Accountant") && (
                            <Button size="sm" variant="outline" onClick={() => processRefund(inv.id)} className="text-red-600 border-red-200 h-8">Refund</Button>
                          )}
                        </div>
                      )}
                      {inv.status === 'Refunded' && <span className="text-xs font-bold text-slate-400">Refunded</span>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
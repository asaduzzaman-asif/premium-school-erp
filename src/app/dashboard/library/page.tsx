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
import { Loader2, Library, BookPlus, BookUp2, CheckCircle2 } from "lucide-react";

export default function LibraryPage() {
  const [role, setRole] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Book Form State
  const [bookData, setBookData] = useState({ title: "", author: "", category: "", copies: "1" });
  
  // Issue Book Form State
  const [issueData, setIssueData] = useState({ book_id: "", student_id: "", due_date: "" });

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: bData } = await supabase.from("books").select("*").order("id", { ascending: false });
    if (bData) setBooks(bData);

    const { data: iData } = await supabase
      .from("book_issues")
      .select("*, books(title), students(first_name, last_name, admission_no)")
      .order("issue_date", { ascending: false });
    if (iData) setIssuedBooks(iData);

    const { data: sData } = await supabase.from("students").select("*");
    if (sData) setStudents(sData);
  };

  // ১. নতুন বই অ্যাড করা
  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const copies = parseInt(bookData.copies);
    const { error } = await supabase.from("books").insert([{
      title: bookData.title, author: bookData.author, category: bookData.category, total_copies: copies, available_copies: copies
    }]);

    setLoading(false);
    if (!error) {
      toast.success("Book added to library!");
      setBookData({ title: "", author: "", category: "", copies: "1" });
      fetchData();
    } else toast.error(error.message);
  };

  // ২. স্টুডেন্টকে বই ইস্যু করা
  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // চেক করা বই অ্যাভেইলেবল আছে কিনা
    const selectedBook = books.find(b => b.id.toString() === issueData.book_id);
    if (!selectedBook || selectedBook.available_copies <= 0) {
      toast.error("This book is currently out of stock!");
      return;
    }

    setLoading(true);
    
    // বই ইস্যু করা এবং available_copies ১ কমানো
    const { error: issueError } = await supabase.from("book_issues").insert([{
      book_id: parseInt(issueData.book_id),
      student_id: parseInt(issueData.student_id),
      due_date: issueData.due_date
    }]);

    if (!issueError) {
      await supabase.from("books").update({ available_copies: selectedBook.available_copies - 1 }).eq("id", selectedBook.id);
      toast.success("Book issued successfully!");
      setIssueData({ book_id: "", student_id: "", due_date: "" });
      fetchData();
    } else toast.error(issueError.message);
    
    setLoading(false);
  };

  // ৩. বই রিটার্ন নেওয়া
  const handleReturnBook = async (issueId: number, bookId: number) => {
    const confirmReturn = window.confirm("Confirm book return?");
    if (!confirmReturn) return;

    const selectedBook = books.find(b => b.id === bookId);
    
    // স্ট্যাটাস আপডেট করা এবং available_copies ১ বাড়ানো
    const { error } = await supabase.from("book_issues").update({ status: 'Returned', return_date: new Date().toISOString().split('T')[0] }).eq("id", issueId);
    
    if (!error && selectedBook) {
      await supabase.from("books").update({ available_copies: selectedBook.available_copies + 1 }).eq("id", bookId);
      toast.success("Book returned to library!");
      fetchData();
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-800">Library Management</h2>
        <p className="text-slate-500 mt-1">Manage library catalog, book issues, and returns.</p>
      </div>

      {(role === "School Admin" || role === "Super Admin" || role === "Librarian") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Book Form */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookPlus className="w-5 h-5 text-blue-600" /> Add New Book
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddBook} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Book Title</Label>
                    <Input value={bookData.title} onChange={(e) => setBookData({...bookData, title: e.target.value})} required placeholder="e.g. Physics 1st Paper" />
                  </div>
                  <div className="space-y-2">
                    <Label>Author Name</Label>
                    <Input value={bookData.author} onChange={(e) => setBookData({...bookData, author: e.target.value})} required placeholder="Author" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Input value={bookData.category} onChange={(e) => setBookData({...bookData, category: e.target.value})} placeholder="e.g. Science, Fiction" />
                  </div>
                  <div className="space-y-2">
                    <Label>Total Copies</Label>
                    <Input type="number" min="1" value={bookData.copies} onChange={(e) => setBookData({...bookData, copies: e.target.value})} required />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookPlus className="w-4 h-4 mr-2" />} Save Book
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Issue Book Form */}
          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <BookUp2 className="w-5 h-5 text-purple-600" /> Issue Book to Student
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleIssueBook} className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Book</Label>
                  <Select value={issueData.book_id || ""} onValueChange={(val) => setIssueData({...issueData, book_id: val})}>
                    <SelectTrigger><SelectValue placeholder="-- Choose Book --" /></SelectTrigger>
                    <SelectContent>
                      {books.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.title} (Available: {b.available_copies})</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Select Student</Label>
                    <Select value={issueData.student_id || ""} onValueChange={(val) => setIssueData({...issueData, student_id: val})}>
                      <SelectTrigger><SelectValue placeholder="-- Student --" /></SelectTrigger>
                      <SelectContent>
                        {students.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.admission_no} - {s.first_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Input type="date" value={issueData.due_date} onChange={(e) => setIssueData({...issueData, due_date: e.target.value})} required />
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <Button type="submit" disabled={loading || !issueData.book_id} className="bg-purple-600 hover:bg-purple-700">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <BookUp2 className="w-4 h-4 mr-2" />} Issue Book
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Book Issues Record Table */}
      <Card className="border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Library className="w-5 h-5 text-indigo-600" /> Issued Books Record
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="px-6 py-3">Book Title</TableHead>
                <TableHead className="px-6 py-3">Student Info</TableHead>
                <TableHead className="px-6 py-3">Issue Date</TableHead>
                <TableHead className="px-6 py-3">Due Date</TableHead>
                <TableHead className="px-6 py-3">Status</TableHead>
                {(role === "School Admin" || role === "Super Admin") && <TableHead className="px-6 py-3 text-right">Action</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {issuedBooks.map((issue) => (
                <TableRow key={issue.id}>
                  <TableCell className="px-6 py-4 font-bold text-slate-800">{issue.books?.title}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className="font-semibold">{issue.students?.first_name} {issue.students?.last_name}</span>
                    <span className="block text-xs text-slate-500">ID: {issue.students?.admission_no}</span>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-slate-600">{new Date(issue.issue_date).toLocaleDateString()}</TableCell>
                  <TableCell className="px-6 py-4 text-slate-600 font-medium">{new Date(issue.due_date).toLocaleDateString()}</TableCell>
                  <TableCell className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${issue.status === 'Returned' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      {issue.status}
                    </span>
                  </TableCell>
                  {(role === "School Admin" || role === "Super Admin") && (
                    <TableCell className="px-6 py-4 text-right">
                      {issue.status === 'Issued' ? (
                        <Button onClick={() => handleReturnBook(issue.id, issue.book_id)} size="sm" className="bg-emerald-600 hover:bg-emerald-700 h-8">
                          Mark Returned
                        </Button>
                      ) : (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 ml-auto" />
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))}
              {issuedBooks.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-400">No books issued yet.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
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
import { Library, BookPlus, BookmarkCheck, Trash2 } from "lucide-react";

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<"BOOKS" | "ISSUED">("BOOKS");
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [issuedBooks, setIssuedBooks] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState("");

  const [bookData, setBookData] = useState({ title: "", author: "", isbn: "", quantity: "" });
  const [issueData, setIssueData] = useState({ book_id: "", student_id: "", due_date: "" });

  useEffect(() => {
    setRole(localStorage.getItem("userRole") || "");
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: bData } = await supabase.from("books").select("*").order("id", { ascending: false });
    if (bData) setBooks(bData);

    const { data: sData } = await supabase.from("students").select("id, first_name, last_name, admission_no");
    if (sData) setStudents(sData);

    const { data: iData } = await supabase.from("issued_books").select("*, books(title, author), students(first_name, last_name, admission_no)").order("id", { ascending: false });
    if (iData) setIssuedBooks(iData);
  };

  const handleAddBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("books").insert([{
      title: bookData.title,
      author: bookData.author,
      isbn: bookData.isbn,
      quantity: parseInt(bookData.quantity),
      available: parseInt(bookData.quantity)
    }]);
    setLoading(false);
    if (!error) {
      toast.success("Book added to library!");
      setBookData({ title: "", author: "", isbn: "", quantity: "" });
      fetchData();
    } else toast.error(error.message);
  };

  const handleIssueBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.from("issued_books").insert([{
      book_id: parseInt(issueData.book_id),
      student_id: parseInt(issueData.student_id),
      due_date: issueData.due_date,
      status: "Issued"
    }]);
    setLoading(false);
    if (!error) {
      toast.success("Book issued successfully!");
      setIssueData({ book_id: "", student_id: "", due_date: "" });
      fetchData();
    } else toast.error(error.message);
  };

  const handleReturnBook = async (id: number) => {
    const { error } = await supabase.from("issued_books").update({ status: "Returned" }).eq("id", id);
    if (!error) {
      toast.success("Book returned successfully!");
      fetchData();
    }
  };

  const deleteBook = async (id: number) => {
    if(!window.confirm("Delete this book?")) return;
    await supabase.from("books").delete().eq("id", id);
    toast.success("Book deleted!");
    fetchData();
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">Library Management</h2>
          <p className="text-slate-500 mt-1">Manage books, inventory, and student book issuing.</p>
        </div>
        
        <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto">
          <button onClick={() => setActiveTab("BOOKS")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "BOOKS" ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <Library className="w-4 h-4" /> Book Inventory
          </button>
          <button onClick={() => setActiveTab("ISSUED")} className={`px-4 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === "ISSUED" ? "bg-white text-emerald-600 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
            <BookmarkCheck className="w-4 h-4" /> Issue & Return
          </button>
        </div>
      </div>

      {activeTab === "BOOKS" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(role === "School Admin" || role === "Super Admin" || role === "Teacher") && (
            <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit border-t-4 border-t-blue-500">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><BookPlus className="w-5 h-5 text-blue-600"/> Add New Book</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddBook} className="space-y-4">
                  <div className="space-y-2"><Label>Book Title</Label><Input required value={bookData.title} onChange={e => setBookData({...bookData, title: e.target.value})} placeholder="e.g. Physics 101" /></div>
                  <div className="space-y-2"><Label>Author Name</Label><Input required value={bookData.author} onChange={e => setBookData({...bookData, author: e.target.value})} placeholder="Author" /></div>
                  <div className="space-y-2"><Label>ISBN Code</Label><Input value={bookData.isbn} onChange={e => setBookData({...bookData, isbn: e.target.value})} placeholder="ISBN" /></div>
                  <div className="space-y-2"><Label>Quantity</Label><Input type="number" min="1" required value={bookData.quantity} onChange={e => setBookData({...bookData, quantity: e.target.value})} /></div>
                  <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">Add Book</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className={`border-slate-100 shadow-sm ${(role === "School Admin" || role === "Super Admin" || role === "Teacher") ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold">Library Book Catalog</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow><TableHead className="px-6 py-3">Book Title & Author</TableHead><TableHead className="px-6 py-3">ISBN</TableHead><TableHead className="px-6 py-3 text-center">Copies</TableHead><TableHead className="px-6 py-3 text-right">Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {books.map(b => (
                    <TableRow key={b.id}>
                      <TableCell className="px-6 py-4"><p className="font-bold text-slate-800">{b.title}</p><p className="text-xs text-slate-500">By {b.author}</p></TableCell>
                      <TableCell className="px-6 py-4 text-xs font-mono text-slate-600">{b.isbn || 'N/A'}</TableCell>
                      <TableCell className="px-6 py-4 text-center font-bold text-blue-600">{b.quantity}</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {(role === "School Admin" || role === "Super Admin") && (
                          <Button size="sm" variant="ghost" onClick={() => deleteBook(b.id)} className="text-red-500 hover:bg-red-50 h-8 w-8 p-0"><Trash2 className="w-4 h-4"/></Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {books.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">No books found in catalog.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === "ISSUED" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {(role === "School Admin" || role === "Super Admin" || role === "Teacher") && (
            <Card className="border-slate-100 shadow-sm lg:col-span-1 h-fit border-t-4 border-t-emerald-500">
              <CardHeader className="border-b border-slate-100 bg-slate-50/50">
                <CardTitle className="text-lg font-bold flex items-center gap-2"><BookmarkCheck className="w-5 h-5 text-emerald-600"/> Issue Book to Student</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleIssueBook} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Book</Label>
                    <Select value={issueData.book_id || undefined} onValueChange={(val) => setIssueData({...issueData, book_id: val || ""})}>
                      <SelectTrigger><SelectValue placeholder="-- Book --"/></SelectTrigger>
                      <SelectContent>{books.map(b => <SelectItem key={b.id} value={b.id.toString()}>{b.title}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Select Student</Label>
                    <Select value={issueData.student_id || undefined} onValueChange={(val) => setIssueData({...issueData, student_id: val || ""})}>
                      <SelectTrigger><SelectValue placeholder="-- Student --"/></SelectTrigger>
                      <SelectContent>{students.map(s => <SelectItem key={s.id} value={s.id.toString()}>{s.first_name} {s.last_name} ({s.admission_no})</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Return Due Date</Label>
                    <Input type="date" required value={issueData.due_date} onChange={e => setIssueData({...issueData, due_date: e.target.value})} />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-emerald-600 hover:bg-emerald-700">Issue Book</Button>
                </form>
              </CardContent>
            </Card>
          )}

          <Card className={`border-slate-100 shadow-sm ${(role === "School Admin" || role === "Super Admin" || role === "Teacher") ? "lg:col-span-2" : "lg:col-span-3"}`}>
            <CardHeader className="border-b border-slate-100 bg-slate-50/50">
              <CardTitle className="text-lg font-bold">Issued Books History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow><TableHead className="px-6 py-3">Book Details</TableHead><TableHead className="px-6 py-3">Student Info</TableHead><TableHead className="px-6 py-3">Due Date</TableHead><TableHead className="px-6 py-3 text-right">Status / Action</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                  {issuedBooks.map(ib => (
                    <TableRow key={ib.id}>
                      <TableCell className="px-6 py-4"><p className="font-bold text-slate-800">{ib.books?.title}</p><p className="text-xs text-slate-500">Author: {ib.books?.author}</p></TableCell>
                      <TableCell className="px-6 py-4"><p className="font-semibold text-slate-800">{ib.students?.first_name} {ib.students?.last_name}</p><p className="text-xs text-slate-500">ID: {ib.students?.admission_no}</p></TableCell>
                      <TableCell className="px-6 py-4 text-xs font-bold text-red-500">{ib.due_date}</TableCell>
                      <TableCell className="px-6 py-4 text-right">
                        {ib.status === 'Issued' ? (
                          <Button size="sm" onClick={() => handleReturnBook(ib.id)} className="bg-emerald-600 hover:bg-emerald-700 h-8 text-xs">Mark Returned</Button>
                        ) : (
                          <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Returned</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                  {issuedBooks.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-400">No books currently issued.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
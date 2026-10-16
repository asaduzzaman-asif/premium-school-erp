import { redirect } from "next/navigation";

export default function Home() {
  // কেউ মেইন লিংকে আসলে তাকে সোজা লগিন পেজে পাঠিয়ে দেওয়া হবে
  redirect("/login");
}
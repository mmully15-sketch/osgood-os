import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AppNav(){
  async function signOut(){
    "use server";
    const supabase=await createClient();
    await supabase.auth.signOut();
    redirect("/login");
  }
  return <header className="topbar"><div className="topbar-inner">
    <div className="brand">Osgood OS</div>
    <nav className="nav">
      <Link href="/app">Dashboard</Link>
      <Link href="/app/leads">Clients & Leads</Link>
      <Link href="/app/quotes">Quotes</Link>
      <Link href="/app/settings">Settings</Link>
      <form action={signOut}><button className="btn btn-light" type="submit">Sign Out</button></form>
    </nav>
  </div></header>
}

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

  return <header className="topbar">
    <div className="topbar-inner">
      <div className="brand">The Osgood<small>Sales & Venue Operations</small></div>
      <nav className="nav">
        <Link href="/app">Dashboard</Link>
        <Link href="/app/calendar">Calendar</Link>
        <Link href="/app/leads">Clients</Link>
        <Link href="/app/calculator">Pricing Calculator</Link>
        <Link href="/app/floor-plans">Floor Plans</Link>
        <Link href="/app/reference">Venue Reference</Link>
        <Link href="/app/tasks">Operations</Link>
        <Link href="/app/quotes">Quotes</Link>
        <Link href="/app/payments">Payments</Link>
        <Link href="/app/settings">Settings</Link>
        <form action={signOut}>
          <button className="btn btn-light" type="submit">Sign Out</button>
        </form>
      </nav>
    </div>
  </header>
}

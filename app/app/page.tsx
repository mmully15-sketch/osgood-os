import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Dashboard(){
  const supabase=await createClient();
  const today=new Date().toISOString();

  const [{count:leadCount},{count:quoteCount},{count:bookedCount},{data:upcoming},{data:tasks},{data:quotes}] = await Promise.all([
    supabase.from("leads").select("*",{count:"exact",head:true}).not("status","in","(booked,lost)"),
    supabase.from("quotes").select("*",{count:"exact",head:true}),
    supabase.from("leads").select("*",{count:"exact",head:true}).eq("status","booked"),
    supabase.from("events").select("*").gte("start_at",today).neq("status","cancelled").order("start_at").limit(8),
    supabase.from("tasks").select("*,leads(name)").eq("completed",false).order("due_date",{ascending:true,nullsFirst:false}).limit(6),
    supabase.from("quotes").select("total")
  ]);

  const pipeline=(quotes??[]).reduce((sum,q)=>sum+Number(q.total||0),0);

  return <>
    <section className="hero">
      <h1>Good evening, Osgood team.</h1>
      <p>One shared view of your leads, calendar, upcoming events, quotes, follow-ups, and operating tasks.</p>
      <div className="actions" style={{marginTop:16}}>
        <Link className="btn btn-primary" href="/app/calendar">Open Calendar</Link>
        <Link className="btn btn-gold" href="/app/calculator">Create a Quote</Link>
      </div>
    </section>

    <div className="grid">
      <div className="card span-3"><div className="kpi-label">Active Leads</div><div className="kpi-value">{leadCount??0}</div><div className="kpi-sub">Not yet booked or lost</div></div>
      <div className="card span-3"><div className="kpi-label">Booked Events</div><div className="kpi-value">{bookedCount??0}</div><div className="kpi-sub">Shared database</div></div>
      <div className="card span-3"><div className="kpi-label">Saved Quotes</div><div className="kpi-value">{quoteCount??0}</div><div className="kpi-sub">Draft and sent proposals</div></div>
      <div className="card span-3"><div className="kpi-label">Quote Value</div><div className="kpi-value">${pipeline.toLocaleString()}</div><div className="kpi-sub">Total saved quote value</div></div>

      <section className="card span-7">
        <h2>Upcoming Calendar Events</h2>
        <div className="quick-list">
          {(upcoming??[]).map(e=><Link className="quick-item" key={e.id} href={`/app/calendar/${e.id}`}>
            <div><b>{e.title}</b><div className="muted">{e.event_type} · {e.guest_count||0} guests</div></div>
            <div style={{textAlign:"right"}}><b>{new Date(e.start_at).toLocaleDateString()}</b><div><span className="badge">{e.status}</span></div></div>
          </Link>)}
          {!upcoming?.length&&<p className="muted">No upcoming calendar events.</p>}
        </div>
      </section>

      <section className="card span-5">
        <h2>Open Tasks</h2>
        <div className="quick-list">
          {(tasks??[]).map(t=><div className="quick-item" key={t.id}>
            <div><b>{t.title}</b><div className="muted">{t.leads?.name||"Unassigned"}</div></div>
            <div>{t.due_date||"No due date"}</div>
          </div>)}
          {!tasks?.length&&<p className="muted">No open tasks.</p>}
        </div>
        <Link className="btn btn-light" style={{marginTop:14}} href="/app/tasks">View all tasks</Link>
      </section>
    </div>
  </>;
}

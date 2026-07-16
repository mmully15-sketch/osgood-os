import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

function dateKey(d:Date){
  return d.toISOString().slice(0,10);
}

function readiness(checklist:any[]){
  if(!checklist?.length) return 0;
  return Math.round((checklist.filter(x=>x.completed).length/checklist.length)*100);
}

export default async function Dashboard(){
  const supabase=await createClient();
  const now=new Date();
  const todayStart=new Date(now); todayStart.setHours(0,0,0,0);
  const tomorrowStart=new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate()+1);
  const dayAfterTomorrow=new Date(tomorrowStart); dayAfterTomorrow.setDate(dayAfterTomorrow.getDate()+1);
  const nextThirty=new Date(todayStart); nextThirty.setDate(nextThirty.getDate()+30);
  const today=dateKey(todayStart);

  const [
    {data:todayEvents},
    {data:tomorrowEvents},
    {data:upcomingEvents},
    {data:openTasks},
    {data:quotes},
    {count:activeLeads},
    {data:walkthroughItems},
    {data:unconfirmedVendors},
    {data:recentActivity},
    {data:paymentSchedules}
  ]=await Promise.all([
    supabase.from("events")
      .select("id,title,event_type,status,start_at,end_at,guest_count,event_manager,setup_lead,security_lead")
      .gte("start_at",todayStart.toISOString()).lt("start_at",tomorrowStart.toISOString())
      .neq("status","cancelled").order("start_at"),
    supabase.from("events")
      .select("id,title,event_type,status,start_at,end_at,guest_count,event_manager,setup_lead,security_lead")
      .gte("start_at",tomorrowStart.toISOString()).lt("start_at",dayAfterTomorrow.toISOString())
      .neq("status","cancelled").order("start_at"),
    supabase.from("events")
      .select("id,title,event_type,status,start_at,end_at,guest_count,workflow_stage,event_manager,event_checklist(completed)")
      .gte("start_at",todayStart.toISOString()).lt("start_at",nextThirty.toISOString())
      .neq("status","cancelled").order("start_at").limit(12),
    supabase.from("tasks")
      .select("id,title,due_date,completed,leads(id,name,event_date)")
      .eq("completed",false).order("due_date",{ascending:true,nullsFirst:false}).limit(12),
    supabase.from("quotes").select("id,total,status,created_at"),
    supabase.from("leads").select("*",{count:"exact",head:true}).not("status","in","(booked,lost)"),
    supabase.from("event_checklist")
      .select("id,label,due_date,completed,event_id,events(title,start_at)")
      .eq("item_key","walkthrough").eq("completed",false)
      .order("due_date",{ascending:true,nullsFirst:false}).limit(8),
    supabase.from("event_vendors")
      .select("id,company_name,vendor_type,event_id,events(title,start_at)")
      .eq("confirmed",false).order("created_at",{ascending:false}).limit(8),
    supabase.from("activity_log")
      .select("*").order("created_at",{ascending:false}).limit(8),
    supabase.from("payment_schedules")
      .select("*,quotes(id,client_name,quote_number)")
      .neq("status","paid").order("due_date",{ascending:true,nullsFirst:false}).limit(8)
  ]);

  const quoteValue=(quotes??[]).reduce((s,q)=>s+Number(q.total||0),0);
  const overdue=(openTasks??[]).filter(t=>t.due_date && t.due_date<today);
  const dueToday=(openTasks??[]).filter(t=>t.due_date===today);
  const pendingQuotes=(quotes??[]).filter(q=>q.status==="draft"||q.status==="sent");
  const paymentAlerts=(paymentSchedules??[]).filter(p=>p.due_date&&p.due_date<=today);

  return <>
    <section className="hero">
      <h1>Operations Command Center</h1>
      <p>Live view of today’s events, upcoming readiness, outstanding work, staff assignments, vendors, quotes, and client activity.</p>
      <div className="actions" style={{marginTop:16}}>
        <Link className="btn btn-primary" href="/app/calendar">Open Calendar</Link>
        <Link className="btn btn-gold" href="/app/calculator">Create Quote</Link>
        <Link className="btn btn-light" href="/app/leads">Client Records</Link>
      </div>

      <div className="command-strip">
        <div className="command-card"><span className="muted">Today’s Events</span><b>{todayEvents?.length||0}</b></div>
        <div className="command-card"><span className="muted">Tasks Due Today</span><b>{dueToday.length}</b></div>
        <div className="command-card"><span className="muted">Overdue Tasks</span><b>{overdue.length}</b></div>
        <div className="command-card"><span className="muted">Active Leads</span><b>{activeLeads??0}</b></div>
      </div>
    </section>

    <div className="dashboard-grid">
      <section className="dash-card dash-span-7">
        <h2>Today</h2>
        <div className="mini-calendar">
          {(todayEvents??[]).map(e=><Link href={`/app/calendar/${e.id}`} className="mini-event" key={e.id}>
            <div className="mini-date">{new Date(e.start_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div>
            <div>
              <b>{e.title}</b>
              <div className="muted">{e.event_type} · {e.guest_count||0} guests</div>
            </div>
            <span className="badge">{e.status}</span>
          </Link>)}
          {!todayEvents?.length&&<div className="empty-state">No events scheduled today.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-5">
        <h2>Tomorrow</h2>
        <div className="mini-calendar">
          {(tomorrowEvents??[]).map(e=><Link href={`/app/calendar/${e.id}`} className="mini-event" key={e.id}>
            <div className="mini-date">{new Date(e.start_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div>
            <div><b>{e.title}</b><div className="muted">{e.event_type}</div></div>
          </Link>)}
          {!tomorrowEvents?.length&&<div className="empty-state">No events scheduled tomorrow.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-7">
        <h2>Upcoming Event Readiness</h2>
        {(upcomingEvents??[]).map(e=>{
          const pct=readiness(e.event_checklist||[]);
          return <Link href={`/app/calendar/${e.id}`} className="readiness-row" key={e.id}>
            <div>
              <b>{e.title}</b>
              <div className="muted">{new Date(e.start_at).toLocaleDateString()} · {e.workflow_stage||"planning"} · {e.event_manager||"No event manager"}</div>
              <div className="readiness-bar"><div className="readiness-fill" style={{width:`${pct}%`}}/></div>
            </div>
            <strong>{pct}%</strong>
          </Link>
        })}
        {!upcomingEvents?.length&&<div className="empty-state">No upcoming events in the next 30 days.</div>}
      </section>

      <section className="dash-card dash-span-5">
        <h2>Urgent Attention</h2>
        <div className="alert-list">
          {overdue.slice(0,5).map(t=><div className="alert-item danger" key={t.id}>
            <div><b>{t.title}</b><div className="meta">{(t.leads as any)?.name||"Unassigned"} · Due {t.due_date}</div></div>
            <span className="badge">Overdue</span>
          </div>)}
          {dueToday.slice(0,5).map(t=><div className="alert-item warning" key={t.id}>
            <div><b>{t.title}</b><div className="meta">{(t.leads as any)?.name||"Unassigned"}</div></div>
            <span className="badge">Today</span>
          </div>)}
          {!overdue.length&&!dueToday.length&&<div className="alert-item success"><div><b>No urgent task alerts</b><div className="meta">Everything due today is clear.</div></div></div>}
        </div>
      </section>

      <section className="dash-card dash-span-4">
        <h2>Walkthroughs Needed</h2>
        <div className="alert-list">
          {(walkthroughItems??[]).map(w=><Link href={`/app/calendar/${w.event_id}`} className="alert-item warning" key={w.id}>
            <div><b>{(w.events as any)?.title||"Event"}</b><div className="meta">{w.due_date?`Due ${w.due_date}`:"No due date set"}</div></div>
          </Link>)}
          {!walkthroughItems?.length&&<div className="empty-state">No open walkthrough items.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-4">
        <h2>Unconfirmed Vendors</h2>
        <div className="alert-list">
          {(unconfirmedVendors??[]).map(v=><Link href={`/app/calendar/${v.event_id}`} className="alert-item warning" key={v.id}>
            <div><b>{v.company_name}</b><div className="meta">{v.vendor_type} · {(v.events as any)?.title||"Event"}</div></div>
          </Link>)}
          {!unconfirmedVendors?.length&&<div className="empty-state">All recorded vendors are confirmed.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-4">
        <h2>Sales Snapshot</h2>
        <div className="assignment-list">
          <div className="assignment-row"><span>Open quotes</span><b>{pendingQuotes.length}</b></div>
          <div className="assignment-row"><span>Total quote value</span><b>${quoteValue.toLocaleString()}</b></div>
          <div className="assignment-row"><span>Active leads</span><b>{activeLeads??0}</b></div>
          <div className="assignment-row"><span>Upcoming events</span><b>{upcomingEvents?.length||0}</b></div>
        </div>
      </section>

      <section className="dash-card dash-span-6">
        <h2>Event-Day Assignments</h2>
        <div className="assignment-list">
          {(todayEvents??[]).map(e=><div className="assignment-row" key={e.id}>
            <div>
              <b>{e.title}</b>
              <div className="muted">Manager: {e.event_manager||"Unassigned"}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div>Setup: {e.setup_lead||"Unassigned"}</div>
              <div>Security: {e.security_lead||"Unassigned"}</div>
            </div>
          </div>)}
          {!todayEvents?.length&&<div className="empty-state">No event-day assignments today.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-6">
        <h2>Payment Alerts</h2>
        <div className="alert-list">
          {(paymentAlerts??[]).map(p=><Link href={`/app/quotes/${p.quote_id}`} className={`alert-item ${p.due_date<today?"danger":"warning"}`} key={p.id}>
            <div><b>{(p.quotes as any)?.client_name||"Client"}</b><div className="meta">{p.label} · Due {p.due_date}</div></div>
            <span className="badge">${Number(p.amount||0).toLocaleString()}</span>
          </Link>)}
          {!paymentAlerts?.length&&<div className="empty-state">No payments due or overdue today.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-6">
        <h2>Recent Activity</h2>
        <div className="alert-list">
          {(recentActivity??[]).map(a=><div className="alert-item" key={a.id}>
            <div><b>{a.description}</b><div className="meta">{new Date(a.created_at).toLocaleString()}</div></div>
          </div>)}
          {!recentActivity?.length&&<div className="empty-state">No recent activity.</div>}
        </div>
      </section>
    </div>
  </>;
}

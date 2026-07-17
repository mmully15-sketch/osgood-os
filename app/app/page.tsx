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
      .select("id,title,due_date,completed,status,priority,task_type,category,percent_complete,assigned_to,owner:profiles!tasks_assigned_to_fkey(id,full_name,email),leads(id,name,event_date)")
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
  const buildingTasks=(openTasks??[]).filter(t=>(t.task_type||"building")==="building");
  const buildingOverdue=buildingTasks.filter(t=>t.due_date&&t.due_date<today);
  const buildingDueToday=buildingTasks.filter(t=>t.due_date===today);
  const sevenDays=new Date(todayStart); sevenDays.setDate(sevenDays.getDate()+7);
  const sevenDayKey=dateKey(sevenDays);
  const buildingDueSoon=buildingTasks.filter(t=>t.due_date&&t.due_date>today&&t.due_date<=sevenDayKey);
  const buildingAverageProgress=buildingTasks.length?Math.round(buildingTasks.reduce((sum,t)=>sum+Number(t.percent_complete||0),0)/buildingTasks.length):100;
  const pendingQuotes=(quotes??[]).filter(q=>q.status==="draft"||q.status==="sent");
  const paymentAlerts=(paymentSchedules??[]).filter(p=>p.due_date&&p.due_date<=today);

  return <>
    <section className="dashboard-hero">
      <div className="dashboard-brand-panel">
        <img className="dashboard-logo" src="/osgood-logo.png" alt="The Osgood Wedding and Events"/>
      </div>
      <div className="dashboard-welcome">
        <span className="eyebrow">Venue Operations</span>
        <h1>Welcome to The Osgood</h1>
        <p>Manage today’s events, client follow-ups, payment milestones, and operational readiness from one command center.</p>
        <div className="actions dashboard-actions">
          <Link className="btn btn-gold" href="/app/calendar">View Calendar</Link>
          <Link className="btn btn-primary" href="/app/calculator">Create Proposal</Link>
          <Link className="btn btn-light" href="/app/leads">Open Clients</Link>
        </div>
      </div>
    </section>

    <section className="executive-metrics">
      <Link href="/app/calendar" className="executive-metric">
        <span>Today’s Events</span><b>{todayEvents?.length||0}</b><small>View event-day details</small>
      </Link>
      <Link href="/app/tasks" className="executive-metric">
        <span>Due Today</span><b>{dueToday.length}</b><small>Tasks requiring attention</small>
      </Link>
      <Link href="/app/tasks" className={`executive-metric ${overdue.length?"metric-alert":""}`}>
        <span>Overdue</span><b>{overdue.length}</b><small>Past-due assignments</small>
      </Link>
      <Link href="/app/leads" className="executive-metric">
        <span>Active Clients</span><b>{activeLeads??0}</b><small>Open sales opportunities</small>
      </Link>
      <Link href="/app/quotes" className="executive-metric">
        <span>Open Proposals</span><b>{pendingQuotes.length}</b><small>{quoteValue.toLocaleString("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0})} total value</small>
      </Link>
    </section>

    <div className="dashboard-grid">
      <section className="dash-card dash-span-7 featured-card">
        <div className="card-heading"><div><span className="eyebrow">Schedule</span><h2>Today at The Osgood</h2></div><Link href="/app/calendar">Full calendar →</Link></div>
        <div className="mini-calendar">
          {(todayEvents??[]).map(e=><Link href={`/app/calendar/${e.id}`} className="mini-event" key={e.id}>
            <div className="mini-date">{new Date(e.start_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div>
            <div className="mini-event-copy">
              <b>{e.title}</b>
              <div className="muted">{e.event_type} · {e.guest_count||0} guests</div>
            </div>
            <span className="badge">{e.status}</span>
          </Link>)}
          {!todayEvents?.length&&<div className="empty-state">No events are scheduled today.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-5">
        <div className="card-heading"><div><span className="eyebrow">Next Up</span><h2>Tomorrow</h2></div></div>
        <div className="mini-calendar">
          {(tomorrowEvents??[]).map(e=><Link href={`/app/calendar/${e.id}`} className="mini-event" key={e.id}>
            <div className="mini-date">{new Date(e.start_at).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})}</div>
            <div className="mini-event-copy"><b>{e.title}</b><div className="muted">{e.event_type}</div></div>
          </Link>)}
          {!tomorrowEvents?.length&&<div className="empty-state">No events are scheduled tomorrow.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-7">
        <div className="card-heading"><div><span className="eyebrow">Readiness</span><h2>Upcoming Events</h2></div><span className="muted">Next 30 days</span></div>
        <div className="readiness-list">
        {(upcomingEvents??[]).map(e=>{
          const pct=readiness(e.event_checklist||[]);
          return <Link href={`/app/calendar/${e.id}`} className="readiness-row" key={e.id}>
            <div className="readiness-copy">
              <b>{e.title}</b>
              <div className="muted">{new Date(e.start_at).toLocaleDateString()} · {e.workflow_stage||"planning"} · {e.event_manager||"Manager unassigned"}</div>
              <div className="readiness-bar"><div className="readiness-fill" style={{width:`${pct}%`}}/></div>
            </div>
            <strong>{pct}%</strong>
          </Link>
        })}
        {!upcomingEvents?.length&&<div className="empty-state">No upcoming events in the next 30 days.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-5 attention-card">
        <div className="card-heading"><div><span className="eyebrow">Priority</span><h2>Needs Attention</h2></div></div>
        <div className="alert-list">
          {overdue.slice(0,4).map(t=><div className="alert-item danger" key={t.id}>
            <div><b>{t.title}</b><div className="meta">{(t.leads as any)?.name||"Unassigned"} · Due {t.due_date}</div></div>
            <span className="badge">Overdue</span>
          </div>)}
          {dueToday.slice(0,4).map(t=><div className="alert-item warning" key={t.id}>
            <div><b>{t.title}</b><div className="meta">{(t.leads as any)?.name||"Unassigned"}</div></div>
            <span className="badge">Today</span>
          </div>)}
          {paymentAlerts.slice(0,3).map(p=><Link href={`/app/quotes/${p.quote_id}`} className={`alert-item ${p.due_date<today?"danger":"warning"}`} key={p.id}>
            <div><b>{(p.quotes as any)?.client_name||"Client"} payment</b><div className="meta">{p.label} · Due {p.due_date}</div></div>
            <span className="badge">${Number(p.amount||0).toLocaleString()}</span>
          </Link>)}
          {!overdue.length&&!dueToday.length&&!paymentAlerts.length&&<div className="alert-item success"><div><b>Everything is on track</b><div className="meta">No urgent task or payment alerts.</div></div></div>}
        </div>
      </section>

      <section className="dash-card dash-span-4">
        <div className="card-heading"><div><span className="eyebrow">Planning</span><h2>Walkthroughs</h2></div></div>
        <div className="alert-list">
          {(walkthroughItems??[]).map(w=><Link href={`/app/calendar/${w.event_id}`} className="alert-item warning" key={w.id}>
            <div><b>{(w.events as any)?.title||"Event"}</b><div className="meta">{w.due_date?`Due ${w.due_date}`:"No due date set"}</div></div>
          </Link>)}
          {!walkthroughItems?.length&&<div className="empty-state">No open walkthrough items.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-4">
        <div className="card-heading"><div><span className="eyebrow">Partners</span><h2>Vendor Confirmations</h2></div></div>
        <div className="alert-list">
          {(unconfirmedVendors??[]).map(v=><Link href={`/app/calendar/${v.event_id}`} className="alert-item warning" key={v.id}>
            <div><b>{v.company_name}</b><div className="meta">{v.vendor_type} · {(v.events as any)?.title||"Event"}</div></div>
          </Link>)}
          {!unconfirmedVendors?.length&&<div className="empty-state">All recorded vendors are confirmed.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-4 dark-card">
        <div className="card-heading"><div><span className="eyebrow">Sales</span><h2>Pipeline Snapshot</h2></div></div>
        <div className="assignment-list">
          <div className="assignment-row"><span>Open proposals</span><b>{pendingQuotes.length}</b></div>
          <div className="assignment-row"><span>Proposal value</span><b>${quoteValue.toLocaleString()}</b></div>
          <div className="assignment-row"><span>Active clients</span><b>{activeLeads??0}</b></div>
          <div className="assignment-row"><span>Upcoming events</span><b>{upcomingEvents?.length||0}</b></div>
        </div>
      </section>

      <section className="dash-card dash-span-6 building-accountability-card">
        <div className="card-heading"><div><span className="eyebrow">Building operations</span><h2>Building Accountability</h2></div><Link href="/app/tasks">View all →</Link></div>
        <div className="building-accountability-metrics">
          <div><span>Open</span><b>{buildingTasks.length}</b></div>
          <div className={buildingDueToday.length?"warning":""}><span>Due Today</span><b>{buildingDueToday.length}</b></div>
          <div className={buildingOverdue.length?"danger":""}><span>Overdue</span><b>{buildingOverdue.length}</b></div>
          <div><span>Due Soon</span><b>{buildingDueSoon.length}</b></div>
        </div>
        <div className="building-progress-label"><span>Average task progress</span><b>{buildingAverageProgress}%</b></div>
        <div className="building-progress-track"><div style={{width:`${buildingAverageProgress}%`}}/></div>
        <div className="building-urgent-list">
          {[...buildingOverdue,...buildingDueToday,...buildingDueSoon].slice(0,4).map(task=>{
            const owner=Array.isArray((task as any).owner)?(task as any).owner[0]:(task as any).owner;
            const state=task.due_date<today?"Overdue":task.due_date===today?"Due today":`Due ${task.due_date}`;
            return <Link href="/app/tasks" className={`building-urgent-item ${task.due_date<today?"danger":task.due_date===today?"warning":""}`} key={task.id}>
              <div><b>{task.title}</b><span>{owner?.full_name||owner?.email||"Unassigned"} · {state}</span></div><strong>{task.percent_complete||0}%</strong>
            </Link>
          })}
          {!buildingTasks.length&&<div className="empty-state">No open building tasks.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-6">
        <div className="card-heading"><div><span className="eyebrow">Staffing</span><h2>Event-Day Assignments</h2></div></div>
        <div className="assignment-list">
          {(todayEvents??[]).map(e=><div className="assignment-row" key={e.id}>
            <div><b>{e.title}</b><div className="muted">Manager: {e.event_manager||"Unassigned"}</div></div>
            <div className="assignment-right"><div>Setup: {e.setup_lead||"Unassigned"}</div><div>Security: {e.security_lead||"Unassigned"}</div></div>
          </div>)}
          {!todayEvents?.length&&<div className="empty-state">No event-day assignments today.</div>}
        </div>
      </section>

      <section className="dash-card dash-span-6">
        <div className="card-heading"><div><span className="eyebrow">Activity</span><h2>Recent Updates</h2></div></div>
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

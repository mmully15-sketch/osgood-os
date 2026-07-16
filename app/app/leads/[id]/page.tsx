import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTaskForLead, deleteLead, toggleTask, updateLead } from "../actions";

export default async function LeadDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();
  const [{data:lead,error},{data:tasks},{data:quotes},{data:activity}]=await Promise.all([
    supabase.from("leads").select("*").eq("id",id).single(),
    supabase.from("tasks").select("*").eq("lead_id",id).order("due_date",{ascending:true,nullsFirst:false}),
    supabase.from("quotes").select("*").eq("lead_id",id).order("created_at",{ascending:false}),
    supabase.from("activity_log").select("*").order("created_at",{ascending:false}).limit(12)
  ]);
  if(error||!lead) notFound();

  return <>
    <div className="page-head"><div><h1>{lead.name}</h1><div className="stat-row">
      <span className="stat-pill">{lead.event_type}</span><span className="stat-pill">{lead.status}</span>
      <span className="stat-pill">{lead.guests||0} guests</span><span className="stat-pill">{lead.event_date||"Date not set"}</span>
    </div></div></div>
    <div className="detail-grid">
      <div>
        <section className="card"><h2>Client & Event Details</h2>
          <form action={updateLead.bind(null,id)} className="form-grid">
            <div><label>Client Name</label><input name="name" defaultValue={lead.name} required/></div>
            <div><label>Partner / Organization</label><input name="partner" defaultValue={lead.partner||""}/></div>
            <div><label>Email</label><input name="email" type="email" defaultValue={lead.email||""}/></div>
            <div><label>Phone</label><input name="phone" defaultValue={lead.phone||""}/></div>
            <div><label>Event Type</label><select name="event_type" defaultValue={lead.event_type}><option>Wedding</option><option>Corporate Event</option><option>Private Event</option><option>Nonprofit Event</option><option>Other</option></select></div>
            <div><label>Event Date</label><input name="event_date" type="date" defaultValue={lead.event_date||""}/></div>
            <div><label>Guests</label><input name="guests" type="number" min="0" defaultValue={lead.guests||0}/></div>
            <div><label>Source</label><input name="source" defaultValue={lead.source||""}/></div>
            <div><label>Status</label><select name="status" defaultValue={lead.status}><option value="inquiry">Inquiry</option><option value="toured">Toured</option><option value="quoted">Quoted</option><option value="contracted">Contracted</option><option value="booked">Booked</option><option value="lost">Lost</option></select></div>
            <div><label>Follow-up Date</label><input name="follow_up_date" type="date" defaultValue={lead.follow_up_date||""}/></div>
            <div><label>Assigned Staff</label><input name="assigned_staff" defaultValue={lead.assigned_staff||""}/></div>
            <div><label>Lost Reason</label><input name="lost_reason" defaultValue={lead.lost_reason||""}/></div>
            <div className="full"><label>Internal Notes</label><textarea name="notes" defaultValue={lead.notes||""}/></div>
            <div className="full"><button className="btn btn-primary" type="submit">Save Changes</button></div>
          </form>
        </section>
        <section className="card" style={{marginTop:16}}><h2>Quotes</h2>
          {quotes?.length?<table><thead><tr><th>Quote</th><th>Status</th><th>Total</th><th>Balance</th></tr></thead>
          <tbody>{quotes.map(q=><tr key={q.id}><td>{q.quote_number}</td><td><span className="badge">{q.status}</span></td><td>${Number(q.total||0).toLocaleString()}</td><td>${Number(q.balance||0).toLocaleString()}</td></tr>)}</tbody></table>:<p className="muted">No quotes saved for this client yet.</p>}
        </section>
      </div>
      <aside>
        <section className="card"><h2>Tasks</h2>
          <form action={createTaskForLead.bind(null,id)} className="form-grid">
            <div className="full"><label>Task</label><input name="title" placeholder="Follow up, send contract, collect deposit..." required/></div>
            <div className="full"><label>Due Date</label><input name="due_date" type="date"/></div>
            <div className="full"><button className="btn btn-primary" type="submit">Add Task</button></div>
          </form>
          <div style={{marginTop:16}}>{(tasks??[]).map(t=><form action={toggleTask.bind(null,t.id,id,t.completed)} key={t.id} style={{marginBottom:10}}>
            <button className="btn btn-light" style={{width:"100%",textAlign:"left"}} type="submit"><span className={t.completed?"task-done":""}>{t.completed?"✓ ":""}{t.title}</span><br/><small className="muted">{t.due_date||"No due date"}</small></button>
          </form>)}{!tasks?.length&&<p className="muted">No tasks yet.</p>}</div>
        </section>
        <section className="card" style={{marginTop:16}}><h2>Recent Activity</h2><div className="timeline">
          {(activity??[]).slice(0,8).map(a=><div className="timeline-item" key={a.id}><b>{a.description}</b><br/><small>{new Date(a.created_at).toLocaleString()}</small></div>)}
        </div></section>
        <section className="card" style={{marginTop:16}}><h2>Danger Zone</h2>
          <form action={deleteLead.bind(null,id)}><button className="btn" style={{background:"#f1deda",color:"#8a3c36"}} type="submit">Delete Client Record</button></form>
        </section>
      </aside>
    </div>
  </>;
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createTaskForLead, deleteLead, toggleClientEventChecklist, toggleTask, updateLead } from "../actions";

export default async function LeadDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();
  const [{data:lead,error},{data:tasks},{data:quotes},{data:activity},{data:events}]=await Promise.all([
    supabase.from("leads").select("*").eq("id",id).single(),
    supabase.from("tasks").select("*").eq("lead_id",id).order("due_date",{ascending:true,nullsFirst:false}),
    supabase.from("quotes").select("*").eq("lead_id",id).order("created_at",{ascending:false}),
    supabase.from("activity_log").select("*").order("created_at",{ascending:false}).limit(12),
    supabase.from("events").select("id,title,start_at,status,workflow_stage,event_checklist(*),event_day_assignments(id,assignment_role,profile_id,profiles:profiles!event_day_assignments_profile_id_fkey(id,full_name))").eq("lead_id",id).order("start_at",{ascending:true})
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
        <section className="card client-operations-card" style={{marginTop:16}}>
          <div className="card-heading">
            <div><span className="eyebrow">Calendar Workflow</span><h2>Event Operations Tasks</h2></div>
            <span className="muted">{(events??[]).length} linked event{(events??[]).length===1?"":"s"}</span>
          </div>
          {(events??[]).map(event=>{
            const checklist=event.event_checklist??[];
            const complete=checklist.filter((item:any)=>item.completed).length;
            const pct=checklist.length?Math.round((complete/checklist.length)*100):0;
            const grouped=checklist.reduce((acc:any,item:any)=>{
              (acc[item.category||"General"]??=[]).push(item);
              return acc;
            },{});
            return <div className="client-event-workflow" key={event.id}>
              <div className="client-event-header">
                <div>
                  <h3>{event.title}</h3>
                  <div className="muted">{new Date(event.start_at).toLocaleDateString()} · {event.workflow_stage||event.status}</div>
                </div>
                <div className="client-event-progress">
                  <b>{complete}/{checklist.length}</b>
                  <span>{pct}% complete</span>
                  <Link className="link-button" href={`/app/calendar/${event.id}`}>Open Event</Link>
                </div>
              </div>
              <div className="progress-track"><div className="progress-fill" style={{width:`${pct}%`}}/></div>
              {Object.entries(grouped).map(([category,items]:any)=><div className="client-task-group" key={category}>
                <h4>{category}</h4>
                <div className="client-checklist">
                  {items.map((item:any)=><form action={toggleClientEventChecklist.bind(null,item.id,event.id,id,item.completed)} key={item.id}>
                    <button className={`client-check-task ${item.completed?"done":""}`} type="submit">
                      <span className="check-symbol">{item.completed?"✓":"○"}</span>
                      <span><b>{item.label}</b><small>{item.responsible_staff||"Unassigned"}{item.due_date?` · Due ${item.due_date}`:""}</small></span>
                    </button>
                  </form>)}
                </div>
              </div>)}
              {!checklist.length&&<p className="muted">No event operations checklist has been created for this event.</p>}
            </div>
          })}
          {!events?.length&&<p className="muted">No calendar event is linked to this client yet. Create or link the event from the Calendar tab to populate the full operations checklist here.</p>}
        </section>
      </div>
      <aside>
        <section className="card">
          <div className="card-heading">
            <div>
              <span className="eyebrow">Event staffing</span>
              <h2>Event Day Assignments</h2>
            </div>
          </div>

          {(events??[]).map(event=>{
            const roleDefinitions=[
              {key:"setup",label:"Setup Team"},
              {key:"opener",label:"Event Openers"},
              {key:"closer",label:"Event Closers"},
              {key:"teardown",label:"Tear Down Team"}
            ];
            const eventAssignments=(event.event_day_assignments??[]) as any[];
            const byRole=eventAssignments.reduce((acc:any,item:any)=>{
              (acc[item.assignment_role]??=[]).push(item);
              return acc;
            },{});
            const staffedCount=roleDefinitions.filter(role=>(byRole[role.key]?.length||0)>=2).length;

            return <div className="client-assignment-preview" key={event.id} style={{marginTop:14,paddingTop:14,borderTop:"1px solid var(--line)"}}>
              <div style={{display:"flex",justifyContent:"space-between",gap:12,alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <b>{event.title}</b>
                  <div className="muted" style={{fontSize:11}}>{new Date(event.start_at).toLocaleDateString()}</div>
                </div>
                <span className={`badge ${staffedCount===4?"badge-success":""}`}>{staffedCount}/4 staffed</span>
              </div>

              <div style={{display:"grid",gap:8}}>
                {roleDefinitions.map(role=>{
                  const assigned=byRole[role.key]??[];
                  const ready=assigned.length>=2;
                  return <div key={role.key} style={{border:"1px solid var(--line)",borderRadius:10,padding:"9px 10px",background:ready?"#eef7f1":"#fff7e8"}}>
                    <div style={{display:"flex",justifyContent:"space-between",gap:8,alignItems:"center"}}>
                      <b style={{fontSize:12}}>{role.label}</b>
                      <span style={{fontSize:10,fontWeight:800,color:ready?"#245c3e":"#77521a"}}>{assigned.length}/2 {ready?"Ready":"Required"}</span>
                    </div>
                    <div className="muted" style={{fontSize:11,marginTop:4}}>
                      {assigned.length
                        ? assigned.map((item:any)=>{
                            const profile=Array.isArray(item.profiles)?item.profiles[0]:item.profiles;
                            return profile?.full_name||"Name not set";
                          }).join(", ")
                        : "No team members assigned"}
                    </div>
                  </div>
                })}
              </div>

              <Link className="link-button" style={{display:"inline-block",marginTop:10}} href={`/app/calendar/${event.id}`}>Manage Assignments</Link>
            </div>
          })}

          {!events?.length&&<p className="muted">No calendar event is linked to this client yet.</p>}
        </section>

        <section className="card" style={{marginTop:16}}><h2>Tasks</h2>
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

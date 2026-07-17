import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addOrUpdateRoom, addTimelineItem, addVendor, deleteEvent,
  assignEventDayStaff, removeEventDayStaff,
  toggleChecklist, updateChecklistItem, updateEvent
} from "../actions";

function datePart(v:string){return new Date(v).toISOString().slice(0,10)}
function timePart(v:string){return new Date(v).toLocaleTimeString("en-US",{hour12:false,hour:"2-digit",minute:"2-digit"})}

const stages=["planning","contracted","finalizing","event_ready","event_day","completed"];
const stageLabel=(s:string)=>({
  planning:"Planning",contracted:"Contracted",finalizing:"Finalizing",
  event_ready:"Event Ready",event_day:"Event Day",completed:"Completed"
} as Record<string,string>)[s]||s;

export default async function EventDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();

  const [
    {data:event,error},{data:checklist},{data:timeline},
    {data:vendors},{data:rooms},{data:assignments},{data:teamProfiles}
  ]=await Promise.all([
    supabase.from("events").select("*,leads(id,name,email,phone,event_date)").eq("id",id).single(),
    supabase.from("event_checklist").select("*").eq("event_id",id).order("category").order("sort_order"),
    supabase.from("event_timeline").select("*").eq("event_id",id).order("item_time",{ascending:true,nullsFirst:false}),
    supabase.from("event_vendors").select("*").eq("event_id",id).order("vendor_type"),
    supabase.from("event_rooms").select("*").eq("event_id",id).order("room_name"),
    supabase.from("event_day_assignments").select("id,assignment_role,profile_id,profiles:profiles!event_day_assignments_profile_id_fkey(id,full_name,email)").eq("event_id",id).order("created_at"),
    supabase.from("profiles").select("id,full_name,email").eq("active",true).order("full_name")
  ]);

  if(error||!event) notFound();

  const complete=(checklist??[]).filter(x=>x.completed).length;
  const total=checklist?.length||0;
  const pct=total?Math.round((complete/total)*100):0;
  const grouped=(checklist??[]).reduce((acc:any,item:any)=>{
    (acc[item.category]??=[]).push(item);return acc;
  },{});

  const assignmentRoles=[
    {key:"setup",label:"Setup Team",description:"Pre-event room, table, chair, linen, and venue setup."},
    {key:"opener",label:"Event Openers",description:"Open the building, complete opening checks, and receive vendors."},
    {key:"closer",label:"Event Closers",description:"Complete closing checks, secure the venue, and lock the building."},
    {key:"teardown",label:"Tear Down Team",description:"Post-event teardown, cleanup coordination, and room reset."}
  ];
  const assignmentsByRole=(assignments??[]).reduce((acc:any,item:any)=>{
    (acc[item.assignment_role]??=[]).push(item);return acc;
  },{});
  const fullyStaffedRoles=assignmentRoles.filter(role=>(assignmentsByRole[role.key]?.length||0)>=2).length;

  return <>
    <div className="page-head">
      <div>
        <h1>{event.title}</h1>
        <div className="stat-row">
          <span className="stat-pill">{event.event_type}</span>
          <span className="stat-pill">{event.status}</span>
          <span className="stat-pill">{event.final_guest_count||event.guest_count||0} guests</span>
          <span className="stat-pill">{pct}% ready</span>
        </div>
      </div>
      <div className="actions">
        <Link className="btn btn-light" href="/app/calendar">Back to Calendar</Link>
        {event.lead_id&&<Link className="btn btn-gold" href={`/app/leads/${event.lead_id}`}>Open Client</Link>}
      </div>
    </div>

    <section className="event-day-assignments">
      <div className="event-assignment-heading">
        <div>
          <span className="eyebrow">Event staffing</span>
          <h2>Event Day Assignments</h2>
          <p>Every responsibility requires at least two assigned team members. Additional staff may be added as needed.</p>
        </div>
        <div className={`assignment-overall ${fullyStaffedRoles===4?"complete":"incomplete"}`}>
          <b>{fullyStaffedRoles}/4</b>
          <span>teams fully staffed</span>
        </div>
      </div>

      <div className="event-assignment-grid">
        {assignmentRoles.map(role=>{
          const roleAssignments=assignmentsByRole[role.key]??[];
          const remaining=Math.max(0,2-roleAssignments.length);
          const assignedIds=new Set(roleAssignments.map((item:any)=>item.profile_id));
          return <article className={`event-assignment-card ${remaining===0?"staffed":"needs-staff"}`} key={role.key}>
            <div className="event-assignment-card-head">
              <div>
                <div className={`assignment-role-mark role-${role.key}`} aria-hidden="true">{role.label.slice(0,1)}</div><div><h3>{role.label}</h3>
                <p>{role.description}</p></div>
              </div>
              <span className="assignment-count">{roleAssignments.length}/2 minimum</span>
            </div>

            <div className="assigned-person-list">
              {roleAssignments.map((assignment:any)=>{
                const profile=Array.isArray(assignment.profiles)?assignment.profiles[0]:assignment.profiles;
                const displayName=profile?.full_name||"Name not set";
                return <div className="assigned-person" key={assignment.id}>
                  <div className="assigned-person-avatar">{displayName.slice(0,1).toUpperCase()}</div>
                  <div className="assigned-person-copy"><b>{displayName}</b><small>Assigned team member</small></div>
                  <form action={removeEventDayStaff.bind(null,assignment.id,id)}>
                    <button className="assignment-remove" type="submit" aria-label={`Remove ${displayName}`}>Remove</button>
                  </form>
                </div>
              })}
              {!roleAssignments.length&&<div className="assignment-empty">No team members assigned.</div>}
            </div>

            <form action={assignEventDayStaff.bind(null,id,role.key)} className="assignment-add-form">
              <select name="profile_id" required defaultValue="">
                <option value="" disabled>Add a team member...</option>
                {(teamProfiles??[]).filter(profile=>!assignedIds.has(profile.id)).map(profile=><option value={profile.id} key={profile.id}>
                  {profile.full_name||"Name not set"}
                </option>)}
              </select>
              <button className="btn btn-light" type="submit">Add</button>
            </form>

            <div className={`assignment-status ${remaining===0?"complete":"warning"}`}>
              {remaining===0?"Fully staffed":`${remaining} more ${remaining===1?"person":"people"} required`}
            </div>
          </article>
        })}
      </div>
    </section>

    <div className="workflow-bar">
      {stages.map((s,i)=>{
        const current=stages.indexOf(event.workflow_stage||"planning");
        return <div key={s} className={`workflow-step ${i===current?"active":i<current?"complete":""}`}>{stageLabel(s)}</div>
      })}
    </div>

    <div className="ops-summary">
      <div className="ops-metric"><span className="muted">Checklist</span><b>{complete}/{total}</b></div>
      <div className="ops-metric"><span className="muted">Vendors</span><b>{vendors?.length||0}</b></div>
      <div className="ops-metric"><span className="muted">Rooms</span><b>{rooms?.length||0}</b></div>
      <div className="ops-metric"><span className="muted">Timeline Items</span><b>{timeline?.length||0}</b></div>
    </div>
    <div className="progress-track" style={{margin:"12px 0 18px"}}><div className="progress-fill" style={{width:`${pct}%`}}/></div>

    <div className="detail-grid">
      <div>
        <section className="card">
          <h2>Event Workflow</h2>
          <form action={updateEvent.bind(null,id)} className="form-grid">
            <div><label>Workflow Stage</label>
              <select name="workflow_stage" defaultValue={event.workflow_stage||"planning"}>
                {stages.map(s=><option key={s} value={s}>{stageLabel(s)}</option>)}
              </select>
            </div>
            <div><label>Event Status</label>
              <select name="status" defaultValue={event.status}>
                <option value="scheduled">Scheduled</option><option value="tentative">Tentative</option>
                <option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div><label>Title</label><input name="title" defaultValue={event.title}/></div>
            <div><label>Event Type</label>
              <select name="event_type" defaultValue={event.event_type}>
                <option>Wedding</option><option>Corporate Event</option><option>Private Event</option>
                <option>Tour</option><option>Hold</option><option>Maintenance</option><option>Other</option>
              </select>
            </div>
            <div><label>Start Date</label><input name="start_date" type="date" defaultValue={datePart(event.start_at)}/></div>
            <div><label>Start Time</label><input name="start_time" type="time" defaultValue={timePart(event.start_at)}/></div>
            <div><label>End Date</label><input name="end_date" type="date" defaultValue={datePart(event.end_at)}/></div>
            <div><label>End Time</label><input name="end_time" type="time" defaultValue={timePart(event.end_at)}/></div>
            <div><label>Estimated Guests</label><input name="guest_count" type="number" min="0" defaultValue={event.guest_count||0}/></div>
            <div><label>Final Guest Count</label><input name="final_guest_count" type="number" min="0" defaultValue={event.final_guest_count||""}/></div>
            <div><label>Primary Contact</label><input name="primary_contact" defaultValue={event.primary_contact||(event.leads as any)?.name||""}/></div>
            <div><label>Primary Phone</label><input name="primary_phone" defaultValue={event.primary_phone||(event.leads as any)?.phone||""}/></div>
            <div><label>Emergency Contact</label><input name="emergency_contact" defaultValue={event.emergency_contact||""}/></div>
            <div><label>Emergency Phone</label><input name="emergency_phone" defaultValue={event.emergency_phone||""}/></div>
            <div><label>Floor Plan Status</label>
              <select name="floor_plan_status" defaultValue={event.floor_plan_status||"not_started"}>
                <option value="not_started">Not Started</option><option value="draft">Draft</option>
                <option value="client_review">Client Review</option><option value="approved">Approved</option>
              </select>
            </div>
            <div><label>Assigned Staff</label><input name="assigned_staff" defaultValue={event.assigned_staff?.join(", ")||""}/></div>

            <div className="full"><label>Spaces</label>
              <div className="space-pills">
                {["Ballroom","Auditorium","Conference Room","Bridal Suite","Groom’s Suite","Lobby","Exterior Grounds"].map(s=>
                  <label key={s} style={{textTransform:"none",fontSize:13}}>
                    <input style={{width:"auto",minHeight:0,marginRight:6}} type="checkbox" name="spaces" value={s} defaultChecked={event.spaces?.includes(s)}/>{s}
                  </label>
                )}
              </div>
            </div>

            <div><label>Event Manager</label><input name="event_manager" defaultValue={event.event_manager||""}/></div>
            <div><label>Bar Manager</label><input name="bar_manager" defaultValue={event.bar_manager||""}/></div>
            <div><label>Security Lead</label><input name="security_lead" defaultValue={event.security_lead||""}/></div>
            <div><label>Setup Lead</label><input name="setup_lead" defaultValue={event.setup_lead||""}/></div>
            <div><label>Cleanup Lead</label><input name="cleanup_lead" defaultValue={event.cleanup_lead||""}/></div>

            <div className="full"><label>Vendor Notes</label><textarea name="vendor_notes" defaultValue={event.vendor_notes||""}/></div>
            <div className="full"><label>Setup Notes</label><textarea name="setup_notes" defaultValue={event.setup_notes||""}/></div>
            <div className="full"><label>Teardown Notes</label><textarea name="teardown_notes" defaultValue={event.teardown_notes||""}/></div>
            <div className="full"><label>Internal Notes</label><textarea name="internal_notes" defaultValue={event.internal_notes||""}/></div>
            <div className="full"><label>Incident / Damage Notes</label><textarea name="incident_notes" defaultValue={event.incident_notes||""}/></div>

            <div className="full"><button className="btn btn-primary" type="submit">Save Event Workflow</button></div>
          </form>
        </section>

        <section className="card" style={{marginTop:16}}>
          <h2>Event Timeline</h2>
          <form action={addTimelineItem.bind(null,id)} className="form-grid">
            <div><label>Time</label><input name="item_time" type="time"/></div>
            <div><label>Timeline Item</label><input name="title" placeholder="Vendor arrival, ceremony, dinner, teardown..." required/></div>
            <div className="full"><label>Notes</label><input name="notes"/></div>
            <div className="full"><button className="btn btn-light" type="submit">Add Timeline Item</button></div>
          </form>
          <div className="timeline-table" style={{marginTop:14}}>
            {(timeline??[]).map(t=><div className="timeline-row" key={t.id}>
              <b>{t.item_time?.slice(0,5)||"TBD"}</b>
              <div><b>{t.title}</b><div className="muted">{t.notes||""}</div></div>
            </div>)}
            {!timeline?.length&&<p className="muted">No timeline items yet.</p>}
          </div>
        </section>

        <section className="card" style={{marginTop:16}}>
          <h2>Vendors</h2>
          <form action={addVendor.bind(null,id)} className="form-grid">
            <div><label>Vendor Type</label>
              <select name="vendor_type"><option>Caterer</option><option>Bartender</option><option>DJ / Band</option><option>Photographer</option><option>Florist</option><option>Decorator</option><option>Security</option><option>Rental Company</option><option>Other</option></select>
            </div>
            <div><label>Company Name</label><input name="company_name" required/></div>
            <div><label>Contact Name</label><input name="contact_name"/></div>
            <div><label>Phone</label><input name="phone"/></div>
            <div><label>Email</label><input name="email" type="email"/></div>
            <div><label>Arrival Time</label><input name="arrival_time" type="time"/></div>
            <div><label>Departure Time</label><input name="departure_time" type="time"/></div>
            <div><label>Confirmed</label><input name="confirmed" type="checkbox" style={{width:"auto"}}/></div>
            <div className="full"><label>Notes</label><textarea name="notes"/></div>
            <div className="full"><button className="btn btn-light" type="submit">Add Vendor</button></div>
          </form>

          <div className="vendor-grid" style={{marginTop:14}}>
            {(vendors??[]).map(v=><div className="vendor-card" key={v.id}>
              <h4>{v.company_name}</h4>
              <div className="muted">{v.vendor_type} · {v.confirmed?"Confirmed":"Not confirmed"}</div>
              <p>{v.contact_name||""}<br/>{v.phone||""}<br/>{v.email||""}</p>
              <small>Arrival: {v.arrival_time?.slice(0,5)||"TBD"} · Departure: {v.departure_time?.slice(0,5)||"TBD"}</small>
              {v.notes&&<p>{v.notes}</p>}
            </div>)}
          </div>
        </section>

        <section className="card" style={{marginTop:16}}>
          <h2>Room Setup</h2>
          <form action={addOrUpdateRoom.bind(null,id)} className="form-grid">
            <div><label>Room</label>
              <select name="room_name">
                <option>Ballroom</option><option>Auditorium</option><option>Conference Room</option>
                <option>Bridal Suite</option><option>Groom’s Suite</option><option>Lobby</option>
              </select>
            </div>
            <div><label>Setup Style</label><input name="setup_style" placeholder="Rounds, banquet, theatre, cocktail..."/></div>
            <div><label>Table Count</label><input name="table_count" type="number" min="0"/></div>
            <div><label>Chair Count</label><input name="chair_count" type="number" min="0"/></div>
            <div><label>Linen Color</label><input name="linen_color"/></div>
            <div><label>Ready</label><input name="ready" type="checkbox" style={{width:"auto"}}/></div>
            <div className="full"><label>Layout Notes</label><textarea name="layout_notes"/></div>
            <div className="full"><button className="btn btn-light" type="submit">Save Room Setup</button></div>
          </form>

          <div className="room-grid" style={{marginTop:14}}>
            {(rooms??[]).map(r=><div className="room-card" key={r.id}>
              <h4>{r.room_name}</h4>
              <p><b>Setup:</b> {r.setup_style||"Not set"}<br/>
              <b>Tables:</b> {r.table_count} · <b>Chairs:</b> {r.chair_count}<br/>
              <b>Linens:</b> {r.linen_color||"Not set"}<br/>
              <b>Status:</b> {r.ready?"Ready":"Not ready"}</p>
              {r.layout_notes&&<p>{r.layout_notes}</p>}
            </div>)}
          </div>
        </section>
      </div>

      <aside>
        <section className="card">
          <h2>Operations Checklist</h2>
          {Object.entries(grouped).map(([category,items]:any)=><div className="check-group" key={category}>
            <h4>{category}</h4>
            {(items as any[]).map(item=><div key={item.id} style={{marginBottom:10}}>
              <form action={toggleChecklist.bind(null,item.id,id,item.completed)}>
                <button type="submit" className={`check-item ${item.completed?"done":""}`} style={{width:"100%"}}>
                  <span>{item.completed?"✓ ":""}{item.label}</span>
                  <span className="badge">{item.completed?"Done":"Open"}</span>
                </button>
              </form>
              <form action={updateChecklistItem.bind(null,item.id,id)} className="form-grid" style={{marginTop:6}}>
                <div><input name="due_date" type="date" defaultValue={item.due_date||""}/></div>
                <div><input name="responsible_staff" placeholder="Responsible staff" defaultValue={item.responsible_staff||""}/></div>
                <div className="full"><input name="notes" placeholder="Checklist notes" defaultValue={item.notes||""}/></div>
                <div className="full"><button className="btn btn-light" type="submit">Save Item Details</button></div>
              </form>
            </div>)}
          </div>)}
        </section>

        <section className="card" style={{marginTop:16}}>
          <h2>Event-Day Assignments</h2>
          <div className="assignment-grid">
            <div className="assignment-card"><b>Event Manager</b><div>{event.event_manager||"Unassigned"}</div></div>
            <div className="assignment-card"><b>Bar Manager</b><div>{event.bar_manager||"Unassigned"}</div></div>
            <div className="assignment-card"><b>Security Lead</b><div>{event.security_lead||"Unassigned"}</div></div>
            <div className="assignment-card"><b>Setup Lead</b><div>{event.setup_lead||"Unassigned"}</div></div>
            <div className="assignment-card"><b>Cleanup Lead</b><div>{event.cleanup_lead||"Unassigned"}</div></div>
          </div>
        </section>

        <section className="card" style={{marginTop:16}}>
          <h2>Danger Zone</h2>
          <form action={deleteEvent.bind(null,id)}>
            <button className="btn" style={{background:"#f1deda",color:"#8a3c36"}} type="submit">Delete Calendar Event</button>
          </form>
        </section>
      </aside>
    </div>
  </>;
}

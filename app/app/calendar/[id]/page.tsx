import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addTimelineItem, deleteEvent, toggleChecklist, updateEvent } from "../actions";

function datePart(v:string){return new Date(v).toISOString().slice(0,10)}
function timePart(v:string){return new Date(v).toLocaleTimeString("en-US",{hour12:false,hour:"2-digit",minute:"2-digit"})}

export default async function EventDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();

  const [{data:event,error},{data:checklist},{data:timeline}]=await Promise.all([
    supabase.from("events").select("*,leads(id,name,email,phone,event_date)").eq("id",id).single(),
    supabase.from("event_checklist").select("*").eq("event_id",id).order("sort_order"),
    supabase.from("event_timeline").select("*").eq("event_id",id).order("item_time",{ascending:true,nullsFirst:false}).order("sort_order")
  ]);

  if(error||!event) notFound();

  const start=new Date(event.start_at);
  const end=new Date(event.end_at);
  const complete=(checklist??[]).filter(x=>x.completed).length;
  const total=checklist?.length||0;

  return <>
    <div className="page-head">
      <div>
        <h1>{event.title}</h1>
        <div className="stat-row">
          <span className="stat-pill">{event.event_type}</span>
          <span className="stat-pill">{event.status}</span>
          <span className="stat-pill">{event.guest_count||0} guests</span>
          <span className="stat-pill">{complete}/{total} checklist items</span>
        </div>
      </div>
      <div className="actions">
        <Link className="btn btn-light" href="/app/calendar">Back to Calendar</Link>
        {event.lead_id&&<Link className="btn btn-gold" href={`/app/leads/${event.lead_id}`}>Open Client</Link>}
      </div>
    </div>

    <div className="event-meta-grid">
      <div className="event-meta"><label>Start</label><div>{start.toLocaleString()}</div></div>
      <div className="event-meta"><label>End</label><div>{end.toLocaleString()}</div></div>
      <div className="event-meta"><label>Client</label><div>{event.leads?.name||"Not linked"}</div></div>
      <div className="event-meta"><label>Assigned Staff</label><div>{event.assigned_staff?.join(", ")||"Unassigned"}</div></div>
    </div>

    <div className="detail-grid">
      <div>
        <section className="card">
          <h2>Event Details</h2>
          <form action={updateEvent.bind(null,id)} className="form-grid">
            <div><label>Title</label><input name="title" defaultValue={event.title}/></div>
            <div><label>Event Type</label><select name="event_type" defaultValue={event.event_type}><option>Wedding</option><option>Corporate Event</option><option>Private Event</option><option>Tour</option><option>Hold</option><option>Maintenance</option><option>Other</option></select></div>
            <div><label>Status</label><select name="status" defaultValue={event.status}><option value="scheduled">Scheduled</option><option value="tentative">Tentative</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></div>
            <div><label>Guest Count</label><input name="guest_count" type="number" min="0" defaultValue={event.guest_count||0}/></div>
            <div><label>Start Date</label><input name="start_date" type="date" defaultValue={datePart(event.start_at)}/></div>
            <div><label>Start Time</label><input name="start_time" type="time" defaultValue={timePart(event.start_at)}/></div>
            <div><label>End Date</label><input name="end_date" type="date" defaultValue={datePart(event.end_at)}/></div>
            <div><label>End Time</label><input name="end_time" type="time" defaultValue={timePart(event.end_at)}/></div>
            <div className="full"><label>Spaces</label>
              <div className="space-pills">
                {["Ballroom","Auditorium","Conference Room","Bridal Suite","Groom’s Suite","Lobby","Exterior Grounds"].map(s=><label key={s} style={{textTransform:"none",fontSize:13}}><input style={{width:"auto",minHeight:0,marginRight:6}} type="checkbox" name="spaces" value={s} defaultChecked={event.spaces?.includes(s)}/>{s}</label>)}
              </div>
            </div>
            <div className="full"><label>Assigned Staff</label><input name="assigned_staff" defaultValue={event.assigned_staff?.join(", ")||""}/></div>
            <div className="full"><label>Vendor Notes</label><textarea name="vendor_notes" defaultValue={event.vendor_notes||""}/></div>
            <div className="full"><label>Setup Notes</label><textarea name="setup_notes" defaultValue={event.setup_notes||""}/></div>
            <div className="full"><label>Teardown Notes</label><textarea name="teardown_notes" defaultValue={event.teardown_notes||""}/></div>
            <div className="full"><label>Internal Notes</label><textarea name="internal_notes" defaultValue={event.internal_notes||""}/></div>
            <div className="full"><button className="btn btn-primary" type="submit">Save Event</button></div>
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
      </div>

      <aside>
        <section className="card">
          <h2>Operations Checklist</h2>
          <div className="checklist">
            {(checklist??[]).map(item=><form action={toggleChecklist.bind(null,item.id,id,item.completed)} key={item.id}>
              <button type="submit" className={`check-item ${item.completed?"done":""}`} style={{width:"100%"}}>
                <span>{item.completed?"✓ ":""}{item.label}</span>
                <span className="badge">{item.completed?"Done":"Open"}</span>
              </button>
            </form>)}
          </div>
        </section>

        <section className="card" style={{marginTop:16}}>
          <h2>Spaces</h2>
          <div className="space-pills">{event.spaces?.length?event.spaces.map((s:string)=><span className="space-pill" key={s}>{s}</span>):<span className="muted">No spaces assigned.</span>}</div>
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

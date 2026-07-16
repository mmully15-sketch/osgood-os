import { createClient } from "@/lib/supabase/server";
import { createEvent } from "../actions";

export default async function NewEventPage(){
  const supabase=await createClient();
  const {data:leads}=await supabase.from("leads").select("id,name,event_date").neq("status","lost").order("event_date",{ascending:true,nullsFirst:false});

  return <>
    <section className="hero">
      <h1>Add Calendar Event</h1>
      <p>Create a wedding, tour, hold, private event, corporate event, maintenance block, or internal operational event.</p>
    </section>

    <section className="card">
      <form action={createEvent} className="form-grid">
        <div className="full"><label>Linked Client</label>
          <select name="lead_id">
            <option value="">No linked client</option>
            {(leads??[]).map(l=><option key={l.id} value={l.id}>{l.name} · {l.event_date||"No date"}</option>)}
          </select>
        </div>
        <div><label>Event Title</label><input name="title" required/></div>
        <div><label>Event Type</label>
          <select name="event_type">
            <option>Wedding</option><option>Corporate Event</option><option>Private Event</option>
            <option>Tour</option><option>Hold</option><option>Maintenance</option><option>Other</option>
          </select>
        </div>
        <div><label>Status</label><select name="status"><option value="scheduled">Scheduled</option><option value="tentative">Tentative</option><option value="confirmed">Confirmed</option><option value="cancelled">Cancelled</option></select></div>
        <div><label>Guest Count</label><input name="guest_count" type="number" min="0" defaultValue="0"/></div>
        <div><label>Start Date</label><input name="start_date" type="date" required/></div>
        <div><label>Start Time</label><input name="start_time" type="time" defaultValue="09:00"/></div>
        <div><label>End Date</label><input name="end_date" type="date"/></div>
        <div><label>End Time</label><input name="end_time" type="time" defaultValue="23:00"/></div>
        <div className="full"><label>Spaces</label>
          <div className="space-pills">
            {["Ballroom","Auditorium","Conference Room","Bridal Suite","Groom’s Suite","Lobby","Exterior Grounds"].map(s=><label key={s} style={{textTransform:"none",fontSize:13}}><input style={{width:"auto",minHeight:0,marginRight:6}} type="checkbox" name="spaces" value={s}/>{s}</label>)}
          </div>
        </div>
        <div className="full"><label>Assigned Staff</label><input name="assigned_staff" placeholder="Comma-separated names"/></div>
        <div className="full"><label>Vendor Notes</label><textarea name="vendor_notes"/></div>
        <div className="full"><label>Setup Notes</label><textarea name="setup_notes"/></div>
        <div className="full"><label>Teardown Notes</label><textarea name="teardown_notes"/></div>
        <div className="full"><label>Internal Notes</label><textarea name="internal_notes"/></div>
        <div className="full"><button className="btn btn-primary" type="submit">Create Event</button></div>
      </form>
    </section>
  </>;
}

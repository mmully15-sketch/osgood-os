import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createLead } from "./actions";

export default async function LeadsPage({searchParams}:{searchParams:Promise<{q?:string,status?:string}>}){
  const params=await searchParams;
  const q=(params.q||"").trim(), status=params.status||"";
  const supabase=await createClient();
  let query=supabase.from("leads").select("*").order("event_date",{ascending:true,nullsFirst:false});
  if(q) query=query.or(`name.ilike.%${q}%,partner.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%`);
  if(status) query=query.eq("status",status);
  const {data:leads,error}=await query;
  if(error) throw new Error(error.message);

  return <>
    <section className="hero"><h1>Clients & Leads</h1><p className="muted">Search, create, and manage every inquiry and booked event.</p></section>
    <form className="searchbar">
      <input name="q" defaultValue={q} placeholder="Search name, email, phone, or organization"/>
      <select name="status" defaultValue={status}>
        <option value="">All statuses</option><option value="inquiry">Inquiry</option><option value="toured">Toured</option>
        <option value="quoted">Quoted</option><option value="contracted">Contracted</option><option value="booked">Booked</option><option value="lost">Lost</option>
      </select>
      <button className="btn btn-primary" type="submit">Search</button><Link className="btn btn-light" href="/app/leads">Clear</Link>
    </form>
    <div className="grid">
      <section className="card span-4">
        <h2>Add Lead</h2>
        <form action={createLead} className="form-grid">
          <div className="full"><label>Client Name</label><input name="name" required/></div>
          <div className="full"><label>Partner / Organization</label><input name="partner"/></div>
          <div className="full"><label>Email</label><input name="email" type="email"/></div>
          <div className="full"><label>Phone</label><input name="phone"/></div>
          <div className="full"><label>Event Type</label><select name="event_type"><option>Wedding</option><option>Corporate Event</option><option>Private Event</option><option>Nonprofit Event</option><option>Other</option></select></div>
          <div><label>Event Date</label><input name="event_date" type="date"/></div>
          <div><label>Guests</label><input name="guests" type="number" min="0" defaultValue="0"/></div>
          <div><label>Source</label><select name="source"><option>Website</option><option>Social Media</option><option>Referral</option><option>Phone</option><option>Walk-in</option><option>Wedding Show</option><option>Other</option></select></div>
          <div><label>Status</label><select name="status"><option value="inquiry">Inquiry</option><option value="toured">Toured</option><option value="quoted">Quoted</option><option value="contracted">Contracted</option><option value="booked">Booked</option><option value="lost">Lost</option></select></div>
          <div><label>Follow-up</label><input name="follow_up_date" type="date"/></div>
          <div><label>Assigned Staff</label><input name="assigned_staff"/></div>
          <div className="full"><label>Lost Reason</label><input name="lost_reason"/></div>
          <div className="full"><label>Notes</label><textarea name="notes"/></div>
          <div className="full"><button className="btn btn-primary" type="submit">Save Lead</button></div>
        </form>
      </section>
      <section className="card span-8" style={{overflowX:"auto"}}>
        <h2>Shared Lead Records</h2><p className="muted">{leads?.length||0} matching record(s)</p>
        <table><thead><tr><th>Client</th><th>Event</th><th>Date</th><th>Status</th><th>Follow-up</th><th></th></tr></thead>
          <tbody>{(leads??[]).map(l=><tr key={l.id}>
            <td><b>{l.name}</b><br/><span className="muted">{l.email||l.phone||l.partner||""}</span></td>
            <td>{l.event_type}<br/><span className="muted">{l.guests?`${l.guests} guests`:""}</span></td>
            <td>{l.event_date||"Not set"}</td><td><span className="badge">{l.status}</span></td><td>{l.follow_up_date||"Not set"}</td>
            <td><Link className="link-button" href={`/app/leads/${l.id}`}>Open</Link></td>
          </tr>)}</tbody>
        </table>
      </section>
    </div>
  </>;
}

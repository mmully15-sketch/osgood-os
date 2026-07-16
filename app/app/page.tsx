import { createClient } from "@/lib/supabase/server";

export default async function Dashboard(){
  const supabase=await createClient();
  const [{count:leadCount},{count:quoteCount},{count:bookedCount},{data:recent}] = await Promise.all([
    supabase.from("leads").select("*",{count:"exact",head:true}).not("status","in","(booked,lost)"),
    supabase.from("quotes").select("*",{count:"exact",head:true}),
    supabase.from("leads").select("*",{count:"exact",head:true}).eq("status","booked"),
    supabase.from("leads").select("id,name,event_type,event_date,status,follow_up_date").order("updated_at",{ascending:false}).limit(6)
  ]);

  return <>
    <section className="hero">
      <h1>Sales Dashboard</h1>
      <p className="muted">Shared, live venue records for authorized Osgood staff.</p>
    </section>

    <div className="grid">
      <div className="card span-4">
        <div className="kpi-label">Active Leads</div>
        <div className="kpi-value">{leadCount??0}</div>
      </div>
      <div className="card span-4">
        <div className="kpi-label">Quotes</div>
        <div className="kpi-value">{quoteCount??0}</div>
      </div>
      <div className="card span-4">
        <div className="kpi-label">Booked Events</div>
        <div className="kpi-value">{bookedCount??0}</div>
      </div>

      <div className="card span-12">
        <h2>Recent Leads</h2>
        <table>
          <thead><tr><th>Client</th><th>Event</th><th>Date</th><th>Status</th><th>Follow-up</th></tr></thead>
          <tbody>
            {(recent??[]).map(r=><tr key={r.id}>
              <td>{r.name}</td>
              <td>{r.event_type}</td>
              <td>{r.event_date||"Not set"}</td>
              <td><span className="badge">{r.status}</span></td>
              <td>{r.follow_up_date||"Not set"}</td>
            </tr>)}
          </tbody>
        </table>
      </div>
    </div>
  </>;
}

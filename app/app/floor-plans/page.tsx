import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createFloorPlan } from "./actions";

export default async function FloorPlansPage(){
  const supabase=await createClient();
  const [{data:plans,error},{data:events}]=await Promise.all([
    supabase.from("floor_plans")
      .select("id,name,status,revision,updated_at,event_id,events(title,start_at)")
      .order("updated_at",{ascending:false}),
    supabase.from("events")
      .select("id,title,start_at")
      .neq("status","cancelled")
      .order("start_at",{ascending:true})
  ]);

  if(error) throw new Error(error.message);

  return <>
    <section className="hero">
      <h1>Ballroom Floor Plans</h1>
      <p>Create table layouts, assign linens, calculate seating, identify overlaps, and print setup sheets for the Ballroom.</p>
    </section>

    <div className="grid">
      <section className="card span-4">
        <h2>New Ballroom Plan</h2>
        <form action={createFloorPlan} className="form-grid">
          <div className="full">
            <label>Plan Name</label>
            <input name="name" placeholder="Smith Wedding - Final Layout" required/>
          </div>
          <div className="full">
            <label>Link to Event</label>
            <select name="event_id">
              <option value="">No linked event</option>
              {(events??[]).map(e=><option key={e.id} value={e.id}>
                {e.title} · {new Date(e.start_at).toLocaleDateString()}
              </option>)}
            </select>
          </div>
          <div className="full">
            <button className="btn btn-primary" type="submit">Create Floor Plan</button>
          </div>
        </form>
      </section>

      <section className="card span-8">
        <div className="page-head">
          <div><h2>Saved Plans</h2></div>
        </div>
        <div className="quick-list">
          {(plans??[]).map(p=>{
            const event=Array.isArray(p.events)?p.events[0]:p.events;
            return <Link className="quick-item" href={`/app/floor-plans/${p.id}`} key={p.id}>
              <div>
                <b>{p.name}</b>
                <div className="muted">
                  {event?.title||"No linked event"} · Revision {p.revision}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <span className="badge">{p.status}</span>
                <div className="muted">{new Date(p.updated_at).toLocaleDateString()}</div>
              </div>
            </Link>
          })}
          {!plans?.length&&<p className="muted">No floor plans created yet.</p>}
        </div>
      </section>
    </div>
  </>;
}

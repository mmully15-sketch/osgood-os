import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(Number(n)||0);
const dateLabel=(value:string|null)=>value?new Date(`${value}T12:00:00`).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}):"Date not set";

export default async function QuotesPage({
  searchParams
}:{
  searchParams:Promise<{q?:string;status?:string}>
}){
  const params=await searchParams;
  const supabase=await createClient();

  let query=supabase.from("quotes").select("*").order("created_at",{ascending:false});
  if(params.status&&params.status!=="all") query=query.eq("status",params.status);
  if(params.q?.trim()){
    const term=params.q.trim().replaceAll(","," ");
    query=query.or(`quote_number.ilike.%${term}%,client_name.ilike.%${term}%,event_type.ilike.%${term}%`);
  }

  const {data:quotes,error}=await query;
  if(error) throw new Error(error.message);

  const counts=(quotes??[]).reduce((acc:Record<string,number>,q:any)=>{
    acc[q.status]=(acc[q.status]||0)+1;
    return acc;
  },{});

  return <>
    <section className="hero quote-index-hero">
      <div>
        <span className="eyebrow">Sales & proposals</span>
        <h1>Quotes</h1>
        <p className="muted">Create, refine, present, and track every Osgood proposal from one place.</p>
      </div>
      <Link className="btn btn-gold" href="/app/calculator">+ New Quote</Link>
    </section>

    <section className="quote-toolbar card">
      <form className="quote-search" method="get">
        <input name="q" defaultValue={params.q||""} placeholder="Search quote, client, or event type"/>
        <select name="status" defaultValue={params.status||"all"}>
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="sent">Sent</option>
          <option value="accepted">Accepted</option>
          <option value="declined">Declined</option>
          <option value="expired">Expired</option>
        </select>
        <button className="btn btn-light" type="submit">Filter</button>
        {(params.q||params.status)&&<Link className="link-button" href="/app/quotes">Clear</Link>}
      </form>
    </section>

    <div className="quote-summary-grid">
      {[
        ["All",(quotes??[]).length],
        ["Draft",counts.draft||0],
        ["Sent",counts.sent||0],
        ["Accepted",counts.accepted||0]
      ].map(([label,value])=><div className="quote-summary-card" key={String(label)}>
        <span>{label}</span><b>{value}</b>
      </div>)}
    </div>

    <section className="quote-card-grid">
      {(quotes??[]).map((q:any)=><article className="quote-card" key={q.id}>
        <Link className="quote-card-main" href={`/app/quotes/${q.id}`}>
          <div className="quote-card-top">
            <div>
              <span className="eyebrow">{q.quote_number}</span>
              <h2>{q.client_name}</h2>
            </div>
            <span className={`quote-status status-${q.status}`}>{q.status}</span>
          </div>

          <div className="quote-card-event">
            <b>{q.event_type||"Event"}</b>
            <span>{dateLabel(q.event_date)}</span>
          </div>

          <div className="quote-card-money">
            <div><span>Total investment</span><b>{money(q.total)}</b></div>
            <div><span>Remaining balance</span><b>{money(q.balance)}</b></div>
          </div>
        </Link>

        <div className="quote-card-actions">
          <Link className="btn btn-primary" href={`/app/quotes/${q.id}`}>Open Proposal</Link>
          <Link className="btn btn-light" href={`/app/quotes/${q.id}/edit`}>Edit</Link>
        </div>
      </article>)}

      {!quotes?.length&&<section className="card empty-state">
        <span className="eyebrow">No matching proposals</span>
        <h2>Create your first quote</h2>
        <p className="muted">Build a quote in the Pricing Calculator and it will appear here automatically.</p>
        <Link className="btn btn-gold" href="/app/calculator">Open Pricing Calculator</Link>
      </section>}
    </section>
  </>;
}

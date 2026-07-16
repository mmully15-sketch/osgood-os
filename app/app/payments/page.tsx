import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n)||0);

export default async function PaymentsPage(){
  const supabase=await createClient();
  const today=new Date().toISOString().slice(0,10);

  const [{data:quotes},{data:schedules},{data:payments}]=await Promise.all([
    supabase.from("quotes").select("id,quote_number,client_name,event_date,total,balance,status").order("event_date",{ascending:true,nullsFirst:false}),
    supabase.from("payment_schedules").select("*,quotes(id,quote_number,client_name,event_date)").order("due_date",{ascending:true,nullsFirst:false}),
    supabase.from("payments").select("*")
  ]);

  const totalOutstanding=(quotes??[]).reduce((s,q)=>s+Number(q.balance||0),0);
  const totalPaid=(payments??[]).reduce((s,p)=>s+Number(p.amount||0),0);
  const overdue=(schedules??[]).filter(s=>s.status!=="paid"&&s.due_date&&s.due_date<today);
  const dueSoon=(schedules??[]).filter(s=>s.status!=="paid"&&s.due_date&&s.due_date>=today);

  return <>
    <section className="hero">
      <h1>Payments & Balances</h1>
      <p>Track deposits, installments, final balances, due dates, overdue amounts, and payment history.</p>
    </section>

    <div className="payment-grid">
      <div className="payment-stat"><span className="muted">Total Collected</span><b>{money(totalPaid)}</b></div>
      <div className="payment-stat"><span className="muted">Outstanding Balance</span><b>{money(totalOutstanding)}</b></div>
      <div className="payment-stat"><span className="muted">Overdue Items</span><b>{overdue.length}</b></div>
      <div className="payment-stat"><span className="muted">Upcoming Items</span><b>{dueSoon.length}</b></div>
    </div>

    <section className="card" style={{marginTop:18}}>
      <h2>Overdue Payments</h2>
      <div className="payment-list">
        {overdue.map(s=><Link href={`/app/quotes/${s.quote_id}`} className="payment-row overdue" key={s.id}>
          <div><b>{(s.quotes as any)?.client_name}</b><div className="muted">{s.label} · {(s.quotes as any)?.quote_number}</div></div>
          <b>{money(s.amount)}</b><span>{s.due_date}</span><span className="badge">Overdue</span>
        </Link>)}
        {!overdue.length&&<p className="muted">No overdue payment schedule items.</p>}
      </div>
    </section>

    <section className="card" style={{marginTop:18}}>
      <h2>Client Balances</h2>
      <div style={{overflowX:"auto"}}>
        <table><thead><tr><th>Client</th><th>Quote</th><th>Event Date</th><th>Total</th><th>Balance</th><th>Status</th><th></th></tr></thead>
        <tbody>{(quotes??[]).map(q=><tr key={q.id}>
          <td><b>{q.client_name}</b></td><td>{q.quote_number}</td><td>{q.event_date||"Not set"}</td>
          <td>{money(q.total)}</td><td>{money(q.balance)}</td><td><span className="badge">{q.status}</span></td>
          <td><Link className="link-button" href={`/app/quotes/${q.id}`}>Open</Link></td>
        </tr>)}</tbody></table>
      </div>
    </section>
  </>;
}

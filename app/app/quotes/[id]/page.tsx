import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { addPaymentSchedule, recordPayment, updateQuoteStatus } from "../actions";
import PrintButton from "@/components/PrintButton";

const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n)||0);

export default async function QuoteDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();

  const [{data:q,error},{data:schedules},{data:payments}]=await Promise.all([
    supabase.from("quotes").select("*,leads(id,name,email,phone,event_date)").eq("id",id).single(),
    supabase.from("payment_schedules").select("*").eq("quote_id",id).order("sort_order").order("due_date",{ascending:true,nullsFirst:false}),
    supabase.from("payments").select("*").eq("quote_id",id).order("payment_date",{ascending:false})
  ]);

  if(error||!q) notFound();

  const payload=q.payload||{};
  const lineItems=[
    {label:payload.packageName||payload.package||"Venue Rental",amount:Number(payload.calculation?.base||q.total)},
    ...(Number(payload.calculation?.suiteCost||0)>0?[{label:"Suite Add-on",amount:Number(payload.calculation.suiteCost)}]:[]),
    ...(Number(payload.calculation?.earlyCost||0)>0?[{label:"Early Access",amount:Number(payload.calculation.earlyCost)}]:[]),
    ...(Number(payload.calculation?.lateCost||0)>0?[{label:"After-hours Extension",amount:Number(payload.calculation.lateCost)}]:[]),
    ...(Number(payload.calculation?.securityCost||0)>0?[{label:"Security",amount:Number(payload.calculation.securityCost)}]:[]),
    ...(Number(payload.av||0)>0?[{label:"AV Package",amount:Number(payload.av)}]:[]),
    ...(Number(payload.customAmount||0)>0?[{label:payload.customName||"Custom Add-on",amount:Number(payload.customAmount)}]:[])
  ];
  const paid=(payments??[]).reduce((s,p)=>s+Number(p.amount||0),0);

  return <>
    <section className="hero no-print">
      <h1>{q.quote_number}</h1>
      <p>{q.client_name} · {q.event_type||"Event"} · {q.event_date||"Date not set"}</p>
      <div className="actions" style={{marginTop:14}}>
        <PrintButton label="Print / Save PDF"/>
        {q.lead_id&&<Link className="btn btn-light" href={`/app/leads/${q.lead_id}`}>Open Client</Link>}
        <Link className="btn btn-light" href="/app/quotes">Back to Quotes</Link>
      </div>
    </section>

    <div className="grid">
      <div className="span-8">
        <article className="proposal-shell">
          <header className="proposal-header">
            <h1>The Osgood</h1>
            <p>Wedding and Events Venue · 614 Center Avenue, Bay City, Michigan</p>
          </header>
          <div className="proposal-body">
            <h2 style={{fontFamily:"Georgia,serif"}}>Event Proposal</h2>
            <div className="proposal-meta">
              <div><label>Prepared For</label><b>{q.client_name}</b><br/>{q.client_email||""}</div>
              <div><label>Quote Number</label><b>{q.quote_number}</b><br/>Status: {q.status}</div>
              <div><label>Event</label><b>{q.event_type||"Event"}</b><br/>{q.event_date||"Date not set"}</div>
              <div><label>Valid Through</label><b>{q.valid_through||"Not specified"}</b></div>
            </div>

            <table className="line-items">
              <thead><tr><th>Description</th><th style={{textAlign:"right"}}>Amount</th></tr></thead>
              <tbody>
                {lineItems.map((x,i)=><tr key={i}><td>{x.label}</td><td style={{textAlign:"right"}}>{money(x.amount)}</td></tr>)}
                {Number(payload.calculation?.discountAmount||0)>0&&<tr><td>Discount</td><td style={{textAlign:"right"}}>-{money(payload.calculation.discountAmount)}</td></tr>}
                <tr><td className="proposal-total">Total Investment</td><td className="proposal-total" style={{textAlign:"right"}}>{money(q.total)}</td></tr>
              </tbody>
            </table>

            {q.proposal_notes&&<section style={{marginTop:24}}><h3>Proposal Notes</h3><p>{q.proposal_notes}</p></section>}
            {payload.notes&&<section style={{marginTop:20}}><h3>Event Notes</h3><p>{payload.notes}</p></section>}
            <section style={{marginTop:24}}>
              <h3>Payment Summary</h3>
              <p><b>Paid:</b> {money(paid)}<br/><b>Remaining Balance:</b> {money(q.balance)}</p>
            </section>
            <section style={{marginTop:24}}>
              <h3>Terms</h3>
              <p>{q.terms||"This proposal is subject to venue availability, final contract execution, and the payment schedule established by The Osgood."}</p>
            </section>
            <p className="muted" style={{fontSize:12,marginTop:28}}>The Osgood Wedding and Events Venue · 989-214-3733 · info@theosgood.com</p>
          </div>
        </article>
      </div>

      <aside className="span-4 no-print">
        <section className="card">
          <h2>Proposal Workflow</h2>
          <form action={updateQuoteStatus.bind(null,id)} className="form-grid">
            <div className="full"><label>Status</label>
              <select name="status" defaultValue={q.status}>
                <option value="draft">Draft</option><option value="sent">Sent</option>
                <option value="accepted">Accepted</option><option value="declined">Declined</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="full"><label>Valid Through</label><input name="valid_through" type="date" defaultValue={q.valid_through||""}/></div>
            <div className="full"><label>Proposal Notes</label><textarea name="proposal_notes" defaultValue={q.proposal_notes||""}/></div>
            <div className="full"><label>Terms</label><textarea name="terms" defaultValue={q.terms||""}/></div>
            <div className="full"><button className="btn btn-primary" type="submit">Save Proposal</button></div>
          </form>
          <div style={{marginTop:10}}><PrintButton label="Print / Save PDF"/></div>
        </section>

        <section className="card" style={{marginTop:16}}>
          <h2>Record Payment</h2>
          <form action={recordPayment.bind(null,id)} className="form-grid">
            <div className="full"><label>Schedule Item</label>
              <select name="schedule_id"><option value="">General payment</option>{(schedules??[]).map(s=><option key={s.id} value={s.id}>{s.label} · {money(s.amount)}</option>)}</select>
            </div>
            <div><label>Amount</label><input name="amount" type="number" step="0.01" min="0.01" required/></div>
            <div><label>Payment Date</label><input name="payment_date" type="date" defaultValue={new Date().toISOString().slice(0,10)}/></div>
            <div><label>Method</label><select name="method"><option>Check</option><option>Credit Card</option><option>ACH</option><option>Cash</option><option>Other</option></select></div>
            <div><label>Reference Number</label><input name="reference_number"/></div>
            <div className="full"><label>Notes</label><input name="notes"/></div>
            <div className="full"><button className="btn btn-gold" type="submit">Record Payment</button></div>
          </form>
        </section>

        <section className="card" style={{marginTop:16}}>
          <h2>Add Payment Schedule</h2>
          <form action={addPaymentSchedule.bind(null,id)} className="form-grid">
            <div className="full"><label>Label</label><input name="label" placeholder="Deposit, second payment, final balance" required/></div>
            <div><label>Amount</label><input name="amount" type="number" step="0.01" min="0" required/></div>
            <div><label>Due Date</label><input name="due_date" type="date"/></div>
            <div className="full"><button className="btn btn-light" type="submit">Add Schedule Item</button></div>
          </form>
        </section>
      </aside>
    </div>

    <section className="card no-print" style={{marginTop:18}}>
      <h2>Payment Schedule & History</h2>
      <div className="payment-schedule">
        {(schedules??[]).map(s=><div className="schedule-row" key={s.id}>
          <b>{s.label}</b><span>{money(s.amount)}</span><span>{s.due_date||"No due date"}</span><span className="badge">{s.status}</span>
        </div>)}
      </div>
      <div className="payment-list" style={{marginTop:16}}>
        {(payments??[]).map(p=><div className="payment-row paid" key={p.id}>
          <div><b>{p.method||"Payment"}</b><div className="muted">{p.reference_number||p.notes||""}</div></div>
          <b>{money(p.amount)}</b><span>{p.payment_date}</span><span className="badge">Paid</span>
        </div>)}
      </div>
    </section>
  </>;
}

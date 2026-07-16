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
            <img src="/osgood-logo.png" alt="The Osgood Wedding and Events"/>
            <div className="proposal-document-title">
              <span>Private Event Proposal</span>
              <b>{q.quote_number}</b>
            </div>
          </header>

          <div className="proposal-gold-rule"/>

          <div className="proposal-body">
            <section className="proposal-intro">
              <span className="eyebrow">Prepared Exclusively For</span>
              <h1>{q.client_name}</h1>
              <p>Thank you for considering The Osgood for your celebration. This proposal reflects the venue experience and selections discussed for your event.</p>
            </section>

            <div className="proposal-meta">
              <div><label>Event</label><b>{q.event_type||"Event"}</b><span>{q.event_date||"Date not set"}</span></div>
              <div><label>Contact</label><b>{q.client_email||"Email not provided"}</b><span>{(q.leads as any)?.phone||""}</span></div>
              <div><label>Proposal Status</label><b className="proposal-status">{q.status}</b><span>Valid through {q.valid_through||"date not specified"}</span></div>
            </div>

            <section className="proposal-section">
              <div className="proposal-section-heading">
                <span>01</span><h2>Your Investment</h2>
              </div>
              <table className="line-items">
                <thead><tr><th>Description</th><th style={{textAlign:"right"}}>Investment</th></tr></thead>
                <tbody>
                  {lineItems.map((x,i)=><tr key={i}><td>{x.label}</td><td style={{textAlign:"right"}}>{money(x.amount)}</td></tr>)}
                  {Number(payload.calculation?.discountAmount||0)>0&&<tr><td>Courtesy Discount</td><td style={{textAlign:"right"}}>-{money(payload.calculation.discountAmount)}</td></tr>}
                </tbody>
              </table>
              <div className="proposal-total-box">
                <span>Total Venue Investment</span><b>{money(q.total)}</b>
              </div>
            </section>

            <section className="proposal-section">
              <div className="proposal-section-heading">
                <span>02</span><h2>Payment Summary</h2>
              </div>
              <div className="proposal-payment-grid">
                <div><label>Deposit</label><b>{money(q.deposit)}</b></div>
                <div><label>Payments Received</label><b>{money(paid)}</b></div>
                <div className="balance"><label>Remaining Balance</label><b>{money(q.balance)}</b></div>
              </div>
              {(schedules??[]).length>0&&<div className="proposal-schedule">
                {(schedules??[]).map(s=><div key={s.id}><span>{s.label}</span><b>{money(s.amount)}</b><small>{s.due_date?`Due ${s.due_date}`:"Due date to be determined"}</small></div>)}
              </div>}
            </section>

            {(q.proposal_notes||payload.notes)&&<section className="proposal-section">
              <div className="proposal-section-heading"><span>03</span><h2>Event Notes</h2></div>
              {q.proposal_notes&&<p>{q.proposal_notes}</p>}
              {payload.notes&&<p>{payload.notes}</p>}
            </section>}

            <section className="proposal-section proposal-terms">
              <div className="proposal-section-heading"><span>{(q.proposal_notes||payload.notes)?"04":"03"}</span><h2>Terms & Next Steps</h2></div>
              <p>{q.terms||"This proposal is subject to venue availability, final contract execution, and the payment schedule established by The Osgood."}</p>
              <div className="proposal-signature-grid">
                <div><span>Client Acceptance</span><div className="signature-line"/><small>Signature</small></div>
                <div><span>Date</span><div className="signature-line"/><small>Date</small></div>
              </div>
            </section>
          </div>

          <footer className="proposal-footer">
            <div><b>The Osgood Wedding & Events</b><span>A Bay City landmark reimagined</span></div>
            <div><span>614 Center Avenue · Bay City, Michigan</span><span>989-214-3733 · info@theosgood.com · theosgood.com</span></div>
          </footer>
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

import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  addPaymentSchedule,
  deleteQuote,
  duplicateQuote,
  recordPayment,
  updateQuoteStatus
} from "../actions";
import ProposalActions from "./ProposalActions";
import DeleteQuoteButton from "./DeleteQuoteButton";

const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(Number(n)||0);
const displayDate=(value:string|null)=>value?new Date(`${value}T12:00:00`).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"Date to be confirmed";

function legacyLineItems(q:any){
  const payload=q.payload||{};
  if(Array.isArray(payload.lineItems)&&payload.lineItems.length){
    return payload.lineItems.map((item:any)=>({label:item.label,amount:Number(item.amount||0)}));
  }
  return [
    {label:payload.packageName||payload.package||"The Osgood Venue Experience",amount:Number(payload.calculation?.base||q.total)},
    ...(Number(payload.calculation?.suiteCost||0)>0?[{label:"Private Suite Experience",amount:Number(payload.calculation.suiteCost)}]:[]),
    ...(Number(payload.calculation?.earlyCost||0)>0?[{label:"Early Venue Access",amount:Number(payload.calculation.earlyCost)}]:[]),
    ...(Number(payload.calculation?.lateCost||0)>0?[{label:"Extended Celebration Time",amount:Number(payload.calculation.lateCost)}]:[]),
    ...(Number(payload.calculation?.securityCost||0)>0?[{label:"Event Security",amount:Number(payload.calculation.securityCost)}]:[]),
    ...(Number(payload.av||0)>0?[{label:"Audio Visual Package",amount:Number(payload.av)}]:[]),
    ...(Number(payload.customAmount||0)>0?[{label:payload.customName||"Custom Enhancement",amount:Number(payload.customAmount)}]:[])
  ];
}

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
  const lineItems=legacyLineItems(q);
  const discount=Number(payload.discount??payload.calculation?.discountAmount??0);
  const paid=(payments??[]).reduce((sum,p)=>sum+Number(p.amount||0),0);
  const inclusions=(Array.isArray(payload.inclusions)&&payload.inclusions.length?payload.inclusions:[
    "Exclusive access to the selected event spaces",
    "Venue tables and chairs based on final layout",
    "Dedicated planning and operations coordination",
    "Private preparation spaces when included in the package"
  ]) as string[];

  return <>
    <section className="hero no-print quote-detail-hero">
      <div>
        <span className="eyebrow">Proposal management</span>
        <h1>{q.quote_number}</h1>
        <p>{q.client_name} · {q.event_type||"Event"} · {displayDate(q.event_date)}</p>
      </div>
      <div className="quote-detail-actions">
        <ProposalActions quoteNumber={q.quote_number} clientName={q.client_name}/>
        <Link className="btn btn-gold" href={`/app/quotes/${id}/edit`}>Edit Quote</Link>
        <form action={duplicateQuote.bind(null,id)}><button className="btn btn-light" type="submit">Duplicate</button></form>
        <Link className="btn btn-light" href="/app/quotes">Back</Link>
      </div>
    </section>

    <div className="luxury-proposal-layout">
      <article className="luxury-proposal">
        <section className="proposal-cover">
          <div className="proposal-cover-frame">
            <div className="proposal-brand">
              <img src="/osgood-logo.png" alt="The Osgood"/>
              <span>Weddings · Celebrations · Corporate Events</span>
            </div>

            <div className="proposal-cover-copy">
              <span className="proposal-kicker">A private proposal for</span>
              <h1>{q.client_name}</h1>
              <div className="proposal-cover-rule"/>
              <p>{q.event_type||"Private Event"}</p>
              <b>{displayDate(q.event_date)}</b>
            </div>

            <div className="proposal-cover-footer">
              <span>{q.quote_number}</span>
              <span>A Bay City landmark reimagined</span>
            </div>
          </div>
        </section>

        <section className="proposal-page">
          <div className="proposal-page-number">01</div>
          <span className="proposal-kicker">Welcome to The Osgood</span>
          <h2>A celebration with a sense of place</h2>
          <p className="proposal-lead">
            Thank you for considering The Osgood. Your proposal has been thoughtfully prepared around the event experience, spaces, and services selected for your celebration.
          </p>

          <div className="proposal-feature-grid">
            <div><span>Event</span><b>{q.event_type||"Private Event"}</b></div>
            <div><span>Date</span><b>{displayDate(q.event_date)}</b></div>
            <div><span>Prepared for</span><b>{q.client_name}</b></div>
            <div><span>Proposal status</span><b className="proposal-status">{q.status}</b></div>
          </div>

          <div className="proposal-editorial-quote">
            “Historic character, elevated hospitality, and an unforgettable setting in the heart of Bay City.”
          </div>
        </section>

        <section className="proposal-page proposal-dark-page">
          <div className="proposal-page-number">02</div>
          <span className="proposal-kicker">The experience</span>
          <h2>What your proposal includes</h2>
          <div className="proposal-inclusion-grid">
            {inclusions.map((item:string,index:number)=><div key={index}>
              <span>{String(index+1).padStart(2,"0")}</span>
              <p>{item}</p>
            </div>)}
          </div>
        </section>

        <section className="proposal-page">
          <div className="proposal-page-number">03</div>
          <span className="proposal-kicker">Your investment</span>
          <h2>Designed around your event</h2>

          <table className="luxury-line-items">
            <thead><tr><th>Experience & services</th><th>Investment</th></tr></thead>
            <tbody>
              {lineItems.map((item:any,index:number)=><tr key={index}>
                <td>{item.label}</td><td>{money(item.amount)}</td>
              </tr>)}
              {discount>0&&<tr className="discount-row"><td>Courtesy adjustment</td><td>-{money(discount)}</td></tr>}
            </tbody>
          </table>

          <div className="luxury-total">
            <span>Total venue investment</span>
            <b>{money(q.total)}</b>
          </div>

          <div className="proposal-payment-grid">
            <div><span>Initial deposit</span><b>{money(q.deposit)}</b></div>
            <div><span>Payments received</span><b>{money(paid)}</b></div>
            <div className="balance"><span>Remaining balance</span><b>{money(q.balance)}</b></div>
          </div>

          {(schedules??[]).length>0&&<div className="proposal-schedule">
            {(schedules??[]).map(s=><div key={s.id}>
              <span>{s.label}</span>
              <b>{money(s.amount)}</b>
              <small>{s.due_date?`Due ${displayDate(s.due_date)}`:"Date to be determined"}</small>
            </div>)}
          </div>}
        </section>

        {(q.proposal_notes||payload.notes)&&<section className="proposal-page">
          <div className="proposal-page-number">04</div>
          <span className="proposal-kicker">Personalized details</span>
          <h2>Notes for your celebration</h2>
          {q.proposal_notes&&<p className="proposal-lead">{q.proposal_notes}</p>}
          {payload.notes&&<p>{payload.notes}</p>}
        </section>}

        <section className="proposal-page proposal-acceptance">
          <div className="proposal-page-number">{(q.proposal_notes||payload.notes)?"05":"04"}</div>
          <span className="proposal-kicker">Next steps</span>
          <h2>Reserve your date</h2>
          <p className="proposal-lead">
            {q.terms||"This proposal is subject to venue availability, final contract execution, and the payment schedule established by The Osgood."}
          </p>

          <div className="proposal-signature-grid">
            <div><span>Client acceptance</span><div className="signature-line"/><small>Signature</small></div>
            <div><span>Date</span><div className="signature-line"/><small>Date</small></div>
          </div>

          <footer className="luxury-proposal-footer">
            <div><b>The Osgood Wedding & Events</b><span>614 Center Avenue · Bay City, Michigan</span></div>
            <div><span>989-214-3733</span><span>info@theosgood.com · theosgood.com</span></div>
          </footer>
        </section>
      </article>

      <aside className="quote-control-panel no-print">
        <section className="card">
          <span className="eyebrow">Proposal workflow</span>
          <h2>Manage Proposal</h2>
          <form action={updateQuoteStatus.bind(null,id)} className="form-grid">
            <div className="full"><label>Status</label>
              <select name="status" defaultValue={q.status}>
                <option value="draft">Draft</option>
                <option value="sent">Sent</option>
                <option value="accepted">Accepted</option>
                <option value="declined">Declined</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div className="full"><label>Valid Through</label><input name="valid_through" type="date" defaultValue={q.valid_through||""}/></div>
            <div className="full"><label>Proposal Notes</label><textarea name="proposal_notes" defaultValue={q.proposal_notes||""}/></div>
            <div className="full"><label>Terms</label><textarea name="terms" defaultValue={q.terms||""}/></div>
            <div className="full"><button className="btn btn-primary" type="submit">Save Proposal</button></div>
          </form>
        </section>

        <section className="card" style={{marginTop:16}}>
          <h2>Record Payment</h2>
          <form action={recordPayment.bind(null,id)} className="form-grid">
            <div className="full"><label>Schedule Item</label>
              <select name="schedule_id">
                <option value="">General payment</option>
                {(schedules??[]).map(s=><option key={s.id} value={s.id}>{s.label} · {money(s.amount)}</option>)}
              </select>
            </div>
            <div><label>Amount</label><input name="amount" type="number" step="0.01" min="0.01" required/></div>
            <div><label>Payment Date</label><input name="payment_date" type="date" defaultValue={new Date().toISOString().slice(0,10)}/></div>
            <div><label>Method</label><select name="method"><option>Check</option><option>Credit Card</option><option>ACH</option><option>Cash</option><option>Other</option></select></div>
            <div><label>Reference</label><input name="reference_number"/></div>
            <div className="full"><label>Notes</label><input name="notes"/></div>
            <div className="full"><button className="btn btn-gold" type="submit">Record Payment</button></div>
          </form>
        </section>

        <section className="card" style={{marginTop:16}}>
          <h2>Payment Schedule</h2>
          <form action={addPaymentSchedule.bind(null,id)} className="form-grid">
            <div className="full"><label>Label</label><input name="label" placeholder="Deposit, second payment, final balance" required/></div>
            <div><label>Amount</label><input name="amount" type="number" step="0.01" min="0" required/></div>
            <div><label>Due Date</label><input name="due_date" type="date"/></div>
            <div className="full"><button className="btn btn-light" type="submit">Add Schedule Item</button></div>
          </form>
        </section>

        <section className="card danger-card" style={{marginTop:16}}>
          <h2>Danger Zone</h2>
          <p className="muted">Deleting a quote also removes its associated payment schedule and payment records.</p>
          <form action={deleteQuote.bind(null,id)}><DeleteQuoteButton/></form>
        </section>
      </aside>
    </div>
  </>;
}

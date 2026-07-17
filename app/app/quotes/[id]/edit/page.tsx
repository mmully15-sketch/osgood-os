import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { updateQuote } from "../../actions";
import QuoteEditor from "./QuoteEditor";

function getItems(q:any){
  const payload=q.payload||{};
  if(Array.isArray(payload.lineItems)&&payload.lineItems.length){
    return payload.lineItems.map((item:any,index:number)=>({
      id:item.id||String(index),
      label:item.label||"",
      amount:Number(item.amount||0)
    }));
  }
  return [
    {id:"base",label:payload.packageName||payload.package||"Venue Rental",amount:Number(payload.calculation?.base||q.total)},
    ...(Number(payload.calculation?.suiteCost||0)>0?[{id:"suite",label:"Suite Add-on",amount:Number(payload.calculation.suiteCost)}]:[]),
    ...(Number(payload.calculation?.earlyCost||0)>0?[{id:"early",label:"Early Access",amount:Number(payload.calculation.earlyCost)}]:[]),
    ...(Number(payload.calculation?.lateCost||0)>0?[{id:"late",label:"After-hours Extension",amount:Number(payload.calculation.lateCost)}]:[]),
    ...(Number(payload.calculation?.securityCost||0)>0?[{id:"security",label:"Security",amount:Number(payload.calculation.securityCost)}]:[]),
    ...(Number(payload.av||0)>0?[{id:"av",label:"AV Package",amount:Number(payload.av)}]:[]),
    ...(Number(payload.customAmount||0)>0?[{id:"custom",label:payload.customName||"Custom Add-on",amount:Number(payload.customAmount)}]:[])
  ];
}

export default async function EditQuotePage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();
  const {data:q,error}=await supabase.from("quotes").select("*").eq("id",id).single();
  if(error||!q) notFound();

  const payload=q.payload||{};
  const items=getItems(q);
  const inclusions=(payload.inclusions||[]).join("\n");

  return <>
    <section className="hero quote-edit-hero">
      <div>
        <span className="eyebrow">Quote editor</span>
        <h1>Edit {q.quote_number}</h1>
        <p>Adjust event details, proposal copy, package inclusions, and investment items.</p>
      </div>
      <div className="actions">
        <Link className="btn btn-light" href={`/app/quotes/${id}`}>Cancel</Link>
      </div>
    </section>

    <form action={updateQuote.bind(null,id)}>
      <div className="quote-edit-layout">
        <div>
          <section className="card">
            <h2>Client & Event</h2>
            <div className="form-grid">
              <div><label>Client Name</label><input name="client_name" defaultValue={q.client_name} required/></div>
              <div><label>Client Email</label><input name="client_email" type="email" defaultValue={q.client_email||""}/></div>
              <div><label>Event Type</label><input name="event_type" defaultValue={q.event_type||""}/></div>
              <div><label>Event Date</label><input name="event_date" type="date" defaultValue={q.event_date||""}/></div>
              <div><label>Valid Through</label><input name="valid_through" type="date" defaultValue={q.valid_through||""}/></div>
            </div>
          </section>

          <section className="card" style={{marginTop:16}}>
            <h2>Investment</h2>
            <QuoteEditor
              initialItems={items}
              initialDeposit={Number(q.deposit||0)}
              initialDiscount={Number(payload.discount??payload.calculation?.discountAmount??0)}
            />
          </section>
        </div>

        <aside>
          <section className="card">
            <h2>Proposal Content</h2>
            <div className="form-grid">
              <div className="full">
                <label>Package Inclusions</label>
                <textarea name="inclusions" rows={9} defaultValue={inclusions} placeholder={"One inclusion per line\nBallroom access\nTables and chairs\nPlanning coordination"}/>
              </div>
              <div className="full"><label>Proposal Notes</label><textarea name="proposal_notes" rows={6} defaultValue={q.proposal_notes||""}/></div>
              <div className="full"><label>Terms</label><textarea name="terms" rows={7} defaultValue={q.terms||""}/></div>
              <div className="full"><label>Internal Notes</label><textarea name="internal_notes" rows={5} defaultValue={payload.notes||""}/></div>
            </div>
          </section>

          <section className="card quote-save-card" style={{marginTop:16}}>
            <h2>Save Changes</h2>
            <p className="muted">The proposal and totals will update immediately after saving.</p>
            <button className="btn btn-primary" type="submit">Save & View Proposal</button>
          </section>
        </aside>
      </div>
    </form>
  </>;
}

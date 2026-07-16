"use client";
import { useMemo,useState } from "react";
import { saveCalculatedQuote } from "./actions";

type Lead={id:string;name:string;email:string|null;event_type:string;event_date:string|null;guests:number};

const weddingRates:any={
  signature:{"Monday-Wednesday":2500,Thursday:3000,Friday:4500,Saturday:6000,Sunday:4000},
  heritage:{"Monday-Wednesday":3500,Thursday:4000,Friday:5500,Saturday:7000,Sunday:4000},
  legacy:{"Monday-Wednesday":12000,Thursday:12000,Friday:12000,Saturday:12000,Sunday:12000}
};
const names:any={signature:"Signature Celebration",heritage:"Heritage Experience",legacy:"Legacy Weekend"};
const ballroom:any={
  "Monday-Wednesday":[225,4,1200,2000],Thursday:[300,4,1800,2500],Friday:[450,4,2500,4000],
  Saturday:[500,4,2800,5000],Sunday:[400,4,2200,3500]
};
const auditorium:any={
  "Monday-Wednesday":[350,2,1800],Thursday:[375,2,2000],Friday:[450,2,2500],Saturday:[450,2,2500],Sunday:[375,2,2000]
};
const money=(n:number)=>new Intl.NumberFormat("en-US",{style:"currency",currency:"USD",maximumFractionDigits:0}).format(n);

export default function CalculatorClient({leads}:{leads:Lead[]}){
  const [mode,setMode]=useState<"wedding"|"event">("wedding");
  const [leadId,setLeadId]=useState("");
  const selectedLead=leads.find(l=>l.id===leadId);
  const [clientName,setClientName]=useState("");
  const [clientEmail,setClientEmail]=useState("");
  const [eventDate,setEventDate]=useState("");
  const [eventType,setEventType]=useState("Wedding");
  const [day,setDay]=useState("Saturday");
  const [pkg,setPkg]=useState("signature");
  const [suite,setSuite]=useState(false);
  const [duration,setDuration]=useState("Half Day");
  const [hours,setHours]=useState(0);
  const [spaces,setSpaces]=useState({ballroom:false,auditorium:false,conference:false,bridal:false,grooms:false});
  const [early,setEarly]=useState(0),[late,setLate]=useState(0),[security,setSecurity]=useState(0),[av,setAv]=useState(0);
  const [customName,setCustomName]=useState(""),[customAmount,setCustomAmount]=useState(0);
  const [discount,setDiscount]=useState(0),[depositPct,setDepositPct]=useState(25),[notes,setNotes]=useState("");

  function chooseLead(id:string){
    setLeadId(id);const l=leads.find(x=>x.id===id);if(!l)return;
    setClientName(l.name);setClientEmail(l.email||"");setEventDate(l.event_date||"");setEventType(l.event_type||"Wedding");
    if(l.event_date){const d=new Date(l.event_date+"T12:00:00").getDay();setDay(d===4?"Thursday":d===5?"Friday":d===6?"Saturday":d===0?"Sunday":"Monday-Wednesday");}
    setMode(l.event_type==="Wedding"?"wedding":"event");
  }

  const calc=useMemo(()=>{
    let base=0;
    if(mode==="wedding") base=weddingRates[pkg][day];
    else{
      if(spaces.ballroom){const r=ballroom[day];base+=duration==="Hourly"?r[0]*Math.max(hours,r[1]):duration==="Full Day"?r[3]:r[2];}
      if(spaces.auditorium){const r=auditorium[day];base+=(duration==="Full Day"||duration==="6 Hours"||(duration==="Hourly"&&hours>=6))?r[2]:r[0]*Math.max(hours,r[1]);}
      if(spaces.conference) base+=duration==="4 Hours"?750:duration==="6 Hours"?1000:duration==="Full Day"?1200:duration==="Half Day"?1000:200*Math.max(hours,2);
      if(spaces.bridal) base+=250;if(spaces.grooms) base+=150;
    }
    const suiteCost=mode==="wedding"&&pkg==="signature"&&suite?500:0;
    const earlyCost=early*250,lateCost=late*250,securityCost=security*40;
    const subtotal=base+suiteCost+earlyCost+lateCost+securityCost+av+customAmount;
    const discountAmount=subtotal*Math.min(100,discount)/100;
    const total=subtotal-discountAmount;
    const deposit=total*Math.min(100,depositPct)/100;
    return {base,suiteCost,earlyCost,lateCost,securityCost,subtotal,discountAmount,total,deposit,balance:total-deposit};
  },[mode,pkg,day,suite,duration,hours,spaces,early,late,security,av,customAmount,discount,depositPct]);

  const payload=JSON.stringify({mode,package:pkg,packageName:names[pkg],day,duration,hours,spaces,earlyHours:early,lateHours:late,securityHours:security,av,customName,customAmount,discountPct:discount,depositPct,notes,calculation:calc});

  return <form action={saveCalculatedQuote}>
    <input type="hidden" name="lead_id" value={leadId}/><input type="hidden" name="total" value={calc.total}/>
    <input type="hidden" name="deposit" value={calc.deposit}/><input type="hidden" name="payload" value={payload}/>
    <div className="grid">
      <div className="span-7">
        <section className="card">
          <h2>Client & Event</h2>
          <div className="form-grid">
            <div className="full"><label>Existing Client</label><select value={leadId} onChange={e=>chooseLead(e.target.value)}><option value="">Select or enter manually</option>{leads.map(l=><option key={l.id} value={l.id}>{l.name} · {l.event_date||"No date"}</option>)}</select></div>
            <div><label>Client Name</label><input name="client_name" value={clientName} onChange={e=>setClientName(e.target.value)} required/></div>
            <div><label>Email</label><input name="client_email" value={clientEmail} onChange={e=>setClientEmail(e.target.value)}/></div>
            <div><label>Event Type</label><input name="event_type" value={eventType} onChange={e=>setEventType(e.target.value)}/></div>
            <div><label>Event Date</label><input name="event_date" type="date" value={eventDate} onChange={e=>setEventDate(e.target.value)}/></div>
            <div><label>Day</label><select value={day} onChange={e=>setDay(e.target.value)}><option>Monday-Wednesday</option><option>Thursday</option><option>Friday</option><option>Saturday</option><option>Sunday</option></select></div>
          </div>
        </section>

        <section className="card" style={{marginTop:16}}>
          <div className="section-tabs">
            <button type="button" className={`btn ${mode==="wedding"?"btn-primary":"btn-light"}`} onClick={()=>setMode("wedding")}>Wedding Packages</button>
            <button type="button" className={`btn ${mode==="event"?"btn-primary":"btn-light"}`} onClick={()=>setMode("event")}>Corporate / Private</button>
          </div>
          {mode==="wedding"?<>
            <div className="package-grid">
              {["signature","heritage","legacy"].map(p=><div key={p} className={`package-card ${pkg===p?"selected":""}`} onClick={()=>{setPkg(p);if(p!=="signature")setSuite(false)}}>
                <h3>{names[p]}</h3><p>{p==="signature"?"Single-day reception package.":p==="heritage"?"Reception plus auditorium ceremony and suites.":"Full-facility weekend experience."}</p>
              </div>)}
            </div>
            {pkg==="signature"&&<label style={{marginTop:16,textTransform:"none",fontSize:14}}><input style={{width:"auto",minHeight:0,marginRight:8}} type="checkbox" checked={suite} onChange={e=>setSuite(e.target.checked)}/>Add Salon and Library Suite ($500)</label>}
          </>:<>
            <div className="form-grid">
              <div><label>Duration</label><select value={duration} onChange={e=>setDuration(e.target.value)}><option>Hourly</option><option>4 Hours</option><option>6 Hours</option><option>Half Day</option><option>Full Day</option></select></div>
              <div><label>Hours</label><input type="number" min="0" value={hours} onChange={e=>setHours(Number(e.target.value))}/></div>
              {Object.keys(spaces).map(k=><label key={k} style={{textTransform:"capitalize",fontSize:14}}><input style={{width:"auto",minHeight:0,marginRight:8}} type="checkbox" checked={(spaces as any)[k]} onChange={e=>setSpaces({...spaces,[k]:e.target.checked})}/>{k==="grooms"?"Groom’s Suite":k}</label>)}
            </div>
          </>}
        </section>

        <section className="card" style={{marginTop:16}}>
          <h2>Add-ons & Terms</h2>
          <div className="form-grid">
            <div><label>Early Access Hours ($250/hr)</label><input type="number" min="0" value={early} onChange={e=>setEarly(Number(e.target.value))}/></div>
            <div><label>After 11 PM Hours ($250/hr)</label><input type="number" min="0" value={late} onChange={e=>setLate(Number(e.target.value))}/></div>
            <div><label>Security Hours ($40/hr)</label><input type="number" min="0" value={security} onChange={e=>setSecurity(Number(e.target.value))}/></div>
            <div><label>AV Package</label><select value={av} onChange={e=>setAv(Number(e.target.value))}><option value="0">None</option><option value="500">Basic ($500)</option><option value="1000">Standard ($1,000)</option><option value="1500">Premium ($1,500)</option></select></div>
            <div><label>Custom Add-on</label><input value={customName} onChange={e=>setCustomName(e.target.value)}/></div>
            <div><label>Custom Amount</label><input type="number" min="0" value={customAmount} onChange={e=>setCustomAmount(Number(e.target.value))}/></div>
            <div><label>Discount %</label><input type="number" min="0" max="100" value={discount} onChange={e=>setDiscount(Number(e.target.value))}/></div>
            <div><label>Deposit %</label><input type="number" min="0" max="100" value={depositPct} onChange={e=>setDepositPct(Number(e.target.value))}/></div>
            <div className="full"><label>Proposal Notes</label><textarea value={notes} onChange={e=>setNotes(e.target.value)}/></div>
          </div>
        </section>
      </div>

      <aside className="span-5">
        <section className="card quote-summary">
          <h2>Quote Summary</h2>
          <div className="money-row"><span>{mode==="wedding"?names[pkg]:"Venue rental"}</span><strong>{money(calc.base)}</strong></div>
          <div className="money-row"><span>Suite add-on</span><strong>{money(calc.suiteCost)}</strong></div>
          <div className="money-row"><span>Early access</span><strong>{money(calc.earlyCost)}</strong></div>
          <div className="money-row"><span>After hours</span><strong>{money(calc.lateCost)}</strong></div>
          <div className="money-row"><span>Security</span><strong>{money(calc.securityCost)}</strong></div>
          <div className="money-row"><span>AV + custom add-ons</span><strong>{money(av+customAmount)}</strong></div>
          <div className="money-row"><span>Subtotal</span><strong>{money(calc.subtotal)}</strong></div>
          <div className="money-row"><span>Discount</span><strong>-{money(calc.discountAmount)}</strong></div>
          <div className="money-row grand-total"><span>Total</span><strong>{money(calc.total)}</strong></div>
          <div className="money-row"><span>Deposit</span><strong>{money(calc.deposit)}</strong></div>
          <div className="money-row"><span>Remaining balance</span><strong>{money(calc.balance)}</strong></div>
          <button className="btn btn-gold" style={{width:"100%",marginTop:18}} type="submit">Save Quote</button>
          <p className="muted" style={{fontSize:12}}>Saving creates a shared draft quote and marks the selected lead as quoted.</p>
        </section>
      </aside>
    </div>
  </form>;
}

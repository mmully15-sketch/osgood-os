"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type PlanItem={
  id:string;
  type:string;
  label:string;
  x:number;
  y:number;
  width:number;
  height:number;
  shape:"round"|"rect";
  seats:number;
  linenSize:string;
  linenColor:string;
  notes:string;
};

type EventOption={id:string;title:string;start_at:string;guest_count:number};

const CANVAS_W=960;
const CANVAS_H=384;

const itemCatalog=[
  {type:"round60",label:'60" Round',width:38,height:38,shape:"round" as const,seats:8,linenSize:'120" Round'},
  {type:"round72",label:'72" Round',width:46,height:46,shape:"round" as const,seats:10,linenSize:'132" Round'},
  {type:"banquet6",label:"6' Banquet",width:46,height:18,shape:"rect" as const,seats:6,linenSize:'90" × 132"'},
  {type:"banquet8",label:"8' Banquet",width:60,height:18,shape:"rect" as const,seats:8,linenSize:'90" × 156"'},
  {type:"cocktail",label:"Cocktail Table",width:24,height:24,shape:"round" as const,seats:0,linenSize:'132" Round'},
  {type:"sweetheart",label:"Sweetheart Table",width:48,height:20,shape:"rect" as const,seats:2,linenSize:'90" × 132"'},
  {type:"head",label:"Head Table",width:92,height:20,shape:"rect" as const,seats:10,linenSize:'90" × 156"'},
  {type:"dance",label:"Dance Floor",width:128,height:96,shape:"rect" as const,seats:0,linenSize:"None"},
  {type:"dj",label:"DJ / Band",width:64,height:34,shape:"rect" as const,seats:0,linenSize:"None"},
  {type:"buffet",label:"Buffet",width:76,height:24,shape:"rect" as const,seats:0,linenSize:"None"},
  {type:"dessert",label:"Dessert Table",width:48,height:20,shape:"rect" as const,seats:0,linenSize:'90" × 132"'},
  {type:"gift",label:"Gift Table",width:40,height:20,shape:"rect" as const,seats:0,linenSize:'90" × 132"'},
  {type:"photo",label:"Photo Booth",width:52,height:40,shape:"rect" as const,seats:0,linenSize:"None"},
];

const colors=["White","Ivory","Black","Champagne","Navy","Sage","Burgundy","Dusty Rose","Other"];

function overlaps(a:PlanItem,b:PlanItem){
  return a.x<a.x+b.width && a.x+b.width>b.x && a.y<a.y+b.height && a.y+a.height>b.y
    ? !(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y)
    : false;
}

export default function FloorPlanner({plan,events}:{plan:any;events:EventOption[]}){
  const supabase=createClient();
  const canvasRef=useRef<HTMLDivElement|null>(null);
  const [items,setItems]=useState<PlanItem[]>(Array.isArray(plan.items)?plan.items:[]);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [name,setName]=useState(plan.name);
  const [status,setStatus]=useState(plan.status||"draft");
  const [eventId,setEventId]=useState(plan.event_id||"");
  const [notes,setNotes]=useState(plan.notes||"");
  const [saving,setSaving]=useState(false);
  const [message,setMessage]=useState("");

  const selected=items.find(i=>i.id===selectedId)||null;

  const collisionIds=useMemo(()=>{
    const ids=new Set<string>();
    items.forEach((a,i)=>items.slice(i+1).forEach(b=>{
      if(overlaps(a,b)){ids.add(a.id);ids.add(b.id)}
    }));
    return ids;
  },[items]);

  const totalSeats=items.reduce((sum,i)=>sum+i.seats,0);
  const tableCount=items.filter(i=>["round60","round72","banquet6","banquet8","cocktail","sweetheart","head","dessert","gift"].includes(i.type)).length;

  const linens=useMemo(()=>{
    const totals=new Map<string,number>();
    items.filter(i=>i.linenSize&&i.linenSize!=="None").forEach(i=>{
      const key=`${i.linenSize} · ${i.linenColor||"Color TBD"}`;
      totals.set(key,(totals.get(key)||0)+1);
    });
    return [...totals.entries()].sort((a,b)=>a[0].localeCompare(b[0]));
  },[items]);

  function addItem(type:string){
    const template=itemCatalog.find(i=>i.type===type);
    if(!template) return;
    const count=items.filter(i=>i.type===type).length+1;
    const item:PlanItem={
      ...template,
      id:crypto.randomUUID(),
      label:`${template.label} ${count}`,
      x:80+(count%8)*18,
      y:80+(count%6)*18,
      linenColor:"White",
      notes:""
    };
    setItems(prev=>[...prev,item]);
    setSelectedId(item.id);
  }

  function updateSelected(patch:Partial<PlanItem>){
    if(!selectedId) return;
    setItems(prev=>prev.map(i=>i.id===selectedId?{...i,...patch}:i));
  }

  function removeSelected(){
    if(!selectedId) return;
    setItems(prev=>prev.filter(i=>i.id!==selectedId));
    setSelectedId(null);
  }

  function startDrag(e:React.PointerEvent,item:PlanItem){
    e.preventDefault();
    setSelectedId(item.id);
    const canvas=canvasRef.current;
    if(!canvas) return;
    const rect=canvas.getBoundingClientRect();
    const scaleX=CANVAS_W/rect.width;
    const scaleY=CANVAS_H/rect.height;
    const startX=e.clientX;
    const startY=e.clientY;
    const originalX=item.x;
    const originalY=item.y;

    function move(ev:PointerEvent){
      const nx=Math.max(0,Math.min(CANVAS_W-item.width,originalX+(ev.clientX-startX)*scaleX));
      const ny=Math.max(0,Math.min(CANVAS_H-item.height,originalY+(ev.clientY-startY)*scaleY));
      setItems(prev=>prev.map(i=>i.id===item.id?{...i,x:Math.round(nx/4)*4,y:Math.round(ny/4)*4}:i));
    }
    function up(){
      window.removeEventListener("pointermove",move);
      window.removeEventListener("pointerup",up);
    }
    window.addEventListener("pointermove",move);
    window.addEventListener("pointerup",up);
  }

  async function savePlan(){
    setSaving(true);setMessage("");
    const {data:{user}}=await supabase.auth.getUser();
    const {error}=await supabase.from("floor_plans").update({
      name,status,event_id:eventId||null,items,notes,
      revision:Number(plan.revision||1)+1,
      updated_by:user?.id||null
    }).eq("id",plan.id);
    setSaving(false);
    setMessage(error?error.message:"Floor plan saved.");
  }

  return <>
    <section className="hero no-print">
      <div className="page-head">
        <div>
          <h1>Ballroom Floor Planner</h1>
          <p>150' × 60' Ballroom planning canvas. Drag items, assign linens, and print the setup plan.</p>
        </div>
        <div className="actions">
          <Link className="btn btn-light" href="/app/floor-plans">All Floor Plans</Link>
          <button className="btn btn-light" type="button" onClick={()=>window.print()}>Print / Save PDF</button>
          <button className="btn btn-primary" type="button" onClick={savePlan} disabled={saving}>
            {saving?"Saving...":"Save Plan"}
          </button>
        </div>
      </div>
      {message&&<p className="planner-message">{message}</p>}
    </section>

    <section className="planner-meta no-print">
      <div><label>Plan Name</label><input value={name} onChange={e=>setName(e.target.value)}/></div>
      <div><label>Linked Event</label>
        <select value={eventId} onChange={e=>setEventId(e.target.value)}>
          <option value="">No linked event</option>
          {events.map(e=><option key={e.id} value={e.id}>{e.title} · {new Date(e.start_at).toLocaleDateString()}</option>)}
        </select>
      </div>
      <div><label>Status</label>
        <select value={status} onChange={e=>setStatus(e.target.value)}>
          <option value="draft">Draft</option>
          <option value="client_review">Client Review</option>
          <option value="approved">Approved</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div><label>Plan Notes</label><input value={notes} onChange={e=>setNotes(e.target.value)}/></div>
    </section>

    <div className="planner-layout">
      <aside className="planner-sidebar no-print">
        <section className="planner-panel">
          <h3>Add Items</h3>
          <div className="planner-tools">
            {itemCatalog.map(i=><button key={i.type} type="button" onClick={()=>addItem(i.type)}>{i.label}</button>)}
          </div>
        </section>

        <section className="planner-panel">
          <h3>Plan Totals</h3>
          <div className="planner-stat"><span>Seats</span><b>{totalSeats}</b></div>
          <div className="planner-stat"><span>Tables</span><b>{tableCount}</b></div>
          <div className="planner-stat"><span>Objects</span><b>{items.length}</b></div>
          <div className="planner-stat"><span>Overlaps</span><b>{collisionIds.size}</b></div>
        </section>

        {selected&&<section className="planner-panel">
          <h3>Selected Item</h3>
          <label>Label</label>
          <input value={selected.label} onChange={e=>updateSelected({label:e.target.value})}/>
          <label>Seats</label>
          <input type="number" min="0" value={selected.seats} onChange={e=>updateSelected({seats:Number(e.target.value)||0})}/>
          <label>Linen Size</label>
          <input value={selected.linenSize} onChange={e=>updateSelected({linenSize:e.target.value})}/>
          <label>Linen Color</label>
          <select value={selected.linenColor} onChange={e=>updateSelected({linenColor:e.target.value})}>
            {colors.map(c=><option key={c}>{c}</option>)}
          </select>
          <label>Setup Notes</label>
          <textarea value={selected.notes} onChange={e=>updateSelected({notes:e.target.value})}/>
          <button className="btn planner-delete" type="button" onClick={removeSelected}>Delete Item</button>
        </section>}
      </aside>

      <main className="planner-main">
        <div className="print-plan-header">
          <h1>{name}</h1>
          <p>The Osgood Ballroom · 150' × 60' · Status: {status.replace("_"," ")}</p>
        </div>

        <div className="ballroom-wrap">
          <div className="ballroom-canvas" ref={canvasRef}>
            <div className="room-label">THE OSGOOD BALLROOM · 150' × 60'</div>
            <div className="north-label">NORTH WALL</div>
            <div className="door door-1">DOUBLE DOORS</div>
            <div className="door door-2">DOUBLE DOORS</div>
            <div className="door door-3">DOUBLE DOORS</div>
            <div className="fixed-bar">FIXED BAR<br/><small>SE CORNER</small></div>
            {items.map(item=><button
              type="button"
              key={item.id}
              onPointerDown={e=>startDrag(e,item)}
              onClick={()=>setSelectedId(item.id)}
              className={`plan-item ${item.shape} ${selectedId===item.id?"selected":""} ${collisionIds.has(item.id)?"collision":""} type-${item.type}`}
              style={{
                left:`${(item.x/CANVAS_W)*100}%`,
                top:`${(item.y/CANVAS_H)*100}%`,
                width:`${(item.width/CANVAS_W)*100}%`,
                height:`${(item.height/CANVAS_H)*100}%`
              }}
            >
              <span>{item.label}</span>
              {item.seats>0&&<small>{item.seats} seats</small>}
            </button>)}
          </div>
        </div>

        {collisionIds.size>0&&<div className="planner-warning no-print">
          Some items overlap. Overlapping objects are outlined in red.
        </div>}

        <section className="planner-report">
          <div>
            <h2>Table & Seating Summary</h2>
            <table>
              <thead><tr><th>Item</th><th>Seats</th><th>Linen</th><th>Color</th></tr></thead>
              <tbody>
                {items.filter(i=>i.seats>0||i.linenSize!=="None").map(i=><tr key={i.id}>
                  <td>{i.label}</td><td>{i.seats}</td><td>{i.linenSize}</td><td>{i.linenColor}</td>
                </tr>)}
              </tbody>
            </table>
          </div>
          <div>
            <h2>Linen Pull Sheet</h2>
            <div className="linen-list">
              {linens.map(([key,count])=><div key={key}><b>{count} ×</b><span>{key}</span></div>)}
              {!linens.length&&<p className="muted">No linens assigned.</p>}
            </div>
            <h3>Totals</h3>
            <p><b>{totalSeats}</b> planned seats<br/><b>{tableCount}</b> tables<br/><b>{items.length}</b> total objects</p>
          </div>
        </section>
      </main>
    </div>
  </>;
}

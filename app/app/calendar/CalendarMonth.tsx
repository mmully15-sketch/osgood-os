import Link from "next/link";

type EventRow={
  id:string;
  title:string;
  event_type:string;
  status:string;
  start_at:string;
  end_at:string;
};

function eventClass(type:string){
  const t=type.toLowerCase();
  if(t.includes("wedding")) return "wedding";
  if(t.includes("corporate")) return "corporate";
  if(t.includes("private")||t.includes("nonprofit")) return "private";
  if(t.includes("tour")) return "tour";
  if(t.includes("hold")) return "hold";
  if(t.includes("maintenance")||t.includes("clean")) return "maintenance";
  return "other";
}

export default function CalendarMonth({year,month,events}:{year:number;month:number;events:EventRow[]}){
  const first=new Date(year,month-1,1);
  const last=new Date(year,month,0);
  const startOffset=first.getDay();
  const total=last.getDate();
  const cells:Array<{date:Date;outside:boolean}>=[];

  for(let i=startOffset-1;i>=0;i--){
    const d=new Date(year,month-1,-i);
    cells.push({date:d,outside:true});
  }
  for(let d=1;d<=total;d++) cells.push({date:new Date(year,month-1,d),outside:false});
  while(cells.length%7!==0){
    const d=new Date(year,month-1,total+(cells.length-startOffset-total)+1);
    cells.push({date:d,outside:true});
  }

  const byDay=new Map<string,EventRow[]>();
  events.forEach(e=>{
    const key=e.start_at.slice(0,10);
    byDay.set(key,[...(byDay.get(key)||[]),e]);
  });

  return <div className="calendar-grid">
    {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(x=><div key={x} className="calendar-head">{x}</div>)}
    {cells.map((c,i)=>{
      const key=`${c.date.getFullYear()}-${String(c.date.getMonth()+1).padStart(2,"0")}-${String(c.date.getDate()).padStart(2,"0")}`;
      return <div className={`calendar-day ${c.outside?"outside":""}`} key={i}>
        <div className="calendar-date">{c.date.getDate()}</div>
        {(byDay.get(key)||[]).map(e=><Link key={e.id} href={`/app/calendar/${e.id}`} className={`calendar-event ${eventClass(e.event_type)}`}>
          {e.title}
        </Link>)}
      </div>;
    })}
  </div>;
}

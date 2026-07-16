import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import CalendarMonth from "./CalendarMonth";

export default async function CalendarPage({searchParams}:{searchParams:Promise<{year?:string;month?:string}>}){
  const params=await searchParams;
  const now=new Date();
  const year=Number(params.year)||now.getFullYear();
  const month=Number(params.month)||now.getMonth()+1;
  const start=new Date(year,month-1,1).toISOString();
  const end=new Date(year,month,1).toISOString();

  const supabase=await createClient();
  const {data:events,error}=await supabase
    .from("events")
    .select("id,title,event_type,status,start_at,end_at")
    .gte("start_at",start)
    .lt("start_at",end)
    .order("start_at");

  if(error) throw new Error(error.message);

  const prevMonth=month===1?12:month-1;
  const prevYear=month===1?year-1:year;
  const nextMonth=month===12?1:month+1;
  const nextYear=month===12?year+1:year;
  const label=new Date(year,month-1,1).toLocaleDateString("en-US",{month:"long",year:"numeric"});

  return <>
    <section className="hero">
      <h1>Calendar & Event Operations</h1>
      <p>Shared view of weddings, private events, tours, holds, maintenance, staffing, and event readiness.</p>
    </section>

    <div className="calendar-toolbar">
      <div className="actions">
        <Link className="btn btn-light" href={`/app/calendar?year=${prevYear}&month=${prevMonth}`}>Previous</Link>
        <Link className="btn btn-light" href="/app/calendar">Today</Link>
        <Link className="btn btn-light" href={`/app/calendar?year=${nextYear}&month=${nextMonth}`}>Next</Link>
      </div>
      <div className="calendar-title">{label}</div>
      <Link className="btn btn-gold" href="/app/calendar/new">+ Add Event</Link>
    </div>

    <CalendarMonth year={year} month={month} events={events??[]}/>
  </>;
}

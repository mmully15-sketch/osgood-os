import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import FloorPlanner from "./FloorPlanner";

export default async function FloorPlanDetailPage({params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const supabase=await createClient();

  const [{data:plan,error},{data:events}]=await Promise.all([
    supabase.from("floor_plans")
      .select("*,events(id,title,start_at,guest_count)")
      .eq("id",id)
      .single(),
    supabase.from("events")
      .select("id,title,start_at,guest_count")
      .neq("status","cancelled")
      .order("start_at",{ascending:true})
  ]);

  if(error||!plan) notFound();

  return <FloorPlanner
    plan={{
      ...plan,
      events:Array.isArray(plan.events)?plan.events[0]:plan.events
    }}
    events={events??[]}
  />;
}

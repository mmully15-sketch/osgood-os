"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const val=(f:FormData,k:string)=>String(f.get(k)||"").trim();

export async function createEvent(formData:FormData){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();

  const startDate=val(formData,"start_date");
  const startTime=val(formData,"start_time")||"09:00";
  const endDate=val(formData,"end_date")||startDate;
  const endTime=val(formData,"end_time")||"23:00";
  const title=val(formData,"title");
  if(!title||!startDate) throw new Error("Title and start date are required.");

  const eventId=randomUUID();
  const payload={
    id:eventId,
    lead_id:val(formData,"lead_id")||null,
    title,
    event_type:val(formData,"event_type")||"Other",
    status:val(formData,"status")||"scheduled",
    start_at:`${startDate}T${startTime}:00-04:00`,
    end_at:`${endDate}T${endTime}:00-04:00`,
    all_day:formData.get("all_day")==="on",
    guest_count:Number(formData.get("guest_count")||0),
    spaces:formData.getAll("spaces").map(String),
    assigned_staff:val(formData,"assigned_staff").split(",").map(x=>x.trim()).filter(Boolean),
    vendor_notes:val(formData,"vendor_notes")||null,
    setup_notes:val(formData,"setup_notes")||null,
    teardown_notes:val(formData,"teardown_notes")||null,
    internal_notes:val(formData,"internal_notes")||null,
    created_by:user?.id||null,
    updated_by:user?.id||null
  };

  const {error}=await supabase.from("events").insert(payload);
  if(error) throw new Error(error.message);

  const checklist=[
    ["contract_signed","Contract signed",10],
    ["deposit_received","Deposit received",20],
    ["final_payment","Final payment received",30],
    ["floor_plan","Floor plan approved",40],
    ["linens","Linens confirmed",50],
    ["tables_chairs","Tables and chairs confirmed",60],
    ["security","Security scheduled",70],
    ["bartenders","Bartenders scheduled",80],
    ["caterer","Caterer confirmed",90],
    ["cleaning","Cleaning scheduled",100],
    ["walkthrough","Final walkthrough complete",110]
  ].map(([item_key,label,sort_order])=>({id:randomUUID(),event_id:eventId,item_key,label,sort_order}));

  const {error:checkError}=await supabase.from("event_checklist").insert(checklist);
  if(checkError) throw new Error(checkError.message);

  revalidatePath("/app");
  revalidatePath("/app/calendar");
  redirect(`/app/calendar/${eventId}`);
}

export async function updateEvent(id:string,formData:FormData){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const startDate=val(formData,"start_date");
  const startTime=val(formData,"start_time")||"09:00";
  const endDate=val(formData,"end_date")||startDate;
  const endTime=val(formData,"end_time")||"23:00";

  const payload={
    title:val(formData,"title"),
    event_type:val(formData,"event_type")||"Other",
    status:val(formData,"status")||"scheduled",
    start_at:`${startDate}T${startTime}:00-04:00`,
    end_at:`${endDate}T${endTime}:00-04:00`,
    guest_count:Number(formData.get("guest_count")||0),
    spaces:formData.getAll("spaces").map(String),
    assigned_staff:val(formData,"assigned_staff").split(",").map(x=>x.trim()).filter(Boolean),
    vendor_notes:val(formData,"vendor_notes")||null,
    setup_notes:val(formData,"setup_notes")||null,
    teardown_notes:val(formData,"teardown_notes")||null,
    internal_notes:val(formData,"internal_notes")||null,
    updated_by:user?.id||null
  };

  const {error}=await supabase.from("events").update(payload).eq("id",id);
  if(error) throw new Error(error.message);
  revalidatePath("/app");
  revalidatePath("/app/calendar");
  revalidatePath(`/app/calendar/${id}`);
}

export async function toggleChecklist(itemId:string,eventId:string,completed:boolean){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const {error}=await supabase.from("event_checklist").update({
    completed:!completed,
    completed_at:!completed?new Date().toISOString():null,
    completed_by:!completed?user?.id:null
  }).eq("id",itemId);
  if(error) throw new Error(error.message);
  revalidatePath(`/app/calendar/${eventId}`);
}

export async function addTimelineItem(eventId:string,formData:FormData){
  const supabase=await createClient();
  const title=val(formData,"title");
  if(!title) throw new Error("Timeline title is required.");
  const {error}=await supabase.from("event_timeline").insert({
    id:randomUUID(),
    event_id:eventId,
    item_time:val(formData,"item_time")||null,
    title,
    notes:val(formData,"notes")||null,
    sort_order:Number(formData.get("sort_order")||0)
  });
  if(error) throw new Error(error.message);
  revalidatePath(`/app/calendar/${eventId}`);
}

export async function deleteEvent(id:string){
  const supabase=await createClient();
  const {error}=await supabase.from("events").delete().eq("id",id);
  if(error) throw new Error(error.message);
  revalidatePath("/app");
  revalidatePath("/app/calendar");
  redirect("/app/calendar");
}

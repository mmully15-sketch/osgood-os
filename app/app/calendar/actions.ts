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
    id:eventId,lead_id:val(formData,"lead_id")||null,title,
    event_type:val(formData,"event_type")||"Other",
    status:val(formData,"status")||"scheduled",
    workflow_stage:"planning",
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
    created_by:user?.id||null,updated_by:user?.id||null
  };

  const {error}=await supabase.from("events").insert(payload);
  if(error) throw new Error(error.message);

  const checklist=[
    ["contract_signed","Contract signed","Sales & Finance",10],
    ["insurance_received","Insurance certificate received","Sales & Finance",15],
    ["deposit_received","Deposit received","Sales & Finance",20],
    ["payment_schedule_confirmed","Payment schedule confirmed","Sales & Finance",25],
    ["final_payment","Final payment received","Sales & Finance",30],
    ["guest_count_final","Final guest count received","Planning",35],
    ["floor_plan","Floor plan approved","Planning",40],
    ["timeline_approved","Event timeline approved","Planning",45],
    ["linens","Linens confirmed","Planning",50],
    ["tables_chairs","Tables and chairs confirmed","Planning",60],
    ["vendor_list_complete","Vendor list complete","Vendors & Staffing",75],
    ["security","Security scheduled","Vendors & Staffing",70],
    ["bartenders","Bartenders scheduled","Vendors & Staffing",80],
    ["staff_assignments","Staff assignments confirmed","Vendors & Staffing",85],
    ["caterer","Caterer confirmed","Vendors & Staffing",90],
    ["cleaning","Cleaning scheduled","Event Readiness",100],
    ["room_setup_complete","Room setup complete","Event Readiness",105],
    ["walkthrough","Final walkthrough complete","Event Readiness",110],
    ["av_tested","AV and sound tested","Event Readiness",115],
    ["bar_stocked","Bar stocked","Event Readiness",125],
    ["post_event_inspection","Post-event inspection complete","Post Event",135],
    ["damage_report","Damage report completed","Post Event",145],
    ["final_cleanup","Final cleanup complete","Post Event",155]
  ].map(([item_key,label,category,sort_order])=>({id:randomUUID(),event_id:eventId,item_key,label,category,sort_order}));

  const {error:checkError}=await supabase.from("event_checklist").insert(checklist);
  if(checkError) throw new Error(checkError.message);

  revalidatePath("/app");revalidatePath("/app/calendar");
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
    workflow_stage:val(formData,"workflow_stage")||"planning",
    start_at:`${startDate}T${startTime}:00-04:00`,
    end_at:`${endDate}T${endTime}:00-04:00`,
    guest_count:Number(formData.get("guest_count")||0),
    final_guest_count:Number(formData.get("final_guest_count")||0)||null,
    primary_contact:val(formData,"primary_contact")||null,
    primary_phone:val(formData,"primary_phone")||null,
    emergency_contact:val(formData,"emergency_contact")||null,
    emergency_phone:val(formData,"emergency_phone")||null,
    floor_plan_status:val(formData,"floor_plan_status")||"not_started",
    event_manager:val(formData,"event_manager")||null,
    bar_manager:val(formData,"bar_manager")||null,
    security_lead:val(formData,"security_lead")||null,
    setup_lead:val(formData,"setup_lead")||null,
    cleanup_lead:val(formData,"cleanup_lead")||null,
    spaces:formData.getAll("spaces").map(String),
    assigned_staff:val(formData,"assigned_staff").split(",").map(x=>x.trim()).filter(Boolean),
    vendor_notes:val(formData,"vendor_notes")||null,
    setup_notes:val(formData,"setup_notes")||null,
    teardown_notes:val(formData,"teardown_notes")||null,
    internal_notes:val(formData,"internal_notes")||null,
    incident_notes:val(formData,"incident_notes")||null,
    updated_by:user?.id||null
  };

  const {error}=await supabase.from("events").update(payload).eq("id",id);
  if(error) throw new Error(error.message);

  revalidatePath("/app");revalidatePath("/app/calendar");revalidatePath(`/app/calendar/${id}`);
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

export async function updateChecklistItem(itemId:string,eventId:string,formData:FormData){
  const supabase=await createClient();
  const {error}=await supabase.from("event_checklist").update({
    due_date:val(formData,"due_date")||null,
    responsible_staff:val(formData,"responsible_staff")||null,
    notes:val(formData,"notes")||null
  }).eq("id",itemId);
  if(error) throw new Error(error.message);
  revalidatePath(`/app/calendar/${eventId}`);
}

export async function addTimelineItem(eventId:string,formData:FormData){
  const supabase=await createClient();
  const title=val(formData,"title");
  if(!title) throw new Error("Timeline title is required.");
  const {error}=await supabase.from("event_timeline").insert({
    id:randomUUID(),event_id:eventId,item_time:val(formData,"item_time")||null,
    title,notes:val(formData,"notes")||null,sort_order:Number(formData.get("sort_order")||0)
  });
  if(error) throw new Error(error.message);
  revalidatePath(`/app/calendar/${eventId}`);
}

export async function addVendor(eventId:string,formData:FormData){
  const supabase=await createClient();
  const company=val(formData,"company_name");
  if(!company) throw new Error("Company name is required.");
  const {error}=await supabase.from("event_vendors").insert({
    id:randomUUID(),event_id:eventId,vendor_type:val(formData,"vendor_type")||"Other",
    company_name:company,contact_name:val(formData,"contact_name")||null,
    phone:val(formData,"phone")||null,email:val(formData,"email")||null,
    arrival_time:val(formData,"arrival_time")||null,departure_time:val(formData,"departure_time")||null,
    notes:val(formData,"notes")||null,confirmed:formData.get("confirmed")==="on"
  });
  if(error) throw new Error(error.message);
  revalidatePath(`/app/calendar/${eventId}`);
}

export async function addOrUpdateRoom(eventId:string,formData:FormData){
  const supabase=await createClient();
  const room=val(formData,"room_name");
  if(!room) throw new Error("Room name is required.");
  const payload={
    id:randomUUID(),event_id:eventId,room_name:room,
    setup_style:val(formData,"setup_style")||null,
    table_count:Number(formData.get("table_count")||0),
    chair_count:Number(formData.get("chair_count")||0),
    linen_color:val(formData,"linen_color")||null,
    layout_notes:val(formData,"layout_notes")||null,
    ready:formData.get("ready")==="on"
  };
  const {error}=await supabase.from("event_rooms").upsert(payload,{onConflict:"event_id,room_name"});
  if(error) throw new Error(error.message);
  revalidatePath(`/app/calendar/${eventId}`);
}

export async function deleteEvent(id:string){
  const supabase=await createClient();
  const {error}=await supabase.from("events").delete().eq("id",id);
  if(error) throw new Error(error.message);
  revalidatePath("/app");revalidatePath("/app/calendar");
  redirect("/app/calendar");
}


export async function assignEventDayStaff(eventId:string,assignmentRole:string,formData:FormData){
  const allowedRoles=new Set(["setup","opener","closer","teardown"]);
  if(!allowedRoles.has(assignmentRole)) throw new Error("Invalid event assignment role.");

  const profileId=val(formData,"profile_id");
  if(!profileId) return;

  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();

  const {error}=await supabase.from("event_day_assignments").upsert({
    id:randomUUID(),
    event_id:eventId,
    assignment_role:assignmentRole,
    profile_id:profileId,
    created_by:user?.id||null
  },{
    onConflict:"event_id,assignment_role,profile_id",
    ignoreDuplicates:true
  });

  if(error) throw new Error(error.message);

  revalidatePath(`/app/calendar/${eventId}`);
  revalidatePath("/app/calendar");
  revalidatePath("/app/leads");
}

export async function removeEventDayStaff(assignmentId:string,eventId:string){
  const supabase=await createClient();
  const {error}=await supabase.from("event_day_assignments").delete().eq("id",assignmentId);
  if(error) throw new Error(error.message);
  revalidatePath(`/app/calendar/${eventId}`);
  revalidatePath(`/app/leads`);
}

"use server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";
import { redirect } from "next/navigation";

const val=(f:FormData,k:string)=>String(f.get(k)||"").trim();

export async function createLead(formData:FormData){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const payload={
    id:randomUUID(),name:val(formData,"name"),partner:val(formData,"partner")||null,
    email:val(formData,"email")||null,phone:val(formData,"phone")||null,
    event_type:val(formData,"event_type")||"Wedding",event_date:val(formData,"event_date")||null,
    guests:Number(formData.get("guests")||0),source:val(formData,"source")||"Website",
    status:val(formData,"status")||"inquiry",follow_up_date:val(formData,"follow_up_date")||null,
    assigned_staff:val(formData,"assigned_staff")||null,lost_reason:val(formData,"lost_reason")||null,
    notes:val(formData,"notes")||null,updated_by:user?.id||null
  };
  if(!payload.name) throw new Error("Client name is required.");
  const {error}=await supabase.from("leads").insert(payload);
  if(error) throw new Error(error.message);
  await supabase.from("activity_log").insert({id:randomUUID(),action:"lead_created",description:`Created lead: ${payload.name}`,user_id:user?.id||null});
  revalidatePath("/app"); revalidatePath("/app/leads");
  redirect(`/app/leads/${payload.id}`);
}

export async function updateLead(id:string,formData:FormData){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const payload={
    name:val(formData,"name"),partner:val(formData,"partner")||null,email:val(formData,"email")||null,
    phone:val(formData,"phone")||null,event_type:val(formData,"event_type")||"Wedding",
    event_date:val(formData,"event_date")||null,guests:Number(formData.get("guests")||0),
    source:val(formData,"source")||null,status:val(formData,"status")||"inquiry",
    follow_up_date:val(formData,"follow_up_date")||null,assigned_staff:val(formData,"assigned_staff")||null,
    lost_reason:val(formData,"lost_reason")||null,notes:val(formData,"notes")||null,updated_by:user?.id||null
  };
  if(!payload.name) throw new Error("Client name is required.");
  const {error}=await supabase.from("leads").update(payload).eq("id",id);
  if(error) throw new Error(error.message);
  await supabase.from("activity_log").insert({id:randomUUID(),action:"lead_updated",description:`Updated lead: ${payload.name}`,user_id:user?.id||null});
  revalidatePath("/app"); revalidatePath("/app/leads"); revalidatePath(`/app/leads/${id}`);
}

export async function deleteLead(id:string){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const {data:lead}=await supabase.from("leads").select("name").eq("id",id).single();
  const {error}=await supabase.from("leads").delete().eq("id",id);
  if(error) throw new Error(error.message);
  await supabase.from("activity_log").insert({id:randomUUID(),action:"lead_deleted",description:`Deleted lead: ${lead?.name||id}`,user_id:user?.id||null});
  revalidatePath("/app"); revalidatePath("/app/leads"); redirect("/app/leads");
}

export async function createTaskForLead(id:string,formData:FormData){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const title=val(formData,"title");
  if(!title) throw new Error("Task title is required.");
  const {error}=await supabase.from("tasks").insert({
    id:randomUUID(),lead_id:id,title,due_date:val(formData,"due_date")||null,
    completed:false,assigned_to:null,created_by:user?.id||null
  });
  if(error) throw new Error(error.message);
  revalidatePath(`/app/leads/${id}`); revalidatePath("/app/tasks");
}

export async function toggleTask(taskId:string,leadId:string,completed:boolean){
  const supabase=await createClient();
  const {error}=await supabase.from("tasks").update({completed:!completed}).eq("id",taskId);
  if(error) throw new Error(error.message);
  revalidatePath(`/app/leads/${leadId}`); revalidatePath("/app/tasks");
}

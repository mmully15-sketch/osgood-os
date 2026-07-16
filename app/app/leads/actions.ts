"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { randomUUID } from "crypto";

export async function createLead(formData:FormData){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();

  const payload={
    id: randomUUID(),
    name:String(formData.get("name")||"").trim(),
    partner:String(formData.get("partner")||"").trim()||null,
    email:String(formData.get("email")||"").trim()||null,
    phone:String(formData.get("phone")||"").trim()||null,
    event_type:String(formData.get("event_type")||"Wedding"),
    event_date:String(formData.get("event_date")||"")||null,
    guests:Number(formData.get("guests")||0),
    source:String(formData.get("source")||"Website"),
    status:String(formData.get("status")||"inquiry"),
    follow_up_date:String(formData.get("follow_up_date")||"")||null,
    assigned_staff:String(formData.get("assigned_staff")||"").trim()||null,
    lost_reason:String(formData.get("lost_reason")||"").trim()||null,
    notes:String(formData.get("notes")||"").trim()||null,
    updated_by:user?.id||null
  };

  if(!payload.name) throw new Error("Client name is required.");

  const {error}=await supabase.from("leads").insert(payload);
  if(error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    id: randomUUID(),
    action:"lead_created",
    description:`Created lead: ${payload.name}`,
    user_id:user?.id||null
  });

  revalidatePath("/app");
  revalidatePath("/app/leads");
}

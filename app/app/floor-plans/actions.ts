"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const value=(formData:FormData,key:string)=>String(formData.get(key)||"").trim();

export async function createFloorPlan(formData:FormData){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const id=randomUUID();
  const name=value(formData,"name")||"Ballroom Floor Plan";
  const eventId=value(formData,"event_id")||null;

  const {error}=await supabase.from("floor_plans").insert({
    id,
    event_id:eventId,
    name,
    room_type:"Ballroom",
    status:"draft",
    revision:1,
    items:[],
    created_by:user?.id||null,
    updated_by:user?.id||null
  });

  if(error) throw new Error(error.message);
  revalidatePath("/app/floor-plans");
  redirect(`/app/floor-plans/${id}`);
}

export async function deleteFloorPlan(id:string){
  const supabase=await createClient();
  const {error}=await supabase.from("floor_plans").delete().eq("id",id);
  if(error) throw new Error(error.message);
  revalidatePath("/app/floor-plans");
  redirect("/app/floor-plans");
}

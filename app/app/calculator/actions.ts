"use server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveCalculatedQuote(formData:FormData){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const leadId=String(formData.get("lead_id")||"")||null;
  const clientName=String(formData.get("client_name")||"").trim();
  if(!clientName) throw new Error("Client name is required.");
  const id=randomUUID();
  const quoteNumber=`Q-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  const total=Number(formData.get("total")||0);
  const deposit=Number(formData.get("deposit")||0);
  const payload=JSON.parse(String(formData.get("payload")||"{}"));
  const {error}=await supabase.from("quotes").insert({
    id,quote_number:quoteNumber,lead_id:leadId,client_name:clientName,
    client_email:String(formData.get("client_email")||"")||null,
    event_type:String(formData.get("event_type")||"Wedding"),
    event_date:String(formData.get("event_date")||"")||null,
    total,deposit,balance:total-deposit,status:"draft",payload,updated_by:user?.id||null
  });
  if(error) throw new Error(error.message);
  if(leadId) await supabase.from("leads").update({status:"quoted",updated_by:user?.id||null}).eq("id",leadId);
  await supabase.from("activity_log").insert({
    id:randomUUID(),action:"quote_created",description:`Created ${quoteNumber} for ${clientName} ($${total.toLocaleString()})`,user_id:user?.id||null
  });
  revalidatePath("/app");revalidatePath("/app/quotes");revalidatePath("/app/leads");
  redirect("/app/quotes");
}

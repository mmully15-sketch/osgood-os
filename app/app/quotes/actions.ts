"use server";
import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const val=(f:FormData,k:string)=>String(f.get(k)||"").trim();

export async function updateQuoteStatus(id:string,formData:FormData){
  const supabase=await createClient();
  const status=val(formData,"status")||"draft";
  const payload:any={status};
  if(status==="sent") payload.sent_at=new Date().toISOString();
  if(status==="accepted") payload.accepted_at=new Date().toISOString();
  if(status==="declined") payload.declined_at=new Date().toISOString();
  payload.valid_through=val(formData,"valid_through")||null;
  payload.proposal_notes=val(formData,"proposal_notes")||null;
  payload.terms=val(formData,"terms")||null;

  const {error}=await supabase.from("quotes").update(payload).eq("id",id);
  if(error) throw new Error(error.message);
  revalidatePath("/app/quotes"); revalidatePath(`/app/quotes/${id}`); revalidatePath("/app");
}

export async function addPaymentSchedule(id:string,formData:FormData){
  const supabase=await createClient();
  const {error}=await supabase.from("payment_schedules").insert({
    id:randomUUID(),quote_id:id,label:val(formData,"label"),
    amount:Number(formData.get("amount")||0),due_date:val(formData,"due_date")||null,
    status:"scheduled",sort_order:Number(formData.get("sort_order")||0)
  });
  if(error) throw new Error(error.message);
  revalidatePath(`/app/quotes/${id}`); revalidatePath("/app/payments");
}

export async function recordPayment(id:string,formData:FormData){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const scheduleId=val(formData,"schedule_id")||null;
  const amount=Number(formData.get("amount")||0);
  if(amount<=0) throw new Error("Payment amount must be greater than zero.");

  const {error}=await supabase.from("payments").insert({
    id:randomUUID(),quote_id:id,schedule_id:scheduleId,amount,
    payment_date:val(formData,"payment_date")||new Date().toISOString().slice(0,10),
    method:val(formData,"method")||null,reference_number:val(formData,"reference_number")||null,
    notes:val(formData,"notes")||null,recorded_by:user?.id||null
  });
  if(error) throw new Error(error.message);

  if(scheduleId){
    await supabase.from("payment_schedules").update({status:"paid"}).eq("id",scheduleId);
  }

  revalidatePath(`/app/quotes/${id}`); revalidatePath("/app/payments"); revalidatePath("/app");
}

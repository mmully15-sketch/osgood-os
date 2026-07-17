"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const val=(f:FormData,k:string)=>String(f.get(k)||"").trim();
const num=(f:FormData,k:string)=>Number(f.get(k)||0);

function quoteNumber(){
  return `Q-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
}

export async function updateQuoteStatus(id:string,formData:FormData){
  const supabase=await createClient();
  const status=val(formData,"status")||"draft";
  const payload:any={
    status,
    valid_through:val(formData,"valid_through")||null,
    proposal_notes:val(formData,"proposal_notes")||null,
    terms:val(formData,"terms")||null
  };
  if(status==="sent") payload.sent_at=new Date().toISOString();
  if(status==="accepted") payload.accepted_at=new Date().toISOString();
  if(status==="declined") payload.declined_at=new Date().toISOString();

  const {error}=await supabase.from("quotes").update(payload).eq("id",id);
  if(error) throw new Error(error.message);
  revalidatePath("/app/quotes");
  revalidatePath(`/app/quotes/${id}`);
  revalidatePath("/app");
}

export async function updateQuote(id:string,formData:FormData){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();

  const {data:current,error:readError}=await supabase.from("quotes").select("payload").eq("id",id).single();
  if(readError) throw new Error(readError.message);

  const labels=formData.getAll("item_label").map(String);
  const amounts=formData.getAll("item_amount").map(x=>Number(x||0));
  const lineItems=labels.map((label,index)=>({
    id:randomUUID(),
    label:label.trim(),
    amount:amounts[index]||0
  })).filter(item=>item.label&&item.amount!==0);

  const subtotal=lineItems.reduce((sum,item)=>sum+item.amount,0);
  const discount=Math.max(0,num(formData,"discount"));
  const total=Math.max(0,subtotal-discount);
  const deposit=Math.max(0,num(formData,"deposit"));
  const balance=Math.max(0,total-deposit);

  const payload={
    ...(current?.payload||{}),
    lineItems,
    discount,
    inclusions:val(formData,"inclusions").split("\n").map(x=>x.trim()).filter(Boolean),
    notes:val(formData,"internal_notes")||null
  };

  const update={
    client_name:val(formData,"client_name"),
    client_email:val(formData,"client_email")||null,
    event_type:val(formData,"event_type")||"Event",
    event_date:val(formData,"event_date")||null,
    total,
    deposit,
    balance,
    payload,
    proposal_notes:val(formData,"proposal_notes")||null,
    terms:val(formData,"terms")||null,
    valid_through:val(formData,"valid_through")||null,
    updated_by:user?.id||null
  };

  if(!update.client_name) throw new Error("Client name is required.");

  const {error}=await supabase.from("quotes").update(update).eq("id",id);
  if(error) throw new Error(error.message);

  await supabase.from("activity_log").insert({
    id:randomUUID(),
    action:"quote_updated",
    description:`Updated quote for ${update.client_name} (${total.toLocaleString("en-US",{style:"currency",currency:"USD"})})`,
    user_id:user?.id||null
  });

  revalidatePath("/app/quotes");
  revalidatePath(`/app/quotes/${id}`);
  revalidatePath(`/app/quotes/${id}/edit`);
  revalidatePath("/app/leads");
  redirect(`/app/quotes/${id}`);
}

export async function duplicateQuote(id:string){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const {data:q,error}=await supabase.from("quotes").select("*").eq("id",id).single();
  if(error||!q) throw new Error(error?.message||"Quote not found.");

  const newId=randomUUID();
  const newNumber=quoteNumber();
  const copy={...q};
  delete copy.created_at;
  delete copy.updated_at;

  const {error:insertError}=await supabase.from("quotes").insert({
    ...copy,
    id:newId,
    quote_number:newNumber,
    status:"draft",
    sent_at:null,
    accepted_at:null,
    declined_at:null,
    updated_by:user?.id||null
  });
  if(insertError) throw new Error(insertError.message);

  await supabase.from("activity_log").insert({
    id:randomUUID(),
    action:"quote_duplicated",
    description:`Duplicated ${q.quote_number} as ${newNumber}`,
    user_id:user?.id||null
  });

  revalidatePath("/app/quotes");
  redirect(`/app/quotes/${newId}/edit`);
}

export async function deleteQuote(id:string){
  const supabase=await createClient();

  await supabase.from("payments").delete().eq("quote_id",id);
  await supabase.from("payment_schedules").delete().eq("quote_id",id);

  const {error}=await supabase.from("quotes").delete().eq("id",id);
  if(error) throw new Error(error.message);

  revalidatePath("/app/quotes");
  revalidatePath("/app");
  revalidatePath("/app/leads");
  redirect("/app/quotes");
}

export async function addPaymentSchedule(id:string,formData:FormData){
  const supabase=await createClient();
  const label=val(formData,"label");
  if(!label) throw new Error("Schedule label is required.");

  const {error}=await supabase.from("payment_schedules").insert({
    id:randomUUID(),
    quote_id:id,
    label,
    amount:num(formData,"amount"),
    due_date:val(formData,"due_date")||null,
    status:"scheduled",
    sort_order:num(formData,"sort_order")
  });
  if(error) throw new Error(error.message);
  revalidatePath(`/app/quotes/${id}`);
  revalidatePath("/app/payments");
}

export async function recordPayment(id:string,formData:FormData){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const scheduleId=val(formData,"schedule_id")||null;
  const amount=num(formData,"amount");
  if(amount<=0) throw new Error("Payment amount must be greater than zero.");

  const {error}=await supabase.from("payments").insert({
    id:randomUUID(),
    quote_id:id,
    schedule_id:scheduleId,
    amount,
    payment_date:val(formData,"payment_date")||new Date().toISOString().slice(0,10),
    method:val(formData,"method")||null,
    reference_number:val(formData,"reference_number")||null,
    notes:val(formData,"notes")||null,
    recorded_by:user?.id||null
  });
  if(error) throw new Error(error.message);

  if(scheduleId){
    await supabase.from("payment_schedules").update({status:"paid"}).eq("id",scheduleId);
  }

  const {data:quote}=await supabase.from("quotes").select("total").eq("id",id).single();
  const {data:allPayments}=await supabase.from("payments").select("amount").eq("quote_id",id);
  const paid=(allPayments??[]).reduce((sum,p)=>sum+Number(p.amount||0),0);
  await supabase.from("quotes").update({balance:Math.max(0,Number(quote?.total||0)-paid)}).eq("id",id);

  revalidatePath(`/app/quotes/${id}`);
  revalidatePath("/app/quotes");
  revalidatePath("/app/payments");
  revalidatePath("/app");
}

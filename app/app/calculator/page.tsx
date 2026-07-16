import { createClient } from "@/lib/supabase/server";
import CalculatorClient from "./CalculatorClient";

export default async function CalculatorPage(){
  const supabase=await createClient();
  const {data:leads,error}=await supabase.from("leads").select("id,name,email,event_type,event_date,guests").neq("status","lost").order("event_date",{ascending:true,nullsFirst:false});
  if(error) throw new Error(error.message);
  return <>
    <section className="hero"><h1>Pricing Calculator</h1><p>Build wedding, corporate, and private-event estimates using The Osgood’s current pricing logic, then save the quote to the shared client record.</p></section>
    <CalculatorClient leads={leads??[]}/>
  </>;
}

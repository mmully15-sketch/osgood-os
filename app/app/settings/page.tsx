import { createClient } from "@/lib/supabase/server";

export default async function Settings(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  const {data:profile}=await supabase.from("profiles").select("*").eq("id",user!.id).single();

  return <>
    <section className="hero">
      <h1>Settings</h1>
      <p className="muted">Account and system configuration.</p>
    </section>
    <section className="card">
      <p><b>Email:</b> {user?.email}</p>
      <p><b>Name:</b> {profile?.full_name||"Not set"}</p>
      <p><b>Role:</b> {profile?.role||"staff"}</p>
      <p><b>Status:</b> {profile?.active?"Active":"Inactive"}</p>
    </section>
  </>;
}

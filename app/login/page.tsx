"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [message,setMessage]=useState("");
  const [loading,setLoading]=useState(false);

  async function signIn(e:FormEvent){
    e.preventDefault(); setLoading(true); setMessage("");
    const { error } = await supabase.auth.signInWithPassword({email,password});
    setLoading(false);
    if(error){ setMessage(error.message); return; }
    router.push("/app"); router.refresh();
  }

  return <main className="login-wrap">
    <form className="login-card" onSubmit={signIn}>
      <h1>The Osgood</h1>
      <p className="muted">Internal staff login</p>
      <div style={{marginTop:18}}><label>Email</label><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></div>
      <div style={{marginTop:13}}><label>Password</label><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
      {message && <p className="error">{message}</p>}
      <button className="btn btn-primary" style={{width:"100%",marginTop:18}} disabled={loading}>{loading?"Signing in...":"Sign In"}</button>
    </form>
  </main>
}

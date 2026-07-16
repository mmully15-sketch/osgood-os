import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { toggleTaskFromList } from "./actions";

export default async function TasksPage(){
  const supabase=await createClient();
  const {data:tasks,error}=await supabase.from("tasks").select("*,leads(name,event_date)").order("completed",{ascending:true}).order("due_date",{ascending:true,nullsFirst:false});
  if(error) throw new Error(error.message);
  return <>
    <section className="hero"><h1>Tasks</h1><p className="muted">Follow-ups and action items connected to client records.</p></section>
    <section className="card" style={{overflowX:"auto"}}><table>
      <thead><tr><th>Task</th><th>Client</th><th>Event Date</th><th>Due</th><th>Status</th><th></th></tr></thead>
      <tbody>{(tasks??[]).map(t=><tr key={t.id}>
        <td className={t.completed?"task-done":""}><b>{t.title}</b></td>
        <td>{t.leads?.name?<Link href={`/app/leads/${t.lead_id}`}>{t.leads.name}</Link>:"Unassigned"}</td>
        <td>{t.leads?.event_date||"Not set"}</td><td>{t.due_date||"Not set"}</td><td><span className="badge">{t.completed?"Completed":"Open"}</span></td>
        <td><form action={toggleTaskFromList.bind(null,t.id,t.completed)}><button className="btn btn-light" type="submit">{t.completed?"Reopen":"Complete"}</button></form></td>
      </tr>)}</tbody>
    </table></section>
  </>;
}

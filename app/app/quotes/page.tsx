import { createClient } from "@/lib/supabase/server";

export default async function QuotesPage(){
  const supabase=await createClient();
  const {data:quotes,error}=await supabase
    .from("quotes")
    .select("*")
    .order("created_at",{ascending:false});

  if(error) throw new Error(error.message);

  return <>
    <section className="hero">
      <h1>Quotes</h1>
      <p className="muted">Shared estimates and proposals. The full quote builder is the next module.</p>
    </section>

    <section className="card" style={{overflowX:"auto"}}>
      <table>
        <thead><tr><th>Quote</th><th>Client</th><th>Event</th><th>Date</th><th>Status</th><th>Total</th><th>Balance</th></tr></thead>
        <tbody>
          {(quotes??[]).map(q=><tr key={q.id}>
            <td>{q.quote_number}</td>
            <td>{q.client_name}</td>
            <td>{q.event_type||"Not set"}</td>
            <td>{q.event_date||"Not set"}</td>
            <td><span className="badge">{q.status}</span></td>
            <td>${Number(q.total||0).toLocaleString()}</td>
            <td>${Number(q.balance||0).toLocaleString()}</td>
          </tr>)}
        </tbody>
      </table>
    </section>
  </>;
}

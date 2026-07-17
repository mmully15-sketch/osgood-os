"use client";

export default function ProposalActions({
  quoteNumber,
  clientName
}:{
  quoteNumber:string;
  clientName:string;
}){
  const share=async()=>{
    const data={
      title:`${quoteNumber} · The Osgood`,
      text:`Proposal prepared for ${clientName}`,
      url:window.location.href
    };
    if(navigator.share){
      await navigator.share(data);
    }else{
      await navigator.clipboard.writeText(window.location.href);
      alert("Proposal link copied.");
    }
  };

  return <div className="actions">
    <button className="btn btn-primary" type="button" onClick={()=>window.print()}>Print / Save PDF</button>
    <button className="btn btn-light" type="button" onClick={share}>Share Proposal</button>
  </div>;
}

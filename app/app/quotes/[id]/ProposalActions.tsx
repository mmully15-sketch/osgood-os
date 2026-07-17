"use client";

export default function ProposalActions({
  quoteNumber,
  clientName
}:{
  quoteNumber:string;
  clientName:string;
}){
  const downloadPdf=()=>{
    document.title=`${clientName} - ${quoteNumber} - The Osgood Proposal`;
    window.print();
  };

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

  return <div className="actions proposal-action-buttons">
    <button className="btn btn-gold" type="button" onClick={downloadPdf}>Download PDF</button>
    <button className="btn btn-light" type="button" onClick={()=>window.print()}>Print</button>
    <button className="btn btn-light" type="button" onClick={share}>Share</button>
  </div>;
}

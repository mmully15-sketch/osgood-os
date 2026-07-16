"use client";

export default function PrintButton({label="Print / Save PDF"}:{label?:string}){
  return <button className="btn btn-gold" type="button" onClick={()=>window.print()}>{label}</button>;
}

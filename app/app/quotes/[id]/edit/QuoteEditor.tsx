"use client";

import { useMemo, useState } from "react";

type Item={id:string;label:string;amount:number};

export default function QuoteEditor({
  initialItems,
  initialDeposit,
  initialDiscount
}:{
  initialItems:Item[];
  initialDeposit:number;
  initialDiscount:number;
}){
  const [items,setItems]=useState<Item[]>(initialItems);
  const [deposit,setDeposit]=useState(initialDeposit);
  const [discount,setDiscount]=useState(initialDiscount);

  const subtotal=useMemo(()=>items.reduce((sum,item)=>sum+(Number(item.amount)||0),0),[items]);
  const total=Math.max(0,subtotal-(Number(discount)||0));
  const balance=Math.max(0,total-(Number(deposit)||0));

  return <>
    <div className="quote-editor-items">
      {items.map((item,index)=><div className="quote-editor-row" key={item.id}>
        <input
          name="item_label"
          value={item.label}
          placeholder="Description"
          onChange={e=>setItems(current=>current.map((x,i)=>i===index?{...x,label:e.target.value}:x))}
          required
        />
        <input
          name="item_amount"
          type="number"
          step="0.01"
          value={item.amount}
          onChange={e=>setItems(current=>current.map((x,i)=>i===index?{...x,amount:Number(e.target.value)}:x))}
          required
        />
        <button className="assignment-remove" type="button" onClick={()=>setItems(current=>current.filter((_,i)=>i!==index))}>Remove</button>
      </div>)}
    </div>

    <button className="btn btn-light" type="button" onClick={()=>setItems(current=>[
      ...current,
      {id:crypto.randomUUID(),label:"",amount:0}
    ])}>+ Add Line Item</button>

    <div className="quote-editor-financial-grid">
      <div><label>Discount</label><input name="discount" type="number" step="0.01" min="0" value={discount} onChange={e=>setDiscount(Number(e.target.value))}/></div>
      <div><label>Deposit</label><input name="deposit" type="number" step="0.01" min="0" value={deposit} onChange={e=>setDeposit(Number(e.target.value))}/></div>
    </div>

    <div className="quote-editor-totals">
      <div><span>Subtotal</span><b>${subtotal.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</b></div>
      <div><span>Discount</span><b>-${Number(discount||0).toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</b></div>
      <div className="total"><span>Total</span><b>${total.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</b></div>
      <div><span>Remaining balance</span><b>${balance.toLocaleString(undefined,{minimumFractionDigits:2,maximumFractionDigits:2})}</b></div>
    </div>
  </>;
}

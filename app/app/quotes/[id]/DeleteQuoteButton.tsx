"use client";

export default function DeleteQuoteButton(){
  return <button
    className="btn quote-delete-button"
    type="submit"
    onClick={(event)=>{
      if(!window.confirm("Delete this quote and its payment records? This cannot be undone.")){
        event.preventDefault();
      }
    }}
  >
    Delete Quote
  </button>;
}

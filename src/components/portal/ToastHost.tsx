"use client";
import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

export default function ToastHost(){
  const [message,setMessage]=useState("");
  useEffect(()=>{ const fn=(e:Event)=>{ const ce=e as CustomEvent<string>; setMessage(ce.detail||""); }; window.addEventListener("educn-toast",fn); return()=>window.removeEventListener("educn-toast",fn); },[]);
  useEffect(()=>{ if(!message) return; const t=window.setTimeout(()=>setMessage(""),2800); return()=>window.clearTimeout(t); },[message]);
  if(!message) return null;
  return <div className="toast-host"><div className="toast-card"><span><CheckCircle2/></span><div><b>EduCN</b><small>{message}</small></div><button onClick={()=>setMessage("")}><X/></button></div></div>;
}

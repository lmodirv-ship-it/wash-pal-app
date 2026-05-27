// hn-client.ts — auto-generated for Lavagenizar (lavagenizar.com)
// Backend: https://hn-bd.online
const HN_API='https://hn-bd.online';
const HN_KEY='hn_live_a127b6fa_z3thBvVwqJtANx3SgkF3xcpd6UlNMNne';

async function req(path:string, opts:RequestInit={}){
  const r=await fetch(HN_API+path,{
    ...opts,
    headers:{'Content-Type':'application/json','x-hn-key':HN_KEY,...(opts.headers||{})}
  });
  if(!r.ok) throw new Error(await r.text());
  return r.json();
}

export const hn={
  // Auth
  signup:(email:string,password:string,full_name:string)=>req('/api/auth/signup',{method:'POST',body:JSON.stringify({email,password,full_name})}),
  login:(email:string,password:string)=>req('/api/auth/login',{method:'POST',body:JSON.stringify({email,password})}),
  logout:()=>req('/api/auth/logout',{method:'POST'}),
  me:()=>req('/api/auth/me'),
  // Data (collection-based JSON)
  list:(collection:string)=>req('/api/data/'+collection),
  insert:(collection:string,data:any)=>req('/api/data/'+collection,{method:'POST',body:JSON.stringify(data)}),
  update:(collection:string,id:string,data:any)=>req('/api/data/'+collection+'/'+id,{method:'PATCH',body:JSON.stringify(data)}),
  remove:(collection:string,id:string)=>req('/api/data/'+collection+'/'+id,{method:'DELETE'}),
  // Files
  upload:async(file:File)=>{const fd=new FormData();fd.append('file',file);
    const r=await fetch(HN_API+'/api/files',{method:'POST',headers:{'x-hn-key':HN_KEY},body:fd});
    return r.json();},
  files:()=>req('/api/files'),
};

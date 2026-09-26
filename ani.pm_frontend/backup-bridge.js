(()=>{const B="https://ani-pm-backup-server.vercel.app",F=window.fetch.bind(window);
const api=u=>u.origin===location.origin&&u.pathname.startsWith("/api/");
window.fetch=(input,init)=>{try{const raw=typeof input==="string"?input:input.url,u=new URL(raw,location.origin);if(api(u)){
 if(u.pathname.startsWith("/api/anime/playback-bootstrap/")&&u.searchParams.get("backup")==="1")return F(B+u.pathname+u.search,init);
 if(u.pathname.startsWith("/api/anime/settlar/session")||u.pathname.startsWith("/api/anime/settlar/preview-session")||u.pathname==="/api/local/health")return F(B+u.pathname+u.search,init);
 const p=new URL(B+"/api/proxy");p.searchParams.set("path",u.pathname);u.searchParams.forEach((v,k)=>p.searchParams.append(k,v));return F(p.toString(),init)
 }}catch(e){}return F(input,init)};
window.__ANI_PM_BACKUP__=B;})();
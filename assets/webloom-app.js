
document.querySelectorAll('[data-menu]').forEach(b=>b.addEventListener('click',()=>document.body.classList.toggle('nav-open')));
document.addEventListener('click',e=>{if(document.body.classList.contains('nav-open')&&!e.target.closest('.sidebar')&&!e.target.closest('[data-menu]'))document.body.classList.remove('nav-open')});
const io='IntersectionObserver'in window?new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.08}):null;
document.querySelectorAll('.reveal').forEach(el=>io?io.observe(el):el.classList.add('show'));

(function(){
  const path = location.pathname;
  const $ = (s, root=document) => root.querySelector(s);
  const $$ = (s, root=document) => [...root.querySelectorAll(s)];
  const json = async (url, options={}) => {
    const r = await fetch(url, options);
    let d = {};
    try { d = await r.json(); } catch { throw new Error("The service is unavailable. Please try again later."); }
    if (!r.ok) throw Object.assign(new Error(d.error || "Request failed."), {status:r.status, data:d});
    return d;
  };
  const apiPost = (url, body={}) => json(url, {
    method:"POST",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  const apiPatch = (url, body={}) => json(url, {
    method:"PATCH",
    headers:{"Content-Type":"application/json"},
    body:JSON.stringify(body)
  });
  const fmtBytes = n => {
    const v = Number(n||0);
    if (v < 1024) return v+" B";
    if (v < 1048576) return (v/1024).toFixed(1)+" KB";
    if (v < 1073741824) return (v/1048576).toFixed(1)+" MB";
    return (v/1073741824).toFixed(1)+" GB";
  };
  const hostOf = url => { try { return new URL(url).hostname; } catch { return url; } };
  const goSignin = () => { location.href = "/signin?next=" + encodeURIComponent(path + location.search); };

  function showError(message, root=document.querySelector('.content') || document.querySelector('main') || document.body){
    let note=root.querySelector('.service-error');
    if(!note){note=document.createElement('p');note.className='service-error';note.setAttribute('role','alert');root.prepend(note);}
    note.textContent=message;
  }
  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function hydrateUser(){
    try{
      const d = await json("/api/me");
      if(!d.authenticated && !d.guest){
        if(/^\/(dashboard|project|billing|account|settings|admin)/.test(path)) goSignin();
        return null;
      }
      const u=d.user||{role:"guest",plan:"free",free_capture_used:d.free_capture_used};
      $$(".plan-chip b").forEach(el=>el.textContent=u.role==="owner"?"Owner access":u.plan==="pro"?"Pro plan":"Free plan");
      $$(".plan-chip p").forEach(el=>el.textContent=u.role==="owner"?"Unlimited captures + private tools.":u.plan==="pro"?"Unlimited captures enabled.":u.free_capture_used?"Free capture used.":"One complete capture included.");
      $$(".avatar").forEach(el=>{
        const email=(u.email||"WL").trim();
        el.textContent=(email.slice(0,2)||"WL").toUpperCase();
      });
      if(u.role==="owner" && !$('.side-nav a[href="/admin"]')){
        $$(".side-nav").slice(-1)[0]?.insertAdjacentHTML("beforeend", '<a href="/admin"><svg viewBox="0 0 24 24"><path d="M4 5h16v14H4zM8 9h8M8 13h5"/></svg>Owner console</a>');
      }
      return u;
    }catch(e){ showError(e.message); return null; }
  }

  function authPage(mode){
    const form=$(".auth-form");
    if(!form) return;
    const button=$("button",form);
    const email=$('input[type="email"]',form);
    const secret=$('input[type="password"]',form);
    if(!button||!email||!secret) return;
    let note=document.createElement("p");
    note.className="auth-error";
    note.setAttribute("role","alert");
    button.insertAdjacentElement("afterend",note);
    const run=async()=>{
      note.textContent="";
      const label=button.textContent;
      button.disabled=true;
      button.textContent=mode==="signin"?"Signing in…":"Creating account…";
      try{
        const d=await apiPost("/api/auth/"+mode,{email:email.value.trim(),password:secret.value});
        if(d.confirmation_required){
          note.classList.add("ok");
          note.textContent="Check your email to confirm your account.";
          button.textContent="Email sent";
          return;
        }
        const next=new URLSearchParams(location.search).get("next");
        location.href=(next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\"))?next:(d.redirect||"/dashboard");
      }catch(e){
        note.classList.remove("ok");
        note.textContent=e.message;
        button.disabled=false;
        button.textContent=label;
      }
    };
    button.addEventListener("click",run);
    form.addEventListener("submit",e=>{e.preventDefault();run();});
  }

  async function dashboard(){
    if(path!=="/dashboard") return;
    const u=await hydrateUser();
    if(!u) return;
    try{
      const d=await json("/api/projects");
      const projects=d.projects||[];
      const metrics=$$(".metric-value");
      if(metrics[0]) metrics[0].textContent=u.role==="owner"?"Owner":u.plan==="pro"?"Pro":"Free";
      if(metrics[1]) metrics[1].textContent=String(projects.filter(p=>p.status==="done").length);
      if(metrics[2]) metrics[2].textContent=fmtBytes(projects.reduce((n,p)=>n+Number(p.byte_count||0),0));
      const empty=$(".card.empty");
      const head=$(".section-head");
      if(projects.length && empty){
        empty.classList.remove("empty");
        empty.innerHTML='<div class="project-list"></div>';
        const list=$(".project-list",empty);
        projects.slice(0,8).forEach(p=>{
          const row=document.createElement("a");
          row.className="project-row";
          row.href="/project/"+p.id;
          row.innerHTML='<div class="project-favicon">'+escapeHTML(hostOf(p.source_url).slice(0,1).toUpperCase())+'</div><div class="project-row-main"><b>'+escapeHTML(hostOf(p.source_url))+'</b><span>'+escapeHTML(p.source_url)+'</span></div><span class="status-pill '+escapeHTML(p.status)+'">'+escapeHTML(p.status)+'</span><span class="project-meta">'+(p.file_count||0)+' files · '+fmtBytes(p.byte_count)+'</span><span class="row-arrow">→</span>';
          list.appendChild(row);
        });
        if(head) $("p",head).textContent=projects.length+" saved project"+(projects.length===1?"":"s");
      }
    }catch(e){ showError(e.message); }
  }

  async function projectPage(){
    if(!path.startsWith('/project')) return;
    const id=path.split('/')[2];
    if(!id) return;
    const box=$('.preview-box');
    const tabs=$$('.project-nav a');
    box.classList.add('project-panel');
    box.textContent='Loading capture…';
    let project;
    try {
      ({project}=await json('/api/projects/'+encodeURIComponent(id)));
      if(!project) throw new Error('Project was not returned by the service.');
      $('.hero-row h1').textContent=hostOf(project.source_url);
      $('.hero-row p').textContent=project.source_url;
      $('.badge.gray').textContent=project.status;
      if(['failed','error','cancelled','canceled'].includes(project.status)) throw new Error(project.error || 'This capture did not finish. Start a new capture to retry.');
      if(project.status!=='done' && project.status!=='completed'){
        box.textContent='Capture status: '+project.status+'. Waiting for the server to finish.';
        setTimeout(()=>projectPage(),3500);return;
      }
    } catch(e){box.textContent='';showError(e.message,box);return;}
    const base='/preview/'+encodeURIComponent(id)+'/';
    const cache=new Map();
    async function file(name, asText=false){
      if(cache.has(name))return cache.get(name);
      const r=await fetch(base+name);
      if(!r.ok)throw new Error('This capture has no available '+name+'.');
      const content=await r.text();
      let value=content;
      if(!asText){try{value=JSON.parse(content);}catch{throw new Error('The service did not return a valid '+name+'.');}}
      else if(!content.trim().startsWith('<?xml') && !/<(?:urlset|sitemapindex)\b/.test(content))throw new Error('No XML sitemap is available for this capture.');
      cache.set(name,value);return value;
    }
    const listOf=v=>Array.isArray(v)?v:Object.entries(v||{}).map(([path,data])=>typeof data==='object'?{path,...data}:{path,value:data});
    let selected='Overview';
    async function render(label){
      selected=label;
      tabs.forEach(t=>{const active=t.dataset.tab===label;t.classList.toggle('active',active);t.setAttribute('aria-selected',String(active));});
      box.replaceChildren();box.setAttribute('aria-busy','true');box.textContent='Loading '+label.toLowerCase()+'…';
      try{
        if(label==='Overview'){
          box.innerHTML='<div class="preview-controls" role="group" aria-label="Preview size"><b>Captured website</b><button class="btn" data-width="100%" aria-pressed="true">Desktop</button><button class="btn" data-width="768px" aria-pressed="false">Tablet</button><button class="btn" data-width="390px" aria-pressed="false">Mobile</button></div><p class="preview-note">Preview uses captured files. Remote services and protected features may be unavailable.</p><div class="preview-viewport"><iframe class="project-preview-frame" title="Captured website" sandbox="allow-scripts" referrerpolicy="no-referrer"></iframe></div>';
          $('iframe',box).src=base;
          $$('[data-width]',box).forEach(btn=>btn.addEventListener('click',()=>{
            $('.preview-viewport',box).style.width=btn.dataset.width;
            $$('[data-width]',box).forEach(b=>b.setAttribute('aria-pressed',String(b===btn)));
          }));
        }else if(label==='Export'){
          box.innerHTML='<div class="export-box"><div><h3>Export this capture</h3><p>Download the files collected from '+escapeHTML(hostOf(project.source_url))+'.</p></div><a class="btn primary" href="/api/jobs/'+encodeURIComponent(id)+'/download">Download ZIP ↓</a></div>';
        }else{
          let value;
          if(label==='Pages'||label==='Assets'){
            const manifest=await file('webloom-project.json');
            const all=listOf(manifest.files);
            value=label==='Pages'?listOf(manifest.pages||all.filter(x=>/\.html?$/i.test(x.path||x.name||''))):listOf(manifest.assets||all.filter(x=>! /\.html?$/i.test(x.path||x.name||'')));
          }else value=await file(label==='Metadata'?'metadata.json':label==='Links'?'links.json':'sitemap.xml',label==='Sitemap');
          if(selected!==label)return;
          box.replaceChildren();
          const heading=document.createElement('h2');heading.textContent=label;box.append(heading);
          if(label==='Pages'||label==='Assets'){
            const count=document.createElement('p');count.textContent=value.length+' recorded '+label.toLowerCase();box.append(count);
            const list=document.createElement('div');list.className='data-list';
            value.forEach(item=>{const row=document.createElement('div');row.className='data-row';const name=document.createElement('b');name.textContent=typeof item==='string'?item:item.path||item.url||item.name||'Unnamed file';const size=document.createElement('span');size.textContent=item.bytes!=null?fmtBytes(item.bytes):item.size!=null?fmtBytes(item.size):'';row.append(name,size);list.append(row);});box.append(list);
          }else{
            const code=document.createElement('pre');code.className='code-panel';code.textContent=typeof value==='string'?value:JSON.stringify(value,null,2);box.append(code);
          }
        }
      }catch(e){if(selected===label){box.replaceChildren();showError(e.message,box);}}
      finally{if(selected===label)box.setAttribute('aria-busy','false');}
    }
    $('.project-nav').setAttribute('role','tablist');
    tabs.forEach((tab,index)=>{
      const label=tab.textContent.trim();tab.dataset.tab=label;tab.href='#'+label.toLowerCase();tab.setAttribute('role','tab');
      tab.onclick=e=>{e.preventDefault();render(label);};
      tab.onkeydown=e=>{if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();tabs[(index+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length].focus();}};
    });
    box.setAttribute('role','tabpanel');
    await render('Overview');
  }

  async function billingPage(){
    if(path!=="/billing" && path!=="/pricing") return;
    const u=await hydrateUser();
    const buttons=$$("button");
    buttons.forEach(btn=>{
      if(/upgrade|unlock|get pro/i.test(btn.textContent)){
        btn.addEventListener("click",async()=>{
          const old=btn.textContent;btn.disabled=true;btn.textContent="Opening checkout…";
          try{const d=await apiPost("/api/billing/checkout");location.href=d.url;}
          catch(e){btn.disabled=false;btn.textContent=old;showError(e.message);}
        });
      }
      if(/manage billing/i.test(btn.textContent)){
        btn.addEventListener("click",async()=>{
          try{const d=await apiPost("/api/billing/portal");location.href=d.url;}catch(e){showError(e.message);}
        });
      }
    });
    if(u && path==="/billing"){
      const notice=$(".notice");
      if(notice) notice.textContent=u.role==="owner"?"Owner access is active. Billing is optional for this account.":u.plan==="pro"?"WebLoom Pro is active on this account.":u.free_capture_used?"Your free capture has been used. Upgrade for more captures.":"Your free capture is ready. Upgrade when you need more captures.";
    }
  }

  function recoveryPage(){
    if(path!=="/forgot") return;
    const form=$("#recoverForm");
    const button=$("#recoverButton");
    const email=$("#recoverEmail");
    const status=$("#recoverStatus");
    if(!form||!button||!email||!status) return;
    form.addEventListener("submit",async e=>{
      e.preventDefault();
      status.textContent="";
      const old=button.textContent;
      button.disabled=true;
      button.textContent="Sending…";
      try{
        await apiPost("/api/auth/recover",{email:email.value.trim()});
        status.classList.add("ok");
        status.textContent="Recovery email sent. Check your inbox.";
        button.textContent="Email sent";
      }catch(err){
        status.classList.remove("ok");
        status.textContent=err.message;
        button.disabled=false;
        button.textContent=old;
      }
    });
  }

  async function accountPage(){
    if(path!=="/account") return;
    const u=await hydrateUser();
    if(!u) return;
    const name=$("#accountName"), email=$("#accountEmail"), save=$("#saveAccount"), status=$("#accountStatus");
    if(name) name.value=u.display_name||"";
    if(email) email.value=u.email||"";
    save?.addEventListener("click",async()=>{
      const old=save.textContent;
      save.disabled=true; save.textContent="Saving…";
      if(status) status.textContent="";
      try{
        const d=await apiPatch("/api/account",{display_name:name?.value.trim()||""});
        if(status){status.className="form-status ok";status.textContent="Account saved.";}
        if(d.profile?.display_name && name) name.value=d.profile.display_name;
      }catch(err){
        if(status){status.className="form-status error";status.textContent=err.message;}
      }finally{
        save.disabled=false;save.textContent=old;
      }
    });
  }

  async function settingsPage(){
    if(path!=="/settings") return;
    const u=await hydrateUser();
    if(!u) return;
    const settings=u.settings||{};
    const capture=$("#captureMode"), format=$("#exportFormat"), naming=$("#projectNaming"), save=$("#saveSettings"), status=$("#settingsStatus");
    if(capture) capture.value=settings.capture_mode||"standard";
    if(format) format.value=settings.export_format||"zip";
    if(naming) naming.value=settings.project_naming||"hostname";
    const deepOption=capture?.querySelector('option[value="deep"]');
    if(deepOption && u.role!=="owner" && u.plan!=="pro") deepOption.disabled=true;
    save?.addEventListener("click",async()=>{
      const old=save.textContent;save.disabled=true;save.textContent="Saving…";
      if(status) status.textContent="";
      try{
        await apiPatch("/api/settings",{
          capture_mode:capture?.value||"standard",
          export_format:format?.value||"zip",
          project_naming:naming?.value||"hostname"
        });
        if(status){status.className="form-status ok";status.textContent="Defaults saved.";}
      }catch(err){
        if(status){status.className="form-status error";status.textContent=err.message;}
      }finally{save.disabled=false;save.textContent=old;}
    });
  }

  async function signoutButtons(){
    $$("[data-signout]").forEach(btn=>btn.addEventListener("click",async()=>{await apiPost("/api/auth/signout");location.href="/";}));
  }

  if(path==="/signin") authPage("signin");
  if(path==="/signup") authPage("signup");
  recoveryPage();
  if(path==="/dashboard") dashboard(); else if(!/^\/(project|billing|pricing|account|settings)/.test(path)) hydrateUser();
  projectPage();
  billingPage();
  accountPage();
  settingsPage();
  signoutButtons();

  let motionFrame=0;
  addEventListener("scroll",()=>{
    if(motionFrame) return;
    motionFrame=requestAnimationFrame(()=>{
      motionFrame=0;
      const y=Math.max(-36,Math.min(72,scrollY*.035));
      document.documentElement.style.setProperty("--app-orb-y",y+"px");
    });
  },{passive:true});
})();
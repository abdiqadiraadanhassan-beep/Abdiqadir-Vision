// 1) Ku buuxi xogta mashruuca Supabase ka hor intaadan isticmaalin app-ka.
window.SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL";
window.SUPABASE_ANON_KEY = "PASTE_YOUR_SUPABASE_ANON_KEY";

(() => {
  const $ = s => document.querySelector(s);
  const ready = window.SUPABASE_URL && window.SUPABASE_ANON_KEY &&
    !window.SUPABASE_URL.includes("PASTE_") && !window.SUPABASE_ANON_KEY.includes("PASTE_");
  let db = null, currentUser = null;
  const feed = $("#feed");
  $("#year").textContent = new Date().getFullYear();

  function setupNotice() {
    feed.innerHTML = '<p class="empty">App-ku wuu diyaar yahay, laakiin wali laguma xirin Supabase. Ku dar Project URL iyo Anon Key gudaha app.js.</p>';
  }
  if (!ready || !window.supabase) setupNotice();
  else {
    db = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    refresh();
    db.auth.getSession().then(({data}) => { currentUser = data.session?.user || null; updateAdmin(); });
    db.auth.onAuthStateChange((_event, session) => { currentUser = session?.user || null; updateAdmin(); });
  }

  $("#loginOpen").onclick = () => $("#loginDialog").showModal();
  $("#closeLogin").onclick = e => { e.preventDefault(); $("#loginDialog").close(); };
  $("#loginForm").onsubmit = async e => {
    e.preventDefault();
    if (!db) return $("#loginStatus").textContent = "Marka hore ku xir Supabase.";
    $("#loginStatus").textContent = "Waa la hubinayaa...";
    const {error} = await db.auth.signInWithPassword({email:$("#email").value.trim(),password:$("#password").value});
    $("#loginStatus").textContent = error ? "Gelitaanku wuu fashilmay. Hubi email iyo password." : "Waad gashay.";
    if (!error) $("#loginDialog").close();
  };
  $("#logout").onclick = async () => { if (db) await db.auth.signOut(); };
  function updateAdmin(){ $("#adminPanel").classList.toggle("hidden",!currentUser); }

  async function refresh(){
    if (!db) return;
    const {data,error} = await db.from("posts").select("id,title,media_url,media_type,created_at,likes").order("created_at",{ascending:false});
    if(error){ feed.innerHTML='<p class="empty">Xogta lama soo akhrin karin. Hubi jadwallada iyo rukhsadaha database-ka.</p>'; return; }
    $("#postCount").textContent = data.length;
    feed.innerHTML = "";
    if(!data.length){feed.innerHTML='<p class="empty">Weli wax muuqaal ah lama soo gelin.</p>';return;}
    for(const p of data){
      const card=document.createElement("article");card.className="post";
      const media=document.createElement((p.media_type||"").startsWith("video/")?"video":"img");
      media.src=p.media_url;if(media.tagName==="VIDEO"){media.controls=true;media.playsInline=true;}else media.alt=p.title;
      const info=document.createElement("div");info.className="postInfo";
      const h=document.createElement("h3");h.textContent=p.title;
      const actions=document.createElement("div");actions.className="actions";
      const like=document.createElement("button");like.textContent=`♡ Like (${p.likes||0})`;
      like.onclick=async()=>{const {error}=await db.rpc("increment_post_like",{post_id:p.id});if(!error)refresh();};
      actions.append(like);
      const comments=document.createElement("div");comments.className="comments";
      const form=document.createElement("form");form.className="commentForm";
      const name=document.createElement("input");name.placeholder="Magacaaga";name.maxLength=40;name.required=true;
      const body=document.createElement("input");body.placeholder="Qor faallo...";body.maxLength=500;body.required=true;
      const send=document.createElement("button");send.textContent="Dir";send.type="submit";
      form.append(name,body,send);
      form.onsubmit=async e=>{e.preventDefault();send.disabled=true;const {error}=await db.from("comments").insert({post_id:p.id,display_name:name.value.trim(),body:body.value.trim()});send.disabled=false;if(!error){body.value="";loadComments(p.id,comments);}else alert("Faallada lama dirin.");};
      info.append(h,actions,form,comments);card.append(media,info);feed.append(card);loadComments(p.id,comments);
    }
  }
  async function loadComments(id,box){
    const {data}=await db.from("comments").select("display_name,body,created_at").eq("post_id",id).order("created_at",{ascending:true}).limit(30);
    box.innerHTML="";(data||[]).forEach(c=>{const el=document.createElement("div");el.className="comment";el.textContent=`${c.display_name}: ${c.body}`;box.append(el);});
  }
  $("#uploadForm").onsubmit=async e=>{
    e.preventDefault();if(!db||!currentUser)return;
    const file=$("#mediaFile").files[0],title=$("#postTitle").value.trim(),status=$("#uploadStatus");
    if(!file)return;
    if(file.size>100*1024*1024){status.textContent="Fayl ka weyn 100 MB. Dooro mid ka yar.";return;}
    status.textContent="Waa la soo gelinayaa...";
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_"),path=`${Date.now()}-${safe}`;
    const {error:upErr}=await db.storage.from("media").upload(path,file,{upsert:false});
    if(upErr){status.textContent="Faylka lama gelin. Hubi bucket-ka media iyo rukhsaddiisa.";return;}
    const {data:urlData}=db.storage.from("media").getPublicUrl(path);
    const {error:dbErr}=await db.from("posts").insert({title,media_url:urlData.publicUrl,media_type:file.type,storage_path:path});
    if(dbErr){status.textContent="Faylku wuu kaydsamay balse qoraalka lama diiwaangelin.";return;}
    status.textContent="Waa lagu guuleystay!";$("#uploadForm").reset();refresh();
  };
})();
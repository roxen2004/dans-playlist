const KEY="dansPlaylistComments";
const SUPABASE_URL="https://jxlayotppnzrjttnctdh.supabase.co";
const SUPABASE_ANON_KEY="sb_publishable_pJVfZ0S9iMZfurQxUjUJag_bFBKAwAf";

document.addEventListener("DOMContentLoaded",()=>{setupNavigation();setupAudio();setupComments();setupHeader();setYear()});

function setupNavigation(){document.querySelectorAll('nav a[href^="#"]').forEach(a=>a.addEventListener("click",e=>{const t=document.querySelector(a.getAttribute("href"));if(t){e.preventDefault();t.scrollIntoView({behavior:"smooth"})}}))}

function setupAudio(){const players=document.querySelectorAll("audio");players.forEach(p=>p.addEventListener("play",()=>players.forEach(o=>{if(o!==p)o.pause()})))}

async function loadSupabaseLibrary(){
  if(window.supabase?.createClient)return;
  await new Promise((resolve,reject)=>{
    const script=document.createElement("script");
    script.src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
    script.onload=resolve;
    script.onerror=()=>reject(new Error("بارگذاری کتابخانه کامنت‌ها ناموفق بود."));
    document.head.appendChild(script);
  });
}

async function setupComments(){
  const form=document.querySelector("#comment-form");
  const list=document.querySelector("#comment-list");
  if(!form||!list)return;

  try{
    await loadSupabaseLibrary();
    const db=window.supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);

    async function renderComments(){
      const {data,error}=await db.from("comments")
        .select("id,name,comment,created_at")
        .order("created_at",{ascending:true});

      if(error){
        console.error("Loading comments failed:",error);
        list.textContent="بارگذاری کامنت‌ها ناموفق بود.";
        return;
      }

      list.replaceChildren();

      if(!data||data.length===0){
        const p=document.createElement("p");
        p.textContent="هنوز نظری ثبت نشده؛ اولین نظر را بنویس.";
        list.appendChild(p);
        return;
      }

      data.forEach(x=>{
        const a=document.createElement("article");
        const h=document.createElement("h3");
        const p=document.createElement("p");
        const d=document.createElement("small");

        a.className="comment";
        h.textContent=x.name;
        p.textContent=x.comment;

        if(x.created_at){
          const date=new Date(x.created_at);
          d.textContent=Number.isNaN(date.getTime())?"":date.toLocaleDateString("fa-IR");
        }

        a.append(h,p,d);
        list.appendChild(a);
      });
    }

    form.addEventListener("submit",async e=>{
      e.preventDefault();

      const nameInput=document.querySelector("#name");
      const commentInput=document.querySelector("#comment");
      if(!nameInput||!commentInput)return;

      const name=nameInput.value.trim();
      const comment=commentInput.value.trim();

      if(!name||!comment){
        alert("لطفاً نام و متن کامنت را وارد کن.");
        return;
      }

      if(name.length>60||comment.length>1000){
        alert("نام حداکثر ۶۰ و متن کامنت حداکثر ۱۰۰۰ نویسه باشد.");
        return;
      }

      const button=form.querySelector('[type="submit"]');
      if(button)button.disabled=true;

      try{
        const {error}=await db.from("comments").insert([{name,comment}]);

        if(error){
          console.error("Saving comment failed:",error);
          alert("کامنت ذخیره نشد. تنظیمات جدول و دسترسی Supabase را بررسی کن.");
          return;
        }

        form.reset();
        await renderComments();
      }finally{
        if(button)button.disabled=false;
      }
    });

    await renderComments();

    db.channel("public-comments")
      .on("postgres_changes",{
        event:"INSERT",
        schema:"public",
        table:"comments"
      },()=>renderComments())
      .subscribe();

  }catch(error){
    console.error("Comments setup failed:",error);
    list.textContent="اتصال بخش کامنت‌ها برقرار نشد. اتصال اینترنت و تنظیمات را بررسی کن.";
  }
}
function setupHeader(){const h=document.querySelector(".site-header");if(!h)return;window.addEventListener("scroll",()=>h.classList.toggle("scrolled",window.scrollY>50))}

function setYear(){document.querySelectorAll(".current-year").forEach(e=>e.textContent=new Date().getFullYear())}
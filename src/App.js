import { useState, useEffect, useRef, useCallback } from "react";

const _SB_URL = "https://znpvckfdivdycvdndxbk.supabase.co";
const _SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpucHZja2ZkaXZkeWN2ZG5keGJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2MTY2MjcsImV4cCI6MjA5MzE5MjYyN30.xw96vdrpZVxwWdFqeDVkRsvvSTekF9P31KO8RthXQOw";
const sb = window.supabase ? window.supabase.createClient(_SB_URL, _SB_KEY) : null;

const G = "#C8F000";
const BG = "#080C14";
const CARD = "#0D1525";
const BRD = "#1E3050";
const DIM = "#4A6890";

const COURTS = [
  { id:1, name:"East Naples Community Park", short:"East Naples",  address:"3500 Thomasson Dr",       fee:"Pay to play", lat:26.1091, lng:-81.7554 },
  { id:2, name:"Veterans Community Park",    short:"Veterans Park", address:"1895 Veterans Park Dr",   fee:"Free",        lat:26.2194, lng:-81.7837 },
  { id:3, name:"Fleischmann Park",           short:"Fleischmann",   address:"1600 Fleischmann Blvd",   fee:"$5 drop-in",  lat:26.1368, lng:-81.7954 },
  { id:4, name:"Pelican Bay Community Park", short:"Pelican Bay",   address:"764 Vanderbilt Beach Rd", fee:"Pay to play",  lat:26.2468, lng:-81.8123 },
  { id:5, name:"YMCA of Collier County",     short:"YMCA North",    address:"5450 YMCA Road",          fee:"Pay to play",  lat:26.2289, lng:-81.7712 },
];

const SKILLS = ["2.5","3.0","3.5","4.0","4.5","5.0"];
const SKILL_COLOR = { "2.5":"#38BDF8","3.0":"#60d4a0","3.5":"#C8F000","4.0":"#f97316","4.5":"#FF5C1A","5.0":"#ff3b3b" };
const AV_BG = ["#FF5C1A","#C8F000","#38BDF8","#C084FC","#FB7185","#34D399"];
const TTL = 2 * 60 * 60 * 1000;
const GEO_R = 300;

function geodist(la1,lo1,la2,lo2){
  const R=6371000,dL=(la2-la1)*Math.PI/180,dl=(lo2-lo1)*Math.PI/180;
  const a=Math.sin(dL/2)**2+Math.cos(la1*Math.PI/180)*Math.cos(la2*Math.PI/180)*Math.sin(dl/2)**2;
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}

// Time blocks: 6am–10pm in 2hr slots
const TIME_BLOCKS = [
  "6–8am","8–10am","10am–12pm","12–2pm","2–4pm","4–6pm","6–8pm","8–10pm"
];

// Next 7 days
function getWeekDays() {
  const days = [];
  const now = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push({
      key: d.toISOString().slice(0,10),
      label: i === 0 ? "Today" : i === 1 ? "Tomorrow" : d.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric"}),
      short: i === 0 ? "Today" : i === 1 ? "Tom" : d.toLocaleDateString("en-US",{weekday:"short"}),
    });
  }
  return days;
}

const DEMO_PLAYERS = [
  { id:"d1", name:"Sarah K.", dupr:"4.25", skill:"4.0", phone:"239-555-0101", color:"#38BDF8" },
  { id:"d2", name:"Mike R.",  dupr:"3.50", skill:"3.5", phone:"239-555-0202", color:"#C8F000" },
  { id:"d3", name:"Tom B.",   dupr:"2.75", skill:"3.0", phone:"239-555-0303", color:"#FF5C1A" },
];
const DEMO_LISTINGS = [
  { id:"l1", seller:"Sarah K.", title:"Selkirk Vanguard Power Air", price:220, phone:"239-555-0101", category:"Paddle", img:"https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=400&q=80" },
  { id:"l2", seller:"Mike R.",  title:"Franklin X-40 Pickleballs (12pk)", price:28, phone:"239-555-0202", category:"Balls", img:"https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=400&q=80" },
  { id:"l3", seller:"Tom B.",   title:"ASICS Court Shoes Size 10", price:55, phone:"239-555-0303", category:"Shoes", img:"https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80" },
];
const DEMO_SUGG = [
  { id:"s1", text:"Game request feature to challenge other players", votes:12 },
  { id:"s2", text:"Show court busyness by hour of day", votes:8 },
  { id:"s3", text:"Skill-based matchmaking", votes:6 },
];
// Demo schedule entries: { id, pid, name, color, skill, dupr, courtId, day, block }
const DEMO_SCHEDULE = [
  { id:"sc1", pid:"d1", name:"Sarah K.", color:"#38BDF8", skill:"4.0", dupr:"4.25", courtId:1, day: getWeekDays()[1].key, block:"8–10am" },
  { id:"sc2", pid:"d2", name:"Mike R.",  color:"#C8F000", skill:"3.5", dupr:"3.50", courtId:1, day: getWeekDays()[1].key, block:"8–10am" },
  { id:"sc3", pid:"d3", name:"Tom B.",   color:"#FF5C1A", skill:"3.0", dupr:"2.75", courtId:2, day: getWeekDays()[2].key, block:"10am–12pm" },
];

function ss(k,d){try{const v=sessionStorage.getItem(k);return v?JSON.parse(v):d;}catch{return d;}}
function sw(k,v){try{sessionStorage.setItem(k,JSON.stringify(v));}catch{}}

// ── Network Pickleball Icon ────────────────────────────────────────────────
// A circular icon: pickleball holes replaced with dots connected by lines
// forming a network/graph pattern inside the ball silhouette
function NetworkBall({ size = 42 }) {
  const s = size;
  const c = s / 2;
  const r = s / 2 - 1.5;
  // Node positions (8 nodes arranged like pickleball holes)
  const nodes = [
    [c,        c],              // center
    [c,        c - s*0.28],    // top
    [c + s*0.28, c],           // right
    [c,        c + s*0.28],    // bottom
    [c - s*0.28, c],           // left
    [c + s*0.20, c - s*0.20],  // top-right
    [c + s*0.20, c + s*0.20],  // bottom-right
    [c - s*0.20, c + s*0.20],  // bottom-left
    [c - s*0.20, c - s*0.20],  // top-left
  ];
  // Connections (edges of the network)
  const edges = [
    [0,1],[0,2],[0,3],[0,4],
    [1,5],[2,5],[2,6],[3,6],
    [3,7],[4,7],[4,8],[1,8],
    [5,6],[6,7],[7,8],[8,5],
  ];
  const nr = s * 0.055; // node radius
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{display:"block"}}>
      {/* Ball body */}
      <circle cx={c} cy={c} r={r} fill="#1A2800" stroke={G} strokeWidth={s*0.045}/>
      {/* Subtle inner glow ring */}
      <circle cx={c} cy={c} r={r - s*0.07} fill="none" stroke="rgba(200,240,0,0.08)" strokeWidth={s*0.025}/>
      {/* Network edges */}
      {edges.map(([a,b],i) => (
        <line key={i}
          x1={nodes[a][0]} y1={nodes[a][1]}
          x2={nodes[b][0]} y2={nodes[b][1]}
          stroke="rgba(200,240,0,0.35)" strokeWidth={s*0.022} strokeLinecap="round"/>
      ))}
      {/* Network nodes */}
      {nodes.map(([nx,ny],i) => (
        <circle key={i} cx={nx} cy={ny} r={i===0 ? nr*1.5 : nr}
          fill={i===0 ? G : "rgba(200,240,0,0.75)"}
          stroke={i===0 ? "rgba(200,240,0,0.4)" : "none"}
          strokeWidth={s*0.02}/>
      ))}
    </svg>
  );
}

function Badge({skill,dupr}){
  const rating=dupr||skill||"3.5";
  const bg=SKILL_COLOR[rating]||SKILL_COLOR[skill]||"#888";
  const dark=["2.5","3.0","3.5"].includes(rating);
  return <span style={{background:bg,color:dark?"#111":"#fff",borderRadius:5,padding:"2px 7px",fontSize:11,fontWeight:700,whiteSpace:"nowrap"}}>{rating} DUPR</span>;
}
function Avatar({name,color,size=38}){
  return <div style={{width:size,height:size,borderRadius:"50%",background:color||"#444",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:size*0.42,fontWeight:700,color:"#111"}}>{name?.[0]?.toUpperCase()||"?"}</div>;
}

export default function App() {
  const [view, setView]         = useState("courts");
  const [players, setPlayers]   = useState(()=>ss("cc_pl",DEMO_PLAYERS));
  const [cu, setCu]             = useState(()=>ss("cc_cu",null));
  const [cins, setCins]         = useState(()=>ss("cc_ci",[]).filter(c=>c.exp>Date.now()));
  const [fol, setFol]           = useState(()=>ss("cc_fol",[]));
  const [listings, setList]     = useState(()=>ss("cc_lst",DEMO_LISTINGS));
  const [sugg, setSugg]         = useState(()=>ss("cc_sg",DEMO_SUGG));
  const [voted, setVoted]       = useState(()=>ss("cc_vt",[]));
  const [schedule, setSched]    = useState(()=>ss("cc_sched",DEMO_SCHEDULE));
  const [selCourt, setSelCourt] = useState(null);
  const [checkedIn, setCheckedIn]=useState(false);
  const [now, setNow]           = useState(Date.now());
  const [toast, setToast]       = useState(null);
  const [step, setStep]         = useState(1);
  const [form, setForm]         = useState({name:"",dupr:"",skill:"3.5",phone:"",email:"",gender:"",age:"",avatar:null,notifyEmail:true,notifyText:false,notifySkills:["2.5","3.0","3.5","4.0","4.5","5.0"]});
  const [pSort, setPSort]       = useState("name");
  const [pSkill, setPSkill]     = useState("all");
  const [pCourt, setPCourt]     = useState("all");
  const [mCat, setMCat]         = useState("All");
  const [sellOpen, setSellOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [pendingListing, setPendingListing] = useState(null);
  const [nl, setNl]             = useState({title:"",price:"",phone:"",category:"Paddle",img:""});
  const [buyItem, setBuyItem]   = useState(null);
  const [buyDone, setBuyDone]   = useState(false);
  const [cardNum, setCardNum]   = useState("");
  const [cardExp, setCardExp]   = useState("");
  const [cardCvv, setCardCvv]   = useState("");
  const [newSugg, setNewSugg]   = useState("");
  const [vpp, setVpp]           = useState(null);
  const [openCalls, setOpenCalls] = useState([
    {id:"oc1",pid:"d1",name:"Sarah K.",color:"#38BDF8",skill:"4.0",dupr:"4.25",courtId:1,day:"Today",time:"8–10am",msg:"Looking for 3.5+ players for doubles!",ts:Date.now()-3600000},
    {id:"oc2",pid:"d2",name:"Mike R.",color:"#C8F000",skill:"3.5",dupr:"3.50",courtId:2,day:"Tomorrow",time:"10am–12pm",msg:"Anyone want to hit? 3.5 DUPR friendly",ts:Date.now()-1800000},
  ]);
  const [ratings, setRatings]   = useState([]);
  const [showRateModal, setShowRateModal] = useState(null);
  const [liveFilters, setLiveFilters] = useState({court:"all",skill:"all",gender:"all",name:"",age:"all"});
  const [userCity, setUserCity]       = useState("Naples, Florida");
  const [geoSt, setGeoSt]             = useState("idle");
  const [upos, setUpos]               = useState(null);
  const [nearC, setNearC]             = useState(null);
  const watchRef                      = useRef(null);
  const geoNoted                      = useRef(new Set()); // default to Naples // player obj
  const [newCall, setNewCall]   = useState({courtId:1,day:"Today",time:"8–10am",msg:"",isPrivate:false,privateName:"",privateAddress:"",privateInviteOnly:false,gameType:null,wantedSkill:"Any DUPR"});
  const [showCallForm, setShowCallForm] = useState(false);
  const [messages, setMessages] = useState([]);
  const [msgTarget, setMsgTarget] = useState(null);
  const [msgText, setMsgText] = useState("");
  const [playSubview, setPlaySubview]   = useState(null);
  const [privateGames, setPrivateGames] = useState(()=>ss("cc_pg",[]));
  const [privateInvites, setPrivateInvites] = useState([]);
  const [showInvitePicker, setShowInvitePicker] = useState(false);
  const [notifyPrompt, setNotifyPrompt] = useState(null); // {court, day, block, entry}
  const [avPrev, setAvPrev]           = useState(null);
  const [contactForm, setContactForm] = useState({name:"",email:"",subject:"",message:""});
  const [contactSent, setContactSent] = useState(false);
  const [contactSending, setContactSending] = useState(false);

  // ── EmailJS config — replace these with your real IDs from emailjs.com ──
  const EMAILJS_SERVICE  = "YOUR_SERVICE_ID";
  const EMAILJS_TEMPLATE = "YOUR_TEMPLATE_ID";
  const EMAILJS_KEY      = "YOUR_PUBLIC_KEY";

  // Fire Open Call notifications to matching players
  // In production: this calls your backend which sends real email/SMS via EmailJS + Twilio
  // For now: shows in-app toast previews of who would be notified
  function fireOpenCallNotifications(call){
    const court = COURTS.find(c=>c.id===call.courtId);
    const courtName = call.isPrivate ? call.courtName : court?.name || call.courtName;
    const matchingPlayers = players.filter(p=>{
      if(p.id===cu?.id)return false; // don't notify yourself
      if(!p.notifyEmail&&!p.notifyText)return false; // opted out
      if(!p.notifySkills||p.notifySkills.length===0)return false;
      // Match if skill level is close (within 1 level) or exact
      const callSkillIdx = SKILLS.indexOf(call.skill);
      return p.notifySkills.some(s=>{
        const sIdx = SKILLS.indexOf(s);
        return Math.abs(sIdx - callSkillIdx) <= 1;
      });
    });

    if(matchingPlayers.length === 0) return;

    // Show preview of notifications that would fire
    const methods = matchingPlayers.flatMap(p=>[
      p.notifyEmail && `📧 ${p.email||p.name}`,
      p.notifyText  && `💬 ${p.phone||p.name}`,
    ].filter(Boolean));

    // In production, replace this with real API calls:
    // matchingPlayers.forEach(p => {
    //   if(p.notifyEmail) emailjs.send(SERVICE, TEMPLATE, {to:p.email, ...})
    //   if(p.notifyText)  twilio.messages.create({to:p.phone, body:...})
    // })

    setTimeout(()=>{
      toast_(`🔔 ${matchingPlayers.length} player${matchingPlayers.length!==1?"s":""} notified about your game!`);
    }, 800);
  }

  // Silently detect city on app load
  useEffect(()=>{
    if(navigator.geolocation){
      navigator.geolocation.getCurrentPosition(
        pos=>reverseGeocode(pos.coords.latitude,pos.coords.longitude),
        ()=>{},{timeout:5000,maximumAge:300000}
      );
    }
  },[]);

  // Check for upcoming private games and remind players 30min before
  useEffect(()=>{
    const check=setInterval(()=>{
      if(!cu)return;
      const myGames=privateGames.filter(g=>g.hostId===cu.id||g.invites?.includes(cu.id));
      myGames.forEach(g=>{
        const dayIdx=WEEK.findIndex(d=>d.label===g.day||d.short===g.day);
        if(dayIdx<0)return;
        const blockStart=TIME_BLOCKS.indexOf(g.time);
        if(blockStart<0)return;
        // Rough time: block index * 2hrs from 6am
        const gameHour=6+(blockStart*2);
        const now2=new Date();
        const gameTime=new Date(WEEK[dayIdx].key);
        gameTime.setHours(gameHour,0,0,0);
        const minsUntil=(gameTime-now2)/60000;
        if(minsUntil>28&&minsUntil<32&&!g.reminded){
          setPrivateGames(p=>p.map(x=>x.id===g.id?{...x,reminded:true}:x));
          toast_(`🔔 Reminder: "${g.location}" starts in 30 min!`);
          if(typeof Notification!=="undefined"&&Notification.permission==="granted"){
            try{new Notification(`CourtCall Reminder`,{body:`Your game at ${g.location} starts in 30 minutes!`});}catch{}
          }
        }
      });
    },60000);
    return()=>clearInterval(check);
  },[cu,privateGames]);

  function startGeo(){
    if(!navigator.geolocation){setGeoSt("unsupported");return;}
    setGeoSt("watching");
    watchRef.current=navigator.geolocation.watchPosition(pos=>{
      const{latitude:la,longitude:lo}=pos.coords;
      setUpos({la,lo});
      reverseGeocode(la,lo);
      let cl=null,cd=Infinity;
      for(const c of COURTS){const d=geodist(la,lo,c.lat||0,c.lng||0);if(d<cd){cd=d;cl=c;}}
      if(cl&&cd<=GEO_R){
        setNearC(cl);
        if(!geoNoted.current.has(cl.id)){
          geoNoted.current.add(cl.id);
          beep(880,.5);
          const cnt=cins.filter(c=>c.cid===cl.id).length;
          showToast(`🏓 You're at ${cl.short}!`,`${cnt} player${cnt!==1?"s":""} checked in`,{label:"Check In",fn:()=>{setSelCourt(cl);setView("checkin");}});
          if(typeof Notification!=="undefined"&&Notification.permission==="granted"){
            try{new Notification(`You're at ${cl.short}!`,{body:`${cnt} players checked in`});}catch{}
          }
        }
      } else {
        setNearC(null);
        if(cl)geoNoted.current.delete(cl.id);
      }
    },err=>setGeoSt(err.code===1?"denied":"error"),
    {enableHighAccuracy:true,maximumAge:10000,timeout:15000});
  }

  function stopGeo(){
    if(watchRef.current!==null){navigator.geolocation.clearWatch(watchRef.current);watchRef.current=null;}
    setGeoSt("idle");setUpos(null);setNearC(null);
  }

  const dLbl=c=>{if(!upos)return null;const d=geodist(upos.la,upos.lo,c.lat||0,c.lng||0);return d<1000?`${Math.round(d)}m`:`${(d/1609).toFixed(1)}mi`;};

  // Reverse geocode — get city/state from GPS coordinates
  async function reverseGeocode(lat, lng){
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
        { headers: { "Accept-Language": "en" } }
      );
      const data = await res.json();
      const city  = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
      const state = data.address?.state || "";
      if(city && state) setUserCity(`${city}, ${state}`);
      else if(state)    setUserCity(state);
    } catch {
      // keep default
    }
  }

  async function sendContactEmail(){
    if(!contactForm.name.trim()||!contactForm.email.trim()||!contactForm.message.trim())return;
    setContactSending(true);
    try {
      const res = await fetch("https://api.emailjs.com/api/v1.0/email/send",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({
          service_id:  EMAILJS_SERVICE,
          template_id: EMAILJS_TEMPLATE,
          user_id:     EMAILJS_KEY,
          template_params:{
            from_name:  contactForm.name,
            from_email: contactForm.email,
            subject:    contactForm.subject||"General",
            message:    contactForm.message,
          }
        })
      });
      if(res.ok){ setContactSent(true); }
      else { toast_("Failed to send — try again"); }
    } catch {
      toast_("Network error — try again");
    }
    setContactSending(false);
  }
  // Schedule UI state
  const [schedCourt, setSchedCourt] = useState(null); // which court they're scheduling for
  const [schedDay, setSchedDay]     = useState(null);
  const WEEK = getWeekDays();

  useEffect(()=>{sw("cc_pl",players);},[players]);
  useEffect(()=>{sw("cc_cu",cu);},[cu]);
  useEffect(()=>{sw("cc_ci",cins);},[cins]);
  useEffect(()=>{sw("cc_fol",fol);},[fol]);
  useEffect(()=>{sw("cc_lst",listings);},[listings]);
  useEffect(()=>{sw("cc_sg",sugg);},[sugg]);
  useEffect(()=>{sw("cc_vt",voted);},[voted]);
  useEffect(()=>{sw("cc_pg",privateGames);},[privateGames]);
  useEffect(()=>{sw("cc_sched",schedule);},[schedule]);
  useEffect(()=>{const t=setInterval(()=>{setNow(Date.now());setCins(p=>p.filter(c=>c.exp>Date.now()));},20000);return()=>clearInterval(t);},[]);

  const toast_=(m)=>{setToast(m);setTimeout(()=>setToast(null),2800);};

  function checkin(){
    if(!cu||!selCourt)return;
    const upd=cins.filter(c=>c.pid!==cu.id);
    upd.push({id:Date.now(),pid:cu.id,cid:selCourt.id,exp:Date.now()+TTL});
    setCins(upd);setCheckedIn(true);
    setTimeout(()=>{setCheckedIn(false);setView("live");},1400);
  }
  function checkout(id){setCins(p=>p.filter(c=>c.id!==id));}
  function follow(pid){setFol(p=>p.includes(pid)?p.filter(x=>x!==pid):[...p,pid]);}

  function signup(){
    const color=AV_BG[players.length%AV_BG.length];
    const p={id:`p_${Date.now()}`,name:form.name.trim(),dupr:form.dupr,skill:form.skill,phone:form.phone,email:form.email,gender:form.gender,age:form.age,avatar:form.avatar||null,notifyEmail:form.notifyEmail,notifyText:form.notifyText,notifySkills:form.notifySkills,color};
    setAvPrev(null);
    setPlayers(prev=>[...prev,p]);setCu(p);
    setForm({name:"",dupr:"",skill:"3.5",avatar:null,phone:""});setStep(1);setView("courts");
    toast_(`Welcome, ${p.name}! 🏓`);
  }

  const STRIPE_LINK = "https://buy.stripe.com/your_payment_link_here";

  function handleAv(e){
    const f=e.target.files[0];if(!f)return;
    // Compress to max 400px wide for storage
    const img=new Image();
    const reader=new FileReader();
    reader.onload=ev=>{
      img.onload=()=>{
        const canvas=document.createElement('canvas');
        const MAX=400;
        let w=img.width,h=img.height;
        if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
        canvas.width=w;canvas.height=h;
        canvas.getContext('2d').drawImage(img,0,0,w,h);
        const compressed=canvas.toDataURL('image/jpeg',0.82);
        setAvPrev(compressed);
        setForm(d=>({...d,avatar:compressed}));
      };
      img.src=ev.target.result;
    };
    reader.readAsDataURL(f);
  }

  function postListing(){
    if(!nl.title.trim()||!nl.price)return;
    const item={id:`l_${Date.now()}`,seller:cu?.name||"",title:nl.title,price:parseFloat(nl.price),phone:nl.phone||cu?.phone||"",category:nl.category,img:nl.img||null,status:"pending"};
    setList(p=>[item,...p]);setPendingListing(item);setSellOpen(false);setShowPaywall(true);
  }
  function confirmPayment(){
    setList(p=>p.map(l=>l.id===pendingListing?.id?{...l,status:"active"}:l));
    setPendingListing(null);setShowPaywall(false);
    setNl({title:"",price:"",phone:"",category:"Paddle",img:""});
    toast_("Listing is live! 🏓");
  }
  function cancelPayment(){
    setList(p=>p.filter(l=>l.id!==pendingListing?.id));
    setPendingListing(null);setShowPaywall(false);
  }

  function submitSugg(){
    if(!newSugg.trim())return;
    const s={id:`s_${Date.now()}`,text:newSugg.trim(),votes:1};
    setSugg(p=>[s,...p]);setVoted(p=>[...p,s.id]);setNewSugg("");toast_("Submitted! 💡");
  }
  function vote(id){if(voted.includes(id))return;setSugg(p=>p.map(s=>s.id===id?{...s,votes:s.votes+1}:s));setVoted(p=>[...p,id]);}

  // Toggle a schedule block on/off
  function toggleBlock(courtId, day, block){
    if(!cu)return;
    const exists=schedule.find(s=>s.pid===cu.id&&s.courtId===courtId&&s.day===day&&s.block===block);
    if(exists){
      setSched(p=>p.filter(s=>s.id!==exists.id));
      toast_("Removed from schedule");
    } else {
      const entry={id:`sc_${Date.now()}`,pid:cu.id,name:cu.name,color:cu.color,skill:cu.skill,dupr:cu.dupr,courtId,day,block};
      setSched(p=>[...p,entry]);
      // Show notify prompt
      const court=COURTS.find(c=>c.id===courtId);
      const dayObj=WEEK.find(d=>d.key===day);
      setNotifyPrompt({court,dayObj,block,entry});
    }
  }

  function sendScheduleAlert(entry, court, dayObj, block){
    // Find followers + skill-matched players with notifications on
    const targets=players.filter(p=>{
      if(p.id===cu.id)return false;
      if(!p.notifyEmail&&!p.notifyText)return false;
      const isFollower=fol.includes(p.id)||players.find(x=>x.id===p.id)?.following?.includes(cu.id);
      const skillMatch=Math.abs(SKILLS.indexOf(p.skill)-SKILLS.indexOf(cu.skill))<=1;
      const wantsSkill=(p.notifySkills||SKILLS).some(s=>Math.abs(SKILLS.indexOf(s)-SKILLS.indexOf(cu.skill))<=1);
      return (isFollower||skillMatch)&&wantsSkill;
    });
    // In production: loop targets and send email/SMS via EmailJS + Twilio
    // targets.forEach(p => emailjs.send(...) or twilio.messages.create(...))
    if(targets.length>0){
      toast_(`🔔 ${targets.length} player${targets.length!==1?"s":""} notified about your game!`);
    } else {
      toast_("Scheduled! No matching players to notify yet.");
    }
    setNotifyPrompt(null);
  }

  function isMyBlock(courtId,day,block){return cu&&schedule.some(s=>s.pid===cu.id&&s.courtId===courtId&&s.day===day&&s.block===block);}
  function blockPlayers(courtId,day,block){return schedule.filter(s=>s.courtId===courtId&&s.day===day&&s.block===block);}

  function filteredPlayers(){
    let r=[...players];
    if(pSkill==="playing")r=r.filter(p=>cins.some(c=>c.pid===p.id));
    else if(SKILLS.includes(pSkill))r=r.filter(p=>parseFloat(p.dupr||p.skill||0)>=parseFloat(pSkill));
    if(pCourt!=="all")r=r.filter(p=>cins.some(c=>c.pid===p.id&&c.cid===parseInt(pCourt)));
    if(pSort==="dupr")r.sort((a,b)=>parseFloat(b.dupr||0)-parseFloat(a.dupr||0));
    else if(pSort==="skill")r.sort((a,b)=>SKILLS.indexOf(b.skill)-SKILLS.indexOf(a.skill));
    else r.sort((a,b)=>a.name.localeCompare(b.name));
    return r;
  }

  const courtCins=id=>cins.filter(c=>c.cid===id);
  const pById=id=>players.find(p=>p.id===id);
  const myCin=()=>cu?cins.find(c=>c.pid===cu.id):null;
  const tLeft=exp=>{const m=Math.max(0,Math.floor((exp-now)/60000));return m>=60?`${Math.floor(m/60)}h ${m%60}m`:`${m}m`;};

  // Count of my upcoming schedule entries
  const mySchedCount = cu ? schedule.filter(s=>s.pid===cu.id).length : 0;

  const TABS=[
    {id:"courts",  label:"Courts"},
    {id:"live",    label:"Live",    badge:cins.length},
    {id:"play",    label:"Play",    badge:mySchedCount+privateGames.length},
    {id:"community",label:"Community"},
    {id:"nearme",  label:geoSt==="watching"?"📍 On":"Near Me"},
    {id:"market",  label:"Shop"},
    {id:cu?"profile":"signup", label:cu?"Profile":"Sign Up"},
    {id:"contact", label:"Contact Us"},
  ];

  return(
    <div style={{minHeight:"100vh",background:BG,color:"#F4FFCC",fontFamily:"system-ui,sans-serif",fontSize:14}}>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .card{background:#0D1525;border:1px solid #1E3050;border-radius:14px;padding:14px}
        .card.tap{cursor:pointer;transition:border-color .15s}
        .card.tap:hover{border-color:rgba(200,240,0,.4)}
        .pbtn{background:#C8F000;color:#111;border:none;border-radius:50px;padding:11px 26px;font-size:15px;font-weight:700;cursor:pointer;transition:opacity .15s}
        .pbtn:hover:not(:disabled){opacity:.88}.pbtn:disabled{opacity:.4;cursor:not-allowed}
        .gbtn{background:transparent;color:#4A6890;border:1px solid #1E3050;border-radius:50px;padding:8px 18px;font-size:13px;cursor:pointer}
        .gbtn:hover{color:#fff;border-color:#4A6890}
        .dbtn{background:transparent;color:#f87171;border:1px solid #4a2020;border-radius:8px;padding:5px 11px;font-size:12px;cursor:pointer}
        .dbtn:hover{background:rgba(248,113,113,.1)}
        .fbtn{border:none;border-radius:50px;padding:6px 14px;font-size:12px;font-weight:700;cursor:pointer}
        .fbtn.on{background:#C8F000;color:#111}.fbtn.off{background:transparent;color:#C8F000;border:1px solid #C8F000}
        .inp{background:#080C14;border:1.5px solid #1E3050;border-radius:10px;color:#F4FFCC;font-size:14px;padding:11px 13px;width:100%;outline:none}
        .inp:focus{border-color:#C8F000}.inp::placeholder{color:#2A4060}
        textarea.inp{resize:vertical;min-height:64px}
        .tab{background:none;border:none;color:#4A6890;font-size:13px;font-weight:600;cursor:pointer;padding:8px 9px;border-bottom:2px solid transparent;white-space:nowrap;transition:color .15s,border-color .15s}
        .tab.on{color:#C8F000;border-bottom-color:#C8F000}
        .bdg{display:inline-block;background:#C8F000;color:#111;border-radius:50%;width:16px;height:16px;font-size:10px;font-weight:700;text-align:center;line-height:16px;margin-left:3px}
        .row{display:flex;align-items:center;gap:10px;background:#080C14;border-radius:10px;padding:10px 12px;margin-bottom:7px;border:1px solid #1E3050}
        .chip{border:1px solid #1E3050;border-radius:50px;padding:4px 11px;font-size:12px;cursor:pointer;background:transparent;color:#4A6890;white-space:nowrap;transition:all .15s}
        .chip.on{background:#C8F000;color:#111;border-color:#C8F000}
        .dot{width:7px;height:7px;border-radius:50%;background:#C8F000;display:inline-block;margin-right:4px;animation:bl 1.5s infinite}
        @keyframes bl{0%,100%{opacity:1}50%{opacity:.2}}
        .toast{position:fixed;top:12px;left:50%;transform:translateX(-50%);background:#C8F000;color:#111;border-radius:12px;padding:11px 20px;font-weight:700;font-size:14px;z-index:999;white-space:nowrap;animation:pop .3s ease}
        @keyframes pop{from{opacity:0;transform:translateX(-50%) scale(.9)}to{opacity:1;transform:translateX(-50%) scale(1)}}
        .bigpop{animation:bigpop .5s ease}
        @keyframes bigpop{0%{opacity:0;transform:scale(.7)}70%{transform:scale(1.08)}100%{opacity:1;transform:scale(1)}}
        .mcard{background:#0D1525;border:1px solid #1E3050;border-radius:12px;overflow:hidden}
        .mcard:hover{border-color:rgba(200,240,0,.3)}
        .lbl{font-size:10px;color:#4A6890;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:4px}
        .secdiv{border-bottom:1px solid #1E3050;margin-bottom:8px;padding-bottom:6px}
        .sdots{display:flex;gap:7px;justify-content:center;margin-bottom:20px}
        .sdot{width:7px;height:7px;border-radius:50%;background:#1E3050}
        .sdot.on{background:#C8F000}
        @keyframes slideup{from{transform:translateY(100%)}to{transform:translateY(0)}}
        .blk{border:1.5px solid #1E3050;border-radius:10px;padding:8px 6px;cursor:pointer;text-align:center;transition:all .15s;background:#080C14;position:relative}
        .blk:hover{border-color:rgba(200,240,0,.4)}
        .blk.mine{background:rgba(200,240,0,.15);border-color:#C8F000}
        .blk.has{border-color:rgba(200,240,0,.3)}
        .daysel{border:1.5px solid #1E3050;border-radius:10px;padding:8px 10px;cursor:pointer;text-align:center;transition:all .15s;background:#080C14;flex:1}
        .daysel:hover{border-color:rgba(200,240,0,.3)}
        .daysel.on{background:rgba(200,240,0,.12);border-color:#C8F000;color:#C8F000}
      `}</style>

      {toast&&<div className="toast">{toast}</div>}

      <div style={{maxWidth:460,margin:"0 auto",padding:"14px 12px 80px"}}>

        {/* HEADER */}
        <div style={{textAlign:"center",marginBottom:14}}>
          <div style={{fontSize:9,letterSpacing:4,color:G,marginBottom:4,opacity:.7}}>🌴 {userCity.toUpperCase()}</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:2}}>
            <NetworkBall size={44}/>
            <span style={{fontSize:32,fontWeight:800,letterSpacing:-1,color:"#F4FFCC"}}>
              Court<span style={{color:G}}>Call</span>
            </span>
          </div>
          <div style={{fontSize:9,letterSpacing:4,color:DIM}}>PICKLEBALL NETWORK</div>
          {cu&&(
            <div style={{marginTop:8,display:"inline-flex",alignItems:"center",gap:6,background:CARD,border:`1px solid ${BRD}`,borderRadius:50,padding:"4px 12px"}}>
              <Avatar name={cu.name} color={cu.color} size={20} avatar={cu.avatar||null}/>
              <span style={{fontSize:12,color:G,fontWeight:600}}>{cu.name}</span>
              {myCin()&&<span style={{fontSize:11,color:DIM}}>· playing now</span>}
            </div>
          )}
        </div>

        {/* NAV */}
        <div style={{display:"flex",borderBottom:`1px solid ${BRD}`,marginBottom:14,overflowX:"auto"}}>
          {TABS.map(t=>(
            <button key={t.id} className={`tab ${view===t.id?"on":""}`} onClick={()=>setView(t.id)}>
              {t.label}{t.badge>0&&<span className="bdg">{t.badge}</span>}
            </button>
          ))}
        </div>

        {/* ════ COURTS ════ */}
        {view==="courts"&&(
          <div>
            {!cu&&(
              <div className="card" style={{marginBottom:10,borderColor:"rgba(200,240,0,.2)"}}>
                <div style={{color:G,fontWeight:700,marginBottom:4}}>👋 New to CourtCall?</div>
                <div style={{color:DIM,fontSize:13,marginBottom:8}}>Create a profile to check in and schedule games.</div>
                <button className="pbtn" style={{fontSize:13,padding:"8px 18px"}} onClick={()=>setView("signup")}>Create Profile</button>
              </div>
            )}

            {COURTS.map(court=>{
              const ci=courtCins(court.id);
              // Count upcoming scheduled players this week
              const upcoming=schedule.filter(s=>s.courtId===court.id).length;
              return(
                <div key={court.id} className="card tap" style={{marginBottom:9}}
                  onClick={()=>{if(!cu){setView("signup");return;}setSelCourt(court);setView("checkin");}}>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <div style={{flex:1,marginRight:10}}>
                      <div style={{fontWeight:700,fontSize:15,marginBottom:3}}>{court.name}</div>
                      <div style={{color:DIM,fontSize:12}}>📍 {court.address} · {court.fee}</div>
                      <div style={{display:"flex",gap:12,marginTop:5}}>
                        {ci.length>0&&<span style={{fontSize:12,color:G,fontWeight:600}}><span className="dot"/>{ci.length} playing now</span>}
                        {upcoming>0&&<span style={{fontSize:12,color:"#A8D400"}}>📅 {upcoming} scheduled</span>}
                      </div>
                      {ci.length>0&&(
                        <div style={{marginTop:6,display:"flex",gap:3}}>
                          {ci.slice(0,5).map(c=>{const p=pById(c.pid);return p?<Avatar key={c.id} name={p.name} color={p.color} size={22}/>:null;})}
                          {ci.length>5&&<span style={{color:DIM,fontSize:11}}>+{ci.length-5}</span>}
                        </div>
                      )}
                    </div>
                    <div style={{textAlign:"right",flexShrink:0,minWidth:52}}>
                      <div style={{fontSize:28,fontWeight:800,color:ci.length>0?G:"#1E3050"}}>{ci.length}</div>
                      <div style={{fontSize:10,color:DIM,marginBottom:4}}>NOW</div>
                      <div style={{width:48,height:5,background:"#1E3050",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${Math.min(100,ci.length*16)}%`,background:ci.length>5?"#FF5C1A":ci.length>2?G:"#2A6A2A",borderRadius:3,transition:"width .4s"}}/>
                      </div>
                      <div style={{fontSize:9,color:DIM,marginTop:2}}>{ci.length===0?"Empty":ci.length<3?"Quiet":ci.length<6?"Active":"Busy"}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════ CHECK-IN ════ */}
        {view==="checkin"&&selCourt&&(
          <div>
            <button className="gbtn" style={{marginBottom:14}} onClick={()=>setView("courts")}>← Back</button>
            {checkedIn?(
              <div className="bigpop" style={{textAlign:"center",padding:"40px 0"}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:12}}><NetworkBall size={72}/></div>
                <div style={{fontSize:26,fontWeight:800,color:G}}>YOU'RE IN!</div>
                <div style={{color:DIM,marginTop:5}}>{selCourt.short} · 2 hours</div>
              </div>
            ):(
              <>
                <div className="card" style={{marginBottom:10}}>
                  <div style={{fontWeight:700,fontSize:16}}>{selCourt.name}</div>
                  <div style={{color:DIM,fontSize:12,marginTop:3}}>📍 {selCourt.address} · {selCourt.fee}</div>
                </div>
                {myCin()&&<div style={{background:"rgba(251,191,36,.08)",border:"1px solid rgba(251,191,36,.2)",borderRadius:10,padding:"9px 12px",marginBottom:10,fontSize:13,color:"#FBBF24"}}>⚠️ Already checked in elsewhere — this will move you here.</div>}
                <div style={{color:DIM,fontSize:13,marginBottom:14}}>⏱ Auto-expires after <strong style={{color:"#fff"}}>2 hours</strong></div>
                <button className="pbtn" style={{width:"100%"}} onClick={checkin}>CHECK IN NOW</button>
                <div style={{textAlign:"center",marginTop:10}}>
                  <button className="gbtn" onClick={()=>{setPlaySubview("create");setView("play");}}>📅 Schedule instead →</button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ════ LIVE ════ */}
        {view==="live"&&(
          <div>
            <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>LIVE NOW</div>
            <div style={{color:DIM,fontSize:13,marginBottom:12}}>Players currently checked in near {userCity}.</div>

            {/* Filters */}
            <div className="card" style={{marginBottom:14,padding:"12px"}}>
              <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
                <div style={{flex:1,minWidth:120}}>
                  <div className="lbl">Court</div>
                  <select className="inp" style={{padding:"8px 10px",fontSize:13}} value={liveFilters.court} onChange={e=>setLiveFilters(d=>({...d,court:e.target.value}))}>
                    <option value="all">All Courts</option>
                    {COURTS.map(c=><option key={c.id} value={c.id}>{c.short}</option>)}
                  </select>
                </div>
                <div style={{flex:1,minWidth:100}}>
                  <div className="lbl">DUPR</div>
                  <select className="inp" style={{padding:"8px 10px",fontSize:13}} value={liveFilters.skill} onChange={e=>setLiveFilters(d=>({...d,skill:e.target.value}))}>
                    <option value="all">All Ratings</option>
                    {SKILLS.map(s=><option key={s}>{s}+</option>)}
                  </select>
                </div>
                <div style={{flex:1,minWidth:80}}>
                  <div className="lbl">Gender</div>
                  <select className="inp" style={{padding:"8px 10px",fontSize:13}} value={liveFilters.gender} onChange={e=>setLiveFilters(d=>({...d,gender:e.target.value}))}>
                    <option value="all">All</option>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:8}}>
                <div style={{flex:2}}>
                  <div className="lbl">Search by name</div>
                  <input className="inp" style={{padding:"8px 10px",fontSize:13}} placeholder="Type a name..." value={liveFilters.name} onChange={e=>setLiveFilters(d=>({...d,name:e.target.value}))}/>
                </div>
                <div style={{flex:1}}>
                  <div className="lbl">Age range</div>
                  <select className="inp" style={{padding:"8px 10px",fontSize:13}} value={liveFilters.age} onChange={e=>setLiveFilters(d=>({...d,age:e.target.value}))}>
                    <option value="all">All Ages</option>
                    <option value="18-30">18–30</option>
                    <option value="31-50">31–50</option>
                    <option value="51-65">51–65</option>
                    <option value="65+">65+</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Results */}
            {(()=>{
              const filtered = cins.filter(c=>{
                const p = pById(c.pid); if(!p) return false;
                if(liveFilters.court!=="all" && c.cid!==parseInt(liveFilters.court)) return false;
                if(liveFilters.skill!=="all" && parseFloat(p.dupr||p.skill||0)<parseFloat(liveFilters.skill)) return false;
                if(liveFilters.gender!=="all" && p.gender!==liveFilters.gender) return false;
                if(liveFilters.name && !p.name.toLowerCase().includes(liveFilters.name.toLowerCase())) return false;
                if(liveFilters.age!=="all"){
                  const age=parseInt(p.age||0);
                  if(liveFilters.age==="18-30"&&(age<18||age>30))return false;
                  if(liveFilters.age==="31-50"&&(age<31||age>50))return false;
                  if(liveFilters.age==="51-65"&&(age<51||age>65))return false;
                  if(liveFilters.age==="65+"&&age<65)return false;
                }
                return true;
              });

              if(filtered.length===0) return(
                <div style={{textAlign:"center",padding:"36px 0"}}>
                  <div style={{fontSize:36,marginBottom:10,opacity:.4}}>🏓</div>
                  <div style={{color:"#1E3050",fontWeight:700,fontSize:16,marginBottom:6}}>{cins.length===0?"NO ONE CHECKED IN":"NO MATCHES"}</div>
                  <div style={{color:"#1E3050",fontSize:13,marginBottom:16}}>{cins.length===0?"Be the first out there!":"Try adjusting your filters"}</div>
                  {cins.length===0&&<button className="pbtn" onClick={()=>setView("courts")}>Check In</button>}
                </div>
              );

              return COURTS.map(court=>{
                const courtCi=filtered.filter(c=>c.cid===court.id);
                if(!courtCi.length)return null;
                return(
                  <div key={court.id} style={{marginBottom:20}}>
                    <div className="secdiv" style={{display:"flex",justifyContent:"space-between"}}>
                      <span style={{fontWeight:700}}>{court.name}</span>
                      <span style={{color:DIM,fontSize:12}}>{courtCi.length} active</span>
                    </div>
                    {courtCi.map(c=>{
                      const p=pById(c.pid); if(!p)return null;
                      const isMe=cu?.id===p.id;
                      return(
                        <div key={c.id} className="row">
                          <Avatar name={p.name} color={p.color} size={36} avatar={p.avatar||null}/>
                          <div style={{flex:1,cursor:"pointer"}} onClick={()=>{setVpp(p);setView("pprofile");}}>
                            <div style={{fontWeight:600,fontSize:14,display:"flex",gap:5,alignItems:"center",flexWrap:"wrap"}}>
                              {p.name}
                              {isMe&&<span style={{fontSize:9,background:G,color:"#111",borderRadius:3,padding:"1px 4px"}}>YOU</span>}
                              {p.gender&&<span style={{fontSize:10,color:DIM}}>{p.gender}</span>}
                              {p.age&&<span style={{fontSize:10,color:DIM}}>· {p.age}y</span>}
                            </div>
                            <div style={{display:"flex",gap:5,marginTop:2,flexWrap:"wrap",alignItems:"center"}}>
                              <Badge skill={p.skill} dupr={p.dupr}/>
                              <span style={{color:DIM,fontSize:11}}>{tLeft(c.exp)} left</span>
                            </div>
                          </div>
                          <div style={{display:"flex",gap:5,flexShrink:0}}>
                            {!isMe&&(
                              <div style={{display:"flex",gap:5}}>
                                <button className={`fbtn ${fol.includes(p.id)?"on":"off"}`} onClick={()=>{toggleFol(p.id);}}>{fol.includes(p.id)?"✓":"+ Follow"}</button>
                                <button style={{background:"transparent",border:`1px solid ${BRD}`,color:DIM,borderRadius:8,padding:"5px 10px",fontSize:11,cursor:"pointer"}} onClick={()=>setShowRateModal(p)}>⭐</button>
                              </div>
                            )}
                            {isMe&&<button className="dbtn" onClick={()=>doOut(c.id)}>Check Out</button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* ── Schedule Notify Prompt ── */}
        {notifyPrompt&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div style={{background:CARD,border:`1px solid ${BRD}`,borderRadius:"20px 20px 0 0",padding:"28px 20px 40px",width:"100%",maxWidth:460}}>

              {/* Icon + heading */}
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{fontSize:44,marginBottom:10}}>📅</div>
                <div style={{fontWeight:800,fontSize:20,marginBottom:6}}>You're Scheduled!</div>
                <div style={{color:DIM,fontSize:13,lineHeight:1.5}}>
                  <strong style={{color:"#fff"}}>{notifyPrompt.block}</strong> at <strong style={{color:G}}>{notifyPrompt.court?.name}</strong><br/>
                  {notifyPrompt.dayObj?.label}
                </div>
              </div>

              {/* Who would be notified */}
              {(()=>{
                const targets=players.filter(p=>{
                  if(p.id===cu?.id)return false;
                  if(!p.notifyEmail&&!p.notifyText)return false;
                  const skillMatch=Math.abs(SKILLS.indexOf(p.skill)-SKILLS.indexOf(cu?.skill||"3.5"))<=1;
                  const wantsSkill=(p.notifySkills||SKILLS).some(s=>Math.abs(SKILLS.indexOf(s)-SKILLS.indexOf(cu?.skill||"3.5"))<=1);
                  return skillMatch&&wantsSkill;
                });
                return(
                  <div style={{background:"#080C14",border:`1px solid ${BRD}`,borderRadius:12,padding:"14px",marginBottom:20}}>
                    <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>
                      {targets.length>0
                        ?<><span style={{color:G}}>{targets.length} player{targets.length!==1?"s":""}</span> will be notified</>
                        :"No matching players to notify yet"
                      }
                    </div>
                    {targets.length>0&&(
                      <>
                        <div style={{display:"flex",gap:4,flexWrap:"wrap",marginBottom:8}}>
                          {targets.slice(0,6).map(p=>(
                            <div key={p.id} style={{display:"flex",alignItems:"center",gap:5,background:"#0D1525",borderRadius:20,padding:"3px 8px 3px 3px"}}>
                              <Avatar name={p.name} color={p.color} size={20} avatar={p.avatar||null}/>
                              <span style={{fontSize:11,color:"#ccc"}}>{p.name}</span>
                              <Badge skill={p.skill} dupr={p.dupr}/>
                            </div>
                          ))}
                          {targets.length>6&&<span style={{fontSize:11,color:DIM,lineHeight:"26px"}}>+{targets.length-6} more</span>}
                        </div>
                        <div style={{display:"flex",gap:16,fontSize:12,color:DIM}}>
                          {targets.some(p=>p.notifyEmail)&&<span>📧 Email</span>}
                          {targets.some(p=>p.notifyText)&&<span>💬 SMS</span>}
                        </div>
                        <div style={{fontSize:11,color:DIM,marginTop:6}}>
                          Message: <span style={{color:"#ccc"}}>"{cu?.name} just scheduled {notifyPrompt.block} at {notifyPrompt.court?.short} — {notifyPrompt.dayObj?.label}. Tap to join!"</span>
                        </div>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Action buttons */}
              <button className="pbtn" style={{width:"100%",fontSize:16,marginBottom:10}}
                onClick={()=>sendScheduleAlert(notifyPrompt.entry,notifyPrompt.court,notifyPrompt.dayObj,notifyPrompt.block)}>
                🔔 Yes, Notify Players
              </button>
              <button className="gbtn" style={{width:"100%"}}
                onClick={()=>{setNotifyPrompt(null);toast_("Scheduled! ✓");}}>
                No thanks — just schedule it
              </button>
            </div>
          </div>
        )}

        {/* Rate Player Modal */}
        {showRateModal&&(
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
            <div style={{background:CARD,border:`1px solid ${BRD}`,borderRadius:"20px 20px 0 0",padding:"28px 20px 40px",width:"100%",maxWidth:460}}>
              <div style={{textAlign:"center",marginBottom:20}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Avatar name={showRateModal.name} color={showRateModal.color} size={56}/></div>
                <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>Rate {showRateModal.name}</div>
                <div style={{color:DIM,fontSize:13}}>How was your game with this player?</div>
              </div>
              {[
                {stars:"⭐⭐⭐⭐⭐",label:"Amazing — great game!",color:G},
                {stars:"⭐⭐⭐⭐",label:"Good game, fun player",color:"#A8D400"},
                {stars:"⭐⭐⭐",label:"OK — nothing special",color:"#FBBF24"},
                {stars:"⭐⭐",label:"Bit rough — poor sportsmanship",color:"#f97316"},
              ].map(r=>(
                <button key={r.stars} onClick={()=>{
                  setRatings(p=>[...p,{pid:showRateModal.id,name:showRateModal.name,stars:r.stars,label:r.label,by:cu?.name,ts:Date.now()}]);
                  setShowRateModal(null);toast_(`Rated ${showRateModal.name} ${r.stars}`);
                }} style={{display:"block",width:"100%",background:"#080C14",border:`1px solid ${BRD}`,borderRadius:10,padding:"12px 16px",marginBottom:8,cursor:"pointer",textAlign:"left",transition:"border-color .15s"}}
                  onMouseOver={e=>e.currentTarget.style.borderColor=r.color}
                  onMouseOut={e=>e.currentTarget.style.borderColor=BRD}>
                  <div style={{fontSize:18,marginBottom:2}}>{r.stars}</div>
                  <div style={{fontSize:13,color:"#ccc"}}>{r.label}</div>
                </button>
              ))}
              <button className="gbtn" style={{width:"100%",marginTop:6}} onClick={()=>setShowRateModal(null)}>Cancel</button>
            </div>
          </div>
        )}

        {/* ════ PLAY ════ */}
        {view==="play"&&(
          <div>
            {!playSubview&&(
              <div>
                <div style={{fontWeight:800,fontSize:22,marginBottom:4}}>PLAY</div>
                <div style={{color:DIM,fontSize:13,marginBottom:20}}>What do you want to do?</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:24}}>
                  <div style={{background:"rgba(200,240,0,.07)",border:"2px solid rgba(200,240,0,.3)",borderRadius:16,padding:"22px 14px",cursor:"pointer",textAlign:"center"}}
                    onClick={()=>setPlaySubview("create")}>
                    <div style={{fontSize:36,marginBottom:8}}>🏓</div>
                    <div style={{fontWeight:800,fontSize:16,color:G,marginBottom:4}}>Create a Match</div>
                    <div style={{fontSize:12,color:DIM,lineHeight:1.4}}>Schedule or post a game</div>
                  </div>
                  <div style={{background:"rgba(160,130,250,.07)",border:"2px solid rgba(160,130,250,.3)",borderRadius:16,padding:"22px 14px",cursor:"pointer",textAlign:"center"}}
                    onClick={()=>setPlaySubview("join")}>
                    <div style={{fontSize:36,marginBottom:8}}>🔍</div>
                    <div style={{fontWeight:800,fontSize:16,color:"#C084FC",marginBottom:4}}>Join a Match</div>
                    <div style={{fontSize:12,color:DIM,lineHeight:1.4}}>Find games near you</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  {[{n:cins.length,label:"Playing Now",color:G},{n:schedule.filter(s=>WEEK.slice(0,7).some(d=>d.key===s.day)).length,label:"Scheduled",color:"#A8D400"},{n:privateGames.length,label:"Private Games",color:"#C084FC"}].map(s=>(
                    <div key={s.label} style={{flex:1,background:"#080C14",border:`1px solid ${BRD}`,borderRadius:10,padding:"10px 6px",textAlign:"center"}}>
                      <div style={{fontWeight:800,fontSize:22,color:s.color}}>{s.n}</div>
                      <div style={{fontSize:10,color:DIM,marginTop:2,lineHeight:1.3}}>{s.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── CREATE A MATCH ── */}
            {playSubview==="create"&&(
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                  <button className="gbtn" style={{padding:"6px 12px",fontSize:13}} onClick={()=>setPlaySubview(null)}>← Back</button>
                  <div style={{fontWeight:800,fontSize:18,color:G}}>Create a Match</div>
                </div>

                {!cu&&<div className="card" style={{marginBottom:12,borderColor:"rgba(200,240,0,.2)"}}><div style={{color:G,fontWeight:700,marginBottom:4}}>Sign in first</div><button className="pbtn" style={{fontSize:13,padding:"8px 18px"}} onClick={()=>setView("signup")}>Create Profile</button></div>}

                {cu&&(
                  <div>
                    <div className="lbl" style={{marginBottom:8}}>Type of game</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:16}}>
                      {[
                        {id:"scheduled",icon:"📅",title:"Schedule"},
                        {id:"private",  icon:"🔒",title:"Private"},
                        {id:"round",    icon:"🏆",title:"Round Robin"},
                      ].map(t=>(
                        <div key={t.id} style={{background:newCall.gameType===t.id?"rgba(200,240,0,.1)":"#080C14",border:`1.5px solid ${newCall.gameType===t.id?G:"#1E3050"}`,borderRadius:12,padding:"12px 8px",cursor:"pointer",textAlign:"center",transition:"all .15s"}}
                          onClick={()=>setNewCall(d=>({...d,gameType:t.id,isPrivate:t.id==="private"}))}>
                          <div style={{fontSize:22,marginBottom:4}}>{t.icon}</div>
                          <div style={{fontWeight:700,fontSize:12,color:newCall.gameType===t.id?G:"#ccc"}}>{t.title}</div>
                        </div>
                      ))}
                    </div>

                    {newCall.gameType&&(
                      <div className="card" style={{borderColor:"rgba(200,240,0,.2)"}}>

                        {/* Court / location */}
                        {newCall.gameType!=="private"&&(
                          <><div className="lbl">Court</div>
                          <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
                            {COURTS.map(c=><button key={c.id} className={`chip ${newCall.courtId===c.id?"on":""}`} onClick={()=>setNewCall(d=>({...d,courtId:c.id}))}>{c.short}</button>)}
                          </div></>
                        )}
                        {newCall.gameType==="private"&&(
                          <div style={{background:"#080C14",border:"1px solid #1E3050",borderRadius:10,padding:"12px",marginBottom:12}}>
                            <div style={{fontSize:12,color:"#C084FC",fontWeight:700,marginBottom:8}}>🔒 Private Location</div>
                            <div className="lbl">Location Name</div>
                            <input className="inp" placeholder="e.g. My Backyard, Club Naples" value={newCall.privateName} onChange={e=>setNewCall(d=>({...d,privateName:e.target.value}))} style={{marginBottom:8}}/>
                            <div className="lbl">Address</div>
                            <input className="inp" placeholder="Only shown to invited players" value={newCall.privateAddress} onChange={e=>setNewCall(d=>({...d,privateAddress:e.target.value}))} style={{marginBottom:0}}/>
                          </div>
                        )}

                        {/* Day + Time */}
                        <div style={{display:"flex",gap:8,marginBottom:10}}>
                          <div style={{flex:1}}><div className="lbl">Day</div>
                            <select className="inp" value={newCall.day} onChange={e=>setNewCall(d=>({...d,day:e.target.value}))}>
                              {["Today","Tomorrow",...WEEK.slice(2).map(w=>w.label)].map(d=><option key={d}>{d}</option>)}
                            </select>
                          </div>
                          <div style={{flex:1}}><div className="lbl">Time</div>
                            <select className="inp" value={newCall.time} onChange={e=>setNewCall(d=>({...d,time:e.target.value}))}>
                              {TIME_BLOCKS.map(t=><option key={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>

                        {/* Skill wanted */}
                        <div className="lbl">Looking for (DUPR)</div>
                        <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                          {["Any DUPR",...SKILLS].map(s=>(
                            <button key={s} className={`chip ${(newCall.wantedSkill||"Any Level")===s?"on":""}`} onClick={()=>setNewCall(d=>({...d,wantedSkill:s}))}>{s}</button>
                          ))}
                        </div>

                        <div className="lbl">Message</div>
                        <input className="inp" placeholder="e.g. Friendly doubles, all welcome!" value={newCall.msg} onChange={e=>setNewCall(d=>({...d,msg:e.target.value}))} style={{marginBottom:12}}/>

                        {/* Private game — invite from Community */}
                        {newCall.gameType==="private"&&(
                          <div style={{marginBottom:12}}>
                            <div className="lbl" style={{marginBottom:8}}>Invite Players</div>
                            <div style={{background:"#080C14",border:"1px solid #1E3050",borderRadius:10,padding:"10px",marginBottom:8}}>
                              {privateInvites.length===0
                                ? <div style={{color:DIM,fontSize:13,textAlign:"center",padding:"8px 0"}}>No players invited yet</div>
                                : privateInvites.map(pid=>{
                                  const p=players.find(x=>x.id===pid);
                                  return p?(
                                    <div key={pid} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                                      <Avatar name={p.name} color={p.color} size={28} avatar={p.avatar||null}/>
                                      <span style={{flex:1,fontSize:13}}>{p.name}</span>
                                      <Badge skill={p.skill} dupr={p.dupr}/>
                                      <button style={{background:"transparent",border:"none",color:"#f87171",fontSize:14,cursor:"pointer"}} onClick={()=>setPrivateInvites(prev=>prev.filter(x=>x!==pid))}>✕</button>
                                    </div>
                                  ):null;
                                })
                              }
                            </div>
                            <button style={{width:"100%",background:"rgba(192,132,252,.08)",border:"1px solid rgba(192,132,252,.3)",color:"#C084FC",borderRadius:10,padding:"10px",fontSize:13,fontWeight:700,cursor:"pointer"}}
                              onClick={()=>setShowInvitePicker(true)}>
                              + Add Players from Community
                            </button>
                          </div>
                        )}

                        <button className="pbtn" style={{width:"100%"}}
                          disabled={newCall.gameType==="private"&&!newCall.privateName?.trim()}
                          onClick={()=>{
                            if(newCall.gameType==="scheduled"||newCall.gameType==="round"){
                              const dayKey=WEEK.find(d=>d.label===newCall.day||d.short===newCall.day||d.key===newCall.day)?.key||WEEK[0].key;
                              if(newCall.courtId) toggleBlock(newCall.courtId,dayKey,newCall.time);
                              toast_("Session scheduled! 📅");
                            } else {
                              const pg={id:`pg_${Date.now()}`,hostId:cu.id,hostName:cu.name,hostColor:cu.color,hostSkill:cu.skill,hostDupr:cu.dupr,location:newCall.privateName,address:newCall.privateAddress,day:newCall.day,time:newCall.time,msg:newCall.msg,wantedSkill:newCall.wantedSkill||"Any Level",invites:privateInvites,ts:Date.now()};
                              setPrivateGames(prev=>[pg,...prev]);
                              // Notify invitees
                              if(privateInvites.length>0){
                                toast_(`Private game created! ${privateInvites.length} player${privateInvites.length!==1?"s":""} invited 🔒`);
                                fireOpenCallNotifications({...pg,skill:cu.skill,courtId:newCall.courtId});
                              } else {
                                toast_("Private game created! 🔒");
                              }
                            }
                            setNewCall(d=>({...d,gameType:null,msg:"",privateName:"",privateAddress:"",wantedSkill:"Any DUPR"}));
                            setPrivateInvites([]);
                            setPlaySubview(null);
                          }}>CREATE GAME →</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── JOIN A MATCH ── */}
            {playSubview==="join"&&(
              <div>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
                  <button className="gbtn" style={{padding:"6px 12px",fontSize:13}} onClick={()=>setPlaySubview(null)}>← Back</button>
                  <div style={{fontWeight:800,fontSize:18,color:"#C084FC"}}>Join a Match</div>
                </div>

                {/* Scheduled sessions */}
                <div style={{fontWeight:700,fontSize:13,color:"#A8D400",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${BRD}`}}>📅 SCHEDULED SESSIONS</div>
                {schedule.length===0
                  ?<div style={{color:DIM,fontSize:13,padding:"8px 0 14px"}}>No sessions scheduled yet.</div>
                  :WEEK.slice(0,4).map(day=>{
                    const de=schedule.filter(s=>s.day===day.key);
                    if(!de.length)return null;
                    return(
                      <div key={day.key} style={{marginBottom:14}}>
                        <div style={{fontSize:12,color:"#A8D400",fontWeight:700,marginBottom:6}}>{day.label}</div>
                        {COURTS.map(court=>{
                          const ces=de.filter(s=>s.courtId===court.id);
                          if(!ces.length)return null;
                          return([...new Set(ces.map(s=>s.block))].map(block=>{
                            const bp=ces.filter(s=>s.block===block);
                            const myMatch=cu?bp.some(s=>Math.abs(SKILLS.indexOf(s.skill)-SKILLS.indexOf(cu.skill))<=1):true;
                            return(
                              <div key={block} style={{display:"flex",alignItems:"center",gap:8,background:"#080C14",border:`1px solid ${BRD}`,borderRadius:9,padding:"9px 11px",marginBottom:6}}>
                                <div style={{flex:1}}>
                                  <div style={{display:"flex",gap:6,marginBottom:3,flexWrap:"wrap",alignItems:"center"}}>
                                    <span style={{fontWeight:700,fontSize:13,color:"#A8D400"}}>{block}</span>
                                    <span style={{fontSize:11,color:DIM}}>@ {court.short}</span>
                                    {myMatch&&cu&&<span style={{background:"rgba(200,240,0,.12)",color:G,fontSize:10,fontWeight:700,padding:"2px 6px",borderRadius:50}}>✓ Your Level</span>}
                                  </div>
                                  <div style={{display:"flex",gap:3,alignItems:"center"}}>
                                    {bp.slice(0,4).map(s=><Avatar key={s.id} name={s.name} color={s.color} size={20}/>)}
                                    <span style={{color:DIM,fontSize:11,marginLeft:4}}>{bp.length} player{bp.length!==1?"s":""}</span>
                                  </div>
                                </div>
                                {cu&&!bp.some(s=>s.pid===cu.id)&&<button style={{background:G,color:"#111",border:"none",borderRadius:8,padding:"6px 14px",fontSize:12,fontWeight:700,cursor:"pointer",flexShrink:0}} onClick={()=>toggleBlock(court.id,day.key,block)}>+ Join</button>}
                                {cu&&bp.some(s=>s.pid===cu.id)&&<span style={{fontSize:11,color:G,fontWeight:600,flexShrink:0}}>✓ You're in</span>}
                              </div>
                            );
                          }));
                        })}
                      </div>
                    );
                  })
                }
              </div>
            )}

            {/* ── INVITE PICKER MODAL (Community link) ── */}
            {showInvitePicker&&(
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:300,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
                <div style={{background:CARD,border:`1px solid ${BRD}`,borderRadius:"20px 20px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:460,maxHeight:"75vh",overflowY:"auto"}}>
                  <div style={{fontWeight:800,fontSize:18,marginBottom:4}}>Add Players</div>
                  <div style={{color:DIM,fontSize:13,marginBottom:14}}>Select players from Community to invite to your private game.</div>
                  {players.filter(p=>p.id!==cu?.id).map(p=>{
                    const selected=privateInvites.includes(p.id);
                    return(
                      <div key={p.id} style={{display:"flex",alignItems:"center",gap:10,background:selected?"rgba(200,240,0,.08)":"#080C14",border:`1px solid ${selected?G:BRD}`,borderRadius:10,padding:"10px 12px",marginBottom:8,cursor:"pointer",transition:"all .15s"}}
                        onClick={()=>setPrivateInvites(prev=>selected?prev.filter(x=>x!==p.id):[...prev,p.id])}>
                        <Avatar name={p.name} color={p.color} size={36} avatar={p.avatar||null}/>
                        <div style={{flex:1}}>
                          <div style={{fontWeight:600,fontSize:14}}>{p.name}</div>
                          <div style={{display:"flex",gap:5,marginTop:2,alignItems:"center"}}><Badge skill={p.skill} dupr={p.dupr}/>{p.phone&&<span style={{fontSize:11,color:DIM}}>📱 {p.phone}</span>}</div>
                        </div>
                        <div style={{width:22,height:22,borderRadius:"50%",border:`2px solid ${selected?G:"#1E3050"}`,background:selected?G:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,color:"#111",fontWeight:800,flexShrink:0}}>{selected&&"✓"}</div>
                      </div>
                    );
                  })}
                  <button className="pbtn" style={{width:"100%",marginTop:8}} onClick={()=>setShowInvitePicker(false)}>
                    Done ({privateInvites.length} selected)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ COMMUNITY ════ */}
        {view==="community"&&(
          <div>
            <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>COMMUNITY</div>
            <div style={{color:DIM,fontSize:13,marginBottom:12}}>{userCity} pickleball players. Message anyone directly.</div>

            {/* Search + filters */}
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <input className="inp" style={{flex:2,padding:"9px 12px",fontSize:13}} placeholder="Search players..." value={pSort==="name"?liveFilters.name:""} onChange={e=>setLiveFilters(d=>({...d,name:e.target.value}))}/>
              <select className="inp" style={{flex:1,padding:"9px 10px",fontSize:13}} value={pSkill} onChange={e=>setPSkill(e.target.value)}>
                <option value="all">All Levels</option>
                {SKILLS.map(s=><option key={s}>{s}</option>)}
                <option value="playing">Playing Now</option>
              </select>
            </div>

            {!cu&&(
              <div className="card" style={{marginBottom:12,borderColor:"rgba(200,240,0,.2)"}}>
                <div style={{color:G,fontWeight:700,marginBottom:4}}>Sign in to message players</div>
                <button className="pbtn" style={{fontSize:13,padding:"8px 18px"}} onClick={()=>setView("signup")}>Create Profile</button>
              </div>
            )}

            {/* Message modal */}
            {msgTarget&&cu&&(
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.8)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
                <div style={{background:CARD,border:`1px solid ${BRD}`,borderRadius:"20px 20px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:460}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
                    <Avatar name={msgTarget.name} color={msgTarget.color} size={44} avatar={msgTarget.avatar||null}/>
                    <div>
                      <div style={{fontWeight:700,fontSize:17}}>{msgTarget.name}</div>
                      <Badge skill={msgTarget.skill} dupr={msgTarget.dupr}/>
                    </div>
                  </div>

                  {/* Message history */}
                  <div style={{maxHeight:160,overflowY:"auto",marginBottom:14,display:"flex",flexDirection:"column",gap:6}}>
                    {messages.filter(m=>(m.from===cu.id&&m.to===msgTarget.id)||(m.from===msgTarget.id&&m.to===cu.id)).length===0
                      ? <div style={{color:DIM,fontSize:13,textAlign:"center",padding:"16px 0"}}>No messages yet. Say hi! 👋</div>
                      : messages.filter(m=>(m.from===cu.id&&m.to===msgTarget.id)||(m.from===msgTarget.id&&m.to===cu.id)).map(m=>(
                        <div key={m.id} style={{display:"flex",justifyContent:m.from===cu.id?"flex-end":"flex-start"}}>
                          <div style={{maxWidth:"75%",background:m.from===cu.id?"rgba(200,240,0,.15)":"#080C14",border:`1px solid ${m.from===cu.id?"rgba(200,240,0,.3)":BRD}`,borderRadius:12,padding:"8px 12px",fontSize:13,color:m.from===cu.id?G:"#ccc"}}>
                            {m.text}
                          </div>
                        </div>
                      ))
                    }
                  </div>

                  <div style={{display:"flex",gap:8}}>
                    <input className="inp" style={{flex:1,padding:"10px 12px"}} placeholder="Type a message..." value={msgText} onChange={e=>setMsgText(e.target.value)}
                      onKeyDown={e=>{if(e.key==="Enter"&&msgText.trim()){setMessages(p=>[...p,{id:Date.now(),from:cu.id,to:msgTarget.id,text:msgText.trim(),ts:Date.now()}]);setMsgText("");}}}/>
                    <button className="pbtn" style={{padding:"10px 16px",fontSize:14}} disabled={!msgText.trim()}
                      onClick={()=>{setMessages(p=>[...p,{id:Date.now(),from:cu.id,to:msgTarget.id,text:msgText.trim(),ts:Date.now()}]);setMsgText("");}}>
                      Send
                    </button>
                  </div>

                  <div style={{fontSize:11,color:DIM,textAlign:"center",marginTop:8}}>Messages are private between you and {msgTarget.name}</div>

                  <button className="gbtn" style={{width:"100%",marginTop:10}} onClick={()=>{setMsgTarget(null);setMsgText("");}}>Close</button>
                </div>
              </div>
            )}

            {/* Player list */}
            {filteredPlayers().map(p=>{
              const cin=cins.find(c=>c.pid===p.id);
              const court=cin?COURTS.find(c=>c.id===cin.cid):null;
              const isMe=cu?.id===p.id;
              const unread=messages.filter(m=>m.from===p.id&&m.to===cu?.id).length;
              return(
                <div key={p.id} className="card tap" style={{marginBottom:8}} onClick={()=>{setVpp(p);setView("pprofile");}}>
                  <div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{position:"relative"}}>
                      <Avatar name={p.name} color={p.color} size={44} avatar={p.avatar||null}/>
                      {cin&&<div style={{position:"absolute",bottom:0,right:0,width:12,height:12,borderRadius:"50%",background:G,border:"2px solid #0D1525"}}/>}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                        <span style={{fontWeight:600,fontSize:14}}>{p.name}</span>
                        {isMe&&<span style={{fontSize:9,background:G,color:"#111",borderRadius:3,padding:"1px 4px"}}>YOU</span>}
                        {cin&&<span style={{fontSize:9,color:G}}>● PLAYING</span>}
                      </div>
                      <div style={{display:"flex",gap:5,marginTop:3,flexWrap:"wrap",alignItems:"center"}}>
                        <Badge skill={p.skill} dupr={p.dupr}/>
                        {p.gender&&<span style={{fontSize:11,color:DIM}}>{p.gender}</span>}
                        {p.age&&<span style={{fontSize:11,color:DIM}}>· {p.age}y</span>}
                        {court&&<span style={{fontSize:11,color:DIM}}>@ {court.short}</span>}
                      </div>
                      {p.age&&<div style={{fontSize:11,color:DIM,marginTop:2}}>🎂 {p.age} years old</div>}
                    </div>
                    {!isMe&&cu&&(
                      <div style={{display:"flex",gap:5,flexShrink:0}}>
                        <button style={{background:"rgba(200,240,0,.1)",border:`1px solid rgba(200,240,0,.3)`,color:G,borderRadius:8,padding:"6px 10px",fontSize:12,fontWeight:700,cursor:"pointer",position:"relative"}}
                          onClick={e=>{e.stopPropagation();setMsgTarget(p);}}>
                          💬{unread>0&&<span style={{position:"absolute",top:-4,right:-4,background:"#ff5c1a",color:"#fff",borderRadius:"50%",width:14,height:14,fontSize:9,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700}}>{unread}</span>}
                        </button>
                        <button className={`fbtn ${fol.includes(p.id)?"on":"off"}`} onClick={e=>{e.stopPropagation();toggleFol(p.id);}}>{fol.includes(p.id)?"✓":"+"}</button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ════ PLAYER PROFILE ════ */}
        {view==="pprofile"&&vpp&&(
          <div>
            <button className="gbtn" style={{marginBottom:14}} onClick={()=>setView("community")}>← Community</button>
            <div className="card" style={{textAlign:"center",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Avatar name={vpp.name} color={vpp.color} size={88} avatar={vpp.avatar||null} avatar={vpp.avatar||null}/></div>
              <div style={{fontSize:22,fontWeight:800}}>{vpp.name}</div>
              <div style={{marginTop:7}}><Badge skill={vpp.skill} dupr={vpp.dupr}/></div>
              {vpp.age&&<div style={{color:DIM,fontSize:13,marginTop:6}}>🎂 {vpp.age} years old</div>}
              {vpp.email&&<div style={{color:DIM,fontSize:13,marginTop:3}}>✉️ {vpp.email}</div>}
              {vpp.gender&&<div style={{color:DIM,fontSize:13,marginTop:3}}>{vpp.gender}{vpp.age?` · ${vpp.age} years old`:""}</div>}
              {(()=>{const c=cins.find(ci=>ci.pid===vpp.id);const ct=c?COURTS.find(co=>co.id===c.cid):null;return ct?<div style={{marginTop:9,fontSize:13,color:G}}><span className="dot"/>Playing at {ct.name} · {tLeft(c.exp)} left</div>:<div style={{marginTop:9,fontSize:13,color:DIM}}>Not currently checked in</div>;})()}
            </div>
            {ratings.filter(r=>r.pid===vpp.id).length>0&&(
              <div className="card" style={{marginBottom:10}}>
                <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>⭐ Game Ratings</div>
                {ratings.filter(r=>r.pid===vpp.id).slice(0,3).map((r,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6,background:"#080C14",borderRadius:8,padding:"8px 10px"}}>
                    <div><div style={{fontSize:14}}>{r.stars}</div><div style={{fontSize:11,color:DIM}}>{r.label}</div></div>
                    <div style={{fontSize:11,color:DIM}}>by {r.by}</div>
                  </div>
                ))}
              </div>
            )}
            {cu?.id!==vpp.id&&cu&&(
              <div className="card" style={{marginBottom:10}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button style={{background:"rgba(200,240,0,.1)",border:"1px solid rgba(200,240,0,.3)",color:G,borderRadius:8,padding:"10px 18px",fontSize:14,fontWeight:700,cursor:"pointer"}} onClick={()=>{setMsgTarget(vpp);setView("community");}}>💬 Message</button>
                  <button className={`fbtn ${fol.includes(vpp.id)?"on":"off"}`} style={{fontSize:14,padding:"10px 18px"}} onClick={()=>toggleFol(vpp.id)}>{fol.includes(vpp.id)?"✓ Following":`+ Follow`}</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ NEAR ME ════ */}
        {view==="nearme"&&(
          <div>
            <div style={{fontWeight:800,fontSize:20,marginBottom:4}}>NEAR ME</div>
            <div style={{color:DIM,fontSize:13,marginBottom:12}}>Get notified automatically when you arrive at a court.</div>
            <div className="card" style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div>
                  <div style={{fontWeight:700,fontSize:16,marginBottom:3}}>
                    {geoSt==="watching"?<><span className="dot"/>TRACKING YOUR LOCATION</>:"COURT ARRIVAL ALERTS"}
                  </div>
                  <div style={{fontSize:13,color:DIM}}>
                    {geoSt==="idle"&&`Alert when within ${GEO_R}m of a court`}
                    {geoSt==="watching"&&`Watching GPS · ${userCity}`}
                    {geoSt==="denied"&&"⚠️ Location permission denied"}
                    {geoSt==="unsupported"&&"GPS not supported on this device"}
                    {geoSt==="error"&&"GPS error — try again"}
                  </div>
                </div>
                {geoSt==="watching"
                  ?<button className="gbtn" onClick={stopGeo}>Stop</button>
                  :<button className="pbtn" style={{padding:"9px 20px",fontSize:14}} onClick={startGeo} disabled={geoSt==="unsupported"}>Start</button>
                }
              </div>
            </div>
            {geoSt==="denied"&&(
              <div style={{fontSize:13,color:"#ff9a6b",background:"rgba(255,90,50,.08)",border:"1px solid rgba(255,90,50,.2)",borderRadius:12,padding:13,marginBottom:12}}>
                Allow location access in your browser settings, then tap Start.
              </div>
            )}
            {COURTS.map(court=>(
              <div key={court.id} className={`card${nearC?.id===court.id?" hot":""}`} style={{marginBottom:9,borderColor:nearC?.id===court.id?G:BRD}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontWeight:700,fontSize:14}}>{court.name}</div>
                    <div style={{fontSize:12,color:DIM,marginTop:2}}>
                      {upos?`${dLbl(court)} away · `:"— "}{cins.filter(c=>c.cid===court.id).length} players now
                    </div>
                  </div>
                  <div style={{fontSize:20}}>{nearC?.id===court.id?"🟢":geoSt==="watching"?"⚪":"📍"}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ════ SHOP ════ */}
        {view==="market"&&(
          <div>
            {/* Checkout Modal */}
            {buyItem&&(
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}} onClick={()=>{if(!buyDone)setBuyItem(null);}}>
                <div style={{background:CARD,border:`1px solid ${BRD}`,borderRadius:"20px 20px 0 0",padding:"24px 20px 36px",width:"100%",maxWidth:460,animation:"slideup .25s ease"}} onClick={e=>e.stopPropagation()}>
                  {!buyDone?(
                    <>
                      <div style={{fontWeight:800,fontSize:18,marginBottom:16}}>Complete Purchase</div>
                      <div style={{display:"flex",gap:12,marginBottom:20,alignItems:"center"}}>
                        <div style={{width:56,height:56,borderRadius:10,overflow:"hidden",background:"#080C14",flexShrink:0}}>
                          <img src={buyItem.img} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}} onError={e=>{e.target.style.display="none";}}/>
                        </div>
                        <div>
                          <div style={{fontWeight:600,fontSize:14}}>{buyItem.title}</div>
                          <div style={{color:DIM,fontSize:12}}>Sold by {buyItem.seller}</div>
                        </div>
                      </div>

                      {/* Price breakdown */}
                      <div style={{background:"#080C14",borderRadius:12,padding:"14px",marginBottom:18}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14}}>
                          <span style={{color:DIM}}>Item price</span>
                          <span>${buyItem.price.toFixed(2)}</span>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:14}}>
                          <span style={{color:DIM}}>CourtCall fee (5%)</span>
                          <span style={{color:"#f87171"}}>+${(buyItem.price*0.05).toFixed(2)}</span>
                        </div>
                        <div style={{borderTop:`1px solid ${BRD}`,paddingTop:10,display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:16}}>
                          <span>Total</span>
                          <span style={{color:G}}>${(buyItem.price*1.05).toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Simulated card input */}
                      <div className="lbl">Card Number</div>
                      <input className="inp" placeholder="4242 4242 4242 4242" value={cardNum} onChange={e=>setCardNum(e.target.value)} style={{marginBottom:10}} maxLength={19}/>
                      <div style={{display:"flex",gap:10,marginBottom:18}}>
                        <div style={{flex:1}}>
                          <div className="lbl">Expiry</div>
                          <input className="inp" placeholder="MM/YY" value={cardExp} onChange={e=>setCardExp(e.target.value)} maxLength={5}/>
                        </div>
                        <div style={{flex:1}}>
                          <div className="lbl">CVV</div>
                          <input className="inp" placeholder="123" value={cardCvv} onChange={e=>setCardCvv(e.target.value)} maxLength={3}/>
                        </div>
                      </div>

                      <div style={{fontSize:11,color:DIM,marginBottom:14,textAlign:"center"}}>
                        🔒 Payments processed securely via Stripe · CourtCall keeps 5%
                      </div>
                      <button className="pbtn" style={{width:"100%",fontSize:16}}
                        disabled={cardNum.length<10||cardExp.length<4||cardCvv.length<3}
                        onClick={()=>{setBuyDone(true);}}>
                        PAY ${(buyItem.price*1.05).toFixed(2)}
                      </button>
                      <button className="gbtn" style={{width:"100%",marginTop:10}} onClick={()=>setBuyItem(null)}>Cancel</button>
                    </>
                  ):(
                    <div style={{textAlign:"center",padding:"20px 0"}}>
                      <div style={{fontSize:52,marginBottom:12}}>✅</div>
                      <div style={{fontWeight:800,fontSize:22,color:G,marginBottom:6}}>Purchase Complete!</div>
                      <div style={{color:DIM,fontSize:13,marginBottom:6}}>The seller will be notified.</div>
                      <div style={{background:"#080C14",borderRadius:12,padding:"14px",marginBottom:20,textAlign:"left"}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}>
                          <span style={{color:DIM}}>You paid</span>
                          <span style={{fontWeight:700}}>${(buyItem.price*1.05).toFixed(2)}</span>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}>
                          <span style={{color:DIM}}>Seller receives</span>
                          <span style={{fontWeight:700}}>${(buyItem.price*0.95).toFixed(2)}</span>
                        </div>
                        <div style={{display:"flex",justifyContent:"space-between",fontSize:13}}>
                          <span style={{color:DIM}}>CourtCall earns</span>
                          <span style={{color:G,fontWeight:700}}>${(buyItem.price*0.05).toFixed(2)}</span>
                        </div>
                      </div>
                      <div style={{background:"rgba(200,240,0,.08)",border:`1px solid ${G}`,borderRadius:12,padding:"14px",marginBottom:18,textAlign:"left"}}>
                        <div style={{fontSize:11,color:G,fontWeight:700,letterSpacing:1,marginBottom:8}}>🔓 SELLER CONTACT UNLOCKED</div>
                        <div style={{fontWeight:700,fontSize:15,marginBottom:2}}>{buyItem.seller}</div>
                        {buyItem.phone&&(
                          <a href={`tel:${buyItem.phone}`} style={{display:"flex",alignItems:"center",gap:8,marginTop:8,background:G,color:"#111",borderRadius:8,padding:"10px 14px",fontWeight:800,fontSize:15,textDecoration:"none"}}>
                            📱 <span>{buyItem.phone}</span>
                          </a>
                        )}
                        <div style={{fontSize:11,color:DIM,marginTop:8}}>Arrange pickup directly with the seller.</div>
                      </div>
                      <button className="pbtn" style={{width:"100%"}} onClick={()=>{setBuyItem(null);setBuyDone(false);setCardNum("");setCardExp("");setCardCvv("");}}>Done</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* $1 Listing Paywall Modal */}
            {showPaywall&&(
              <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.82)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
                <div style={{background:CARD,border:`1px solid ${BRD}`,borderRadius:"20px 20px 0 0",padding:"28px 20px 40px",width:"100%",maxWidth:460}}>
                  <div style={{textAlign:"center",marginBottom:20}}>
                    <div style={{fontSize:40,marginBottom:10}}>🏓</div>
                    <div style={{fontWeight:800,fontSize:22,marginBottom:6}}>List Your Item</div>
                    <div style={{color:DIM,fontSize:13,marginBottom:8}}>One-time listing fee to publish your item on CourtCall</div>
                    <div style={{fontSize:48,fontWeight:800,color:G,marginBottom:4}}>$1.00</div>
                    <div style={{fontSize:11,color:DIM}}>Your listing goes live immediately after payment</div>
                  </div>
                  <div style={{background:"#080C14",borderRadius:12,padding:"14px",marginBottom:20}}>
                    <div style={{fontWeight:700,fontSize:13,color:G,marginBottom:10}}>"{pendingListing?.title}"</div>
                    {["Visible to all CourtCall players","Buyer contacts you directly after purchase","You keep 100% of your sale price","Listed until sold"].map((t,i)=>(
                      <div key={i} style={{display:"flex",gap:8,alignItems:"center",marginBottom:7,fontSize:13}}>
                        <span style={{color:G,fontWeight:700}}>✓</span>
                        <span style={{color:"#ccc"}}>{t}</span>
                      </div>
                    ))}
                  </div>
                  <a href={STRIPE_LINK} target="_blank" rel="noreferrer"
                    style={{display:"block",background:G,color:"#111",borderRadius:50,padding:"14px 0",textAlign:"center",fontWeight:800,fontSize:17,textDecoration:"none",marginBottom:10}}
                    onClick={()=>setTimeout(confirmPayment,3000)}>
                    Pay $1 &amp; Publish Listing →
                  </a>
                  <div style={{fontSize:11,color:DIM,textAlign:"center",marginBottom:14}}>
                    🔒 Secure payment via Stripe · Takes 30 seconds
                  </div>
                  <button className="gbtn" style={{width:"100%"}} onClick={cancelPayment}>Cancel — don't list</button>
                </div>
              </div>
            )}

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div><div style={{fontWeight:800,fontSize:20}}>COURTCALL SHOP</div><div style={{color:DIM,fontSize:12}}>Buy &amp; sell gear · $1 to list</div></div>
              <button className="pbtn" style={{fontSize:13,padding:"8px 16px"}} onClick={()=>{if(!cu){setView("signup");return;}setSellOpen(v=>!v);}}>{sellOpen?"Cancel":"+ Sell"}</button>
            </div>
            {sellOpen&&(
              <div className="card" style={{marginBottom:12,borderColor:"rgba(200,240,0,.2)"}}>
                <div style={{fontWeight:700,marginBottom:6}}>LIST AN ITEM</div>
                <div style={{fontSize:12,color:DIM,marginBottom:10}}>A $1 listing fee is charged when you publish. You keep 100% of your sale price.</div>
                <div className="lbl">Category</div>
                <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:9}}>{["Paddle","Balls","Shoes","Bag","Apparel","Other"].map(cat=><button key={cat} className={`chip ${nl.category===cat?"on":""}`} onClick={()=>setNl(d=>({...d,category:cat}))}>{cat}</button>)}</div>
                <div className="lbl">Title</div><input className="inp" placeholder="Item name" value={nl.title} onChange={e=>setNl(d=>({...d,title:e.target.value}))} style={{marginBottom:8}}/>
                <div className="lbl">Price ($)</div><input className="inp" type="number" placeholder="0.00" value={nl.price} onChange={e=>setNl(d=>({...d,price:e.target.value}))} style={{marginBottom:8}}/>
                {nl.price&&<div style={{fontSize:12,color:DIM,marginBottom:8}}>You keep the full ${parseFloat(nl.price||0).toFixed(2)} — CourtCall only charges the $1 listing fee.</div>}
                <div className="lbl">Phone</div><input className="inp" placeholder={cu?.phone||"239-555-0000"} value={nl.phone} onChange={e=>setNl(d=>({...d,phone:e.target.value}))} style={{marginBottom:8}}/>
                <div className="lbl">Item Photo (optional)</div>
                <label style={{display:"block",marginBottom:12}}>
                  <div style={{background:"#080C14",border:`1.5px dashed ${nl.img?"rgba(200,240,0,.5)":"#1E3050"}`,borderRadius:10,padding:"14px",textAlign:"center",cursor:"pointer",transition:"border-color .2s"}}>
                    {nl.img?(
                      <div>
                        <img src={nl.img} alt="preview" style={{width:"100%",maxHeight:140,objectFit:"cover",borderRadius:8,marginBottom:8}}/>
                        <div style={{fontSize:12,color:"#C8F000",fontWeight:600}}>✓ Photo selected — tap to change</div>
                      </div>
                    ):(
                      <div>
                        <div style={{fontSize:28,marginBottom:6}}>📷</div>
                        <div style={{fontSize:13,fontWeight:600,color:"#ccc",marginBottom:3}}>Tap to add a photo</div>
                        <div style={{fontSize:11,color:"#4A6890"}}>Choose from Camera Roll or take a photo</div>
                      </div>
                    )}
                  </div>
                  <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{
                    const f=e.target.files[0];if(!f)return;
                    const img=new Image();const reader=new FileReader();
                    reader.onload=ev=>{
                      img.onload=()=>{
                        const canvas=document.createElement("canvas");
                        const MAX=600;let w=img.width,h=img.height;
                        if(w>MAX){h=Math.round(h*MAX/w);w=MAX;}
                        canvas.width=w;canvas.height=h;
                        canvas.getContext("2d").drawImage(img,0,0,w,h);
                        setNl(d=>({...d,img:canvas.toDataURL("image/jpeg",0.82)}));
                      };
                      img.src=ev.target.result;
                    };
                    reader.readAsDataURL(f);
                  }}/>
                </label>
                <button className="pbtn" style={{width:"100%"}} disabled={!nl.title.trim()||!nl.price} onClick={postListing}>POST LISTING</button>
              </div>
            )}
            <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>{["All","Paddle","Balls","Shoes","Bag","Apparel","Other"].map(cat=><button key={cat} className={`chip ${mCat===cat?"on":""}`} onClick={()=>setMCat(cat)}>{cat}</button>)}</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
              {listings.filter(l=>(mCat==="All"||l.category===mCat)&&l.status!=="pending").map(l=>(
                <div key={l.id} className="mcard">
                  <div style={{height:120,overflow:"hidden",background:"#080C14",display:"flex",alignItems:"center",justifyContent:"center"}}>{l.img?<img src={l.img} alt={l.title} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<div style={{fontSize:36,opacity:.3}}>📷</div>}</div>
                  <div style={{padding:"10px"}}>
                    <div style={{fontWeight:600,fontSize:13,marginBottom:2,lineHeight:1.3}}>{l.title}</div>
                    <div style={{fontSize:19,fontWeight:800,color:G,marginBottom:2}}>${l.price}</div>
                    <div style={{fontSize:10,color:DIM,marginBottom:6}}>+${(l.price*0.05).toFixed(2)} fee · total ${(l.price*1.05).toFixed(2)}</div>
                    {l.seller&&<div style={{color:DIM,fontSize:11,marginBottom:8}}>by {l.seller}</div>}
                    <button style={{display:"block",width:"100%",background:G,color:"#111",border:"none",borderRadius:7,padding:"7px 0",fontWeight:800,fontSize:13,cursor:"pointer",marginBottom:6}}
                      onClick={()=>{if(!cu){setView("signup");return;}setBuyItem(l);setBuyDone(false);setCardNum("");setCardExp("");setCardCvv("");}}>
                      Buy Now
                    </button>
                    <div style={{fontSize:10,color:DIM,textAlign:"center"}}>🔒 Seller contact revealed after payment</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════ CONTACT ════ */}
        {view==="contact"&&(
          <div>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:14}}><NetworkBall size={52}/></div>
              <div style={{fontWeight:800,fontSize:22,marginBottom:6}}>Contact Us</div>
              <div style={{color:DIM,fontSize:13,lineHeight:1.6}}>Questions, feedback, or partnership ideas?<br/>We'd love to hear from you.</div>
            </div>

            {contactSent?(
              <div style={{textAlign:"center",padding:"32px 0"}}>
                <div style={{fontSize:52,marginBottom:12}}>✅</div>
                <div style={{fontWeight:800,fontSize:22,color:G,marginBottom:8}}>Message Sent!</div>
                <div style={{color:DIM,fontSize:13,marginBottom:24}}>We'll get back to you as soon as possible.</div>
                <button className="pbtn" onClick={()=>{setContactSent(false);setContactForm({name:"",email:"",subject:"",message:""});}}>Send Another</button>
              </div>
            ):(
              <div>
                <div className="card" style={{marginBottom:12}}>
                  <div className="lbl">Your Name</div>
                  <input className="inp" placeholder="Full name" value={contactForm.name} onChange={e=>setContactForm(d=>({...d,name:e.target.value}))} style={{marginBottom:10}}/>
                  <div className="lbl">Your Email</div>
                  <input className="inp" placeholder="your@email.com" type="email" value={contactForm.email} onChange={e=>setContactForm(d=>({...d,email:e.target.value}))} style={{marginBottom:10}}/>
                  <div className="lbl">Subject</div>
                  <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:10}}>
                    {["General Question","Bug Report","Partnership","Feature Request","Other"].map(s=>(
                      <button key={s} className={`chip ${contactForm.subject===s?"on":""}`} onClick={()=>setContactForm(d=>({...d,subject:s}))}>{s}</button>
                    ))}
                  </div>
                  <div className="lbl">Message</div>
                  <textarea className="inp" placeholder="Tell us what's on your mind..." value={contactForm.message} onChange={e=>setContactForm(d=>({...d,message:e.target.value}))} style={{marginBottom:12,minHeight:110}}/>
                  <button className="pbtn" style={{width:"100%",fontSize:16}}
                    disabled={!contactForm.name.trim()||!contactForm.email.trim()||!contactForm.message.trim()||contactSending}
                    onClick={sendContactEmail}>
                    {contactSending?"Sending...":"Send Message →"}
                  </button>
                </div>

                {/* Contact info cards */}
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginTop:4}}>
                  {[
                    {icon:"🏓",label:"About CourtCall",text:`The real-time pickleball network for ${userCity} players`},
                    {icon:"⚡",label:"Response Time",text:"We typically reply within 24 hours"},
                    {icon:"🌴",label:"Your Location",text:userCity},
                    {icon:"🔒",label:"Privacy",text:"Your email is never shared or sold"},
                  ].map(c=>(
                    <div key={c.label} style={{background:"#080C14",border:`1px solid ${BRD}`,borderRadius:12,padding:"12px"}}>
                      <div style={{fontSize:20,marginBottom:5}}>{c.icon}</div>
                      <div style={{fontWeight:700,fontSize:12,color:G,marginBottom:3}}>{c.label}</div>
                      <div style={{fontSize:11,color:DIM,lineHeight:1.4}}>{c.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ SIGN UP ════ */}
        {view==="signup"&&!cu&&(
          <div>
            <div style={{textAlign:"center",marginBottom:8}}>
              <div style={{fontWeight:800,fontSize:24}}>JOIN COURTCALL</div>
              <div style={{color:DIM,fontSize:13}}>{userCity} pickleball community</div>
            </div>
            <div className="sdots">{[1,2,3,4,5].map(s=><div key={s} className={`sdot${step>=s?" on":""}`}/>)}</div>
            {step===1&&(
              <div>
                <div className="lbl">Your Name</div>
                <input className="inp" placeholder="Full name" value={form.name} onChange={e=>setForm(d=>({...d,name:e.target.value}))} autoFocus style={{marginBottom:10}}/>
                <div className="lbl">Email Address</div>
                <input className="inp" placeholder="your@email.com" type="email" value={form.email} onChange={e=>setForm(d=>({...d,email:e.target.value}))} style={{marginBottom:10}}/>
                <div className="lbl">Phone (optional — for SMS alerts)</div>
                <input className="inp" placeholder="239-555-0100" value={form.phone} onChange={e=>setForm(d=>({...d,phone:e.target.value}))} style={{marginBottom:6}}/>
                <div style={{fontSize:11,color:DIM,marginBottom:12}}>Used only for game notifications. Never shared or sold.</div>
                <div style={{display:"flex",gap:8,marginBottom:18}}>
                  <div style={{flex:1}}>
                    <div className="lbl">Gender (optional)</div>
                    <select className="inp" value={form.gender} onChange={e=>setForm(d=>({...d,gender:e.target.value}))}>
                      <option value="">Prefer not to say</option>
                      <option>Male</option><option>Female</option><option>Other</option>
                    </select>
                  </div>
                  <div style={{flex:1}}>
                    <div className="lbl">Age</div>
                    <input className="inp" type="number" placeholder="e.g. 42" value={form.age} onChange={e=>setForm(d=>({...d,age:e.target.value}))}/>
                  </div>
                </div>
                <button className="pbtn" style={{width:"100%"}} disabled={!form.name.trim()||!form.email.trim()||!form.age} onClick={()=>setStep(2)}>NEXT →</button>
              </div>
            )}
            {step===2&&(
              <div>
                <div className="lbl">YOUR DUPR RATING</div>
                <div style={{fontSize:12,color:DIM,marginBottom:10}}>Select your current DUPR rating. Not sure? Pick your closest level — you can update it later.</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:6}}>
                  {SKILLS.map(s=>(
                    <button key={s} onClick={()=>setForm(d=>({...d,skill:s,dupr:s}))}
                      style={{padding:"14px 0",border:`2px solid ${form.skill===s?SKILL_COLOR[s]:"#1E3050"}`,borderRadius:10,background:form.skill===s?SKILL_COLOR[s]+"22":"transparent",color:form.skill===s?SKILL_COLOR[s]:DIM,fontWeight:800,fontSize:16,cursor:"pointer",transition:"all .15s"}}>
                      {s}
                    </button>
                  ))}
                </div>
                <div style={{fontSize:11,color:DIM,marginBottom:18,textAlign:"center"}}>
                  2.5–3.0 = New player · 3.5 = Club player · 4.0–4.5 = Tournament ready · 5.0 = Pro
                </div>
                <div style={{display:"flex",gap:8}}><button className="gbtn" onClick={()=>setStep(1)}>← Back</button><button className="pbtn" style={{flex:1}} onClick={()=>setStep(3)}>NEXT →</button></div>
              </div>
            )}
            {step===3&&(
              <div>
                <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>📸 Profile Photo</div>
                <div style={{color:DIM,fontSize:13,marginBottom:18}}>Add a headshot so other players can recognize you on the court.</div>

                {/* Upload area */}
                <div style={{textAlign:"center",marginBottom:18}}>
                  <label style={{display:"inline-block",cursor:"pointer"}}>
                    <div style={{width:110,height:110,borderRadius:"50%",margin:"0 auto 12px",border:`3px dashed ${avPrev?"rgba(200,240,0,.6)":"#1E3050"}`,overflow:"hidden",background:"#080C14",display:"flex",alignItems:"center",justifyContent:"center",transition:"border-color .2s",position:"relative"}}>
                      {avPrev
                        ? <img src={avPrev} style={{width:"100%",height:"100%",objectFit:"cover"}} alt="preview"/>
                        : <div style={{textAlign:"center"}}>
                            <div style={{fontSize:32,marginBottom:4}}>📷</div>
                            <div style={{fontSize:11,color:DIM}}>Tap to upload</div>
                          </div>
                      }
                    </div>
                    <input type="file" accept="image/*" onChange={handleAv} style={{display:"none"}}/>
                    <div style={{fontSize:13,color:avPrev?G:DIM,fontWeight:600}}>{avPrev?"Photo selected ✓ — tap to change":"Upload from Photos or Camera"}</div>
                  </label>
                </div>

                {avPrev&&(
                  <div style={{display:"flex",alignItems:"center",gap:12,background:"#080C14",border:`1px solid rgba(200,240,0,.2)`,borderRadius:12,padding:"12px 14px",marginBottom:16}}>
                    <img src={avPrev} style={{width:52,height:52,borderRadius:"50%",objectFit:"cover",border:`2px solid ${G}`}} alt=""/>
                    <div>
                      <div style={{fontWeight:700,fontSize:14}}>{form.name}</div>
                      <div style={{fontSize:12,color:DIM}}>{form.age} yrs · {form.dupr} DUPR{form.gender?` · ${form.gender}`:""}</div>
                    </div>
                  </div>
                )}

                <div style={{display:"flex",gap:8}}>
                  <button className="gbtn" onClick={()=>setStep(2)}>← Back</button>
                  <button className="pbtn" style={{flex:1}} onClick={()=>setStep(4)}>
                    {avPrev?"NEXT →":"Skip for now →"}
                  </button>
                </div>
              </div>
            )}

            {step===4&&(
              <div>
                <div style={{fontWeight:700,fontSize:16,marginBottom:4}}>🔔 Game Notifications</div>
                <div style={{color:DIM,fontSize:13,marginBottom:14}}>How should we notify you when players at your DUPR rating are looking for a game?</div>

                {/* Notification method */}
                <div className="lbl" style={{marginBottom:8}}>Notify me via</div>
                <div style={{display:"flex",gap:8,marginBottom:14}}>
                  <div style={{flex:1,background:form.notifyEmail?"rgba(200,240,0,.08)":"#080C14",border:`2px solid ${form.notifyEmail?G:"#1E3050"}`,borderRadius:12,padding:"14px 12px",cursor:"pointer",transition:"all .15s"}}
                    onClick={()=>setForm(d=>({...d,notifyEmail:!d.notifyEmail}))}>
                    <div style={{fontSize:22,marginBottom:4}}>📧</div>
                    <div style={{fontWeight:700,fontSize:13,color:form.notifyEmail?G:"#ccc"}}>Email</div>
                    <div style={{fontSize:11,color:DIM,marginTop:2}}>{form.email||"your email"}</div>
                    <div style={{marginTop:8,width:20,height:20,borderRadius:50,border:`2px solid ${form.notifyEmail?G:"#1E3050"}`,background:form.notifyEmail?G:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#111",fontWeight:800}}>
                      {form.notifyEmail&&"✓"}
                    </div>
                  </div>
                  <div style={{flex:1,background:form.notifyText?"rgba(200,240,0,.08)":"#080C14",border:`2px solid ${form.notifyText?G:"#1E3050"}`,borderRadius:12,padding:"14px 12px",cursor:"pointer",transition:"all .15s"}}
                    onClick={()=>setForm(d=>({...d,notifyText:!d.notifyText}))}>
                    <div style={{fontSize:22,marginBottom:4}}>💬</div>
                    <div style={{fontWeight:700,fontSize:13,color:form.notifyText?G:"#ccc"}}>Text / SMS</div>
                    <div style={{fontSize:11,color:DIM,marginTop:2}}>{form.phone||"add phone"}</div>
                    <div style={{marginTop:8,width:20,height:20,borderRadius:50,border:`2px solid ${form.notifyText?G:"#1E3050"}`,background:form.notifyText?G:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:"#111",fontWeight:800}}>
                      {form.notifyText&&"✓"}
                    </div>
                  </div>
                </div>

                {/* Skill levels to notify for */}
                <div className="lbl" style={{marginBottom:8}}>Notify me about games for</div>
                <div style={{display:"flex",gap:8,marginBottom:6}}>
                  {SKILLS.map(s=>{
                    const on=form.notifySkills.includes(s);
                    return(
                      <button key={s} style={{padding:"9px 0",border:`2px solid ${on?SKILL_COLOR[s]:"#1E3050"}`,borderRadius:10,background:on?SKILL_COLOR[s]+"22":"transparent",color:on?SKILL_COLOR[s]:DIM,fontWeight:800,fontSize:14,cursor:"pointer",transition:"all .15s",minWidth:50}}
                        onClick={()=>setForm(d=>({...d,notifySkills:on?d.notifySkills.filter(x=>x!==s):[...d.notifySkills,s]}))}>
                        {s}
                      </button>
                    );
                  })}
                </div>
                <div style={{fontSize:11,color:DIM,marginBottom:20}}>Select all skill levels you're happy playing with.</div>

                {!form.notifyEmail&&!form.notifyText&&(
                  <div style={{fontSize:12,color:"#FBBF24",background:"rgba(251,191,36,.08)",border:"1px solid rgba(251,191,36,.2)",borderRadius:8,padding:"9px 12px",marginBottom:14}}>
                    ⚠️ No notifications selected — you won't be alerted about new games. You can change this later in Profile.
                  </div>
                )}

                <div style={{display:"flex",gap:8}}>
                  <button className="gbtn" onClick={()=>setStep(3)}>← Back</button>
                  <button className="pbtn" style={{flex:1}} onClick={()=>setStep(5)}>NEXT →</button>
                </div>
              </div>
            )}

            {step===5&&(
              <div style={{textAlign:"center"}}>
                <div style={{display:"flex",justifyContent:"center",marginBottom:12}}>
                  {avPrev?<img src={avPrev} style={{width:80,height:80,borderRadius:"50%",objectFit:"cover",border:`3px solid ${G}`}} alt=""/>:<NetworkBall size={72}/>}
                </div>
                <div style={{fontWeight:700,fontSize:20,marginBottom:10}}>All set, {form.name}!</div>
                <div className="card" style={{marginBottom:16,textAlign:"left"}}>
                  {form.age&&(
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,paddingBottom:8,borderBottom:"1px solid #1E3050"}}>
                      <span style={{color:DIM,fontSize:13}}>Age</span>
                      <span style={{fontSize:13}}>{form.age} years old</span>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8,paddingBottom:8,borderBottom:"1px solid #1E3050"}}>
                    <span style={{color:DIM,fontSize:13}}>DUPR Rating</span>
<Badge skill={form.dupr||form.skill} dupr={form.dupr||form.skill}/>
                  </div>
                  {form.email&&(
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,paddingBottom:8,borderBottom:"1px solid #1E3050"}}>
                      <span style={{color:DIM,fontSize:13}}>Email</span>
                      <span style={{fontSize:13}}>{form.email}</span>
                    </div>
                  )}
                  {form.phone&&(
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,paddingBottom:8,borderBottom:"1px solid #1E3050"}}>
                      <span style={{color:DIM,fontSize:13}}>Phone</span>
                      <span style={{fontSize:13}}>{form.phone}</span>
                    </div>
                  )}
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8,paddingBottom:8,borderBottom:"1px solid #1E3050"}}>
                    <span style={{color:DIM,fontSize:13}}>Notifications</span>
                    <span style={{fontSize:13,color:G}}>
                      {[form.notifyEmail&&"Email",form.notifyText&&"SMS"].filter(Boolean).join(" + ")||"Off"}
                    </span>
                  </div>
                  <div style={{display:"flex",justifyContent:"space-between"}}>
                    <span style={{color:DIM,fontSize:13}}>Notified for</span>
                    <span style={{fontSize:13}}>{form.notifySkills.join(", ")||"None"}</span>
                  </div>
                </div>
                <div style={{display:"flex",gap:8}}>
                  <button className="gbtn" onClick={()=>setStep(4)}>← Back</button>
                  <button className="pbtn" style={{flex:1,fontSize:17}} onClick={signup}>JOIN 🏓</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════ PROFILE ════ */}
        {view==="profile"&&cu&&(
          <div>
            <div className="card" style={{textAlign:"center",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"center",marginBottom:10}}><Avatar name={cu.name} color={cu.color} size={68} avatar={cu.avatar||null}/></div>
              <div style={{fontSize:22,fontWeight:800}}>{cu.name}</div>
              <div style={{marginTop:7}}><Badge skill={cu.skill} dupr={cu.dupr}/></div>
              {cu.phone&&<div style={{color:DIM,fontSize:13,marginTop:6}}>📱 {cu.phone}</div>}
            </div>
            {myCin()&&(()=>{const c=myCin();const ct=COURTS.find(co=>co.id===c.cid);return(<div className="card" style={{marginBottom:10,borderColor:"rgba(200,240,0,.2)"}}><div style={{color:G,fontSize:12,marginBottom:4}}><span className="dot"/>Currently checked in</div><div style={{fontSize:14}}>{ct?.name} · {tLeft(c.exp)} left</div><button className="dbtn" style={{marginTop:8}} onClick={()=>checkout(c.id)}>Check Out</button></div>);})()}
            <div className="card" style={{marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{color:G,fontWeight:700,fontSize:13}}>📅 My Schedule</div>
                <button className="pbtn" style={{fontSize:12,padding:"6px 14px"}}
                  onClick={()=>{setPlaySubview("create");setView("play");}}>
                  + Add Session
                </button>
              </div>
              {schedule.filter(s=>s.pid===cu.id).length===0?(
                <div style={{textAlign:"center",padding:"16px 0"}}>
                  <div style={{color:DIM,fontSize:13,marginBottom:10}}>No sessions scheduled yet.</div>
                  <button className="gbtn" style={{fontSize:13}} onClick={()=>{setPlaySubview("create");setView("play");}}>Schedule a game →</button>
                </div>
              ):(
                [...new Set(schedule.filter(s=>s.pid===cu.id).map(s=>s.day+"|"+s.courtId))].map(key=>{
                  const [day,cid]=key.split("|");
                  const entries=schedule.filter(s=>s.pid===cu.id&&s.day===day&&s.courtId===parseInt(cid));
                  const court=COURTS.find(c=>c.id===parseInt(cid));
                  const dayObj=WEEK.find(d=>d.key===day);
                  return(
                    <div key={key} style={{background:"#080C14",border:`1px solid ${BRD}`,borderRadius:10,padding:"10px 12px",marginBottom:8}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                        <div>
                          <div style={{fontWeight:700,fontSize:13,color:G,marginBottom:3}}>{dayObj?.label||day}</div>
                          <div style={{fontSize:13,marginBottom:5}}>📍 {court?.name}</div>
                          <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                            {entries.map(e=>(
                              <span key={e.id} style={{background:"rgba(200,240,0,.12)",color:G,borderRadius:6,padding:"3px 9px",fontSize:12,display:"flex",alignItems:"center",gap:5}}>
                                {e.block}
                                <button style={{background:"transparent",border:"none",color:"#f87171",fontSize:12,cursor:"pointer",padding:0,lineHeight:1}}
                                  onClick={()=>setSched(p=>p.filter(x=>x.id!==e.id))}>✕</button>
                              </span>
                            ))}
                          </div>
                        </div>
                        <button style={{background:"transparent",border:"none",color:"#f87171",fontSize:11,cursor:"pointer",flexShrink:0,marginLeft:8}}
                          onClick={()=>setSched(p=>p.filter(s=>!(s.pid===cu.id&&s.day===day&&s.courtId===parseInt(cid))))}>
                          Remove all
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {/* Notification settings */}
            <div className="card" style={{marginBottom:10}}>
              <div style={{fontWeight:700,fontSize:13,marginBottom:10}}>🔔 Notification Settings</div>
              <div style={{display:"flex",gap:8,marginBottom:10}}>
                <div style={{flex:1,background:cu.notifyEmail?"rgba(200,240,0,.08)":"#080C14",border:`1.5px solid ${cu.notifyEmail?G:"#1E3050"}`,borderRadius:10,padding:"10px",cursor:"pointer"}}
                  onClick={()=>{const updated={...cu,notifyEmail:!cu.notifyEmail};setCu(updated);setPl(p=>p.map(x=>x.id===cu.id?updated:x));}}>
                  <div style={{fontSize:18,marginBottom:2}}>📧</div>
                  <div style={{fontSize:12,fontWeight:700,color:cu.notifyEmail?G:"#888"}}>Email</div>
                  <div style={{fontSize:10,color:DIM}}>{cu.email||"not set"}</div>
                </div>
                <div style={{flex:1,background:cu.notifyText?"rgba(200,240,0,.08)":"#080C14",border:`1.5px solid ${cu.notifyText?G:"#1E3050"}`,borderRadius:10,padding:"10px",cursor:"pointer"}}
                  onClick={()=>{const updated={...cu,notifyText:!cu.notifyText};setCu(updated);setPl(p=>p.map(x=>x.id===cu.id?updated:x));}}>
                  <div style={{fontSize:18,marginBottom:2}}>💬</div>
                  <div style={{fontSize:12,fontWeight:700,color:cu.notifyText?G:"#888"}}>SMS</div>
                  <div style={{fontSize:10,color:DIM}}>{cu.phone||"not set"}</div>
                </div>
              </div>
              <div className="lbl" style={{marginBottom:6}}>Notify me about</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {SKILLS.map(s=>{
                  const on=(cu.notifySkills||[]).includes(s);
                  return(
                    <button key={s} className={`chip ${on?"on":""}`}
                      onClick={()=>{
                        const updated={...cu,notifySkills:on?(cu.notifySkills||[]).filter(x=>x!==s):[...(cu.notifySkills||[]),s]};
                        setCu(updated);setPl(p=>p.map(x=>x.id===cu.id?updated:x));
                      }}>{s} DUPR</button>
                  );
                })}
              </div>
              {!cu.notifyEmail&&!cu.notifyText&&(
                <div style={{fontSize:11,color:"#FBBF24",marginTop:8}}>⚠️ All notifications off — turn on Email or SMS above</div>
              )}
            </div>
            <div className="card" style={{marginBottom:10}}><div style={{color:DIM,fontSize:13}}>Following {fol.length} player{fol.length!==1?"s":""}</div></div>
            <button className="gbtn" style={{width:"100%"}} onClick={()=>{setCu(null);sw("cc_cu",null);setView("courts");}}>Sign Out</button>
          </div>
        )}

      </div>
    </div>
  );
}

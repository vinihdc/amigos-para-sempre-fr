import {useMemo,useState} from "react";
import {CalendarDays,Users,ShieldCheck,Settings,LogIn,RefreshCw,Trophy,CheckCircle2,Clock3} from "lucide-react";
import {generateBalancedTeams} from "./algorithms/balance";
import type {Player,Position} from "./types";

const positions:Position[]=["Goleiro","Zagueiro","Lateral","Volante","Meio-campo","Ponta","Atacante","Flexível"];
const names=["João","Carlos","Pedro","Lucas","Rafael","André","Bruno","Marcos","Thiago","Caue","Eduardo","Felipe","Gustavo","Henrique","Vitor","Renan","Rodrigo","Samuel","Diego","Matheus","Gabriel","Leonardo","Daniel","Vinicius","Arthur","Ramon","Murilo","Alex","Fernando","Wesley","Ruan","Igor"];
const players:Player[]=names.map((name,i)=>({id:String(i+1),name,overall:Number((5.5+(i%9)*.45).toFixed(1)),type:i<28?"MENSALISTA":"AVULSO",positions:[positions[i%positions.length]],isGoalkeeper:i%7===0,active:true}));
const linePlayers=players.filter(p=>!p.isGoalkeeper);

function App(){
 const [tab,setTab]=useState("Início"); const [confirmed,setConfirmed]=useState<"VOU"|"NÃO VOU"|"TALVEZ"|null>(null);
 const [count,setCount]=useState(26); const [generated,setGenerated]=useState(false);
 const [teams,setTeams]=useState<any[]>([]);
 const active=linePlayers.slice(0,count);
 const eligible=Math.min(count,players.length);
 const teamCount=count>=24?4:count>=18?3:0;
 const avg=useMemo(()=>active.reduce((s,p)=>s+p.overall,0)/Math.max(1,active.length),[active]);
 function generate(){if(!teamCount)return; setTeams(generateBalancedTeams(active,teamCount));setGenerated(true)}
 return <div className="min-h-screen">
  <header className="sticky top-0 z-10 border-b border-white/10 bg-black/70 backdrop-blur">
   <div className="mx-auto flex max-w-6xl items-center justify-between p-4">
    <div><div className="text-lg font-black">⚽ Amigos Para Sempre FR</div><div className="text-xs text-zinc-400">Gestão do Futebol Society</div></div>
    <button className="btn btn-muted flex items-center gap-2"><LogIn size={16}/> Entrar</button>
   </div>
  </header>
  <main className="mx-auto max-w-6xl p-4 pb-24">
   <div className="mb-6 flex gap-2 overflow-auto">{["Início","Jogo","Times","Perfil","Admin"].map(x=><button onClick={()=>setTab(x)} className={`btn whitespace-nowrap ${tab===x?"btn-primary":"btn-muted"}`} key={x}>{x}</button>)}</div>
   {tab==="Início" && <div className="grid gap-4 md:grid-cols-2">
    <section className="card p-6"><div className="mb-5 flex items-center gap-3"><CalendarDays/><div><h1 className="text-2xl font-black">Futebol de Sábado</h1><p className="text-zinc-400">Próximo jogo • Sábado • 20:00</p></div></div><div className="mb-5 rounded-2xl bg-zinc-900 p-5"><div className="text-sm text-zinc-400">Local</div><div className="font-bold">Arena Society</div></div><p className="mb-3 font-bold">Você vai?</p><div className="grid grid-cols-3 gap-2">{(["VOU","NÃO VOU","TALVEZ"] as const).map(x=><button onClick={()=>setConfirmed(x)} className={`btn ${confirmed===x?"btn-primary":"btn-muted"}`} key={x}>{x}</button>)}</div>{confirmed&&<div className="mt-4 flex items-center gap-2 text-sm text-emerald-400"><CheckCircle2 size={16}/> Status: {confirmed}</div>}</section>
    <section className="card p-6"><h2 className="mb-4 text-xl font-black">Resumo</h2><div className="grid grid-cols-2 gap-3">{[["Confirmados",eligible,Users],["Goleiros",players.filter(p=>p.isGoalkeeper).length,ShieldCheck],["Overall médio",avg.toFixed(2),Trophy],["Status","ABERTO",Clock3]].map(([a,b,I]:any)=><div className="rounded-2xl bg-zinc-900 p-4" key={a}><I size={18} className="mb-2 text-zinc-400"/><div className="text-xs text-zinc-500">{a}</div><div className="text-xl font-black">{b}</div></div>)}</div></section>
   </div>}
   {tab==="Jogo" && <section className="card p-6"><h2 className="text-2xl font-black">⚽ Futebol de Sábado</h2><p className="mt-1 text-zinc-400">Sábado • 20:00 • Arena Society</p><div className="mt-6 grid gap-3 sm:grid-cols-3">{(["VOU","NÃO VOU","TALVEZ"] as const).map(x=><button onClick={()=>setConfirmed(x)} className={`btn ${confirmed===x?"btn-primary":"btn-muted"}`} key={x}>{x}</button>)}</div></section>}
   {tab==="Perfil" && <section className="card p-6"><h2 className="text-2xl font-black">Vinicius</h2><p className="mt-2 text-zinc-400">Mensalista</p><div className="mt-5 text-3xl font-black">⭐ 8.2</div><div className="mt-4 flex flex-wrap gap-2">{["Meio-campo","Lateral","Ponta"].map(p=><span className="badge bg-zinc-800" key={p}>{p}</span>)}</div></section>}
   {tab==="Times" && <section><div className="mb-4 flex items-center justify-between"><div><h2 className="text-2xl font-black">Times definidos</h2><p className="text-zinc-400">{generated?`${teams.length} times gerados`:"Aguardando montagem"}</p></div><button onClick={generate} disabled={!teamCount} className="btn btn-primary flex items-center gap-2 disabled:opacity-40"><RefreshCw size={16}/> Gerar Times</button></div>{!teamCount&&<div className="card p-6 text-amber-300">Há {count} jogadores. São necessários pelo menos 18 jogadores para formar 3 times com no mínimo 6 jogadores.</div>}<div className="grid gap-4 md:grid-cols-2">{teams.map(t=><div className="card p-5" key={t.id}><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-black">{t.name}</h3><span className="badge bg-zinc-800">{t.players.length} jogadores</span></div><div className="mb-4 text-sm text-zinc-400">⭐ Overall médio {(t.players.reduce((s:any,p:any)=>s+p.overall,0)/t.players.length).toFixed(2)}</div>{t.players.map((p:any)=><div className="flex justify-between border-t border-white/5 py-2" key={p.id}><span>{p.name}</span><span className="text-zinc-400">{p.overall.toFixed(1)}</span></div>)}</div>)}</div></section>}
   {tab==="Admin" && <section className="space-y-4"><div className="card p-6"><div className="mb-4 flex items-center gap-2"><Settings/><h2 className="text-2xl font-black">Montar Times</h2></div><label className="text-sm text-zinc-400">Jogadores de linha confirmados</label><input type="range" min="15" max={linePlayers.length} value={count} onChange={e=>setCount(+e.target.value)} className="mt-3 w-full"/><div className="mt-2 font-bold">{count} jogadores • {teamCount||"sem montagem automática"} times</div><p className="mt-3 text-sm text-zinc-500">Regras: mínimo 15 para realizar o futebol; mínimo 18 para montar 3 times; 24+ para 4 times; mínimo 6 jogadores de linha por time.</p><button onClick={generate} disabled={!teamCount} className="btn btn-primary mt-5">GERAR TIMES</button></div><div className="card p-6"><h3 className="mb-3 font-black">Jogadores</h3><div className="grid gap-2 md:grid-cols-2">{players.map(p=><div className="flex items-center justify-between rounded-xl bg-zinc-900 p-3" key={p.id}><span>{p.name}</span><span className="text-sm text-zinc-400">⭐ {p.overall}</span></div>)}</div></div></section>}
  </main>
 </div>
}
export default App;
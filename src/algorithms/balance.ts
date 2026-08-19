import type {Player,Team} from "../types";

const score=(teams:Team[])=>{
  const av=teams.map(t=>t.players.reduce((s,p)=>s+p.overall,0)/Math.max(1,t.players.length));
  const mean=av.reduce((a,b)=>a+b,0)/av.length;
  const variance=av.reduce((s,x)=>s+(x-mean)**2,0)/av.length;
  const sizes=teams.map(t=>t.players.length);
  const sizePenalty=Math.max(...sizes)-Math.min(...sizes);
  const positionPenalty=teams.reduce((sum,t)=>{
    const counts=new Map<string,number>(); t.players.forEach(p=>p.positions.forEach(x=>counts.set(x,(counts.get(x)||0)+1)));
    return sum+[...counts.values()].reduce((a,n)=>a+Math.max(0,n-3)*0.02,0)
  },0);
  return Math.sqrt(variance)+sizePenalty*.15+positionPenalty;
};

export function generateBalancedTeams(players:Player[], teamCount:number):Team[]{
  if(players.length<teamCount*6) throw new Error(`São necessários ${teamCount*6} jogadores de linha.`);
  const sizes=Array(teamCount).fill(Math.floor(players.length/teamCount));
  for(let i=0;i<players.length%teamCount;i++) sizes[i]++;
  const sorted=[...players].sort((a,b)=>b.overall-a.overall);
  let best:Team[]|null=null,bestScore=Infinity;
  // Deterministic snake + repeated rotations: simple, fast and avoids a purely greedy one-pass result.
  for(let attempt=0;attempt<Math.min(300,Math.max(30,players.length*8));attempt++){
    const teams=sizes.map((_,i)=>({id:String(i),name:`TIME ${String.fromCharCode(65+i)}`,players:[]} as Team));
    const order=attempt%2===0?sorted:[...sorted].reverse();
    order.forEach((p,i)=>{
      const ranked=[...teams].sort((a,b)=>{
        const aa=a.players.reduce((s,x)=>s+x.overall,0)/Math.max(1,a.players.length);
        const bb=b.players.reduce((s,x)=>s+x.overall,0)/Math.max(1,b.players.length);
        return aa-bb || a.players.length-b.players.length;
      });
      const eligible=ranked.find(t=>t.players.length<sizes[+t.id]);
      (eligible||ranked[0]).players.push(p);
    });
    const s=score(teams);
    if(s<bestScore){bestScore=s;best=teams}
    sorted.push(sorted.shift()!);
  }
  return best!;
}
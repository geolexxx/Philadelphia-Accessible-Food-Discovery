export function meters(a,b){const rad=Math.PI/180,p=a[1]*rad,q=b[1]*rad,h=Math.sin((q-p)/2)**2+Math.cos(p)*Math.cos(q)*Math.sin((b[0]-a[0])*rad/2)**2;return 12742017.6*Math.asin(Math.min(1,Math.sqrt(h)));}
export function inRing(p,r){let inside=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])inside=!inside;}return inside;}
export function inGeometry(p,g){const polys=g.type==='Polygon'?[g.coordinates]:g.coordinates;return polys.some(r=>inRing(p,r[0])&&!r.slice(1).some(h=>inRing(p,h)));}
export class Heap{constructor(){this.a=[];}push(x){let i=this.a.length;this.a.push(x);while(i){const j=(i-1)>>1;if(this.a[j][0]<=x[0])break;this.a[i]=this.a[j];i=j;}this.a[i]=x;}pop(){if(!this.a.length)return null;const first=this.a[0],last=this.a.pop();if(this.a.length){let i=0;while(i*2+1<this.a.length){let j=i*2+1;if(j+1<this.a.length&&this.a[j+1][0]<this.a[j][0])j++;if(this.a[j][0]>=last[0])break;this.a[i]=this.a[j];i=j;}this.a[i]=last;}return first;}get length(){return this.a.length;}}
export function graphOf(roads){const edges=roads.nodes.map(()=>[]);for(const [ns,dir] of roads.ways){for(let i=1;i<ns.length;i++){const a=ns[i-1],b=ns[i],d=meters(roads.nodes[a],roads.nodes[b]);if(dir!==-1)edges[a].push([b,d]);if(dir!==1)edges[b].push([a,d]);}}return edges;}
export function nearest(p,nodes){let index=-1,distance=Infinity;for(let i=0;i<nodes.length;i++){const d=meters(p,nodes[i]);if(d<distance){distance=d;index=i;}}return {index,distance};}
export function shortest(edges,start){const dist=new Float64Array(edges.length).fill(Infinity),prev=new Int32Array(edges.length).fill(-1),heap=new Heap();dist[start]=0;heap.push([0,start]);while(heap.length){const [d,u]=heap.pop();if(d>dist[u])continue;for(const [v,w] of edges[u]){const next=d+w;if(next<dist[v]){dist[v]=next;prev[v]=u;heap.push([next,v]);}}}return {dist,prev};}
export function modelMinutes(distance){return distance/1000/25*60+5;}
export function filterPlaces(places,state,routes,saved){const query=state.query.trim().toLowerCase();return places.filter(p=>{
 if(query&&!`${p.name} ${p.address} ${p.zip}`.toLowerCase().includes(query))return false;
 if(state.category!=='all'&&p.category!==state.category)return false;
 if(state.snap&&p.snap!=='historical')return false;
 if(state.tab==='saved'&&!saved.has(p.id))return false;
 if(state.area&&p.area!==state.area)return false;
 const r=routes[p.id];if(state.mode==='drive'&&(!Number.isFinite(r?.distance)||!Number.isFinite(r?.minutes)||r.minutes>state.limit))return false;
 if(state.mode==='nearby'&&(!Number.isFinite(r?.direct)||r.direct>state.radius*1000))return false;
 return true;
 }).sort((a,b)=>{if(state.sort==='information'&&a.completeness!==b.completeness)return b.completeness-a.completeness;const ra=routes[a.id],rb=routes[b.id];return ((state.mode==='drive'?ra?.distance:ra?.direct)??Infinity)-((state.mode==='drive'?rb?.distance:rb?.direct)??Infinity)||a.name.localeCompare(b.name);});}

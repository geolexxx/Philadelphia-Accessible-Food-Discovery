import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {meters,inGeometry,Heap,graphOf,shortest,nearest,modelMinutes,filterPlaces} from '../engine.js';
const load=n=>JSON.parse(readFileSync(new URL(`../data/${n}.json`,import.meta.url)));
test('distance has geographic units, symmetry and zero identity',()=>{
 assert.equal(meters([0,0],[0,0]),0);
 assert.ok(Math.abs(meters([0,0],[0,1])-111195)<10);
 assert.equal(meters([-75,40],[-74,41]),meters([-74,41],[-75,40]));
});
test('polygon holes and multiple polygons are respected',()=>{
 const outer=[[0,0],[4,0],[4,4],[0,4],[0,0]],hole=[[1,1],[3,1],[3,3],[1,3],[1,1]];
 const g={type:'Polygon',coordinates:[outer,hole]};
 assert.equal(inGeometry([.5,.5],g),true);assert.equal(inGeometry([2,2],g),false);
 assert.equal(inGeometry([5,5],g),false);
 assert.equal(inGeometry([.5,.5],{type:'MultiPolygon',coordinates:[[outer,hole]]}),true);
});
test('heap orders repeated and negative priorities',()=>{
 const h=new Heap();[5,0,5,-1,3].forEach(n=>h.push([n,n]));
 assert.deepEqual(Array.from({length:5},()=>h.pop()[0]),[-1,0,3,5,5]);assert.equal(h.pop(),null);
});
test('driving graph respects one-way and reverse one-way streets',()=>{
 const r={nodes:[[0,0],[0,.01],[.01,.01],[.02,.01]],ways:[[[0,1],1],[[1,2],-1],[[2,3],0]]};
 const e=graphOf(r);assert.ok(Number.isFinite(shortest(e,0).dist[1]));
 assert.equal(shortest(e,1).dist[0],Infinity);assert.equal(shortest(e,1).dist[2],Infinity);
 assert.ok(Number.isFinite(shortest(e,3).dist[1]));
});
test('Dijkstra chooses shorter multi-edge path and marks disconnected nodes',()=>{
 const {dist,prev}=shortest([[[1,10],[2,2]],[],[[1,3]],[]],0);
 assert.equal(dist[1],5);assert.equal(prev[1],2);assert.equal(dist[3],Infinity);assert.equal(prev[3],-1);
});
test('travel model is explicitly distance at 25 km/h plus 5-minute overhead',()=>{
 assert.equal(modelMinutes(0),5);assert.equal(modelMinutes(25000),65);
});
const candidates=[{id:'a',name:'Alpha',address:'1 Main',zip:'19103',category:'Grocery',snap:'historical',area:'01',completeness:3},{id:'b',name:'Beta',address:'2 Main',zip:'19104',category:'Supermarket',snap:'unknown',area:'02',completeness:6}];
const defaults={query:'',category:'all',snap:false,tab:'explore',mode:'drive',limit:15,radius:3,sort:'distance',area:null};
const routes={a:{distance:1000,minutes:10,direct:500},b:{distance:5000,minutes:17,direct:1000}};
test('drive budget, unknown routes and malformed estimates do not leak into results',()=>{
 assert.deepEqual(filterPlaces(candidates,defaults,routes,new Set()).map(p=>p.id),['a']);
 assert.equal(filterPlaces(candidates,defaults,{},new Set()).length,0);
 assert.equal(filterPlaces(candidates,defaults,{a:{distance:null,minutes:null}},new Set()).length,0);
});
test('nearby distance is not road distance; historical SNAP never implies unknown = no',()=>{
 const s={...defaults,mode:'nearby'};
 assert.equal(filterPlaces(candidates,s,routes,new Set()).length,2);
 assert.deepEqual(filterPlaces(candidates,{...s,snap:true},routes,new Set()).map(p=>p.id),['a']);
 assert.equal(filterPlaces(candidates,s,{},new Set()).length,0);
 assert.deepEqual(filterPlaces(candidates,{...s,tab:'saved'},routes,new Set(['b'])).map(p=>p.id),['b']);
});
test('query, area, category and information sort compose correctly',()=>{
 const s={...defaults,mode:'nearby',sort:'information'};
 assert.deepEqual(filterPlaces(candidates,s,routes,new Set()).map(p=>p.id),['b','a']);
 assert.equal(filterPlaces(candidates,{...s,query:'19104',category:'Supermarket',area:'02'},routes,new Set())[0].id,'b');
 assert.equal(filterPlaces(candidates,{...s,query:'19104',area:'01'},routes,new Set()).length,0);
});
test('snapshot identity, provenance, AOI assignment and completeness are internally consistent',()=>{
 const ps=load('places'),as=load('areas'),m=load('manifest'),city=load('city');
 assert.equal(ps.length,m.poiCount);assert.equal(as.length,m.areaCount);assert.equal(new Set(ps.map(p=>p.id)).size,ps.length);
 const ids=new Set(as.map(a=>a.id));
 for(const p of ps){assert.ok(inGeometry(p.point,city));assert.ok(!p.area||ids.has(p.area));assert.equal(p.sources.length,p.sourceIds.length);assert.equal(p.completeness,['name','address','category','phone','website','hours'].filter(k=>p[k]).length);}
 assert.equal(ps.filter(p=>p.matchStatus).length,m.provisionalMatches);
 assert.equal(load('match-review').length,m.provisionalMatches);
 assert.equal(ps.filter(p=>p.snap==='historical').length,m.snapCount);
});
test('real road graph has valid references and reaches stores from City Hall',()=>{
 const r=load('roads'),m=load('manifest');assert.equal(r.nodes.length,m.roadNodes);assert.equal(r.ways.length,m.roadWays);
 for(const [ns,d] of r.ways){assert.ok([-1,0,1].includes(d));assert.ok(ns.every(n=>Number.isInteger(n)&&n>=0&&n<r.nodes.length));}
 const start=nearest([-75.1636,39.9526],r.nodes);assert.ok(start.distance<=150);
 const result=shortest(graphOf(r),start.index);assert.ok([...result.dist].filter(Number.isFinite).length>1000);
 const ps=load('places').slice(0,10);for(const p of ps){const n=nearest(p.point,r.nodes);if(Number.isFinite(result.dist[n.index]))assert.ok(result.dist[n.index]+start.distance+n.distance>=meters([-75.1636,39.9526],p.point)-.1);}
});

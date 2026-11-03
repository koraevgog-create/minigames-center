/* Turbo Legends 2.1 — segmented road and camera projection.
   Geometry ideas: per-segment curve/elevation, smooth transition and distance-dependent perspective.
   Independent implementation built for Turbo Legends' metre-based engine. */
(()=>{'use strict';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const SEGMENT=24,DRAW=3000;
const specs={
 coast:[[-.8,0],[-.5,18],[0,0],[.35,-22],[.7,8]],
 alpine:[[0,0],[.23,60],[.46,-25],[.69,80],[.91,4]],
 desert:[[0,0],[.25,-22],[.49,55],[.72,-32],[.92,3]],
 night:[[0,0],[.19,14],[.40,-13],[.62,25],[.85,0]]
};
const cache=new WeakMap();
function ease(t){t=clamp(t,0,1);return t*t*(3-2*t)}
function heightAt(z,track){
 const p=((z%track.length)+track.length)%track.length/track.length;
 const pts=specs[track.theme]||specs.coast;
 // authored smooth hills; continuous at circuit seam
 const a=[...pts.filter(q=>q[0]>=0),[1,pts.find(q=>q[0]===0)?.[1]||0]];
 let prev=a[0];
 for(let i=1;i<a.length;i++){const next=a[i];if(p<=next[0]){
 const t=ease((p-prev[0])/Math.max(.0001,next[0]-prev[0]));
 return prev[1]+(next[1]-prev[1])*t;
 }prev=next}
 return 0;
}
function trackSegments(track){
 let found=cache.get(track);if(found)return found;
 const count=Math.ceil(track.length/SEGMENT),segments=[];
 for(let i=0;i<count;i++){
  const z=i*SEGMENT;
  segments.push({z,curve:window.TurboTrackModel?.curvature(z,track)||0,height:heightAt(z,track)});
 }
 found={segments,count,length:track.length};
 cache.set(track,found);return found;
}
function sample(state,w=960,h=540){
 const {track,player:p}=state;
 const data=trackSegments(track);
 const points=[];
 const n=Math.ceil(DRAW/SEGMENT);
 // Camera follows the segment under the player; the horizon bends ahead.
 let position=0,derivative=0;
 const baseHeight=heightAt(p.z,track);
 for(let i=0;i<=n;i++){
  const world=p.z+i*SEGMENT;
  const d=i*SEGMENT;
  const segment=data.segments[Math.floor((((world%track.length)+track.length)%track.length)/SEGMENT)%data.count];
  if(i>0){
    position+=derivative;
    derivative+=(window.TurboTrackModel?.curvature(world,track)||segment.curve)*.088;
  }
  const scale=250/(250+d);
  const width=w*.565*scale;
  const hill=heightAt(world,track)-baseHeight;
  const y=h*.39+(h*.66)*scale-hill*scale*1.24;
  const x=w*.5-position*scale*16.0-p.x*width*.85;
  points.push({z:world,d,x,y,width,scale,curve:segment.curve,height:segment.height});
 }
 return points;
}
function stats(track){const x=trackSegments(track);return {segments:x.count,segmentLength:SEGMENT,length:track.length}}
window.TurboSegmentRoad={sample,stats,heightAt,SEGMENT,DRAW};
})();
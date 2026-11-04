/* Turbo Legends 1.1: authored track geometry shared between gameplay and radar. */
(()=>{'use strict';
// Distinct track identities. Percentages refer to one full lap; the same
// geometry feeds physics, roadside projection, radar and warning logic.
const profiles={
 coast:[
  [.016,.095,.94],[.17,.235,-1.20],[.315,.377,1.34],
  [.455,.535,-.80],[.595,.665,1.47],[.735,.802,-1.12],[.865,.946,.72]
 ],
 alpine:[
  [.016,.076,1.45],[.103,.144,-1.72],[.173,.208,2.04],
  [.237,.285,-1.95],[.314,.382,1.65],[.411,.448,-1.99],
  [.478,.537,1.78],[.575,.617,-1.90],[.65,.701,1.57],
  [.739,.779,-1.79],[.817,.865,1.46],[.905,.965,-1.13]
 ],
 desert:[
  [.018,.146,1.04],[.194,.314,-1.04],[.355,.493,.82],
  [.548,.607,-1.90],[.632,.679,1.98],
  [.712,.771,-1.86],[.802,.938,.93]
 ],
 night:[
  [.014,.075,-1.50],[.103,.144,1.68],[.172,.224,-1.38],
  [.261,.294,1.89],[.319,.371,-1.62],[.410,.448,1.71],
  [.476,.523,-1.91],[.551,.615,1.57],[.651,.689,-1.79],
  [.718,.766,1.68],[.804,.847,-1.55],[.887,.953,1.16]
 ]
};
const characters={
 coast:{name:'Приморское шоссе',style:'fast-flowing',features:'Длинные плавные дуги, виды на море'},
 alpine:{name:'Горный серпантин',style:'technical',features:'Частые связки крутых поворотов и перепады высот'},
 desert:{name:'Каньон',style:'rhythm',features:'Длинные прямые между сложными двойными виражами'},
 night:{name:'Ночной город',style:'technical-fast',features:'Последовательные скоростные S-повороты и огни города'}
};
const smooth=x=>{x=Math.max(0,Math.min(1,x));return x*x*(3-2*x)};
function curvature(z,track){const x=((z%track.length)+track.length)%track.length/track.length;const entries=profiles[track.theme]||profiles.coast;let result=0;for(const [start,end,strength] of entries){const ramp=Math.min(.022,(end-start)*.27);const enter=smooth((x-start)/ramp),leave=1-smooth((x-(end-ramp))/ramp);result+=strength*enter*leave}return result}
function upcoming(z,track,distance=210){let worst=0;for(let d=0;d<=distance;d+=35){const c=curvature(z+d,track);if(Math.abs(c)>Math.abs(worst))worst=c}return worst}
window.TurboTrackModel={curvature,upcoming,profiles,characters};
})();
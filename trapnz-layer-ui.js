(function(){
'use strict';
/* Display clustering layer for Kaitiaki Pest.
   The existing Trap.NZ UI is preserved in trapnz-layer-ui-core.js.
   At overview scale, dense trap points are replaced by clear count bubbles;
   zooming in reveals the individual traps again. */
function loadCore(){
  var s=document.createElement('script');
  s.src='trapnz-layer-ui-core.js';
  s.onload=installClusters;
  s.onerror=function(){console.error('Kaitiaki Pest: core UI failed to load');};
  document.head.appendChild(s);
}
function installClusters(){
  if(window.__kpClustersInstalled||!window.L)return;
  window.__kpClustersInstalled=true;
  var overlay=null;
  function map(){return window.__kpMap||null;}
  function ensureOverlay(m){
    if(!m)return null;
    var pane=m.getPane('overlayPane')||m.getPanes().overlayPane;
    if(!overlay||overlay.parentNode!==pane){
      overlay=document.createElement('div');
      overlay.id='kp-cluster-overlay';
      overlay.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:650;';
      pane.appendChild(overlay);
    }
    return overlay;
  }
  function clear(){if(overlay)overlay.replaceChildren();}
  function isTrapLayer(l){
    return l && l.getLatLng && l.options && l.options.fillOpacity!==undefined &&
      l.options.weight!==undefined && !l.options.icon;
  }
  function collect(m){
    var out=[];
    Object.keys(m._layers||{}).forEach(function(id){
      var l=m._layers[id];
      if(!isTrapLayer(l))return;
      var o=l.options||{};
      var fc=String(o.fillColor||'').toLowerCase();
      /* Core traps are green; tolerate the orange trap styling used by older builds. */
      if(fc!=='#16803c'&&fc!=='#f59e0b'&&fc!=='#f39c12'&&fc!=='#ff9800')return;
      var ll=l.getLatLng();
      if(!ll||!isFinite(ll.lat)||!isFinite(ll.lng))return;
      out.push({layer:l,lat:ll.lat,lng:ll.lng});
    });
    return out;
  }
  function bubble(x,y,n,latlng){
    var d=document.createElement('button');
    d.type='button';
    d.className='kp-cluster-bubble';
    d.textContent=n>9999?'9999+':String(n);
    var size=n<10?38:n<50?46:n<200?54:n<500?62:70;
    d.style.width=size+'px';d.style.height=size+'px';
    d.style.left=(x-size/2)+'px';d.style.top=(y-size/2)+'px';
    d.title=n+' traps in this area — tap to zoom';
    d.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var m=map();if(m&&latlng)m.setView(latlng,Math.min(m.getZoom()+2,17),{animate:false});});
    overlay.appendChild(d);
  }
  function render(){
    var m=map();
    if(!m)return;
    var z=m.getZoom(),o=ensureOverlay(m);
    if(!o)return;
    clear();
    var pts=collect(m);
    /* At close scale use the existing individual points and labels. */
    if(z>=15){pts.forEach(function(p){try{p.layer.setStyle({opacity:1,fillOpacity:.9});}catch(e){}});return;}
    /* At overview scale hide individual points and group nearby points into clusters. */
    pts.forEach(function(p){try{p.layer.setStyle({opacity:0,fillOpacity:0,interactive:false});}catch(e){}});
    if(!pts.length)return;
    var cell=z<=11?72:z<=12?64:z<=13?54:46;
    var groups=new Map();
    pts.forEach(function(p){
      var q=m.project([p.lat,p.lng]),gx=Math.floor(q.x/cell),gy=Math.floor(q.y/cell),k=gx+':'+gy;
      var g=groups.get(k);
      if(!g){g={n:0,x:0,y:0,lat:0,lng:0};groups.set(k,g);}
      g.n++;g.x+=q.x;g.y+=q.y;g.lat+=p.lat;g.lng+=p.lng;
    });
    groups.forEach(function(g){
      var x=g.x/g.n,y=g.y/g.n,ll=[g.lat/g.n,g.lng/g.n];
      bubble(x,y,g.n,ll);
    });
  }
  var timer=null;
  function schedule(){clearTimeout(timer);timer=setTimeout(render,80);}
  function hook(m){
    if(!m||m.__kpClusterEvents)return;
    m.__kpClusterEvents=true;
    m.on('zoomend moveend resize overlayadd overlayremove',schedule);
    setTimeout(render,250);
  }
  var wait=setInterval(function(){var m=map();if(m){clearInterval(wait);hook(m);}},250);
  var style=document.createElement('style');
  style.textContent='.kp-cluster-bubble{position:absolute;transform:translateZ(0);border:4px solid rgba(255,255,255,.95);border-radius:50%;background:#d95b3b;color:#fff;font:800 16px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.28);padding:0;text-align:center;pointer-events:auto;touch-action:manipulation;cursor:pointer}.kp-cluster-bubble:active{transform:scale(.96)}';
  document.head.appendChild(style);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadCore);else loadCore();
})();
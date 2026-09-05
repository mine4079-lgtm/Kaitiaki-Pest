(function(){
'use strict';
/* Kaitiaki Pest — LINZ Topo50 + display clustering. */

/*
   The main index.html already owns the Leaflet map and base-map selector.
   Patch Leaflet's tileLayer call so the Topographic choice uses the real
   LINZ Topo50 raster tiles (layer 50767), which Leaflet can display directly.
   The newer LINZ "topographic" service is vector/PBF + StyleJSON, not a PNG
   raster, so pointing Leaflet at it as .webp does not work correctly.
*/
function installLinzTopoPatch(){
  if(!window.L||window.__kpLinzTopoPatch)return;
  window.__kpLinzTopoPatch=true;
  var nativeTileLayer=window.L.tileLayer;
  window.L.tileLayer=function(url,options){
    try{
      if(typeof url==='string' && url.indexOf('/topographic/')>=0){
        var match=url.match(/[?&]api=([^&]+)/i);
        var key=match?decodeURIComponent(match[1]):(localStorage.getItem('kp_linz_key')||'');
        if(key){
          var topoUrl='https://tiles-{s}.data-cdn.linz.govt.nz/services;key='+encodeURIComponent(key)+'/tiles/v4/layer=50767/EPSG:3857/{z}/{x}/{y}.png';
          var o=Object.assign({},options||{});
          o.subdomains=['a','b','c','d'];
          o.maxZoom=17;
          o.maxNativeZoom=17;
          o.attribution='© LINZ CC BY 4.0';
          return nativeTileLayer(topoUrl,o);
        }
      }
    }catch(e){console.warn('LINZ Topo50 patch:',e);}
    return nativeTileLayer(url,options);
  };
}

function loadCore(){
  installLinzTopoPatch();
  /* Keep the LINZ Topo50 raster from index.html. The core's MapLibre
     topographic layer is intentionally bypassed because the Trap.NZ-style
     raster is clearer and closer to the field map the team already uses. */
  if(window.L){
    window.maplibregl=window.maplibregl||{};
    if(!window.L.maplibreGL){
      window.L.maplibreGL=function(){return {addTo:function(){return this;},remove:function(){}};};
    }
  }
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
  function getMap(){return window.__kpMap||null;}
  function ensureOverlay(m){
    var pane=m&&m.getPane('overlayPane');
    if(!pane)return null;
    if(!overlay||overlay.parentNode!==pane){
      overlay=document.createElement('div');
      overlay.id='kp-cluster-overlay';
      overlay.style.cssText='position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;z-index:650;';
      pane.appendChild(overlay);
    }
    return overlay;
  }
  function clear(){if(overlay)overlay.replaceChildren();}
  function pointLayers(m){
    var out=[];
    Object.keys(m._layers||{}).forEach(function(id){
      var l=m._layers[id],o=l&&l.options;
      if(!l||!l.getLatLng||!o||o.fillOpacity===undefined||o.weight===undefined||o.icon)return;
      var fc=String(o.fillColor||'').toLowerCase();
      if(['#16803c','#f59e0b','#f39c12','#ff9800'].indexOf(fc)<0)return;
      var ll=l.getLatLng();
      if(ll&&isFinite(ll.lat)&&isFinite(ll.lng))out.push({layer:l,lat:ll.lat,lng:ll.lng,color:fc});
    });
    return out;
  }
  function bubble(x,y,n,ll,kind){
    var d=document.createElement('button');d.type='button';d.className='kp-cluster-bubble';
    d.textContent=n>9999?'9999+':String(n);
    var size=n<10?38:n<50?46:n<200?54:n<500?62:70;
    d.style.width=size+'px';d.style.height=size+'px';d.style.left=(x-size/2)+'px';d.style.top=(y-size/2)+'px';
    d.style.background=kind==='orange'?'#d95b3b':'#16803c';
    d.title=n+' locations in this area — tap to zoom';
    d.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();var m=getMap();if(m)m.setView(ll,Math.min(m.getZoom()+2,17),{animate:false});});
    overlay.appendChild(d);
  }
  function render(){
    var m=getMap();if(!m)return;
    var z=m.getZoom(),o=ensureOverlay(m);if(!o)return;clear();
    var pts=pointLayers(m);if(!pts.length)return;
    if(z>=15){pts.forEach(function(p){try{p.layer.setStyle({opacity:1,fillOpacity:.9});}catch(e){}});return;}
    pts.forEach(function(p){try{p.layer.setStyle({opacity:0,fillOpacity:0});}catch(e){}});
    var cell=z<=11?72:z<=12?64:z<=13?54:46;
    var groups=new Map();
    pts.forEach(function(p){
      var q=m.project([p.lat,p.lng]),gx=Math.floor(q.x/cell),gy=Math.floor(q.y/cell),k=p.color+'|'+gx+':'+gy;
      var g=groups.get(k);if(!g){g={n:0,x:0,y:0,lat:0,lng:0,color:p.color};groups.set(k,g);}
      g.n++;g.x+=q.x;g.y+=q.y;g.lat+=p.lat;g.lng+=p.lng;
    });
    groups.forEach(function(g){bubble(g.x/g.n,g.y/g.n,g.n,[g.lat/g.n,g.lng/g.n],g.color==='#16803c'?'green':'orange');});
  }
  var timer=null;
  function schedule(){clearTimeout(timer);timer=setTimeout(render,80);}
  function hook(m){
    if(!m||m.__kpClusterEvents)return;
    m.__kpClusterEvents=true;
    m.on('zoomend moveend resize overlayadd overlayremove',schedule);
    setTimeout(render,300);
  }
  var wait=setInterval(function(){var m=getMap();if(m){clearInterval(wait);hook(m);}},250);
  var style=document.createElement('style');
  style.textContent='.kp-cluster-bubble{position:absolute;transform:translateZ(0);border:4px solid rgba(255,255,255,.95);border-radius:50%;color:#fff;font:800 16px/1 system-ui,-apple-system,Segoe UI,sans-serif;box-shadow:0 2px 10px rgba(0,0,0,.28);padding:0;text-align:center;pointer-events:auto;touch-action:manipulation;cursor:pointer}.kp-cluster-bubble:active{transform:scale(.96)}';
  document.head.appendChild(style);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadCore);else loadCore();
})();
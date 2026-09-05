(function(){
'use strict';
/* Kaitiaki Pest — LINZ Topo50 + display clustering. */
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
          var topoUrl='https://basemaps.linz.govt.nz/v1/tiles/topo-raster/WebMercatorQuad/{z}/{x}/{y}.webp?api='+encodeURIComponent(key);
          var o=Object.assign({},options||{});
          o.maxZoom=20;
          o.maxNativeZoom=15;
          o.attribution='© Toitū Te Whenua LINZ CC BY 4.0';
          return nativeTileLayer(topoUrl,o);
        }
      }
    }catch(e){console.warn('LINZ Topo50 patch:',e);}
    return nativeTileLayer(url,options);
  };
}
function loadCore(){
  installLinzTopoPatch();
  var s=document.createElement('script');
  s.src='trapnz-layer-ui-core.js';
  s.onload=function(){installClusters();installContourEnhancer();};
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
function installContourEnhancer(){
  if(window.__kpContourEnhancerInstalled||!window.L)return;
  window.__kpContourEnhancerInstalled=true;
  function styleContours(){
    var gl=window.__kpTopoGL&&window.__kpTopoGL._glMap;
    if(!gl||!gl.getStyle)return;
    try{
      (gl.getStyle().layers||[]).forEach(function(layer){
        if(layer['source-layer']!=='contours'||layer.type!=='line')return;
        var id=layer.id;
        try{
          gl.setPaintProperty(id,'line-color','#8b5a2b');
          gl.setPaintProperty(id,'line-opacity',0.82);
          gl.setPaintProperty(id,'line-width',['interpolate',['linear'],['zoom'],9,0.8,11,1.1,13,1.45,15,1.9]);
        }catch(e){}
      });
      var st=document.getElementById('mapStatus');
      if(st&&document.querySelector('input[name="base"]:checked')?.value==='topo')st.textContent='LINZ Topographic map loaded • contour lines enhanced.';
    }catch(e){console.warn('Contour styling:',e);}
  }
  function hook(){
    var gl=window.__kpTopoGL&&window.__kpTopoGL._glMap;
    if(!gl){setTimeout(hook,400);return;}
    gl.on('load',styleContours);
    gl.on('styledata',function(){setTimeout(styleContours,50);});
    setTimeout(styleContours,500);
  }
  function watch(){
    if(window.__kpTopoGL){hook();return;}
    setTimeout(watch,500);
  }
  watch();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',loadCore);else loadCore();
})();

/* Deep zoom fix: keep Leaflet zooming past the LINZ Topographic vector tile
   source zoom (15). MapLibre vector tiles can be overzoomed cleanly, so the
   contour geometry remains sharp instead of the map stopping at z15. */
(function(){
  'use strict';
  function apply(){
    var m=window.__kpMap;
    if(!m||!window.L)return;
    try{
      m.options.maxZoom=22;
      m._layersMaxZoom=22;
      if(m._zoom!==undefined && m.getZoom()>=15) m.invalidateSize({pan:false});
    }catch(e){}
  }
  var n=0;
  var timer=setInterval(function(){
    apply();
    if(++n>40)clearInterval(timer);
  },250);
  document.addEventListener('visibilitychange',apply);
})();

/* Deep-zoom label polish: progressively reduce label density so the map behaves
   more like Trap.NZ: sparse labels at close overview zooms, more labels as you
   zoom in, and all trap numbers at deep zoom. This only changes display. */
(function(){
  'use strict';
  if(window.__kpLabelPolishInstalled)return;
  window.__kpLabelPolishInstalled=true;
  function getMap(){return window.__kpMap||null;}
  function labelMarkers(m){
    var out=[];
    function walk(group){
      Object.keys(group&&group._layers||{}).forEach(function(id){
        var l=group._layers[id];
        if(!l)return;
        if(l._layers){walk(l);return;}
        if(!l._icon||!l.options||!l.options.icon)return;
        var cls=String(l.options.icon.options&&l.options.icon.options.className||'');
        if(cls.indexOf('label')<0)return;
        var ll=l.getLatLng&&l.getLatLng();
        if(!ll||!isFinite(ll.lat)||!isFinite(ll.lng))return;
        out.push(l);
      });
    }
    walk(m);
    return out;
  }
  function apply(){
    var m=getMap();if(!m)return;
    var z=m.getZoom(),labels=labelMarkers(m);if(!labels.length)return;
    var spacing=z<15?999: z===15?72 : z===16?54 : z===17?38 : z>=18?0:30;
    labels.forEach(function(l){if(l._icon)l._icon.style.display='';});
    if(z<15){labels.forEach(function(l){if(l._icon)l._icon.style.display='none';});return;}
    if(!spacing)return;
    var kept=[];
    labels.sort(function(a,b){
      var ap=a.getLatLng(),bp=b.getLatLng();
      return ap.lat-bp.lat || ap.lng-bp.lng;
    });
    labels.forEach(function(l){
      var p=m.latLngToContainerPoint(l.getLatLng()),ok=true;
      for(var i=0;i<kept.length;i++){
        var dx=p.x-kept[i].x,dy=p.y-kept[i].y;
        if(dx*dx+dy*dy<spacing*spacing){ok=false;break;}
      }
      if(l._icon)l._icon.style.display=ok?'':'none';
      if(ok)kept.push({x:p.x,y:p.y});
    });
  }
  var timer=null;
  function schedule(){clearTimeout(timer);timer=setTimeout(apply,60);}
  function hook(){
    var m=getMap();
    if(!m){setTimeout(hook,300);return;}
    if(m.__kpLabelEvents)return;
    m.__kpLabelEvents=true;
    m.on('zoomend moveend resize',schedule);
    setInterval(schedule,900);
    setTimeout(apply,700);
  }
  hook();
})();
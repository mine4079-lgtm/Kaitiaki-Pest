(function(){
'use strict';
/* Kaitiaki Pest — LINZ vector Topographic basemap upgrade.
   Replaces the blurry raster topo layer with LINZ vector topography. */
function loadCss(href){
  if(document.querySelector('link[data-kp-href="'+href+'"]'))return;
  var l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.kpHref=href;document.head.appendChild(l);
}
function loadScript(src,done){
  var old=document.querySelector('script[data-kp-src="'+src+'"]');
  if(old){if(old.dataset.loaded==='1')done();else old.addEventListener('load',done,{once:true});return;}
  var s=document.createElement('script');s.src=src;s.async=true;s.dataset.kpSrc=src;
  s.onload=function(){s.dataset.loaded='1';done();};
  s.onerror=function(){console.error('Kaitiaki Pest: failed to load '+src);};
  document.head.appendChild(s);
}
function captureMap(){
  if(!window.L)return null;
  if(window.__kpMap)return window.__kpMap;
  if(L.Map&&Array.isArray(L.Map._maps)&&L.Map._maps.length){window.__kpMap=L.Map._maps[0];return window.__kpMap;}
  if(L.Map&&Array.isArray(L.Map._instances)&&L.Map._instances.length){window.__kpMap=L.Map._instances[0];return window.__kpMap;}
  if(window.__kpMapCaptureInstalled)return null;
  window.__kpMapCaptureInstalled=true;
  var sv=L.Map.prototype.setView,fl=L.Map.prototype.flyTo,rl=L.Map.prototype.removeLayer;
  L.Map.prototype.setView=function(){window.__kpMap=this;return sv.apply(this,arguments);};
  L.Map.prototype.flyTo=function(){window.__kpMap=this;return fl.apply(this,arguments);};
  L.Map.prototype.removeLayer=function(layer){window.__kpMap=this;return rl.call(this,layer);};
  return window.__kpMap||null;
}
function getMap(){return window.__kpMap||captureMap();}
function isTopo(){var r=document.querySelector('input[name="base"]:checked');return !!(r&&r.value==='topo');}
function removeOldTopo(m){
  Object.keys(m._layers||{}).forEach(function(id){
    var lyr=m._layers[id],u=lyr&&lyr._url||'';
    if(u.indexOf('/topographic/')>=0||u.indexOf('/topo-raster/')>=0){try{m.removeLayer(lyr);}catch(e){}}
  });
}
function enhanceContours(gl){
  if(!gl||!gl.getStyle)return;
  try{(gl.getStyle().layers||[]).forEach(function(layer){
    if(layer.type!=='line'||String(layer['source-layer']||'').toLowerCase()!=='contours')return;
    try{
      gl.setPaintProperty(layer.id,'line-color','#8b5a2b');
      gl.setPaintProperty(layer.id,'line-opacity',0.9);
      gl.setPaintProperty(layer.id,'line-width',['interpolate',['linear'],['zoom'],9,0.8,11,1.15,13,1.5,15,2,18,2.4,22,2.8]);
    }catch(e){}
  });}catch(e){console.warn('Contour enhancement:',e);}
}
function addTopo(){
  var m=getMap();if(!m||!isTopo())return;
  var key=localStorage.getItem('kp_linz_key')||'',status=document.getElementById('mapStatus');
  if(!key){if(status)status.textContent='Enter and save your LINZ API key to use Topographic.';return;}
  loadCss('https://unpkg.com/maplibre-gl@4.5.0/dist/maplibre-gl.css');
  function finish(){
    if(!window.L.maplibreGL||!isTopo())return;
    removeOldTopo(m);
    if(window.__kpTopoGL){try{m.removeLayer(window.__kpTopoGL);}catch(e){}window.__kpTopoGL=null;}
    var style='https://basemaps.linz.govt.nz/v1/styles/topographic-v2.json?api='+encodeURIComponent(key);
    var glLayer=L.maplibreGL({style:style,attribution:'© Toitū Te Whenua LINZ CC BY 4.0'});
    window.__kpTopoGL=glLayer;glLayer.addTo(m);
    var gl=glLayer.getMaplibreMap?glLayer.getMaplibreMap():glLayer._glMap;
    if(gl){try{gl.setMaxZoom(22);}catch(e){}
      gl.on('load',function(){enhanceContours(gl);if(status)status.textContent='LINZ Topographic vector map loaded • contours sharp at deep zoom.';});
      gl.on('styledata',function(){setTimeout(function(){enhanceContours(gl);},40);});
    }
    if(status)status.textContent='Loading LINZ Topographic vector map…';
  }
  if(window.maplibregl&&window.L.maplibreGL)finish();
  else loadScript('https://unpkg.com/maplibre-gl@4.5.0/dist/maplibre-gl.js',function(){
    loadScript('https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.0.20/leaflet-maplibre-gl.js',finish);
  });
}
function removeTopo(){var m=getMap();if(window.__kpTopoGL&&m){try{m.removeLayer(window.__kpTopoGL);}catch(e){}window.__kpTopoGL=null;}}
function polish(){
  if(document.getElementById('kp-map-polish-css'))return;
  var css=document.createElement('style');css.id='kp-map-polish-css';css.textContent=''
   +'.label{font-weight:800!important;text-shadow:0 1px 3px #fff,0 -1px 3px #fff,1px 0 3px #fff,-1px 0 3px #fff!important}'
   +'.leaflet-control-attribution{font-size:9px!important;background:rgba(255,255,255,.75)!important}'
   +'.leaflet-popup-content-wrapper{border-radius:14px!important}'
   +'.leaflet-popup-content{margin:13px!important}';
  document.head.appendChild(css);
}
function boot(){
  captureMap();polish();
  var radios=document.querySelectorAll('input[name="base"]');
  if(!radios.length){setTimeout(boot,250);return;}
  if(window.__kpTopoCoreBooted)return;window.__kpTopoCoreBooted=true;
  radios.forEach(function(r){r.addEventListener('change',function(){if(r.checked&&r.value==='topo')addTopo();else if(r.checked)removeTopo();});});
  var save=document.getElementById('saveKey');if(save)save.addEventListener('click',function(){if(isTopo())setTimeout(addTopo,60);});
  setTimeout(function(){if(isTopo())addTopo();},400);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
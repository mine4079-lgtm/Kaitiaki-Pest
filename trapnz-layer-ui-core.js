(function(){
'use strict';
/* Kaitiaki Pest — Trap.NZ-style filter polish, GPS and map visual polish. */
function text(v){return v===null||v===undefined?'':String(v).trim();}
function monitoringTypeFromFeature(feature){
  var p=(feature&&feature.properties)||{};
  var keys=['monitoring_type','monitoringType','monitoring type','type','site_type','siteType','monitoring_method','monitoringMethod','method','equipment','device_type','deviceType','sensor_type','sensorType'];
  var vals=[];
  keys.forEach(function(k){if(p[k]!==undefined&&p[k]!==null&&text(p[k]))vals.push(text(p[k]));});
  var blob=(vals.length?vals:Object.keys(p).map(function(k){return text(p[k]);}).filter(Boolean)).join(' | ').toLowerCase();
  if(/\bbird[\s_-]*count\b|\bbirdcount\b/.test(blob))return 'Bird Count';
  if(/\bcamera\b|trail[\s_-]*cam|camera[\s_-]*trap|\bcameratrap\b/.test(blob))return 'Camera';
  if(/tracking[\s_-]*tunnel|trackingtunnel/.test(blob))return 'Tracking tunnel';
  if(/wax[\s_-]*block|waxblock/.test(blob))return 'Wax block';
  if(/wax[\s_-]*tag|waxtag/.test(blob))return 'Wax tags';
  return vals[0]||null;
}
var nativeFetch=window.fetch;
if(nativeFetch&&!window.__kpMonitoringFetchFixV3){
  window.__kpMonitoringFetchFixV3=true;
  window.fetch=function(input,init){return nativeFetch.call(this,input,init).then(function(response){
    try{
      var url=typeof input==='string'?input:(input&&input.url)||'';
      if(url.indexOf('default-project-monitoring-stations')<0)return response;
      return response.clone().json().then(function(json){
        if(json&&Array.isArray(json.features))json.features.forEach(function(f){var mt=monitoringTypeFromFeature(f);if(mt){f.properties=f.properties||{};f.properties.monitoring_type=mt;f.properties.monitoringType=mt;f.properties.type=mt;}});
        return new Response(JSON.stringify(json),{status:response.status,statusText:response.statusText,headers:response.headers});
      }).catch(function(){return response;});
    }catch(e){return response;}
  });};
}
function addMapPolish(){
  if(document.getElementById('kp-map-polish-css'))return;
  var css=document.createElement('style');css.id='kp-map-polish-css';css.textContent=''
  +'.top{top:10px!important;left:10px!important;right:10px!important;align-items:center} '
  +'.pill{border-radius:18px!important;padding:10px 15px!important;font-size:15px!important;line-height:1.15!important;box-shadow:0 4px 18px rgba(0,0,0,.20)!important;backdrop-filter:blur(5px)} '
  +'.actions{gap:8px!important} '
  +'.top .btn,.right .btn{width:52px!important;height:52px!important;min-width:52px!important;border-radius:15px!important;background:rgba(255,255,255,.96)!important;box-shadow:0 4px 16px rgba(0,0,0,.20)!important;font-weight:500!important} '
  +'.top .btn:first-child{font-size:0!important} '
  +'.top .btn:first-child:after{content:"☰";font-size:25px} '
  +'.top .btn:last-child{font-size:25px!important} '
  +'.right{top:76px!important;right:10px!important;gap:8px!important} '
  +'.right .btn{font-size:28px!important} '
  +'.right .btn:last-child{font-size:31px!important} '
  +'.gps{width:62px!important;height:62px!important;bottom:83px!important;border:1px solid rgba(0,0,0,.08)!important;box-shadow:0 4px 18px rgba(0,0,0,.22)!important;font-size:29px!important} '
  +'.gps.kp-gps-active{background:#0d594b!important;color:#fff!important} '
  +'.status{bottom:84px!important;border-radius:13px!important;padding:8px 12px!important;background:rgba(255,255,255,.94)!important;box-shadow:0 3px 14px rgba(0,0,0,.16)!important} '
  +'.bottom{height:76px!important;box-shadow:0 -4px 18px rgba(0,0,0,.16)!important} '
  +'.bottom button{font-size:12px!important;line-height:1.25!important} '
  +'.bottom .active{background:#0d594b!important} '
  +'.leaflet-control-zoom{border:0!important;box-shadow:none!important;margin-right:10px!important;margin-top:76px!important} '
  +'.leaflet-control-zoom a{width:52px!important;height:52px!important;line-height:50px!important;border:0!important;margin-bottom:8px!important;border-radius:15px!important;background:rgba(255,255,255,.96)!important;box-shadow:0 4px 16px rgba(0,0,0,.20)!important;color:#111!important;font-size:28px!important} '
  +'.leaflet-control-attribution{font-size:9px!important;background:rgba(255,255,255,.72)!important;border-radius:8px 0 0 0!important;padding:2px 5px!important} '
  +'.label{font-size:11px!important;font-weight:800!important;color:#17202a!important;text-shadow:0 1px 3px #fff,0 -1px 3px #fff,1px 0 3px #fff,-1px 0 3px #fff!important} '
  +'.leaflet-popup-content-wrapper{border-radius:14px!important;box-shadow:0 6px 24px rgba(0,0,0,.22)!important} '
  +'.leaflet-popup-content{margin:13px!important} '
  +'.popup h3{margin:0 0 10px!important;font-size:18px!important} '
  +'.kp-brand{position:absolute;left:12px;top:76px;z-index:900;background:rgba(255,255,255,.90);border-radius:13px;padding:6px 10px;font-weight:800;font-size:12px;box-shadow:0 3px 12px rgba(0,0,0,.14);pointer-events:none} '
  +'@media(max-width:600px){.kp-brand{top:72px}.pill{max-width:calc(100vw - 135px);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.right{top:136px!important}.leaflet-control-zoom{display:none}}';
  document.head.appendChild(css);
}
function installProjectViewFix(){
  if(window.__kpProjectViewFix||!window.L)return;
  window.__kpProjectViewFix=true;
  var originalFit=L.Map.prototype.fitBounds;
  var originalSet=L.Map.prototype.setView;
  function saneBounds(){return L.latLngBounds([[-38.12,176.90],[-37.86,177.25]]);}
  L.Map.prototype.setView=function(center,zoom,options){
    if(center&&Array.isArray(center)&&zoom!==undefined&&zoom<5){
      var lat=+center[0],lng=+center[1];
      if(!isFinite(lat)||!isFinite(lng)||Math.abs(lat)>80||Math.abs(lng)>180){center=[-37.99,177.04];zoom=12;}
      else if(Math.abs(lat)<10||Math.abs(lng)<20){center=[-37.99,177.04];zoom=12;}
    }
    return originalSet.call(this,center,zoom,options);
  };
  L.Map.prototype.fitBounds=function(bounds,options){
    if(bounds&&bounds.getSouthWest&&bounds.getNorthEast){
      var sw=bounds.getSouthWest(),ne=bounds.getNorthEast();
      var spanLat=Math.abs(ne.lat-sw.lat),spanLon=Math.abs(ne.lng-sw.lng);
      var looksGlobal=spanLat>2||spanLon>2||sw.lat<-40||ne.lat>-35||sw.lng<175||ne.lng>179;
      if(looksGlobal){bounds=saneBounds();options=Object.assign({},options||{},{padding:[35,90],maxZoom:13,animate:false});}
    }
    return originalFit.call(this,bounds,options);
  };
}
function addBrand(){
  if(document.getElementById('kp-brand'))return;
  var b=document.createElement('div');b.id='kp-brand';b.className='kp-brand';b.textContent='Korehāhā Whakahau';document.body.appendChild(b);
}
function installGPS(){
  if(window.__kpGpsInstalled||!window.L)return;
  var btn=document.getElementById('gps');if(!btn)return;
  window.__kpGpsInstalled=true;
  var userMarker=null,accuracyCircle=null,watchId=null;
  var originalFlyTo=L.Map.prototype.flyTo;
  if(!window.__kpMapCaptureInstalled){window.__kpMapCaptureInstalled=true;L.Map.prototype.flyTo=function(){window.__kpMap=this;return originalFlyTo.apply(this,arguments);};}
  var originalSetView=L.Map.prototype.setView;
  if(!window.__kpMapCaptureSetView){window.__kpMapCaptureSetView=true;L.Map.prototype.setView=function(){window.__kpMap=this;return originalSetView.apply(this,arguments);};}
  function getMap(){return window.__kpMap||null;}
  function showPosition(pos){
    var lat=pos.coords.latitude,lon=pos.coords.longitude,acc=pos.coords.accuracy||0,m=getMap();
    if(!m){setTimeout(function(){showPosition(pos)},100);return;}
    btn.classList.add('kp-gps-active');
    if(!userMarker){userMarker=L.circleMarker([lat,lon],{radius:9,color:'#fff',weight:3,fillColor:'#1976d2',fillOpacity:1,zIndexOffset:10000}).addTo(m);userMarker.bindTooltip('Your location',{permanent:false,direction:'top'});}else userMarker.setLatLng([lat,lon]);
    if(!accuracyCircle)accuracyCircle=L.circle([lat,lon],{radius:acc,color:'#1976d2',weight:1,fillColor:'#1976d2',fillOpacity:.12,interactive:false}).addTo(m);else accuracyCircle.setLatLng([lat,lon]).setRadius(acc);
    m.flyTo([lat,lon],Math.max(16,m.getZoom()),{animate:false});
    var status=document.getElementById('status');if(status)status.textContent='GPS location found • accuracy '+Math.round(acc)+' m';
  }
  function fail(err){var status=document.getElementById('status');if(status)status.textContent=err&&err.code===1?'Location permission denied — allow location for this site.':'Unable to get GPS location.';}
  btn.addEventListener('click',function(){if(!navigator.geolocation){fail({code:2});return;}navigator.geolocation.getCurrentPosition(showPosition,fail,{enableHighAccuracy:true,maximumAge:5000,timeout:15000});if(watchId===null)watchId=navigator.geolocation.watchPosition(showPosition,fail,{enableHighAccuracy:true,maximumAge:5000,timeout:20000});});
}
function loadScript(src,done){
  var s=document.querySelector('script[data-kp-src="'+src+'"]');
  if(s){if(s.dataset.loaded==='1')done();else s.addEventListener('load',done,{once:true});return;}
  s=document.createElement('script');s.src=src;s.async=true;s.dataset.kpSrc=src;s.onload=function(){s.dataset.loaded='1';done();};s.onerror=function(){console.error('Kaitiaki Pest: failed to load '+src);};document.head.appendChild(s);
}
function loadCss(href){if(document.querySelector('link[data-kp-href="'+href+'"]'))return;var l=document.createElement('link');l.rel='stylesheet';l.href=href;l.dataset.kpHref=href;document.head.appendChild(l);}
function removeTopoTileLayers(){
  if(!window.__kpMap||!window.L)return;
  Object.keys(window.__kpMap._layers||{}).forEach(function(id){var lyr=window.__kpMap._layers[id];if(lyr&&lyr._url&&lyr._url.indexOf('/topographic/')>=0){window.__kpMap.removeLayer(lyr);}});
}
function installTopoBasemap(){
  if(window.__kpTopoInstalled||!window.L)return;
  var radios=document.querySelectorAll('input[name="base"]');if(!radios.length)return;
  window.__kpTopoInstalled=true;
  if(!window.__kpTopoMapCapture){
    window.__kpTopoMapCapture=true;
    var kpOriginalRemoveLayer=L.Map.prototype.removeLayer;
    L.Map.prototype.removeLayer=function(layer){window.__kpMap=this;return kpOriginalRemoveLayer.call(this,layer);};
  }
  loadCss('https://unpkg.com/maplibre-gl@4.5.0/dist/maplibre-gl.css');
  function ensure(callback){
    if(window.maplibregl&&window.L.maplibreGL){callback();return;}
    loadScript('https://unpkg.com/maplibre-gl@4.5.0/dist/maplibre-gl.js',function(){
      loadScript('https://unpkg.com/@maplibre/maplibre-gl-leaflet@0.0.20/leaflet-maplibre-gl.js',callback);
    });
  }
  function currentTopo(){var r=document.querySelector('input[name="base"]:checked');return r&&r.value==='topo';}
  function addTopo(){
    var m=window.__kpMap;if(!m||!currentTopo())return;
    var key=localStorage.getItem('kp_linz_key')||'';
    if(!key){var st=document.getElementById('mapStatus');if(st)st.textContent='Enter and save your LINZ API key to use Topographic.';return;}
    ensure(function(){
      if(!currentTopo())return;
      removeTopoTileLayers();
      if(window.__kpTopoGL){try{m.removeLayer(window.__kpTopoGL);}catch(e){}window.__kpTopoGL=null;}
      var style='https://basemaps.linz.govt.nz/v1/tiles/topographic/EPSG:3857/style/topographic.json?api='+encodeURIComponent(key);
      window.__kpTopoGL=L.maplibreGL({style:style,attribution:'© LINZ'}).addTo(m);
      var st=document.getElementById('mapStatus');if(st)st.textContent='LINZ Topographic map loaded.';
    });
  }
  function removeTopo(){if(window.__kpTopoGL&&window.__kpMap){try{window.__kpMap.removeLayer(window.__kpTopoGL);}catch(e){}window.__kpTopoGL=null;}}
  radios.forEach(function(r){r.addEventListener('change',function(){if(r.value==='topo')addTopo();else removeTopo();});});
  var save=document.getElementById('saveKey');if(save)save.addEventListener('click',function(){if(currentTopo())addTopo();});
  setTimeout(function(){if(currentTopo())addTopo();},500);
}
/* Display-view improvement: make Trap.NZ points easier to see before deep zoom.
   The data, colours and click behaviour stay unchanged. Only the rendered point
   radius is increased at overview zoom levels. */
function installDisplayView(){
  if(window.__kpDisplayViewInstalled||!window.L)return;
  window.__kpDisplayViewInstalled=true;
  var original=L.Canvas&&L.Canvas.prototype._updateCircle;
  if(!original)return;
  L.Canvas.prototype._updateCircle=function(layer){
    var m=this._map,z=m?m.getZoom():15,base=layer&&layer.options?+layer.options.radius:5;
    var r=base;
    if(z<11)r=Math.max(base,4.5);
    else if(z<13)r=Math.max(base,6);
    else if(z<15)r=Math.max(base,6.5);
    else r=base;
    var old=layer.options.radius;layer.options.radius=r;
    try{return original.call(this,layer);}finally{layer.options.radius=old;}
  };
}
function boot(){
  var drawer=document.getElementById('drawer');if(!drawer){setTimeout(boot,250);return;}
  addMapPolish();installProjectViewFix();addBrand();installTopoBasemap();
  if(!document.getElementById('kp-filter-polish-css')){
    var css=document.createElement('style');css.id='kp-filter-polish-css';css.textContent=''
    +'.drawer .layer{border-top:1px solid #ccc;padding:0 0 2px}'+'.drawer .layerhead{min-height:58px}'+'.drawer .layerhead .types,.drawer .group .types{font-weight:500;white-space:nowrap}'+'.drawer .layerbody{background:#eee}'+'.drawer .group .head{background:#eee}'+'.drawer .group .body{background:#eee}'+'.drawer .row.all{background:#eee;font-weight:650}'+'.drawer .row.child{background:#fff}'+'.drawer .row input{accent-color:#111}'+'.drawer .group.open>.body,.drawer .layer.open>.layerbody{display:block}'+'.drawer .types:focus,.drawer .switch:focus,.drawer .row input:focus{outline:2px solid #0d594b;outline-offset:2px}';
    document.head.appendChild(css);
  }
  function toggleBody(button,body,owner){if(!body)return;var open=body.style.display==='block';body.style.display=open?'none':'block';if(owner)owner.classList.toggle('open',!open);button.textContent=open?'Show types':'Hide types';}
  if(!drawer.dataset.kpTypesBound){drawer.dataset.kpTypesBound='1';drawer.addEventListener('click',function(e){var b=e.target.closest('.layerhead .types');if(b&&drawer.contains(b)){e.preventDefault();e.stopPropagation();var layer=b.closest('.layer');toggleBody(b,layer&&layer.querySelector('.layerbody'),layer);return;}var sb=e.target.closest('.group .head .types');if(sb&&drawer.contains(sb)){e.preventDefault();e.stopPropagation();var group=sb.closest('.group');toggleBody(sb,group&&group.querySelector('.body'),group);}},true);}
  var statusHead=drawer.querySelector('.group[data-kind="status"] .head span');if(statusHead)statusHead.textContent='Trap status';
  var monHead=drawer.querySelector('.group[data-kind="mon"] .head span');if(monHead)monHead.textContent='Monitoring types';
  installDisplayView();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
var gpsTimer=setInterval(function(){if(document.getElementById('gps')&&window.L){clearInterval(gpsTimer);installGPS();}},250);
var viewTimer=setInterval(function(){if(!window.L)return;var m=window.__kpMap;if(m&&m.getZoom()<8)m.setView([-37.99,177.04],12,{animate:false});},500);
setTimeout(function(){clearInterval(viewTimer);},10000);
})();

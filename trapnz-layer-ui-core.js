(function(){
'use strict';
/* Kaitiaki Pest — startup/location fix. */
function captureMap(){
  if(!window.L)return null;
  if(window.__kpMap)return window.__kpMap;
  if(L.Map&&Array.isArray(L.Map._maps)&&L.Map._maps.length){window.__kpMap=L.Map._maps[0];return window.__kpMap;}
  if(L.Map&&Array.isArray(L.Map._instances)&&L.Map._instances.length){window.__kpMap=L.Map._instances[0];return window.__kpMap;}
  if(window.__kpMapCaptureInstalled)return null;
  window.__kpMapCaptureInstalled=true;
  var sv=L.Map.prototype.setView,fl=L.Map.prototype.flyTo;
  L.Map.prototype.setView=function(){window.__kpMap=this;return sv.apply(this,arguments);};
  L.Map.prototype.flyTo=function(){window.__kpMap=this;return fl.apply(this,arguments);};
  return null;
}
function getMap(){return window.__kpMap||captureMap();}
function addPolish(){
  if(document.getElementById('kp-map-polish-css'))return;
  var css=document.createElement('style');css.id='kp-map-polish-css';
  css.textContent='.label{font-weight:800!important;text-shadow:0 1px 3px #fff,0 -1px 3px #fff,1px 0 3px #fff,-1px 0 3px #fff!important}.leaflet-control-attribution{font-size:9px!important;background:rgba(255,255,255,.75)!important}.leaflet-popup-content-wrapper{border-radius:14px!important}.leaflet-popup-content{margin:13px!important}';
  document.head.appendChild(css);
}
function setStatus(t){var s=document.getElementById('status');if(s)s.textContent=t;}
function addGps(m){
  var b=document.getElementById('gps');
  if(!b||b.__kpGpsStartup)return;
  b.__kpGpsStartup=true;
  var marker=null,accuracy=null;
  function locate(centre){
    if(!navigator.geolocation){setStatus('Location is not available on this device.');return;}
    setStatus('Finding your location…');
    navigator.geolocation.getCurrentPosition(function(p){
      var ll=[p.coords.latitude,p.coords.longitude];
      if(marker)m.removeLayer(marker);
      if(accuracy)m.removeLayer(accuracy);
      accuracy=L.circle(ll,{radius:Math.max(5,p.coords.accuracy||10),color:'#2563eb',weight:2,fillOpacity:.12});
      marker=L.circleMarker(ll,{radius:9,color:'#fff',weight:3,fillColor:'#2563eb',fillOpacity:1});
      accuracy.addTo(m);marker.addTo(m);
      if(centre)m.setView(ll,16,{animate:false});
      setStatus('Your location • GPS accuracy '+Math.round(p.coords.accuracy||0)+' m');
    },function(err){
      if(err&&err.code===1)setStatus('Location permission was denied. Allow location for this site.');
      else setStatus('Map ready — GPS location unavailable.');
    },{enableHighAccuracy:true,maximumAge:30000,timeout:12000});
  }
  b.onclick=function(){locate(true);};
  setTimeout(function(){locate(true);},900);
}
function startup(){
  var m=getMap();
  if(!m){setTimeout(startup,200);return;}
  addPolish();
  if(!m.__kpStartupLocation){
    m.__kpStartupLocation=true;
    try{m.setView([-37.99,177.04],13,{animate:false});}catch(e){}
  }
  addGps(m);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startup);else startup();
})();
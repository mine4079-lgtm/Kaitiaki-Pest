(function(){
'use strict';
/* Kaitiaki Pest — Trap.NZ-style filter polish + robust monitoring type normalisation. */
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
if(nativeFetch&&!window.__kpMonitoringFetchFixV2){
  window.__kpMonitoringFetchFixV2=true;
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
function boot(){
  var drawer=document.getElementById('drawer');
  if(!drawer){setTimeout(boot,250);return;}
  if(!document.getElementById('kp-filter-polish-css')){var css=document.createElement('style');css.id='kp-filter-polish-css';css.textContent=''+'.drawer .layer{border-top:1px solid #ccc;padding:0 0 2px}'+'.drawer .layerhead{min-height:58px}'+'.drawer .layerhead .types,.drawer .group .types{font-weight:500;white-space:nowrap}'+'.drawer .layerbody{background:#eee}'+'.drawer .group .head{background:#eee}'+'.drawer .group .body{background:#eee}'+'.drawer .row.all{background:#eee;font-weight:650}'+'.drawer .row.child{background:#fff}'+'.drawer .row input{accent-color:#111}'+'.drawer .group.open>.body,.drawer .layer.open>.layerbody{display:block}'+'.drawer .types:focus,.drawer .switch:focus,.drawer .row input:focus{outline:2px solid #0d594b;outline-offset:2px}';document.head.appendChild(css);}
  function toggleBody(button,body,owner){if(!body)return;var open=body.style.display==='block';body.style.display=open?'none':'block';if(owner)owner.classList.toggle('open',!open);button.textContent=open?'Show types':'Hide types';}
  if(!drawer.dataset.kpTypesBound){drawer.dataset.kpTypesBound='1';drawer.addEventListener('click',function(e){var b=e.target.closest('.layerhead .types');if(b&&drawer.contains(b)){e.preventDefault();e.stopPropagation();var layer=b.closest('.layer');toggleBody(b,layer&&layer.querySelector('.layerbody'),layer);return;}var sb=e.target.closest('.group .head .types');if(sb&&drawer.contains(sb)){e.preventDefault();e.stopPropagation();var group=sb.closest('.group');toggleBody(sb,group&&group.querySelector('.body'),group);}},true);}
  var statusHead=drawer.querySelector('.group[data-kind="status"] .head span');if(statusHead)statusHead.textContent='Trap status';
  var monHead=drawer.querySelector('.group[data-kind="mon"] .head span');if(monHead)monHead.textContent='Monitoring types';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

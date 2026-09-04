(function(){
'use strict';
/* Kaitiaki Pest — Trap.NZ-style filter polish/fix.
   The main map owns the actual filter state/rendering. This file only improves
   the filter UI and keeps the nested Show types controls reliable. */
function boot(){
  var drawer=document.getElementById('drawer');
  if(!drawer){setTimeout(boot,250);return;}

  if(!document.getElementById('kp-filter-polish-css')){
    var css=document.createElement('style');
    css.id='kp-filter-polish-css';
    css.textContent=''
      +'.drawer .layer{border-top:1px solid #ccc;padding:0 0 2px}'
      +'.drawer .layerhead{min-height:58px}'
      +'.drawer .layerhead .types,.drawer .group .types{font-weight:500;white-space:nowrap}'
      +'.drawer .layerbody{background:#eee}'
      +'.drawer .group .head{background:#eee}'
      +'.drawer .group .body{background:#eee}'
      +'.drawer .row.all{background:#eee;font-weight:650}'
      +'.drawer .row.child{background:#fff}'
      +'.drawer .row input{accent-color:#111}'
      +'.drawer .group.open>.body,.drawer .layer.open>.layerbody{display:block}'
      +'.drawer .types:focus,.drawer .switch:focus,.drawer .row input:focus{outline:2px solid #0d594b;outline-offset:2px}';
    document.head.appendChild(css);
  }

  function toggleBody(button, body, owner){
    if(!body)return;
    var open=body.style.display==='block';
    body.style.display=open?'none':'block';
    if(owner)owner.classList.toggle('open',!open);
    button.textContent=open?'Show types':'Hide types';
  }

  // Re-bind the top-level Show types buttons with one delegated handler.
  // This avoids taps being lost when the filter rows are rebuilt after sync.
  if(!drawer.dataset.kpTypesBound){
    drawer.dataset.kpTypesBound='1';
    drawer.addEventListener('click',function(e){
      var b=e.target.closest('.layerhead .types');
      if(b && drawer.contains(b)){
        e.preventDefault();e.stopPropagation();
        var layer=b.closest('.layer');
        toggleBody(b,layer&&layer.querySelector(':scope > .layerbody'),layer);
        return;
      }
      var sb=e.target.closest('.group .head .types');
      if(sb && drawer.contains(sb)){
        e.preventDefault();e.stopPropagation();
        var group=sb.closest('.group');
        toggleBody(sb,group&&group.querySelector(':scope > .body'),group);
      }
    },true);
  }

  // Make sure the requested Trap.NZ-style status choices are always labelled clearly.
  var statusHead=drawer.querySelector('.group[data-kind="status"] .head span');
  if(statusHead)statusHead.textContent='Trap status';

  // The main index builds these from live Trap.NZ data. If the monitoring data
  // contains wax-tag or camera information, monType() already normalises them
  // to the two names below. We deliberately do not fabricate options when the
  // data does not contain them.
  var monHead=drawer.querySelector('.group[data-kind="mon"] .head span');
  if(monHead)monHead.textContent='Monitoring types';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();

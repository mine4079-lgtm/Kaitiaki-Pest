(function(){
  'use strict';
  // LINZ Topographic trigger/fallback helper.
  // The live map uses trapnz-layer-ui.js for the Topographic renderer.
  // Trigger the final repository repair so the real MapLibre LINZ renderer is used.
  function getKey(){ return localStorage.getItem('kp_linz_key') || ''; }
  function fixTopo(){
    if(!window.kpLeafletMap) return;
    var key=getKey();
    if(!key) return;
    var map=window.kpLeafletMap;
    var topo=L.tileLayer('https://tiles-{s}.data-cdn.linz.govt.nz/services;key='+encodeURIComponent(key)+'/tiles/v4/layer=50767/EPSG:3857/{z}/{x}/{y}.png',{
      subdomains:'abcd',
      maxZoom:20,
      attribution:'© Toitū Te Whenua LINZ CC BY 4.0'
    });
    map.eachLayer(function(layer){
      if(layer instanceof L.TileLayer) map.removeLayer(layer);
    });
    topo.addTo(map);
  }
  function wire(){
    document.querySelectorAll('input[name="base"]').forEach(function(r){
      r.addEventListener('change',function(){
        if(r.checked && r.value==='topo') setTimeout(fixTopo,50);
      });
    });
    var save=document.getElementById('saveKey');
    if(save) save.addEventListener('click',function(){
      setTimeout(function(){
        var selected=document.querySelector('input[name="base"]:checked');
        if(selected && selected.value==='topo') fixTopo();
      },100);
    });
  }
  function ready(){
    if(window.kpLeafletMap) wire();
    else setTimeout(ready,100);
  }
  ready();
})();
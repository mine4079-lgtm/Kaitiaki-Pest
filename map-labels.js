/* Kaitiaki-Pest map labels v1 */
(function(){
  function addLabels(){
    if(!window.map || !window.map.isStyleLoaded() || !window.map.getSource('kp')) return false;
    const m=window.map;
    const add=(id,layer)=>{if(!m.getLayer(id))m.addLayer(layer)};
    ['labels','line-labels','trap-labels','mon-labels'].forEach(id=>{if(id==='labels'&&m.getLayer(id))m.removeLayer(id)});
    add('line-labels',{id:'line-labels',type:'symbol',source:'kp',filter:['==',['get','kind'],'line'],layout:{'symbol-placement':'line','text-field':['get','name'],'text-size':['interpolate',['linear'],['zoom'],10,9,14,12,18,15],'text-offset':[0,0.6],'text-allow-overlap':false,'text-ignore-placement':false},paint:{'text-color':'#17324d','text-halo-color':'#fff','text-halo-width':2}});
    add('trap-labels',{id:'trap-labels',type:'symbol',source:'kp',filter:['==',['get','kind'],'trap'],minzoom:13,layout:{'text-field':['get','name'],'text-size':['interpolate',['linear'],['zoom'],13,9,17,12,20,14],'text-offset':[0,1.1],'text-anchor':'top','text-allow-overlap':false,'text-ignore-placement':false},paint:{'text-color':'#126b32','text-halo-color':'#fff','text-halo-width':2}});
    add('mon-labels',{id:'mon-labels',type:'symbol',source:'kp',filter:['==',['get','kind'],'monitoring'],minzoom:13,layout:{'text-field':['get','name'],'text-size':['interpolate',['linear'],['zoom'],13,9,17,12,20,14],'text-offset':[0,1.1],'text-anchor':'top','text-allow-overlap':false,'text-ignore-placement':false},paint:{'text-color':'#8a5200','text-halo-color':'#fff','text-halo-width':2}});
    addLabelToggle();
    return true;
  }
  function addLabelToggle(){
    if(document.getElementById('showLabels')) return;
    const layers=document.getElementById('showLines');
    if(!layers||!layers.parentElement)return;
    const lab=document.createElement('label');
    lab.innerHTML='<input id="showLabels" type="checkbox" checked> Labels';
    layers.parentElement.appendChild(lab);
    document.getElementById('showLabels').addEventListener('change',()=>setVisible(document.getElementById('showLabels').checked));
  }
  function setVisible(on){
    if(!window.map)return;
    ['line-labels','trap-labels','mon-labels'].forEach(id=>{if(window.map.getLayer(id))window.map.setLayoutProperty(id,'visibility',on?'visible':'none')});
  }
  const timer=setInterval(()=>{if(addLabels())clearInterval(timer)},500);
  window.KaitiakiLabels={refresh:addLabels,setVisible:setVisible};
})();
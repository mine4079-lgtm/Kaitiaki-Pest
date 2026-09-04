(function(){
  function ready(){
    var root=document.getElementById('modernFilters');
    if(!root) return;
    if(root.dataset.kpTrapnzLayers==='1') return;
    root.dataset.kpTrapnzLayers='1';
    var status=document.getElementById('trapStatus'),trapType=document.getElementById('trapType'),monType=document.getElementById('monType'),line=document.getElementById('line');
    var showTraps=document.getElementById('showTraps'),showMon=document.getElementById('showMon'),showLines=document.getElementById('showLines'),showNumbers=document.getElementById('showNumbers'),showLineNames=document.getElementById('showLineNames'),showMonNames=document.getElementById('showMonNames');
    function opts(sel){return sel?Array.from(sel.options).filter(function(o){return o.value!==''}):[]}
    function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
    function group(title,items,onChange,checked){var g=document.createElement('div');g.className='mfGroup';var h=document.createElement('div');h.className='mfHead';h.innerHTML='<span>'+esc(title)+'</span><button type="button" aria-expanded="false">Show types</button>';var b=document.createElement('div');b.className='mfBody';items.forEach(function(o){var r=document.createElement('label');r.className='mfRow';r.innerHTML='<span>'+esc(o.textContent)+'</span><input type="checkbox" '+(checked?'checked':'')+' data-value="'+esc(o.value)+'">';var cb=r.querySelector('input');cb.addEventListener('change',function(){onChange(b)});b.appendChild(r)});h.querySelector('button').onclick=function(){var open=g.classList.toggle('open');this.textContent=open?'Hide types':'Show types';this.setAttribute('aria-expanded',open?'true':'false')};g.append(h,b);return g}
    function sync(sel,b){if(!sel)return;var v=Array.from(b.querySelectorAll('input:checked')).map(function(x){return x.dataset.value}),all=Array.from(b.querySelectorAll('input')).length===v.length;sel.value=all?'':(v.length===1?v[0]:'');sel.dispatchEvent(new Event('change',{bubbles:true}))}
    function statusSync(b){var v=Array.from(b.querySelectorAll('input:checked')).map(function(x){return x.dataset.value});if(!v.length){v=['active'];b.querySelector('input[data-value="active"]').checked=true}status.value=v[0];status.dispatchEvent(new Event('change',{bubbles:true}));Array.from(b.querySelectorAll('input')).forEach(function(x){if(x.dataset.value!==v[0])x.checked=false})}
    root.innerHTML='';var t=document.createElement('div');t.className='sectionTitle';t.textContent='Layers';root.appendChild(t);
    function toggle(label,src){var r=document.createElement('label');r.className='mfToggle';r.innerHTML='<span>'+label+'</span><input class="mfSwitch" type="checkbox" '+(src&&src.checked?'checked':'')+'>';var cb=r.querySelector('input');cb.onchange=function(){if(src){src.checked=cb.checked;src.dispatchEvent(new Event('change',{bubbles:true}))}};root.appendChild(r)}
    toggle('Traps',showTraps);toggle('Monitoring Sites',showMon);toggle('Trap lines',showLines);
    var sg=group('Trap status',[{value:'active',textContent:'Active'},{value:'retired',textContent:'Retired'},{value:'disabled',textContent:'Disabled'}],statusSync,false);var first=sg.querySelector('input');if(first)first.checked=true;root.appendChild(sg);
    root.appendChild(group('Trap types',opts(trapType),function(b){sync(trapType,b)},true));
    root.appendChild(group('Trap lines',opts(line),function(b){sync(line,b)},true));
    root.appendChild(group('Monitoring Sites',opts(monType),function(b){sync(monType,b)},true));
    var d=document.createElement('div');d.className='mfQuick';function detail(label,src){var r=document.createElement('label');r.className='mfToggle';r.innerHTML='<span>'+label+'</span><input class="mfSwitch" type="checkbox" '+(src&&src.checked?'checked':'')+'>';var cb=r.querySelector('input');cb.onchange=function(){if(src){src.checked=cb.checked;src.dispatchEvent(new Event('change',{bubbles:true}))}};d.appendChild(r)}detail('Trap numbers',showNumbers);detail('Line names',showLineNames);detail('Monitoring names',showMonNames);root.appendChild(d);
    var h=document.createElement('div');h.className='hint';h.style.marginTop='10px';h.textContent='Tick a layer to show it. Open Show types to choose what appears.';root.appendChild(h);
    [status,trapType,monType,line,showTraps,showMon,showLines,showNumbers,showLineNames,showMonNames].forEach(function(el){if(el){var sec=el.closest('.section');if(sec)sec.style.display='none'}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(ready,100)});else setTimeout(ready,100);
})();
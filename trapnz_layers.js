(function(){
  function ready(){
    var root=document.getElementById('modernFilters');
    if(!root) return;
    var old=root.innerHTML;
    if(root.dataset.kpTrapnzLayers==='1') return;
    root.dataset.kpTrapnzLayers='1';

    var status=document.getElementById('trapStatus');
    var trapType=document.getElementById('trapType');
    var monType=document.getElementById('monType');
    var line=document.getElementById('line');
    var showTraps=document.getElementById('showTraps');
    var showMon=document.getElementById('showMon');
    var showLines=document.getElementById('showLines');
    var showNumbers=document.getElementById('showNumbers');
    var showLineNames=document.getElementById('showLineNames');
    var showMonNames=document.getElementById('showMonNames');

    function opts(sel){return sel?Array.from(sel.options).filter(function(o){return o.value!==''}):[]}
    function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
    function group(title, items, cls, onChange, defaultChecked){
      var g=document.createElement('div');g.className='mfGroup';
      var h=document.createElement('div');h.className='mfHead';
      h.innerHTML='<span>'+esc(title)+'</span><button type="button" aria-expanded="false">Show types</button>';
      var b=document.createElement('div');b.className='mfBody';
      if(!items.length){var e=document.createElement('div');e.className='mfRow';e.textContent='No types available';b.appendChild(e)}
      items.forEach(function(item){
        var r=document.createElement('label');r.className='mfRow';
        var checked=defaultChecked;
        r.innerHTML='<span>'+esc(item.textContent)+'</span><input type="checkbox" '+(checked?'checked':'')+' data-value="'+esc(item.value)+'">';
        var cb=r.querySelector('input');cb.addEventListener('change',function(){onChange(items,b,cb)});b.appendChild(r);
      });
      h.querySelector('button').addEventListener('click',function(){var open=g.classList.toggle('open');this.textContent=open?'Hide types':'Show types';this.setAttribute('aria-expanded',open?'true':'false')});
      g.appendChild(h);g.appendChild(b);return g;
    }
    function syncSelect(sel, body){
      if(!sel) return;
      var boxes=Array.from(body.querySelectorAll('input[type=checkbox]'));
      var selected=boxes.filter(function(x){return x.checked}).map(function(x){return x.dataset.value});
      var all=boxes.length && selected.length===boxes.length;
      sel.value=all?'':(selected.length===1?selected[0]:'');
      sel.dispatchEvent(new Event('change',{bubbles:true}));
    }
    function statusChange(items,body){
      var boxes=Array.from(body.querySelectorAll('input'));
      var selected=boxes.filter(function(x){return x.checked}).map(function(x){return x.dataset.value});
      if(status){
        if(selected.length===1) status.value=selected[0]; else if(selected.length===0) status.value=''; else status.value=selected[0];
        status.dispatchEvent(new Event('change',{bubbles:true}));
      }
      // Status is intentionally single-select: Trap.NZ treats the current trap condition as one state.
      if(selected.length>1){boxes.forEach(function(x){if(x!==this && x.checked && x.dataset.value!==selected[0])x.checked=false},boxes[0])}
    }
    function lineChange(items,body){syncSelect(line,body)}
    function trapChange(items,body){syncSelect(trapType,body)}
    function monChange(items,body){syncSelect(monType,body)}

    root.innerHTML='';
    var title=document.createElement('div');title.className='sectionTitle';title.textContent='Layers';root.appendChild(title);

    function layerToggle(label, id, source){
      var row=document.createElement('label');row.className='mfToggle';row.innerHTML='<span>'+label+'</span><input class="mfSwitch" type="checkbox" '+(source&&source.checked?'checked':'')+'>';
      var cb=row.querySelector('input');cb.addEventListener('change',function(){if(source){source.checked=cb.checked;source.dispatchEvent(new Event('change',{bubbles:true}))}});root.appendChild(row);return cb;
    }
    layerToggle('Traps','traps',showTraps);
    layerToggle('Monitoring Sites','monitoring',showMon);
    layerToggle('Trap lines','lines',showLines);

    var sgroup=group('Trap status',opts(status),'status',statusChange,false);
    var sboxes=sgroup.querySelectorAll('input');if(sboxes.length){sboxes[0].checked=true}
    root.appendChild(sgroup);
    root.appendChild(group('Trap types',opts(trapType),'trap',trapChange,true));
    root.appendChild(group('Trap lines',opts(line),'line',lineChange,true));
    root.appendChild(group('Monitoring Sites',opts(monType),'mon',monChange,true));

    var details=document.createElement('div');details.className='mfQuick';
    function detail(label,src){var row=document.createElement('label');row.className='mfToggle';row.innerHTML='<span>'+label+'</span><input class="mfSwitch" type="checkbox" '+(src&&src.checked?'checked':'')+'>';var cb=row.querySelector('input');cb.addEventListener('change',function(){if(src){src.checked=cb.checked;src.dispatchEvent(new Event('change',{bubbles:true}))}});details.appendChild(row)}
    detail('Trap numbers',showNumbers);detail('Line names',showLineNames);detail('Monitoring names',showMonNames);root.appendChild(details);
    var hint=document.createElement('div');hint.className='hint';hint.style.marginTop='10px';hint.textContent='Tick a layer to show it. Open Show types to choose what appears.';root.appendChild(hint);

    // Keep the original controls hidden but alive so the existing map filtering/render logic is reused.
    [status,trapType,monType,line,showTraps,showMon,showLines,showNumbers,showLineNames,showMonNames].forEach(function(el){if(el){var sec=el.closest('.section');if(sec)sec.style.display='none'}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){setTimeout(ready,100)});else setTimeout(ready,100);
})();
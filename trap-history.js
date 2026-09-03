/* Kaitiaki-Pest trap monitoring history UI v1 */
(function(){
  const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const val=(o,...keys)=>{for(const k of keys){if(o&&o[k]!==undefined&&o[k]!==null&&String(o[k]).trim()!=='')return o[k]}return ''};
  function codeFor(p){return String(val(p,'id','name','title','code')||'').trim()}
  function recordsFor(p){
    const code=codeFor(p).toLowerCase();
    const arr=(window.DATA&&Array.isArray(window.DATA.records))?window.DATA.records:[];
    return arr.filter(r=>String(val(r,'trap_code','trapCode','trap_id','trapId','trap_name','trapName','code','name')||'').trim().toLowerCase()===code)
      .sort((a,b)=>String(val(b,'record_date','recordDate','date','created_at')||'').localeCompare(String(val(a,'record_date','recordDate','date','created_at')||'')));
  }
  function historyHtml(p){
    const rows=recordsFor(p);
    if(!rows.length)return '<div class="history"><b>Monitoring history</b><div class="hint">No monitoring records found for this trap.</div></div>';
    return '<div class="history"><b>Monitoring history ('+rows.length+')</b>'+rows.slice(0,50).map(r=>{
      const date=val(r,'record_date','recordDate','date');
      const species=val(r,'species_caught','speciesCaught','species','catch')||'No catch';
      const status=val(r,'trap_status','trapStatus','status');
      const condition=val(r,'trap_condition','trapCondition','condition');
      const bait=val(r,'bait_at_arrival','baitArrival','bait');
      const strikes=val(r,'strikes');
      const by=val(r,'recorded_by','recordedBy','operator','user_name');
      const notes=val(r,'record_notes','recordNotes','notes');
      return '<div class="history-row"><b>'+esc(date)+'</b>'+
        (species?' <span>Catch: '+esc(species)+'</span>':'')+
        (status?' <span>Status: '+esc(status)+'</span>':'')+
        (condition?' <span>Condition: '+esc(condition)+'</span>':'')+
        (bait?' <span>Bait: '+esc(bait)+'</span>':'')+
        (strikes!==''?' <span>Strikes: '+esc(strikes)+'</span>':'')+
        (by?' <span>By: '+esc(by)+'</span>':'')+
        (notes?' <span>Notes: '+esc(notes)+'</span>':'')+'</div>';
    }).join('')+'</div>';
  }
  function bind(){
    if(!window.map||window.__kpHistoryBound)return false;
    window.__kpHistoryBound=true;
    window.map.on('click','traps',function(e){
      const p=e.features&&e.features[0]&&e.features[0].properties;
      if(!p)return;
      const trap=(window.DATA&&window.DATA.traps||[]).find(t=>String(val(t,'id','title','name')||'').trim()===String(p.id||p.name||'').trim());
      if(!trap)return;
      const code=codeFor(trap);
      const popup=document.createElement('div');
      popup.className='popup';
      popup.innerHTML='<h3>'+esc(code)+'</h3>'+
        '<div class="details">'+
        '<div class="detail"><b>Type:</b><span>'+esc(val(trap,'type'))+'</span></div>'+
        '<div class="detail"><b>Line:</b><span>'+esc(val(trap,'line','line_name','lineName')||'—')+'</span></div>'+
        '</div>'+historyHtml(trap);
      new maplibregl.Popup({maxWidth:'360px'}).setLngLat(e.lngLat).setDOMContent(popup).addTo(window.map);
    });
    return true;
  }
  const timer=setInterval(()=>{if(bind())clearInterval(timer)},500);
})();

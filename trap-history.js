/* Kaitiaki-Pest trap information popup v3
   Full Trap.NZ information + monitoring history + total possum catches.
*/
(function(){
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const val=(o,...keys)=>{for(const k of keys){if(o&&o[k]!==undefined&&o[k]!==null&&String(o[k]).trim()!=='')return o[k]}return ''};
  const label=k=>({
    date_installed:'Installed',installed_date:'Installed',installation_date:'Installed',
    installed_by:'Installed by',installer:'Installed by',device_model:'Device model',
    trap_condition:'Condition',condition:'Condition',status:'Status',is_retired:'Retired',
    retired:'Retired',bait:'Bait',bait_type:'Bait type',sensor:'Sensor',notes:'Notes',
    target_species:'Target species',serial_number:'Serial number',asset_id:'Asset ID',
    trap_id:'Trap ID',main_trap_id:'Main trap ID',nid:'NID'
  }[k]||k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()));
  const skip=new Set(['id','nid','trap_id','main_trap_id','trap_code','code','title','name','type','trap_type','line','line_name','lat','lon','latitude','longitude','geometry']);
  function recordsFor(t){
    const d=typeof DATA!=='undefined'?DATA:null,arr=d&&Array.isArray(d.records)?d.records:[];
    const codes=[t.title,t.id,t.code,t.trap_code,t.name].filter(Boolean).map(x=>String(x).trim().toLowerCase());
    return arr.filter(r=>codes.includes(String(val(r,'trap_code','trapCode','trap_id','trapId','trap_name','trapName','code','name')).trim().toLowerCase()))
      .sort((a,b)=>String(val(b,'record_date','recordDate','date','created_at')).localeCompare(String(val(a,'record_date','recordDate','date','created_at'))));
  }
  function possumCount(rows){
    return rows.reduce((total,r)=>{
      const species=String(val(r,'species_caught','speciesCaught','species','catch')).trim().toLowerCase();
      if(!species.includes('possum'))return total;
      const n=val(r,'number_caught','numberCaught','count_caught','count','quantity');
      const parsed=Number(n);
      return total+(Number.isFinite(parsed)&&parsed>0?parsed:1);
    },0);
  }
  function history(t){
    const rows=recordsFor(t);
    const possums=possumCount(rows);
    const summary='<div class="details" style="margin-top:8px"><div class="detail"><b>Possum catches:</b><span>'+possums.toLocaleString()+'</span></div></div>';
    if(!rows.length)return '<div class="history"><b>Monitoring history</b>'+summary+'<div class="hint">No monitoring records found for this trap.</div></div>';
    return '<div class="history"><b>Monitoring history ('+rows.length+')</b>'+summary+rows.slice(0,50).map(r=>{
      const date=val(r,'record_date','recordDate','date'),species=val(r,'species_caught','speciesCaught','species','catch');
      const status=val(r,'trap_status','trapStatus','status'),condition=val(r,'trap_condition','trapCondition','condition');
      const bait=val(r,'bait_at_arrival','baitArrival','bait'),strikes=val(r,'strikes'),by=val(r,'recorded_by','recordedBy','operator','user_name'),notes=val(r,'record_notes','recordNotes','notes');
      return '<div class="history-row"><b>'+esc(date)+'</b>'+(species?' <span>Catch: '+esc(species)+'</span>':'')+(status?' <span>Status: '+esc(status)+'</span>':'')+(condition?' <span>Condition: '+esc(condition)+'</span>':'')+(bait?' <span>Bait: '+esc(bait)+'</span>':'')+(strikes!==''?' <span>Strikes: '+esc(strikes)+'</span>':'')+(by?' <span>By: '+esc(by)+'</span>':'')+(notes?' <span>Notes: '+esc(notes)+'</span>':'')+'</div>';
    }).join('')+'</div>';
  }
  function popup(t,lngLat){
    const props=t.props||{}; const lat=+t.lat,lon=+t.lon;
    const rows=[]; const used=new Set();
    const add=(name,value,key)=>{if(value!==''&&value!==null&&value!==undefined){rows.push('<div class="detail"><b>'+esc(name)+':</b><span>'+esc(String(value))+'</span></div>');if(key)used.add(key)}};
    add('Type',t.type,'trap_type'); add('Line',t.line||'—','line');
    add('GPS',Number.isFinite(lat)&&Number.isFinite(lon)?lat.toFixed(6)+', '+lon.toFixed(6):'',null);
    const preferred=[
      ['Installed',val(props,'date_installed','installed_date','installation_date'),'date_installed'],
      ['Installed by',val(props,'installed_by','installer'),'installed_by'],
      ['Device model',val(props,'device_model','model'),'device_model'],
      ['Status',val(props,'status'),'status'],
      ['Condition',val(props,'trap_condition','condition'),'trap_condition'],
      ['Bait',val(props,'bait','bait_type'),'bait'],
      ['Sensor',val(props,'sensor'),'sensor'],
      ['Retired',val(props,'is_retired','retired'),'is_retired'],
      ['Notes',val(props,'notes'),'notes']
    ];
    preferred.forEach(x=>add(x[0],x[1],x[2]));
    const extras=[];
    Object.keys(props).sort().forEach(k=>{if(skip.has(k)||used.has(k)||preferred.some(x=>x[2]===k))return;const v=props[k];if(v!==undefined&&v!==null&&String(v).trim()!=='')extras.push('<div class="detail"><b>'+esc(label(k))+':</b><span>'+esc(String(v))+'</span></div>')});
    const el=document.createElement('div');el.className='popup';
    el.innerHTML='<h3>'+esc(t.title||t.id||'Trap')+'</h3><div class="details">'+rows.join('')+(extras.length?'<div style="margin-top:8px;padding-top:7px;border-top:1px solid #eee">'+extras.join('')+'</div>':'')+'</div>'+history(t)+'<button class="nav" onclick="location.href=\'https://www.google.com/maps/dir/?api=1&destination='+lat+','+lon+'\'">Navigate</button>';
    document.querySelectorAll('.maplibregl-popup').forEach(x=>x.remove());
    new maplibregl.Popup({maxWidth:'390px'}).setLngLat(lngLat).setDOMContent(el).addTo(map);
  }
  function bind(){
    if(typeof map==='undefined'||typeof DATA==='undefined'||window.__kpFullTrapPopup)return false;
    window.__kpFullTrapPopup=true;
    map.on('click','traps',e=>{const p=e.features?.[0]?.properties;if(!p)return;const t=(DATA.traps||[]).find(x=>String(x.id)===String(p.id)||String(x.title)===String(p.name));if(t)popup(t,e.lngLat)});
    return true;
  }
  const timer=setInterval(()=>{if(bind())clearInterval(timer)},300);
})();

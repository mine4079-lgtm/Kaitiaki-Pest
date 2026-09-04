(function(){
  function hiddenSelect(kind){return kind==='line'?document.getElementById('line'):kind==='trap'?document.getElementById('trapType'):document.getElementById('monType')}
  function refreshGroup(kind){
    var group=document.querySelector('.mfGroup[data-kind="'+kind+'"]'),body=group&&group.querySelector('.mfBody'),sel=hiddenSelect(kind);if(!body||!sel)return;
    if(!body.children.length){Array.prototype.slice.call(sel.options).forEach(function(o){if(!o.value)return;var row=document.createElement('label');row.className='mfRow';var span=document.createElement('span');span.textContent=o.text;var cb=document.createElement('input');cb.type='checkbox';cb.setAttribute('data-filter-value',o.value);row.appendChild(span);row.appendChild(cb);body.appendChild(row)})}
    Array.prototype.slice.call(body.querySelectorAll('input[data-filter-value]')).forEach(function(cb){cb.checked=sel.value===cb.getAttribute('data-filter-value')})
  }
  function refreshAll(){refreshGroup('line');refreshGroup('trap');refreshGroup('mon')}
  document.addEventListener('click',function(e){
    var head=e.target.closest('.mfHead button');
    if(head){var g=head.closest('.mfGroup');if(g){g.classList.toggle('open');head.textContent=g.classList.contains('open')?'Hide types':'Show types';refreshGroup(g.getAttribute('data-kind'))}e.preventDefault();return}
    var cb=e.target.closest('.mfRow input[data-filter-value]');
    if(cb){var g=cb.closest('.mfGroup'),kind=g&&g.getAttribute('data-kind'),sel=hiddenSelect(kind);if(sel){sel.value=cb.checked?cb.getAttribute('data-filter-value'):'';sel.dispatchEvent(new Event('change',{bubbles:true}))}Array.prototype.slice.call((g&&g.querySelectorAll('input[data-filter-value]'))||[]).forEach(function(x){if(x!==cb)x.checked=false});e.preventDefault()}
  },true);
  document.addEventListener('DOMContentLoaded',function(){refreshAll();setTimeout(refreshAll,500);setTimeout(refreshAll,1500);setTimeout(refreshAll,3000);setTimeout(refreshAll,6000)});
  setInterval(refreshAll,5000)
})();
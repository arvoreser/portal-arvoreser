// Evolução das regiões corporais com dor após 1 mês
(function(){
  let chart=null;
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  function regioes(v){
    const s=norm(v); if(!s)return [];
    return s.split(/[,;|\/]+/).map(x=>x.trim()).filter(Boolean);
  }
  function dados(){
    const iniciais=Array.isArray(DATA.records)?DATA.records:[];
    const reavs=Array.isArray(DATA.reavaliacao1MesRows)?DATA.reavaliacao1MesRows:[];
    const mapa=new Map(reavs.map(r=>[String(r.ID??'').trim(),r]));
    const pares=[];
    iniciais.forEach(i=>{
      const r=mapa.get(String(i.id??'').trim()); if(!r)return;
      pares.push({inicial:regioes(i.regiaoDor),mes1:regioes(r['Região da dor'])});
    });
    return {total:iniciais.length,reavaliados:reavs.filter(r=>String(r.ID??'').trim()).length,pares};
  }
  function bloco(){
    let el=document.getElementById('evolucaoRegioesSection'); if(el)return el;
    const dor=document.getElementById('evolucaoDorSection'); if(!dor)return null;
    el=document.createElement('div');el.id='evolucaoRegioesSection';el.className='section';
    el.innerHTML=`<div class="ev-reg-head"><div><h3><span class="section-dot">◈</span>Evolução das regiões corporais com dor</h3><div class="ev-reg-sub">Frequência de queixas por região corporal na avaliação inicial e após 1 mês.</div></div><div id="evRegCobertura" class="ev-reg-cobertura">—</div></div><div class="ev-reg-chartbox"><canvas id="evRegChart"></canvas></div><div id="evRegNota" class="ev-reg-nota"></div><div class="ev-reg-rodape">Um mesmo colaborador pode relatar dor em mais de uma região corporal. Por isso, a soma das ocorrências pode ser superior ao número de colaboradores reavaliados.</div>`;
    dor.insertAdjacentElement('afterend',el);
    if(!document.getElementById('evRegStyles')){const s=document.createElement('style');s.id='evRegStyles';s.textContent=`#evolucaoRegioesSection{margin-top:22px}.ev-reg-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}.ev-reg-head h3{margin:0}.ev-reg-sub{font-size:13px;color:#667085;margin-top:5px}.ev-reg-cobertura{font-size:13px;font-weight:700;color:#187900;background:#edf8ea;border:1px solid rgba(24,121,0,.18);padding:8px 12px;border-radius:999px}.ev-reg-chartbox{height:360px;position:relative}.ev-reg-nota{font-size:12px;color:#667085;margin-top:10px}.ev-reg-rodape{margin-top:14px;padding-top:12px;border-top:1px dashed rgba(24,121,0,.28);color:#667085;font-size:12px;line-height:1.55}@media(max-width:760px){.ev-reg-chartbox{height:420px}}`;document.head.appendChild(s)}
    return el;
  }
  window.renderEvolucaoRegioes1Mes=function(){
    if(!bloco())return;const d=dados();
    document.getElementById('evRegCobertura').textContent=`Reavaliados: ${d.reavaliados} de ${d.total}`;
    const canon=new Map();
    const add=(arr,campo)=>arr.forEach(nome=>{const k=norm(nome).toLowerCase();if(!k)return;if(!canon.has(k))canon.set(k,{label:nome,inicial:0,mes1:0});canon.get(k)[campo]++});
    d.pares.forEach(p=>{add([...new Set(p.inicial.map(x=>x.toLowerCase()))],'inicial');add([...new Set(p.mes1.map(x=>x.toLowerCase()))],'mes1')});
    const itens=[...canon.values()].sort((a,b)=>Math.max(b.inicial,b.mes1)-Math.max(a.inicial,a.mes1)||a.label.localeCompare(b.label,'pt-BR'));
    document.getElementById('evRegNota').textContent=`Comparativo baseado nos ${d.reavaliados} colaboradores que já responderam à reavaliação de 1 mês.`;
    if(chart)chart.destroy();
    chart=new Chart(document.getElementById('evRegChart'),{type:'bar',data:{labels:itens.map(x=>x.label),datasets:[{label:'Avaliação inicial',data:itens.map(x=>x.inicial),backgroundColor:'rgba(253,49,5,.28)',borderColor:'#fd3105',borderWidth:1,borderRadius:5},{label:'1 mês',data:itens.map(x=>x.mes1),backgroundColor:'rgba(23,250,3,.25)',borderColor:'#187900',borderWidth:1,borderRadius:5}]},options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'},tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${c.raw} colaborador(es)`}}},scales:{x:{beginAtZero:true,ticks:{precision:0}},y:{grid:{display:false}}}}});
  };
})();
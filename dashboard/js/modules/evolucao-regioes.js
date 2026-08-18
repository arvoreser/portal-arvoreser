// Evolução das regiões corporais com dor após 1 mês
(function(){
  let chart=null;
  let itensAtuais=[];

  function regioes(v){
    if(typeof regions === 'function') return regions(v);
    const s=String(v??'').trim();
    return s ? s.split(/[,;|\/]+/).map(x=>x.trim()).filter(Boolean) : [];
  }

  function normalizar(v){
    return String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  }

  function nota(v){
    const m=String(v??'').replace(',','.').match(/-?\d+(?:\.\d+)?/);
    if(!m) return 0;
    const n=Number(m[0]);
    return Number.isFinite(n) ? n : 0;
  }

  function risco(n,dor=true){
    if(n>=7) return '🔴';
    if(n>=4) return '🟠';
    if(dor) return '🟡';
    return '🟢';
  }

  function dados(){
    const iniciais=Array.isArray(DATA.records)?DATA.records:[];
    const reavs=Array.isArray(DATA.reavaliacao1MesRows)?DATA.reavaliacao1MesRows:[];
    const mapa=new Map(reavs.map(r=>[String(r.ID??'').trim(),r]));
    const pares=[];

    iniciais.forEach(i=>{
      const id=String(i.id??'').trim();
      const r=mapa.get(id);
      if(!r)return;
      pares.push({
        id,
        nome:i.nome,
        inicial:regioes(i.regiao),
        mes1:regioes(r['Região da dor']),
        notaInicial:Number(i.nota_dor_num)||0,
        notaMes1:nota(r['Nota da dor'])
      });
    });

    return {total:iniciais.length,reavaliados:reavs.filter(r=>String(r.ID??'').trim()).length,pares};
  }

  function montarItens(d){
    const canon=new Map();

    function garantir(label){
      const key=normalizar(label);
      if(!key)return null;
      if(!canon.has(key)) canon.set(key,{key,label,inicial:[],mes1:[]});
      return canon.get(key);
    }

    d.pares.forEach(p=>{
      [...new Set(p.inicial.map(x=>normalizar(x)))].forEach(key=>{
        const label=p.inicial.find(x=>normalizar(x)===key) || key;
        const item=garantir(label);
        if(item) item.inicial.push({id:p.id,nome:p.nome,nota:p.notaInicial});
      });
      [...new Set(p.mes1.map(x=>normalizar(x)))].forEach(key=>{
        const label=p.mes1.find(x=>normalizar(x)===key) || key;
        const item=garantir(label);
        if(item) item.mes1.push({id:p.id,nome:p.nome,nota:p.notaMes1});
      });
    });

    return [...canon.values()].sort((a,b)=>Math.max(b.inicial.length,b.mes1.length)-Math.max(a.inicial.length,a.mes1.length)||String(a.label).localeCompare(String(b.label),'pt-BR'));
  }

  function bloco(){
    let el=document.getElementById('evolucaoRegioesSection');
    if(el)return el;

    const setorCanvas=document.getElementById('setorChart');
    const setorSection=setorCanvas ? setorCanvas.closest('.dashboard-chart-section,.section') : null;
    const grid=setorSection ? setorSection.parentElement : null;
    const executivo=grid ? grid.querySelector('.dashboard-evolution-section') : null;
    if(!grid || !setorSection)return null;

    const canvasAntigo=document.getElementById('regChart');
    if(canvasAntigo) canvasAntigo.style.display='none';

    el=document.createElement('div');
    el.id='evolucaoRegioesSection';
    el.className='section dashboard-chart-section';
    el.innerHTML=`
      <div class="ev-reg-head">
        <div>
          <h3><span class="section-dot">◈</span>Dor por região corporal</h3>
          <div class="ev-reg-sub">Avaliação inicial × reavaliação de 1 mês.</div>
        </div>
      </div>
      <div class="ev-reg-chartbox"><canvas id="evRegChart"></canvas></div>
      <div id="evRegNota" class="ev-reg-nota"></div>`;

    if(executivo) grid.insertBefore(el,executivo);
    else setorSection.insertAdjacentElement('afterend',el);

    setorSection.style.gridColumn='auto';
    el.style.gridColumn='auto';

    if(!document.getElementById('evRegStyles')){
      const s=document.createElement('style');
      s.id='evRegStyles';
      s.textContent=`
        #evolucaoRegioesSection{margin-top:0}
        .ev-reg-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:10px}
        .ev-reg-head h3{margin:0}
        .ev-reg-sub{font-size:12px;color:#667085;margin-top:4px}
        .ev-reg-chartbox{height:320px;position:relative}
        .ev-reg-nota{font-size:11px;color:#667085;margin-top:8px;line-height:1.45}
        .region-click-list{display:flex;flex-direction:column;gap:6px;margin-top:12px}
        .region-click-person{display:flex;align-items:center;gap:8px;border:1px solid rgba(6,64,1,.12);border-radius:9px;padding:8px 10px;background:#fff;cursor:pointer;min-height:38px}
        .region-click-person:hover{background:#f7fbf5}
        .region-click-person .risk-dot{flex:0 0 auto}
        .region-click-person .region-click-name{font-weight:600;color:#1f2937;min-width:0;font-size:13px;line-height:1.25}
        @media(max-width:760px){.ev-reg-chartbox{height:360px}}
      `;
      document.head.appendChild(s);
    }
    return el;
  }

  function abrirDetalheRegiao(index,datasetIndex){
    const item=itensAtuais[index];
    if(!item)return;
    const mes1=datasetIndex===1;
    const pessoas=(mes1?item.mes1:item.inicial).slice().sort((a,b)=>b.nota-a.nota||String(a.nome).localeCompare(String(b.nome),'pt-BR'));
    const badge=mes1
      ? '<span style="font-size:11px;font-weight:700;color:#187900;background:#edf8ea;border:1px solid rgba(24,121,0,.18);padding:5px 8px;border-radius:999px;margin-left:6px">1 mês</span>'
      : '<span style="font-size:11px;font-weight:700;color:#fd3105;background:rgba(253,49,5,.06);border:1px solid rgba(253,49,5,.18);padding:5px 8px;border-radius:999px;margin-left:6px">Inicial</span>';

    const lista=pessoas.map(p=>{
      const id=Number(p.id);
      const acao=Number.isFinite(id)?` onclick="openPersonById(${id})"`:'';
      return `<div class="region-click-person"${acao}><span class="risk-dot">${risco(p.nota,true)}</span><span class="region-click-name">${esc(p.nome)}</span></div>`;
    }).join('');

    const painel=document.getElementById('detailPanel');
    painel.style.width='min(390px,calc(100vw - 44px))';
    painel.style.padding='18px';

    document.getElementById('detailContent').innerHTML=`
      <h2 style="font-size:18px;margin-top:4px">Região: ${esc(item.label)} ${badge}</h2>
      <div class="note" style="font-size:12px">${pessoas.length} colaborador(es) com queixa nessa região.</div>
      <div class="region-click-list">${lista || '<div class="small">Sem colaboradores nesta região.</div>'}</div>`;
    painel.style.display='block';
  }

  window.renderEvolucaoRegioes1Mes=function(){
    if(!bloco())return;
    const d=dados();
    itensAtuais=montarItens(d);

    document.getElementById('evRegNota').textContent=`Comparativo com os ${d.reavaliados} colaboradores já reavaliados. Clique em uma barra para ver os nomes.`;

    if(chart)chart.destroy();
    chart=new Chart(document.getElementById('evRegChart'),{
      type:'bar',
      data:{
        labels:itensAtuais.map(x=>x.label),
        datasets:[
          {label:'Avaliação inicial',data:itensAtuais.map(x=>x.inicial.length),backgroundColor:'rgba(253,49,5,.28)',borderColor:'#fd3105',borderWidth:1,borderRadius:5},
          {label:'1 mês',data:itensAtuais.map(x=>x.mes1.length),backgroundColor:'rgba(23,250,3,.25)',borderColor:'#187900',borderWidth:1,borderRadius:5}
        ]
      },
      options:{
        indexAxis:'y',responsive:true,maintainAspectRatio:false,
        onClick:(evt,elements)=>{if(elements.length) abrirDetalheRegiao(elements[0].index,elements[0].datasetIndex);},
        plugins:{
          legend:{position:'top'},
          tooltip:{callbacks:{label:c=>`${c.dataset.label}: ${c.raw} colaborador(es)`,afterLabel:()=> 'Clique para ver os nomes'}}
        },
        scales:{x:{beginAtZero:true,ticks:{precision:0}},y:{grid:{display:false}}}
      }
    });
  };
})();
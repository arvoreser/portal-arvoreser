// Gráficos e análises do dashboard
// Este arquivo deve ser carregado depois de api.js e antes de dashboard.js.

let setorChart = null;
let regChart = null;
let evolucaoDorChart = null;

function countValues(items, field){
  const map = {};
  items.forEach(r => {
    const val = norm(r[field]);
    if(val !== 'Não informado') map[val] = (map[val] || 0) + 1;
  });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]);
}

function countRegions(items){
  const map = {};
  items.forEach(r => {
    if(String(r.tem_dor).startsWith('Sim')){
      (r.regioes_lista || []).forEach(reg => map[reg] = (map[reg] || 0) + 1);
    }
  });
  return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
}

function mediaDor(items){
  const notas = items.map(r => r.nota_dor_num).filter(n => n > 0);
  return notas.length ? (notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1) : '—';
}

function riskLabel(r){
  if(r.nota_dor_num >= 7) return '🔴';
  if(r.nota_dor_num >= 4) return '🟠';
  if(String(r.tem_dor).startsWith('Sim')) return '🟡';
  return '🟢';
}

function parseNotaDorComparativa(valor){
  const texto = String(valor ?? '').trim();
  if(!texto || texto === 'Não informado') return null;
  const match = texto.replace(',', '.').match(/-?\d+(?:\.\d+)?/);
  if(!match) return null;
  const nota = Number(match[0]);
  if(!Number.isFinite(nota) || nota < 0 || nota > 10) return null;
  return nota;
}

function obterComparativoDor1Mes(){
  const registrosIniciais = Array.isArray(DATA.records) ? DATA.records : [];
  const reavaliacoes = Array.isArray(DATA.reavaliacao1MesRows) ? DATA.reavaliacao1MesRows : [];

  const idsIniciais = new Set(
    registrosIniciais
      .map(r => String(r.id ?? '').trim())
      .filter(Boolean)
  );

  const reavPorId = new Map();
  reavaliacoes.forEach(row => {
    const id = String(row.ID ?? '').trim();
    if(id) reavPorId.set(id, row);
  });

  const idsReavaliados = [...reavPorId.keys()].filter(id => idsIniciais.has(id));
  const pares = [];

  registrosIniciais.forEach(inicial => {
    const id = String(inicial.id ?? '').trim();
    const reav = reavPorId.get(id);
    if(!reav) return;

    const notaInicial = parseNotaDorComparativa(inicial.nota_dor);
    const nota1Mes = parseNotaDorComparativa(reav['Nota da dor']);

    if(notaInicial === null || nota1Mes === null) return;

    pares.push({
      id,
      nome: inicial.nome,
      inicial: notaInicial,
      mes1: nota1Mes
    });
  });

  const media = (lista, campo) => {
    if(!lista.length) return null;
    return lista.reduce((soma, item) => soma + item[campo], 0) / lista.length;
  };

  return {
    totalColaboradores: registrosIniciais.length,
    totalReavaliados: idsReavaliados.length,
    totalComparaveis: pares.length,
    pares,
    mediaInicial: media(pares, 'inicial'),
    media1Mes: media(pares, 'mes1')
  };
}

function garantirBlocoEvolucaoDor(){
  let bloco = document.getElementById('evolucaoDorSection');
  if(bloco) return bloco;

  const setorCanvas = document.getElementById('setorChart');
  const gridGraficos = setorCanvas ? setorCanvas.closest('.dashboard-grid') : null;
  if(!gridGraficos) return null;

  if(!document.getElementById('evolucaoDorStyles')){
    const style = document.createElement('style');
    style.id = 'evolucaoDorStyles';
    style.textContent = `
      #evolucaoDorSection{margin-top:22px}
      .evolucao-dor-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}
      .evolucao-dor-head h3{margin:0}
      .evolucao-dor-sub{font-size:13px;color:#667085;margin-top:5px;line-height:1.4}
      .evolucao-dor-cobertura{font-size:13px;font-weight:700;color:#187900;background:#edf8ea;border:1px solid rgba(24,121,0,.18);padding:8px 12px;border-radius:999px}
      .evolucao-dor-metricas{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}
      .evolucao-dor-metrica{border:1px solid rgba(6,64,1,.10);background:#fff;border-radius:14px;padding:14px 16px}
      .evolucao-dor-metrica .k{font-size:12px;color:#667085;margin-bottom:5px}
      .evolucao-dor-metrica .v{font-size:25px;font-weight:800;color:#064001}
      .evolucao-dor-metrica .v.reducao{color:#187900}
      .evolucao-dor-metrica .v.aumento{color:#fd3105}
      .evolucao-dor-chartbox{height:280px;position:relative}
      .evolucao-dor-nota{font-size:12px;color:#667085;margin-top:10px}
      @media(max-width:760px){.evolucao-dor-metricas{grid-template-columns:1fr}.evolucao-dor-chartbox{height:240px}}
    `;
    document.head.appendChild(style);
  }

  bloco = document.createElement('div');
  bloco.id = 'evolucaoDorSection';
  bloco.className = 'section';
  bloco.innerHTML = `
    <div class="evolucao-dor-head">
      <div>
        <h3><span class="section-dot">◈</span>Evolução da dor</h3>
        <div class="evolucao-dor-sub">Comparação pareada entre a avaliação inicial e a reavaliação de 1 mês.</div>
      </div>
      <div id="evolucaoDorCobertura" class="evolucao-dor-cobertura">—</div>
    </div>
    <div class="evolucao-dor-metricas">
      <div class="evolucao-dor-metrica"><div class="k">Média inicial</div><div id="evolucaoDorMediaInicial" class="v">—</div></div>
      <div class="evolucao-dor-metrica"><div class="k">Média após 1 mês</div><div id="evolucaoDorMedia1Mes" class="v">—</div></div>
      <div class="evolucao-dor-metrica"><div class="k">Variação média</div><div id="evolucaoDorVariacao" class="v">—</div></div>
    </div>
    <div class="evolucao-dor-chartbox"><canvas id="evolucaoDorChart"></canvas></div>
    <div id="evolucaoDorNota" class="evolucao-dor-nota"></div>
  `;

  gridGraficos.insertAdjacentElement('afterend', bloco);
  return bloco;
}

function renderEvolucaoDor1Mes(){
  const bloco = garantirBlocoEvolucaoDor();
  if(!bloco) return;

  const comparativo = obterComparativoDor1Mes();
  const cobertura = document.getElementById('evolucaoDorCobertura');
  const inicialEl = document.getElementById('evolucaoDorMediaInicial');
  const mes1El = document.getElementById('evolucaoDorMedia1Mes');
  const variacaoEl = document.getElementById('evolucaoDorVariacao');
  const notaEl = document.getElementById('evolucaoDorNota');

  cobertura.textContent = `Reavaliados: ${comparativo.totalReavaliados} de ${comparativo.totalColaboradores}`;

  if(!comparativo.totalComparaveis || comparativo.mediaInicial === null || comparativo.media1Mes === null){
    inicialEl.textContent = '—';
    mes1El.textContent = '—';
    variacaoEl.textContent = '—';
    variacaoEl.className = 'v';
    notaEl.textContent = 'Ainda não há registros suficientes para comparar a evolução da dor.';
    if(evolucaoDorChart){ evolucaoDorChart.destroy(); evolucaoDorChart = null; }
    return;
  }

  const inicial = comparativo.mediaInicial;
  const mes1 = comparativo.media1Mes;
  const diferenca = mes1 - inicial;

  inicialEl.textContent = `${inicial.toFixed(1).replace('.', ',')}/10`;
  mes1El.textContent = `${mes1.toFixed(1).replace('.', ',')}/10`;

  if(Math.abs(diferenca) < 0.05){
    variacaoEl.textContent = 'Estável';
    variacaoEl.className = 'v';
  } else if(diferenca < 0){
    variacaoEl.textContent = `↓ ${Math.abs(diferenca).toFixed(1).replace('.', ',')} ponto(s)`;
    variacaoEl.className = 'v reducao';
  } else {
    variacaoEl.textContent = `↑ ${Math.abs(diferenca).toFixed(1).replace('.', ',')} ponto(s)`;
    variacaoEl.className = 'v aumento';
  }

  notaEl.textContent = `${comparativo.totalComparaveis} colaborador(es) com nota válida nos dois momentos. Notas 0/10 são consideradas no cálculo.`;

  if(evolucaoDorChart) evolucaoDorChart.destroy();

  evolucaoDorChart = new Chart(document.getElementById('evolucaoDorChart'), {
    type:'line',
    data:{
      labels:['Avaliação inicial','1 mês'],
      datasets:[{
        label:'Média da dor',
        data:[Number(inicial.toFixed(2)), Number(mes1.toFixed(2))],
        borderColor:'#fd3105',
        backgroundColor:'rgba(253,49,5,.10)',
        pointBackgroundColor:['#fd3105','#17fa03'],
        pointBorderColor:['#fd3105','#187900'],
        pointRadius:7,
        pointHoverRadius:9,
        borderWidth:3,
        tension:.25,
        fill:true
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      plugins:{
        legend:{display:false},
        tooltip:{callbacks:{label:(ctx)=>`Média: ${Number(ctx.raw).toFixed(1).replace('.', ',')}/10`}}
      },
      scales:{
        y:{beginAtZero:true,max:10,ticks:{stepSize:1}},
        x:{grid:{display:false}}
      }
    }
  });
}

function openRegionAnalysis(regiao){
  const items = DATA.records
    .filter(r => String(r.tem_dor).startsWith('Sim') && (r.regioes_lista || []).includes(regiao))
    .sort((a,b)=>(b.nota_dor_num||0)-(a.nota_dor_num||0));

  const people = items.map(r => `
    <div class="region-person" onclick="openPersonById(${r.id})">
      <span class="region-person-left">
        <span class="risk-dot">${riskLabel(r)}</span>
        <span class="region-person-name">${esc(r.nome)} (${esc(r.setor)})</span>
      </span>
      <strong>${r.nota_dor_num ? r.nota_dor_num + '/10' : '—'}</strong>
    </div>
  `).join('');

  document.getElementById('detailContent').innerHTML = `
    <h2>Dor na região: ${esc(regiao)}</h2>
    <div class="note">${items.length} colaborador(es)</div>
    <div class="region-people">${people}</div>
  `;
  document.getElementById('detailPanel').style.display='block';
}

function renderCountLines(entries, emptyText='Sem dados'){
  if(!entries.length) return `<div class="small">${emptyText}</div>`;
  return entries.map(([label,count]) => `<div class="sector-line"><span>${esc(label)}</span><strong>${count}</strong></div>`).join('');
}

function openSectorAnalysis(setor){
  const items = DATA.records.filter(r => r.setor === setor);
  const total = items.length;
  const comDor = items.filter(r => String(r.tem_dor).startsWith('Sim')).length;
  const semDor = total - comDor;
  const prioritarios = items.filter(r => r.nota_dor_num >= 7).length;
  const media = mediaDor(items);
  const regioes = countRegions(items);
  const sentado = countValues(items, 'tempo_sentado');
  const esforco = countValues(items, 'esforco');
  const agua = countValues(items, 'agua');
  const atividade = countValues(items, 'atividade');
  const pausas = countValues(items, 'pausas');

  const people = items
    .slice()
    .sort((a,b)=>(b.nota_dor_num||0)-(a.nota_dor_num||0))
    .map(r => `
      <div class="sector-person" onclick="openPersonById(${r.id})">
        <span><span class="risk-dot">${riskLabel(r)}</span> ${esc(r.nome)}</span>
        <strong>${r.nota_dor_num ? r.nota_dor_num + '/10' : '—'}</strong>
      </div>
    `).join('');

  document.getElementById('detailContent').innerHTML = `
    <h2>Setor: ${esc(setor)}</h2>

    <div class="sector-panel">
      <div class="sector-metric"><div class="n">${total}</div><div class="t">Colaboradores</div></div>
      <div class="sector-metric"><div class="n">${semDor}</div><div class="t">Sem dor</div></div>
      <div class="sector-metric"><div class="n">${comDor}</div><div class="t">Com dor</div></div>
      <div class="sector-metric"><div class="n">${media}</div><div class="t">Média da dor</div></div>
    </div>

    <div class="sector-grid">
      <div class="sector-box">
        <div class="sector-box-title">Regiões mais acometidas</div>
        ${renderCountLines(regioes)}
      </div>
      <div class="sector-box">
        <div class="sector-box-title">Tempo sentado</div>
        ${renderCountLines(sentado)}
      </div>
      <div class="sector-box">
        <div class="sector-box-title">Esforço físico</div>
        ${renderCountLines(esforco)}
      </div>
      <div class="sector-box">
        <div class="sector-box-title">Água</div>
        ${renderCountLines(agua)}
      </div>
      <div class="sector-box">
        <div class="sector-box-title">Atividade física</div>
        ${renderCountLines(atividade)}
      </div>
      <div class="sector-box">
        <div class="sector-box-title">Pausas</div>
        ${renderCountLines(pausas)}
      </div>
    </div>

    <h3 style="margin-top:18px">Colaboradores do setor</h3>
    <div class="sector-people">${people}</div>
  `;
  document.getElementById('detailPanel').style.display='block';
}

function respostaIndicaDor(valor){
  const v = String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g,'')
    .trim()
    .toLowerCase();
  return v === 'sim' || v.startsWith('sim ');
}

function obterDorPorSetorComparativa(){
  const iniciais = Array.isArray(DATA.records) ? DATA.records : [];
  const reavs = Array.isArray(DATA.reavaliacao1MesRows) ? DATA.reavaliacao1MesRows : [];
  const reavPorId = new Map();

  reavs.forEach(r => {
    const id = String(r.ID ?? '').trim();
    if(id) reavPorId.set(id, r);
  });

  const mapa = new Map();

  iniciais.forEach(i => {
    const id = String(i.id ?? '').trim();
    const r = reavPorId.get(id);
    if(!r) return;

    const setor = String(r['Setor'] ?? i.setor ?? '').trim() || 'Não informado';
    if(!mapa.has(setor)) mapa.set(setor, {setor, inicial:0, mes1:0, total:0});
    const item = mapa.get(setor);
    item.total++;

    if(respostaIndicaDor(i.tem_dor)) item.inicial++;
    if(respostaIndicaDor(r['Resposta original sobre dor'])) item.mes1++;
  });

  return [...mapa.values()].sort((a,b)=>{
    const maxA = Math.max(a.inicial,a.mes1);
    const maxB = Math.max(b.inicial,b.mes1);
    return maxB - maxA || a.setor.localeCompare(b.setor,'pt-BR');
  });
}

function renderCharts() {
  if(setorChart) setorChart.destroy();
  if(regChart) regChart.destroy();

  const comparativoSetores = obterDorPorSetorComparativa();

  setorChart = new Chart(document.getElementById('setorChart'), {
    type:'bar',
    data:{
      labels:comparativoSetores.map(x=>x.setor),
      datasets:[
        {
          label:'Avaliação inicial',
          data:comparativoSetores.map(x=>x.inicial),
          backgroundColor:'rgba(253,49,5,.28)',
          borderColor:'#fd3105',
          borderWidth:1,
          borderRadius:5
        },
        {
          label:'1 mês',
          data:comparativoSetores.map(x=>x.mes1),
          backgroundColor:'rgba(23,250,3,.25)',
          borderColor:'#187900',
          borderWidth:1,
          borderRadius:5
        }
      ]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      onClick:(evt,elements)=>{
        if(elements.length){
          const i=elements[0].index;
          openSectorAnalysis(comparativoSetores[i].setor);
        }
      },
      plugins:{
        legend:{display:true,position:'top'},
        tooltip:{
          callbacks:{
            label:(ctx)=>`${ctx.dataset.label}: ${ctx.raw} colaborador(es) com dor`,
            afterBody:(items)=>{
              if(!items.length) return '';
              const i=items[0].dataIndex;
              return `Reavaliados no setor: ${comparativoSetores[i].total}`;
            }
          }
        }
      },
      scales:{
        x:{ticks:{autoSkip:false,maxRotation:55,minRotation:25}},
        y:{beginAtZero:true,ticks:{precision:0}}
      }
    }
  });

  const regCanvas = document.getElementById('regChart');
  if(regCanvas){
    regChart = new Chart(regCanvas, {
      type:'bar',
      data:{
        labels:DATA.regRows.map(x=>x.regiao),
        datasets:[{
          label:'Queixas',
          data:DATA.regRows.map(x=>x.qtd),
          backgroundColor:'#D8C3A5',
          borderColor:'#B99F7B',
          borderWidth:1,
          borderRadius:4
        }]
      },
      options:{indexAxis:'y',responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,ticks:{precision:0}}}}
    });
  }

  renderEvolucaoDor1Mes();
}
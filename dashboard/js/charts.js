// Gráficos e análises do dashboard
// Este arquivo deve ser carregado depois de api.js e antes de dashboard.js.

let setorChart = null;
let regChart = null;

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

function renderCharts() {
  if(setorChart) setorChart.destroy();
  if(regChart) regChart.destroy();

  const colorByValue = (v)=>{
    if(v<=1) return {bg:'#8CC8F2',bd:'#5EADE3'};
    if(v===2) return {bg:'#FF9B42',bd:'#E67F24'};
    if(v===3) return {bg:'#F2D95C',bd:'#D0B93E'};
    if(v===4) return {bg:'#EF6A62',bd:'#D94D45'};
    if(v===5) return {bg:'#A98AD9',bd:'#8768BB'};
    if(v===6) return {bg:'#54D6C2',bd:'#35B7A3'};
    if(v===7) return {bg:'#F48FB1',bd:'#DB6C92'};
    if(v===8) return {bg:'#6CCB5F',bd:'#4FAA45'};
    if(v===9) return {bg:'#9E9E9E',bd:'#7E7E7E'};
    return {bg:'#D8C3A5',bd:'#B99F7B'};
  };

  setorChart = new Chart(document.getElementById('setorChart'), {
    type:'bar',
    data:{
      labels:DATA.setorRows.map(x=>x.setor),
      datasets:[{
        label:'Com dor',
        data:DATA.setorRows.map(x=>x.comDor),
        backgroundColor:DATA.setorRows.map(r=>colorByValue(Number(r.comDor)).bg),
        borderColor:DATA.setorRows.map(r=>colorByValue(Number(r.comDor)).bd),
        borderWidth:1,
        borderRadius:4
      }]
    },
    options:{
      responsive:true,
      maintainAspectRatio:false,
      onClick:(evt,elements)=>{
        if(elements.length){
          const i=elements[0].index;
          openSectorAnalysis(DATA.setorRows[i].setor);
        }
      },
      plugins:{
        legend:{display:false},
        tooltip:{
          callbacks:{
            label:(ctx)=>`${ctx.label}: ${ctx.raw}`,
            afterLabel:()=> 'Clique para saber mais'
          }
        }
      },
      scales:{
        x:{ticks:{autoSkip:false,maxRotation:55,minRotation:25}},
        y:{beginAtZero:true,ticks:{precision:0}}
      }
    }
  });

  regChart = new Chart(document.getElementById('regChart'), {
    type:'bar',
    data:{
      labels:DATA.regRows.map(x=>x.regiao),
      datasets:[{
        label:'Queixas',
        data:DATA.regRows.map(x=>x.qtd),
        backgroundColor:DATA.regRows.map(r=>colorByValue(Number(r.qtd)).bg),
        borderColor:DATA.regRows.map(r=>colorByValue(Number(r.qtd)).bd),
        borderWidth:1,
        borderRadius:4
      }]
    },
    options:{
      indexAxis:'y',
      responsive:true,
      maintainAspectRatio:false,
      onClick:(evt,elements)=>{
        if(elements.length){
          const i=elements[0].index;
          openRegionAnalysis(DATA.regRows[i].regiao);
        }
      },
      plugins:{
        legend:{display:false},
        tooltip:{
          callbacks:{
            label:(ctx)=>`${ctx.label}: ${ctx.raw}`,
            afterLabel:()=> 'Clique para saber mais'
          }
        }
      },
      scales:{
        x:{beginAtZero:true,ticks:{precision:0}}
      }
    }
  });
}

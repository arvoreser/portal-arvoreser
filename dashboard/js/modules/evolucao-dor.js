// Módulo complementar: evolução após 1 mês
// Comparativos de dor e sono.

(function(){
  let evolucaoSonoChart = null;

  function normalizarTexto(valor){
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function normalizarRespostaGL(valor){
    return normalizarTexto(valor);
  }

  function garantirEstilosEvolucaoDetalhada(){
    if(document.getElementById('evolucaoDorDetalhadaStyles')) return;
    const style = document.createElement('style');
    style.id = 'evolucaoDorDetalhadaStyles';
    style.textContent = `
      .evolucao-dor-status,.evolucao-sono-status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 16px}
      .evolucao-dor-status-card,.evolucao-sono-status-card{border-radius:14px;padding:13px 16px;border:1px solid rgba(6,64,1,.10);background:#fff}
      .evolucao-dor-status-card .numero,.evolucao-sono-status-card .numero{display:block;font-size:25px;line-height:1;font-weight:800;margin-bottom:6px}
      .evolucao-dor-status-card .rotulo,.evolucao-sono-status-card .rotulo{font-size:12px;color:#667085}
      .evolucao-dor-status-card.melhoraram .numero,.evolucao-sono-status-card.melhoraram .numero{color:#187900}
      .evolucao-dor-status-card.mantiveram .numero,.evolucao-sono-status-card.mantiveram .numero{color:#667085}
      .evolucao-dor-status-card.aumentaram,.evolucao-sono-status-card.pioraram{border-color:rgba(253,49,5,.35)}
      .evolucao-dor-status-card.aumentaram .numero,.evolucao-sono-status-card.pioraram .numero{color:#fd3105}
      .evolucao-dor-status-card.aumentaram .gl-inline{display:block;margin-top:10px;padding-top:10px;border-top:1px solid rgba(253,49,5,.16);color:#7a2412;font-size:12px;line-height:1.45;font-weight:700}
      .evolucao-dor-rodape,.evolucao-sono-rodape{margin-top:14px;padding-top:12px;border-top:1px dashed rgba(24,121,0,.28);color:#667085;font-size:12px;line-height:1.55}
      #evolucaoSonoSection{margin-top:22px}
      .evolucao-sono-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}
      .evolucao-sono-head h3{margin:0}.evolucao-sono-sub{font-size:13px;color:#667085;margin-top:5px;line-height:1.4}
      .evolucao-sono-cobertura{font-size:13px;font-weight:700;color:#187900;background:#edf8ea;border:1px solid rgba(24,121,0,.18);padding:8px 12px;border-radius:999px}
      .evolucao-sono-chartbox{height:300px;position:relative}.evolucao-sono-nota{font-size:12px;color:#667085;margin-top:10px}
      @media(max-width:760px){.evolucao-dor-status,.evolucao-sono-status{grid-template-columns:1fr}.evolucao-sono-chartbox{height:260px}}
    `;
    document.head.appendChild(style);
  }

  function mapearSono(valor){
    const mapa={'muito ruim':1,'ruim':2,'regular':3,'boa':4,'bom':4,'excelente':5};
    const v=normalizarTexto(valor);
    return Object.prototype.hasOwnProperty.call(mapa,v)?mapa[v]:null;
  }

  function obterComparativoSono1Mes(){
    const iniciais=Array.isArray(DATA.records)?DATA.records:[];
    const reavaliacoes=Array.isArray(DATA.reavaliacao1MesRows)?DATA.reavaliacao1MesRows:[];
    const reavPorId=new Map();
    reavaliacoes.forEach(row=>{const id=String(row.ID??'').trim();if(id)reavPorId.set(id,row)});
    const pares=[];
    iniciais.forEach(inicial=>{
      const id=String(inicial.id??'').trim();const reav=reavPorId.get(id);if(!reav)return;
      const a=mapearSono(inicial.sono),b=mapearSono(reav['Sono']);if(a===null||b===null)return;
      pares.push({id,nome:inicial.nome,inicial:a,mes1:b});
    });
    return{totalColaboradores:iniciais.length,totalReavaliados:reavaliacoes.filter(r=>String(r.ID??'').trim()).length,totalComparaveis:pares.length,pares};
  }

  function garantirBlocoSono(){
    let bloco=document.getElementById('evolucaoSonoSection');if(bloco)return bloco;
    const dor=document.getElementById('evolucaoDorSection');if(!dor)return null;
    bloco=document.createElement('div');bloco.id='evolucaoSonoSection';bloco.className='section';
    bloco.innerHTML=`<div class="evolucao-sono-head"><div><h3><span class="section-dot">◈</span>Evolução do sono</h3><div class="evolucao-sono-sub">Comparação individual entre a avaliação inicial e a reavaliação de 1 mês.</div></div><div id="evolucaoSonoCobertura" class="evolucao-sono-cobertura">—</div></div><div id="evolucaoSonoStatus" class="evolucao-sono-status"></div><div class="evolucao-sono-chartbox"><canvas id="evolucaoSonoChart"></canvas></div><div id="evolucaoSonoNota" class="evolucao-sono-nota"></div><div id="evolucaoSonoRodape" class="evolucao-sono-rodape"></div>`;
    dor.insertAdjacentElement('afterend',bloco);return bloco;
  }

  function renderEvolucaoSono1Mes(){
    const bloco=garantirBlocoSono();if(!bloco)return;
    const c=obterComparativoSono1Mes(),cobertura=document.getElementById('evolucaoSonoCobertura'),status=document.getElementById('evolucaoSonoStatus'),nota=document.getElementById('evolucaoSonoNota'),rodape=document.getElementById('evolucaoSonoRodape');
    cobertura.textContent=`Reavaliados: ${c.totalReavaliados} de ${c.totalColaboradores}`;
    if(!c.totalComparaveis){status.innerHTML='';nota.textContent='Ainda não há registros suficientes para comparar a evolução do sono.';rodape.textContent='';if(evolucaoSonoChart){evolucaoSonoChart.destroy();evolucaoSonoChart=null}return}
    const melhoraram=c.pares.filter(p=>p.mes1>p.inicial),mantiveram=c.pares.filter(p=>p.mes1===p.inicial),pioraram=c.pares.filter(p=>p.mes1<p.inicial);
    status.innerHTML=`<div class="evolucao-sono-status-card melhoraram"><span class="numero">${melhoraram.length}</span><span class="rotulo">Melhoraram a qualidade do sono</span></div><div class="evolucao-sono-status-card mantiveram"><span class="numero">${mantiveram.length}</span><span class="rotulo">Mantiveram a mesma classificação</span></div><div class="evolucao-sono-status-card pioraram"><span class="numero">${pioraram.length}</span><span class="rotulo">Pioraram a classificação do sono</span></div>`;
    const categorias=[{nota:1,label:'Muito ruim'},{nota:2,label:'Ruim'},{nota:3,label:'Regular'},{nota:4,label:'Boa'},{nota:5,label:'Excelente'}],contar=(campo,n)=>c.pares.filter(p=>p[campo]===n).length;
    nota.textContent=`${c.totalComparaveis} dos ${c.totalReavaliados} reavaliados possuem classificação de sono comparável nos dois momentos.`;
    rodape.textContent='O sono é analisado pela mudança de categoria informada pelo próprio colaborador. O indicador mostra tendência de melhora, manutenção ou piora, sem substituir avaliação clínica individual.';
    if(evolucaoSonoChart)evolucaoSonoChart.destroy();
    evolucaoSonoChart=new Chart(document.getElementById('evolucaoSonoChart'),{type:'bar',data:{labels:categorias.map(x=>x.label),datasets:[{label:'Avaliação inicial',data:categorias.map(x=>contar('inicial',x.nota)),backgroundColor:'rgba(253,49,5,.28)',borderColor:'#fd3105',borderWidth:1,borderRadius:5},{label:'1 mês',data:categorias.map(x=>contar('mes1',x.nota)),backgroundColor:'rgba(23,250,3,.25)',borderColor:'#187900',borderWidth:1,borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.raw} colaborador(es)`}}},scales:{y:{beginAtZero:true,ticks:{precision:0}},x:{grid:{display:false}}}}});
  }

  window.renderEvolucaoDor1Mes=function(){
    const bloco=garantirBlocoEvolucaoDor();if(!bloco)return;garantirEstilosEvolucaoDetalhada();
    const c=obterComparativoDor1Mes(),cobertura=document.getElementById('evolucaoDorCobertura'),inicialEl=document.getElementById('evolucaoDorMediaInicial'),mes1El=document.getElementById('evolucaoDorMedia1Mes'),variacaoEl=document.getElementById('evolucaoDorVariacao'),notaEl=document.getElementById('evolucaoDorNota');
    cobertura.textContent=`Reavaliados: ${c.totalReavaliados} de ${c.totalColaboradores}`;
    let statusBox=document.getElementById('evolucaoDorStatus');if(!statusBox){statusBox=document.createElement('div');statusBox.id='evolucaoDorStatus';statusBox.className='evolucao-dor-status';const chartBox=bloco.querySelector('.evolucao-dor-chartbox');chartBox.parentNode.insertBefore(statusBox,chartBox)}
    let rodape=document.getElementById('evolucaoDorRodape');if(!rodape){rodape=document.createElement('div');rodape.id='evolucaoDorRodape';rodape.className='evolucao-dor-rodape';notaEl.insertAdjacentElement('afterend',rodape)}
    const antigo=document.getElementById('evolucaoDorContexto');if(antigo)antigo.remove();
    if(!c.totalComparaveis||c.mediaInicial===null||c.media1Mes===null){inicialEl.textContent='—';mes1El.textContent='—';variacaoEl.textContent='—';statusBox.innerHTML='';notaEl.textContent='Ainda não há registros suficientes para comparar a evolução da dor.';rodape.style.display='none';if(evolucaoDorChart){evolucaoDorChart.destroy();evolucaoDorChart=null}renderEvolucaoSono1Mes();return}
    const inicial=c.mediaInicial,mes1=c.media1Mes,diferenca=mes1-inicial,melhoraram=c.pares.filter(p=>p.mes1<p.inicial),mantiveram=c.pares.filter(p=>p.mes1===p.inicial),aumentaram=c.pares.filter(p=>p.mes1>p.inicial);
    const reavPorId=new Map();(Array.isArray(DATA.reavaliacao1MesRows)?DATA.reavaliacao1MesRows:[]).forEach(row=>{const id=String(row.ID??'').trim();if(id)reavPorId.set(id,row)});
    const comMelhoraGL=aumentaram.filter(p=>{const r=reavPorId.get(String(p.id));return r&&normalizarRespostaGL(r['Exercicio de GL melhorou suas dores?'])==='sim'});
    inicialEl.textContent=`${inicial.toFixed(1).replace('.',',')}/10`;mes1El.textContent=`${mes1.toFixed(1).replace('.',',')}/10`;
    if(Math.abs(diferenca)<.05){variacaoEl.textContent='Estável';variacaoEl.className='v'}else if(diferenca<0){variacaoEl.textContent=`↓ ${Math.abs(diferenca).toFixed(1).replace('.',',')} ponto(s)`;variacaoEl.className='v reducao'}else{variacaoEl.textContent=`↑ ${Math.abs(diferenca).toFixed(1).replace('.',',')} ponto(s)`;variacaoEl.className='v aumento'}
    const textoGl=aumentaram.length?`${comMelhoraGL.length} relataram que os exercícios de GL melhoraram suas dores.`:'Nenhum colaborador apresentou aumento da nota de dor neste comparativo.';
    statusBox.innerHTML=`<div class="evolucao-dor-status-card melhoraram"><span class="numero">${melhoraram.length}</span><span class="rotulo">Melhoraram a nota de dor</span></div><div class="evolucao-dor-status-card mantiveram"><span class="numero">${mantiveram.length}</span><span class="rotulo">Mantiveram a mesma nota</span></div><div class="evolucao-dor-status-card aumentaram"><span class="numero">${aumentaram.length}</span><span class="rotulo">Aumentaram a nota de dor</span><span class="gl-inline">${textoGl}</span></div>`;
    notaEl.textContent=`${c.totalComparaveis} dos ${c.totalReavaliados} reavaliados possuem nota comparável nos dois momentos. Notas 0/10 são consideradas no cálculo.`;
    rodape.style.display='block';rodape.textContent='A intensidade da dor é uma medida subjetiva e pode variar conforme o momento, a rotina e outros fatores. Por isso, a evolução é interpretada em conjunto com a percepção de benefício da GL e os demais indicadores do acompanhamento.';

    // Mesmo modelo visual do sono: distribuição das notas 0 a 10 nos dois momentos.
    if(evolucaoDorChart)evolucaoDorChart.destroy();
    const notas=Array.from({length:11},(_,i)=>i),contar=(campo,n)=>c.pares.filter(p=>p[campo]===n).length;
    evolucaoDorChart=new Chart(document.getElementById('evolucaoDorChart'),{type:'bar',data:{labels:notas.map(n=>String(n)),datasets:[{label:'Avaliação inicial',data:notas.map(n=>contar('inicial',n)),backgroundColor:'rgba(253,49,5,.28)',borderColor:'#fd3105',borderWidth:1,borderRadius:5},{label:'1 mês',data:notas.map(n=>contar('mes1',n)),backgroundColor:'rgba(23,250,3,.25)',borderColor:'#187900',borderWidth:1,borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'},tooltip:{callbacks:{label:ctx=>`${ctx.dataset.label}: ${ctx.raw} colaborador(es)`}}},scales:{y:{beginAtZero:true,ticks:{precision:0}},x:{title:{display:true,text:'Nota de dor (0 a 10)'},grid:{display:false}}}}});
    renderEvolucaoSono1Mes();
  };
})();

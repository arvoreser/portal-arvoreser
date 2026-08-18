// Clique nos gráficos de evolução: mostra os nomes dos colaboradores do grupo selecionado.
(function(){
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const num=v=>{const m=String(v??'').replace(',','.').match(/-?\d+(?:\.\d+)?/);return m&&Number.isFinite(Number(m[0]))?Number(m[0]):0};
  const temDor=v=>{const x=norm(v);return x==='sim'||x.startsWith('sim ')};
  const risco=(n,dor)=>{if(n>=7)return '🔴';if(n>=4)return '🟠';if(dor)return '🟡';return '🟢'};
  const sono=v=>({'muito ruim':1,'ruim':2,'regular':3,'boa':4,'bom':4,'excelente':5}[norm(v)]??null);
  const estresse=v=>({'muito baixo':1,'baixo':2,'moderado':3,'medio':3,'alto':4,'muito alto':5}[norm(v)]??null);
  const interfere=v=>({'nunca':1,'as vezes':2,'frequentemente':3,'sempre':4}[norm(v)]??null);
  const gl=v=>{const x=norm(v);if(x==='sim')return'Sim';if(x.includes('nao muito'))return'Não muito';if(x==='nao')return'Não';return null};

  function pares(){
    const iniciais=Array.isArray(DATA.records)?DATA.records:[];
    const reavs=Array.isArray(DATA.reavaliacao1MesRows)?DATA.reavaliacao1MesRows:[];
    const mapa=new Map(reavs.map(r=>[String(r.ID??'').trim(),r]));
    return iniciais.map(i=>({i,r:mapa.get(String(i.id??'').trim())})).filter(x=>x.r);
  }

  function pessoaComRisco(x,momento){
    const reav=norm(momento).includes('1 mes');
    const nota=reav?num(x.r['Nota da dor']):(Number(x.i.nota_dor_num)||0);
    const dor=reav?temDor(x.r['Resposta original sobre dor']):temDor(x.i.tem_dor);
    return {nome:x.i.nome,risco:risco(nota,dor)};
  }

  function abrir(titulo,subtitulo,pessoas){
    const painel=document.getElementById('detailPanel');
    if(!painel)return;
    painel.classList.add('region-detail-panel');
    painel.removeAttribute('style');
    const mapa=new Map();
    pessoas.filter(p=>p&&p.nome).forEach(p=>{if(!mapa.has(p.nome))mapa.set(p.nome,p)});
    const lista=[...mapa.values()].sort((a,b)=>String(a.nome).localeCompare(String(b.nome),'pt-BR'));
    document.getElementById('detailContent').innerHTML=`
      <h2 style="font-size:17px;margin:2px 0 6px">${esc(titulo)}</h2>
      <div class="note" style="font-size:11px;margin-top:0">${esc(subtitulo)} • ${lista.length} colaborador(es)</div>
      <div class="region-click-list">${lista.map(p=>`<div class="region-click-person" style="cursor:default"><span class="risk-dot">${p.risco}</span><span class="region-click-name">${esc(p.nome)}</span></div>`).join('')||'<div class="small">Nenhum colaborador neste grupo.</div>'}</div>`;
    painel.style.display='block';
  }

  function ligar(canvasId,obterPessoas,titulo){
    const canvas=document.getElementById(canvasId); if(!canvas)return;
    const chart=Chart.getChart(canvas); if(!chart)return;
    chart.options.onClick=(evt,elements)=>{
      if(!elements.length)return;
      const e=elements[0];
      const categoria=chart.data.labels[e.index];
      const momento=chart.data.datasets[e.datasetIndex]?.label||'';
      abrir(titulo,`${momento}${momento?' • ':''}${categoria}`,obterPessoas(e.index,e.datasetIndex,categoria,momento));
    };
    if(chart.options.plugins?.tooltip?.callbacks){chart.options.plugins.tooltip.callbacks.afterLabel=()=> 'Clique para ver os nomes';}
    chart.update('none');
  }

  window.ativarCliquesNomesEvolucao=function(){
    const p=pares();
    ligar('evolucaoDorChart',(idx,dataset,categoria,momento)=>p.filter(x=>(dataset===0?Number(x.i.nota_dor_num)||0:num(x.r['Nota da dor']))===idx).map(x=>pessoaComRisco(x,momento)),'Evolução da dor');
    const catsSono=[1,2,3,4,5];
    ligar('evolucaoSonoChart',(idx,dataset,categoria,momento)=>p.filter(x=>(dataset===0?sono(x.i.sono):sono(x.r['Sono']))===catsSono[idx]).map(x=>pessoaComRisco(x,momento)),'Evolução do sono');
    const catsEstresse=[1,2,3,4,5];
    ligar('evolucaoEstresseChart',(idx,dataset,categoria,momento)=>p.filter(x=>(dataset===0?estresse(x.i.estresse):estresse(x.r['Estresse']))===catsEstresse[idx]).map(x=>pessoaComRisco(x,momento)),'Evolução do estresse');
    const catsInterf=[1,2,3,4];
    ligar('evolucaoInterferenciaChart',(idx,dataset,categoria,momento)=>p.filter(x=>(dataset===0?interfere(x.i.interfere):interfere(x.r['Interfere no trabalho?']))===catsInterf[idx]).map(x=>pessoaComRisco(x,momento)),'Interferência da dor no trabalho');
    const catsGL=['Sim','Não muito','Não'];
    ligar('evGLChart',(idx,dataset,categoria,momento)=>p.filter(x=>gl(x.r['Exercicio de GL melhorou suas dores?'])===catsGL[idx]).map(x=>pessoaComRisco(x,'1 mês')),'Percepção de melhora com a GL');
  };
})();
// Detalhamento por setor da reavaliação de 1 mês
(function(){
  function texto(v){ return String(v ?? '').trim(); }
  function normalizar(v){ return texto(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase(); }
  function temDor(v){ const x=normalizar(v); return x==='sim' || x.startsWith('sim '); }
  function nota(v){
    const m=texto(v).replace(',','.').match(/\d+(?:\.\d+)?/);
    if(!m) return 0;
    const n=Number(m[0]);
    return Number.isFinite(n) ? n : 0;
  }
  function risco(n, dor){
    if(n>=7) return '🔴';
    if(n>=4) return '🟠';
    if(dor) return '🟡';
    return '🟢';
  }
  function contar(items, campo){
    const mapa={};
    items.forEach(r=>{
      const v=texto(r[campo]);
      if(v) mapa[v]=(mapa[v]||0)+1;
    });
    return Object.entries(mapa).sort((a,b)=>b[1]-a[1]);
  }
  function contarRegioes(items){
    const mapa={};
    items.forEach(r=>{
      if(!temDor(r['Resposta original sobre dor'])) return;
      texto(r['Região da dor']).split(/[,;|\/]+/).map(x=>x.trim()).filter(Boolean).forEach(reg=>{
        mapa[reg]=(mapa[reg]||0)+1;
      });
    });
    return Object.entries(mapa).sort((a,b)=>b[1]-a[1]);
  }
  function linhas(entries, vazio='Sem dados'){
    if(!entries.length) return `<div class="small">${vazio}</div>`;
    return entries.map(([label,count])=>`<div class="sector-line"><span>${esc(label)}</span><strong>${count}</strong></div>`).join('');
  }

  window.openSectorReavaliacaoAnalysis=function(setor){
    const items=(Array.isArray(DATA.reavaliacao1MesRows)?DATA.reavaliacao1MesRows:[])
      .filter(r=>texto(r['Setor'])===texto(setor));

    const total=items.length;
    const comDor=items.filter(r=>temDor(r['Resposta original sobre dor'])).length;
    const semDor=total-comDor;
    const notas=items.filter(r=>temDor(r['Resposta original sobre dor'])).map(r=>nota(r['Nota da dor'])).filter(n=>n>0);
    const media=notas.length?(notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1):'—';

    const regioes=contarRegioes(items);
    const interfere=contar(items,'Interfere no trabalho?');
    const sono=contar(items,'Sono');
    const estresse=contar(items,'Estresse');
    const agua=contar(items,'Água');
    const atividade=contar(items,'Atividade física');
    const gl=contar(items,'Exercicio de GL melhorou suas dores?');

    const pessoas=items.slice().sort((a,b)=>nota(b['Nota da dor'])-nota(a['Nota da dor'])).map(r=>{
      const n=nota(r['Nota da dor']);
      const dor=temDor(r['Resposta original sobre dor']);
      const id=Number(r.ID);
      const acao=Number.isFinite(id)?` onclick="openPersonById(${id})"`:'';
      return `<div class="sector-person"${acao}><span><span class="risk-dot">${risco(n,dor)}</span> ${esc(texto(r['Nome completo'])||'Sem nome')}</span><strong>${n>0?n+'/10':'—'}</strong></div>`;
    }).join('');

    document.getElementById('detailContent').innerHTML=`
      <h2>Setor: ${esc(setor)} <span style="font-size:13px;font-weight:700;color:#187900;background:#edf8ea;border:1px solid rgba(24,121,0,.18);padding:6px 10px;border-radius:999px;margin-left:8px">Reavaliação de 1 mês</span></h2>

      <div class="sector-panel">
        <div class="sector-metric"><div class="n">${total}</div><div class="t">Reavaliados</div></div>
        <div class="sector-metric"><div class="n">${semDor}</div><div class="t">Sem dor</div></div>
        <div class="sector-metric"><div class="n">${comDor}</div><div class="t">Com dor</div></div>
        <div class="sector-metric"><div class="n">${media}</div><div class="t">Média da dor</div></div>
      </div>

      <div class="sector-grid">
        <div class="sector-box"><div class="sector-box-title">Regiões mais acometidas</div>${linhas(regioes)}</div>
        <div class="sector-box"><div class="sector-box-title">Interferência no trabalho</div>${linhas(interfere)}</div>
        <div class="sector-box"><div class="sector-box-title">Sono</div>${linhas(sono)}</div>
        <div class="sector-box"><div class="sector-box-title">Estresse</div>${linhas(estresse)}</div>
        <div class="sector-box"><div class="sector-box-title">Água</div>${linhas(agua)}</div>
        <div class="sector-box"><div class="sector-box-title">Atividade física</div>${linhas(atividade)}</div>
        <div class="sector-box"><div class="sector-box-title">GL melhorou as dores?</div>${linhas(gl)}</div>
      </div>

      <h3 style="margin-top:18px">Colaboradores reavaliados do setor</h3>
      <div class="sector-people">${pessoas || '<div class="small">Sem colaboradores reavaliados neste setor.</div>'}</div>
    `;
    document.getElementById('detailPanel').style.display='block';
  };

  window.ativarCliqueReavaliacaoSetor=function(){
    if(!window.setorChart) return;
    setorChart.options.onClick=(evt,elements)=>{
      if(!elements.length) return;
      const el=elements[0];
      const setor=setorChart.data.labels[el.index];
      if(el.datasetIndex===1) window.openSectorReavaliacaoAnalysis(setor);
      else if(typeof window.openSectorAnalysis==='function') window.openSectorAnalysis(setor);
      else if(typeof openSectorAnalysis==='function') openSectorAnalysis(setor);
    };
    setorChart.update('none');
  };
})();
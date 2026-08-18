// Detalhamento por setor da avaliação inicial e da reavaliação de 1 mês
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
  function contarRaw(items, campo){
    const mapa={};
    items.forEach(r=>{
      const v=texto(r[campo]);
      if(v) mapa[v]=(mapa[v]||0)+1;
    });
    return Object.entries(mapa).sort((a,b)=>b[1]-a[1]);
  }
  function contarNorm(items, campo){
    const mapa={};
    items.forEach(r=>{
      const v=texto(r[campo]);
      if(v && v!=='Não informado') mapa[v]=(mapa[v]||0)+1;
    });
    return Object.entries(mapa).sort((a,b)=>b[1]-a[1]);
  }
  function contarRegioesReav(items){
    const mapa={};
    items.forEach(r=>{
      if(!temDor(r['Resposta original sobre dor'])) return;
      texto(r['Região da dor']).split(/[,;|\/]+/).map(x=>x.trim()).filter(Boolean).forEach(reg=>{ mapa[reg]=(mapa[reg]||0)+1; });
    });
    return Object.entries(mapa).sort((a,b)=>b[1]-a[1]);
  }
  function contarRegioesInicial(items){
    const mapa={};
    items.forEach(r=>{
      if(!temDor(r.tem_dor)) return;
      (Array.isArray(r.regioes_lista)?r.regioes_lista:[]).forEach(reg=>{ mapa[reg]=(mapa[reg]||0)+1; });
    });
    return Object.entries(mapa).sort((a,b)=>b[1]-a[1]);
  }
  function linhas(entries, vazio='Sem dados'){
    if(!entries.length) return `<div class="small">${vazio}</div>`;
    return entries.map(([label,count])=>`<div class="sector-line"><span>${esc(label)}</span><strong>${count}</strong></div>`).join('');
  }

  // Avaliação inicial: mantém apenas indicadores úteis para comparação com a reavaliação.
  window.openSectorAnalysis=function(setor){
    const items=(Array.isArray(DATA.records)?DATA.records:[]).filter(r=>texto(r.setor)===texto(setor));
    const total=items.length;
    const comDor=items.filter(r=>temDor(r.tem_dor)).length;
    const semDor=total-comDor;
    const notas=items.filter(r=>temDor(r.tem_dor)).map(r=>Number(r.nota_dor_num)||0).filter(n=>n>0);
    const media=notas.length?(notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1):'—';

    const regioes=contarRegioesInicial(items);
    const interfere=contarNorm(items,'interfere');
    const sono=contarNorm(items,'sono');
    const estresse=contarNorm(items,'estresse');

    const pessoas=items.slice().sort((a,b)=>(b.nota_dor_num||0)-(a.nota_dor_num||0)).map(r=>{
      const n=Number(r.nota_dor_num)||0;
      const dor=temDor(r.tem_dor);
      return `<div class="sector-person" onclick="openPersonById(${r.id})"><span><span class="risk-dot">${risco(n,dor)}</span> ${esc(r.nome)}</span><strong>${n>0?n+'/10':'—'}</strong></div>`;
    }).join('');

    document.getElementById('detailContent').innerHTML=`
      <h2>Setor: ${esc(setor)} <span style="font-size:13px;font-weight:700;color:#fd3105;background:rgba(253,49,5,.06);border:1px solid rgba(253,49,5,.18);padding:6px 10px;border-radius:999px;margin-left:8px">Avaliação inicial</span></h2>
      <div class="sector-panel">
        <div class="sector-metric"><div class="n">${total}</div><div class="t">Colaboradores</div></div>
        <div class="sector-metric"><div class="n">${semDor}</div><div class="t">Sem dor</div></div>
        <div class="sector-metric"><div class="n">${comDor}</div><div class="t">Com dor</div></div>
        <div class="sector-metric"><div class="n">${media}</div><div class="t">Média da dor</div></div>
      </div>
      <div class="sector-grid">
        <div class="sector-box"><div class="sector-box-title">Regiões mais acometidas</div>${linhas(regioes)}</div>
        <div class="sector-box"><div class="sector-box-title">Interferência no trabalho</div>${linhas(interfere)}</div>
        <div class="sector-box"><div class="sector-box-title">Sono</div>${linhas(sono)}</div>
        <div class="sector-box"><div class="sector-box-title">Estresse</div>${linhas(estresse)}</div>
      </div>
      <h3 style="margin-top:18px">Colaboradores do setor</h3>
      <div class="sector-people">${pessoas || '<div class="small">Sem colaboradores neste setor.</div>'}</div>`;
    document.getElementById('detailPanel').style.display='block';
  };

  window.openSectorReavaliacaoAnalysis=function(setor){
    const items=(Array.isArray(DATA.reavaliacao1MesRows)?DATA.reavaliacao1MesRows:[]).filter(r=>texto(r['Setor'])===texto(setor));
    const total=items.length;
    const comDor=items.filter(r=>temDor(r['Resposta original sobre dor'])).length;
    const semDor=total-comDor;
    const notas=items.filter(r=>temDor(r['Resposta original sobre dor'])).map(r=>nota(r['Nota da dor'])).filter(n=>n>0);
    const media=notas.length?(notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1):'—';

    const regioes=contarRegioesReav(items);
    const interfere=contarRaw(items,'Interfere no trabalho?');
    const sono=contarRaw(items,'Sono');
    const estresse=contarRaw(items,'Estresse');
    const gl=contarRaw(items,'Exercicio de GL melhorou suas dores?');

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
        <div class="sector-box"><div class="sector-box-title">GL melhorou as dores?</div>${linhas(gl)}</div>
      </div>
      <h3 style="margin-top:18px">Colaboradores reavaliados do setor</h3>
      <div class="sector-people">${pessoas || '<div class="small">Sem colaboradores reavaliados neste setor.</div>'}</div>`;
    document.getElementById('detailPanel').style.display='block';
  };

  window.ativarCliqueReavaliacaoSetor=function(){
    if(!window.setorChart) return;
    setorChart.options.onClick=(evt,elements)=>{
      if(!elements.length) return;
      const el=elements[0];
      const setor=setorChart.data.labels[el.index];
      if(el.datasetIndex===1) window.openSectorReavaliacaoAnalysis(setor);
      else window.openSectorAnalysis(setor);
    };
    setorChart.update('none');
  };
})();
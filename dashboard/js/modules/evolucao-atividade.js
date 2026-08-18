// Evolução da atividade física após 1 mês
(function(){
  let chart = null;
  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const ativo=v=>{const x=norm(v); if(!x)return null; if(x==='nao'||x==='não')return 0; if(x==='sim')return 1; return null;};

  function dados(){
    const iniciais=Array.isArray(DATA.records)?DATA.records:[];
    const reavs=Array.isArray(DATA.reavaliacao1MesRows)?DATA.reavaliacao1MesRows:[];
    const mapa=new Map(reavs.map(r=>[String(r.ID??'').trim(),r]));
    const pares=[];
    iniciais.forEach(i=>{
      const r=mapa.get(String(i.id??'').trim()); if(!r)return;
      const a=ativo(i.atividadeFisica),b=ativo(r['Atividade física']); if(a===null||b===null)return;
      pares.push({inicial:a,mes1:b});
    });
    return {total:iniciais.length,reavaliados:reavs.filter(r=>String(r.ID??'').trim()).length,pares};
  }

  function bloco(){
    let el=document.getElementById('evolucaoAtividadeSection'); if(el)return el;
    const anterior=document.getElementById('evolucaoInterferenciaSection'); if(!anterior)return null;
    el=document.createElement('div'); el.id='evolucaoAtividadeSection'; el.className='section';
    el.innerHTML=`<div class="evolucao-atividade-head"><div><h3><span class="section-dot">◈</span>Evolução da atividade física</h3><div class="evolucao-atividade-sub">Comparação entre a avaliação inicial e a reavaliação de 1 mês.</div></div><div id="evolucaoAtividadeCobertura" class="evolucao-atividade-cobertura">—</div></div><div id="evolucaoAtividadeStatus" class="evolucao-atividade-status"></div><div class="evolucao-atividade-chartbox"><canvas id="evolucaoAtividadeChart"></canvas></div><div id="evolucaoAtividadeNota" class="evolucao-atividade-nota"></div><div class="evolucao-atividade-rodape">A prática de atividade física é um indicador comportamental autorreferido. A mudança observada complementa a leitura do programa, sem atribuir causalidade isolada à ginástica laboral.</div>`;
    anterior.insertAdjacentElement('afterend',el);
    if(!document.getElementById('evolucaoAtividadeStyles')){const s=document.createElement('style');s.id='evolucaoAtividadeStyles';s.textContent=`#evolucaoAtividadeSection{margin-top:22px}.evolucao-atividade-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}.evolucao-atividade-head h3{margin:0}.evolucao-atividade-sub{font-size:13px;color:#667085;margin-top:5px}.evolucao-atividade-cobertura{font-size:13px;font-weight:700;color:#187900;background:#edf8ea;border:1px solid rgba(24,121,0,.18);padding:8px 12px;border-radius:999px}.evolucao-atividade-status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}.evolucao-atividade-card{border-radius:14px;padding:13px 16px;border:1px solid rgba(6,64,1,.10);background:#fff}.evolucao-atividade-card .numero{display:block;font-size:25px;line-height:1;font-weight:800;margin-bottom:6px}.evolucao-atividade-card .rotulo{font-size:12px;color:#667085}.evolucao-atividade-card.iniciaram .numero{color:#187900}.evolucao-atividade-card.mantiveram .numero{color:#667085}.evolucao-atividade-card.pararam{border-color:rgba(253,49,5,.35)}.evolucao-atividade-card.pararam .numero{color:#fd3105}.evolucao-atividade-chartbox{height:300px;position:relative}.evolucao-atividade-nota{font-size:12px;color:#667085;margin-top:10px}.evolucao-atividade-rodape{margin-top:14px;padding-top:12px;border-top:1px dashed rgba(24,121,0,.28);color:#667085;font-size:12px;line-height:1.55}@media(max-width:760px){.evolucao-atividade-status{grid-template-columns:1fr}}`;document.head.appendChild(s)}
    return el;
  }

  window.renderEvolucaoAtividade1Mes=function(){
    if(!bloco())return; const d=dados();
    document.getElementById('evolucaoAtividadeCobertura').textContent=`Reavaliados: ${d.reavaliados} de ${d.total}`;
    const iniciaram=d.pares.filter(p=>p.inicial===0&&p.mes1===1).length;
    const mantiveram=d.pares.filter(p=>p.inicial===p.mes1).length;
    const pararam=d.pares.filter(p=>p.inicial===1&&p.mes1===0).length;
    document.getElementById('evolucaoAtividadeStatus').innerHTML=`<div class="evolucao-atividade-card iniciaram"><span class="numero">${iniciaram}</span><span class="rotulo">Passaram a praticar atividade física</span></div><div class="evolucao-atividade-card mantiveram"><span class="numero">${mantiveram}</span><span class="rotulo">Mantiveram a condição informada</span></div><div class="evolucao-atividade-card pararam"><span class="numero">${pararam}</span><span class="rotulo">Deixaram de praticar atividade física</span></div>`;
    document.getElementById('evolucaoAtividadeNota').textContent=`${d.pares.length} dos ${d.reavaliados} reavaliados possuem resposta comparável nos dois momentos.`;
    const contar=(campo,v)=>d.pares.filter(p=>p[campo]===v).length;
    if(chart)chart.destroy(); chart=new Chart(document.getElementById('evolucaoAtividadeChart'),{type:'bar',data:{labels:['Não','Sim'],datasets:[{label:'Avaliação inicial',data:[contar('inicial',0),contar('inicial',1)],backgroundColor:'rgba(253,49,5,.28)',borderColor:'#fd3105',borderWidth:1,borderRadius:5},{label:'1 mês',data:[contar('mes1',0),contar('mes1',1)],backgroundColor:'rgba(23,250,3,.25)',borderColor:'#187900',borderWidth:1,borderRadius:5}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'}},scales:{y:{beginAtZero:true,ticks:{precision:0}},x:{grid:{display:false}}}}});
  };
})();
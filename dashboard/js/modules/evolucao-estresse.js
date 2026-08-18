// Módulo: evolução do estresse após 1 mês

(function(){
  let evolucaoEstresseChart = null;

  function normalizarTexto(valor){
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function mapearEstresse(valor){
    const mapa = {
      'muito baixo':1,
      'baixo':2,
      'moderado':3,
      'medio':3,
      'alto':4,
      'muito alto':5
    };
    const v = normalizarTexto(valor);
    return Object.prototype.hasOwnProperty.call(mapa, v) ? mapa[v] : null;
  }

  function obterComparativoEstresse1Mes(){
    const iniciais = Array.isArray(DATA.records) ? DATA.records : [];
    const reavaliacoes = Array.isArray(DATA.reavaliacao1MesRows) ? DATA.reavaliacao1MesRows : [];
    const reavPorId = new Map();

    reavaliacoes.forEach(row => {
      const id = String(row.ID ?? '').trim();
      if(id) reavPorId.set(id, row);
    });

    const pares = [];
    iniciais.forEach(inicial => {
      const id = String(inicial.id ?? '').trim();
      const reav = reavPorId.get(id);
      if(!reav) return;

      const a = mapearEstresse(inicial.estresse);
      const b = mapearEstresse(reav['Estresse']);
      if(a === null || b === null) return;

      pares.push({ id, nome: inicial.nome, inicial:a, mes1:b });
    });

    return {
      totalColaboradores: iniciais.length,
      totalReavaliados: reavaliacoes.filter(r => String(r.ID ?? '').trim()).length,
      totalComparaveis: pares.length,
      pares
    };
  }

  function garantirEstilos(){
    if(document.getElementById('evolucaoEstresseStyles')) return;
    const style = document.createElement('style');
    style.id = 'evolucaoEstresseStyles';
    style.textContent = `
      #evolucaoEstresseSection{margin-top:22px}
      .evolucao-estresse-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}
      .evolucao-estresse-head h3{margin:0}
      .evolucao-estresse-sub{font-size:13px;color:#667085;margin-top:5px;line-height:1.4}
      .evolucao-estresse-cobertura{font-size:13px;font-weight:700;color:#187900;background:#edf8ea;border:1px solid rgba(24,121,0,.18);padding:8px 12px;border-radius:999px}
      .evolucao-estresse-status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 16px}
      .evolucao-estresse-card{border-radius:14px;padding:13px 16px;border:1px solid rgba(6,64,1,.10);background:#fff}
      .evolucao-estresse-card .numero{display:block;font-size:25px;line-height:1;font-weight:800;margin-bottom:6px}
      .evolucao-estresse-card .rotulo{font-size:12px;color:#667085}
      .evolucao-estresse-card.reduziram .numero{color:#187900}
      .evolucao-estresse-card.mantiveram .numero{color:#667085}
      .evolucao-estresse-card.aumentaram{border-color:rgba(253,49,5,.35)}
      .evolucao-estresse-card.aumentaram .numero{color:#fd3105}
      .evolucao-estresse-chartbox{height:300px;position:relative}
      .evolucao-estresse-nota{font-size:12px;color:#667085;margin-top:10px}
      .evolucao-estresse-rodape{margin-top:14px;padding-top:12px;border-top:1px dashed rgba(24,121,0,.28);color:#667085;font-size:12px;line-height:1.55}
      @media(max-width:760px){.evolucao-estresse-status{grid-template-columns:1fr}.evolucao-estresse-chartbox{height:260px}}
    `;
    document.head.appendChild(style);
  }

  function garantirBloco(){
    let bloco = document.getElementById('evolucaoEstresseSection');
    if(bloco) return bloco;

    const sono = document.getElementById('evolucaoSonoSection');
    if(!sono) return null;

    bloco = document.createElement('div');
    bloco.id = 'evolucaoEstresseSection';
    bloco.className = 'section';
    bloco.innerHTML = `
      <div class="evolucao-estresse-head">
        <div>
          <h3><span class="section-dot">◈</span>Evolução do estresse</h3>
          <div class="evolucao-estresse-sub">Comparação individual entre a avaliação inicial e a reavaliação de 1 mês.</div>
        </div>
        <div id="evolucaoEstresseCobertura" class="evolucao-estresse-cobertura">—</div>
      </div>
      <div id="evolucaoEstresseStatus" class="evolucao-estresse-status"></div>
      <div class="evolucao-estresse-chartbox"><canvas id="evolucaoEstresseChart"></canvas></div>
      <div id="evolucaoEstresseNota" class="evolucao-estresse-nota"></div>
      <div id="evolucaoEstresseRodape" class="evolucao-estresse-rodape"></div>
    `;
    sono.insertAdjacentElement('afterend', bloco);
    return bloco;
  }

  window.renderEvolucaoEstresse1Mes = function(){
    const bloco = garantirBloco();
    if(!bloco) return;
    garantirEstilos();

    const c = obterComparativoEstresse1Mes();
    const cobertura = document.getElementById('evolucaoEstresseCobertura');
    const status = document.getElementById('evolucaoEstresseStatus');
    const nota = document.getElementById('evolucaoEstresseNota');
    const rodape = document.getElementById('evolucaoEstresseRodape');

    cobertura.textContent = `Reavaliados: ${c.totalReavaliados} de ${c.totalColaboradores}`;

    if(!c.totalComparaveis){
      status.innerHTML = '';
      nota.textContent = 'Ainda não há registros suficientes para comparar a evolução do estresse.';
      rodape.textContent = '';
      if(evolucaoEstresseChart){ evolucaoEstresseChart.destroy(); evolucaoEstresseChart = null; }
      return;
    }

    const reduziram = c.pares.filter(p => p.mes1 < p.inicial);
    const mantiveram = c.pares.filter(p => p.mes1 === p.inicial);
    const aumentaram = c.pares.filter(p => p.mes1 > p.inicial);

    status.innerHTML = `
      <div class="evolucao-estresse-card reduziram"><span class="numero">${reduziram.length}</span><span class="rotulo">Reduziram o nível de estresse</span></div>
      <div class="evolucao-estresse-card mantiveram"><span class="numero">${mantiveram.length}</span><span class="rotulo">Mantiveram a mesma classificação</span></div>
      <div class="evolucao-estresse-card aumentaram"><span class="numero">${aumentaram.length}</span><span class="rotulo">Aumentaram o nível de estresse</span></div>
    `;

    const categorias=[{nota:1,label:'Muito baixo'},{nota:2,label:'Baixo'},{nota:3,label:'Moderado'},{nota:4,label:'Alto'},{nota:5,label:'Muito alto'}];
    const contar=(campo,n)=>c.pares.filter(p=>p[campo]===n).length;

    nota.textContent = `${c.totalComparaveis} dos ${c.totalReavaliados} reavaliados possuem classificação de estresse comparável nos dois momentos.`;
    rodape.textContent = 'O estresse é um indicador autorreferido e pode variar conforme demandas pessoais e profissionais. A leitura mostra tendência de redução, manutenção ou aumento e deve ser interpretada em conjunto com os demais indicadores do acompanhamento.';

    if(evolucaoEstresseChart) evolucaoEstresseChart.destroy();
    evolucaoEstresseChart = new Chart(document.getElementById('evolucaoEstresseChart'), {
      type:'bar',
      data:{labels:categorias.map(c=>c.label),datasets:[
        {label:'Avaliação inicial',data:categorias.map(c=>contar('inicial',c.nota)),backgroundColor:'rgba(253,49,5,.28)',borderColor:'#fd3105',borderWidth:1,borderRadius:5},
        {label:'1 mês',data:categorias.map(c=>contar('mes1',c.nota)),backgroundColor:'rgba(23,250,3,.25)',borderColor:'#187900',borderWidth:1,borderRadius:5}
      ]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'top'},tooltip:{callbacks:{label:(ctx)=>`${ctx.dataset.label}: ${ctx.raw} colaborador(es)`}}},scales:{y:{beginAtZero:true,ticks:{precision:0}},x:{grid:{display:false}}}}
    });
  };
})();

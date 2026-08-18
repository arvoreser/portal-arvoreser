// Módulo complementar: evolução da interferência da dor no trabalho após 1 mês

(function(){
  let evolucaoInterferenciaChart = null;

  function normalizarTexto(valor){
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function mapearInterferencia(valor){
    const mapa = {
      'nunca': 1,
      'as vezes': 2,
      'frequentemente': 3,
      'sempre': 4
    };
    const v = normalizarTexto(valor);
    return Object.prototype.hasOwnProperty.call(mapa, v) ? mapa[v] : null;
  }

  function obterComparativoInterferencia1Mes(){
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

      const valorInicial = mapearInterferencia(inicial.interfere);
      const valor1Mes = mapearInterferencia(reav['Interfere no trabalho?']);
      if(valorInicial === null || valor1Mes === null) return;

      pares.push({
        id,
        nome: inicial.nome,
        inicial: valorInicial,
        mes1: valor1Mes
      });
    });

    return {
      totalColaboradores: iniciais.length,
      totalReavaliados: reavaliacoes.filter(r => String(r.ID ?? '').trim()).length,
      totalComparaveis: pares.length,
      pares
    };
  }

  function garantirEstilos(){
    if(document.getElementById('evolucaoInterferenciaStyles')) return;

    const style = document.createElement('style');
    style.id = 'evolucaoInterferenciaStyles';
    style.textContent = `
      #evolucaoInterferenciaSection{margin-top:22px}
      .evolucao-interferencia-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}
      .evolucao-interferencia-head h3{margin:0}
      .evolucao-interferencia-sub{font-size:13px;color:#667085;margin-top:5px;line-height:1.4}
      .evolucao-interferencia-cobertura{font-size:13px;font-weight:700;color:#187900;background:#edf8ea;border:1px solid rgba(24,121,0,.18);padding:8px 12px;border-radius:999px}
      .evolucao-interferencia-status{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin:0 0 16px}
      .evolucao-interferencia-card{border-radius:14px;padding:13px 16px;border:1px solid rgba(6,64,1,.10);background:#fff}
      .evolucao-interferencia-card .numero{display:block;font-size:25px;line-height:1;font-weight:800;margin-bottom:6px}
      .evolucao-interferencia-card .rotulo{font-size:12px;color:#667085}
      .evolucao-interferencia-card.reduziram .numero{color:#187900}
      .evolucao-interferencia-card.mantiveram .numero{color:#667085}
      .evolucao-interferencia-card.aumentaram{border-color:rgba(253,49,5,.35)}
      .evolucao-interferencia-card.aumentaram .numero{color:#fd3105}
      .evolucao-interferencia-chartbox{height:300px;position:relative}
      .evolucao-interferencia-nota{font-size:12px;color:#667085;margin-top:10px}
      .evolucao-interferencia-rodape{margin-top:14px;padding-top:12px;border-top:1px dashed rgba(24,121,0,.28);color:#667085;font-size:12px;line-height:1.55}
      @media(max-width:760px){.evolucao-interferencia-status{grid-template-columns:1fr}.evolucao-interferencia-chartbox{height:260px}}
    `;
    document.head.appendChild(style);
  }

  function garantirBloco(){
    let bloco = document.getElementById('evolucaoInterferenciaSection');
    if(bloco) return bloco;

    const estresse = document.getElementById('evolucaoEstresseSection');
    if(!estresse) return null;

    bloco = document.createElement('div');
    bloco.id = 'evolucaoInterferenciaSection';
    bloco.className = 'section';
    bloco.innerHTML = `
      <div class="evolucao-interferencia-head">
        <div>
          <h3><span class="section-dot">◈</span>Interferência da dor no trabalho</h3>
          <div class="evolucao-interferencia-sub">Comparação individual entre a avaliação inicial e a reavaliação de 1 mês.</div>
        </div>
        <div id="evolucaoInterferenciaCobertura" class="evolucao-interferencia-cobertura">—</div>
      </div>
      <div id="evolucaoInterferenciaStatus" class="evolucao-interferencia-status"></div>
      <div class="evolucao-interferencia-chartbox"><canvas id="evolucaoInterferenciaChart"></canvas></div>
      <div id="evolucaoInterferenciaNota" class="evolucao-interferencia-nota"></div>
      <div id="evolucaoInterferenciaRodape" class="evolucao-interferencia-rodape"></div>
    `;

    estresse.insertAdjacentElement('afterend', bloco);
    return bloco;
  }

  window.renderEvolucaoInterferencia1Mes = function(){
    const bloco = garantirBloco();
    if(!bloco) return;

    garantirEstilos();

    const comparativo = obterComparativoInterferencia1Mes();
    const cobertura = document.getElementById('evolucaoInterferenciaCobertura');
    const status = document.getElementById('evolucaoInterferenciaStatus');
    const nota = document.getElementById('evolucaoInterferenciaNota');
    const rodape = document.getElementById('evolucaoInterferenciaRodape');

    cobertura.textContent = `Reavaliados: ${comparativo.totalReavaliados} de ${comparativo.totalColaboradores}`;

    if(!comparativo.totalComparaveis){
      status.innerHTML = '';
      nota.textContent = 'Ainda não há registros suficientes para comparar a interferência da dor no trabalho.';
      rodape.textContent = '';
      if(evolucaoInterferenciaChart){
        evolucaoInterferenciaChart.destroy();
        evolucaoInterferenciaChart = null;
      }
      return;
    }

    const reduziram = comparativo.pares.filter(p => p.mes1 < p.inicial);
    const mantiveram = comparativo.pares.filter(p => p.mes1 === p.inicial);
    const aumentaram = comparativo.pares.filter(p => p.mes1 > p.inicial);

    status.innerHTML = `
      <div class="evolucao-interferencia-card reduziram">
        <span class="numero">${reduziram.length}</span>
        <span class="rotulo">Reduziram a interferência no trabalho</span>
      </div>
      <div class="evolucao-interferencia-card mantiveram">
        <span class="numero">${mantiveram.length}</span>
        <span class="rotulo">Mantiveram a mesma classificação</span>
      </div>
      <div class="evolucao-interferencia-card aumentaram">
        <span class="numero">${aumentaram.length}</span>
        <span class="rotulo">Aumentaram a interferência no trabalho</span>
      </div>
    `;

    const categorias = [
      {nota:1,label:'Nunca'},
      {nota:2,label:'Às vezes'},
      {nota:3,label:'Frequentemente'},
      {nota:4,label:'Sempre'}
    ];

    const contar = (campo, valor) => comparativo.pares.filter(p => p[campo] === valor).length;

    nota.textContent = `${comparativo.totalComparaveis} dos ${comparativo.totalReavaliados} reavaliados possuem resposta comparável nos dois momentos.`;
    rodape.textContent = 'Este indicador mostra com que frequência a dor relatada interfere na atividade profissional. A redução da categoria sugere menor impacto percebido no trabalho e deve ser analisada em conjunto com intensidade da dor e demais indicadores do acompanhamento.';

    if(evolucaoInterferenciaChart) evolucaoInterferenciaChart.destroy();

    evolucaoInterferenciaChart = new Chart(document.getElementById('evolucaoInterferenciaChart'), {
      type:'bar',
      data:{
        labels:categorias.map(c => c.label),
        datasets:[
          {
            label:'Avaliação inicial',
            data:categorias.map(c => contar('inicial', c.nota)),
            backgroundColor:'rgba(253,49,5,.28)',
            borderColor:'#fd3105',
            borderWidth:1,
            borderRadius:5
          },
          {
            label:'1 mês',
            data:categorias.map(c => contar('mes1', c.nota)),
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
        plugins:{
          legend:{position:'top'},
          tooltip:{callbacks:{label:(ctx)=>`${ctx.dataset.label}: ${ctx.raw} colaborador(es)`}}
        },
        scales:{
          y:{beginAtZero:true,ticks:{precision:0}},
          x:{grid:{display:false}}
        }
      }
    });
  };
})();

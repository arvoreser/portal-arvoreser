// Módulo complementar: interpretação da evolução da dor após 1 mês
// Mantém o gráfico existente e acrescenta distribuição individual e contexto da GL.

(function(){
  function normalizarRespostaGL(valor){
    return String(valor ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  function garantirEstilosEvolucaoDetalhada(){
    if(document.getElementById('evolucaoDorDetalhadaStyles')) return;

    const style = document.createElement('style');
    style.id = 'evolucaoDorDetalhadaStyles';
    style.textContent = `
      .evolucao-dor-status{
        display:grid;
        grid-template-columns:repeat(3,minmax(0,1fr));
        gap:12px;
        margin:0 0 16px;
      }
      .evolucao-dor-status-card{
        border-radius:14px;
        padding:13px 16px;
        border:1px solid rgba(6,64,1,.10);
        background:#fff;
      }
      .evolucao-dor-status-card .numero{
        display:block;
        font-size:25px;
        line-height:1;
        font-weight:800;
        margin-bottom:6px;
      }
      .evolucao-dor-status-card .rotulo{
        font-size:12px;
        color:#667085;
      }
      .evolucao-dor-status-card.melhoraram .numero{color:#187900}
      .evolucao-dor-status-card.mantiveram .numero{color:#667085}
      .evolucao-dor-status-card.aumentaram .numero{color:#fd3105}
      .evolucao-dor-contexto{
        margin-top:14px;
        padding:14px 16px;
        border-radius:14px;
        background:#edf8ea;
        border:1px solid rgba(24,121,0,.16);
        color:#064001;
        font-size:13px;
        line-height:1.55;
      }
      .evolucao-dor-contexto strong{font-weight:800}
      .evolucao-dor-contexto .contexto-secundario{
        display:block;
        margin-top:5px;
        color:#475467;
        font-size:12px;
      }
      @media(max-width:760px){
        .evolucao-dor-status{grid-template-columns:1fr}
      }
    `;
    document.head.appendChild(style);
  }

  window.renderEvolucaoDor1Mes = function(){
    const bloco = garantirBlocoEvolucaoDor();
    if(!bloco) return;

    garantirEstilosEvolucaoDetalhada();

    const comparativo = obterComparativoDor1Mes();
    const cobertura = document.getElementById('evolucaoDorCobertura');
    const inicialEl = document.getElementById('evolucaoDorMediaInicial');
    const mes1El = document.getElementById('evolucaoDorMedia1Mes');
    const variacaoEl = document.getElementById('evolucaoDorVariacao');
    const notaEl = document.getElementById('evolucaoDorNota');

    cobertura.textContent = `Reavaliados: ${comparativo.totalReavaliados} de ${comparativo.totalColaboradores}`;

    let statusBox = document.getElementById('evolucaoDorStatus');
    if(!statusBox){
      statusBox = document.createElement('div');
      statusBox.id = 'evolucaoDorStatus';
      statusBox.className = 'evolucao-dor-status';
      const chartBox = bloco.querySelector('.evolucao-dor-chartbox');
      chartBox.parentNode.insertBefore(statusBox, chartBox);
    }

    let contexto = document.getElementById('evolucaoDorContexto');
    if(!contexto){
      contexto = document.createElement('div');
      contexto.id = 'evolucaoDorContexto';
      contexto.className = 'evolucao-dor-contexto';
      notaEl.insertAdjacentElement('afterend', contexto);
    }

    if(!comparativo.totalComparaveis || comparativo.mediaInicial === null || comparativo.media1Mes === null){
      inicialEl.textContent = '—';
      mes1El.textContent = '—';
      variacaoEl.textContent = '—';
      variacaoEl.className = 'v';
      statusBox.innerHTML = '';
      notaEl.textContent = 'Ainda não há registros suficientes para comparar a evolução da dor.';
      contexto.textContent = '';
      contexto.style.display = 'none';
      if(evolucaoDorChart){ evolucaoDorChart.destroy(); evolucaoDorChart = null; }
      return;
    }

    const inicial = comparativo.mediaInicial;
    const mes1 = comparativo.media1Mes;
    const diferenca = mes1 - inicial;

    const melhoraram = comparativo.pares.filter(p => p.mes1 < p.inicial);
    const mantiveram = comparativo.pares.filter(p => p.mes1 === p.inicial);
    const aumentaram = comparativo.pares.filter(p => p.mes1 > p.inicial);

    const reavPorId = new Map();
    (Array.isArray(DATA.reavaliacao1MesRows) ? DATA.reavaliacao1MesRows : []).forEach(row => {
      const id = String(row.ID ?? '').trim();
      if(id) reavPorId.set(id, row);
    });

    const aumentaramComPercepcaoMelhora = aumentaram.filter(p => {
      const reav = reavPorId.get(String(p.id));
      if(!reav) return false;
      const resposta = normalizarRespostaGL(reav['Exercicio de GL melhorou suas dores?']);
      return resposta === 'sim';
    });

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

    statusBox.innerHTML = `
      <div class="evolucao-dor-status-card melhoraram">
        <span class="numero">${melhoraram.length}</span>
        <span class="rotulo">Melhoraram a nota de dor</span>
      </div>
      <div class="evolucao-dor-status-card mantiveram">
        <span class="numero">${mantiveram.length}</span>
        <span class="rotulo">Mantiveram a mesma nota</span>
      </div>
      <div class="evolucao-dor-status-card aumentaram">
        <span class="numero">${aumentaram.length}</span>
        <span class="rotulo">Aumentaram a nota de dor</span>
      </div>
    `;

    notaEl.textContent = `${comparativo.totalComparaveis} dos ${comparativo.totalReavaliados} reavaliados possuem nota comparável nos dois momentos. Notas 0/10 são consideradas no cálculo.`;

    contexto.style.display = 'block';
    if(aumentaram.length){
      contexto.innerHTML = `
        <strong>${aumentaramComPercepcaoMelhora.length} dos ${aumentaram.length} colaboradores que aumentaram a nota de dor relataram que os exercícios de GL melhoraram suas dores.</strong>
        <span class="contexto-secundario">A intensidade da dor é uma medida subjetiva e pode variar conforme o momento, a rotina e outros fatores. Por isso, a evolução é interpretada em conjunto com a percepção de benefício da GL e os demais indicadores do acompanhamento.</span>
      `;
    } else {
      contexto.innerHTML = `
        <strong>Nenhum colaborador apresentou aumento da nota de dor neste comparativo.</strong>
        <span class="contexto-secundario">A evolução deve continuar sendo interpretada em conjunto com a percepção de benefício da GL e os demais indicadores do acompanhamento.</span>
      `;
    }

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
  };
})();

// Percepção de melhora das dores com os exercícios de GL após 1 mês
(function(){
  let chart = null;

  function normalizar(v){
    return String(v ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  }

  function categoria(v){
    const x = normalizar(v);
    if(!x) return null;
    if(x === 'sim') return 'Sim';
    if(x.includes('nao muito') || x.includes('não muito')) return 'Não muito';
    if(x === 'nao' || x === 'não') return 'Não';
    return null;
  }

  function obterDados(){
    const iniciais = Array.isArray(DATA.records) ? DATA.records : [];
    const reavs = Array.isArray(DATA.reavaliacao1MesRows) ? DATA.reavaliacao1MesRows : [];
    const respostas = reavs.map(r => categoria(r['Exercicio de GL melhorou suas dores?'])).filter(Boolean);
    return {
      total: iniciais.length,
      reavaliados: reavs.filter(r => String(r.ID ?? '').trim()).length,
      respostas
    };
  }

  function criarBloco(){
    let el = document.getElementById('evolucaoGLSection');
    if(el) return el;

    const interferencia = document.getElementById('evolucaoInterferenciaSection');
    if(!interferencia) return null;

    el = document.createElement('div');
    el.id = 'evolucaoGLSection';
    el.className = 'section';
    el.innerHTML = `
      <div class="ev-gl-head">
        <div>
          <h3><span class="section-dot">◈</span>Percepção de melhora com a GL</h3>
          <div class="ev-gl-sub">Percepção dos colaboradores sobre o efeito dos exercícios de ginástica laboral em suas dores após 1 mês.</div>
        </div>
        <div id="evGLCobertura" class="ev-gl-cobertura">—</div>
      </div>
      <div id="evGLCards" class="ev-gl-cards"></div>
      <div class="ev-gl-chartbox"><canvas id="evGLChart"></canvas></div>
      <div id="evGLNota" class="ev-gl-nota"></div>
      <div class="ev-gl-rodape">Este indicador representa a percepção autorreferida dos colaboradores sobre o benefício da GL. Ele complementa os indicadores de dor, regiões corporais e interferência no trabalho, sem substituir avaliação clínica individual.</div>`;

    interferencia.insertAdjacentElement('afterend', el);

    if(!document.getElementById('evGLStyles')){
      const s = document.createElement('style');
      s.id = 'evGLStyles';
      s.textContent = `#evolucaoGLSection{margin-top:22px}.ev-gl-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;flex-wrap:wrap;margin-bottom:16px}.ev-gl-head h3{margin:0}.ev-gl-sub{font-size:13px;color:#667085;margin-top:5px}.ev-gl-cobertura{font-size:13px;font-weight:700;color:#187900;background:#edf8ea;border:1px solid rgba(24,121,0,.18);padding:8px 12px;border-radius:999px}.ev-gl-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:18px}.ev-gl-card{border-radius:14px;padding:14px 16px;border:1px solid rgba(6,64,1,.10);background:#fff}.ev-gl-card .numero{display:block;font-size:26px;line-height:1;font-weight:800;margin-bottom:7px}.ev-gl-card .rotulo{font-size:12px;color:#667085}.ev-gl-card.sim .numero{color:#187900}.ev-gl-card.parcial .numero{color:#ff8200}.ev-gl-card.nao .numero{color:#fd3105}.ev-gl-chartbox{height:270px;position:relative}.ev-gl-nota{font-size:12px;color:#667085;margin-top:10px}.ev-gl-rodape{margin-top:14px;padding-top:12px;border-top:1px dashed rgba(24,121,0,.28);color:#667085;font-size:12px;line-height:1.55}@media(max-width:760px){.ev-gl-cards{grid-template-columns:1fr}.ev-gl-chartbox{height:300px}}`;
      document.head.appendChild(s);
    }
    return el;
  }

  window.renderEvolucaoGL1Mes = function(){
    if(!criarBloco()) return;
    const d = obterDados();
    const sim = d.respostas.filter(x => x === 'Sim').length;
    const parcial = d.respostas.filter(x => x === 'Não muito').length;
    const nao = d.respostas.filter(x => x === 'Não').length;
    const validas = d.respostas.length;
    const pctBeneficio = validas ? Math.round(((sim + parcial) / validas) * 100) : 0;

    document.getElementById('evGLCobertura').textContent = `Reavaliados: ${d.reavaliados} de ${d.total}`;
    document.getElementById('evGLCards').innerHTML = `
      <div class="ev-gl-card sim"><span class="numero">${sim}</span><span class="rotulo">Relataram melhora das dores com a GL</span></div>
      <div class="ev-gl-card parcial"><span class="numero">${parcial}</span><span class="rotulo">Relataram melhora parcial</span></div>
      <div class="ev-gl-card nao"><span class="numero">${nao}</span><span class="rotulo">Não perceberam melhora das dores</span></div>`;
    document.getElementById('evGLNota').textContent = validas ? `${sim + parcial} de ${validas} respostas válidas (${pctBeneficio}%) indicam alguma percepção de melhora das dores com os exercícios de GL.` : 'Ainda não há respostas válidas para este indicador.';

    if(chart) chart.destroy();
    chart = new Chart(document.getElementById('evGLChart'), {
      type:'bar',
      data:{labels:['Sim','Não muito','Não'],datasets:[{label:'Colaboradores',data:[sim,parcial,nao],backgroundColor:['rgba(23,250,3,.25)','rgba(255,130,0,.28)','rgba(253,49,5,.25)'],borderColor:['#187900','#ff8200','#fd3105'],borderWidth:1,borderRadius:6}]},
      options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.raw} colaborador(es)`}}},scales:{y:{beginAtZero:true,ticks:{precision:0}},x:{grid:{display:false}}}}
    });
  };
})();
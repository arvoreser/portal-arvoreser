// Inicialização do dashboard

(function carregarEstiloRegiao(){
  if(document.querySelector('link[data-region-detail-style]')) return;
  const link=document.createElement('link');
  link.rel='stylesheet';
  link.href='css/region-detail.css?v=20260817-2359';
  link.setAttribute('data-region-detail-style','true');
  document.head.appendChild(link);
})();

function carregarScriptModulo(src, atributo, valor) {
  return new Promise((resolve, reject) => {
    const seletor = `script[${atributo}="${valor}"]`;
    const existente = document.querySelector(seletor);
    if(existente) {
      if(existente.dataset.carregado === 'true') return resolve();
      existente.addEventListener('load', () => resolve(), { once:true });
      existente.addEventListener('error', () => reject(new Error(`Não foi possível carregar ${valor}.`)), { once:true });
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.setAttribute(atributo, valor);
    script.onload = () => { script.dataset.carregado = 'true'; resolve(); };
    script.onerror = () => reject(new Error(`Não foi possível carregar ${valor}.`));
    document.head.appendChild(script);
  });
}

function carregarScriptSeFaltar(src, teste, nome) {
  if(teste()) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.dataset.coreModulo = nome;
    script.onload = () => teste() ? resolve() : reject(new Error(`O módulo ${nome} foi carregado, mas não ficou disponível.`));
    script.onerror = () => reject(new Error(`Não foi possível carregar o módulo ${nome}.`));
    document.head.appendChild(script);
  });
}

async function garantirModulosEssenciais() {
  await carregarScriptSeFaltar('js/modules/colaboradores.js?v=20260817-2320', () => typeof window.renderDashboard === 'function', 'colaboradores');
  await carregarScriptSeFaltar('js/modules/observacoes.js?v=20260817-2320', () => typeof window.renderObsHistory === 'function', 'observacoes');
  await carregarScriptSeFaltar('js/modules/youtube.js?v=20260817-2320', () => typeof window.updateYoutubeLink === 'function', 'youtube');
  await carregarScriptSeFaltar('js/modules/biblioteca.js?v=20260817-2320', () => typeof window.renderBiblioteca === 'function', 'biblioteca');
  await carregarScriptSeFaltar('js/modules/exercicios.js?v=20260817-2320', () => typeof window.renderExerciciosAplicados === 'function', 'exercicios');
  await carregarScriptSeFaltar('js/modules/diario.js?v=20260817-2320', () => typeof window.renderDiario === 'function', 'diario');
}

async function carregarModulosEvolucao() {
  await carregarScriptModulo('js/modules/evolucao-dor.js?v=20260817-2249','data-modulo','evolucao-dor');
  await carregarScriptModulo('js/modules/evolucao-regioes.js?v=20260817-2358','data-modulo','evolucao-regioes');
  await carregarScriptModulo('js/modules/evolucao-estresse.js?v=20260817-2258','data-modulo','evolucao-estresse');
  await carregarScriptModulo('js/modules/evolucao-interferencia.js?v=20260817-2304','data-modulo','evolucao-interferencia');
  await carregarScriptModulo('js/modules/evolucao-gl.js?v=20260817-2328','data-modulo','evolucao-gl');
  await carregarScriptModulo('js/modules/setor-reavaliacao.js?v=20260817-2358','data-modulo','setor-reavaliacao');
  await carregarScriptModulo('js/modules/evolucao-click-nomes.js?v=20260818-0015','data-modulo','evolucao-click-nomes');
}

function renderResumoComparativo1Mes(){
  const reavs=Array.isArray(DATA.reavaliacao1MesRows)?DATA.reavaliacao1MesRows.filter(r=>String(r.ID??'').trim()):[];
  if(!reavs.length) return;

  const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
  const temDor=v=>{ const x=norm(v); return x==='sim'||x.startsWith('sim '); };
  const nota=v=>{ const m=String(v??'').replace(',','.').match(/-?\d+(?:\.\d+)?/); if(!m)return 0; const n=Number(m[0]); return Number.isFinite(n)?n:0; };

  const comDor1=reavs.filter(r=>temDor(r['Resposta original sobre dor'])).length;
  const notasSintomaticos=reavs.filter(r=>temDor(r['Resposta original sobre dor'])).map(r=>nota(r['Nota da dor'])).filter(n=>n>0);
  const media1=notasSintomaticos.length ? (notasSintomaticos.reduce((a,b)=>a+b,0)/notasSintomaticos.length).toFixed(1).replace('.',',') : '—';
  const dorAlta1=reavs.filter(r=>nota(r['Nota da dor'])>=7).length;

  const valor=(inicial,mes1)=>`<span>${inicial}</span><span style="color:#98a2b3;font-weight:600;margin:0 8px">/</span><span style="color:#187900">${mes1}</span>`;

  const comDor=document.getElementById('comDorMetric');
  const media=document.getElementById('mediaDorMetric');
  const alta=document.getElementById('prioritariosMetric');

  if(comDor) comDor.innerHTML=valor(DATA.summary.comDor,comDor1);
  if(media) media.innerHTML=valor(DATA.summary.dorMedia,media1);
  if(alta) alta.innerHTML=valor(DATA.summary.prioritarios,dorAlta1);
}

async function init() {
  await carregarConfiguracaoEmpresa();
  document.title = `${EMPRESA.nome} | ArvoreSer Saúde Corporativa`;
  const companyName = document.getElementById('companyName');
  if(companyName) companyName.textContent = EMPRESA.nome;

  await carregarDadosEmpresa();
  await garantirModulosEssenciais();
  await carregarModulosEvolucao();

  renderDashboard();
  renderResumoComparativo1Mes();
  renderList();
  renderPerson();
  renderCharts();
  if(typeof window.ativarCliqueReavaliacaoSetor === 'function') window.ativarCliqueReavaliacaoSetor();

  if(typeof window.renderEvolucaoRegioes1Mes === 'function') window.renderEvolucaoRegioes1Mes();
  if(typeof window.renderEvolucaoEstresse1Mes === 'function') window.renderEvolucaoEstresse1Mes();
  if(typeof window.renderEvolucaoInterferencia1Mes === 'function') window.renderEvolucaoInterferencia1Mes();
  if(typeof window.renderEvolucaoGL1Mes === 'function') window.renderEvolucaoGL1Mes();
  if(typeof window.ativarCliquesNomesEvolucao === 'function') window.ativarCliquesNomesEvolucao();

  preencherFiltroRegioes();
  renderBiblioteca();
  renderExerciciosAplicados();
  renderDiario();
}

init().catch(error => {
  console.error(error);
  const escapar = typeof window.esc === 'function' ? window.esc : (v => String(v ?? ''));
  document.body.innerHTML = `<div style="font-family:Arial,sans-serif;padding:40px;max-width:760px;margin:auto"><h1>Não foi possível abrir a empresa</h1><p>${escapar(error.message)}</p><p>Confirme a configuração da empresa e a implantação do Apps Script.</p></div>`;
});
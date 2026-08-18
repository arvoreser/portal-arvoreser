// Inicialização do dashboard

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

async function carregarModulosEvolucao() {
  await carregarScriptModulo('js/modules/evolucao-dor.js?v=20260817-2249','data-modulo','evolucao-dor');
  await carregarScriptModulo('js/modules/evolucao-estresse.js?v=20260817-2258','data-modulo','evolucao-estresse');
  await carregarScriptModulo('js/modules/evolucao-interferencia.js?v=20260817-2304','data-modulo','evolucao-interferencia');
}

async function init() {
  await carregarConfiguracaoEmpresa();
  document.title = `${EMPRESA.nome} | ArvoreSer Saúde Corporativa`;
  const companyName = document.getElementById("companyName");
  if(companyName) companyName.textContent = EMPRESA.nome;
  await carregarDadosEmpresa();
  await carregarModulosEvolucao();
  renderDashboard();
  renderList();
  renderPerson();
  renderCharts();
  if(typeof window.renderEvolucaoEstresse1Mes === 'function') window.renderEvolucaoEstresse1Mes();
  if(typeof window.renderEvolucaoInterferencia1Mes === 'function') window.renderEvolucaoInterferencia1Mes();
  preencherFiltroRegioes();
  renderBiblioteca();
  renderExerciciosAplicados();
  renderDiario();
}
init().catch(error => {
  console.error(error);
  document.body.innerHTML = `<div style="font-family:Arial,sans-serif;padding:40px;max-width:760px;margin:auto"><h1>Não foi possível abrir a empresa</h1><p>${esc(error.message)}</p><p>Confirme a configuração da empresa e a implantação do Apps Script.</p></div>`;
});
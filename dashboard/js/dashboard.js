// Inicialização do dashboard

function carregarModuloEvolucaoDor() {
  return new Promise((resolve, reject) => {
    const existente = document.querySelector('script[data-modulo="evolucao-dor"]');
    if(existente) {
      if(existente.dataset.carregado === 'true') return resolve();
      existente.addEventListener('load', () => resolve(), { once:true });
      existente.addEventListener('error', () => reject(new Error('Não foi possível carregar o módulo de evolução da dor.')), { once:true });
      return;
    }

    const script = document.createElement('script');
    script.src = 'js/modules/evolucao-dor.js?v=20260817-2249';
    script.dataset.modulo = 'evolucao-dor';
    script.onload = () => {
      script.dataset.carregado = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('Não foi possível carregar o módulo de evolução da dor.'));
    document.head.appendChild(script);
  });
}

async function init() {
  await carregarConfiguracaoEmpresa();

  document.title = `${EMPRESA.nome} | ArvoreSer Saúde Corporativa`;
  const companyName = document.getElementById("companyName");
  if(companyName) companyName.textContent = EMPRESA.nome;

  await carregarDadosEmpresa();
  await carregarModuloEvolucaoDor();
  renderDashboard();
  renderList();
  renderPerson();
  renderCharts();
  preencherFiltroRegioes();
  renderBiblioteca();
  renderExerciciosAplicados();
  renderDiario();
}
init().catch(error => {
  console.error(error);
  document.body.innerHTML = `
    <div style="font-family:Arial,sans-serif;padding:40px;max-width:760px;margin:auto">
      <h1>Não foi possível abrir a empresa</h1>
      <p>${esc(error.message)}</p>
      <p>Confirme a configuração da empresa e a implantação do Apps Script.</p>
    </div>
  `;
});

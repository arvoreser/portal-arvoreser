// Inicialização do dashboard

async function init() {
  await carregarConfiguracaoEmpresa();

  document.title = `${EMPRESA.nome} | ArvoreSer Saúde Corporativa`;
  const companyName = document.getElementById("companyName");
  if(companyName) companyName.textContent = EMPRESA.nome;

  await carregarDadosEmpresa();
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

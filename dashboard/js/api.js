// Comunicação com a configuração da empresa e com o Apps Script

const EMPRESA_ID = new URLSearchParams(window.location.search).get("empresa") || "aladim";
let EMPRESA = null;
let APPS_SCRIPT_URL = "";

function carregarConfiguracaoEmpresa() {
  return new Promise((resolve, reject) => {
    const arquivo = document.createElement("script");
    arquivo.src = `../empresas/${encodeURIComponent(EMPRESA_ID)}.js`;

    arquivo.onload = () => {
      if (!window.EMPRESA_CONFIG) {
        reject(new Error(`Configuração da empresa "${EMPRESA_ID}" não encontrada.`));
        return;
      }

      EMPRESA = window.EMPRESA_CONFIG;
      APPS_SCRIPT_URL = EMPRESA.appsScriptUrl;
      resolve();
    };

    arquivo.onerror = () => {
      reject(new Error(`Não foi possível abrir a configuração da empresa "${EMPRESA_ID}".`));
    };

    document.head.appendChild(arquivo);
  });
}
function carregarDadosViaAppsScript() {
  return new Promise((resolve, reject) => {
    const callbackName = 'cbData_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    const script = document.createElement('script');

    const limpar = () => {
      try {
        delete window[callbackName];
        script.remove();
      } catch(e) {}
    };

    window[callbackName] = function(resp) {
      limpar();

      if (!resp || resp.status === 'erro') {
        reject(new Error(resp?.message || 'Não foi possível carregar os dados da empresa.'));
        return;
      }

      resolve(resp.dados || resp);
    };

    script.src = `${APPS_SCRIPT_URL}?action=data&callback=${callbackName}&_=${Date.now()}`;
    script.onerror = function() {
      limpar();
      reject(new Error('Falha de comunicação com o Apps Script da empresa.'));
    };

    document.body.appendChild(script);
  });
}

function processarDadosRecebidos(dados) {
  const colaboradores = Array.isArray(dados.colaboradores) ? dados.colaboradores : [];
  const avaliacao = Array.isArray(dados.avaliacao) ? dados.avaliacao : [];
  const observacoes = Array.isArray(dados.observacoes) ? dados.observacoes : [];
  const diario = Array.isArray(dados.diario) ? dados.diario : [];
  const biblioteca = Array.isArray(dados.biblioteca) ? dados.biblioteca : [];
  const exerciciosAplicados = Array.isArray(dados.exerciciosAplicados)
    ? dados.exerciciosAplicados
    : [];

  DATA.bibliotecaRows = biblioteca;
  DATA.diarioRows = diario;
  DATA.exerciciosAplicadosRows = exerciciosAplicados;
  DATA.obsRows = observacoes;

  const avalById = {};
  avaliacao.forEach(a => {
    avalById[String(a.ID ?? '').trim()] = a;
  });

  const rows = colaboradores.map(c => {
    const id = String(c.ID ?? '').trim();
    return Object.assign({}, c, avalById[id] || {});
  });

  recalcularDados(rows.map(normalizeRow));
}

async function carregarDadosEmpresa() {
  const status = document.getElementById('syncStatus');

  try {
    const dados = await carregarDadosViaAppsScript();
    processarDadosRecebidos(dados);

    if(status) status.textContent = 'Dados carregados pelo Apps Script.';
  } catch(err) {
    if(status) status.textContent = 'Erro ao carregar dados.';
    console.error(err);
    throw err;
  }
}

async function salvarNoGoogleSheets(tipo, id, valor, nome = '', setor = '', extra = {}) {
  const payload = { tipo, id, valor, nome, setor, ...extra };

  return new Promise((resolve, reject) => {
    const callbackName = 'cbSave_' + Date.now() + '_' + Math.floor(Math.random() * 1000000);
    const script = document.createElement('script');

    window[callbackName] = function(resp) {
      try {
        delete window[callbackName];
        script.remove();
      } catch(e) {}

      if (resp && resp.status === 'erro') {
        reject(resp);
      } else {
        resolve(resp || { status: 'ok' });
      }
    };

    script.src = `${APPS_SCRIPT_URL}?action=save&callback=${callbackName}&payload=${encodeURIComponent(JSON.stringify(payload))}&_=${Date.now()}`;
    script.onerror = function() {
      try {
        delete window[callbackName];
        script.remove();
      } catch(e) {}
      reject({ status:'erro', message:'Falha de comunicação com o Google Sheets.' });
    };

    document.body.appendChild(script);
  });
}


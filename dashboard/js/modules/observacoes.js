// Módulo: observacoes

function renderObsHistory(id) {
  const el = document.getElementById('obsHistory');
  if(!el) return;
  const itens = (DATA.obsRows || [])
    .filter(o => String(o.ID).trim() === String(id))
    .reverse();

  if(!itens.length) {
    el.innerHTML = '<div class="small">Nenhuma observação registrada ainda.</div>';
    return;
  }

  el.innerHTML = itens.map(o => {
    const dataHora = o['Data e hora'] || o['Data/hora'] || o['Data Hora'] || o['Data'] || '';
    const texto = o['Comentário'] || o['Comentario'] || o['Observação'] || o['Observacao'] || '';
    return `
      <div class="obs-item">
        <div class="obs-meta">${esc(dataHora)}</div>
        <div class="obs-text">${esc(texto)}</div>
      </div>
    `;
  }).join('');
}

async function saveObsFisio() {
  if(!selected) return;
  const txt = document.getElementById('observacaoFisioInput').value.trim();
  if(!txt) return;

  document.getElementById('obsStatus').textContent = 'Salvando...';

  await salvarNoGoogleSheets(
    'observacao',
    selected.id,
    txt,
    selected.nome,
    selected.setor
  );

  const agora = new Date().toLocaleString('pt-BR');
  if(!DATA.obsRows) DATA.obsRows = [];
  DATA.obsRows.push({
    'Data e hora': agora,
    'ID': selected.id,
    'Nome completo': selected.nome,
    'Setor': selected.setor,
    'Comentário': txt
  });

  document.getElementById('observacaoFisioInput').value = '';
  renderObsHistory(selected.id);
  document.getElementById('obsStatus').textContent = 'Observação salva na planilha.';
}


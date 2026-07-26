// Módulo: biblioteca

function preencherFiltroRegioes() {
  const selectRegiao = document.getElementById('regionFilter');
  const selectCategoria = document.getElementById('categoryFilter');
  const regioes = [...new Set((DATA.bibliotecaRows || []).map(e => norm(e['Região'])).filter(r => r && r !== 'Não informado'))]
    .sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));
  const categorias = [...new Set((DATA.bibliotecaRows || []).map(e => norm(e['Categoria'])).filter(c => c && c !== 'Não informado'))]
    .sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));

  if(selectRegiao){
    const atual = selectRegiao.value;
    selectRegiao.innerHTML = '<option value="">Todas as regiões</option>' + regioes.map(r => `<option value="${esc(r)}">${esc(r)}</option>`).join('');
    if(regioes.includes(atual)) selectRegiao.value = atual;
  }
  if(selectCategoria){
    const atual = selectCategoria.value;
    selectCategoria.innerHTML = '<option value="">Todas as categorias</option>' + categorias.map(c => `<option value="${esc(c)}">${esc(c)}</option>`).join('');
    if(categorias.includes(atual)) selectCategoria.value = atual;
  }
}

function renderBiblioteca() {
  const list = document.getElementById('exerciseList');
  if(!list) return;

  const regiao = document.getElementById('regionFilter') ? document.getElementById('regionFilter').value : '';
  const categoria = document.getElementById('categoryFilter') ? document.getElementById('categoryFilter').value : '';

  let itens = DATA.bibliotecaRows || [];

  itens = itens.filter(e => {
    const reg = norm(e['Região']);
    const cat = norm(e['Categoria']);
    const passaRegiao = !regiao || reg === regiao;
    const passaCategoria = !categoria || cat === categoria;
    return passaRegiao && passaCategoria;
  });

  if(!itens.length) {
    list.innerHTML = '<div class="empty-library">Nenhum exercício encontrado.</div>';
    return;
  }

  list.innerHTML = itens.map((e,index) => {
    const nome = norm(e['Exercício']);
    const reg = norm(e['Região']);
    const desc = norm(e['Descrição']);
    const link = norm(e['Link']);
    const hasLink = link !== 'Não informado';

    return `
      <div class="exercise-compact ${index % 2 === 0 ? 'tone-yellow' : 'tone-blue'}">
        <div class="exercise-compact-content">
          <div class="exercise-compact-title">
            ${esc(nome)} <span class="exercise-separator">•</span> <span class="exercise-compact-region">${esc(reg)}</span>
          </div>
          <div class="exercise-compact-desc">${esc(desc)}</div>
        </div>
        ${hasLink ? `<a class="exercise-compact-link" href="${esc(link)}" target="_blank" aria-label="Abrir vídeo">Abrir</a>` : ''}
      </div>
    `;
  }).join('');
}


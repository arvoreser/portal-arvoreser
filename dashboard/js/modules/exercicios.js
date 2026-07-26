// Módulo: exercicios

function descricaoExercicio(nome){
  const item = (DATA.bibliotecaRows || []).find(e => norm(e['Exercício']) === nome);
  if(!item) return '';
  const desc = norm(item['Descrição']);
  return desc !== 'Não informado' ? desc : '';
}

function dataApenasDia(valor){
  const s = norm(valor);
  const m = s.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
  return m ? m[1] : s;
}

function splitListaExercicios(valor){
  const s=norm(valor);
  if(!s || s==='Não informado') return [];
  return s.split(/\s*\|\s*|\s*;\s*|\s*,\s*/).map(x=>norm(x)).filter(x=>x && x!=='Não informado');
}

function getExerciciosDaSessao(row){
  const listaNomes=splitListaExercicios(row['Exercícios']);
  if(listaNomes.length) return listaNomes;

  const antigo=norm(row['Exercício']);
  if(antigo && antigo!=='Não informado') return [antigo];

  const ids=splitListaExercicios(row['ID Exercícios']);
  return ids.map(id=>{
    const item=(DATA.bibliotecaRows||[]).find(e=>norm(e['ID'])===id || norm(e['Exercício'])===id);
    return item ? norm(item['Exercício']) : id;
  }).filter(Boolean);
}

function getIdsDosExercicios(nomes){
  return (nomes||[]).map(nome=>{
    const item=(DATA.bibliotecaRows||[]).find(e=>norm(e['Exercício'])===nome);
    const id=item ? norm(item['ID']) : '';
    return id && id!=='Não informado' ? id : nome;
  });
}

function getExercicioAplicado(row){const arr=getExerciciosDaSessao(row);return arr[0]||'Não informado';}

function formatMonthYear(date){const meses=['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];return `${meses[date.getMonth()]}/${date.getFullYear()}`;}

function addMonths(date,months){return new Date(date.getFullYear(),date.getMonth()+months,1);}

function parseBRDateLike(v){if(!v)return null;const s=String(v).trim();const m=s.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);if(m)return new Date(Number(m[3]),Number(m[2])-1,Number(m[1]));const d=new Date(s);return isNaN(d.getTime())?null:d;}

function ultimaAplicacao(exercicio,grupo,periodo){
  const rows=(DATA.exerciciosAplicadosRows||[])
    .filter(r=>norm(r['Grupo'])===grupo && getExerciciosDaSessao(r).includes(exercicio))
    .map(r=>({...r,_date:parseBRDateLike(r['Data'])}))
    .filter(r=>r._date)
    .sort((a,b)=>b._date-a._date);
  return rows[0]||null;
}

function estaBloqueado(exercicio,grupo,periodo){
  const last=ultimaAplicacao(exercicio,grupo,periodo);
  if(!last)return {blocked:false};

  if(editingExerciseSession &&
     editingExerciseSession.grupo===grupo &&
     editingExerciseSession.periodo===periodo &&
     (editingExerciseSession.exercicios||[]).includes(exercicio)){
    return {blocked:false};
  }

  const liberacao=addMonths(last._date,2);
  const hoje=new Date();
  const blocked=new Date(hoje.getFullYear(),hoje.getMonth(),1)<new Date(liberacao.getFullYear(),liberacao.getMonth(),1);
  return {blocked,liberacao,last};
}

function getSelectedExerciseNames(){return Array.from(selectedExerciseNames);}

function updateSelectedExercises(){
  document.querySelectorAll('.ex-check').forEach(i=>{
    if(i.checked) selectedExerciseNames.add(i.value);
    else selectedExerciseNames.delete(i.value);
  });
  const el=document.getElementById('exSelectedList');
  if(!el)return;
  const names=getSelectedExerciseNames();
  el.innerHTML=names.length?names.map(n=>`<span class="ex-chip">${esc(n)}</span>`).join(''):'<span class="small">Nenhum exercício selecionado.</span>';
}

function trocarContextoExercicios(){
  editingExerciseSession=null;
  selectedExerciseNames.clear();
  const filtro=document.getElementById('exRegionFilter');
  if(filtro) filtro.value='';
  const filtroCategoria=document.getElementById('exCategoryFilter');
  if(filtroCategoria) filtroCategoria.value='';
  renderExerciciosAplicados();
}

function preencherFiltrosAplicados(){
  const selectRegiao=document.getElementById('exRegionFilter');
  const selectCategoria=document.getElementById('exCategoryFilter');
  const regioes=[...new Set((DATA.bibliotecaRows||[]).map(e=>norm(e['Região'])).filter(r=>r&&r!=='Não informado'))]
    .sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));
  const categorias=[...new Set((DATA.bibliotecaRows||[]).map(e=>norm(e['Categoria'])).filter(c=>c&&c!=='Não informado'))]
    .sort((a,b)=>a.localeCompare(b,'pt-BR',{sensitivity:'base'}));

  if(selectRegiao){
    const atual=selectRegiao.value;
    selectRegiao.innerHTML='<option value="">Todas as regiões</option>'+regioes.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('');
    if(regioes.includes(atual))selectRegiao.value=atual;
  }
  if(selectCategoria){
    const atual=selectCategoria.value;
    selectCategoria.innerHTML='<option value="">Todas as categorias</option>'+categorias.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');
    if(categorias.includes(atual))selectCategoria.value=atual;
  }
}

function renderExerciciosAplicados(){
  const grupo=document.getElementById('exGrupo')?.value||'Escritório';
  const periodo=document.getElementById('exPeriodo')?.value||'Manhã';
  const lib=document.getElementById('exLibraryList');
  if(!lib)return;
  preencherFiltrosAplicados();
  const regiaoFiltro=document.getElementById('exRegionFilter')?.value||'';
  const categoriaFiltro=document.getElementById('exCategoryFilter')?.value||'';

  document.body.classList.toggle('edit-mode', !!editingExerciseSession);

  const alertBox=document.getElementById('exEditingAlert');
  if(alertBox){
    alertBox.innerHTML=editingExerciseSession
      ? `<div class="ex-editing-alert">✏️ Editando sessão de ${esc(editingExerciseSession.data)} • ${esc(editingExerciseSession.grupo)} • ${esc(editingExerciseSession.periodo)}<br><span style="font-weight:600">Desmarque exercícios para remover ou marque novos para acrescentar.</span></div>`
      : '';
  }

  lib.innerHTML=(DATA.bibliotecaRows||[]).filter(e=>(!regiaoFiltro||norm(e['Região'])===regiaoFiltro)&&(!categoriaFiltro||norm(e['Categoria'])===categoriaFiltro)).map(e=>{
    const nome=norm(e['Exercício']);
    const reg=norm(e['Região']);
    const desc=norm(e['Descrição']);
    const link=norm(e['Link']);
    const block=estaBloqueado(nome,grupo,periodo);
    const checked=selectedExerciseNames.has(nome) || (editingExerciseSession &&
      editingExerciseSession.grupo===grupo &&
      editingExerciseSession.periodo===periodo &&
      (editingExerciseSession.exercicios||[]).includes(nome));

    return `<label class="ex-check-card ${block.blocked?'blocked':''}">
      <input class="ex-check" type="checkbox" value="${esc(nome)}" onchange="updateSelectedExercises()" ${block.blocked?'disabled':''} ${checked?'checked':''}>
      <div>
        <div class="ex-name">${esc(nome)}</div>
        <div class="ex-region">📍 ${esc(reg)}</div>
        <div class="ex-desc">${esc(desc)}</div>
        ${link!=='Não informado'?`<div><a class="exercise-link" href="${esc(link)}" target="_blank">▶ Abrir vídeo</a></div>`:''}
        ${block.blocked?`<div class="ex-block">🔒 Disponível em ${formatMonthYear(block.liberacao)}</div>`:''}
      </div>
    </label>`;
  }).join('')||'<div class="empty-library">Nenhum exercício cadastrado na biblioteca.</div>';

  updateSelectedExercises();
  renderExHistory(grupo,periodo);
}

function renderExHistory(grupo,periodo){
  const el=document.getElementById('exHistory');
  if(!el)return;

  const rows=(DATA.exerciciosAplicadosRows||[])
    .filter(r=>norm(r['Grupo'])===grupo&&norm(r['Período'])===periodo);

  if(!rows.length){
    el.innerHTML='<div class="small">Nenhuma sessão registrada para este grupo/período.</div>';
    return;
  }

  const grouped={};
  rows.forEach(r=>{
    const key=dataApenasDia(r['Data']);
    if(!grouped[key]) grouped[key]=[];
    grouped[key].push(...getExerciciosDaSessao(r));
  });

  el.innerHTML=Object.entries(grouped).reverse().map(([data,exs])=>{
    const unique=[...new Set(exs)];
    const chips=unique.map(ex=>`<span class="ex-history-chip" title="${esc(descricaoExercicio(ex))}">${esc(ex)}</span>`).join('');
    return `<div class="ex-history-item">
      <div class="ex-history-date">${esc(data)} • ${esc(periodo)}</div>
      <div class="ex-history-list">${chips}</div>
      <div class="ex-history-actions">
        <button class="ex-edit-btn" onclick="editarSessaoExercicios('${esc(data)}','${esc(grupo)}','${esc(periodo)}')">✏️ Editar</button>
      </div>
    </div>`;
  }).join('');
}

function editarSessaoExercicios(data,grupo,periodo){
  const exercicios=(DATA.exerciciosAplicadosRows||[])
    .filter(r=>dataApenasDia(r['Data'])===data&&norm(r['Grupo'])===grupo&&norm(r['Período'])===periodo)
    .flatMap(r=>getExerciciosDaSessao(r));

  editingExerciseSession={data,grupo,periodo,exercicios:[...new Set(exercicios)]};
  selectedExerciseNames=new Set(editingExerciseSession.exercicios);
  document.getElementById('exGrupo').value=grupo;
  document.getElementById('exPeriodo').value=periodo;
  document.getElementById('exStatus').textContent='';
  renderExerciciosAplicados();
  document.getElementById('exEditingAlert')?.scrollIntoView({behavior:'smooth',block:'center'});
}

function cancelarEdicaoExercicios(){
  editingExerciseSession=null;
  selectedExerciseNames.clear();
  document.getElementById('exStatus').textContent='';
  renderExerciciosAplicados();
}

async function deletarSessaoEmEdicao(){
  if(!editingExerciseSession)return;
  const dataSessao=editingExerciseSession.data;
  const grupo=editingExerciseSession.grupo;
  const periodo=editingExerciseSession.periodo;

  if(!confirm('Deseja deletar esta sessão inteira?'))return;

  const status=document.getElementById('exStatus');
  status.textContent='Deletando...';

  try{
    await salvarNoGoogleSheets('exerciciosSessao','','','','',{grupo,periodo,dataSessao,exercicios:[],ids:[]});

    DATA.exerciciosAplicadosRows=(DATA.exerciciosAplicadosRows||[])
      .filter(r=>!(dataApenasDia(r['Data'])===dataSessao&&norm(r['Grupo'])===grupo&&norm(r['Período'])===periodo));

    editingExerciseSession=null;
    selectedExerciseNames.clear();
    status.textContent='Sessão deletada.';
    renderExerciciosAplicados();
  }catch(err){
    console.error(err);
    status.textContent='Erro ao deletar.';
    alert('Erro ao deletar no Google Sheets. Confira a implantação do Apps Script.');
  }
}

async function salvarSessaoExercicios(){
  const grupo=document.getElementById('exGrupo').value;
  const periodo=document.getElementById('exPeriodo').value;
  const exercicios=getSelectedExerciseNames();
  const ids=getIdsDosExercicios(exercicios);
  const status=document.getElementById('exStatus');

  if(!exercicios.length){
    status.textContent='Selecione pelo menos um exercício.';
    return;
  }

  const dataSessao=editingExerciseSession ? editingExerciseSession.data : new Date().toLocaleDateString('pt-BR');
  status.textContent='Salvando...';

  try{
    await salvarNoGoogleSheets('exerciciosSessao','','','','',{grupo,periodo,dataSessao,exercicios,ids});

    DATA.exerciciosAplicadosRows=(DATA.exerciciosAplicadosRows||[])
      .filter(r=>!(dataApenasDia(r['Data'])===dataSessao&&norm(r['Grupo'])===grupo&&norm(r['Período'])===periodo));

    DATA.exerciciosAplicadosRows.push({
      'Data':dataSessao,
      'Grupo':grupo,
      'Período':periodo,
      'ID Exercícios':ids.join(';'),
      'Exercícios':exercicios.join(' | ')
    });

    editingExerciseSession=null;
    selectedExerciseNames.clear();
    status.textContent='Sessão salva.';
    renderExerciciosAplicados();
  }catch(err){
    console.error(err);
    status.textContent='Erro ao salvar.';
    alert('Erro ao salvar no Google Sheets. Confira a implantação do Apps Script.');
  }
}


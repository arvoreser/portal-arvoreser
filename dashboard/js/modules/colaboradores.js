// Módulo: colaboradores

function renderDashboard() {
  document.getElementById('dashboardSubtitle').textContent = `${DATA.summary.total} colaboradores`;
  document.getElementById('comDorMetric').textContent = DATA.summary.comDor;
  document.getElementById('mediaDorMetric').textContent = DATA.summary.dorMedia;
  document.getElementById('prioritariosMetric').textContent = DATA.summary.prioritarios;

  const executiveBody = document.getElementById('executiveBody');
  if(executiveBody) {
    const executiveSection = executiveBody.closest('.section');
    if(executiveSection) executiveSection.remove();
  }
}

function renderList() {
  const el = document.getElementById('peopleList');
  el.innerHTML = '';
  DATA.records.forEach(r => {
    const div = document.createElement('div');
    div.className = 'person' + (selected && selected.id === r.id ? ' active' : '');
    const partes = String(r.nome || '').trim().split(/\s+/).filter(Boolean);
    const iniciais = ((partes[0] || '').charAt(0) + (partes.length > 1 ? partes[partes.length - 1].charAt(0) : '')).toUpperCase();
    div.dataset.initials = iniciais || '•';
    div.textContent = r.nome;
    div.onclick = () => {
      selected = r;
      renderList();
      showView('individual');
      renderPerson();
    };
    el.appendChild(div);
  });
}

function showView(v) {
  document.getElementById('dashboardView').classList.toggle('hidden', v !== 'dashboard');
  document.getElementById('individualView').classList.toggle('hidden', v !== 'individual');
  document.getElementById('bibliotecaView').classList.toggle('hidden', v !== 'biblioteca');
  document.getElementById('exerciciosView').classList.toggle('hidden', v !== 'exercicios');
  document.getElementById('diarioView').classList.toggle('hidden', v !== 'diario');

  document.querySelectorAll('.tab').forEach((t,i)=>t.classList.toggle('active',
    (v==='dashboard'&&i===0) ||
    (v==='diario'&&i===1) ||
    (v==='biblioteca'&&i===2) ||
    (v==='exercicios'&&i===3)
  ));

  if(v === 'individual') renderPerson();
  if(v === 'biblioteca') renderBiblioteca();
  if(v === 'exercicios') renderExerciciosAplicados();
  if(v === 'diario') renderDiario();
}

function info(k,v) {
  return `<div class="info"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`;
}

function assessmentItem(k,v,options={}) {
  const classes = ['assessment-item'];
  if(options.wide) classes.push('wide');
  if(options.important) classes.push('important');
  if(options.highlight) classes.push('highlight-' + options.highlight);
  return `<div class="${classes.join(' ')}"><div class="k">${esc(k)}</div><div class="v">${esc(v)}</div></div>`;
}

function assessmentGroup(title,icon,theme,items) {
  return `<section class="assessment-group ${theme}">
    <h3 class="assessment-group-title"><span class="group-icon">${icon}</span>${esc(title)}</h3>
    <div class="assessment-grid">${items.join('')}</div>
  </section>`;
}

function renderPerson() {
  const r = selected;
  if(!r) return;
  document.getElementById('personName').textContent = r.nome;
  document.getElementById('personSub').textContent = `${r.setor} • ${r.cargo}`;
  const badge = document.getElementById('dorBadge');
  badge.textContent = r.tem_dor + (r.nota_dor_num ? ` • ${r.nota_dor_num}/10` : '');
  badge.className = 'badge ' + (String(r.tem_dor).startsWith('Sim') ? 'dor' : 'ok');
  document.getElementById('tempoEmpresaMetric').textContent = r.tempo_empresa;
  document.getElementById('dataAvaliacaoMetric').textContent = r.data_avaliacao_inicial;
  document.getElementById('ultimaAtualizacaoMetric').textContent = r.data_avaliacao_inicial;
  updateYoutubeLink(r.youtube || '');
  document.getElementById('fixedData').innerHTML = [
    ['Data de nascimento',r.data_nascimento], ['Idade',r.idade], ['CPF',r.cpf],
    ['Peso',r.peso], ['Altura',r.altura], ['IMC',calcularIMC(r.peso,r.altura)]
  ].map(x => info(x[0],x[1])).join('');
  document.getElementById('initialData').innerHTML = [
    assessmentGroup('Dor e impacto','●','dor',[
      assessmentItem('Nota da dor inicial',r.nota_dor_num ? `${r.nota_dor_num}/10` : r.nota_dor,{highlight:'red'}),
      assessmentItem('Região da dor',r.regiao,{wide:true,highlight:'red'}),
      assessmentItem('Tempo da dor',r.tempo_dor),
      assessmentItem('Interfere no trabalho?',r.interfere)
    ]),
    assessmentGroup('Rotina profissional','▣','rotina',[
      assessmentItem('Histórico de função',r.historico_funcao),
      assessmentItem('Tempo sentado',r.tempo_sentado,{highlight:'orange'}),
      assessmentItem('Nível de esforço físico',r.esforco),
      assessmentItem('Exigências do trabalho',r.exigencias,{wide:true}),
      assessmentItem('Informação sobre rotina',r.rotina_info,{wide:true})
    ]),
    assessmentGroup('Hábitos e saúde','✦','habitos',[
      assessmentItem('Atividade física',r.atividade,{highlight:'green'}),
      assessmentItem('Sono',r.sono),
      assessmentItem('Estresse',r.estresse),
      assessmentItem('Consumo de água',r.agua,{highlight:'green'}),
      assessmentItem('Alimentação',r.alimentacao,{wide:true})
    ]),
    assessmentGroup('Pausas e necessidades corporais','◷','pausas',[
      assessmentItem('Evita/adia banheiro',r.adia_banheiro),
      assessmentItem('Idas ao banheiro',r.banheiro,{highlight:'blue'}),
      assessmentItem('Atende necessidades do corpo?',r.necessidades),
      assessmentItem('Atividade nas pausas',r.pausas,{wide:true}),
      assessmentItem('Frequência que levanta',r.levanta,{highlight:'blue'})
    ])
  ].join('');
  document.getElementById('observacaoFisioInput').value = '';
  document.getElementById('obsStatus').textContent = '';
  renderObsHistory(r.id);
}

function openDetails(title,itemList,ids) {
  document.getElementById('detailContent').innerHTML = `<h2>${esc(title)}</h2><div class="note">${itemList.length} colaborador(es)</div><div class="mini-list">${itemList.map((text,index)=>`<div class="mini-item" onclick="openPersonById(${ids[index]})">${esc(text)}</div>`).join('')}</div>`;
  document.getElementById('detailPanel').style.display = 'block';
}

function closeDetails() { document.getElementById('detailPanel').style.display = 'none'; }

function openPersonById(id) {
  const p = DATA.records.find(r => r.id === id);
  if(p) {
    selected = p;
    closeDetails();
    renderList();
    showView('individual');
    renderPerson();
  }
}


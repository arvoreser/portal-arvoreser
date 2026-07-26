// Módulo: utils

function esc(x) {
  return (x ?? '').toString().replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
}

function norm(v) {
  return (v === undefined || v === null || v === '') ? 'Não informado' : String(v).trim();
}

function num(v) {
  const m = norm(v).replace(',', '.').match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : 0;
}

function excelDateBR(value) {
  if(value === undefined || value === null || value === '') return 'Não informado';
  const s = String(value).trim();
  const m = s.match(/Date\((\d+),(\d+),(\d+)\)/);
  if(m) return new Date(Number(m[1]), Number(m[2]), Number(m[3])).toLocaleDateString('pt-BR');
  if(/^\d+(\.0)?$/.test(s) && Number(s) > 25000) {
    const d = new Date(Math.round((Number(s)-25569)*86400*1000));
    return d.toLocaleDateString('pt-BR', {timeZone:'UTC'});
  }
  return s;
}

function regions(reg) {
  reg = norm(reg);
  if(reg === 'Não informado') return [];
  const list = ['Pescoço','Ombros','Cotovelos','Punho e Mãos','Costas','Lombar','Quadril','Joelhos','Tornozelo e Pés'];
  const low = reg.toLowerCase();
  const out = list.filter(x => low.includes(x.toLowerCase()));
  return out.length ? out : [reg];
}

function parseBRNumber(value) {
  const text = String(value ?? '').trim().replace(/\s/g, '').replace(',', '.');
  const match = text.match(/-?\d+(?:\.\d+)?/);
  return match ? Number(match[0]) : NaN;
}

function parseBRDate(value) {
  const text = String(value ?? '').trim();
  const match = text.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if(!match) return null;
  const date = new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
  return isNaN(date.getTime()) ? null : date;
}

function calcularIdade(dataNascimento) {
  const nascimento = parseBRDate(dataNascimento);
  if(!nascimento) return 'Não informado';
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const aindaNaoFezAniversario = hoje.getMonth() < nascimento.getMonth() ||
    (hoje.getMonth() === nascimento.getMonth() && hoje.getDate() < nascimento.getDate());
  if(aindaNaoFezAniversario) idade--;
  return idade >= 0 ? `${idade} anos` : 'Não informado';
}

function calcularIMC(peso, altura) {
  const p = parseBRNumber(peso);
  let a = parseBRNumber(altura);
  if(!Number.isFinite(p) || !Number.isFinite(a) || p <= 0 || a <= 0) return 'Não informado';
  if(a > 3) a = a / 100;
  const imc = p / (a * a);
  let classificacao = 'Obesidade';
  if(imc < 18.5) classificacao = 'Abaixo do peso';
  else if(imc < 25) classificacao = 'Peso normal';
  else if(imc < 30) classificacao = 'Sobrepeso';
  return `${imc.toFixed(1).replace('.', ',')} • ${classificacao}`;
}

function normalizeRow(row) {
  const nota = num(row['Nota da dor']);
  const respostaDor = norm(row['Resposta original sobre dor']);
  return {
    id: Number(norm(row.ID)) || Math.random(),
    nome: norm(row['Nome completo']),
    data_nascimento: excelDateBR(row['Data de nascimento']),
    idade: calcularIdade(excelDateBR(row['Data de nascimento'])),
    cpf: norm(row.CPF),
    peso: norm(row.Peso),
    altura: norm(row.Altura),
    setor: norm(row.Setor),
    cargo: norm(row['Cargo/Função']),
    historico_funcao: norm(row['Histórico de função']),
    tempo_empresa: norm(row['Tempo de empresa']),
    youtube: norm(row['Link YouTube']) === 'Não informado' ? '' : norm(row['Link YouTube']),
    data_avaliacao_inicial: excelDateBR(row['Data da avaliação inicial']),
    tempo_sentado: norm(row['Tempo sentado']),
    exigencias: norm(row['Exigências do trabalho']),
    esforco: norm(row['Nível de esforço físico']),
    rotina_info: norm(row['Informação sobre rotina']),
    tem_dor: respostaDor,
    dor_resposta_original: respostaDor,
    regiao: norm(row['Região da dor']),
    regioes_lista: regions(row['Região da dor']),
    nota_dor: norm(row['Nota da dor']),
    nota_dor_num: nota,
    tempo_dor: norm(row['Tempo da dor']),
    interfere: norm(row['Interfere no trabalho?']),
    atividade: norm(row['Atividade física']),
    sono: norm(row.Sono),
    estresse: norm(row.Estresse),
    agua: norm(row['Água']),
    alimentacao: norm(row['Alimentação']),
    adia_banheiro: norm(row['Adia banheiro']),
    banheiro: norm(row['Idas ao banheiro']),
    necessidades: norm(row['Atende necessidades do corpo?']),
    pausas: norm(row['Atividade nas pausas']),
    levanta: norm(row['Frequência que levanta']),
    observacao_fisio: norm(row['Observação da fisio'])
  };
}

function recalcularDados(records) {
  DATA.records = records;
  const notas = records.map(r => r.nota_dor_num).filter(n => n > 0);
  const setores = [...new Set(records.map(r => r.setor))].sort();

  DATA.setorRows = setores.map(setor => {
    const rs = records.filter(r => r.setor === setor);
    const d = rs.filter(r => String(r.tem_dor).startsWith('Sim'));
    return {
      setor,
      total: rs.length,
      comDor: d.length,
      ids: d.map(r => r.id),
      nomes: d.map(r => r.nota_dor_num ? `${r.nome} (${r.nota_dor_num}/10)` : r.nome)
    };
  });

  const regionMap = {};
  records.forEach(r => {
    if(String(r.tem_dor).startsWith('Sim')) {
      (r.regioes_lista || []).forEach(reg => {
        if(!regionMap[reg]) regionMap[reg] = {regiao:reg, qtd:0, ids:[], nomes:[]};
        regionMap[reg].qtd++;
        regionMap[reg].ids.push(r.id);
        regionMap[reg].nomes.push(r.nota_dor_num ? `${r.nome} (${r.setor}; ${r.nota_dor_num}/10)` : `${r.nome} (${r.setor})`);
      });
    }
  });
  DATA.regRows = Object.values(regionMap).sort((a,b) => b.qtd - a.qtd);
  DATA.summary = {
    total: records.length,
    comDor: records.filter(r => String(r.tem_dor).startsWith('Sim')).length,
    dorMedia: notas.length ? (notas.reduce((a,b)=>a+b,0)/notas.length).toFixed(1) : 0,
    prioritarios: records.filter(r => r.nota_dor_num >= 7).length,
    topSetor: DATA.setorRows.reduce((a,b)=> b.comDor > (a.comDor || 0) ? b : a, {}).setor || '-',
    topReg: DATA.regRows[0]?.regiao || '-'
  };
  DATA.records.sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR', { sensitivity: 'base' }));
  selected = DATA.records[0] || null;
}


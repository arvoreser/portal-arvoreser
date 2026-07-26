// Módulo: diario

function renderDiario(){const el=document.getElementById('diarioHistory');if(!el)return;const rows=(DATA.diarioRows||[]).slice().reverse();el.innerHTML=rows.length?rows.map(r=>`<div class="diario-item"><div class="diario-date">${esc(r['Data']||'')}</div><div class="diario-text">${esc(r['Observação']||'')}</div></div>`).join(''):'<div class="small">Nenhuma anotação registrada ainda.</div>';}

async function salvarDiario(){const input=document.getElementById('diarioInput');const status=document.getElementById('diarioStatus');const texto=input.value.trim();if(!texto)return;status.textContent='Salvando...';await salvarNoGoogleSheets('diario','',texto);DATA.diarioRows.push({'Data':new Date().toLocaleDateString('pt-BR'),'Observação':texto});input.value='';renderDiario();status.textContent='Salvo.';}


// Terceiro mês e perguntas novas: extensão não destrutiva dos gráficos existentes.
(function(){
const cor='#A100FF', key='reavaliacao3MesRows';
const norm=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
const valid=r=>String(r?.ID??'').trim();
const rows=m=>(Array.isArray(DATA['reavaliacao'+m+'MesRows'])?DATA['reavaliacao'+m+'MesRows']:[]).filter(valid);
const note=v=>{const s=String(v??'').trim().replace(',','.');const n=Number(s);return s!==''&&Number.isFinite(n)&&n>=0&&n<=10?n:null};
const pain=v=>norm(v)==='sim'||norm(v).startsWith('sim ');
const person=r=>({nome:String(r['Nome completo']??'Sem nome'),id:String(r.ID??''),nota:note(r['Nota da dor']),dor:pain(r['Resposta original sobre dor'])});
function show(title,people){
 const p=document.getElementById('detailPanel'),c=document.getElementById('detailContent');if(!p||!c)return;
 const risk=x=>x.nota>=7?'🔴':x.nota>=4?'🟠':x.dor?'🟡':'🟢';
 c.innerHTML='<h2>'+esc(title)+'</h2><div class="note">'+people.length+' colaborador(es)</div><div class="region-click-list">'+people.map(x=>'<div class="region-click-person"><span class="risk-dot">'+risk(x)+'</span><span class="region-click-name">'+esc(x.nome)+'</span></div>').join('')+'</div>';p.style.display='block';
}
function extend(id,labels,values,match){
 const ch=Chart.getChart(document.getElementById(id));if(!ch||ch.data.datasets.some(d=>d.label==='3 meses'))return;
 ch.data.datasets.push({label:'3 meses',data:labels.map(values),backgroundColor:cor,borderColor:cor,borderWidth:1,borderRadius:5});
 const previous=ch.options.onClick;
 ch.options.onClick=(evt,elements)=>{if(!elements.length)return;const el=elements[0];if(el.datasetIndex===ch.data.datasets.length-1){show('3 meses • '+ch.data.labels[el.index],rows(3).filter(r=>match(r,ch.data.labels[el.index])).map(person));}else if(typeof previous==='function')previous(evt,elements)};
 ch.update('none');
}
function panel(id,title,after){let e=document.getElementById(id);if(e)return e;const a=document.getElementById(after);if(!a)return null;e=document.createElement('div');e.id=id;e.className='section';e.style.marginTop='22px';a.insertAdjacentElement('afterend',e);e.innerHTML='<h3><span class="section-dot">◈</span>'+title+'</h3><div class="third-content"></div>';return e}
function renderQuestion(id,title,field,after){
 const e=panel(id,title,after);if(!e)return;const content=e.querySelector('.third-content');const datasets=[1,2,3].map(m=>({m,items:rows(m).filter(r=>String(r[field]??'').trim())}));
 const labels=[...new Set(datasets.flatMap(d=>d.items.map(r=>String(r[field]).trim())))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 content.innerHTML='<p style="font-size:12px;color:#667085">Somente respostas efetivamente coletadas. Campos vazios não são contabilizados como “não”.</p><div style="height:280px;position:relative"><canvas id="'+id+'Chart"></canvas></div><p style="font-size:12px;color:#667085">'+datasets.map(d=>d.m+'º mês: '+d.items.length+' resposta(s) válida(s)').join(' • ')+'</p>';
 const canvas=document.getElementById(id+'Chart');const old=Chart.getChart(canvas);if(old)old.destroy();
 new Chart(canvas,{type:'bar',data:{labels,datasets:datasets.map(d=>({label:d.m+' '+(d.m===1?'mês':'meses'),data:labels.map(l=>d.items.filter(r=>String(r[field]).trim()===l).length),backgroundColor:d.m===1?'#17FA03':d.m===2?'#0057FF':cor,borderRadius:5}))},options:{responsive:true,maintainAspectRatio:false,onClick:(ev,els)=>{if(!els.length)return;const el=els[0],d=datasets[el.datasetIndex],label=labels[el.index];show(title+' • '+(d.m===1?'1º mês':d.m+'º mês')+' • '+label,d.items.filter(r=>String(r[field]).trim()===label).map(person))},plugins:{legend:{position:'top'},tooltip:{callbacks:{label:ctx=>{const d=datasets[ctx.datasetIndex];return (d.m===1?'1º mês':d.m+'º mês')+': '+ctx.parsed.y+' colaborador(es)'}}}},scales:{y:{beginAtZero:true,ticks:{precision:0}}}}});
}
window.renderTerceiroMes=function(){
 const r3=rows(3);
 const summary=[['comDorMetric',r3.filter(r=>pain(r['Resposta original sobre dor'])).length],['mediaDorMetric',(()=>{const n=r3.filter(r=>pain(r['Resposta original sobre dor'])).map(r=>note(r['Nota da dor'])).filter(n=>n!==null&&n>0);return n.length?(n.reduce((a,b)=>a+b,0)/n.length).toFixed(1).replace('.',','):'—'})()],['prioritariosMetric',r3.filter(r=>(note(r['Nota da dor'])??-1)>=7).length]];
 summary.forEach(([id,val])=>{const e=document.getElementById(id);if(e&&!e.querySelector('[data-third-month]'))e.insertAdjacentHTML('beforeend','<span style="color:#98a2b3;font-weight:600;margin:0 7px">/</span><span data-third-month title="3 meses" style="color:'+cor+'">'+(r3.length?val:'—')+'</span>')});
 const categories=[...Array(11)].map((_,i)=>String(i));
 extend('evolucaoDorChart',categories,label=>r3.filter(r=>note(r['Nota da dor'])===Number(label)).length,(r,l)=>note(r['Nota da dor'])===Number(l));
 const sleep=['Muito ruim','Ruim','Regular','Boa','Excelente'];
 const sleepMap=v=>({'muito ruim':'Muito ruim','ruim':'Ruim','regular':'Regular','boa':'Boa','bom':'Boa','excelente':'Excelente'}[norm(v)]||null);
 extend('evolucaoSonoChart',sleep,l=>r3.filter(r=>sleepMap(r.Sono)===l).length,(r,l)=>sleepMap(r.Sono)===l);
 const stress=['Muito baixo','Baixo','Moderado','Alto','Muito alto'];
 extend('evolucaoEstresseChart',stress,l=>r3.filter(r=>norm(r.Estresse)===norm(l)).length,(r,l)=>norm(r.Estresse)===norm(l));
 const ch=Chart.getChart(document.getElementById('setorChart'));
 if(ch){extend('setorChart',ch.data.labels,l=>r3.filter(r=>String(r.Setor??'').trim()===l&&pain(r['Resposta original sobre dor'])).length,(r,l)=>String(r.Setor??'').trim()===l&&pain(r['Resposta original sobre dor']));}
 const reg=Chart.getChart(document.getElementById('evRegChart'));
 if(reg){extend('evRegChart',reg.data.labels,l=>r3.filter(r=>pain(r['Resposta original sobre dor'])&&String(r['Região da dor']??'').split(/[,;|\\/]+/).some(x=>norm(x)===norm(l))).length,(r,l)=>pain(r['Resposta original sobre dor'])&&String(r['Região da dor']??'').split(/[,;|\\/]+/).some(x=>norm(x)===norm(l)));}
 const gl=Chart.getChart(document.getElementById('evGLChart'));
 if(gl){extend('evGLChart',gl.data.labels,l=>r3.filter(r=>norm(r['Exercicio de GL melhorou suas dores?'])===norm(l)).length,(r,l)=>norm(r['Exercicio de GL melhorou suas dores?'])===norm(l));}
 renderQuestion('motivosEstresseSection','Motivo do estresse','Motivo do Estresse','evolucaoEstresseSection');
 renderQuestion('interesseAtendimentoSection','Interesse em atendimento','Você gostaria de ser atendido?','motivosEstresseSection');
};
})();
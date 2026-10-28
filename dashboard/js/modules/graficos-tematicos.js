// Painel temático: nove gráficos, quatro avaliações, sem alterar fichas individuais.
(function(){
const P=['Inicial','1º mês','2º mês','3º mês'],C=['#FF4604','#17FA03','#0057FF','#A100FF'];
const str=v=>String(v??'').trim(),norm=v=>str(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const yes=v=>norm(v)==='sim'||norm(v).startsWith('sim ');
const score=v=>{const s=str(v).replace(',','.');if(!/^\d+(\.\d+)?$/.test(s))return null;const n=Number(s);return n>=0&&n<=10?n:null};
const category=(v,map)=>map[norm(v)]??null;
const sleep=v=>category(v,{'muito ruim':0,'ruim':1,'regular':2,'boa':3,'bom':3,'excelente':4});
const stress=v=>category(v,{'muito baixo':0,'baixo':1,'moderado':2,'medio':2,'alto':3,'muito alto':4});
const interference=v=>category(v,{'nunca':0,'as vezes':1,'frequentemente':2,'sempre':3});
const gl=v=>category(v,{'sim':0,'nao muito':1,'nao':2});
const regions=v=>str(v)?(typeof window.regions==='function'?window.regions(v):str(v).split(/[,;|\/]+/).map(s=>s.trim()).filter(Boolean)):[];
const escape=v=>typeof window.esc==='function'?window.esc(v):str(v).replace(/[&<>"]/g,s=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[s]));
function data(){
const a=(DATA.records||[]).filter(r=>str(r.id)).map(r=>({id:str(r.id),nome:str(r.nome),setor:str(r.setor),pain:yes(r.tem_dor),score:score(r.nota_dor),sleep:sleep(r.sono),stress:stress(r.estresse),interference:interference(r.interfere),regions:regions(r.regiao)}));
const periods=[a];
for(let i=1;i<=3;i++){const map=new Map();(DATA['reavaliacao'+i+'MesRows']||[]).forEach(r=>{if(str(r.ID))map.set(str(r.ID),r)});
periods.push([...map.values()].map(r=>({id:str(r.ID),nome:str(r['Nome completo']),setor:str(r.Setor),pain:yes(r['Resposta original sobre dor']),score:score(r['Nota da dor']),sleep:sleep(r.Sono),stress:stress(r.Estresse),interference:interference(r['Interfere no trabalho?']),regions:regions(r['Região da dor']),gl:gl(r['Exercicio de GL melhorou suas dores?']),reason:str(r['Motivo do Estresse']),interest:category(r['Você gostaria de ser atendido?'],{'sim':0,'nao':1})})))}
return periods;
}
const eligible=(rows,fn)=>rows.filter(r=>fn(r)!==null&&fn(r)!==undefined);
function details(title,items){
const panel=document.getElementById('detailPanel'),content=document.getElementById('detailContent');if(!panel||!content)return;
const people=[...new Map(items.filter(r=>r.id).map(r=>[r.id,r])).values()].sort((a,b)=>a.nome.localeCompare(b.nome,'pt-BR'));
content.innerHTML='<h2>'+escape(title)+'</h2><div class="note">'+people.length+' colaborador(es)</div><div class="region-click-list">'+people.map(r=>'<div class="region-click-person"><span class="risk-dot">'+(r.score>=7?'🔴':r.score>=4?'🟠':r.pain?'🟡':'🟢')+'</span><span class="region-click-name">'+escape(r.nome||'Sem nome')+'</span></div>').join('')+'</div>';panel.style.display='block';
}
function draw(id,type,labels,datasets,opts,click){
const canvas=document.getElementById(id);if(!canvas)return;
const previous=Chart.getChart(canvas);if(previous)previous.destroy();
new Chart(canvas,{type,data:{labels,datasets},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{position:'bottom',labels:{usePointStyle:true,boxWidth:10}}},...opts,onClick:click?(e,els)=>{if(els.length)click(els[0])}:undefined}});
}
function height(id,n){const el=document.getElementById(id)?.parentElement;if(el)el.style.height=n+'px'}
function note(id,t){const el=document.getElementById(id);if(el)el.textContent=t}
function coverage(periods,fn){return periods.map((r,i)=>P[i]+': '+eligible(r,fn).length+' respostas válidas').join(' • ')}
function status(id,periods,fn,better){
const el=document.getElementById(id);if(!el)return;let latest=-1,prior=-1;
for(let i=3;i>=0;i--){if(eligible(periods[i],fn).length){if(latest<0)latest=i;else{prior=i;break}}}
if(prior<0){el.innerHTML='';return}
const previous=new Map(eligible(periods[prior],fn).map(r=>[r.id,fn(r)]));
const pairs=eligible(periods[latest],fn).filter(r=>previous.has(r.id));
const good=pairs.filter(r=>better*(fn(r)-previous.get(r.id))>0).length;
const bad=pairs.filter(r=>better*(fn(r)-previous.get(r.id))<0).length;
el.innerHTML=[['Melhoraram',good],['Mantiveram',pairs.length-good-bad],['Pioraram',bad]].map(([l,n])=>'<div class="tema-status"><strong>'+n+'</strong><span>'+l+'</span></div>').join('');
note(id.replace('Status','Nota'),pairs.length+' pessoas com respostas pareadas: '+P[prior]+' × '+P[latest]+'.');
}
function stack(id,periods,fn,categories,colors,footer){
const groups=periods.map(r=>eligible(r,fn));
const datasets=categories.map((label,k)=>({label,data:groups.map(r=>r.length?100*r.filter(x=>fn(x)===k).length/r.length:0),backgroundColor:colors[k],stack:'total',counts:groups.map(r=>r.filter(x=>fn(x)===k).length)}));
draw(id,'bar',P,datasets,{indexAxis:'y',scales:{x:{stacked:true,min:0,max:100,ticks:{callback:v=>v+'%'}},y:{stacked:true,grid:{display:false}}},plugins:{legend:{position:'bottom'},tooltip:{callbacks:{label:c=>c.dataset.label+': '+c.dataset.counts[c.dataIndex]+' ('+c.parsed.x.toFixed(1)+'%)'}}}},x=>details(P[x.index]+' • '+categories[x.datasetIndex],groups[x.index].filter(r=>fn(r)===x.datasetIndex)));
height(id,240);note(footer,coverage(periods,fn));
}
function lines(id,periods,fn,categories,colors,footer,start=0){
const indices=[0,1,2,3].filter(i=>i>=start),groups=indices.map(i=>eligible(periods[i],fn));
const datasets=categories.map((label,k)=>({label,data:groups.map(r=>r.length?100*r.filter(x=>fn(x)===k).length/r.length:null),borderColor:colors[k],backgroundColor:colors[k],borderWidth:3,pointRadius:5,tension:.25,spanGaps:false}));
draw(id,'line',indices.map(i=>P[i]),datasets,{scales:{y:{min:0,max:100,ticks:{callback:v=>v+'%'}},x:{grid:{display:false}}},plugins:{tooltip:{callbacks:{label:c=>c.dataset.label+': '+c.parsed.y.toFixed(1)+'%'}}}},x=>details(P[indices[x.index]]+' • '+categories[x.datasetIndex],groups[x.index].filter(r=>fn(r)===x.datasetIndex)));
height(id,300);note(footer,indices.map((i,k)=>P[i]+': '+groups[k].length+' respostas válidas').join(' • '));
}
function horizontal(id,periods,extract,footer,percent=true,denominator){
const labels=[...new Set(periods.flatMap(rows=>rows.flatMap(extract)))].filter(Boolean).sort((a,b)=>a.localeCompare(b,'pt-BR'));
const datasets=P.map((p,i)=>({label:p,data:labels.map(l=>{const n=periods[i].filter(r=>extract(r).includes(l)).length;const d=denominator?denominator(periods[i],l):periods[i].length;return percent?(d?100*n/d:0):n}),backgroundColor:C[i],borderRadius:4,categoryPercentage:.8}));
draw(id,'bar',labels,datasets,{indexAxis:'y',scales:{x:{beginAtZero:true,max:percent?100:undefined,ticks:{callback:v=>percent?v+'%':v}},y:{grid:{display:false}}},plugins:{tooltip:{callbacks:{label:c=>{const i=c.datasetIndex,l=labels[c.dataIndex],n=periods[i].filter(r=>extract(r).includes(l)).length;return P[i]+': '+n+' ('+c.parsed.x.toFixed(percent?1:0)+(percent?'%':'')+')'}}}}},x=>details(P[x.datasetIndex]+' • '+labels[x.index],periods[x.datasetIndex].filter(r=>extract(r).includes(labels[x.index]))));
height(id,Math.max(320,labels.length*70+90));note(footer,periods.map((r,i)=>P[i]+': '+r.length+' respondentes').join(' • '));
}
function layout(){
const dash=document.getElementById('dashboardView');if(!dash||document.getElementById('temaGrupos'))return;
const root=document.createElement('div');root.id='temaGrupos';root.innerHTML=[['Dor','Dor e impacto funcional'],['Saude','Saúde e percepção'],['Queixas','Distribuição das queixas'],['Demandas','Demandas e acompanhamento']].map(([id,title],i)=>'<div class="tema-grupo"><h2>0'+(i+1)+' · '+title+'</h2><div class="tema-grid" id="tema'+id+'"></div></div>').join('');
const grid=dash.querySelector('.dashboard-grid');grid?.insertAdjacentElement('afterend',root);
[['evolucaoDorSection','Dor'],['evolucaoInterferenciaSection','Dor'],['evolucaoSonoSection','Saude'],['evolucaoEstresseSection','Saude'],['evolucaoGLSection','Saude'],['evolucaoRegioesSection','Queixas'],['motivosEstresseSection','Demandas'],['interesseAtendimentoSection','Demandas']].forEach(([id,g])=>{const el=document.getElementById(id);if(el){el.style.marginTop='0';el.style.gridColumn='auto';document.getElementById('tema'+g).appendChild(el)}});
const sector=document.getElementById('setorChart')?.closest('.dashboard-chart-section');if(sector){sector.style.gridColumn='auto';document.getElementById('temaQueixas').appendChild(sector)}
const executive=grid?.querySelector('.dashboard-evolution-section');if(executive){root.insertAdjacentElement('beforebegin',executive);executive.style.margin='20px 0'}
if(grid&&!grid.querySelector('.section'))grid.style.display='none';
const css=document.createElement('style');css.textContent='#temaGrupos{display:grid;gap:25px;margin-top:22px}.tema-grupo{border-top:2px solid #dbead7;padding-top:16px}.tema-grupo>h2{color:#064001;font-size:20px;margin:0 0 16px}.tema-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;align-items:start}.tema-grid>.section{min-width:0;margin:0!important;grid-column:auto!important}.tema-grid .evolucao-dor-metricas{grid-template-columns:repeat(2,minmax(0,1fr))!important}.tema-status{border:1px solid #e2eddf;background:#f8fbf6;border-radius:12px;padding:12px;display:flex;flex-direction:column}.tema-status strong{font-size:24px;color:#064001}.tema-status span{font-size:11px;color:#667085}@media(max-width:1100px){.tema-grid{grid-template-columns:1fr}}@media(max-width:600px){.tema-grupo>h2{font-size:17px}.tema-grid .evolucao-dor-status,.tema-grid .evolucao-sono-status,.tema-grid .evolucao-estresse-status,.tema-grid .evolucao-interferencia-status{grid-template-columns:repeat(3,minmax(0,1fr))}.tema-status{padding:8px}.tema-status strong{font-size:19px}}';document.head.appendChild(css);
}
window.renderGraficosTematicos=function(){
const periods=data();layout();
const mean=periods.map(r=>{const a=eligible(r,x=>x.score);return a.length?a.reduce((s,x)=>s+x.score,0)/a.length:null});
draw('evolucaoDorChart','line',P,[{label:'Média da dor',data:mean,borderColor:'#187900',pointBackgroundColor:C,pointBorderColor:C,pointRadius:7,borderWidth:3,tension:.25,spanGaps:false}],{scales:{y:{min:0,max:10},x:{grid:{display:false}}},plugins:{legend:{display:false}}},x=>details(P[x.index]+' • notas de dor válidas',eligible(periods[x.index],r=>r.score)));
height('evolucaoDorChart',300);
const cards=document.querySelector('#evolucaoDorSection .evolucao-dor-metricas');if(cards)cards.innerHTML=P.map((p,i)=>'<div class="evolucao-dor-metrica"><div class="k">'+p+'</div><div class="v" style="color:'+C[i]+'">'+(mean[i]===null?'—':mean[i].toFixed(1).replace('.',',')+'/10')+'</div><div class="k">N = '+eligible(periods[i],r=>r.score).length+'</div></div>').join('');
status('evolucaoDorStatus',periods,r=>r.score,-1);note('evolucaoDorCobertura','Média das notas válidas, incluindo 0/10');note('evolucaoDorNota',coverage(periods,r=>r.score)+'. Amostras podem variar entre períodos.');
stack('evolucaoSonoChart',periods,r=>r.sleep,['Muito ruim','Ruim','Regular','Boa','Excelente'],['#D94835','#F29A38','#F4CF54','#60B987','#187900'],'evolucaoSonoCobertura');status('evolucaoSonoStatus',periods,r=>r.sleep,1);
stack('evolucaoEstresseChart',periods,r=>r.stress,['Muito baixo','Baixo','Moderado','Alto','Muito alto'],['#187900','#63C56C','#F1CB54','#FF8200','#E54836'],'evolucaoEstresseCobertura');status('evolucaoEstresseStatus',periods,r=>r.stress,-1);
lines('evolucaoInterferenciaChart',periods,r=>r.interference,['Nunca','Às vezes','Frequentemente','Sempre'],['#187900','#8ED46A','#FF9A36','#F04438'],'evolucaoInterferenciaCobertura');status('evolucaoInterferenciaStatus',periods,r=>r.interference,-1);
lines('evGLChart',periods,r=>r.gl,['Sim','Não muito','Não'],['#187900','#FF8200','#E54836'],'evGLCobertura',1);
const latest=[3,2,1].find(i=>eligible(periods[i],r=>r.gl).length);const glCards=document.getElementById('evGLCards');if(glCards)glCards.innerHTML=latest?['Sim','Não muito','Não'].map((l,k)=>'<div class="ev-gl-card"><span class="numero">'+periods[latest].filter(r=>r.gl===k).length+'</span><span class="rotulo">'+P[latest]+' · '+l+'</span></div>').join(''):'';
const regionRows=periods.map(r=>r.filter(x=>x.pain));horizontal('evRegChart',regionRows,r=>r.regions,'evRegNota',true);
const sectorRows=periods.map(r=>r.filter(x=>x.setor));horizontal('setorChart',sectorRows,r=>r.pain?[r.setor]:[],'',true,(r,l)=>r.filter(x=>x.setor===l).length);
const sec=document.getElementById('setorChart')?.closest('.section');if(sec){const h=sec.querySelector('h3');if(h)h.textContent='Evolução da dor por setor';const hint=sec.querySelector('.click-hint');if(hint)hint.textContent='Percentual com dor dentro de cada setor, por período. Clique para consultar nomes.'}
const reasons=periods.map(r=>r.filter(x=>x.reason));horizontal('motivosEstresseSectionChart',reasons,r=>[r.reason],'',false);const reasonChart=Chart.getChart(document.getElementById('motivosEstresseSectionChart'));if(reasonChart){reasonChart.data.datasets=reasonChart.data.datasets.filter((d,i)=>reasons[i].length>0);reasonChart.update('none')}const reasonSection=document.getElementById('motivosEstresseSection');if(reasonSection){const p=reasonSection.querySelector('.third-content p');if(p)p.textContent='Somente períodos em que houve respostas válidas. Campos vazios não significam ausência de estresse.'}
stack('interesseAtendimentoSectionChart',periods,r=>r.interest,['Sim','Não'],['#17FA03','#FF8200'],'');
const interest=periods.map(r=>eligible(r,x=>x.interest)),last=[3,2,1].find(i=>interest[i].length);
const area=document.getElementById('interesseAtendimentoSection');if(area){let badge=area.querySelector('.tema-interesse');if(!badge){badge=document.createElement('p');badge.className='tema-interesse';area.querySelector('h3')?.after(badge)}badge.textContent=last?'Último período com respostas: '+P[last]+' · '+interest[last].filter(r=>r.interest===0).length+' interessados entre '+interest[last].length+' respostas válidas.':'Sem respostas válidas.'}
document.querySelectorAll('.evolucao-dor-sub,.evolucao-sono-sub,.evolucao-estresse-sub,.evolucao-interferencia-sub,.ev-gl-sub,.ev-reg-sub').forEach(el=>el.textContent='Comparação entre avaliações disponíveis, incluindo o 3º mês.');
};
})();
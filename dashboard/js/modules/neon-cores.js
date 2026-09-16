// Paleta neon global dos gráficos do dashboard
(function(){
  if(typeof Chart==='undefined') return;

  const cores={
    inicial:'#FF4604',
    mes1:'#17FA03',
    mes2:'#0057FF'
  };

  function corDoDataset(label){
    const texto=String(label??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
    if(texto.includes('avaliacao inicial')||texto==='inicial') return cores.inicial;
    if(texto.includes('2 mes')) return cores.mes2;
    if(texto.includes('1 mes')) return cores.mes1;
    return null;
  }

  Chart.register({
    id:'arvoreserNeonPalette',
    beforeUpdate(chart){
      (chart.data?.datasets||[]).forEach(dataset=>{
        const cor=corDoDataset(dataset.label);
        if(!cor) return;
        dataset.backgroundColor=cor;
        dataset.borderColor=cor;
        dataset.borderWidth=1;
        if(Array.isArray(dataset.pointBackgroundColor)){
          dataset.pointBackgroundColor=dataset.pointBackgroundColor.map(()=>cor);
        }
        if(Array.isArray(dataset.pointBorderColor)){
          dataset.pointBorderColor=dataset.pointBorderColor.map(()=>cor);
        }
      });
    }
  });
})();
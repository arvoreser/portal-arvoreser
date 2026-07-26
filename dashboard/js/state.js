// Estado compartilhado do dashboard

let DATA = {records:[], setorRows:[], regRows:[], obsRows:[], bibliotecaRows:[], diarioRows:[], exerciciosAplicadosRows:[], summary:{total:0, comDor:0, dorMedia:0, prioritarios:0, topSetor:'-', topReg:'-'}};
let selected = null;
let editingExerciseSession = null;
let selectedExerciseNames = new Set();

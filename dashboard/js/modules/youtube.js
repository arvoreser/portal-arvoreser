// Módulo: youtube

async function saveYoutubeLink() {
  const input = document.getElementById('youtubeInput');
  const link = input.value.trim();
  if(!selected || !link) return;
  selected.youtube = link;
  updateYoutubeLink(link);
  await salvarNoGoogleSheets('youtube', selected.id, link);
}

function updateYoutubeLink(link) {
  const emptyState = document.getElementById('youtubeEmptyState');
  const savedState = document.getElementById('youtubeSavedState');
  const linkEl = document.getElementById('youtubeLink');
  const input = document.getElementById('youtubeInput');
  if(link) {
    linkEl.href = link;
    emptyState.classList.add('hidden');
    savedState.classList.remove('hidden');
  } else {
    linkEl.href = '#';
    savedState.classList.add('hidden');
    emptyState.classList.remove('hidden');
    if(input) input.value = '';
  }
}

async function deleteYoutubeLink() {
  if(!selected) return;
  selected.youtube = '';
  updateYoutubeLink('');
  await salvarNoGoogleSheets('youtube', selected.id, '');
}


// Al hacer click en el icono de la extensión, abre el panel de control en una nueva pestaña
chrome.action.onClicked.addListener((tab) => {
  chrome.tabs.create({ url: 'dashboard.html' });
});

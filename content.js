/**
 * Content Script para automatizar Instagram Lead Extraction
 * Este script se ejecuta en la pestaña de Instagram de forma controlada
 */

// Escuchar comandos desde el Dashboard de la extensión
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "ping") {
    sendResponse({ status: "alive" });
    return true;
  }

  if (request.action === "open_modal") {
    openModal(request.phase)
      .then(success => sendResponse({ success }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Asincrónico
  }

  if (request.action === "search_and_extract") {
    searchAndExtract(request.keyword, request.delayMs)
      .then(leads => sendResponse({ success: true, leads }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === "close_modal") {
    closeModal()
      .then(() => sendResponse({ success: true }))
      .catch(() => sendResponse({ success: false }));
    return true;
  }
});

// Función para esperar un tiempo determinado
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Función para abrir seguidores o seguidos
async function openModal(phase) {
  const urlPath = phase === "followers" ? "/followers/" : "/following/";
  console.log("Intentando abrir modal:", phase);

  // Buscar el botón por su atributo href
  let link = document.querySelector(`a[href*="${urlPath}"]`);
  
  if (!link) {
    // Intentar buscar por texto alternativo
    const textToSearch = phase === "followers" ? "seguidores" : "seguidos";
    const links = Array.from(document.querySelectorAll("a"));
    link = links.find(el => el.textContent.toLowerCase().includes(textToSearch));
  }

  if (!link) {
    throw new Error(`No se pudo encontrar el enlace de ${phase} en el perfil.`);
  }

  link.click();
  
  // Esperar a que el diálogo aparezca
  for (let i = 0; i < 15; i++) {
    await wait(800);
    const dialog = document.querySelector('div[role="dialog"]');
    if (dialog) return true;
  }

  // Si no se encuentra un diálogo formal, asumimos que se cargó
  return true;
}

// Función para cerrar el modal
async function closeModal() {
  const dialog = document.querySelector('div[role="dialog"]');
  if (dialog) {
    // Buscar botón de cerrar (comúnmente un SVG o un botón con X)
    const closeBtn = dialog.querySelector('button[type="button"]') || 
                     dialog.querySelector('svg[aria-label="Cerrar"]')?.closest('button') ||
                     dialog.querySelector('svg[aria-label="Close"]')?.closest('button');
    if (closeBtn) {
      closeBtn.click();
      await wait(500);
    } else {
      // Si no hay botón, hacemos un clic afuera
      const backdrop = document.querySelector('div[class*="backdrop"]') || document.body;
      backdrop.click();
    }
  }
}

// Función para buscar palabra clave y extraer usuarios
async function searchAndExtract(keyword, delayMs) {
  const dialog = document.querySelector('div[role="dialog"]');
  if (!dialog) {
    throw new Error("No se encuentra abierto el modal de seguidores/seguidos.");
  }

  // Buscar la barra de búsqueda en el diálogo
  let searchInput = dialog.querySelector('input[placeholder*="Search"]') || 
                    dialog.querySelector('input[placeholder*="Buscar"]') || 
                    dialog.querySelector('input[type="text"]');

  if (!searchInput) {
    throw new Error("No se pudo encontrar el buscador dentro del modal.");
  }

  // Enfocar y escribir
  searchInput.focus();
  
  // Limpiar valor anterior simulando inputs de React/Instagram
  searchInput.value = "";
  const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set;
  nativeInputValueSetter.call(searchInput, "");
  searchInput.dispatchEvent(new Event('input', { bubbles: true }));

  await wait(500);

  // Escribir carácter por carácter con pequeño delay (simula humano)
  for (const char of keyword) {
    searchInput.value += char;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    await wait(80 + Math.random() * 80);
  }

  // Esperar a que Instagram recargue los resultados (Delay configurable por usuario)
  console.log(`Esperando delay de ${delayMs}ms para los resultados...`);
  await wait(delayMs);

  // Intentar hacer un scroll pequeño dentro de la lista para gatillar renderizado
  const listContainer = dialog.querySelector('div[style*="overflow-y"]') || 
                        dialog.querySelector('div[class*="isgrP"]') ||
                        searchInput.closest('div').nextElementSibling;

  if (listContainer) {
    listContainer.scrollTop = 100;
    await wait(500);
    listContainer.scrollTop = 0;
    await wait(300);
  }

  // Extraer los perfiles de la lista
  // Los usernames suelen ser enlaces con un rol de link que contienen texto sin caracteres especiales de Instagram.
  // Buscamos etiquetas <a> que estén dentro del diálogo y no tengan clases de botones
  const links = Array.from(dialog.querySelectorAll('a[role="link"]'));
  
  const extracted = [];
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    const username = href?.replace(/\//g, ""); // Extrae "username" de "/username/"
    
    if (username && 
        username !== "explore" && 
        username !== "direct" && 
        username !== "emails" &&
        !username.includes("?") &&
        !extracted.some(item => item.username === username)) {
      
      // Obtener el nombre completo opcional (suele estar en un div hermano o hijo)
      const parentRow = link.closest('div');
      let fullName = "";
      if (parentRow) {
        const spanElements = parentRow.querySelectorAll('span');
        for (const span of spanElements) {
          const txt = span.textContent.trim();
          if (txt && txt !== username && txt.length > 0 && !txt.includes("Seguidores") && !txt.includes("Seguir")) {
            fullName = txt;
            break;
          }
        }
      }

      const finalFullName = fullName || username;
      const lowerKeyword = keyword.toLowerCase();
      if (username.toLowerCase().includes(lowerKeyword) || finalFullName.toLowerCase().includes(lowerKeyword)) {
        extracted.push({
          username: username,
          fullName: finalFullName
        });
      }
    }
  });

  return extracted;
}

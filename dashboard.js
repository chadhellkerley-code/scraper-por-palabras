/**
 * InstaLead Extractor - Orquestador Central
 */

let activeConfig = {
  usernames: [],
  keywords: [],
  minDelay: 3,
  maxDelay: 7,
  targetPhase: 'both' // followers, following, both
};

let extractedLeads = []; // Array de { id, username, fullName, keyword, source, targetProfile, extractedAt, profileUrl }
let isRunning = false;
let currentTabId = null;

// Elementos del DOM
const configPanel = document.getElementById('config-panel');
const runningPanel = document.getElementById('running-panel');
const resultsPanel = document.getElementById('results-panel');

const inputUsernames = document.getElementById('usernames');
const inputKeywords = document.getElementById('keywords');
const inputMinDelay = document.getElementById('min-delay');
const inputMaxDelay = document.getElementById('max-delay');

const btnStart = document.getElementById('btn-start');
const btnCancel = document.getElementById('btn-cancel');
const btnDownload = document.getElementById('btn-download');
const btnReset = document.getElementById('btn-reset');
const btnCloseResults = document.getElementById('btn-close-results');

const progressBar = document.getElementById('progress-bar');
const statLeads = document.getElementById('stat-leads');
const statDuplicates = document.getElementById('stat-duplicates');
const statTarget = document.getElementById('stat-target');
const currentKeywordSpan = document.getElementById('current-keyword');
const currentPhaseSpan = document.getElementById('current-phase');
const logsDiv = document.getElementById('logs');

const resTotal = document.getElementById('res-total');
const resDuplicates = document.getElementById('res-duplicates');
const leadsTableBody = document.getElementById('leads-table-body');

// Cargar configuración previa de localStorage si existe
document.addEventListener('DOMContentLoaded', () => {
  const savedData = localStorage.getItem('instalead_saved_data');
  if (savedData) {
    try {
      const parsed = JSON.parse(savedData);
      inputUsernames.value = parsed.usernames || "";
      inputKeywords.value = parsed.keywords || "";
      inputMinDelay.value = parsed.minDelay || 3;
      inputMaxDelay.value = parsed.maxDelay || 7;
      if (parsed.targetPhase) {
        const radio = document.querySelector(`input[name="extraction-target"][value="${parsed.targetPhase}"]`);
        if (radio) radio.checked = true;
      }
    } catch(e) {}
  }
});

// Event Listeners
btnStart.addEventListener('click', startProcess);
btnCancel.addEventListener('click', cancelProcess);
btnDownload.addEventListener('click', downloadCSV);
btnReset.addEventListener('click', resetToConfig);
btnCloseResults.addEventListener('click', resetToConfig);

function addLog(text, type = 'info') {
  const now = new Date();
  const timeStr = now.toTimeString().split(' ')[0];
  
  const logMsg = document.createElement('div');
  logMsg.className = `log-msg log-${type}`;
  logMsg.innerHTML = `[${timeStr}] ${text}`;
  
  logsDiv.appendChild(logMsg);
  logsDiv.scrollTop = logsDiv.scrollHeight;
}

async function startProcess() {
  const rawUsernames = inputUsernames.value.trim();
  const rawKeywords = inputKeywords.value.trim();
  
  if (!rawUsernames) {
    alert("Por favor, ingresa al menos un username de Instagram.");
    return;
  }
  if (!rawKeywords) {
    alert("Por favor, ingresa al menos una palabra clave.");
    return;
  }

  const usernames = rawUsernames.split('\n').map(u => u.trim().replace("@", "")).filter(u => u.length > 0);
  const keywords = rawKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
  const minDelay = parseInt(inputMinDelay.value) || 3;
  const maxDelay = parseInt(inputMaxDelay.value) || 7;
  const targetPhase = document.querySelector('input[name="extraction-target"]:checked').value;

  activeConfig = { usernames, keywords, minDelay, maxDelay, targetPhase };
  
  // Guardar en localStorage para conveniencia
  localStorage.setItem('instalead_saved_data', JSON.stringify({
    usernames: rawUsernames,
    keywords: rawKeywords,
    minDelay,
    maxDelay,
    targetPhase
  }));

  // Inicializar estado
  extractedLeads = [];
  isRunning = true;
  logsDiv.innerHTML = "";
  
  configPanel.classList.add('hidden');
  resultsPanel.classList.add('hidden');
  runningPanel.classList.remove('hidden');
  
  addLog("Iniciando extractor de leads en Instagram...", "step");
  addLog(`Targets cargados: ${usernames.length} cuentas`, "info");
  addLog(`Palabras clave: ${keywords.join(', ')}`, "info");
  addLog(`Delays: entre ${minDelay}s y ${maxDelay}s`, "info");

  try {
    await runAutomation();
  } catch (error) {
    addLog(`Error crítico durante la automatización: ${error.message}`, "error");
    isRunning = false;
  }
}

function cancelProcess() {
  if (!isRunning) return;
  isRunning = false;
  addLog("Proceso detenido por el usuario. Cerrando pestañas activas...", "warning");
  if (currentTabId) {
    chrome.tabs.remove(currentTabId, () => {});
    currentTabId = null;
  }
  setTimeout(showResults, 1000);
}

// Lógica principal de automatización
async function runAutomation() {
  const { usernames, keywords, minDelay, maxDelay, targetPhase } = activeConfig;
  let duplicatedCount = 0;

  let phases = [];
  if (targetPhase === 'followers') {
    phases = ['followers'];
  } else if (targetPhase === 'following') {
    phases = ['following'];
  } else {
    phases = ['followers', 'following'];
  }

  const totalSteps = usernames.length * phases.length * keywords.length;
  let currentStep = 0;

  for (let u = 0; u < usernames.length; u++) {
    if (!isRunning) break;
    const username = usernames[u];
    statTarget.textContent = `@${username}`;
    addLog(`Trabajando en la cuenta @${username} (${u + 1}/${usernames.length})...`, "step");

    // 1. Abrir la pestaña de Instagram del usuario
    const profileUrl = `https://www.instagram.com/${username}/`;
    addLog(`Abriendo perfil: ${profileUrl}`, "info");
    
    currentTabId = await createTab(profileUrl);
    
    // Esperar a que la página cargue por completo (ej. 4 segundos)
    addLog("Esperando carga de página...", "info");
    await wait(4500);

    // Asegurarse de inyectar o conectar con el content script
    try {
      await pingContentScript(currentTabId);
    } catch (e) {
      addLog("Inyectando content script de forma manual...", "warning");
      await injectContentScript(currentTabId);
    }

    for (const phase of phases) {
      if (!isRunning) break;
      const phaseLabel = phase === 'followers' ? 'Seguidores' : 'Seguidos';
      currentPhaseSpan.textContent = phaseLabel;
      addLog(`Fase: Analizando ${phaseLabel} de @${username}...`, "info");

      // Abrir el modal de seguidores o seguidos
      addLog(`Abriendo modal de ${phaseLabel}...`, "info");
      const modalOpened = await chrome.tabs.sendMessage(currentTabId, { action: "open_modal", phase });
      
      if (!modalOpened || !modalOpened.success) {
        addLog(`No se pudo abrir el modal de ${phaseLabel}. ¿Está logueado en Instagram? Intentaremos continuar...`, "warning");
        currentStep += keywords.length;
        updateProgress(currentStep, totalSteps);
        continue;
      }

      await wait(1500);

      // Iterar por cada palabra clave
      for (let k = 0; k < keywords.length; k++) {
        if (!isRunning) break;
        const keyword = keywords[k];
        currentKeywordSpan.textContent = keyword;
        addLog(`Buscando palabra clave: "${keyword}"...`, "info");

        // Generar delay aleatorio en el rango indicado por el usuario
        const delaySeconds = Math.floor(Math.random() * (maxDelay - minDelay + 1)) + minDelay;
        addLog(`Delay de seguridad: esperando ${delaySeconds} segundos...`, "info");

        const response = await chrome.tabs.sendMessage(currentTabId, { 
          action: "search_and_extract", 
          keyword, 
          delayMs: delaySeconds * 1000 
        });

        if (response && response.success && response.leads) {
          const newLeadsRaw = response.leads;
          addLog(`Extraídos ${newLeadsRaw.length} perfiles para "${keyword}"`, "success");

          newLeadsRaw.forEach(lead => {
            // Verificar si el usuario ya existe en nuestra lista
            const isDuplicate = extractedLeads.some(existing => existing.username === lead.username);
            
            if (isDuplicate) {
              duplicatedCount++;
              statDuplicates.textContent = duplicatedCount;
              addLog(`Leads duplicados omitidos: @${lead.username}`, "warning");
            } else {
              extractedLeads.push({
                id: generateId(),
                username: lead.username,
                fullName: lead.fullName,
                keyword: keyword,
                source: phaseLabel,
                targetProfile: username,
                extractedAt: new Date().toLocaleTimeString(),
                profileUrl: `https://instagram.com/${lead.username}`
              });
              statLeads.textContent = extractedLeads.length;
            }
          });
        } else {
          addLog(`Error al buscar/extraer para la palabra clave "${keyword}": ${response?.error || 'Sin respuesta'}`, "error");
        }

        currentStep++;
        updateProgress(currentStep, totalSteps);
        
        // Pequeña pausa entre palabras clave
        await wait(1500);
      }

      // Cerrar el modal para limpiar
      addLog(`Cerrando modal de ${phaseLabel}...`, "info");
      await chrome.tabs.sendMessage(currentTabId, { action: "close_modal" });
      await wait(1500);
    }

    // Cerrar la pestaña actual para no acumular recursos
    if (currentTabId) {
      await removeTab(currentTabId);
      currentTabId = null;
    }
    
    addLog(`Finalizada cuenta @${username}`, "success");
    await wait(2000); // Pausa de respiro entre perfiles
  }

  isRunning = false;
  addLog("¡Extracción de leads completada con éxito para todo el listado!", "success");
  showResults();
}

// Helpers de pestañas Chrome
function createTab(url) {
  return new Promise((resolve) => {
    chrome.tabs.create({ url, active: true }, (tab) => {
      resolve(tab.id);
    });
  });
}

function removeTab(tabId) {
  return new Promise((resolve) => {
    chrome.tabs.remove(tabId, () => {
      resolve();
    });
  });
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function pingContentScript(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
      if (chrome.runtime.lastError || !response) {
        reject(new Error("No hay respuesta del content script"));
      } else {
        resolve(response);
      }
    });
  });
}

function injectContentScript(tabId) {
  return new Promise((resolve, reject) => {
    chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

function updateProgress(step, total) {
  const percent = Math.min(100, Math.round((step / total) * 100));
  progressBar.style.width = `${percent}%`;
}

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

// Mostrar resultados
function showResults() {
  runningPanel.classList.add('hidden');
  resultsPanel.classList.remove('hidden');

  resTotal.textContent = extractedLeads.length;
  
  // Calcular duplicados
  const duplicatesText = statDuplicates.textContent;
  resDuplicates.textContent = duplicatesText;

  leadsTableBody.innerHTML = "";
  
  // Mostrar los primeros 100 en la tabla de vista previa
  const previewLeads = extractedLeads.slice(0, 100);
  if (previewLeads.length === 0) {
    leadsTableBody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted);">No se encontraron leads. Intenta con otras palabras clave u otros perfiles.</td></tr>`;
  } else {
    previewLeads.forEach(lead => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><a href="${lead.profileUrl}" target="_blank" style="color: #60a5fa; text-decoration: none;">@${lead.username}</a></td>
        <td><span class="badge" style="background-color: var(--border);">${lead.keyword}</span></td>
        <td>${lead.source}</td>
        <td>@${lead.targetProfile}</td>
      `;
      leadsTableBody.appendChild(row);
    });
  }
}

function resetToConfig() {
  resultsPanel.classList.add('hidden');
  runningPanel.classList.add('hidden');
  configPanel.classList.remove('hidden');
}

// Descargar leads en formato CSV
function downloadCSV() {
  if (extractedLeads.length === 0) {
    alert("No hay leads para exportar.");
    return;
  }

  const headers = ["ID", "Username", "Nombre Completo", "Palabra Clave", "Origen", "Perfil Target", "Hora Extraccion", "URL Perfil"];
  const rows = extractedLeads.map(lead => [
    lead.id,
    lead.username,
    lead.fullName.replace(/"/g, '""'), // Escapar comillas
    lead.keyword,
    lead.source,
    lead.targetProfile,
    lead.extractedAt,
    lead.profileUrl
  ]);

  let csvContent = "data:text/csv;charset=utf-8,\uFEFF"; // Añadir BOM para caracteres en español (acentos, ñ)
  csvContent += headers.map(h => `"${h}"`).join(",") + "\n";
  
  rows.forEach(row => {
    csvContent += row.map(cell => `"${cell}"`).join(",") + "\n";
  });

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  
  const today = new Date().toISOString().split('T')[0];
  link.setAttribute("download", `instagram_leads_${today}.csv`);
  document.body.appendChild(link);
  
  link.click();
  document.body.removeChild(link);
}

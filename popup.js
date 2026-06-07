const RESULT_URL_PREFIX = "https://acceso-improve.santillana.cl/pruebas/resultado/";

const statusEl = document.querySelector("#status");
const downloadButton = document.querySelector("#download");
const downloadJsonButton = document.querySelector("#download-json");

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function setUnavailable() {
  statusEl.textContent = "Esta extensión solo funciona en páginas de resultados de iM-PROVE.";
  downloadButton.disabled = true;
  downloadJsonButton.disabled = true;
}

async function init() {
  const tab = await getActiveTab();
  if (!tab?.url?.startsWith(RESULT_URL_PREFIX)) {
    setUnavailable();
    return;
  }

  statusEl.textContent = "Página compatible. Espera la carga completa antes de generar PDFs.";
  downloadButton.disabled = false;
  downloadJsonButton.disabled = false;
}

async function sendAction(type, busyText, successText) {
  const tab = await getActiveTab();
  if (!tab?.id || !tab.url?.startsWith(RESULT_URL_PREFIX)) {
    setUnavailable();
    return;
  }

  statusEl.textContent = busyText;
  downloadButton.disabled = true;
  downloadJsonButton.disabled = true;

  try {
    const response = await chrome.tabs.sendMessage(tab.id, { type });
    if (!response?.ok) {
      throw new Error(response?.error || "No se pudo completar la descarga.");
    }
    statusEl.textContent = successText(response);
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
    downloadButton.disabled = false;
    downloadJsonButton.disabled = false;
  }
}

downloadButton.addEventListener("click", async () => {
  await sendAction(
    "IMPROVE_DOWNLOAD_PDFS",
    "Generando PDFs... por favor espera",
    (response) => `Descargas iniciadas: ${response.solutionFilename} y ${response.essayFilename}`
  );
});

downloadJsonButton.addEventListener("click", async () => {
  await sendAction(
    "IMPROVE_DOWNLOAD_JSON",
    "Descargando JSON... por favor espera",
    (response) => `Descarga iniciada: ${response.filename}`
  );
});

init();

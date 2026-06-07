const imageCache = new Map();

function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return btoa(binary);
}

async function fetchImageAsDataUrl(url) {
  if (imageCache.has(url)) return imageCache.get(url);

  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const contentType = response.headers.get("content-type") || "image/png";
  const dataUrl = `data:${contentType};base64,${arrayBufferToBase64(await response.arrayBuffer())}`;
  imageCache.set(url, dataUrl);
  return dataUrl;
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type !== "FETCH_IMAGE_AS_DATA_URL") return false;

  fetchImageAsDataUrl(message.url)
    .then((dataUrl) => sendResponse({ ok: true, dataUrl }))
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});

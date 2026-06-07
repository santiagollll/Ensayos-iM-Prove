(() => {
  const PAGE_WIDTH = 1240;
  const PAGE_HEIGHT = 1754;
  const SUMMARY_PAGE_WIDTH = 1240;
  const SUMMARY_PAGE_HEIGHT = 1754;
  const ESSAY_PAGE_WIDTH = 1275;
  const ESSAY_PAGE_HEIGHT = 1650;
  const MARGIN_X = 80;
  const MARGIN_Y = 70;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_X * 2;
  const ESSAY_MARGIN_X = 70;
  const ESSAY_MARGIN_Y = 60;
  const ESSAY_CONTENT_WIDTH = ESSAY_PAGE_WIDTH - ESSAY_MARGIN_X * 2;
  const ESSAY_QUESTION_SPACING = 34;
  const BLOCK_SPACING = 14;
  const SECTION_SPACING = 26;
  const TEXT_COLOR = "#17212b";
  const MUTED_COLOR = "#4f5f73";
  const ACCENT_COLOR = "#0f766e";
  const PILOT_BG = "#fee2e2";
  const PILOT_TEXT = "#991b1b";
  const CORRECT_BG = "#dcfce7";
  const CORRECT_BORDER = "#16a34a";
  const CORRECT_TEXT = "#14532d";
  const HEADER_BG = "#e8f2ff";
  const SUMMARY_BG = "#f8fafc";
  const PAGE_BG = "white";
  const DEFAULT_ESSAY_SUFFIX = " - Ensayo";

  const CONVERSION_TABLES = {
    Ciencias: [[0,100],[1,116],[2,140],[3,163],[4,183],[5,202],[6,220],[7,235],[8,249],[9,263],[10,278],[11,293],[12,307],[13,318],[14,327],[15,335],[16,345],[17,356],[18,368],[19,381],[20,393],[21,402],[22,410],[23,415],[24,420],[25,427],[26,435],[27,446],[28,458],[29,471],[30,481],[31,489],[32,495],[33,499],[34,503],[35,507],[36,513],[37,522],[38,532],[39,545],[40,557],[41,567],[42,574],[43,580],[44,584],[45,588],[46,593],[47,599],[48,608],[49,619],[50,632],[51,644],[52,654],[53,662],[54,668],[55,673],[56,679],[57,688],[58,698],[59,711],[60,724],[61,736],[62,747],[63,756],[64,765],[65,776],[66,789],[67,804],[68,819],[69,834],[70,849],[71,866],[72,884],[73,905],[74,927],[75,1000]],
    "Comprensión Lectora": [[0,100],[1,116],[2,142],[3,164],[4,184],[5,205],[6,225],[7,244],[8,261],[9,276],[10,290],[11,304],[12,319],[13,336],[14,352],[15,366],[16,377],[17,386],[18,396],[19,407],[20,421],[21,436],[22,451],[23,465],[24,474],[25,482],[26,490],[27,498],[28,508],[29,521],[30,537],[31,551],[32,565],[33,574],[34,583],[35,590],[36,598],[37,609],[38,622],[39,638],[40,653],[41,667],[42,677],[43,687],[44,697],[45,709],[46,724],[47,740],[48,756],[49,772],[50,786],[51,801],[52,817],[53,835],[54,856],[55,876],[56,898],[57,920],[58,946],[59,974],[60,1000]],
    Historia: [[0,100],[1,103],[2,128],[3,151],[4,172],[5,191],[6,209],[7,228],[8,246],[9,263],[10,278],[11,290],[12,302],[13,315],[14,329],[15,346],[16,361],[17,374],[18,385],[19,393],[20,400],[21,409],[22,420],[23,434],[24,450],[25,465],[26,477],[27,486],[28,493],[29,499],[30,506],[31,515],[32,527],[33,541],[34,557],[35,571],[36,582],[37,591],[38,598],[39,605],[40,614],[41,625],[42,640],[43,655],[44,671],[45,684],[46,695],[47,705],[48,716],[49,730],[50,746],[51,763],[52,780],[53,797],[54,813],[55,830],[56,850],[57,872],[58,895],[59,919],[60,1000]],
    M1: [[0,100],[1,170],[2,194],[3,216],[4,236],[5,256],[6,275],[7,292],[8,307],[9,320],[10,334],[11,349],[12,365],[13,380],[14,393],[15,403],[16,412],[17,421],[18,432],[19,446],[20,460],[21,474],[22,486],[23,495],[24,502],[25,508],[26,516],[27,526],[28,539],[29,553],[30,567],[31,579],[32,587],[33,595],[34,601],[35,609],[36,618],[37,631],[38,645],[39,660],[40,672],[41,682],[42,690],[43,699],[44,710],[45,723],[46,738],[47,753],[48,767],[49,780],[50,793],[51,807],[52,824],[53,842],[54,861],[55,880],[56,900],[57,923],[58,948],[59,975],[60,1000]],
    M2: [[0,0],[1,100],[2,161],[3,192],[4,220],[5,245],[6,268],[7,289],[8,308],[9,326],[10,344],[11,362],[12,378],[13,392],[14,405],[15,418],[16,432],[17,448],[18,462],[19,475],[20,486],[21,495],[22,506],[23,519],[24,533],[25,547],[26,560],[27,571],[28,580],[29,590],[30,601],[31,614],[32,629],[33,643],[34,656],[35,667],[36,678],[37,690],[38,704],[39,719],[40,735],[41,750],[42,765],[43,780],[44,797],[45,816],[46,836],[47,857],[48,879],[49,903],[50,1000]],
  };

  function sanitizeFilename(value) {
    return (value || "resultado_preguntas")
      .replace(/[<>:"/\\|?*]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\.+$/g, "") || "resultado_preguntas";
  }

  function getExamName(data) {
    return data?.meta?.exam_name_human || data?.meta?.result_heading || "Ensayo";
  }

  function detectExamCategory(data) {
    const name = `${getExamName(data)} ${data?.meta?.evaluation_section_label || ""}`.toLowerCase();
    const total = Number(data?.meta?.total_preguntas || data?.questions?.length || 0);
    if (name.includes("ciencia") || name.includes("ciencias")) return "Ciencias";
    if (/\bm1\b/i.test(name)) return "M1";
    if (/\bm2\b/i.test(name)) return "M2";
    if (name.includes("lectora") || name.includes("lenguaje")) return "Comprensión Lectora";
    if (total === 65) return "Historia";
    return null;
  }

  function conversionTableTitle(category) {
    if (category === "Comprensión Lectora") return "Tabla de conversión C.Lectora";
    if (category === "Historia") return "Tabla de conversión Historia";
    return category ? `Tabla de conversión ${category}` : "Tabla de conversión";
  }

  function createCanvas(width, height, bg = PAGE_BG) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.textBaseline = "top";
    return { canvas, ctx };
  }

  function font(size, weight = 400) {
    return `${weight} ${size}px Arial, "Arial Unicode MS", sans-serif`;
  }

  function drawRounded(ctx, x, y, w, h, r, fill, stroke = null, lineWidth = 1) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = lineWidth;
      ctx.stroke();
    }
  }

  function normalizeSpace(value) {
    return String(value || "").replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
  }

  function superSub(value) {
    const sup = {0:"⁰",1:"¹",2:"²",3:"³",4:"⁴",5:"⁵",6:"⁶",7:"⁷",8:"⁸",9:"⁹","+":"⁺","-":"⁻","=":"⁼","(":"⁽",")":"⁾",n:"ⁿ"};
    const sub = {0:"₀",1:"₁",2:"₂",3:"₃",4:"₄",5:"₅",6:"₆",7:"₇",8:"₈",9:"₉","+":"₊","-":"₋","=":"₌","(":"₍",")":"₎",a:"ₐ",e:"ₑ",i:"ᵢ",o:"ₒ",x:"ₓ"};
    return value
      .replace(/\^(\d+)/g, (_, s) => [...s].map((c) => sup[c] || c).join(""))
      .replace(/_([0-9a-zA-Z()+=-]+)/g, (_, s) => [...s].map((c) => sub[c] || c).join(""))
      .replace(/\^\{([^}]+)\}/g, (_, s) => [...s].map((c) => sup[c] || c).join(""))
      .replace(/_\{([^}]+)\}/g, (_, s) => [...s].map((c) => sub[c] || c).join(""));
  }

  function extractBracedContent(value, startIndex) {
    if (startIndex >= value.length || value[startIndex] !== "{") return [null, startIndex];
    let depth = 0;
    let buffer = "";
    for (let index = startIndex; index < value.length; index++) {
      const char = value[index];
      if (char === "{") {
        depth += 1;
        if (depth > 1) buffer += char;
      } else if (char === "}") {
        depth -= 1;
        if (depth === 0) return [buffer, index + 1];
        buffer += char;
      } else {
        buffer += char;
      }
    }
    return [null, startIndex];
  }

  function replaceTexCommandWithBraces(value, command, renderer) {
    let result = "";
    let index = 0;
    const marker = `\\${command}`;
    while (index < value.length) {
      if (value.startsWith(marker, index)) {
        let cursor = index + marker.length;
        while (cursor < value.length && /\s/.test(value[cursor])) cursor += 1;
        if (value[cursor] === "[") {
          const closing = value.indexOf("]", cursor);
          if (closing !== -1) cursor = closing + 1;
        }
        while (cursor < value.length && /\s/.test(value[cursor])) cursor += 1;
        const [content, nextIndex] = extractBracedContent(value, cursor);
        if (content !== null) {
          result += renderer(content);
          index = nextIndex;
          continue;
        }
      }
      result += value[index];
      index += 1;
    }
    return result;
  }

  function overlineText(value) {
    return [...value].map((char) => `${char}\u0305`).join("");
  }

  function simplifyText(value) {
    let simplified = normalizeSpace(value)
      .replaceAll("[tex]", "")
      .replaceAll("[\\tex]", "")
      .replace(/\\cdot/g, "·")
      .replace(/\\times/g, "×")
      .replace(/\\Rightarrow/g, "⇒")
      .replace(/\\left|\\right|\\displaystyle/g, "")
      .replace(/\\[,;:]/g, " ")
      .replace(/\\!/g, "")
      .replace(/\\%/g, "%")
      .replace(/\\deg/g, "°")
      .replace(/\\alpha/g, "α")
      .replace(/\\beta/g, "β")
      .replace(/\\gamma/g, "γ")
      .replace(/\\delta/g, "δ")
      .replace(/\\theta/g, "θ")
      .replace(/\\mu/g, "μ")
      .replace(/\\sigma/g, "σ")
      .replace(/\\pi/g, "π")
      .replace(/\\sen/g, "sen")
      .replace(/\\sqrt\[\]/g, "\\sqrt")
      .replace(/\\\(|\\\)|\$/g, "");

    while (simplified.includes("\\frac")) {
      const previous = simplified;
      let result = "";
      let index = 0;
      while (index < simplified.length) {
        if (simplified.startsWith("\\frac", index)) {
          let cursor = index + "\\frac".length;
          while (cursor < simplified.length && /\s/.test(simplified[cursor])) cursor += 1;
          const [numerator, nextCursor] = extractBracedContent(simplified, cursor);
          if (numerator !== null) {
            cursor = nextCursor;
            while (cursor < simplified.length && /\s/.test(simplified[cursor])) cursor += 1;
            const [denominator, finalCursor] = extractBracedContent(simplified, cursor);
            if (denominator !== null) {
              result += `(${simplifyText(numerator)})/(${simplifyText(denominator)})`;
              index = finalCursor;
              continue;
            }
          }
        }
        result += simplified[index];
        index += 1;
      }
      simplified = result;
      if (simplified === previous) break;
    }

    simplified = replaceTexCommandWithBraces(simplified, "sqrt", (content) => `√(${simplifyText(content)})`);
    simplified = replaceTexCommandWithBraces(simplified, "overline", (content) => overlineText(simplifyText(content)));
    simplified = simplified.replace(/\\begin\{pmatrix\}(.*?)\\end\{pmatrix\}/gs, (_, content) => `[${content.split(/\\\\+/).map((part) => part.trim()).filter(Boolean).join(" ; ")}]`);
    simplified = simplified.replace(/\^\{([^{}]+)\}/g, (_, content) => `^(${simplifyText(content)})`);
    simplified = simplified.replace(/[{}]/g, "").replace(/\\+/g, "");
    return superSub(normalizeSpace(simplified).replace(/<[^>]*>/g, ""));
  }

  function wrapText(ctx, text, maxWidth, fontSpec) {
    ctx.font = fontSpec;
    const words = normalizeSpace(text).split(" ").filter(Boolean);
    const lines = [];
    let line = "";
    for (const word of words) {
      const test = line ? `${line} ${word}` : word;
      if (ctx.measureText(test).width <= maxWidth || !line) {
        line = test;
      } else {
        lines.push(line);
        line = word;
      }
    }
    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function absoluteUrl(raw, baseUrl) {
    try {
      return new URL(raw, baseUrl || location.href).href;
    } catch {
      return raw;
    }
  }

  function collectImageUrls(data) {
    const urls = new Set();
    const baseUrl = data?.meta?.page_url || location.href;
    const collectHtml = (html) => {
      if (!html) return;
      const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
      for (const img of doc.querySelectorAll("img[src]")) urls.add(absoluteUrl(img.getAttribute("src"), baseUrl));
    };

    for (const question of data.questions || []) {
      const pregunta = question.pregunta || {};
      const retro = question.retroalimentacion || {};
      collectHtml(pregunta.contexto_html);
      collectHtml(pregunta.enunciado_html);
      for (const alt of pregunta.alternativas || []) {
        collectHtml(alt.texto_html);
        collectHtml(alt.retroalimentacion_html);
        collectHtml(alt.retro_pregunta_html);
      }
      collectHtml(retro.item_html);
      collectHtml(retro.general_html);
      for (const url of [...(retro.imagenes_item || []), ...(retro.imagenes_general || [])]) urls.add(absoluteUrl(url, baseUrl));
    }
    for (const reading of inferReadings(data)) {
      for (const resource of reading.resources || []) {
        if (resource.href) urls.add(absoluteUrl(resource.href, baseUrl));
      }
    }
    return [...urls];
  }

  async function loadImage(src) {
    const response = await chrome.runtime.sendMessage({ type: "FETCH_IMAGE_AS_DATA_URL", url: src });
    if (!response?.ok) throw new Error(response?.error || "No se pudo descargar la imagen.");
    const objectUrl = response.dataUrl;
    try {
      const img = new Image();
      img.decoding = "async";
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objectUrl;
      });
      return { img, objectUrl };
    } catch (error) {
      throw error;
    }
  }

  async function loadImageMap(data, setStatus) {
    const urls = collectImageUrls(data);
    const map = new Map();
    for (const [index, url] of urls.entries()) {
      setStatus?.(`Descargando imágenes (${index + 1}/${urls.length})`);
      try {
        map.set(url, await loadImage(url));
      } catch {
        map.set(url, null);
      }
    }
    return map;
  }

  function cleanupImageMap(imageMap) {
    // Las imágenes se cargan como dataURL desde el background worker; no requieren revokeObjectURL.
  }

  function htmlToBlocks(html, imageMap, baseUrl) {
    if (!html) return [];
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    const blocks = [];
    const blockTags = new Set(["p", "div", "section", "article", "header", "footer", "table", "tr", "td", "th", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6"]);
    const sup = {0:"⁰",1:"¹",2:"²",3:"³",4:"⁴",5:"⁵",6:"⁶",7:"⁷",8:"⁸",9:"⁹","+":"⁺","-":"⁻","=":"⁼","(":"⁽",")":"⁾",n:"ⁿ"};
    const sub = {0:"₀",1:"₁",2:"₂",3:"₃",4:"₄",5:"₅",6:"₆",7:"₇",8:"₈",9:"₉","+":"₊","-":"₋","=":"₌","(":"₍",")":"₎",a:"ₐ",e:"ₑ",i:"ᵢ",o:"ₒ",x:"ₓ"};

    function translate(value, map) {
      return [...String(value || "")].map((char) => map[char] || char).join("");
    }

    function pushSpacer() {
      if (blocks.length && blocks[blocks.length - 1].kind !== "spacer") blocks.push({ kind: "spacer" });
    }

    function inlineTextFromNode(node) {
      let parts = "";
      if (node.nodeType === Node.TEXT_NODE) return node.textContent || "";
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName.toLowerCase();
      if (tag === "img") return "";
      if (tag === "br") return "\n";
      for (const child of node.childNodes) {
        const childText = inlineTextFromNode(child);
        if (!childText) continue;
        if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === "sup") parts += translate(childText, sup);
        else if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() === "sub") parts += translate(childText, sub);
        else parts += childText;
      }
      return simplifyText(parts);
    }

    function appendInlineContent(node, indent = 0, bullet = "", bold = false) {
      let currentText = bullet;

      function flushText() {
        const cleaned = simplifyText(currentText);
        if (cleaned) blocks.push({ kind: "text", text: cleaned, indent, bold });
        currentText = "";
      }

      if (node.textContent && node.nodeType === Node.TEXT_NODE) {
        currentText += node.textContent;
      } else if (node.text) {
        currentText += node.text;
      }

      for (const child of node.childNodes) {
        if (child.nodeType === Node.TEXT_NODE) {
          currentText += child.textContent || "";
          continue;
        }
        if (child.nodeType !== Node.ELEMENT_NODE) continue;
        const tag = child.tagName.toLowerCase();
        if (tag === "script" || tag === "style") continue;
        if (tag === "img") {
          flushText();
          const src = child.getAttribute("src");
          if (src) blocks.push({ kind: "image", src: absoluteUrl(src, baseUrl), alt: child.getAttribute("alt") || "", indent });
          if (child.tail) currentText += child.tail;
          continue;
        }
        if (tag === "br") {
          flushText();
          pushSpacer();
          continue;
        }
        const childText = inlineTextFromNode(child);
        if (tag === "sup") currentText += translate(childText, sup);
        else if (tag === "sub") currentText += translate(childText, sub);
        else currentText += childText;
      }
      flushText();
    }

    function walk(node, indent = 0, bold = false) {
      if (node.nodeType === Node.TEXT_NODE) {
        const cleaned = simplifyText(node.textContent);
        if (cleaned) blocks.push({ kind: "text", text: cleaned, indent, bold });
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const tag = node.tagName.toLowerCase();
      if (tag === "script" || tag === "style") return;
      if (tag === "img") {
        const src = node.getAttribute("src");
        if (src) blocks.push({ kind: "image", src: absoluteUrl(src, baseUrl), alt: node.getAttribute("alt") || "" });
        return;
      }
      if (tag === "ul" || tag === "ol") {
        for (const child of node.children) walk(child, indent, bold);
        pushSpacer();
        return;
      }
      if (tag === "div" && Array.from(node.children).some((child) => blockTags.has(child.tagName.toLowerCase()) || ["ul", "ol", "li"].includes(child.tagName.toLowerCase()))) {
        for (const child of node.childNodes) walk(child, indent, bold);
        pushSpacer();
        return;
      }
      if (tag === "li") {
        appendInlineContent(node, indent, "• ", bold);
        pushSpacer();
        return;
      }
      if (blockTags.has(tag) || tag === "div") {
        appendInlineContent(node, indent, "", bold || /^h[1-6]$/.test(tag));
        pushSpacer();
        return;
      }
      appendInlineContent(node, indent, "", bold || tag === "strong" || tag === "b");
    }

    for (const child of doc.body.firstElementChild.childNodes) walk(child);
    while (blocks.length && blocks[blocks.length - 1].kind === "spacer") blocks.pop();
    return blocks;
  }

  function blockHeight(ctx, block, imageMap, width, baseFont = 22) {
    if (block.kind === "spacer") return BLOCK_SPACING;
    if (block.kind === "image") {
      const entry = imageMap.get(block.src);
      if (!entry?.img) return 34;
      const maxWidth = width - (block.indent || 0);
      const scale = Math.min(maxWidth / entry.img.width, 900 / entry.img.height, 1);
      return Math.max(1, Math.round(entry.img.height * scale)) + 10;
    }
    const fontSpec = font(block.size || baseFont, block.bold ? 700 : 400);
    const lines = wrapText(ctx, block.text || "", width - (block.indent || 0), fontSpec);
    return lines.length * Math.round((block.size || baseFont) * 1.35) + 6;
  }

  function blocksHeight(ctx, blocks, imageMap, width, baseFont = 22) {
    return blocks.reduce((sum, block) => sum + blockHeight(ctx, block, imageMap, width, baseFont), 0);
  }

  function drawBlock(ctx, block, imageMap, x, y, width, baseFont = 22, color = TEXT_COLOR) {
    if (block.kind === "spacer") return y + BLOCK_SPACING;
    const indent = block.indent || 0;
    if (block.kind === "image") {
      const entry = imageMap.get(block.src);
      if (!entry?.img) {
        ctx.font = font(18);
        ctx.fillStyle = MUTED_COLOR;
        ctx.fillText(`[Imagen no disponible: ${block.alt || block.src}]`, x + indent, y);
        return y + 34;
      }
      const maxWidth = width - indent;
      const scale = Math.min(maxWidth / entry.img.width, 900 / entry.img.height, 1);
      const w = Math.max(1, Math.round(entry.img.width * scale));
      const h = Math.max(1, Math.round(entry.img.height * scale));
      ctx.drawImage(entry.img, x + indent, y, w, h);
      return y + h + 10;
    }
    const size = block.size || baseFont;
    const fontSpec = font(size, block.bold ? 700 : 400);
    const lineHeight = Math.round(size * 1.35);
    const lines = wrapText(ctx, block.text || "", width - indent, fontSpec);
    ctx.font = fontSpec;
    ctx.fillStyle = block.color || color;
    for (const line of lines) {
      ctx.fillText(line, x + indent, y);
      y += lineHeight;
    }
    return y + 6;
  }

  function drawBlocks(ctx, blocks, imageMap, x, y, width, baseFont = 22, color = TEXT_COLOR) {
    for (const block of blocks) y = drawBlock(ctx, block, imageMap, x, y, width, baseFont, color);
    return y;
  }

  function section(title, blocks) {
    return { title, blocks: blocks.filter(Boolean) };
  }

  function questionSections(question, imageMap, baseUrl) {
    const pregunta = question.pregunta || {};
    const retro = question.retroalimentacion || {};
    const sections = [];
    const contextBlocks = htmlToBlocks(pregunta.contexto_html, imageMap, baseUrl);
    if (contextBlocks.length) sections.push(section("Contexto", contextBlocks));
    const statementBlocks = htmlToBlocks(pregunta.enunciado_html, imageMap, baseUrl);
    if (statementBlocks.length) sections.push(section("Enunciado", statementBlocks));

    const alternativeBlocks = [];
    for (const alt of pregunta.alternativas || []) {
      const altContent = htmlToBlocks(alt.texto_html, imageMap, baseUrl);
      alternativeBlocks.push({
        kind: "text",
        text: `Alternativa ${alt.letra || "?"}`,
        bold: true,
        color: alt.correcta ? CORRECT_TEXT : TEXT_COLOR,
        background: alt.correcta ? CORRECT_BG : null,
      });
      alternativeBlocks.push(...altContent.map((block) => ({ ...block, indent: (block.indent || 0) + 24 })));
      if (!altContent.length && alt.texto) alternativeBlocks.push({ kind: "text", text: alt.texto, indent: 24 });
      alternativeBlocks.push({ kind: "spacer" });
    }
    sections.push(section("Alternativas", alternativeBlocks));

    const feedbackBlocks = [
      ...htmlToBlocks(retro.item_html, imageMap, baseUrl),
      ...htmlToBlocks(retro.general_html, imageMap, baseUrl),
    ];
    if (feedbackBlocks.length) sections.push(section("Retroalimentación del ítem", feedbackBlocks));

    const info = [];
    if (question.piloto) info.push({ kind: "text", text: "Ítem piloto", bold: true, color: PILOT_TEXT });
    if (pregunta.contenido_objetivo_nombre) info.push({ kind: "text", text: `Objetivo evaluado: ${pregunta.contenido_objetivo_nombre}` });
    if (pregunta.habilidad_nombre) info.push({ kind: "text", text: `Habilidad: ${pregunta.habilidad_nombre}` });
    if (pregunta.contenido_nombre) info.push({ kind: "text", text: `Contenido: ${pregunta.contenido_nombre}` });
    if (pregunta.area_nombre) info.push({ kind: "text", text: `Área: ${pregunta.area_nombre}` });
    if (info.length) sections.push(section("Información adicional", info));
    return sections;
  }

  function renderQuestionPage(question, imageMap, baseUrl) {
    const probe = createCanvas(PAGE_WIDTH, PAGE_HEIGHT).ctx;
    const sections = questionSections(question, imageMap, baseUrl);
    let estimated = MARGIN_Y + 100;
    for (const item of sections) estimated += 58 + blocksHeight(probe, item.blocks, imageMap, CONTENT_WIDTH) + SECTION_SPACING;
    const { canvas, ctx } = createCanvas(PAGE_WIDTH, Math.max(PAGE_HEIGHT, estimated + MARGIN_Y));
    let y = MARGIN_Y;
    drawRounded(ctx, MARGIN_X, y, PAGE_WIDTH - MARGIN_X * 2, 72, 24, HEADER_BG);
    ctx.font = font(38, 700);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText(`Pregunta ${question.numero}`, MARGIN_X + 24, y + 16);
    if (question.piloto) {
      ctx.font = font(24, 700);
      ctx.fillStyle = PILOT_TEXT;
      ctx.fillText("Ítem piloto", PAGE_WIDTH - MARGIN_X - 150, y + 22);
    }
    y += 100;

    for (const item of sections) {
      ctx.font = font(24, 700);
      ctx.fillStyle = ACCENT_COLOR;
      ctx.fillText(item.title, MARGIN_X, y);
      y += 42;
      for (const block of item.blocks) {
        if (block.background) {
          const h = blockHeight(ctx, block, imageMap, CONTENT_WIDTH);
          drawRounded(ctx, MARGIN_X - 10, y - 6, CONTENT_WIDTH + 20, h + 4, 12, block.background, CORRECT_BORDER, 2);
        }
        y = drawBlock(ctx, block, imageMap, MARGIN_X, y, CONTENT_WIDTH, 22, block.color || TEXT_COLOR);
      }
      y += SECTION_SPACING;
    }
    return canvas;
  }

  function renderSummaryPage(data) {
    const { canvas, ctx } = createCanvas(SUMMARY_PAGE_WIDTH, SUMMARY_PAGE_HEIGHT, SUMMARY_BG);
    const examName = getExamName(data);
    const category = detectExamCategory(data);
    const table = CONVERSION_TABLES[category || ""];
    let y = MARGIN_Y;
    ctx.font = font(42, 700);
    ctx.fillStyle = TEXT_COLOR;
    for (const line of wrapText(ctx, examName, CONTENT_WIDTH, ctx.font)) {
      ctx.fillText(line, MARGIN_X, y);
      y += 54;
    }
    ctx.font = font(28, 700);
    ctx.fillStyle = ACCENT_COLOR;
    ctx.fillText("Solucionario", MARGIN_X, y);
    y += 48;
    ctx.font = font(22);
    ctx.fillStyle = MUTED_COLOR;
    ctx.fillText(["Número de pregunta y alternativa correcta", category ? `Categoría detectada: ${category}` : ""].filter(Boolean).join(" | "), MARGIN_X, y);
    y += 44;
    ctx.font = font(18);
    ctx.fillStyle = PILOT_TEXT;
    ctx.fillText("Resaltado rojo: ítem piloto", MARGIN_X, y);
    y += 42;

    const questions = data.questions || [];
    const gap = 36;
    const rightPanelWidth = table ? 360 : 0;
    const leftPanelWidth = CONTENT_WIDTH - rightPanelWidth - (table ? gap : 0);
    const columns = questions.length > 40 ? 3 : 2;
    const gutter = 20;
    const columnWidth = Math.floor((leftPanelWidth - gutter * (columns - 1)) / columns);
    const rows = Math.ceil(questions.length / columns);
    const startY = y;
    questions.forEach((question, index) => {
      const col = Math.floor(index / rows);
      const row = index % rows;
      const x = MARGIN_X + col * (columnWidth + gutter);
      const entryY = startY + row * 30;
      const label = `${String(question.numero).padStart(2, " ")} → ${(question.correcta?.letras || []).join("/") || "?"}`;
      if (question.piloto) {
        drawRounded(ctx, x, entryY - 3, columnWidth, 25, 10, PILOT_BG, PILOT_TEXT, 2);
        ctx.font = font(18, 700);
        ctx.fillStyle = PILOT_TEXT;
        ctx.fillText(label, x + 10, entryY);
      } else {
        ctx.font = font(18);
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText(label, x, entryY);
      }
    });

    if (table) {
      const rightX = MARGIN_X + leftPanelWidth + gap;
      drawRounded(ctx, rightX, startY, rightPanelWidth, SUMMARY_PAGE_HEIGHT - MARGIN_Y - startY, 24, "white", "#d8e1eb", 2);
      let tableY = startY + 20;
      ctx.font = font(24, 700);
      ctx.fillStyle = TEXT_COLOR;
      ctx.fillText(conversionTableTitle(category), rightX + 18, tableY);
      tableY += 44;
      const tableColumns = table.length > 61 ? 2 : 1;
      const innerLeft = rightX + 18;
      const innerWidth = rightPanelWidth - 36;
      const columnGap = 12;
      const subWidth = Math.floor((innerWidth - columnGap * (tableColumns - 1)) / tableColumns);
      const rowsPerColumn = Math.ceil(table.length / tableColumns);
      for (let c = 0; c < tableColumns; c++) {
        const cx = innerLeft + c * (subWidth + columnGap);
        let cy = tableY;
        drawRounded(ctx, cx, cy, subWidth, 34, 12, HEADER_BG);
        ctx.font = font(tableColumns > 1 ? 14 : 16, 700);
        ctx.fillStyle = TEXT_COLOR;
        ctx.fillText("Correctas", cx + 12, cy + 9);
        ctx.fillText("Puntaje", cx + subWidth - 66, cy + 9);
        cy += 44;
        table.slice(c * rowsPerColumn, Math.min((c + 1) * rowsPerColumn, table.length)).forEach(([correctas, puntaje], row) => {
          const ry = cy + row * 20;
          if (correctas % 2 === 0) drawRounded(ctx, cx, ry - 2, subWidth, 18, 8, "#f8fafc");
          ctx.font = font(16);
          ctx.fillStyle = TEXT_COLOR;
          ctx.fillText(String(correctas), cx + 18, ry);
          ctx.fillText(String(puntaje), cx + subWidth - 70, ry);
        });
      }
    }
    return canvas;
  }

  function isReadingOnlyContext(html) {
    if (!html) return false;
    const doc = new DOMParser().parseFromString(`<div>${html}</div>`, "text/html");
    const text = normalizeSpace(doc.body.textContent || "");
    return /\bLECTURA\s+\d+\b/i.test(text) && !!doc.querySelector("a[href]");
  }

  function prefixFirstText(blocks, prefix) {
    let used = false;
    return blocks.map((block) => {
      if (!used && block.kind === "text") {
        used = true;
        return { ...block, text: `${prefix} ${block.text}`, boldPrefix: prefix };
      }
      return block;
    });
  }

  function essayQuestionBlocks(question, imageMap, baseUrl) {
    const pregunta = question.pregunta || {};
    const blocks = [];
    if (pregunta.contexto_html && !isReadingOnlyContext(pregunta.contexto_html)) {
      blocks.push(...htmlToBlocks(pregunta.contexto_html, imageMap, baseUrl), { kind: "spacer" });
    }
    const statement = htmlToBlocks(pregunta.enunciado_html, imageMap, baseUrl);
    if (statement.length) blocks.push(...prefixFirstText(statement, `${question.numero}.`), { kind: "spacer" }, { kind: "spacer" });
    for (const alt of pregunta.alternativas || []) {
      const rendered = htmlToBlocks(alt.texto_html, imageMap, baseUrl);
      const letter = `${String(alt.letra || "?").toLowerCase()})`;
      if (rendered.length) {
        blocks.push(...prefixFirstText(rendered, letter).map((block, index) => index ? { ...block, indent: (block.indent || 0) + 26 } : block));
      } else {
        blocks.push({ kind: "text", text: `${letter} ${alt.texto || ""}`, bold: false });
      }
      blocks.push({ kind: "spacer" });
    }
    while (blocks.length && blocks[blocks.length - 1].kind === "spacer") blocks.pop();
    return blocks;
  }

  function drawEssayBlock(ctx, block, imageMap, x, y, width) {
    if (block.boldPrefix && block.text?.startsWith(block.boldPrefix)) {
      const rest = block.text.slice(block.boldPrefix.length).trimStart();
      const size = block.size || 22;
      ctx.font = font(size, 700);
      ctx.fillStyle = TEXT_COLOR;
      const prefixWidth = ctx.measureText(block.boldPrefix + " ").width;
      ctx.fillText(block.boldPrefix, x + (block.indent || 0), y);
      return drawBlock(ctx, { ...block, text: rest, indent: (block.indent || 0) + prefixWidth, bold: false }, imageMap, x, y, width, 22);
    }
    return drawBlock(ctx, block, imageMap, x, y, width, 22);
  }

  function renderEssayCover(data) {
    const { canvas, ctx } = createCanvas(ESSAY_PAGE_WIDTH, ESSAY_PAGE_HEIGHT, SUMMARY_BG);
    const title = getExamName(data);
    ctx.font = font(42, 700);
    const titleLines = wrapText(ctx, title, ESSAY_CONTENT_WIDTH, ctx.font);
    const totalHeight = titleLines.length * 56 + 72;
    let y = Math.max(ESSAY_MARGIN_Y, Math.floor((ESSAY_PAGE_HEIGHT - totalHeight) / 2));
    ctx.fillStyle = TEXT_COLOR;
    for (const line of titleLines) {
      const w = ctx.measureText(line).width;
      ctx.fillText(line, Math.floor((ESSAY_PAGE_WIDTH - w) / 2), y);
      y += 56;
    }
    y += 24;
    ctx.font = font(28, 700);
    ctx.fillStyle = ACCENT_COLOR;
    const subtitle = "Ensayo";
    ctx.fillText(subtitle, Math.floor((ESSAY_PAGE_WIDTH - ctx.measureText(subtitle).width) / 2), y);
    return canvas;
  }

  async function renderPeriodicTablePage() {
    const { canvas, ctx } = createCanvas(ESSAY_PAGE_WIDTH, ESSAY_PAGE_HEIGHT);
    let y = ESSAY_MARGIN_Y;
    drawRounded(ctx, ESSAY_MARGIN_X, y, ESSAY_CONTENT_WIDTH, 72, 24, HEADER_BG);
    ctx.font = font(38, 700);
    ctx.fillStyle = TEXT_COLOR;
    ctx.fillText("Tabla periódica", ESSAY_MARGIN_X + 24, y + 16);
    y += 104;

    const assetUrl = chrome.runtime.getURL("assets/periodic-table.jpg");
    const { img } = await loadImage(assetUrl);
    const maxHeight = ESSAY_PAGE_HEIGHT - ESSAY_MARGIN_Y - y;
    const scale = Math.min(ESSAY_CONTENT_WIDTH / img.width, maxHeight / img.height, 1);
    const imageWidth = Math.max(1, Math.round(img.width * scale));
    const imageHeight = Math.max(1, Math.round(img.height * scale));
    const x = ESSAY_MARGIN_X + Math.floor((ESSAY_CONTENT_WIDTH - imageWidth) / 2);
    ctx.drawImage(img, x, y, imageWidth, imageHeight);
    return canvas;
  }

  function paginateEssayGroups(groups, imageMap) {
    const pages = [];
    let { canvas, ctx } = createCanvas(ESSAY_PAGE_WIDTH, ESSAY_PAGE_HEIGHT);
    let y = ESSAY_MARGIN_Y;
    const newPage = () => {
      pages.push(canvas);
      ({ canvas, ctx } = createCanvas(ESSAY_PAGE_WIDTH, ESSAY_PAGE_HEIGHT));
      y = ESSAY_MARGIN_Y;
    };

    for (const group of groups) {
      const groupHeight = blocksHeight(ctx, group, imageMap, ESSAY_CONTENT_WIDTH, 22);
      if (y > ESSAY_MARGIN_Y && y + groupHeight > ESSAY_PAGE_HEIGHT - ESSAY_MARGIN_Y) newPage();
      for (const block of group) {
        const h = blockHeight(ctx, block, imageMap, ESSAY_CONTENT_WIDTH, 22);
        if (y > ESSAY_MARGIN_Y && y + h > ESSAY_PAGE_HEIGHT - ESSAY_MARGIN_Y) newPage();
        y = drawEssayBlock(ctx, block, imageMap, ESSAY_MARGIN_X, y, ESSAY_CONTENT_WIDTH);
      }
      y += ESSAY_QUESTION_SPACING;
    }
    pages.push(canvas);
    return pages;
  }

  function compactRanges(numbers) {
    const sorted = [...new Set(numbers)].sort((a, b) => a - b);
    const ranges = [];
    for (let i = 0; i < sorted.length; i++) {
      const start = sorted[i];
      let end = start;
      while (sorted[i + 1] === end + 1) end = sorted[++i];
      ranges.push(start === end ? `${start}` : `${start}-${end}`);
    }
    return ranges.join(", ");
  }

  function inferReadings(data) {
    const readings = new Map();
    for (const question of data.questions || []) {
      for (const ref of question?.pregunta?.lecturas_referenciadas || []) {
        const number = Number(ref.numero);
        if (!Number.isFinite(number)) continue;
        if (!readings.has(number)) {
          readings.set(number, { numero: number, titulo: `Lectura ${number}`, preguntas: [], resources: [] });
        }
        const entry = readings.get(number);
        if (!entry.preguntas.includes(question.numero)) entry.preguntas.push(question.numero);
        for (const resource of ref.resources || []) {
          if (resource.href && !entry.resources.some((item) => item.href === resource.href)) entry.resources.push(resource);
        }
      }
    }
    return [...readings.values()].sort((a, b) => a.numero - b.numero).map((r) => ({ ...r, preguntas: r.preguntas.sort((a, b) => a - b) }));
  }

  function renderReadingImagePages(reading, imageMap, baseUrl, essay = false) {
    const width = essay ? ESSAY_PAGE_WIDTH : PAGE_WIDTH;
    const height = essay ? ESSAY_PAGE_HEIGHT : PAGE_HEIGHT;
    const marginX = essay ? ESSAY_MARGIN_X : MARGIN_X;
    const marginY = essay ? ESSAY_MARGIN_Y : MARGIN_Y;
    const contentWidth = essay ? ESSAY_CONTENT_WIDTH : CONTENT_WIDTH;
    const title = essay
      ? `Lectura ${reading.numero}. Preguntas asociadas: ${compactRanges(reading.preguntas || [])}`
      : `Lectura ${reading.numero || "?"}`;
    const pages = [];
    for (const resource of reading.resources || []) {
      const src = absoluteUrl(resource.href, baseUrl);
      const entry = imageMap.get(src);
      if (!entry?.img) continue;
      const scale = Math.min(contentWidth / entry.img.width, 1);
      const imgW = Math.max(1, Math.round(entry.img.width * scale));
      const imgH = Math.max(1, Math.round(entry.img.height * scale));
      let offset = 0;
      let segment = 0;
      while (offset < imgH) {
        const { canvas, ctx } = createCanvas(width, height);
        let y = marginY;
        if (segment === 0) {
          drawRounded(ctx, marginX, y, contentWidth, 72, 24, HEADER_BG);
          ctx.font = font(essay ? 28 : 38, 700);
          ctx.fillStyle = TEXT_COLOR;
          ctx.fillText(title, marginX + 24, y + 16);
          y += essay ? 96 : 112;
        }
        const available = height - marginY - y;
        const sourceY = offset / scale;
        const sourceH = Math.min(available / scale, entry.img.height - sourceY);
        ctx.drawImage(entry.img, 0, sourceY, entry.img.width, sourceH, marginX, y, imgW, sourceH * scale);
        pages.push(canvas);
        offset += available;
        segment += 1;
      }
    }
    return pages;
  }

  function buildSolutionPages(data, imageMap) {
    const baseUrl = data?.meta?.page_url || location.href;
    const pages = [renderSummaryPage(data)];
    for (const question of [...(data.questions || [])].sort((a, b) => a.numero - b.numero)) {
      pages.push(renderQuestionPage(question, imageMap, baseUrl));
    }
    for (const reading of inferReadings(data)) {
      pages.push(...renderReadingImagePages(reading, imageMap, baseUrl, false));
    }
    return pages;
  }

  async function buildEssayPages(data, imageMap) {
    const baseUrl = data?.meta?.page_url || location.href;
    const category = detectExamCategory(data);
    const questions = [...(data.questions || [])].sort((a, b) => a.numero - b.numero);
    const pages = [renderEssayCover(data)];
    if (category === "Ciencias") pages.push(await renderPeriodicTablePage());
    if (category !== "Comprensión Lectora") {
      return [...pages, ...paginateEssayGroups(questions.map((q) => essayQuestionBlocks(q, imageMap, baseUrl)), imageMap)];
    }

    const byNumber = new Map(questions.map((q) => [q.numero, q]));
    const rendered = new Set();
    for (const reading of inferReadings(data)) {
      pages.push(...renderReadingImagePages(reading, imageMap, baseUrl, true));
      const groups = [];
      for (const number of reading.preguntas || []) {
        const question = byNumber.get(number);
        if (!question) continue;
        groups.push(essayQuestionBlocks(question, imageMap, baseUrl));
        rendered.add(number);
      }
      pages.push(...paginateEssayGroups(groups, imageMap));
    }
    const leftovers = questions.filter((q) => !rendered.has(q.numero)).map((q) => essayQuestionBlocks(q, imageMap, baseUrl));
    if (leftovers.length) pages.push(...paginateEssayGroups(leftovers, imageMap));
    return pages;
  }

  function asciiBytes(value) {
    const bytes = new Uint8Array(value.length);
    for (let i = 0; i < value.length; i++) bytes[i] = value.charCodeAt(i) & 0xff;
    return bytes;
  }

  function base64ToBytes(value) {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }

  function concatBytes(parts) {
    const total = parts.reduce((sum, part) => sum + part.length, 0);
    const output = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      output.set(part, offset);
      offset += part.length;
    }
    return output;
  }

  async function canvasToJpeg(canvas) {
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    return base64ToBytes(dataUrl.split(",", 2)[1]);
  }

  async function canvasesToPdfBlob(canvases, title) {
    const objects = [];
    const pageObjectIds = [];
    const parts = [asciiBytes("%PDF-1.4\n%\xE2\xE3\xCF\xD3\n")];
    const offsets = [0];

    function addObject(bodyParts) {
      const id = objects.length + 1;
      objects.push({ id, bodyParts });
      return id;
    }

    const catalogId = addObject([]);
    const pagesId = addObject([]);
    function pageSizePoints(canvas) {
      if (canvas.width === ESSAY_PAGE_WIDTH && canvas.height === ESSAY_PAGE_HEIGHT) {
        return { width: 612, height: 792 };
      }
      return { width: canvas.width * 72 / 150, height: canvas.height * 72 / 150 };
    }

    for (const canvas of canvases) {
      const pageSize = pageSizePoints(canvas);
      const jpeg = await canvasToJpeg(canvas);
      const imageId = addObject([
        asciiBytes(`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpeg.length} >>\nstream\n`),
        jpeg,
        asciiBytes("\nendstream"),
      ]);
      const content = asciiBytes(`q\n${pageSize.width} 0 0 ${pageSize.height} 0 0 cm\n/Im0 Do\nQ\n`);
      const contentId = addObject([asciiBytes(`<< /Length ${content.length} >>\nstream\n`), content, asciiBytes("\nendstream")]);
      const pageId = addObject([asciiBytes(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${pageSize.width} ${pageSize.height}] /Resources << /XObject << /Im0 ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`)]);
      pageObjectIds.push(pageId);
    }

    objects[catalogId - 1].bodyParts = [asciiBytes(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`)];
    objects[pagesId - 1].bodyParts = [asciiBytes(`<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageObjectIds.length} >>`)];

    for (const object of objects) {
      offsets[object.id] = parts.reduce((sum, part) => sum + part.length, 0);
      parts.push(asciiBytes(`${object.id} 0 obj\n`));
      parts.push(...object.bodyParts);
      parts.push(asciiBytes("\nendobj\n"));
    }
    const xrefOffset = parts.reduce((sum, part) => sum + part.length, 0);
    parts.push(asciiBytes(`xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`));
    for (let id = 1; id <= objects.length; id++) parts.push(asciiBytes(`${String(offsets[id]).padStart(10, "0")} 00000 n \n`));
    parts.push(asciiBytes(`trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R /Info << /Title (${String(title).replace(/[()\\]/g, "\\$&")}) >> >>\nstartxref\n${xrefOffset}\n%%EOF`));
    return new Blob([concatBytes(parts)], { type: "application/pdf" });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.documentElement.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  async function generateAndDownloadPdfs(data, setStatus) {
    const examName = getExamName(data);
    const safeName = sanitizeFilename(examName);
    const imageMap = await loadImageMap(data, setStatus);
    try {
      setStatus?.("Generando solucionario...");
      const solutionPages = buildSolutionPages(data, imageMap);
      const solutionBlob = await canvasesToPdfBlob(solutionPages, examName);
      downloadBlob(solutionBlob, `${safeName}.pdf`);

      setStatus?.("Generando ensayo...");
      const essayPages = await buildEssayPages(data, imageMap);
      const essayBlob = await canvasesToPdfBlob(essayPages, `${examName} - Ensayo`);
      downloadBlob(essayBlob, `${safeName}${DEFAULT_ESSAY_SUFFIX}.pdf`);

      return {
        solutionFilename: `${safeName}.pdf`,
        essayFilename: `${safeName}${DEFAULT_ESSAY_SUFFIX}.pdf`,
        solutionPages: solutionPages.length,
        essayPages: essayPages.length,
      };
    } finally {
      cleanupImageMap(imageMap);
    }
  }

  window.ImprovePdfRenderer = {
    generateAndDownloadPdfs,
    sanitizeFilename,
  };
})();

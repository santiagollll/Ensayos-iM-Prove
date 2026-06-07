(() => {
  const RESULT_URL_PREFIX = "https://acceso-improve.santillana.cl/pruebas/resultado/";
  const ENDPOINT = "/preguntas/ver_respuesta/";
  const QUESTION_SELECTOR = "a.tag.pointer[onclick*=\"respuesta(\"]";
  const ID_PRUEBA_REGEX = /var\s+id_prueba\s*=\s*"([^"]+)"/;
  const PILOT_ALERT_REGEX = /tiene\s+(\d+)\s+ítems?\s+pilotos?/i;
  const ONCLICK_REGEX = /respuesta\('([^']*)','([^']*)','([^']*)',([^,]*),([^,]*),'([^']*)'\)/;
  const MATRIZ_ENDPOINT = "/matriz_unica/obtenerObjetivosUnicos";
  const MATRIZ_PAGE_PATH = "/matriz_unica/matriz_unica";
  const FALLBACK_AREA_IDS = ["6", "7", "8", "513", "514", "515", "516"];
  const PANEL_ID = "improve-json-downloader-panel";

  let pageReady = false;
  let runningPromise = null;
  let panelStatus = null;
  let panelButton = null;
  let panelJsonButton = null;
  let cachedJson = null;

  function isCompatiblePage() {
    return location.href.startsWith(RESULT_URL_PREFIX);
  }

  function htmlToText(html) {
    if (!html) return "";
    const container = document.createElement("div");
    container.innerHTML = html;
    return container.textContent.replace(/\u00a0/g, " ").replace(/\s+\n/g, "\n").trim();
  }

  function extractImageUrls(html) {
    if (!html) return [];
    const container = document.createElement("div");
    container.innerHTML = html;
    return Array.from(container.querySelectorAll("img"))
      .map((img) => img.getAttribute("src"))
      .filter(Boolean);
  }

  function extractLinks(html) {
    if (!html) return [];
    const container = document.createElement("div");
    container.innerHTML = html;
    return Array.from(container.querySelectorAll("a"))
      .map((anchor) => ({
        href: anchor.getAttribute("href"),
        text: anchor.textContent.trim(),
      }))
      .filter((link) => link.href || link.text);
  }

  function extractReadingReferences(html) {
    if (!html) return [];
    const container = document.createElement("div");
    container.innerHTML = html;

    const rawText = container.textContent.replace(/\u00a0/g, " ").replace(/\s+/g, " ").trim();
    const readingNumbers = [
      ...new Set(
        Array.from(rawText.matchAll(/LECTURA\s+(\d+)/gi))
          .map((match) => Number(match[1]))
          .filter(Number.isFinite)
      ),
    ];
    const resourceLinks = Array.from(container.querySelectorAll("a[href]"))
      .map((anchor) => ({
        href: anchor.getAttribute("href"),
        text: anchor.textContent.trim(),
        className: anchor.className || "",
      }))
      .filter((link) => link.href);

    if (!readingNumbers.length && !resourceLinks.length) return [];

    return readingNumbers.map((readingNumber) => ({
      numero: readingNumber,
      titulo: `LECTURA ${readingNumber}`,
      contexto_html: html,
      contexto_texto: htmlToText(html),
      resources: resourceLinks.map((link) => ({
        href: link.href,
        text: link.text,
        className: link.className,
      })),
    }));
  }

  function buildReadingsCollection(questions) {
    const readingsByNumber = new Map();

    for (const question of questions) {
      for (const reference of question?.pregunta?.lecturas_referenciadas || []) {
        const readingNumber = Number(reference?.numero);
        if (!Number.isFinite(readingNumber)) continue;

        if (!readingsByNumber.has(readingNumber)) {
          readingsByNumber.set(readingNumber, {
            numero: readingNumber,
            titulo: reference.titulo || `LECTURA ${readingNumber}`,
            contexto_html: reference.contexto_html || null,
            contexto_texto: reference.contexto_texto || "",
            preguntas: [],
            resources: [],
          });
        }

        const readingEntry = readingsByNumber.get(readingNumber);
        if (!readingEntry.preguntas.includes(question.numero)) {
          readingEntry.preguntas.push(question.numero);
        }
        if (!readingEntry.contexto_html && reference.contexto_html) {
          readingEntry.contexto_html = reference.contexto_html;
        }
        if (!readingEntry.contexto_texto && reference.contexto_texto) {
          readingEntry.contexto_texto = reference.contexto_texto;
        }

        for (const resource of reference.resources || []) {
          if (!resource?.href) continue;
          if (readingEntry.resources.some((item) => item.href === resource.href)) continue;
          readingEntry.resources.push({
            href: resource.href,
            text: resource.text || "",
            className: resource.className || "",
          });
        }
      }
    }

    return Array.from(readingsByNumber.values())
      .map((reading) => ({
        ...reading,
        preguntas: reading.preguntas.sort((a, b) => a - b),
      }))
      .sort((a, b) => a.numero - b.numero);
  }

  function parseQuestionTrigger(element) {
    const onclick = element.getAttribute("onclick") || "";
    const match = onclick.match(ONCLICK_REGEX);

    if (!match) {
      throw new Error(`No pude parsear el onclick de la pregunta ${element.textContent.trim()}`);
    }

    return {
      numero: Number(element.textContent.trim()),
      pregunta: match[1],
      prueba_contestada: match[2],
      pregunta_datos: match[3],
      respondida: String(match[4]).trim(),
      numero_pregunta: String(match[5]).trim(),
      estado_pregunta: match[6],
      resumen_color_css: Array.from(element.classList).find((cls) => cls.startsWith("bg-")) || null,
      raw_onclick: onclick,
    };
  }

  function getIdPrueba() {
    for (const script of Array.from(document.scripts)) {
      if (!script.src && script.textContent.includes("var id_prueba")) {
        const match = script.textContent.match(ID_PRUEBA_REGEX);
        if (match) return match[1];
      }
    }

    throw new Error("No pude encontrar el id_prueba usado por la página.");
  }

  function getPilotCountFromAlert() {
    const match = (document.body.innerText || "").match(PILOT_ALERT_REGEX);
    return match ? Number(match[1]) : null;
  }

  function getResultHeadingText() {
    const heading = document.querySelector("h1");
    return heading ? heading.textContent.replace(/\s+/g, " ").trim() : null;
  }

  function getHumanReadableExamName() {
    const heading = getResultHeadingText();
    if (!heading) return null;

    const match = heading.match(/Resultados\s+de:\s*(.+?)\s+-\s+(.+)$/i);
    if (match) return match[2].trim();
    return heading.replace(/^Resultados\s+de:\s*/i, "").trim();
  }

  function getEvaluationSectionLabel() {
    return (
      Array.from(document.querySelectorAll("a"))
        .map((anchor) => anchor.textContent.replace(/\s+/g, " ").trim())
        .find((text) => /^Evaluaciones de PAES\b/i.test(text)) || null
    );
  }

  function getObjectiveSummaryFromPage() {
    return Array.from(document.querySelectorAll("table tbody tr"))
      .map((row) => {
        const cells = Array.from(row.querySelectorAll("td, th")).map((cell) =>
          cell.textContent.replace(/\s+/g, " ").trim()
        );
        if (cells.length < 2) return null;
        return {
          nombre: cells[0],
          porcentaje_logro: cells[1],
        };
      })
      .filter(Boolean);
  }

  function normalizeAreaRecord(id, label = null, source = "unknown") {
    const value = String(id ?? "").trim();
    if (!value) return null;
    return {
      id: value,
      label: label ? String(label).replace(/\s+/g, " ").trim() : null,
      source,
    };
  }

  function extractAreaRecordsFromDocument(doc, source) {
    return Array.from(doc.querySelectorAll("#tabs-reporte-por-evaluacion a.areas[data-id]"))
      .map((anchor) => normalizeAreaRecord(anchor.dataset.id, anchor.textContent, source))
      .filter(Boolean);
  }

  async function discoverMatrixAreas() {
    const discovered = new Map();

    for (const record of extractAreaRecordsFromDocument(document, "current_document")) {
      discovered.set(record.id, record);
    }

    try {
      const response = await fetch(MATRIZ_PAGE_PATH, { credentials: "same-origin" });
      if (response.ok) {
        const html = await response.text();
        const parsed = new DOMParser().parseFromString(html, "text/html");
        for (const record of extractAreaRecordsFromDocument(parsed, "matrix_page")) {
          if (!discovered.has(record.id)) discovered.set(record.id, record);
        }
      }
    } catch {
      // La matriz es enriquecimiento opcional; el JSON base no depende de ella.
    }

    for (const id of FALLBACK_AREA_IDS) {
      if (!discovered.has(id)) discovered.set(id, normalizeAreaRecord(id, null, "fallback"));
    }

    return Array.from(discovered.values()).sort((a, b) => Number(a.id) - Number(b.id));
  }

  async function fetchQuestionData(trigger, idPrueba) {
    const body = new URLSearchParams({
      pregunta: trigger.pregunta,
      prueba_contestada: trigger.prueba_contestada,
      pregunta_datos: trigger.pregunta_datos,
      respondida: trigger.respondida,
      numero_pregunta: trigger.numero_pregunta,
      conf_retroalimen: "2",
      id_prueba: idPrueba,
    });

    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "X-Requested-With": "XMLHttpRequest",
      },
      body,
      credentials: "same-origin",
    });

    if (!response.ok) {
      throw new Error(`Falló ${ENDPOINT} para la pregunta ${trigger.numero}: ${response.status}`);
    }

    return JSON.parse(await response.text());
  }

  async function fetchObjectiveMappings() {
    const byContenidoObjetivo = new Map();
    const byPruebaAndContenidoObjetivo = new Map();
    const byArea = {};
    const areas = await discoverMatrixAreas();

    for (const area of areas) {
      const id_area = area.id;
      try {
        const response = await fetch(MATRIZ_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
            "X-Requested-With": "XMLHttpRequest",
          },
          body: new URLSearchParams({ id_area }),
          credentials: "same-origin",
        });

        if (!response.ok) {
          byArea[id_area] = { id: id_area, label: area.label, source: area.source, objetivos: [], error: `HTTP ${response.status}` };
          continue;
        }

        const payload = await response.json();
        const objetivos = Array.isArray(payload?.objetivos) ? payload.objetivos : [];
        byArea[id_area] = { id: id_area, label: area.label, source: area.source, objetivos };

        for (const objetivo of objetivos) {
          const contenidoObjetivoId = String(objetivo?.contenido_objetivo ?? "").trim();
          if (!contenidoObjetivoId) continue;
          const pruebaId = String(objetivo?.prueba ?? "").trim();
          const normalized = {
            prueba_id: pruebaId || null,
            prueba_nombre: objetivo?.nombre ?? null,
            area_id: String(objetivo?.area ?? id_area),
            area_nombre: objetivo?.eje_nombre ?? area.label ?? null,
            numero_descriptor: objetivo?.numero ?? null,
            objetivo_nombre: objetivo?.objetivo_nombre ?? null,
            habilidad_nombre: objetivo?.habilidad_nombre ?? null,
            contenido_nombre: objetivo?.contenido ?? null,
            id_objetivo: objetivo?.id_objetivo ?? null,
            id_objetivo_unico: objetivo?.id_objetivo_unico ?? null,
            id_habilidad: objetivo?.id_habilidad ?? null,
            id_contenido: objetivo?.id_contenido ?? null,
            id_eje_curriculum_nivel: objetivo?.id_eje_curriculum_nivel ?? null,
            eje: objetivo?.eje ?? null,
          };

          if (!byContenidoObjetivo.has(contenidoObjetivoId)) byContenidoObjetivo.set(contenidoObjetivoId, []);
          byContenidoObjetivo.get(contenidoObjetivoId).push(normalized);

          if (pruebaId) {
            const compositeKey = `${pruebaId}::${contenidoObjetivoId}`;
            if (!byPruebaAndContenidoObjetivo.has(compositeKey)) byPruebaAndContenidoObjetivo.set(compositeKey, []);
            byPruebaAndContenidoObjetivo.get(compositeKey).push(normalized);
          }
        }
      } catch (error) {
        byArea[id_area] = {
          id: id_area,
          label: area.label,
          source: area.source,
          objetivos: [],
          error: String(error?.message ?? error),
        };
      }
    }

    return { byContenidoObjetivo, byPruebaAndContenidoObjetivo, byArea, areas };
  }

  function resolveObjectiveInfo(payload, mappings) {
    const contenidoObjetivoId = String(payload.pregunta?.contenido_objetivo ?? "").trim();
    if (!contenidoObjetivoId) return null;

    const pruebaId = String(payload.id_prueba ?? "").trim();
    const compositeKey = pruebaId ? `${pruebaId}::${contenidoObjetivoId}` : null;
    const exactMatches = compositeKey ? mappings.byPruebaAndContenidoObjetivo.get(compositeKey) || [] : [];
    const matches = exactMatches.length ? exactMatches : mappings.byContenidoObjetivo.get(contenidoObjetivoId) || [];

    if (!matches.length) {
      return {
        contenido_objetivo_id: contenidoObjetivoId,
        prueba_id: pruebaId || null,
        objetivo_nombre: null,
        habilidad_nombre: null,
        contenido_nombre: null,
        area_nombre: null,
        area_id: null,
        id_objetivo: null,
        id_objetivo_unico: null,
        id_habilidad: null,
        id_contenido: null,
        id_eje_curriculum_nivel: null,
        eje: null,
        match_count: 0,
        match_strategy: "none",
      };
    }

    const preferred = matches[0];
    return {
      contenido_objetivo_id: contenidoObjetivoId,
      prueba_id: pruebaId || null,
      objetivo_nombre: preferred.objetivo_nombre,
      habilidad_nombre: preferred.habilidad_nombre,
      contenido_nombre: preferred.contenido_nombre,
      area_nombre: preferred.area_nombre,
      area_id: preferred.area_id,
      id_objetivo: preferred.id_objetivo,
      id_objetivo_unico: preferred.id_objetivo_unico,
      id_habilidad: preferred.id_habilidad,
      id_contenido: preferred.id_contenido,
      id_eje_curriculum_nivel: preferred.id_eje_curriculum_nivel,
      eje: preferred.eje,
      match_count: matches.length,
      match_strategy: exactMatches.length ? "prueba+contenido_objetivo" : "contenido_objetivo",
      all_matches: matches,
    };
  }

  function buildQuestionRecord(trigger, payload, mappings) {
    const alternativas = (payload.alternativas || []).map((alt) => ({
      id_alternativa: alt.id_alternativa ?? null,
      letra: alt.letra ?? null,
      texto_html: alt.alternativa ?? null,
      texto: htmlToText(alt.alternativa),
      correcta: String(alt.correcta) === "1",
      retroalimentacion_html: alt.retroalimentacion ?? null,
      retroalimentacion_texto: htmlToText(alt.retroalimentacion),
      retro_pregunta_html: alt.retro_pgta ?? null,
      retro_pregunta_texto: htmlToText(alt.retro_pgta),
    }));

    const correctas = alternativas.filter((alt) => alt.correcta);
    const respondidas = new Set((payload.id_alternativas_contestadas || []).map(String));
    const objectiveInfo = resolveObjectiveInfo(payload, mappings);
    const contextoHtml = payload.contexto?.contexto_simple ?? payload.contexto?.contexto ?? null;

    return {
      numero: trigger.numero,
      piloto: String(payload.pregunta_prueba_contestada?.piloto ?? payload.pregunta?.piloto ?? "0") === "1",
      correcta: {
        letras: correctas.map((alt) => alt.letra),
        letra_unica: correctas.length === 1 ? correctas[0].letra : null,
        alternativas: correctas.map((alt) => ({
          letra: alt.letra,
          texto: alt.texto,
          texto_html: alt.texto_html,
        })),
      },
      respuesta_alumno: {
        respondida: payload.resp_desconocida !== 1 && respondidas.size > 0,
        ids_alternativas_marcadas: Array.from(respondidas),
        letras_marcadas: alternativas.filter((alt) => respondidas.has(String(alt.id_alternativa))).map((alt) => alt.letra),
        omitida: payload.resp_desconocida === 1 || respondidas.size === 0,
      },
      pregunta: {
        id_pregunta: payload.pregunta?.id_pregunta ?? null,
        id_pregunta_datos: payload.pregunta?.id_pregunta_datos ?? null,
        tipo: payload.pregunta?.tipo ?? null,
        puntaje: payload.pregunta?.puntaje ?? null,
        enunciado_html: payload.pregunta?.enunciado ?? null,
        enunciado_texto: htmlToText(payload.pregunta?.enunciado),
        contexto_html: contextoHtml,
        contexto_texto: htmlToText(contextoHtml),
        lecturas_referenciadas: extractReadingReferences(contextoHtml),
        contenido_objetivo_id: payload.pregunta?.contenido_objetivo ?? null,
        contenido_objetivo_nombre: objectiveInfo?.objetivo_nombre ?? null,
        habilidad_nombre: objectiveInfo?.habilidad_nombre ?? null,
        contenido_nombre: objectiveInfo?.contenido_nombre ?? null,
        area_nombre: objectiveInfo?.area_nombre ?? null,
        area_id: objectiveInfo?.area_id ?? null,
        dificultad: payload.pregunta?.dificultad ?? null,
        idioma: payload.pregunta?.idioma ?? null,
        alternativas,
      },
      retroalimentacion: {
        item_html: payload.pregunta?.retroalimentacion ?? payload.pregunta?.retroalimentacion_pd ?? null,
        item_texto: htmlToText(payload.pregunta?.retroalimentacion ?? payload.pregunta?.retroalimentacion_pd),
        general_html: payload.pregunta?.retroalimentacion_general ?? null,
        general_texto: htmlToText(payload.pregunta?.retroalimentacion_general),
        imagenes_item: extractImageUrls(payload.pregunta?.retroalimentacion ?? payload.pregunta?.retroalimentacion_pd),
        imagenes_general: extractImageUrls(payload.pregunta?.retroalimentacion_general),
      },
      recursos: {
        links_contexto: extractLinks(contextoHtml),
        links_retro_item: extractLinks(payload.pregunta?.retroalimentacion ?? payload.pregunta?.retroalimentacion_pd),
        links_retro_general: extractLinks(payload.pregunta?.retroalimentacion_general),
      },
      puntaje_obtenido: payload.pregunta_prueba_contestada?.puntos_irc_obt ?? null,
      ids_internos: {
        trigger_pregunta: trigger.pregunta,
        trigger_prueba_contestada: trigger.prueba_contestada,
        trigger_pregunta_datos: trigger.pregunta_datos,
        prueba_contestada_backend: payload.prueba_contestada ?? null,
        id_prueba_backend: payload.id_prueba ?? null,
        matrix_prueba_match_strategy: objectiveInfo?.match_strategy ?? "none",
        id_objetivo: objectiveInfo?.id_objetivo ?? null,
        id_objetivo_unico: objectiveInfo?.id_objetivo_unico ?? null,
        id_habilidad: objectiveInfo?.id_habilidad ?? null,
        id_contenido: objectiveInfo?.id_contenido ?? null,
        id_eje_curriculum_nivel: objectiveInfo?.id_eje_curriculum_nivel ?? null,
        eje: objectiveInfo?.eje ?? null,
        objective_match_count: objectiveInfo?.match_count ?? 0,
      },
    };
  }

  function sanitizeFilename(value) {
    return (value || "resultado_preguntas")
      .replace(/[<>:"/\\|?*]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\.+$/g, "") || "resultado_preguntas";
  }

  function downloadJson(result) {
    const filename = `${sanitizeFilename(result.meta.exam_name_human || result.meta.result_heading || "resultado_preguntas")}.json`;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.documentElement.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    return filename;
  }

  async function buildJson() {
    await waitUntilReady();
    if (cachedJson) return cachedJson;

    const startedAt = new Date();
    const idPrueba = getIdPrueba();
    const questionElements = Array.from(document.querySelectorAll(QUESTION_SELECTOR));

    if (!questionElements.length) {
      throw new Error("No encontré preguntas en la vista actual.");
    }

    const triggers = questionElements.map(parseQuestionTrigger).sort((a, b) => a.numero - b.numero);
    const objectiveMappings = await fetchObjectiveMappings();
    const questions = [];

    for (const [index, trigger] of triggers.entries()) {
      setStatus(`Descargando... por favor espera (${index + 1}/${triggers.length})`);
      const payload = await fetchQuestionData(trigger, idPrueba);
      questions.push(buildQuestionRecord(trigger, payload, objectiveMappings));
    }

    const pilotQuestions = questions.filter((question) => question.piloto).map((question) => question.numero);

    cachedJson = {
      meta: {
        generated_at: startedAt.toISOString(),
        page_title: document.title,
        page_url: location.href,
        result_heading: getResultHeadingText(),
        exam_name_human: getHumanReadableExamName(),
        evaluation_section_label: getEvaluationSectionLabel(),
        total_preguntas: questions.length,
        pilotos_detectados_en_alerta: getPilotCountFromAlert(),
        pilotos_detectados_por_api: pilotQuestions.length,
        id_prueba_frontend: idPrueba,
        areas_consultadas_en_matriz: objectiveMappings.areas,
      },
      pilotQuestions,
      objectiveSummary: getObjectiveSummaryFromPage(),
      lecturas: buildReadingsCollection(questions),
      questions,
    };
    return cachedJson;
  }

  async function downloadJsonFromPage() {
    if (runningPromise) return runningPromise;

    runningPromise = (async () => {
      setBusy(true);
      setStatus("Descargando... por favor espera");
      try {
        const result = await buildJson();
        const filename = downloadJson(result);
        setStatus(`Descarga iniciada: ${filename}`);
        return { ok: true, filename };
      } catch (error) {
        setStatus(`Error: ${error.message}`);
        return { ok: false, error: error.message };
      } finally {
        setBusy(false);
        runningPromise = null;
      }
    })();

    return runningPromise;
  }

  async function downloadPdfsFromPage() {
    if (runningPromise) return runningPromise;

    runningPromise = (async () => {
      setBusy(true);
      setStatus("Preparando datos... por favor espera");
      try {
        const result = await buildJson();
        if (!window.ImprovePdfRenderer?.generateAndDownloadPdfs) {
          throw new Error("No se cargó el motor PDF de la extensión.");
        }
        const files = await window.ImprovePdfRenderer.generateAndDownloadPdfs(result, setStatus);
        setStatus(`Descargas iniciadas: ${files.solutionFilename} y ${files.essayFilename}`);
        return { ok: true, ...files };
      } catch (error) {
        setStatus(`Error: ${error.message}`);
        return { ok: false, error: error.message };
      } finally {
        setBusy(false);
        runningPromise = null;
      }
    })();

    return runningPromise;
  }

  function setStatus(text) {
    if (panelStatus) panelStatus.textContent = text;
  }

  function setBusy(isBusy) {
    if (panelButton) panelButton.disabled = isBusy || !pageReady;
    if (panelJsonButton) panelJsonButton.disabled = isBusy || !pageReady;
  }

  function injectPanel() {
    if (document.getElementById(PANEL_ID) || !isCompatiblePage()) return;

    const host = document.createElement("div");
    host.id = PANEL_ID;
    host.style.position = "fixed";
    host.style.zIndex = "2147483647";
    host.style.right = "18px";
    host.style.top = "18px";
    document.documentElement.appendChild(host);

    const shadow = host.attachShadow({ mode: "open" });
    shadow.innerHTML = `
      <style>
        :host { all: initial; }
        .box {
          width: 310px;
          border: 1px solid #d8e1eb;
          border-radius: 12px;
          padding: 14px;
          color: #17212b;
          background: white;
          box-shadow: 0 16px 42px rgba(15, 23, 42, 0.18);
          font-family: Arial, sans-serif;
        }
        .title {
          margin: 0 0 6px;
          font-size: 14px;
          font-weight: 700;
        }
        .status {
          min-height: 34px;
          margin: 0 0 12px;
          color: #4f5f73;
          font-size: 12px;
          line-height: 1.4;
        }
        .actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        button {
          border: 0;
          border-radius: 8px;
          padding: 9px 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }
        .download {
          flex: 1;
          color: white;
          background: #0f766e;
        }
        details {
          margin-top: 10px;
          color: #4f5f73;
          font-size: 12px;
        }
        summary {
          cursor: pointer;
          font-weight: 700;
        }
        .json {
          width: 100%;
          margin-top: 8px;
          color: #17212b;
          background: #e8f2ff;
        }
        .close {
          color: #17212b;
          background: #eef3f8;
        }
        button:disabled {
          color: #8b97a7;
          background: #d8e1eb;
          cursor: not-allowed;
        }
      </style>
      <section class="box" role="dialog" aria-label="Generar PDFs iM-PROVE">
        <p class="title">Resultado PAES detectado</p>
        <p class="status">Esperando carga completa...</p>
        <div class="actions">
          <button class="download" type="button" disabled>Generar PDFs</button>
          <button class="close" type="button" aria-label="Cerrar">Cerrar</button>
        </div>
        <details>
          <summary>Opciones avanzadas</summary>
          <button class="json" type="button" disabled>Descargar JSON</button>
        </details>
      </section>
    `;

    panelStatus = shadow.querySelector(".status");
    panelButton = shadow.querySelector(".download");
    panelJsonButton = shadow.querySelector(".json");
    panelButton.addEventListener("click", downloadPdfsFromPage);
    panelJsonButton.addEventListener("click", downloadJsonFromPage);
    shadow.querySelector(".close").addEventListener("click", () => host.remove());

    if (pageReady) {
      panelButton.disabled = false;
      if (panelJsonButton) panelJsonButton.disabled = false;
      setStatus("Página lista. Puedes generar los PDFs.");
    }
  }

  function waitUntilReady() {
    if (pageReady) return Promise.resolve();

    return new Promise((resolve) => {
      const complete = () => {
        pageReady = true;
        if (panelButton) panelButton.disabled = false;
        if (panelJsonButton) panelJsonButton.disabled = false;
        setStatus("Página lista. Puedes generar los PDFs.");
        resolve();
      };

      if (document.readyState === "complete") {
        window.setTimeout(complete, 500);
        return;
      }

      window.addEventListener("load", () => window.setTimeout(complete, 500), { once: true });
    });
  }

  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "IMPROVE_DOWNLOAD_JSON") {
      downloadJsonFromPage().then(sendResponse);
      return true;
    }

    if (message?.type === "IMPROVE_DOWNLOAD_PDFS") {
      downloadPdfsFromPage().then(sendResponse);
      return true;
    }

    return false;
  });

  if (!isCompatiblePage()) return;

  injectPanel();
  waitUntilReady();
})();

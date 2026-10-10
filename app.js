/**
 * Filigrane Privé — Minimalist Client-Side Watermarking
 * 100% In-Browser & Offline. English / French support.
 */

// Initialize PDF.js worker
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
}

// Translations Dictionary
const i18n = {
  fr: {
    title: "Filigrane Privé",
    badgeOffline: "100% Hors-ligne",
    installBtn: "Installer",
    dropText: "Déposer un document",
    dropSubtext: "PDF, JPG ou PNG • Ne quitte jamais votre appareil",
    browseBtn: "Choisir un fichier",
    sampleBtn: "Exemple",
    watermarkLabel: "Texte du filigrane",
    watermarkPlaceholder: "Ex : Document exclusivement destiné à...",
    addDate: "+ Date du jour",
    presets: {
      rent: "Document destiné exclusivement à la location immobilière",
      job: "Candidature pour emploi - Ne peut servir à aucun autre usage",
      bank: "Copie réservée à l'ouverture de compte bancaire",
      general: "Document confidentiel - Usage unique et exclusif"
    },
    opacity: "Opacité",
    color: "Couleur",
    advanced: "Paramètres avancés",
    size: "Taille",
    density: "Densité",
    densityValues: { tight: "Très serré", normal: "Normal", airy: "Aéré" },
    angle: "Inclinaison",
    flattenLabel: "Fusionner dans les pixels (anti-fraude)",
    downloadPdf: "Télécharger le PDF sécurisé",
    downloadJpg: "Télécharger en image JPG",
    processing: "Sécurisation en cours...",
    page: "Page",
    noDoc: "Aucun document sélectionné",
    installModalTitle: "Installer l'application",
    installIosTab: "iPhone (iOS)",
    installAndroidTab: "Android",
    iosStep1: "Dans Safari, appuyez sur le bouton Partager",
    iosStep1Sub: "L'icône carrée avec une flèche vers le haut en bas de votre écran.",
    iosStep2: "Faites défiler et choisissez \"Sur l'écran d'accueil\"",
    iosStep3: "Appuyez sur \"Ajouter\"",
    iosStep3Sub: "L'icône apparaîtra sur votre écran d'accueil et fonctionnera hors-ligne.",
    androidStep1: "Dans Chrome, appuyez sur \"Installer l'application\"",
    androidStep1Sub: "Une bannière apparaît en bas de l'écran.",
    androidStep2: "Ou appuyez sur les 3 points ⋮ en haut puis \"Installer\"",
    androidStep2Sub: "L'application s'ajoute directement à votre tiroir d'applications.",
    close: "Fermer"
  },
  en: {
    title: "Private Watermark",
    badgeOffline: "100% Offline",
    installBtn: "Install",
    dropText: "Drop a document",
    dropSubtext: "PDF, JPG or PNG • Never leaves your device",
    browseBtn: "Choose file",
    sampleBtn: "Sample",
    watermarkLabel: "Watermark text",
    watermarkPlaceholder: "E.g. Document exclusively intended for...",
    addDate: "+ Today's date",
    presets: {
      rent: "Document exclusively intended for rental application",
      job: "Job application - Cannot be used for any other purpose",
      bank: "Copy reserved for bank account opening",
      general: "Confidential document - Single-use only"
    },
    opacity: "Opacity",
    color: "Color",
    advanced: "Advanced settings",
    size: "Size",
    density: "Density",
    densityValues: { tight: "Tight", normal: "Normal", airy: "Relaxed" },
    angle: "Angle",
    flattenLabel: "Flatten into pixels (anti-tamper)",
    downloadPdf: "Download secured PDF",
    downloadJpg: "Download as JPG image",
    processing: "Processing document...",
    page: "Page",
    noDoc: "No document selected",
    installModalTitle: "Install Application",
    installIosTab: "iPhone (iOS)",
    installAndroidTab: "Android",
    iosStep1: "In Safari, tap the Share button",
    iosStep1Sub: "The square icon with an upward arrow at the bottom.",
    iosStep2: "Scroll down and select \"Add to Home Screen\"",
    iosStep3: "Tap \"Add\"",
    iosStep3Sub: "The app icon will appear on your home screen and works offline.",
    androidStep1: "In Chrome, tap \"Install app\"",
    androidStep1Sub: "A prompt will appear at the bottom of the screen.",
    androidStep2: "Or tap the 3 dots ⋮ at the top right, then \"Install\"",
    androidStep2Sub: "The app will be added directly to your app drawer.",
    close: "Close"
  }
};

let currentLang = localStorage.getItem('filigrane_lang') || (navigator.language.startsWith('fr') ? 'fr' : 'en');

// App State
const state = {
  file: null,
  fileName: '',
  fileType: null, // 'pdf' | 'image'
  pdfDoc: null,
  imageObj: null,
  numPages: 0,
  currentPage: 1,
  isRendering: false,
  options: {
    text: i18n[currentLang].presets.rent,
    opacity: 0.25,
    fontSize: 26,
    spacing: 28,
    angle: -32,
    color: '#2d3748',
    separator: '   •   ',
    flatten: true,
  },
};

// DOM Elements
const btnLangFr = document.getElementById('btn-lang-fr');
const btnLangEn = document.getElementById('btn-lang-en');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const btnBrowse = document.getElementById('btn-browse');
const btnSample = document.getElementById('btn-sample');
const fileLoadedInfo = document.getElementById('file-loaded-info');
const fileNameEl = document.getElementById('file-name');
const fileDetailsEl = document.getElementById('file-details');
const btnClearFile = document.getElementById('btn-clear-file');

const watermarkTextEl = document.getElementById('watermark-text');
const btnAddDate = document.getElementById('btn-add-date');
const presetChips = document.querySelectorAll('.preset-chip');

const sliderOpacity = document.getElementById('slider-opacity');
const valOpacity = document.getElementById('val-opacity');
const sliderSize = document.getElementById('slider-size');
const valSize = document.getElementById('val-size');
const sliderSpacing = document.getElementById('slider-spacing');
const valSpacing = document.getElementById('val-spacing');
const sliderAngle = document.getElementById('slider-angle');
const valAngle = document.getElementById('val-angle');
const colorDots = document.querySelectorAll('.color-dot');
const chkFlatten = document.getElementById('chk-flatten');

const btnToggleAdvanced = document.getElementById('btn-toggle-advanced');
const advancedPanel = document.getElementById('advanced-panel');
const advancedArrow = document.getElementById('advanced-arrow');

const btnDownloadPdf = document.getElementById('btn-download-pdf');
const btnDownloadImg = document.getElementById('btn-download-img');
const progressContainer = document.getElementById('progress-container');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressText = document.getElementById('progress-text');

const previewCanvas = document.getElementById('preview-canvas');
const previewEmptyState = document.getElementById('preview-empty-state');
const pageIndicator = document.getElementById('page-indicator');
const btnPrevPage = document.getElementById('btn-prev-page');
const btnNextPage = document.getElementById('btn-next-page');

// Modal Elements
const btnOpenInstall = document.getElementById('btn-open-install');
const installModal = document.getElementById('install-modal');
const btnCloseModal = document.getElementById('btn-close-modal');
const btnModalCloseAction = document.getElementById('btn-modal-close-action');
const tabIos = document.getElementById('tab-ios');
const tabAndroid = document.getElementById('tab-android');
const paneIos = document.getElementById('pane-ios');
const paneAndroid = document.getElementById('pane-android');

// ==========================================
// Initialization
// ==========================================

function init() {
  applyLanguage(currentLang);
  setupLanguageEvents();
  setupUploadEvents();
  setupOptionEvents();
  setupPreviewEvents();
  setupDownloadEvents();
  setupModalEvents();
  autoDetectMobilePlatform();
}

// Language Handling
function applyLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('filigrane_lang', lang);

  btnLangFr.classList.toggle('active', lang === 'fr');
  btnLangEn.classList.toggle('active', lang === 'en');

  // Update text nodes with data-i18n
  document.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (i18n[lang][key]) {
      el.textContent = i18n[lang][key];
    }
  });

  // Update placeholders
  document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (i18n[lang][key]) {
      el.placeholder = i18n[lang][key];
    }
  });

  // If text is still default, update it to translated default
  if (!watermarkTextEl.value || Object.values(i18n.fr.presets).includes(watermarkTextEl.value) || Object.values(i18n.en.presets).includes(watermarkTextEl.value)) {
    watermarkTextEl.value = i18n[lang].presets.rent;
    state.options.text = watermarkTextEl.value;
  }

  updateDensityLabel();
  renderCurrentPagePreview();
}

function setupLanguageEvents() {
  btnLangFr.addEventListener('click', () => applyLanguage('fr'));
  btnLangEn.addEventListener('click', () => applyLanguage('en'));
}

// Upload Handling
function setupUploadEvents() {
  btnBrowse.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach((evt) => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('drag-active');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files[0]) {
      handleFileSelected(dt.files[0]);
    }
  });

  btnClearFile.addEventListener('click', (e) => {
    e.stopPropagation();
    resetLoadedFile();
  });

  btnSample.addEventListener('click', (e) => {
    e.stopPropagation();
    loadSamplePassport();
  });
}

// Option Controls
function setupOptionEvents() {
  let debounceTimer = null;
  watermarkTextEl.addEventListener('input', () => {
    state.options.text = watermarkTextEl.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(renderCurrentPagePreview, 80);
  });

  btnAddDate.addEventListener('click', () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = ` - ${day}/${month}/${year}`;

    if (!watermarkTextEl.value.includes(dateStr)) {
      watermarkTextEl.value = watermarkTextEl.value.trim() + dateStr;
      state.options.text = watermarkTextEl.value;
      renderCurrentPagePreview();
    }
  });

  presetChips.forEach((chip) => {
    chip.addEventListener('click', () => {
      const key = chip.getAttribute('data-key');
      const text = i18n[currentLang].presets[key];
      if (text) {
        watermarkTextEl.value = text;
        state.options.text = text;
        renderCurrentPagePreview();
      }
    });
  });

  sliderOpacity.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    valOpacity.textContent = `${val}%`;
    state.options.opacity = val / 100;
    renderCurrentPagePreview();
  });

  sliderSize.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    valSize.textContent = `${val} pt`;
    state.options.fontSize = val;
    renderCurrentPagePreview();
  });

  sliderSpacing.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    state.options.spacing = val;
    updateDensityLabel();
    renderCurrentPagePreview();
  });

  sliderAngle.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    valAngle.textContent = `${val}°`;
    state.options.angle = val;
    renderCurrentPagePreview();
  });

  colorDots.forEach((dot) => {
    dot.addEventListener('click', () => {
      colorDots.forEach((d) => d.classList.remove('active'));
      dot.classList.add('active');
      state.options.color = dot.getAttribute('data-color');
      renderCurrentPagePreview();
    });
  });

  chkFlatten.addEventListener('change', (e) => {
    state.options.flatten = e.target.checked;
  });

  // Collapsible Advanced Panel
  btnToggleAdvanced.addEventListener('click', () => {
    const isOpen = advancedPanel.classList.toggle('open');
    advancedArrow.textContent = isOpen ? '▼' : '▶';
  });
}

function updateDensityLabel() {
  const val = state.options.spacing;
  const d = i18n[currentLang].densityValues;
  if (val < 22) valSpacing.textContent = d.tight;
  else if (val < 32) valSpacing.textContent = d.normal;
  else valSpacing.textContent = d.airy;
}

// Preview Navigation
function setupPreviewEvents() {
  btnPrevPage.addEventListener('click', () => {
    if (state.currentPage > 1) {
      state.currentPage--;
      renderCurrentPagePreview();
    }
  });

  btnNextPage.addEventListener('click', () => {
    if (state.currentPage < state.numPages) {
      state.currentPage++;
      renderCurrentPagePreview();
    }
  });
}

// Download Events
function setupDownloadEvents() {
  btnDownloadPdf.addEventListener('click', generateAndDownloadPdf);
  btnDownloadImg.addEventListener('click', downloadCurrentPageAsImage);
}

// Install Modal Handling
function setupModalEvents() {
  btnOpenInstall.addEventListener('click', () => installModal.classList.add('open'));
  btnCloseModal.addEventListener('click', () => installModal.classList.remove('open'));
  btnModalCloseAction.addEventListener('click', () => installModal.classList.remove('open'));

  installModal.addEventListener('click', (e) => {
    if (e.target === installModal) installModal.classList.remove('open');
  });

  tabIos.addEventListener('click', () => {
    tabIos.classList.add('active');
    tabAndroid.classList.remove('active');
    paneIos.classList.add('active');
    paneAndroid.classList.remove('active');
  });

  tabAndroid.addEventListener('click', () => {
    tabAndroid.classList.add('active');
    tabIos.classList.remove('active');
    paneAndroid.classList.add('active');
    paneIos.classList.remove('active');
  });
}

function autoDetectMobilePlatform() {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  if (isIOS) {
    tabIos.click();
  }
}

// ==========================================
// File Processing
// ==========================================

async function handleFileSelected(file) {
  state.file = file;
  state.fileName = file.name;
  state.currentPage = 1;

  const sizeKb = Math.round(file.size / 1024);
  const sizeText = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb} KB`;

  fileNameEl.textContent = file.name;
  fileDetailsEl.textContent = `... • ${sizeText}`;
  dropzone.style.display = 'none';
  fileLoadedInfo.style.display = 'flex';

  try {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      state.fileType = 'pdf';
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      state.pdfDoc = await loadingTask.promise;
      state.numPages = state.pdfDoc.numPages;
      fileDetailsEl.textContent = `${state.numPages} ${i18n[currentLang].page}${state.numPages > 1 ? 's' : ''} • ${sizeText}`;
    } else if (file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(file.name)) {
      state.fileType = 'image';
      state.numPages = 1;
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
      state.imageObj = img;
      fileDetailsEl.textContent = `${img.naturalWidth}×${img.naturalHeight}px • ${sizeText}`;
    } else {
      alert("Unsupported format. Please select PDF, JPG or PNG.");
      resetLoadedFile();
      return;
    }

    btnDownloadPdf.disabled = false;
    btnDownloadImg.disabled = false;
    renderCurrentPagePreview();
  } catch (err) {
    console.error("Error opening document:", err);
    alert("Could not open this document. Ensure it is not corrupted or password-protected.");
    resetLoadedFile();
  }
}

function resetLoadedFile() {
  state.file = null;
  state.fileName = '';
  state.fileType = null;
  state.pdfDoc = null;
  state.imageObj = null;
  state.numPages = 0;
  state.currentPage = 1;

  dropzone.style.display = 'block';
  fileLoadedInfo.style.display = 'none';
  fileInput.value = '';

  btnDownloadPdf.disabled = true;
  btnDownloadImg.disabled = true;

  previewCanvas.style.display = 'none';
  previewEmptyState.style.display = 'block';
  pageIndicator.textContent = `${i18n[currentLang].page} 0 / 0`;
  btnPrevPage.disabled = true;
  btnNextPage.disabled = true;
}

// Sample Passport Generator
function loadSamplePassport() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 5;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText("RÉPUBLIQUE FRANÇAISE — SPECIMEN PASSPORT", 50, 75);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText("TEST SAMPLE DOCUMENT / DOCUMENT TEST", 50, 105);

  // Photo
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(50, 140, 240, 320);
  ctx.strokeStyle = '#94a3b8';
  ctx.strokeRect(50, 140, 240, 320);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 20px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("PHOTO", 170, 290);
  ctx.textAlign = 'left';

  // Details
  const fields = [
    ["Surname / Nom", "MARTIN"],
    ["Given names / Prénoms", "CAMILLE JEAN"],
    ["Passport No / N° Passeport", "24AA00000"],
    ["Nationality / Nationalité", "FRA"],
    ["Date of birth / Naissance", "15 MAY 1990"],
    ["Expiry / Expiration", "09 OCT 2034"]
  ];

  fields.forEach(([lbl, val], idx) => {
    const colX = 330;
    const rowY = 160 + (idx * 52);
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText(lbl, colX, rowY);
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 17px sans-serif';
    ctx.fillText(val, colX, rowY + 20);
  });

  // MRZ
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(40, 520, canvas.width - 80, 280);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(40, 520, canvas.width - 80, 280);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 26px "Courier New", monospace';
  ctx.fillText("P<FRAMARTIN<<CAMILLE<JEAN<<<<<<<<<<<<<<<<<<<", 60, 620);
  ctx.fillText("24AA000008FRA9005152F3410091<<<<<<<<<<<<<<04", 60, 690);

  canvas.toBlob((blob) => {
    const testFile = new File([blob], "specimen_passport_sample.png", { type: "image/png" });
    handleFileSelected(testFile);
  });
}

// ==========================================
// Watermark Canvas Engine
// ==========================================

function drawWatermark(ctx, width, height, options) {
  const diag = Math.hypot(width, height);
  const baseFontSize = Math.max(16, Math.round(width * (options.fontSize / 950)));

  ctx.save();
  ctx.translate(width / 2, height / 2);
  ctx.rotate((options.angle * Math.PI) / 180);

  ctx.font = `bold ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
  ctx.fillStyle = options.color;
  ctx.globalAlpha = parseFloat(options.opacity);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const cleanText = (options.text.trim() || 'CONFIDENTIAL') + options.separator;
  const metrics = ctx.measureText(cleanText);
  const unitWidth = metrics.width;
  const rowHeight = baseFontSize * (options.spacing / 10);

  const startY = -diag;
  const endY = diag;
  const startX = -diag;
  const endX = diag;

  let rowIdx = 0;
  for (let y = startY; y < endY; y += rowHeight) {
    const xOffset = (rowIdx % 2 === 1) ? (unitWidth / 2) : 0;
    for (let x = startX - unitWidth; x < endX + unitWidth; x += unitWidth) {
      ctx.fillText(cleanText, x + xOffset, y);
    }
    rowIdx++;
  }

  ctx.restore();
}

// ==========================================
// Live Preview
// ==========================================

async function renderCurrentPagePreview() {
  if (!state.file || state.isRendering) return;
  state.isRendering = true;

  try {
    previewEmptyState.style.display = 'none';
    previewCanvas.style.display = 'block';

    const ctx = previewCanvas.getContext('2d');

    if (state.fileType === 'pdf' && state.pdfDoc) {
      const page = await state.pdfDoc.getPage(state.currentPage);
      const viewport = page.getViewport({ scale: 1.5 });

      previewCanvas.width = viewport.width;
      previewCanvas.height = viewport.height;

      await page.render({ canvasContext: ctx, viewport }).promise;
      drawWatermark(ctx, previewCanvas.width, previewCanvas.height, state.options);

    } else if (state.fileType === 'image' && state.imageObj) {
      const img = state.imageObj;
      previewCanvas.width = img.naturalWidth;
      previewCanvas.height = img.naturalHeight;

      ctx.drawImage(img, 0, 0);
      drawWatermark(ctx, previewCanvas.width, previewCanvas.height, state.options);
    }

    pageIndicator.textContent = `${i18n[currentLang].page} ${state.currentPage} / ${state.numPages}`;
    btnPrevPage.disabled = state.currentPage <= 1;
    btnNextPage.disabled = state.currentPage >= state.numPages;

  } catch (err) {
    console.error("Preview error:", err);
  } finally {
    state.isRendering = false;
  }
}

// ==========================================
// PDF Export (Raster Flattening)
// ==========================================

async function generateAndDownloadPdf() {
  if (!state.file) return;

  btnDownloadPdf.disabled = true;
  btnDownloadImg.disabled = true;
  progressContainer.style.display = 'block';

  try {
    const { jsPDF } = window.jspdf;
    let pdf = null;

    if (state.fileType === 'pdf') {
      const totalPages = state.pdfDoc.numPages;

      for (let i = 1; i <= totalPages; i++) {
        const pct = Math.round(((i - 1) / totalPages) * 100);
        progressBarFill.style.width = `${pct}%`;
        progressText.textContent = `${i18n[currentLang].processing} (${i}/${totalPages})`;

        const page = await state.pdfDoc.getPage(i);
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        const offscreen = document.createElement('canvas');
        offscreen.width = viewport.width;
        offscreen.height = viewport.height;
        const offCtx = offscreen.getContext('2d');

        await page.render({ canvasContext: offCtx, viewport }).promise;
        drawWatermark(offCtx, offscreen.width, offscreen.height, state.options);

        const imgData = offscreen.toDataURL('image/jpeg', 0.88);
        const ptWidth = viewport.width / scale;
        const ptHeight = viewport.height / scale;
        const orientation = ptWidth > ptHeight ? 'landscape' : 'portrait';

        if (i === 1) {
          pdf = new jsPDF({ orientation, unit: 'pt', format: [ptWidth, ptHeight] });
        } else {
          pdf.addPage([ptWidth, ptHeight], orientation);
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');
      }

    } else if (state.fileType === 'image') {
      progressBarFill.style.width = '50%';
      progressText.textContent = i18n[currentLang].processing;

      const img = state.imageObj;
      const offscreen = document.createElement('canvas');
      offscreen.width = img.naturalWidth;
      offscreen.height = img.naturalHeight;
      const offCtx = offscreen.getContext('2d');

      offCtx.drawImage(img, 0, 0);
      drawWatermark(offCtx, offscreen.width, offscreen.height, state.options);

      const imgData = offscreen.toDataURL('image/jpeg', 0.90);
      const ptWidth = (img.naturalWidth * 72) / 150;
      const ptHeight = (img.naturalHeight * 72) / 150;
      const orientation = ptWidth > ptHeight ? 'landscape' : 'portrait';

      pdf = new jsPDF({ orientation, unit: 'pt', format: [ptWidth, ptHeight] });
      pdf.addImage(imgData, 'JPEG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');
    }

    progressBarFill.style.width = '100%';

    const baseName = state.fileName.replace(/\.[^/.]+$/, "");
    pdf.save(`${baseName}_filigrane.pdf`);

    setTimeout(() => {
      progressContainer.style.display = 'none';
      progressBarFill.style.width = '0%';
    }, 1000);

  } catch (err) {
    console.error("Export error:", err);
    alert("An error occurred while generating the PDF.");
    progressContainer.style.display = 'none';
  } finally {
    btnDownloadPdf.disabled = false;
    btnDownloadImg.disabled = false;
  }
}

function downloadCurrentPageAsImage() {
  if (!previewCanvas || previewCanvas.style.display === 'none') return;

  const link = document.createElement('a');
  const baseName = state.fileName.replace(/\.[^/.]+$/, "");
  const pageSuffix = state.numPages > 1 ? `_p${state.currentPage}` : '';
  link.download = `${baseName}_filigrane${pageSuffix}.jpg`;
  link.href = previewCanvas.toDataURL('image/jpeg', 0.92);
  link.click();
}

// Start Application & Service Worker
document.addEventListener('DOMContentLoaded', () => {
  init();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('PWA Service Worker ready:', reg.scope))
        .catch((err) => console.log('SW registration skipped:', err));
    });
  }
});

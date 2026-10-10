/**
 * Filigrane Privé — 100% Local Client-Side Watermarking
 * Zero server uploads. Raster flattening for tamper-proof security.
 */

// Configure PDF.js Worker
if (window.pdfjsLib) {
  window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'vendor/pdf.worker.min.js';
}

const state = {
  file: null,
  fileName: '',
  fileType: null, // 'pdf' | 'image'
  pdfDoc: null,
  imageObj: null,
  numPages: 0,
  currentPage: 1,
  zoomScale: 1.0,
  isRendering: false,
  options: {
    text: 'DOCUMENT EXCLUSIVEMENT DESTINÉ À LA LOCATION IMMOBILIÈRE',
    opacity: 0.25,
    fontSize: 26,
    spacing: 28, // 2.8x
    angle: -32,
    color: '#2d3748',
    separator: '   •   ',
    flatten: true,
  },
};

// DOM Elements
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
const colorOptions = document.querySelectorAll('.color-option');
const chkFlatten = document.getElementById('chk-flatten');

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
const btnZoomIn = document.getElementById('btn-zoom-in');
const btnZoomOut = document.getElementById('btn-zoom-out');
const btnZoomReset = document.getElementById('btn-zoom-reset');

// ==========================================
// Initialization & Event Listeners
// ==========================================

function init() {
  setupUploadEvents();
  setupOptionEvents();
  setupPreviewEvents();
  setupDownloadEvents();
}

// Upload Handling
function setupUploadEvents() {
  btnBrowse.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelected(e.target.files[0]);
    }
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('drag-active');
    });
  });

  ['dragleave', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (e) => {
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
      const txt = chip.getAttribute('data-text');
      watermarkTextEl.value = txt;
      state.options.text = txt;
      renderCurrentPagePreview();
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
    if (val < 22) valSpacing.textContent = 'Très serré';
    else if (val < 32) valSpacing.textContent = 'Normal';
    else valSpacing.textContent = 'Aéré';
    state.options.spacing = val;
    renderCurrentPagePreview();
  });

  sliderAngle.addEventListener('input', (e) => {
    const val = parseInt(e.target.value, 10);
    valAngle.textContent = `${val}°`;
    state.options.angle = val;
    renderCurrentPagePreview();
  });

  colorOptions.forEach((opt) => {
    opt.addEventListener('click', () => {
      colorOptions.forEach((o) => o.classList.remove('active'));
      opt.classList.add('active');
      state.options.color = opt.getAttribute('data-color');
      renderCurrentPagePreview();
    });
  });

  chkFlatten.addEventListener('change', (e) => {
    state.options.flatten = e.target.checked;
  });
}

// Preview Toolbar Events
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

  btnZoomIn.addEventListener('click', () => {
    state.zoomScale = Math.min(2.5, state.zoomScale + 0.2);
    applyZoom();
  });

  btnZoomOut.addEventListener('click', () => {
    state.zoomScale = Math.max(0.5, state.zoomScale - 0.2);
    applyZoom();
  });

  btnZoomReset.addEventListener('click', () => {
    state.zoomScale = 1.0;
    applyZoom();
  });
}

function applyZoom() {
  if (previewCanvas.style.display !== 'none') {
    previewCanvas.style.transform = `scale(${state.zoomScale})`;
    previewCanvas.style.transformOrigin = 'center top';
  }
}

// Download Events
function setupDownloadEvents() {
  btnDownloadPdf.addEventListener('click', () => {
    generateAndDownloadPdf();
  });

  btnDownloadImg.addEventListener('click', () => {
    downloadCurrentPageAsImage();
  });
}

// ==========================================
// File Processing
// ==========================================

async function handleFileSelected(file) {
  state.file = file;
  state.fileName = file.name;
  state.currentPage = 1;
  state.zoomScale = 1.0;

  const sizeKb = Math.round(file.size / 1024);
  const sizeText = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} Mo` : `${sizeKb} Ko`;

  fileNameEl.textContent = file.name;
  fileDetailsEl.textContent = `Chargement... • ${sizeText}`;
  dropzone.style.display = 'none';
  fileLoadedInfo.style.display = 'flex';

  try {
    if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
      state.fileType = 'pdf';
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
      state.pdfDoc = await loadingTask.promise;
      state.numPages = state.pdfDoc.numPages;
      fileDetailsEl.textContent = `${state.numPages} page${state.numPages > 1 ? 's' : ''} • ${sizeText}`;
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
      fileDetailsEl.textContent = `Image • ${img.naturalWidth}×${img.naturalHeight}px • ${sizeText}`;
    } else {
      alert("Format de fichier non pris en charge. Veuillez sélectionner un fichier PDF, JPG ou PNG.");
      resetLoadedFile();
      return;
    }

    // Enable download buttons
    btnDownloadPdf.disabled = false;
    btnDownloadImg.disabled = false;

    // Render preview
    renderCurrentPagePreview();
  } catch (err) {
    console.error("Erreur lors de l'ouverture du document :", err);
    alert("Impossible de lire ce document. Assurez-vous qu'il ne soit pas corrompu ou protégé par mot de passe.");
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
  pageIndicator.textContent = 'Page 0 / 0';
  btnPrevPage.disabled = true;
  btnNextPage.disabled = true;
}

// Generate a realistic sample passport on canvas to test without uploading
function loadSamplePassport() {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 850;
  const ctx = canvas.getContext('2d');

  // Background
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Border & Header
  ctx.strokeStyle = '#0284c7';
  ctx.lineWidth = 6;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 26px Arial, sans-serif';
  ctx.fillText("RÉPUBLIQUE FRANÇAISE — SPÉCIMEN PASSEPORT", 50, 75);

  ctx.font = '16px Arial, sans-serif';
  ctx.fillStyle = '#64748b';
  ctx.fillText("DOCUMENT FICTIF DESTINÉ AU TEST DE FILIGRANE LOCAL", 50, 105);

  // Photo box
  ctx.fillStyle = '#e2e8f0';
  ctx.fillRect(50, 150, 240, 320);
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.strokeRect(50, 150, 240, 320);

  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText("PHOTO", 170, 300);
  ctx.font = '14px Arial, sans-serif';
  ctx.fillText("SPÉCIMEN", 170, 330);
  ctx.textAlign = 'left';

  // Details
  const fields = [
    ["Type / Type", "P"],
    ["Code pays / Country code", "FRA"],
    ["Passeport N° / Passport No.", "24AA00000"],
    ["Nom / Surname", "MARTIN"],
    ["Prénoms / Given names", "CAMILLE JEAN"],
    ["Nationalité / Nationality", "FRANÇAISE"],
    ["Date de naissance / Date of birth", "15 MAI 1988"],
    ["Sexe / Sex", "F"],
    ["Lieu de naissance / Place of birth", "PARIS (75)"],
    ["Date de délivrance / Date of issue", "10 OCT 2024"],
    ["Date d'expiration / Date of expiry", "09 OCT 2034"]
  ];

  let startY = 175;
  fields.forEach(([label, val], idx) => {
    const colX = idx < 6 ? 330 : 680;
    const rowY = startY + ((idx % 6) * 55);

    ctx.fillStyle = '#64748b';
    ctx.font = '13px Arial, sans-serif';
    ctx.fillText(label, colX, rowY);

    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.fillText(val, colX, rowY + 22);
  });

  // Machine Readable Zone (MRZ)
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(40, 520, canvas.width - 80, 280);
  ctx.strokeStyle = '#cbd5e1';
  ctx.strokeRect(40, 520, canvas.width - 80, 280);

  ctx.fillStyle = '#1e293b';
  ctx.font = 'bold 26px "Courier New", Courier, monospace';
  ctx.fillText("P<FRAMARTIN<<CAMILLE<JEAN<<<<<<<<<<<<<<<<<<<", 60, 620);
  ctx.fillText("24AA000008FRA8805152F3410091<<<<<<<<<<<<<<04", 60, 690);

  canvas.toBlob((blob) => {
    const testFile = new File([blob], "specimen_passeport_test.png", { type: "image/png" });
    handleFileSelected(testFile);
  });
}

// ==========================================
// Watermark Drawing Engine (Canvas)
// ==========================================

function drawWatermark(ctx, width, height, options) {
  const diag = Math.hypot(width, height);
  // Scale font size relative to canvas width
  const baseFontSize = Math.max(16, Math.round(width * (options.fontSize / 950)));

  ctx.save();
  // Center context
  ctx.translate(width / 2, height / 2);
  ctx.rotate((options.angle * Math.PI) / 180);

  ctx.font = `bold ${baseFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
  ctx.fillStyle = options.color;
  ctx.globalAlpha = parseFloat(options.opacity);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const cleanText = (options.text.trim() || 'DOCUMENT FILIGRANÉ') + options.separator;
  const metrics = ctx.measureText(cleanText);
  const unitWidth = metrics.width;
  const rowHeight = baseFontSize * (options.spacing / 10);

  const startY = -diag;
  const endY = diag;
  const startX = -diag;
  const endX = diag;

  let rowIdx = 0;
  for (let y = startY; y < endY; y += rowHeight) {
    // Stagger alternating rows for complete, gapless diamond coverage
    const xOffset = (rowIdx % 2 === 1) ? (unitWidth / 2) : 0;
    for (let x = startX - unitWidth; x < endX + unitWidth; x += unitWidth) {
      ctx.fillText(cleanText, x + xOffset, y);
    }
    rowIdx++;
  }

  ctx.restore();
}

// ==========================================
// Real-Time Preview
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
      // High-DPI viewport scale for crisp preview
      const viewport = page.getViewport({ scale: 1.6 });

      previewCanvas.width = viewport.width;
      previewCanvas.height = viewport.height;

      // 1. Render PDF page
      await page.render({
        canvasContext: ctx,
        viewport: viewport
      }).promise;

      // 2. Draw watermark layer on top
      drawWatermark(ctx, previewCanvas.width, previewCanvas.height, state.options);

    } else if (state.fileType === 'image' && state.imageObj) {
      const img = state.imageObj;
      previewCanvas.width = img.naturalWidth;
      previewCanvas.height = img.naturalHeight;

      // 1. Draw Image
      ctx.drawImage(img, 0, 0);

      // 2. Draw watermark layer on top
      drawWatermark(ctx, previewCanvas.width, previewCanvas.height, state.options);
    }

    // Update navigation controls
    pageIndicator.textContent = `Page ${state.currentPage} / ${state.numPages}`;
    btnPrevPage.disabled = state.currentPage <= 1;
    btnNextPage.disabled = state.currentPage >= state.numPages;

    applyZoom();
  } catch (err) {
    console.error("Erreur lors de l'affichage de l'aperçu :", err);
  } finally {
    state.isRendering = false;
  }
}

// ==========================================
// PDF & Image Export (Raster Flattening)
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
        // Update progress UI
        const pct = Math.round(((i - 1) / totalPages) * 100);
        progressBarFill.style.width = `${pct}%`;
        progressText.textContent = `Rastérisation & filigrane de la page ${i}/${totalPages}...`;

        // Render page at 200 DPI (scale ~2.77) for high-quality printing & readability
        const page = await state.pdfDoc.getPage(i);
        const scale = 2.0; // 2x scale for sharp output
        const viewport = page.getViewport({ scale });

        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = viewport.width;
        offscreenCanvas.height = viewport.height;
        const offCtx = offscreenCanvas.getContext('2d');

        // Draw PDF content
        await page.render({
          canvasContext: offCtx,
          viewport: viewport
        }).promise;

        // Draw watermark directly into the pixels
        drawWatermark(offCtx, offscreenCanvas.width, offscreenCanvas.height, state.options);

        // Compress as JPEG to embed in PDF
        const imgData = offscreenCanvas.toDataURL('image/jpeg', 0.88);

        // Native PDF dimensions in points (pt)
        const ptWidth = viewport.width / scale;
        const ptHeight = viewport.height / scale;
        const orientation = ptWidth > ptHeight ? 'landscape' : 'portrait';

        if (i === 1) {
          pdf = new jsPDF({
            orientation,
            unit: 'pt',
            format: [ptWidth, ptHeight]
          });
        } else {
          pdf.addPage([ptWidth, ptHeight], orientation);
        }

        pdf.addImage(imgData, 'JPEG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');
      }

    } else if (state.fileType === 'image') {
      progressBarFill.style.width = '50%';
      progressText.textContent = "Génération du PDF sécurisé...";

      const img = state.imageObj;
      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = img.naturalWidth;
      offscreenCanvas.height = img.naturalHeight;
      const offCtx = offscreenCanvas.getContext('2d');

      offCtx.drawImage(img, 0, 0);
      drawWatermark(offCtx, offscreenCanvas.width, offscreenCanvas.height, state.options);

      const imgData = offscreenCanvas.toDataURL('image/jpeg', 0.90);

      // 72 pt per inch standard
      const ptWidth = (img.naturalWidth * 72) / 150;
      const ptHeight = (img.naturalHeight * 72) / 150;
      const orientation = ptWidth > ptHeight ? 'landscape' : 'portrait';

      pdf = new jsPDF({
        orientation,
        unit: 'pt',
        format: [ptWidth, ptHeight]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0, ptWidth, ptHeight, undefined, 'FAST');
    }

    progressBarFill.style.width = '100%';
    progressText.textContent = "Téléchargement...";

    // Output filename
    const baseName = state.fileName.replace(/\.[^/.]+$/, "");
    const outputName = `${baseName}_filigrane.pdf`;
    pdf.save(outputName);

    setTimeout(() => {
      progressContainer.style.display = 'none';
      progressBarFill.style.width = '0%';
    }, 1200);

  } catch (err) {
    console.error("Erreur lors de la génération du PDF :", err);
    alert("Une erreur est survenue lors de la création du fichier PDF.");
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

// Start application
document.addEventListener('DOMContentLoaded', () => {
  init();

  // Register Service Worker for offline PWA functionality
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./sw.js')
        .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
        .catch((err) => console.log('Service Worker registration skipped:', err));
    });
  }
});

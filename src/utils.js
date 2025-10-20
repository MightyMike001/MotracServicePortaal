export const $ = (selector, scope = document) => scope.querySelector(selector);
export const $$ = (selector, scope = document) => Array.from(scope.querySelectorAll(selector));

export const fmtDate = iso => {
  if (!iso) return '—';
  const date = new Date(iso);
  return Number.isNaN(date.valueOf()) ? '—' : date.toLocaleDateString('nl-NL');
};

export const fmtDateTime = iso => {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.valueOf())) {
    return '—';
  }
  return date.toLocaleString('nl-NL', {
    dateStyle: 'short',
    timeStyle: 'short'
  });
};

const formatNumericValue = value => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value.toLocaleString('nl-NL');
  }
  if (typeof value === 'string' && value.trim() !== '') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return numeric.toLocaleString('nl-NL');
    }
  }
  return '—';
};

const formatNumericHtml = (value, date) => {
  const odo = formatNumericValue(value);
  const formattedDate = fmtDate(date);
  if (formattedDate === '—') {
    return odo;
  }
  return `${odo} <span class="text-xs text-gray-500">(${formattedDate})</span>`;
};

const formatNumericLabel = (value, date) => {
  const odo = formatNumericValue(value);
  const formattedDate = fmtDate(date);
  return formattedDate === '—' ? odo : `${odo} (${formattedDate})`;
};

export const formatHoursValue = formatNumericValue;
export const formatHoursHtml = formatNumericHtml;
export const formatHoursLabel = formatNumericLabel;

export const formatOdoValue = formatNumericValue;
export const formatOdoHtml = formatNumericHtml;
export const formatOdoLabel = formatNumericLabel;

const STATUS_TONE_CLASSES = {
  success: 'status-badge status-badge--success',
  danger: 'status-badge status-badge--danger',
  warning: 'status-badge status-badge--warning',
  info: 'status-badge status-badge--info'
};

export function renderStatusBadge(label, tone = 'info') {
  const key = typeof tone === 'string' && tone ? tone.toLowerCase() : 'info';
  const className = STATUS_TONE_CLASSES[key] || STATUS_TONE_CLASSES.info;
  const text = typeof label === 'string' ? label : String(label ?? '');
  return `<span class="${className}">${text}</span>`;
}

export function getToneForActivityStatus(status) {
  const normalised = (status || '').toLowerCase();
  if (normalised === 'afgerond') return 'success';
  if (normalised === 'open' || normalised === 'geannuleerd') return 'danger';
  if (normalised === 'in behandeling') return 'warning';
  return 'info';
}

export function getToneForBmwStatus(status) {
  const normalised = (status || '').toLowerCase();
  if (normalised === 'goedgekeurd') return 'success';
  if (normalised === 'afkeur' || normalised === 'afgekeurd') return 'danger';
  if (normalised === 'in behandeling') return 'warning';
  return 'info';
}

export function getToneForAccountRequestStatus(status) {
  const normalised = (status || '').toLowerCase();
  if (normalised === 'approved') return 'success';
  if (normalised === 'rejected') return 'danger';
  if (normalised === 'pending') return 'warning';
  return 'info';
}

export function toggleButtonLoading(button, isLoading, { label } = {}) {
  if (!(button instanceof HTMLElement)) return;
  if (isLoading) {
    if (!button.dataset.loadingOriginal) {
      button.dataset.loadingOriginal = button.innerHTML;
    }
    const textSource = typeof label === 'string' && label.trim() ? label : (button.textContent || '').trim() || 'Bezig…';
    button.innerHTML = `<span class="button-spinner" aria-hidden="true"></span><span class="button-loading__label">${textSource}</span>`;
    button.disabled = true;
    button.classList.add('button--loading');
    button.setAttribute('aria-busy', 'true');
  } else {
    if (button.dataset.loadingOriginal != null) {
      button.innerHTML = button.dataset.loadingOriginal;
    }
    button.disabled = false;
    button.classList.remove('button--loading');
    button.removeAttribute('aria-busy');
  }
}

const toggleModalVisibility = (modal, shouldOpen) => {
  if (!(modal instanceof Element)) return;
  if (modal instanceof HTMLDialogElement) {
    if (shouldOpen) {
      if (!modal.open) {
        modal.showModal();
      }
    } else if (modal.open) {
      modal.close();
    }
    return;
  }

  if (shouldOpen) {
    modal.classList.add('show');
  } else {
    modal.classList.remove('show');
  }
};

export function openModal(selector) {
  const el = $(selector);
  if (el) {
    toggleModalVisibility(el, true);
  }
}

export function closeModals() {
  $$('.modal').forEach(modal => toggleModalVisibility(modal, false));
}

export function closeModal(modal) {
  if (!modal) return;
  toggleModalVisibility(modal, false);
}

export const kv = (label, value) => `
  <div>
    <div class="text-xs text-gray-500">${label}</div>
    <div class="font-medium">${value ?? '—'}</div>
  </div>
`;

export function formatCustomerOwnership(customer, fallback = '—') {
  if (customer && typeof customer === 'object' && !Array.isArray(customer)) {
    const name = typeof customer.name === 'string' ? customer.name.trim() : '';
    const branch = typeof customer.subLocation === 'string' ? customer.subLocation.trim() : '';
    if (name) {
      return branch ? `${name} – ${branch}` : name;
    }
  }

  if (typeof fallback === 'string' && fallback.trim() !== '') {
    return fallback;
  }

  return '—';
}

const CSV_DELIMITER = ';';
const CSV_BOM = '\ufeff';

const toCsvValue = value => {
  const stringValue = value == null ? '' : String(value);
  const escaped = stringValue.replace(/"/g, '""');
  if (escaped.includes(CSV_DELIMITER) || /["\n\r]/.test(escaped)) {
    return `"${escaped}"`;
  }
  return escaped;
};

export function createCsvContent(headers, rows, delimiter = CSV_DELIMITER) {
  const effectiveDelimiter = typeof delimiter === 'string' && delimiter.length ? delimiter : CSV_DELIMITER;
  const headerLine = headers.map(header => toCsvValue(header)).join(effectiveDelimiter);
  const dataLines = rows.map(row => row.map(cell => toCsvValue(cell)).join(effectiveDelimiter));
  return [CSV_BOM + headerLine, ...dataLines].join('\r\n');
}

export function downloadBlob(blob, filename) {
  if (!(blob instanceof Blob)) return;
  const safeName = typeof filename === 'string' && filename.trim() ? filename.trim() : 'export.dat';
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = safeName;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  requestAnimationFrame(() => URL.revokeObjectURL(url));
}

const sanitizeForPdf = value => {
  if (value == null) return '';
  let text = String(value);
  if (typeof text.normalize === 'function') {
    text = text.normalize('NFKD').replace(/[\u0300-\u036f]/g, '');
  }
  text = text.replace(/[^\x20-\x7E]/g, '?');
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
};

const normalizeExportValue = value => (value == null ? '' : String(value).trim());

const buildRowSegments = (value, width) => {
  const sanitized = sanitizeForPdf(value);
  const segments = [];
  if (!sanitized.length) {
    segments.push('');
    return segments;
  }
  for (let index = 0; index < sanitized.length; index += width) {
    segments.push(sanitized.slice(index, index + width));
  }
  return segments;
};

const buildTableLines = (headers, rows) => {
  const normalisedHeaders = headers.map(header => normalizeExportValue(header) || ' ');
  const normalisedRows = rows.map(row => headers.map((_, index) => normalizeExportValue(row[index])));
  const sanitizedLength = value => sanitizeForPdf(value || '').length;
  const columnWidths = normalisedHeaders.map((header, index) => {
    const headerLength = sanitizedLength(header);
    const maxCell = normalisedRows.reduce((max, row) => Math.max(max, sanitizedLength(row[index])), headerLength);
    return Math.max(4, Math.min(40, maxCell || headerLength || 4));
  });

  const padCell = (value, index) => {
    const width = columnWidths[index];
    return value.padEnd(width, ' ');
  };

  const headerLines = [];
  const headerSegments = normalisedHeaders.map((header, index) => buildRowSegments(header, columnWidths[index]));
  const headerLineCount = Math.max(...headerSegments.map(segments => segments.length));
  for (let lineIndex = 0; lineIndex < headerLineCount; lineIndex += 1) {
    const line = headerSegments
      .map((segments, colIndex) => padCell(segments[lineIndex] ?? '', colIndex))
      .join('   ');
    headerLines.push(line);
  }

  const separator = columnWidths
    .map(width => '-'.repeat(Math.min(width, 40)).padEnd(width, '-'))
    .join('   ');

  const bodyLines = [];
  normalisedRows.forEach(row => {
    const segments = row.map((cell, index) => buildRowSegments(cell, columnWidths[index]));
    const segmentCount = Math.max(...segments.map(items => items.length));
    for (let lineIndex = 0; lineIndex < segmentCount; lineIndex += 1) {
      const line = segments
        .map((items, colIndex) => padCell(items[lineIndex] ?? '', colIndex))
        .join('   ');
      bodyLines.push(line);
    }
  });

  return { headerLines, separator, bodyLines };
};

const concatUint8Arrays = arrays => {
  const totalLength = arrays.reduce((total, array) => total + array.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  arrays.forEach(array => {
    result.set(array, offset);
    offset += array.length;
  });
  return result;
};

export function createTablePdfBlob({ title, headers, rows }) {
  const encoder = new TextEncoder();
  const safeTitle = sanitizeForPdf(normalizeExportValue(title) || 'Export');
  const { headerLines, separator, bodyLines } = buildTableLines(headers, rows);
  const lines = [safeTitle, '', ...headerLines, separator, ...bodyLines];

  const marginLeft = 40;
  const startY = 800;
  const contentParts = ['BT', `1 0 0 1 ${marginLeft} ${startY} Tm`, '12 Tf', '16 TL'];
  lines.forEach((line, index) => {
    if (index === 0) {
      contentParts.push(`(${line}) Tj`);
    } else {
      contentParts.push('T*');
      contentParts.push(`(${line}) Tj`);
    }
  });
  contentParts.push('ET');

  const contentStream = contentParts.join('\n');
  const headerBuffer = encoder.encode('%PDF-1.4\n');
  const contentBuffer = encoder.encode(contentStream);
  const objects = [
    '1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n',
    '2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n',
    '3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n',
    `4 0 obj\n<< /Length ${contentBuffer.length} >>\nstream\n${contentStream}\nendstream\nendobj\n`,
    '5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>\nendobj\n'
  ];
  const objectBuffers = objects.map(object => encoder.encode(object));

  const offsets = [0];
  let runningOffset = headerBuffer.length;
  objectBuffers.forEach(buffer => {
    offsets.push(runningOffset);
    runningOffset += buffer.length;
  });

  const xrefOffset = runningOffset;
  let xrefContent = `xref\n0 ${objects.length + 1}\n`;
  xrefContent += '0000000000 65535 f \n';
  for (let index = 1; index <= objects.length; index += 1) {
    xrefContent += `${offsets[index].toString().padStart(10, '0')} 00000 n \n`;
  }
  const xrefBuffer = encoder.encode(xrefContent);

  const trailerContent = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  const trailerBuffer = encoder.encode(trailerContent);

  const pdfBytes = concatUint8Arrays([headerBuffer, ...objectBuffers, xrefBuffer, trailerBuffer]);
  return new Blob([pdfBytes], { type: 'application/pdf' });
}

const normaliseFilenamePart = value => {
  if (typeof value !== 'string') return 'export';
  const trimmed = value.trim().toLowerCase();
  if (!trimmed) return 'export';
  return trimmed.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'export';
};

export function buildExportFilename(prefix, extension) {
  const base = normaliseFilenamePart(prefix);
  const ext = typeof extension === 'string' ? extension.trim().replace(/^\./, '') : '';
  const now = new Date();
  const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(
    now.getHours()
  ).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const suffix = ext ? `${base}-${stamp}.${ext}` : `${base}-${stamp}`;
  return suffix;
}

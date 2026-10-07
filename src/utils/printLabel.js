function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Prints the barcode label (name + price + barcode) as its own clean
// document in a popup window, instead of hiding the rest of the app via
// print CSS on the live page. That in-page approach (visibility: hidden on
// everything but a `.print-area`, with the page's own @page rule resized to
// match it) turned out unreliable in practice — some printer drivers ignore
// a custom @page size requested from a live, fully-styled app document and
// fall back to the default paper size, leaving the label tiny in a sea of
// blank page plus Chrome's date/title/URL header-footer. A brand-new,
// minimal document has nothing else to hide, and `@page { margin: 0 }` on a
// page with nothing but the label reliably drops that header-footer too.
export function printLabel({ svg, name, price }) {
  if (!svg) return;
  const svgMarkup = new XMLSerializer().serializeToString(svg);

  const printWindow = window.open('', '_blank', 'width=420,height=520');
  if (!printWindow) return; // popup blocked — nothing to fall back to without another user gesture

  printWindow.document.write(`<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(name)}</title>
<style>
  @page { size: auto; margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { height: 100%; }
  body {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 24px;
    font-family: system-ui, sans-serif;
  }
  .name { font-size: 28px; font-weight: 600; text-align: center; }
  .price { font-size: 22px; color: #333; }
  svg { width: 320px; height: auto; }
</style>
</head>
<body>
  <div class="name">${escapeHtml(name)}</div>
  <div class="price">${escapeHtml(price)}</div>
  ${svgMarkup}
</body>
</html>`);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    printWindow.onafterprint = () => printWindow.close();
  };
}

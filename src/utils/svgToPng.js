// Rasterizes a JsBarcode <svg> plus a name/price label into one PNG and
// triggers a download. The name/price are plain HTML text next to the SVG
// on screen, not part of the SVG itself — serializing just the <svg> (the
// original approach here) silently dropped them from the exported file.
// Drawing them as canvas text instead, above the barcode image, is what
// actually gets them into the downloaded PNG.
export function downloadBarcodeLabelPng({ svg, name, price, filename, scale = 4 }) {
  if (!svg) return;
  const svgData = new XMLSerializer().serializeToString(svg);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const img = new Image();
  img.onload = () => {
    const padding = 16 * scale;
    const gap = 6 * scale;
    const nameFont = `600 ${22 * scale}px sans-serif`;
    const priceFont = `${20 * scale}px sans-serif`;
    const barcodeWidth = img.width * scale;
    const barcodeHeight = img.height * scale;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    // Label text is drawn as plain pixels here, never fed to JsBarcode, so
    // it can never end up encoded in the barcode itself — only the scanned
    // digits under the bars (rendered by JsBarcode's own displayValue) are
    // the real barcode.
    ctx.font = nameFont;
    const nameWidth = ctx.measureText(name).width;
    ctx.font = priceFont;
    const priceWidth = ctx.measureText(price).width;

    canvas.width = Math.max(nameWidth, priceWidth, barcodeWidth) + padding * 2;
    canvas.height = padding * 2 + 22 * scale + gap + 20 * scale + gap + barcodeHeight;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    let y = padding;
    ctx.font = nameFont;
    ctx.fillText(name, canvas.width / 2, y);
    y += 22 * scale + gap;
    ctx.font = priceFont;
    ctx.fillText(price, canvas.width / 2, y);
    y += 20 * scale + gap;

    ctx.drawImage(img, (canvas.width - barcodeWidth) / 2, y, barcodeWidth, barcodeHeight);

    URL.revokeObjectURL(url);
    canvas.toBlob((blob) => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.click();
      URL.revokeObjectURL(link.href);
    }, 'image/png');
  };
  img.src = url;
}

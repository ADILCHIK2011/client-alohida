import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Modal } from './Modal';
import { Button } from './Button';
import { downloadSvgAsPng } from '../utils/svgToPng';

// CODE128 (not EAN13) — a product's barcode can come from a manufacturer, a
// CSV import, or manual typing, so it isn't guaranteed to be a valid EAN13
// checksum like BarcodeGeneratorPage's always-generated codes are. CODE128
// renders any string without that constraint.
export function ProductBarcodeModal({ product, onClose }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !product?.barcode) return;
    JsBarcode(svgRef.current, product.barcode, {
      format: 'CODE128',
      width: 2.5,
      height: 90,
      fontSize: 18,
      margin: 12,
      displayValue: true,
    });
  }, [product?.barcode]);

  function handleDownload() {
    downloadSvgAsPng(svgRef.current, `shtrix-kod-${product.barcode}.png`);
  }

  function handlePrint() {
    window.print();
  }

  return (
    <Modal title={product.name} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <div className="print-area flex flex-col items-center gap-2 rounded-field border border-base-300 bg-white p-4">
          <p className="font-medium text-black">{product.name}</p>
          <p className="text-sm text-black/70">
            {product.price.toLocaleString()} so'm{product.unit === 'kg' ? '/kg' : ''}
          </p>
          <svg ref={svgRef} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" onClick={handleDownload}>
            Yuklab olish (PNG)
          </Button>
          <Button type="button" variant="secondary" onClick={handlePrint}>
            Chop etish
          </Button>
        </div>
      </div>
    </Modal>
  );
}

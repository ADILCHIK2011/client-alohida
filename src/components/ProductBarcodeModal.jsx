import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { Modal } from './Modal';
import { Button } from './Button';
import { downloadBarcodeLabelPng } from '../utils/svgToPng';
import { printLabel } from '../utils/printLabel';
import { unitSuffix } from '../data/units';

// One barcode block (name + price + a single code's bars). A product can
// carry more than one barcode (see Product.extraBarcodes) — each gets its
// own block with its own download/print actions, independent of the others.
function BarcodeBlock({ code, name, price }) {
  const svgRef = useRef(null);

  // CODE128 (not EAN13) — a product's barcode can come from a manufacturer, a
  // CSV import, or manual typing, so it isn't guaranteed to be a valid EAN13
  // checksum like BarcodeGeneratorPage's always-generated codes are. CODE128
  // renders any string without that constraint.
  useEffect(() => {
    if (!svgRef.current || !code) return;
    JsBarcode(svgRef.current, code, {
      format: 'CODE128',
      width: 2.5,
      height: 90,
      fontSize: 18,
      margin: 12,
      displayValue: true,
    });
  }, [code]);

  function handleDownload() {
    downloadBarcodeLabelPng({ svg: svgRef.current, name, price, filename: `shtrix-kod-${code}.png` });
  }

  function handlePrint() {
    printLabel({ svg: svgRef.current, name, price });
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col items-center gap-2 rounded-field border border-base-300 bg-white p-4">
        <p className="font-medium text-black">{name}</p>
        <p className="text-sm text-black/70">{price}</p>
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
  );
}

export function ProductBarcodeModal({ product, onClose }) {
  const price = `${product.price.toLocaleString()} so'm${unitSuffix(product.unit)}`;
  const codes = [product.barcode, ...(product.extraBarcodes || [])];

  return (
    <Modal title={product.name} onClose={onClose}>
      <div className="flex flex-col gap-5">
        {codes.map((code) => (
          <BarcodeBlock key={code} code={code} name={product.name} price={price} />
        ))}
      </div>
    </Modal>
  );
}

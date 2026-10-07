import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { useNavigate } from 'react-router-dom';
import { generateBarcode, createProduct } from '../api/products.api';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { printLabel } from '../utils/printLabel';
import { UNIT_OPTIONS, isFractionalUnit, unitSuffix } from '../data/units';

export function BarcodeGeneratorPage() {
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [unit, setUnit] = useState('dona');
  const isFractional = isFractionalUnit(unit);
  const [barcode, setBarcode] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!barcode || !svgRef.current) return;
    JsBarcode(svgRef.current, barcode, {
      format: 'CODE128',
      width: 2.5,
      height: 90,
      fontSize: 18,
      margin: 12,
      displayValue: true,
    });
  }, [barcode]);

  async function handleGenerate(e) {
    e.preventDefault();
    setError('');
    setSaved(false);
    setGenerating(true);
    try {
      const data = await generateBarcode();
      setBarcode(data.barcode);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setError('');
    setSaving(true);
    try {
      await createProduct({ barcode, name, price: Number(price), stock: Number(stock || 0), unit });
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  function handleReset() {
    setName('');
    setPrice('');
    setStock('');
    setUnit('dona');
    setBarcode(null);
    setSaved(false);
    setError('');
  }

  function handleDownload() {
    const svg = svgRef.current;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    const img = new Image();
    img.onload = () => {
      const scale = 4; // upscale well past screen resolution for crisp label printing
      const padding = 16 * scale;
      const gap = 6 * scale;
      const nameFont = `600 ${22 * scale}px sans-serif`;
      const priceFont = `${20 * scale}px sans-serif`;
      const priceText = `${Number(price).toLocaleString()} so'm${unitSuffix(unit)}`;
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
      const priceWidth = ctx.measureText(priceText).width;

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
      ctx.fillText(priceText, canvas.width / 2, y);
      y += 20 * scale + gap;

      ctx.drawImage(img, (canvas.width - barcodeWidth) / 2, y, barcodeWidth, barcodeHeight);

      URL.revokeObjectURL(url);
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `shtrix-kod-${barcode}.png`;
        link.click();
        URL.revokeObjectURL(link.href);
      }, 'image/png');
    };
    img.src = url;
  }

  function handlePrint() {
    printLabel({ svg: svgRef.current, name, price: `${Number(price).toLocaleString()} so'm${unitSuffix(unit)}` });
  }

  return (
    <div>
      <PageHeader
        title="Shtrix-kod generatori"
        subtitle="Yangi mahsulot uchun noyob shtrix-kod yarating, chop eting va omborga qo'shing"
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          className="flex flex-col gap-3 rounded-box border border-base-300 bg-base-100 p-6"
          onSubmit={handleGenerate}
        >
          <label className="block">
            <span className="mb-1 block text-sm text-base-content/60">Mahsulot nomi</span>
            <input
              className="input input-bordered w-full"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
          <div className="block">
            <span className="mb-1 block text-sm text-base-content/60">O'lchov birligi</span>
            <div className="join w-full">
              {UNIT_OPTIONS.map((o) => (
                <button
                  key={o.value}
                  type="button"
                  className={`btn btn-sm join-item flex-1 ${unit === o.value ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setUnit(o.value)}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="mb-1 block text-sm text-base-content/60">Sotuv narxi (so'm{unitSuffix(unit)})</span>
              <input
                className="input input-bordered w-full"
                type="number"
                min="0"
                step={isFractional ? '0.01' : '1'}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-sm text-base-content/60">Qoldiq ({unit})</span>
              <input
                className="input input-bordered w-full"
                type="number"
                min="0"
                step={isFractional ? '0.001' : '1'}
                value={stock}
                onChange={(e) => setStock(e.target.value)}
              />
            </label>
          </div>

          {error && <p className="text-sm text-error">{error}</p>}

          <div className="mt-2 flex flex-wrap gap-2">
            <Button type="submit" disabled={!name || !price || generating}>
              {generating ? 'Yaratilmoqda...' : barcode ? 'Boshqa kod yaratish' : 'Shtrix-kod yaratish'}
            </Button>
            {(barcode || name) && (
              <Button type="button" variant="secondary" onClick={handleReset}>
                Tozalash
              </Button>
            )}
          </div>
        </form>

        <div className="flex flex-col gap-4 rounded-box border border-base-300 bg-base-100 p-6">
          {!barcode && (
            <p className="m-auto text-sm text-base-content/50">
              Chapdagi formani to'ldirib, shtrix-kod yarating.
            </p>
          )}

          {barcode && (
            <>
              <div className="flex flex-col items-center gap-2 rounded-field border border-base-300 bg-white p-4">
                <p className="font-medium text-black">{name}</p>
                <p className="text-sm text-black/70">
                  {Number(price).toLocaleString()} so'm{unitSuffix(unit)}
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

              {!saved ? (
                <Button type="button" onClick={handleSave} disabled={saving} className="mt-1">
                  {saving ? 'Saqlanmoqda...' : "Saqlash va omborga qo'shish"}
                </Button>
              ) : (
                <div className="mt-1 flex flex-col gap-2">
                  <p className="text-sm text-success">
                    Mahsulot omborga qo'shildi.
                  </p>
                  <div className="flex gap-2">
                    <Button type="button" variant="secondary" onClick={handleReset}>
                      Yana bittasini yaratish
                    </Button>
                    <Button type="button" onClick={() => navigate('/products')}>
                      Mahsulotlar sahifasiga o'tish
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

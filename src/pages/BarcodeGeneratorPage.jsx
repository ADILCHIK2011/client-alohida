import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { useNavigate } from 'react-router-dom';
import { generateBarcode, createProduct } from '../api/products.api';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';

export function BarcodeGeneratorPage() {
  const navigate = useNavigate();
  const svgRef = useRef(null);
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [barcode, setBarcode] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!barcode || !svgRef.current) return;
    JsBarcode(svgRef.current, barcode, {
      format: 'EAN13',
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
      await createProduct({ barcode, name, price: Number(price), stock: Number(stock || 0) });
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
      const canvas = document.createElement('canvas');
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0);
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
    window.print();
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
          <div className="flex gap-3">
            <label className="block flex-1">
              <span className="mb-1 block text-sm text-base-content/60">Narxi (so'm)</span>
              <input
                className="input input-bordered w-full"
                type="number"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </label>
            <label className="block flex-1">
              <span className="mb-1 block text-sm text-base-content/60">Qoldiq</span>
              <input
                className="input input-bordered w-full"
                type="number"
                min="0"
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
              <div className="print-area flex flex-col items-center gap-2 rounded-field border border-base-300 bg-white p-4">
                <p className="font-medium text-black">{name}</p>
                <p className="text-sm text-black/70">{Number(price).toLocaleString()} so'm</p>
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

import { useEffect, useState } from 'react';
import { createProduct, deleteProduct, importProducts, listProducts, updateProduct } from '../api/products.api';
import { downloadTemplateCsv, parseSpreadsheetFile } from '../api/importProducts';
import { exportToXlsx } from '../api/exportXlsx';
import { useBarcodeScanner } from '../hooks/useBarcodeScanner';
import { PageHeader } from '../components/PageHeader';
import { Button } from '../components/Button';
import { Modal } from '../components/Modal';
import { ProductBarcodeModal } from '../components/ProductBarcodeModal';
import { Badge } from '../components/Badge';
import { Pagination } from '../components/Pagination';
import { getSocket } from '../socket';
import { UNIT_OPTIONS, formatQuantity, normalizeUnit, isFractionalUnit, unitSuffix } from '../data/units';

const LOW_STOCK_THRESHOLD = 5;
const PAGE_SIZE = 10;

export function ProductsPage() {
  const [exporting, setExporting] = useState(false);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [error, setError] = useState('');
  const [importOpen, setImportOpen] = useState(false);

  function reload() {
    setLoading(true);
    listProducts({ search, page, limit: PAGE_SIZE })
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .finally(() => setLoading(false));
  }

  function handleSearchChange(value) {
    setSearch(value);
    setPage(1);
  }

  useEffect(reload, [search, page]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    function handleStockChanged(diffs) {
      const diffMap = new Map(diffs.map((d) => [d.productId, d]));
      setProducts((prev) => prev.map((p) => (diffMap.has(p._id) ? { ...p, ...diffMap.get(p._id) } : p)));
    }

    function handleProductRemoved({ productId }) {
      setProducts((prev) => prev.filter((p) => p._id !== productId));
    }

    socket.on('stock:changed', handleStockChanged);
    socket.on('product:removed', handleProductRemoved);
    socket.on('products:bulk-changed', reload);
    return () => {
      socket.off('stock:changed', handleStockChanged);
      socket.off('product:removed', handleProductRemoved);
      socket.off('products:bulk-changed', reload);
    };
  }, [search, page]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const form = new FormData(e.target);
    const payload = {
      barcode: form.get('barcode'),
      name: form.get('name'),
      price: Number(form.get('price')),
      costPrice: form.get('costPrice') ? Number(form.get('costPrice')) : undefined,
      stock: Number(form.get('stock') || 0),
      unit: normalizeUnit(form.get('unit')),
    };
    try {
      if (editing._id) {
        await updateProduct(editing._id, payload);
      } else {
        await createProduct(payload);
      }
      setEditing(null);
      reload();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(product) {
    await deleteProduct(product._id);
    reload();
  }

  async function handleExport() {
    setExporting(true);
    try {
      const EXPORT_PAGE_SIZE = 100;
      let all = [];
      let pageNum = 1;
      let totalCount = Infinity;
      while (all.length < totalCount) {
        const data = await listProducts({ search, page: pageNum, limit: EXPORT_PAGE_SIZE });
        all = all.concat(data.products);
        totalCount = data.total;
        if (data.products.length === 0) break;
        pageNum += 1;
      }
      await exportToXlsx({
        filename: 'mahsulotlar.xlsx',
        sheetName: 'Mahsulotlar',
        columns: [
          { header: 'Shtrix-kod', key: 'barcode', width: 18 },
          { header: 'Nomi', key: 'name', width: 32 },
          { header: 'Narxi', key: 'price', width: 14, format: 'currency' },
          { header: 'Kirish narxi', key: 'costPrice', width: 14, format: 'currency' },
          { header: 'Qoldiq', key: 'stock', width: 12, format: 'number' },
          { header: "O'lchov birligi", key: 'unit', width: 16 },
        ],
        rows: all.map((p) => ({
          barcode: p.barcode,
          name: p.name,
          price: p.price,
          costPrice: p.costPrice ?? '',
          stock: p.stock,
          unit: p.unit,
        })),
      });
    } finally {
      setExporting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Mahsulotlar"
        subtitle="Shtrix-kodlar, narxlar va ombordagi qoldiq"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => setImportOpen(true)}>
              Excel/CSV import
            </Button>
            <Button variant="secondary" onClick={handleExport} disabled={exporting}>
              {exporting ? 'Eksport...' : "Excel'ga eksport"}
            </Button>
            <Button onClick={() => setEditing({})}>+ Mahsulot qo'shish</Button>
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          className="input input-bordered input-sm w-full sm:w-64"
          placeholder="Qidirish..."
          value={search}
          onChange={(e) => handleSearchChange(e.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-box border border-base-300 bg-base-100">
        <table className="table">
          <thead>
            <tr>
              <th>Shtrix-kod</th>
              <th>Nomi</th>
              <th>Narxi</th>
              <th>Farq</th>
              <th>Qoldiq</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p, i) => (
              <tr
                key={p._id}
                className="animate-fade-up cursor-pointer hover:bg-base-200"
                style={{ '--i': i }}
                onClick={() => setViewing(p)}
              >
                <td className="font-mono text-sm text-base-content/70">{p.barcode}</td>
                <td className="font-medium">{p.name}</td>
                <td>{p.price.toLocaleString()} so'm</td>
                <td>
                  {p.costPrice === undefined || p.costPrice === null ? (
                    <span className="text-sm text-base-content/40">—</span>
                  ) : (
                    <Badge tone={p.price - p.costPrice >= 0 ? 'success' : 'danger'}>
                      {(p.price - p.costPrice).toLocaleString()} so'm
                    </Badge>
                  )}
                </td>
                <td>
                  {p.stock <= LOW_STOCK_THRESHOLD ? (
                    <Badge tone={p.stock === 0 ? 'danger' : 'warning'}>{formatQuantity(p.stock, p.unit)}</Badge>
                  ) : (
                    <span>{formatQuantity(p.stock, p.unit)}</span>
                  )}
                </td>
                <td className="whitespace-nowrap text-right" onClick={(e) => e.stopPropagation()}>
                  <button className="btn btn-ghost btn-sm" onClick={() => setEditing(p)}>
                    Tahrirlash
                  </button>
                  <button className="btn btn-ghost btn-sm text-error" onClick={() => handleDelete(p)}>
                    O'chirish
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && products.length === 0 && (
          <div className="py-10 text-center text-base-content/50">Hali mahsulot qo'shilmagan.</div>
        )}
        <Pagination page={page} limit={PAGE_SIZE} total={total} onChange={setPage} />
      </div>

      {editing && (
        <ProductFormModal
          product={editing}
          error={error}
          onSubmit={handleSubmit}
          onClose={() => setEditing(null)}
        />
      )}

      {importOpen && <ImportModal onClose={() => setImportOpen(false)} onImported={reload} />}

      {viewing && <ProductBarcodeModal product={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function ProductFormModal({ product, error, onSubmit, onClose }) {
  const [barcode, setBarcode] = useState(product.barcode || '');
  const [unit, setUnit] = useState(product.unit || 'dona');
  const isFractional = isFractionalUnit(unit);

  useBarcodeScanner((code) => setBarcode(code));

  return (
    <Modal title={product._id ? 'Mahsulotni tahrirlash' : 'Yangi mahsulot'} onClose={onClose}>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-1 block text-sm text-base-content/60">
            Shtrix-kod <span className="text-base-content/40">(skanerlang yoki qo'lda kiriting)</span>
          </span>
          <input
            className="input input-bordered w-full font-mono"
            name="barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            required
            autoFocus
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-base-content/60">Nomi</span>
          <input className="input input-bordered w-full" name="name" defaultValue={product.name} required />
        </label>
        <div className="block">
          <span className="mb-1 block text-sm text-base-content/60">O'lchov birligi</span>
          <input type="hidden" name="unit" value={unit} />
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
            <span className="mb-1 block text-sm text-base-content/60">Narxi (so'm{unitSuffix(unit)})</span>
            <input
              className="input input-bordered w-full"
              name="price"
              type="number"
              min="0"
              step={isFractional ? '0.01' : '1'}
              defaultValue={product.price}
              required
            />
          </label>
          <label className="block flex-1">
            <span className="mb-1 block text-sm text-base-content/60">
              Kirish narxi <span className="text-base-content/40">(ixtiyoriy)</span>
            </span>
            <input
              className="input input-bordered w-full"
              name="costPrice"
              type="number"
              min="0"
              step={isFractional ? '0.01' : '1'}
              defaultValue={product.costPrice ?? ''}
            />
          </label>
        </div>
        <label className="block">
          <span className="mb-1 block text-sm text-base-content/60">Qoldiq ({unit})</span>
          <input
            className="input input-bordered w-full"
            name="stock"
            type="number"
            min="0"
            step={isFractional ? '0.001' : '1'}
            defaultValue={product.stock ?? 0}
          />
        </label>
        {error && <p className="text-sm text-error">{error}</p>}
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Bekor qilish
          </Button>
          <Button type="submit">Saqlash</Button>
        </div>
      </form>
    </Modal>
  );
}

// Sent in batches instead of one request for the whole file — keeps every
// request body small (regardless of how large the catalog is) and turns one
// slow do-or-die bulkWrite into many fast ones, with real progress instead
// of the UI looking frozen on a big import.
const IMPORT_BATCH_SIZE = 500;

function ImportModal({ onClose, onImported }) {
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError('');
    setResult(null);
    try {
      const parsed = await parseSpreadsheetFile(file);
      setRows(parsed);
    } catch (err) {
      setError("Faylni o'qib bo'lmadi: " + err.message);
    }
  }

  async function handleConfirm() {
    setImporting(true);
    setError('');
    const aggregate = { imported: 0, created: 0, updated: 0, errors: [] };
    try {
      for (let start = 0; start < rows.length; start += IMPORT_BATCH_SIZE) {
        const batch = rows.slice(start, start + IMPORT_BATCH_SIZE);
        const res = await importProducts(batch);
        aggregate.imported += res.imported;
        aggregate.created += res.created;
        aggregate.updated += res.updated;
        // Row numbers in `errors` are relative to the batch — offset by this
        // batch's starting position so they match the original file's rows.
        aggregate.errors.push(...res.errors.map((e) => ({ ...e, row: e.row + start })));
        setProgress({ done: Math.min(start + IMPORT_BATCH_SIZE, rows.length), total: rows.length });
      }
      setResult(aggregate);
      onImported();
    } catch (err) {
      // Batches already sent before the failing one did go through (upserts
      // are idempotent on barcode), so leave `result` unset — the button
      // stays enabled and re-running the whole file is safe, it'll just
      // re-upsert what already succeeded.
      setError(
        `${err.message} (${aggregate.imported} / ${rows.length} qator import qilingandan keyin to'xtadi — qayta urinib ko'ring)`
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <Modal title="Excel/CSV orqali import" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <p className="text-sm text-base-content/60">
          Ustunlar: <code className="font-mono">barcode, name, price, costPrice, stock, unit</code>
          <br />
          <span className="text-base-content/40">
            costPrice ixtiyoriy — kirish narxi (bo'sh qoldirilsa mavjud mahsulotda o'zgarmaydi). unit ixtiyoriy —
            "dona", "kg" yoki "metr" (bo'sh qoldirilsa: yangi mahsulot uchun "dona", mavjud mahsulot uchun
            o'zgarmaydi)
          </span>
        </p>
        <button className="link link-primary w-fit text-sm" onClick={downloadTemplateCsv} type="button">
          Namuna faylni yuklab olish
        </button>

        <input
          type="file"
          accept=".csv,.xlsx,.xls"
          className="file-input file-input-bordered w-full"
          onChange={handleFile}
        />

        {fileName && rows.length > 0 && !result && !importing && (
          <p className="text-sm text-base-content/70">
            {fileName}: <strong>{rows.length}</strong> qator topildi.
          </p>
        )}

        {importing && progress && (
          <div className="flex flex-col gap-1">
            <progress
              className="progress progress-primary w-full"
              value={progress.done}
              max={progress.total}
            />
            <p className="text-sm text-base-content/60">
              {progress.done.toLocaleString()} / {progress.total.toLocaleString()} qator import qilindi...
            </p>
          </div>
        )}

        {error && <p className="text-sm text-error">{error}</p>}

        {result && (
          <div className="rounded-field bg-base-200 p-3 text-sm">
            <p>Yaratildi: {result.created}</p>
            <p>Yangilandi: {result.updated}</p>
            {result.errors.length > 0 && (
              <p className="text-warning">{result.errors.length} qatorda xatolik bor edi.</p>
            )}
          </div>
        )}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Yopish
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={rows.length === 0 || importing || !!result}>
            {importing ? 'Import qilinmoqda...' : `Import qilish (${rows.length})`}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

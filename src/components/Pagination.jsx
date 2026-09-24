import { ChevronLeft, ChevronRight } from 'lucide-react';

const NUMBERED_THRESHOLD = 10;

// Up to 10 pages: numbered buttons (fast jump to any page). Beyond that,
// numbered buttons stop scaling — a mobile-friendly compact "page / total"
// indicator with prev/next takes over instead.
export function Pagination({ page, limit, total, onChange }) {
  const totalPages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;

  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-base-300 px-4 py-3 text-sm">
      <span className="text-base-content/60">
        {from}–{to} / {total}
      </span>
      {totalPages <= NUMBERED_THRESHOLD ? (
        <div className="max-w-full overflow-x-auto">
          <div className="join">
            <button
              className="btn btn-sm join-item"
              disabled={page <= 1}
              onClick={() => onChange(page - 1)}
              aria-label="Oldingi"
            >
              <ChevronLeft size={16} />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                className={`btn btn-sm join-item ${n === page ? 'btn-primary' : ''}`}
                onClick={() => onChange(n)}
              >
                {n}
              </button>
            ))}
            <button
              className="btn btn-sm join-item"
              disabled={page >= totalPages}
              onClick={() => onChange(page + 1)}
              aria-label="Keyingi"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      ) : (
        <div className="join">
          <button
            className="btn btn-sm join-item"
            disabled={page <= 1}
            onClick={() => onChange(page - 1)}
            aria-label="Oldingi"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="join-item flex items-center px-3 text-base-content/70">
            {page} / {totalPages}
          </span>
          <button
            className="btn btn-sm join-item"
            disabled={page >= totalPages}
            onClick={() => onChange(page + 1)}
            aria-label="Keyingi"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

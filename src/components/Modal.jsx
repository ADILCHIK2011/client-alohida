export function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex animate-overlay-fade items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-96 max-w-[90vw] flex-col animate-scale-in rounded-box bg-base-100 p-0 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h2 className="font-heading text-lg font-semibold">{title}</h2>
          <button
            className="btn btn-ghost btn-sm btn-circle text-base-content/60 transition-transform duration-200 hover:rotate-90 hover:text-error"
            onClick={onClose}
            aria-label="Yopish"
          >
            &times;
          </button>
        </div>
        <div className="overflow-y-auto p-5">{children}</div>
      </div>
    </div>
  );
}

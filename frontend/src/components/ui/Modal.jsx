export const Modal = ({ title, children, onClose, width = "max-w-[520px]" }) => (
  <div 
    className="fixed inset-0 z-50 bg-[#1A1A2E]/50 backdrop-blur-sm flex items-center justify-center p-5"
    onClick={e => e.target === e.currentTarget && onClose()}
  >
    <div className={`bg-surface rounded-2xl w-full ${width} max-h-[90vh] overflow-auto shadow-2xl animate-[slideUp_0.2s_ease]`}>
      <div className="flex items-center justify-between px-6 py-5 border-b border-border">
        <h3 className="m-0 text-lg font-bold text-text">{title}</h3>
        <button onClick={onClose} className="bg-transparent border-none cursor-pointer text-xl text-text-muted leading-none px-2 py-1 rounded-md hover:bg-background">✕</button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);
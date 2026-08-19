export const TABS = ["Início", "Jogo", "Times", "Perfil", "Admin"] as const;
export type Tab = (typeof TABS)[number];

interface TabNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function TabNav({ active, onChange }: TabNavProps) {
  return (
    <div className="mb-6 flex gap-2 overflow-auto">
      {TABS.map((x) => (
        <button
          key={x}
          onClick={() => onChange(x)}
          className={`btn whitespace-nowrap ${active === x ? "btn-primary" : "btn-muted"}`}
        >
          {x}
        </button>
      ))}
    </div>
  );
}

import type { ConfirmationStatus } from "../../types";
export type { ConfirmationStatus };

interface ConfirmationButtonsProps {
  value: ConfirmationStatus | null;
  onChange: (status: ConfirmationStatus) => void;
  className?: string;
}

const OPTIONS: ConfirmationStatus[] = ["VOU", "NÃO VOU", "TALVEZ"];

export function ConfirmationButtons({ value, onChange, className }: ConfirmationButtonsProps) {
  return (
    <div className={className ?? "grid grid-cols-3 gap-2"}>
      {OPTIONS.map((x) => (
        <button
          key={x}
          onClick={() => onChange(x)}
          className={`btn ${value === x ? "btn-primary" : "btn-muted"}`}
        >
          {x}
        </button>
      ))}
    </div>
  );
}

import { CheckCircle, Circle } from "lucide-react";

// Validation Item Component
export function ValidationItem({
  isValid,
  text,
}: {
  isValid: boolean;
  text: string;
}) {
  return (
    <span className="flex flex-row gap-2 items-center">
      {isValid ? (
        <CheckCircle className="size-4 text-emerald-500" />
      ) : (
        <Circle className="size-4 text-red-600" />
      )}
      <p className="text-xs">{text}</p>
    </span>
  );
}

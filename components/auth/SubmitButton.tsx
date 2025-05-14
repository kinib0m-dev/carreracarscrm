import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

export function SubmitButton({
  text,
  variant,
  className,
  isPending,
}: SubmitButtonProps) {
  return (
    <>
      {isPending ? (
        <Button disabled variant="outline" className={cn("w-fit", className)}>
          <Loader2 className="size-4 mr-2 animate-spin" />
          Please wait
        </Button>
      ) : (
        <Button
          className={cn("w-fit", className)}
          type="submit"
          variant={variant}
        >
          {text}
        </Button>
      )}
    </>
  );
}

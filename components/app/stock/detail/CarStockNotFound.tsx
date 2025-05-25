import { Button } from "@/components/ui/button";
import { Car } from "lucide-react";
import Link from "next/link";

export function CarStockNotFound() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-[70vh]">
      <div className="flex flex-col items-center text-center max-w-md">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Car className="h-10 w-10 text-primary" />
        </div>
        <h1 className="text-4xl font-bold mb-3">Car Not Found</h1>
        <p className="text-muted-foreground mb-8">
          The car you&apos;re trying to view doesn&apos;t exist or has been
          deleted.
        </p>
        <Button asChild>
          <Link href="/stock">Return to Car Stock</Link>
        </Button>
      </div>
    </div>
  );
}

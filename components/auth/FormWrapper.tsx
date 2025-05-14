"use client";

import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function FormWrapper({
  children,
  label,
  buttonHref,
  buttonLabel,
}: FormWrapperProps) {
  return (
    <Card className="min-w-[400px] shadow-md">
      <CardHeader>
        <div className="w-full flex flex-col gap-y-2 items-center justify-center">
          <h1>Carrera Cars CRM</h1>
          <p className="text-muted-foreground text-sm">{label}</p>
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
      <CardFooter>
        <Button variant="link" className="w-full" size="sm" asChild>
          <Link href={buttonHref}>{buttonLabel}</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

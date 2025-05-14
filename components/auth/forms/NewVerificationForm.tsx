"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FormWrapper } from "@/components/auth/FormWrapper";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { verifyEmail } from "@/lib/auth/auth.actions";

export function NewVerificationForm() {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const onSubmit = useCallback(() => {
    if (!token) {
      toast.error("Missing token");
      setError("Missing token");
      return;
    }
    verifyEmail(token)
      .then((data) => {
        if (!data?.success) {
          toast.error(data?.message);
          setError(data?.message);
        }
        if (data?.success) {
          toast.success(data?.message);
          setSuccess(data?.message);
        }
      })
      .catch(() => {
        toast.error("Something went wrong!");
        setError("Something went wrong!");
      });
  }, [token]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <FormWrapper
      label="Confirm Email"
      buttonLabel="Back to login"
      buttonHref="/login"
    >
      <div className="flex items-center w-full justify-center">
        {!success && !error && (
          <>
            <Loader2 className="size-4 mr-2 animate-spin" />
            Please wait
          </>
        )}
      </div>
    </FormWrapper>
  );
}

"use client";

import { newPasswordSchema } from "@/lib/auth/validation/auth-schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormWrapper } from "@/components/auth/FormWrapper";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/auth/SubmitButton";
import { Eye, EyeOff } from "lucide-react";
import { newPassword } from "@/lib/auth/auth.actions";
import { toast } from "sonner";
import { ValidationItem } from "./ValidationItem";

export function NewPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") as string;

  const [type, setType] = useState<"text" | "password">("password");
  const [isPending, setIsPending] = useState(false);

  // Validation states
  const [lowerValidated, setLowerValidated] = useState(false);
  const [upperValidated, setUpperValidated] = useState(false);
  const [numberValidated, setNumberValidated] = useState(false);
  const [specialValidated, setSpecialValidated] = useState(false);
  const [lengthValidated, setLengthValidated] = useState(false);

  // Focus state
  const [isFocused, setIsFocused] = useState(false);

  const form = useForm<z.infer<typeof newPasswordSchema>>({
    resolver: zodResolver(newPasswordSchema),
    defaultValues: {
      password: "",
    },
  });

  const password = form.watch("password");

  useEffect(() => {
    const lower = /(?=.*[a-z])/;
    const upper = /(?=.*[A-Z])/;
    const number = /(?=.*[0-9])/;
    const special = /(?=.*[!@#$%*^&*\-_])/;
    const length = /.{8,}/;

    setLowerValidated(lower.test(password));
    setUpperValidated(upper.test(password));
    setNumberValidated(number.test(password));
    setSpecialValidated(special.test(password));
    setLengthValidated(length.test(password));
  }, [password]);

  // Determine whether validation items should be visible
  const shouldShowValidation =
    isFocused &&
    (!lowerValidated ||
      !upperValidated ||
      !numberValidated ||
      !specialValidated ||
      !lengthValidated);

  const onSubmit = (values: z.infer<typeof newPasswordSchema>) => {
    setIsPending(true);

    newPassword(values, token)
      .then((data) => {
        if (!data?.success) {
          form.reset();
          toast.error(data?.message);
        }
        if (data?.success) {
          form.reset();
          toast.success(data?.message);
        }
      })
      .finally(() => setIsPending(false));
  };
  return (
    <FormWrapper
      label="Reset Password"
      buttonLabel="Back to login"
      buttonHref="/login"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <div className="flex flex-row items-center">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="*******"
                        type={type}
                        disabled={isPending}
                        className="rounded-r-none border-r-0 h-10"
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                      />
                    </FormControl>
                    <span
                      onClick={() =>
                        setType((prev) =>
                          prev === "password" ? "text" : "password"
                        )
                      }
                      className="cursor-pointer border border-l-0 p-2 rounded-r-lg h-10 flex items-center justify-center shadow-sm"
                    >
                      {type === "password" ? (
                        <Eye className="size-5" />
                      ) : (
                        <EyeOff className="size-5" />
                      )}
                    </span>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Validation Indicators */}
            <div
              className={`w-full overflow-hidden transition-all duration-300 ${
                shouldShowValidation
                  ? "opacity-100 max-h-96"
                  : "opacity-0 max-h-0"
              }`}
            >
              <div className="p-4 flex flex-col gap-2">
                <ValidationItem
                  isValid={lowerValidated}
                  text="At least one lowercase"
                />
                <ValidationItem
                  isValid={upperValidated}
                  text="At least one uppercase"
                />
                <ValidationItem
                  isValid={numberValidated}
                  text="At least one number"
                />
                <ValidationItem
                  isValid={specialValidated}
                  text="At least one special character"
                />
                <ValidationItem
                  isValid={lengthValidated}
                  text="At least 8 characters"
                />
              </div>
            </div>
          </div>
          <SubmitButton
            isPending={isPending}
            text="Reset Password"
            className="w-full"
          />
        </form>
      </Form>
    </FormWrapper>
  );
}

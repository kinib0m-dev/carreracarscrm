"use client";

import { loginSchema } from "@/lib/auth/validation/auth-schemas";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { toast } from "sonner";
import { signInAction } from "@/lib/auth/auth.actions";
import { FormWrapper } from "../FormWrapper";
import { SubmitButton } from "../SubmitButton";

export function LoginForm() {
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      code: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    setIsPending(true);

    signInAction(values)
      .then((data) => {
        if (data?.twoFactor) {
          setShowTwoFactor(true);
          // Don't reset the form here so the email and password values are preserved
          toast.info("Please enter your two-factor authentication code");
        } else if (data?.success) {
          form.reset();
          toast.success(data?.message);
        } else if (!data?.success) {
          // Only reset the form if it's not a two-factor authentication request
          if (!data?.twoFactor) {
            form.reset();
          }
          if (data?.message) {
            toast.error(data?.message);
          }
        }
      })
      .finally(() => setIsPending(false));
  };

  return (
    <FormWrapper
      label="Login"
      buttonLabel="Don't have an account?"
      buttonHref="/register"
      showSocials
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-4">
            {!showTwoFactor && (
              <>
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="example@example.com"
                          type="email"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="*******"
                          type="password"
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex items-center justify-end">
                  <Button
                    size="sm"
                    variant="link"
                    className="px-0 font-normal"
                    asChild
                  >
                    <Link href="/reset">Forgot password?</Link>
                  </Button>
                </div>
              </>
            )}
            {showTwoFactor && (
              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Two Factor Code</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="123456"
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
          <SubmitButton
            isPending={isPending}
            text={showTwoFactor ? "Confirm" : "Login"}
            className="w-full"
          />
        </form>
      </Form>
    </FormWrapper>
  );
}

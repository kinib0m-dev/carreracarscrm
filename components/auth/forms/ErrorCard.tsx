import { TriangleAlert } from "lucide-react";
import { FormWrapper } from "../FormWrapper";

export function ErrorCard() {
  return (
    <FormWrapper
      label="Oops! Something went wrong!"
      buttonLabel="Back to login"
      buttonHref="/login"
    >
      <div className="flex w-full items-center justify-center">
        <div className="flex items-center justify-center size-20 rounded-full bg-destructive/10">
          <TriangleAlert className="size-10 text-destructive" />
        </div>
      </div>
    </FormWrapper>
  );
}

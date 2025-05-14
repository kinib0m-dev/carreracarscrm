// Existing interface definitions
interface FormWrapperProps {
  children: React.ReactNode;
  label: string;
  showSocials?: boolean;
  buttonLabel: string;
  buttonHref: string;
}

interface SubmitButtonProps {
  text: string;
  variant?:
    | "link"
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | null
    | undefined;
  className?: string;
  isPending: boolean;
}

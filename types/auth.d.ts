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

// User related types
interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  isTwoFactorEnabled: boolean;
}

interface LoginActivityRecord {
  id: string;
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
  success: boolean;
  createdAt: Date;
}

interface ActivityResponse {
  success: boolean;
  activities?: LoginActivityRecord[];
  message?: string;
}

interface TypedAuthError extends AuthError {
  type: ErrorType;
}

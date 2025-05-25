import { cn } from "@/lib/utils";
import { format } from "date-fns";

type Message = {
  id: string;
  conversationId: string;
  role: string;
  content: string;
  createdAt: Date;
};

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isBot = message.role === "assistant";

  return (
    <div
      className={cn(
        "flex items-start gap-2 md:gap-4",
        isBot ? "justify-start" : "justify-end"
      )}
    >
      <div className="max-w-[80%] flex flex-col gap-1">
        <div
          className={cn(
            "rounded-lg p-3",
            isBot
              ? "bg-muted rounded-tl-none"
              : "bg-primary text-primary-foreground rounded-tr-none"
          )}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
        <span className="text-xs text-muted-foreground px-1">
          {format(new Date(message.createdAt), "h:mm a")}
        </span>
      </div>
    </div>
  );
}

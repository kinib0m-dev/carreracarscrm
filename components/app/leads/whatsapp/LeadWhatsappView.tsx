"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  MessageCircle,
  Send,
  Phone,
  CheckCircle,
  Clock,
  AlertCircle,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { es } from "date-fns/locale";
import {
  useWhatsAppMessages,
  useConversationStats,
  useSendWhatsAppMessage,
} from "@/lib/whatsapp/hooks/use-whatsapp";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LeadWhatsAppConversationProps {
  leadId: string;
  leadName: string;
  leadPhone?: string | null;
}

export function LeadWhatsAppConversation({
  leadId,
  leadName,
  leadPhone,
}: LeadWhatsAppConversationProps) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isLoading, refetch } = useWhatsAppMessages(leadId);
  const { stats } = useConversationStats(leadId);
  const { sendMessage, isSending } = useSendWhatsAppMessage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [newMessage]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || isSending) return;

    try {
      await sendMessage(leadId, newMessage.trim());
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, "HH:mm");
    } else if (isYesterday(date)) {
      return `Ayer ${format(date, "HH:mm")}`;
    } else {
      return format(date, "dd/MM/yyyy HH:mm");
    }
  };

  const getStatusIcon = (status?: string, direction?: string) => {
    if (direction === "inbound") return null;

    switch (status) {
      case "sent":
        return <CheckCircle className="h-3 w-3 text-muted-foreground" />;
      case "delivered":
        return <CheckCircle className="h-3 w-3 text-blue-500" />;
      case "read":
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case "failed":
        return <AlertCircle className="h-3 w-3 text-destructive" />;
      default:
        return <Clock className="h-3 w-3 text-muted-foreground" />;
    }
  };

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>WhatsApp Conversation</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-12 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!messages.length) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Whatsapp Conversation</span>
            </div>
            {leadPhone && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      {leadPhone}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Leads Number</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
                <MessageCircle className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium">No conversation</h3>
              <p className="text-muted-foreground max-w-sm text-center">
                There are no messages with this lead.
              </p>
              {leadPhone && (
                <div className="pt-4">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    <span>Phone: {leadPhone}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="h-5 w-5" />
            <span>WhatsApp Conversation</span>
            {stats && (
              <Badge variant="secondary" className="ml-2">
                {stats.totalMessages} messages
              </Badge>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {leadPhone && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Phone className="h-4 w-4 mr-1" />
                      {leadPhone}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Lead phone number</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh Conversation
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
        {stats && (
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span>{stats.inboundMessages} recieved</span>
            <span>{stats.outboundMessages} sent</span>
            {stats.lastMessageAt && (
              <span>
                Last Message:{" "}
                {formatDistanceToNow(new Date(stats.lastMessageAt), {
                  addSuffix: true,
                  locale: es,
                })}
              </span>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="flex-1 flex flex-col min-h-0 p-0">
        {/* Messages Area */}
        <div className="flex-1 min-h-0 p-4">
          <ScrollArea className="h-full">
            <div className="space-y-4 pr-4">
              {messages.map((message) => {
                const isOutbound = message.direction === "outbound";
                const messageTime =
                  message.whatsappTimestamp || message.createdAt;

                return (
                  <div
                    key={message.id}
                    className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg px-3 py-2 ${
                        isOutbound
                          ? "bg-green-500 text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <div className="text-sm break-words">
                        {message.content}
                      </div>
                      <div
                        className={`flex items-center justify-end space-x-1 mt-1 text-xs ${
                          isOutbound
                            ? "text-green-100"
                            : "text-muted-foreground"
                        }`}
                      >
                        <span>{formatMessageTime(new Date(messageTime))}</span>
                        {getStatusIcon(message.status, message.direction)}
                      </div>
                      {message.errorMessage && (
                        <div className="text-xs text-red-200 mt-1">
                          Error: {message.errorMessage}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
        </div>

        {/* Message Input */}
        <div className="border-t p-4">
          <div className="flex space-x-2">
            <div className="flex-1">
              <Textarea
                ref={textareaRef}
                placeholder={`Enviar mensaje a ${leadName}...`}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[44px] max-h-[120px] resize-none"
                disabled={isSending}
              />
            </div>
            <Button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() || isSending}
              size="sm"
              className="self-end"
            >
              {isSending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>
              Press Enter to send. Press Shift+Enter to add a new line.
            </span>
            {newMessage.length > 0 && (
              <span>{newMessage.length} characters</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

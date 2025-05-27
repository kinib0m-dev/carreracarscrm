"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  PlusCircle,
  MessageCircle,
  Trash2,
  Send,
  Loader2,
  User,
  Clock,
  DollarSign,
  Car,
  Fuel,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  useConversation,
  useCreateConversation,
  useDeleteConversation,
  useSendMessage,
} from "@/lib/playground/hooks/use-playground";
import { ChatMessage } from "./ChatMessage";

type BotConversation = {
  id: string;
  userId: string;
  name: string;
  testLeadId: string | null;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  testLeadName: string | null;
  testLeadStatus: string | null;
  testLeadBudget: string | null;
};

interface BotPlaygroundViewProps {
  conversations: BotConversation[];
}

const statusColors = {
  nuevo: "bg-gray-500",
  contactado: "bg-blue-500",
  activo: "bg-yellow-500",
  calificado: "bg-orange-500",
  propuesta: "bg-purple-500",
  evaluando: "bg-indigo-500",
  manager: "bg-green-500",
  descartado: "bg-gray-400",
  sin_interes: "bg-red-400",
  inactivo: "bg-gray-300",
  perdido: "bg-red-500",
  rechazado: "bg-red-600",
  sin_opciones: "bg-yellow-300",
};

const statusLabels = {
  nuevo: "Nuevo",
  contactado: "Contactado",
  activo: "Activo",
  calificado: "Calificado",
  propuesta: "Propuesta",
  evaluando: "Evaluando",
  manager: "Manager",
  descartado: "Descartado",
  sin_interes: "Sin Interés",
  inactivo: "Inactivo",
  perdido: "Perdido",
  rechazado: "Rechazado",
  sin_opciones: "Sin Opciones",
};

export function PlaygroundView({ conversations }: BotPlaygroundViewProps) {
  const [selectedConversationId, setSelectedConversationId] = useState<
    string | null
  >(conversations.length > 0 ? conversations[0].id : null);
  const [newConversationDialog, setNewConversationDialog] = useState(false);
  const [newConversationName, setNewConversationName] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [deleteConfirmDialog, setDeleteConfirmDialog] = useState<string | null>(
    null
  );
  const [isTyping, setIsTyping] = useState(false);

  // Ref for messages scroll area
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { createConversation, isLoading: isCreating } = useCreateConversation();
  const { deleteConversation, isLoading: isDeleting } = useDeleteConversation();
  const { conversation, testLead, messages, refetch } = useConversation(
    selectedConversationId || ""
  );
  const { sendMessage, isLoading: isSending } = useSendMessage();

  // Auto-scroll to bottom when messages change or when typing status changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleCreateConversation = async () => {
    if (!newConversationName.trim()) return;

    try {
      const result = await createConversation(newConversationName);
      if (result?.success && result.conversation) {
        setSelectedConversationId(result.conversation.id);
        setNewConversationDialog(false);
        setNewConversationName("");
      }
    } catch (error) {
      console.error("Failed to create conversation:", error);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await deleteConversation(id);
      if (selectedConversationId === id) {
        setSelectedConversationId(
          conversations.length > 1
            ? conversations.find((c) => c.id !== id)?.id || null
            : null
        );
      }
      setDeleteConfirmDialog(null);
    } catch (error) {
      console.error("Failed to delete conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (
      !newMessage.trim() ||
      !selectedConversationId ||
      conversation?.isCompleted
    )
      return;

    try {
      setIsTyping(true);
      setNewMessage(""); // Clear input right away

      await sendMessage(selectedConversationId, newMessage);

      // Wait a bit before refreshing to allow the "typing" indicator to show
      setTimeout(() => {
        refetch();
        setIsTyping(false);
      }, 10);
    } catch (error) {
      console.error("Failed to send message:", error);
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedConversation = conversations.find(
    (c) => c.id === selectedConversationId
  );

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Sales Funnel Playground</h1>
          <p className="text-muted-foreground">
            Test your automated sales process with simulated leads
          </p>
        </div>
        <Dialog
          open={newConversationDialog}
          onOpenChange={setNewConversationDialog}
        >
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="h-4 w-4 mr-2" />
              New Test Lead
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Test Lead Conversation</DialogTitle>
              <DialogDescription>
                Create a new test lead to simulate your sales funnel. This will
                create both a conversation and a test lead that will be updated
                as the conversation progresses.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                placeholder="E.g., Budget Buyer, Luxury Shopper, Financing Inquiry"
                value={newConversationName}
                onChange={(e) => setNewConversationName(e.target.value)}
                className="w-full"
              />
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setNewConversationDialog(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateConversation}
                disabled={isCreating || !newConversationName.trim()}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  "Create Test Lead"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-6">
        {/* Conversations sidebar */}
        <div className="space-y-4 flex flex-col h-[calc(100vh-200px)]">
          <div className="font-medium text-lg">Test Conversations</div>
          {conversations.length === 0 ? (
            <div className="text-muted-foreground text-center p-4 border rounded-md">
              No test leads yet. Start a new one!
            </div>
          ) : (
            <ScrollArea className="flex-1 pr-2">
              <div className="space-y-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`relative group flex items-center justify-between p-3 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors ${
                      selectedConversationId === conv.id
                        ? "bg-muted border-primary/50"
                        : ""
                    }`}
                    onClick={() => setSelectedConversationId(conv.id)}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <MessageCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <div className="font-medium truncate">
                            {conv.name}
                          </div>
                          {conv.isCompleted && (
                            <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {conv.testLeadStatus && (
                            <Badge
                              variant="secondary"
                              className={`text-xs text-white ${statusColors[conv.testLeadStatus as keyof typeof statusColors]}`}
                            >
                              {
                                statusLabels[
                                  conv.testLeadStatus as keyof typeof statusLabels
                                ]
                              }
                            </Badge>
                          )}
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(conv.updatedAt), "MMM d")}
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmDialog(conv.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground" />
                    </Button>

                    {/* Delete confirmation dialog */}
                    <Dialog
                      open={deleteConfirmDialog === conv.id}
                      onOpenChange={(open) =>
                        setDeleteConfirmDialog(open ? conv.id : null)
                      }
                    >
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Delete Test Conversation</DialogTitle>
                          <DialogDescription>
                            Are you sure you want to delete this test
                            conversation and its associated test lead? This
                            action cannot be undone.
                          </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setDeleteConfirmDialog(null)}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteConversation(conv.id)}
                            disabled={isDeleting}
                          >
                            {isDeleting ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Deleting...
                              </>
                            ) : (
                              "Delete"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        {/* Chat area */}
        {selectedConversationId ? (
          <Card className="flex flex-col h-[calc(100vh-200px)] overflow-hidden">
            {/* Fixed header */}
            <div className="border-b p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="text-lg font-medium">
                    {conversation?.name || "Loading..."}
                  </div>
                  {selectedConversation?.isCompleted && (
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <div className="text-sm text-muted-foreground">
                  Testing with Pedro (Sales Rep)
                </div>
              </div>
            </div>

            {/* Scrollable message area */}
            <div className="flex-1 overflow-y-auto p-4">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                    <MessageCircle className="h-8 w-8 text-primary/60" />
                  </div>
                  <h3 className="text-xl font-medium">
                    Sales Representative Playground
                  </h3>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    This is where you can test how your automated lead funnel
                    works. Send a message to start the conversation with Pedro.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages
                    .sort(
                      (a, b) =>
                        new Date(a.createdAt).getTime() -
                        new Date(b.createdAt).getTime()
                    )
                    .map((message) => (
                      <ChatMessage key={message.id} message={message} />
                    ))}

                  {/* Typing indicator */}
                  {isTyping && (
                    <div className="flex items-start gap-2 md:gap-4 justify-start">
                      <div className="max-w-[80%] flex flex-col gap-1">
                        <div className="bg-muted rounded-lg p-3 rounded-tl-none">
                          <div className="flex space-x-1">
                            <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce"></div>
                            <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce delay-75"></div>
                            <div className="h-2 w-2 rounded-full bg-primary/60 animate-bounce delay-150"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Invisible div for scrolling to bottom */}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Fixed input area */}
            <div className="border-t p-4">
              {selectedConversation?.isCompleted ? (
                <div className="flex items-center justify-center p-4 bg-muted/30 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-sm text-muted-foreground">
                    This test conversation has been completed. The lead has been
                    escalated to manager status.
                  </span>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    disabled={isSending || isTyping}
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={isSending || isTyping || !newMessage.trim()}
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ) : (
          <Card className="flex flex-col items-center justify-center h-[calc(100vh-200px)]">
            <div className="h-16 w-16 rounded-full bg-primary/20 flex items-center justify-center mb-4">
              <MessageCircle className="h-8 w-8 text-primary/60" />
            </div>
            <h3 className="text-xl font-medium">No Conversation Selected</h3>
            <p className="text-muted-foreground mt-2 max-w-md text-center">
              Select an existing test conversation from the sidebar or start a
              new one to test your sales funnel.
            </p>
            <Button
              className="mt-4"
              onClick={() => setNewConversationDialog(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Start New Test Lead
            </Button>
          </Card>
        )}

        {/* Test Lead Info Panel */}
        {selectedConversationId && testLead && (
          <Card className="h-[calc(100vh-200px)] overflow-hidden">
            <div className="p-4 border-b">
              <h3 className="font-medium">Test Lead Information</h3>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{testLead.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      className={`text-white ${statusColors[testLead.status as keyof typeof statusColors]}`}
                    >
                      {
                        statusLabels[
                          testLead.status as keyof typeof statusLabels
                        ]
                      }
                    </Badge>
                  </div>
                </div>

                <Separator />

                {/* Preferences */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Preferences</h4>

                  {testLead.budget && (
                    <div className="flex items-center gap-2 text-sm">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span>Budget: {testLead.budget}</span>
                    </div>
                  )}

                  {testLead.expectedPurchaseTimeframe && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        Timeframe: {testLead.expectedPurchaseTimeframe}
                      </span>
                    </div>
                  )}

                  {testLead.preferredVehicleType && (
                    <div className="flex items-center gap-2 text-sm">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <span>Vehicle Type: {testLead.preferredVehicleType}</span>
                    </div>
                  )}

                  {testLead.preferredBrand && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Brand:</span>{" "}
                      {testLead.preferredBrand}
                    </div>
                  )}

                  {testLead.preferredFuelType && (
                    <div className="flex items-center gap-2 text-sm">
                      <Fuel className="h-4 w-4 text-muted-foreground" />
                      <span>Fuel: {testLead.preferredFuelType}</span>
                    </div>
                  )}

                  {testLead.maxKilometers && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Max KM:</span>{" "}
                      {testLead.maxKilometers.toLocaleString()}
                    </div>
                  )}

                  {testLead.urgencyLevel && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">Urgency:</span>{" "}
                      {testLead.urgencyLevel}/5
                    </div>
                  )}
                </div>

                <Separator />

                {/* Additional Info */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Additional Info</h4>

                  {testLead.type && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Customer Type:
                      </span>{" "}
                      {testLead.type}
                    </div>
                  )}

                  {testLead.hasTradeIn !== null && (
                    <div className="flex items-center gap-2 text-sm">
                      {testLead.hasTradeIn ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>Has Trade-in</span>
                    </div>
                  )}

                  {testLead.needsFinancing !== null && (
                    <div className="flex items-center gap-2 text-sm">
                      {testLead.needsFinancing ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>Needs Financing</span>
                    </div>
                  )}

                  {testLead.isFirstTimeBuyer !== null && (
                    <div className="flex items-center gap-2 text-sm">
                      {testLead.isFirstTimeBuyer ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                      <span>First Time Buyer</span>
                    </div>
                  )}
                </div>

                <Separator />

                {/* Timeline */}
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Timeline</h4>

                  <div className="text-sm">
                    <span className="text-muted-foreground">Created:</span>{" "}
                    {format(
                      new Date(testLead.createdAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </div>

                  {testLead.lastContactedAt && (
                    <div className="text-sm">
                      <span className="text-muted-foreground">
                        Last Contact:
                      </span>{" "}
                      {format(
                        new Date(testLead.lastContactedAt),
                        "MMM d, yyyy 'at' h:mm a"
                      )}
                    </div>
                  )}

                  <div className="text-sm">
                    <span className="text-muted-foreground">Updated:</span>{" "}
                    {format(
                      new Date(testLead.updatedAt),
                      "MMM d, yyyy 'at' h:mm a"
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>
          </Card>
        )}
      </div>
    </div>
  );
}

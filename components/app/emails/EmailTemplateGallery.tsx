import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Check, LayoutTemplate } from "lucide-react";

interface EmailTemplateGalleryProps {
  onSelectTemplate: (template: { subject: string; content: string }) => void;
}

export function EmailTemplateGallery({
  onSelectTemplate,
}: EmailTemplateGalleryProps) {
  const [open, setOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);

  const templates = [
    {
      id: 1,
      name: "Welcome Email",
      description: "A warm welcome message to new potential buyers.",
      subject: "Thanks for reaching out, {{first_name}}!",
      content: `<div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #1c3f60;">Welcome to the Family, {{first_name}}!</h2>

    <p>We're thrilled to have you explore our wide selection of vehicles. Whether you're looking for performance, luxury, or everyday reliability, we've got something for everyone.</p>

    <p>Your interest means a lot, and one of our advisors will be reaching out shortly to help you find the perfect match.</p>

    <p style="margin-top: 20px;">Until then, sit back and relax — you're in good hands.</p>

    <p style="margin-top: 30px;">Warm regards,<br><strong>Your Car Dealership Team</strong></p>
  </div>`,
    },

    {
      id: 2,
      name: "Test Drive Reminder",
      description: "A polite nudge to schedule a test drive.",
      subject: "Let’s Get You Behind the Wheel, {{first_name}}!",
      content: `<div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #004080;">Your Next Drive Starts Here</h2>

    <p>Hi {{first_name}}, just a quick reminder that you're one step away from experiencing the thrill of the drive!</p>

    <p>We’d love to set you up for a test drive that fits your schedule. There’s nothing like feeling the road for yourself before making a decision.</p>

    <p>Have questions? We're here to help at every turn.</p>

    <p style="margin-top: 30px;">Looking forward to seeing you soon,<br><strong>The Sales Team</strong></p>
  </div>`,
    },
    {
      id: 3,
      name: "Special Offer",
      description: "Promotional email for limited-time deals.",
      subject: "Exclusive Deal for You, {{first_name}} 🚗💨",
      content: `<div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #d32f2f;">Time-Limited Offer Just for You, {{first_name}}!</h2>

    <p>Good news — we’ve selected a special offer tailored for your interests. For a short time, you can take advantage of our exclusive incentives on select models.</p>

    <p>It's the perfect time to upgrade your ride and hit the road in style.</p>

    <p style="margin-top: 15px; font-weight: bold;">Act fast — this deal won’t last!</p>

    <p style="margin-top: 30px;">See you soon,<br><strong>Your Dealership Team</strong></p>
  </div>`,
    },
    {
      id: 4,
      name: "Follow-Up Email",
      description: "Checking in after initial contact.",
      subject: "Still Thinking It Over, {{first_name}}?",
      content: `<div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #00796b;">We're Here When You're Ready</h2>

    <p>Hey {{first_name}}, just checking in to see if you had any further questions about your vehicle search.</p>

    <p>We’re committed to helping you make a confident and informed decision. Let us know if you'd like to revisit options or schedule a time to chat.</p>

    <p style="margin-top: 20px;">No pressure — just support when you need it.</p>

    <p style="margin-top: 30px;">Drive happy,<br><strong>Your Car Dealership</strong></p>
  </div>`,
    },
    {
      id: 5,
      name: "Thank You Email",
      description:
        "Expressing appreciation after a dealership visit or conversation.",
      subject: "Thank You, {{first_name}}!",
      content: `<div style="font-family: Arial, sans-serif; color: #333;">
    <h2 style="color: #6a1b9a;">Thanks for Stopping By, {{first_name}}!</h2>

    <p>It was great connecting with you. We hope you found your visit helpful and informative.</p>

    <p>If you have any lingering questions, or if you're ready to take the next step, don’t hesitate to reach out. We're always happy to help.</p>

    <p style="margin-top: 20px;">Wishing you smooth roads ahead!</p>

    <p style="margin-top: 30px;">Sincerely,<br><strong>Your Friends at the Dealership</strong></p>
  </div>`,
    },
  ];

  const handleSelectTemplate = (index: number) => {
    setSelectedTemplate(index);
  };

  const handleApplyTemplate = () => {
    if (selectedTemplate !== null) {
      onSelectTemplate({
        subject: templates[selectedTemplate].subject,
        content: templates[selectedTemplate].content,
      });
      setOpen(false);
      setSelectedTemplate(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <LayoutTemplate className="h-4 w-4" />
          Choose Template
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Email Template Gallery</DialogTitle>
          <DialogDescription>
            Choose a pre-designed template to get started quickly.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Available Templates</h3>
            <ScrollArea className="h-[400px] rounded-md border p-4">
              <div className="space-y-4">
                {templates.map((template, index) => (
                  <Card
                    key={template.id}
                    className={`cursor-pointer transition-all ${selectedTemplate === index ? "ring-2 ring-primary" : "hover:bg-accent"}`}
                    onClick={() => handleSelectTemplate(index)}
                  >
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">{template.name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.description}
                          </p>
                        </div>
                        {selectedTemplate === index && (
                          <Check className="h-5 w-5 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Preview</h3>
            <div className="rounded-md border h-[400px] overflow-hidden">
              {selectedTemplate !== null ? (
                <div className="h-full overflow-auto p-4">
                  <h4 className="font-medium mb-2">Subject:</h4>
                  <p className="text-sm mb-4">
                    {templates[selectedTemplate].subject}
                  </p>

                  <h4 className="font-medium mb-2">Content:</h4>
                  <div
                    className="text-sm prose max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: templates[selectedTemplate].content,
                    }}
                  />
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <p>Select a template to preview</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleApplyTemplate}
            disabled={selectedTemplate === null}
          >
            Use Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

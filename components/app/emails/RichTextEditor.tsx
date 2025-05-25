"use client";

import { useState } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Image as ImgIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading1,
  Heading2,
  Heading3,
  Code,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Write your email content here...",
  className,
}: RichTextEditorProps) {
  const [editorMode, setEditorMode] = useState<"visual" | "html">("visual");

  const insertTag = (startTag: string, endTag: string = "") => {
    const textarea = document.getElementById(
      "html-editor"
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    const newValue = beforeText + startTag + selectedText + endTag + afterText;
    onChange(newValue);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = start + startTag.length;
      textarea.selectionEnd = start + startTag.length + selectedText.length;
    }, 0);
  };

  const formatCommands = [
    {
      icon: <Bold className="h-4 w-4" />,
      title: "Bold",
      action: () => insertTag("<strong>", "</strong>"),
    },
    {
      icon: <Italic className="h-4 w-4" />,
      title: "Italic",
      action: () => insertTag("<em>", "</em>"),
    },
    {
      icon: <Underline className="h-4 w-4" />,
      title: "Underline",
      action: () => insertTag("<u>", "</u>"),
    },
    {
      icon: <List className="h-4 w-4" />,
      title: "Bullet List",
      action: () => insertTag("<ul>\n  <li>", "</li>\n</ul>"),
    },
    {
      icon: <ListOrdered className="h-4 w-4" />,
      title: "Numbered List",
      action: () => insertTag("<ol>\n  <li>", "</li>\n</ol>"),
    },
  ];

  const paragraphCommands = [
    {
      icon: <AlignLeft className="h-4 w-4" />,
      title: "Align Left",
      action: () => insertTag('<p style="text-align: left;">', "</p>"),
    },
    {
      icon: <AlignCenter className="h-4 w-4" />,
      title: "Align Center",
      action: () => insertTag('<p style="text-align: center;">', "</p>"),
    },
    {
      icon: <AlignRight className="h-4 w-4" />,
      title: "Align Right",
      action: () => insertTag('<p style="text-align: right;">', "</p>"),
    },
  ];

  const insertCommands = [
    {
      icon: <Link className="h-4 w-4" />,
      title: "Insert Link",
      action: () => {
        const url = prompt("Enter URL:") || "";
        if (url) insertTag(`<a href="${url}" target="_blank">`, "</a>");
      },
    },
    {
      icon: <ImgIcon className="h-4 w-4" />,
      title: "Insert Image",
      action: () => {
        const url = prompt("Enter image URL:") || "";
        if (url)
          insertTag(
            `<img src="${url}" alt="Image" style="max-width: 100%;" />`
          );
      },
    },
    {
      icon: <Code className="h-4 w-4" />,
      title: "Insert Code Block",
      action: () =>
        insertTag(
          '<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 4px; overflow: auto;">',
          "</pre>"
        ),
    },
  ];

  const headingCommands = [
    {
      icon: <Heading1 className="h-4 w-4" />,
      title: "Heading 1",
      action: () => insertTag("<h1>", "</h1>"),
    },
    {
      icon: <Heading2 className="h-4 w-4" />,
      title: "Heading 2",
      action: () => insertTag("<h2>", "</h2>"),
    },
    {
      icon: <Heading3 className="h-4 w-4" />,
      title: "Heading 3",
      action: () => insertTag("<h3>", "</h3>"),
    },
  ];

  return (
    <div className={cn("border rounded-md", className)}>
      <Tabs defaultValue="edit" className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="edit" onClick={() => setEditorMode("visual")}>
            Edit
          </TabsTrigger>
          <TabsTrigger value="html" onClick={() => setEditorMode("html")}>
            HTML
          </TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <div className="p-1 border-b bg-muted/50">
          <div className="flex items-center gap-1 flex-wrap">
            {formatCommands.map((cmd, i) => (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                onClick={cmd.action}
                title={cmd.title}
                type="button"
                className="h-8 w-8"
              >
                {cmd.icon}
              </Button>
            ))}
            <div className="w-px h-6 bg-border mx-1" />
            {paragraphCommands.map((cmd, i) => (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                onClick={cmd.action}
                title={cmd.title}
                type="button"
                className="h-8 w-8"
              >
                {cmd.icon}
              </Button>
            ))}
            <div className="w-px h-6 bg-border mx-1" />
            {headingCommands.map((cmd, i) => (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                onClick={cmd.action}
                title={cmd.title}
                type="button"
                className="h-8 w-8"
              >
                {cmd.icon}
              </Button>
            ))}
            <div className="w-px h-6 bg-border mx-1" />
            {insertCommands.map((cmd, i) => (
              <Button
                key={i}
                variant="ghost"
                size="icon"
                onClick={cmd.action}
                title={cmd.title}
                type="button"
                className="h-8 w-8"
              >
                {cmd.icon}
              </Button>
            ))}
          </div>
        </div>

        <TabsContent value="edit" className="p-0">
          <Textarea
            id="html-editor"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[300px] resize-y font-mono border-0 rounded-none rounded-b-md"
          />
        </TabsContent>

        <TabsContent value="html" className="p-0">
          <Textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className="min-h-[350px] resize-y font-mono border-0 rounded-none rounded-b-md"
          />
        </TabsContent>

        <TabsContent
          value="preview"
          className="p-4 min-h-[350px] prose max-w-none border-t"
        >
          {value ? (
            <div dangerouslySetInnerHTML={{ __html: value }} />
          ) : (
            <p className="text-muted-foreground italic">
              {editorMode ? "No content to preview" : "No content to preview"}
            </p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

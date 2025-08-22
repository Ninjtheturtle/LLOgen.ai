import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className }: MarkdownViewerProps) {
  return (
    <div
      className={cn(
        "prose prose-sm max-w-none dark:prose-invert",
        "prose-headings:text-foreground prose-p:text-foreground",
        "prose-strong:text-foreground prose-code:text-foreground",
        "prose-blockquote:text-muted-foreground prose-blockquote:border-l-border",
        "prose-a:text-primary hover:prose-a:text-primary/80",
        className
      )}
    >
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  );
}
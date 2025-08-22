import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MarkdownViewer } from "./MarkdownViewer";
import { Copy, Download, RotateCcw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ResultsViewerProps {
  content: string;
  siteUrl: string;
  onRegenerate: () => void;
}

export function ResultsViewer({ content, siteUrl, onRegenerate }: ResultsViewerProps) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied to clipboard",
        description: "The llms.txt content has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy to clipboard. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "llms.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Download started",
      description: "Your llms.txt file is being downloaded.",
    });
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Generated llms.txt</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">For {siteUrl}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onRegenerate}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copy
            </Button>
            <Button size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/30 rounded-lg p-6 max-h-96 overflow-y-auto">
          <MarkdownViewer content={content} />
        </div>
      </CardContent>
    </Card>
  );
}
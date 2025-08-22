import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Switch } from "@/components/ui/switch";

interface GeneratorFormProps {
  onGenerate: (data: GeneratorData) => void;
  isGenerating: boolean;
}

export interface GeneratorData {
  siteUrl: string;
  extras: string;
  maxPages: number;
  language: string;
  strictMode: boolean;
  includeOptional: boolean;
  whitelistDomains: string;
}

export function GeneratorForm({ onGenerate, isGenerating }: GeneratorFormProps) {
  const [formData, setFormData] = useState<GeneratorData>({
    siteUrl: "",
    extras: "",
    maxPages: 50,
    language: "auto",
    strictMode: true,
    includeOptional: true,
    whitelistDomains: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.siteUrl.trim()) {
      onGenerate(formData);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Generate llms.txt</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="siteUrl">Website URL *</Label>
            <Input
              id="siteUrl"
              type="url"
              placeholder="https://example.com"
              value={formData.siteUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, siteUrl: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="extras">Extras (Optional)</Label>
            <Textarea
              id="extras"
              placeholder="JSON hints, preferences, or additional context..."
              value={formData.extras}
              onChange={(e) => setFormData(prev => ({ ...prev, extras: e.target.value }))}
              rows={4}
            />
          </div>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="advanced">
              <AccordionTrigger>Advanced Settings</AccordionTrigger>
              <AccordionContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxPages">Max Pages</Label>
                    <Input
                      id="maxPages"
                      type="number"
                      min="1"
                      max="200"
                      value={formData.maxPages}
                      onChange={(e) => setFormData(prev => ({ ...prev, maxPages: parseInt(e.target.value) || 50 }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="language">Language</Label>
                    <select
                      id="language"
                      className="w-full px-3 py-2 border border-input bg-background rounded-md text-sm"
                      value={formData.language}
                      onChange={(e) => setFormData(prev => ({ ...prev, language: e.target.value }))}
                    >
                      <option value="auto">Auto-detect</option>
                      <option value="en">English</option>
                      <option value="es">Spanish</option>
                      <option value="fr">French</option>
                      <option value="de">German</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="strictMode">Strict Mode</Label>
                    <Switch
                      id="strictMode"
                      checked={formData.strictMode}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, strictMode: checked }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="includeOptional">Include Optional Section</Label>
                    <Switch
                      id="includeOptional"
                      checked={formData.includeOptional}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, includeOptional: checked }))}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whitelistDomains">Whitelist Domains</Label>
                  <Input
                    id="whitelistDomains"
                    placeholder="domain1.com, domain2.com"
                    value={formData.whitelistDomains}
                    onChange={(e) => setFormData(prev => ({ ...prev, whitelistDomains: e.target.value }))}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Button type="submit" className="w-full" disabled={isGenerating || !formData.siteUrl.trim()}>
            {isGenerating ? "Generating..." : "Generate llms.txt"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
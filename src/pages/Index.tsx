import { useState } from "react";
import { Button } from "@/components/ui/button";
import { GeneratorForm, GeneratorData } from "@/components/GeneratorForm";
import { GenerationStepper } from "@/components/GenerationStepper";
import { ResultsViewer } from "@/components/ResultsViewer";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { History } from "lucide-react";

const FAKE_LLMS_CONTENT = `# ARISE

> ARISE (Augmented Robotics Integrated Simulation Environment) is an educational robotics simulator for teaching students to build and program LEGO FLL-style robots in a virtual classroom setting.

Important notes:
- Drag-and-drop block coding inspired by Scratch
- Build custom 3D robots from LEGO-style parts
- Test programs in a real-time 3D virtual environment
- Augmented Reality mode is described as a feature
- Currently in beta; feedback and reviews are invited
- Contact: Ariseism.official@gmail.com

## Docs
- [Overview & Features](https://arisesim.com/): Product overview, feature descriptions, and mission
- [FAQ](https://arisesim.com/): Frequently asked questions section on the main page

## Policies
- [Terms & Conditions](https://arisesim.com/pages/terms-conditions): Pricing/currency, duties & taxes, payment, size guide, and contact
- [Privacy](https://arisesim.com/pages/privacy): How personal information and communications are handled
- [Shipping](https://arisesim.com/pages/shipping): Standard shipping times, costs, and delivery information

## Optional
- [Team & Reviews](https://arisesim.com/): Team bios and “Leave a Review” form on the main page
`;

const Index = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [generatedContent, setGeneratedContent] = useState<string | null>(null);
  const [currentSiteUrl, setCurrentSiteUrl] = useState<string>("");
  const navigate = useNavigate();

  const handleGeneration = async (data: GeneratorData) => {
    setIsGenerating(true);
    setCurrentStep(0);
    setGeneratedContent(null);
    setCurrentSiteUrl(data.siteUrl);

    try {
      // Save the run to Supabase
      const { data: runData, error: runError } = await supabase
        .from("runs")
        .insert({
          site_url: data.siteUrl,
          status: "started",
          settings_json: JSON.parse(JSON.stringify(data)),
        })
        .select()
        .single();

      if (runError) {
        console.error("Error creating run:", runError);
        setIsGenerating(false);
        return;
      }

      // Start generation on backend
      const backendUrl = "http://localhost:8000";
      const generateResponse = await fetch(`${backendUrl}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!generateResponse.ok) {
        const errorText = await generateResponse.text();
        console.error("Generate request failed:", generateResponse.status, errorText);
        throw new Error(`Failed to start generation: ${generateResponse.status} ${errorText}`);
      }

      // Poll for status updates
      const pollStatus = async () => {
        try {
          const statusResponse = await fetch(`${backendUrl}/status/${encodeURIComponent(data.siteUrl)}`);
          if (!statusResponse.ok) return;

          const status = await statusResponse.json();
          
          // Map backend steps to frontend steps
          const stepMap = {
            "start": 0,
            "discover": 1,
            "extract": 2, 
            "summarize": 3,
            "compose": 4,
            "validate": 5,
            "done": 6
          };
          
          setCurrentStep(stepMap[status.step] || 0);

          if (status.status === "completed") {
            // Get the generated content
            const resultResponse = await fetch(`${backendUrl}/result/${encodeURIComponent(data.siteUrl)}`);
            if (resultResponse.ok) {
              const result = await resultResponse.json();
              
              // Update run status and create artifact in Supabase
              await supabase
                .from("runs")
                .update({ 
                  status: "completed", 
                  finished_at: new Date().toISOString() 
                })
                .eq("id", runData.id);

              await supabase
                .from("artifacts")
                .insert({
                  run_id: runData.id,
                  kind: "llms_txt",
                  content: result.content,
                });

              setGeneratedContent(result.content);
              setIsGenerating(false);
            }
          } else if (status.status === "error") {
            throw new Error(status.message || "Generation failed");
          } else {
            // Continue polling
            setTimeout(pollStatus, 2000);
          }
        } catch (error) {
          console.error("Error polling status:", error);
          setTimeout(pollStatus, 2000); // Retry on error
        }
      };

      // Start polling
      setTimeout(pollStatus, 1000);

    } catch (error) {
      console.error("Generation error:", error);
      alert(`Error: ${error.message || error}`);
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    if (currentSiteUrl) {
      handleGeneration({
        siteUrl: currentSiteUrl,
        extras: "",
        maxPages: 50,
        language: "auto",
        strictMode: true,
        includeOptional: true,
        whitelistDomains: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <h1 className="text-4xl font-bold">LLOgen</h1>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => navigate("/history")}
            >
              <History className="w-4 h-4 mr-2" />
              History
            </Button>
          </div>
          <p className="text-xl text-muted-foreground">
            Generate LLM-friendly llms.txt files for your website
          </p>
        </div>

        <div className="flex flex-col items-center space-y-8">
          {/* Generator Form */}
          {!isGenerating && !generatedContent && (
            <GeneratorForm onGenerate={handleGeneration} isGenerating={isGenerating} />
          )}

          {/* Generation Stepper */}
          {isGenerating && (
            <div className="w-full max-w-4xl">
              <GenerationStepper currentStep={currentStep} />
              <div className="text-center mt-4">
                <p className="text-muted-foreground">
                  Generating llms.txt for {currentSiteUrl}...
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          {generatedContent && !isGenerating && (
            <ResultsViewer 
              content={generatedContent} 
              siteUrl={currentSiteUrl}
              onRegenerate={handleRegenerate}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

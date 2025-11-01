import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import { TaxInformationForm } from "@/components/TaxInformationForm";

const TaxInfo = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-earth">
      <header className="bg-white border-b shadow-soft">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/driver/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <FileText className="h-6 w-6 text-primary" />
                  Tax Information
                </h1>
                <p className="text-sm text-muted-foreground">
                  Manage your tax details and W-9 form
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <Card className="border-2">
          <CardHeader>
            <CardTitle>Tax Setup</CardTitle>
            <CardDescription>
              Complete your tax information for 1099 reporting
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              As an independent contractor, you'll receive a 1099 form for tax purposes. Please provide accurate information below.
            </p>
          </CardContent>
        </Card>

        <TaxInformationForm />
      </main>
    </div>
  );
};

export default TaxInfo;

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Eye, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Run {
  id: string;
  site_url: string;
  status: string;
  created_at: string;
  finished_at: string | null;
}

export default function History() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRuns();
  }, []);

  const fetchRuns = async () => {
    try {
      const { data, error } = await supabase
        .from("runs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRuns(data || []);
    } catch (error) {
      console.error("Error fetching runs:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge variant="secondary">Completed</Badge>;
      case "started":
        return <Badge variant="outline">In Progress</Badge>;
      case "failed":
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold">Run History</h1>
              <p className="text-muted-foreground">View and manage your robots.txt generations</p>
            </div>
            <Button onClick={() => navigate("/")} variant="outline" className="hover:bg-white hover:text-black hover:border-white">
              New Generation
            </Button>
          </div>
          <div className="text-center py-8">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Run History</h1>
            <p className="text-muted-foreground">View and manage your robots.txt generations</p>
          </div>
          <Button onClick={() => navigate("/")} variant="outline" className="hover:bg-white hover:text-black hover:border-white">
            New Generation
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Previous Generations</CardTitle>
          </CardHeader>
          <CardContent>
            {runs.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No generations yet. Start by creating your first robots.txt file!</p>
                <Button onClick={() => navigate("/")} className="mt-4 hover:bg-white hover:text-black hover:border-white">
                  Generate Now
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[200px]">Site</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Created</TableHead>
                      <TableHead className="min-w-[120px]">Completed</TableHead>
                      <TableHead className="min-w-[160px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {runs.map((run) => (
                      <TableRow key={run.id}>
                        <TableCell className="font-medium min-w-[200px]">{run.site_url}</TableCell>
                        <TableCell className="min-w-[100px]">{getStatusBadge(run.status)}</TableCell>
                        <TableCell className="min-w-[120px]">{formatDate(run.created_at)}</TableCell>
                        <TableCell className="min-w-[120px]">
                          {run.finished_at ? formatDate(run.finished_at) : "-"}
                        </TableCell>
                        <TableCell className="min-w-[160px]">
                          <div className="flex gap-2">
                            {run.status === "completed" && (
                              <Button size="sm" variant="outline">
                                <Eye className="w-4 h-4 mr-2" />
                                View
                              </Button>
                            )}
                            <Button size="sm" variant="outline">
                              <RotateCcw className="w-4 h-4 mr-2" />
                              Regenerate
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
"use client";

import { useState } from "react";
import { CheckCircle2, FileText, Loader2, Upload, XCircle, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { api, endpoints } from "@/lib/api/client";
import { cn } from "@/lib/utils";

interface BATAnalysis {
  id: string;
  status: "pending" | "done" | "failed";
  overall_score: number;
  pages: number;
  fonts_embedded: boolean;
  color_space: string;
  issues: { severity: string; code: string; message: string; recommendation?: string }[];
  recommendations: string[];
  summary: string;
}

interface Props {
  orderId: string;
  onAnalyzed?: (analysis: BATAnalysis) => void;
}

export function BatUploader({ orderId, onAnalyzed }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysis, setAnalysis] = useState<BATAnalysis | null>(null);

  const handleFile = (f: File) => {
    setFile(f);
    setAnalysis(null);
  };

  const upload = async () => {
    if (!file) return;
    setUploading(true);
    try {
      // 1. Demande presigned URL
      const presignedRes = await api.post("/storage/presigned/request/", {
        filename: file.name,
        content_type: file.type,
        prefix: "bat",
      });
      const { upload_url, object_key } = presignedRes.data;

      // 2. Upload direct sur S3/MinIO
      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });

      // 3. Crée le Document
      const docRes = await api.post("/documents/", {
        kind: "bat",
        file_name: file.name,
        size_bytes: file.size,
        mime_type: file.type,
        related_resource_type: "order",
        related_resource_id: orderId,
        metadata: { object_key },
      });

      // 4. Déclenche l'analyse IA
      const runRes = await api.post(endpoints.ai.runBatAnalysis, {
        order_id: orderId,
        document_id: docRes.data.id,
      });

      // 5. Poll le résultat
      const pollAnalysis = async () => {
        for (let i = 0; i < 30; i++) {
          await new Promise((r) => setTimeout(r, 2000));
          const { data } = await api.get(endpoints.ai.batAnalyses, {
            params: { order: orderId },
          });
          const result = data.results?.[0];
          if (result && result.status !== "pending") {
            setAnalysis(result);
            onAnalyzed?.(result);
            return;
          }
        }
      };
      await pollAnalysis();
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      {!file ? (
        <Card
          className="flex cursor-pointer flex-col items-center justify-center p-12 text-center transition-colors hover:bg-secondary/50"
          onClick={() => document.getElementById("bat-input")?.click()}
        >
          <Upload className="h-10 w-10 text-muted-foreground" />
          <p className="mt-3 font-medium">Glissez votre BAT ici</p>
          <p className="text-xs text-muted-foreground">PDF, PSD, AI, TIFF (jusqu&apos;à 100 Mo)</p>
          <input
            id="bat-input"
            type="file"
            className="hidden"
            accept=".pdf,.psd,.ai,.tif,.tiff"
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
        </Card>
      ) : (
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div className="flex-1">
              <p className="font-semibold">{file.name}</p>
              <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
            <Button onClick={upload} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Analyser"}
            </Button>
          </div>
        </Card>
      )}

      {analysis && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="font-semibold">Rapport d&apos;analyse IA</p>
              <p className="text-sm text-muted-foreground">{analysis.summary}</p>
            </div>
            <div className="text-right">
              <div
                className={cn(
                  "font-display text-3xl font-bold",
                  analysis.overall_score >= 80 && "text-success",
                  analysis.overall_score >= 50 && analysis.overall_score < 80 && "text-warning-foreground",
                  analysis.overall_score < 50 && "text-destructive",
                )}
              >
                {analysis.overall_score}
              </div>
              <p className="text-xs text-muted-foreground">/ 100</p>
            </div>
          </div>
          <Progress value={analysis.overall_score} className="mb-4" />
          <div className="space-y-2">
            {analysis.issues.length === 0 && (
              <div className="flex items-center gap-2 text-success">
                <CheckCircle2 className="h-4 w-4" /> Aucun problème détecté
              </div>
            )}
            {analysis.issues.map((iss, i) => (
              <div key={i} className="flex items-start gap-2 rounded-md border p-3 text-sm">
                {iss.severity === "blocker" && <XCircle className="mt-0.5 h-4 w-4 text-destructive" />}
                {iss.severity === "warning" && <AlertTriangle className="mt-0.5 h-4 w-4 text-warning-foreground" />}
                {iss.severity === "info" && <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" />}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={iss.severity === "blocker" ? "destructive" : iss.severity === "warning" ? "warning" : "secondary"} className="text-[10px]">
                      {iss.severity}
                    </Badge>
                    <span className="font-medium">{iss.message}</span>
                  </div>
                  {iss.recommendation && (
                    <p className="mt-1 text-xs text-muted-foreground">→ {iss.recommendation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";

interface AttentionZonesCardProps {
  ideaId: string;
}

const AttentionZonesCard = ({ ideaId }: AttentionZonesCardProps) => {
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadZones();
  }, [ideaId]);

  const loadZones = async () => {
    const { data, error } = await supabase
      .from("attention_zones")
      .select("*")
      .eq("idea_id", ideaId)
      .order("severity", { ascending: false });

    if (!error && data) {
      setZones(data);
    }
    setLoading(false);
  };

  const getSeverityColor = (severity: number) => {
    if (severity === 3) return "destructive";
    if (severity === 2) return "default";
    return "secondary";
  };

  const getSeverityLabel = (severity: number) => {
    if (severity === 3) return "Critique";
    if (severity === 2) return "Attention";
    return "Info";
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </Card>
    );
  }

  if (zones.length === 0) {
    return (
      <Card className="p-6 border-success/50 bg-success/5">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="h-5 w-5 text-success" />
          <h3 className="font-display font-bold text-lg">Zones d'attention</h3>
        </div>
        <div className="text-center py-8 text-muted-foreground">
          <p>Aucune zone d'attention détectée 🎉</p>
          <p className="text-sm mt-2">Votre alignement semble solide !</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="h-5 w-5 text-accent" />
        <h3 className="font-display font-bold text-lg">Zones d'attention</h3>
        <Badge variant="outline" className="ml-auto">
          {zones.length} zone{zones.length > 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="space-y-4">
        {zones.map((zone) => (
          <div key={zone.id} className="border border-border rounded-lg p-4 space-y-2 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <h4 className="font-semibold">{zone.label}</h4>
              <Badge variant={getSeverityColor(zone.severity)}>
                {getSeverityLabel(zone.severity)}
              </Badge>
            </div>
            {zone.recommendation && (
              <p className="text-sm text-muted-foreground leading-relaxed">
                {zone.recommendation}
              </p>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default AttentionZonesCard;

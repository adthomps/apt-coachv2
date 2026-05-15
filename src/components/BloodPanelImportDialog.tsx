import React, { useState, useMemo } from 'react';
import FormDialog from '@/components/common/FormDialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { CheckCircle, XCircle, Upload, AlertTriangle } from 'lucide-react';
import { useCreateBloodPanel } from '@/hooks/use-api-queries';
import { toast } from '@/hooks/use-toast';
import type { BloodMarker, BloodMarkerStatus } from '@/lib/api/types';

interface BloodPanelImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function parseReferenceRange(range: string): { min: number; max: number } {
  const parts = range.split('-').map(s => s.trim());
  return {
    min: parseFloat(parts[0]) || 0,
    max: parseFloat(parts[1]) || 0,
  };
}

function parseCsv(csv: string): { markers: BloodMarker[]; errors: string[] } {
  const lines = csv.trim().split('\n');
  const errors: string[] = [];
  const markers: BloodMarker[] = [];

  if (lines.length < 2) {
    errors.push('CSV must have a header row and at least one data row.');
    return { markers, errors };
  }

  const header = lines[0].toLowerCase();
  if (!header.includes('marker') || !header.includes('value')) {
    errors.push('CSV header must contain: marker, value, unit, reference_range, status, time');
    return { markers, errors };
  }

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const parts = line.split(',').map(s => s.trim());
    if (parts.length < 5) {
      errors.push(`Row ${i + 1}: Expected at least 5 columns, got ${parts.length}`);
      continue;
    }

    const [marker, valueStr, unit, refRange, status, time] = parts;
    const value = parseFloat(valueStr);
    if (isNaN(value)) {
      errors.push(`Row ${i + 1}: Invalid value "${valueStr}" for ${marker}`);
      continue;
    }

    const validStatuses: BloodMarkerStatus[] = ['optimal', 'average', 'outOfRange'];
    const parsedStatus = validStatuses.includes(status as BloodMarkerStatus)
      ? (status as BloodMarkerStatus)
      : 'average';

    const { min, max } = parseReferenceRange(refRange);

    markers.push({
      marker,
      value,
      unit,
      referenceRange: refRange,
      referenceMin: min,
      referenceMax: max,
      status: parsedStatus,
      time: time || new Date().toISOString().split('T')[0],
    });
  }

  return { markers, errors };
}

const statusBadge = (status: BloodMarkerStatus) => {
  switch (status) {
    case 'optimal':
      return <Badge className="bg-success/20 text-success border-success/30">Optimal</Badge>;
    case 'average':
      return <Badge variant="secondary">Average</Badge>;
    case 'outOfRange':
      return <Badge variant="destructive">Out of Range</Badge>;
  }
};

const BloodPanelImportDialog: React.FC<BloodPanelImportDialogProps> = ({ open, onOpenChange }) => {
  const [csvData, setCsvData] = useState('');
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const createMutation = useCreateBloodPanel();

  const parsed = useMemo(() => {
    if (!csvData.trim()) return null;
    const result = parseCsv(csvData);
    return result;
  }, [csvData]);

  const handleParse = () => {
    if (!parsed) return;
    setParseErrors(parsed.errors);
  };

  const handleSave = async () => {
    if (!parsed || parsed.markers.length === 0) return;

    const panelDate = parsed.markers[0]?.time || new Date().toISOString().split('T')[0];

    try {
      await createMutation.mutateAsync({
        source: 'rythmhealth' as const,
        panelDate,
        markers: parsed.markers,
        rawCsv: csvData,
      });
      toast({ title: 'Blood panel imported', description: `${parsed.markers.length} markers saved.` });
      setCsvData('');
      setParseErrors([]);
      onOpenChange(false);
    } catch {
      toast({ title: 'Error', description: 'Failed to save blood panel.', variant: 'destructive' });
    }
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      title="Import Blood Panel"
      description="Paste CSV data from RythmHealth. Format: marker, value, unit, reference_range, status, time"
      submitLabel={createMutation.isPending ? 'Saving…' : 'Import Panel'}
      onSubmit={handleSave}
      isSubmitting={createMutation.isPending}
      canSubmit={!!parsed && parsed.markers.length > 0}
      secondaryAction={
        <Button variant="outline" onClick={handleParse} disabled={!csvData.trim()}>
          Validate
        </Button>
      }
    >
      <Textarea
        placeholder={`marker,value,unit,reference_range,status,time\nFree T3,4.25,pg/mL,2 - 4.4,optimal,2026-03-09\nApoB,131,mg/dL,0 - 90,outOfRange,2026-03-09`}
        value={csvData}
        onChange={e => { setCsvData(e.target.value); setParseErrors([]); }}
        rows={8}
        className="font-mono text-xs"
      />

      {parseErrors.length > 0 && (
        <div className="p-3 bg-destructive/10 rounded-lg space-y-1">
          {parseErrors.map((err, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-destructive">
              <XCircle className="h-3 w-3 flex-shrink-0" />{err}
            </div>
          ))}
        </div>
      )}

      {parsed && parsed.markers.length > 0 && (
        <>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle className="h-4 w-4 text-success" />
            {parsed.markers.length} markers parsed
            {parsed.markers.filter(m => m.status === 'outOfRange').length > 0 && (
              <span className="flex items-center gap-1 text-destructive">
                <AlertTriangle className="h-3 w-3" />
                {parsed.markers.filter(m => m.status === 'outOfRange').length} out of range
              </span>
            )}
          </div>

          <div className="border border-border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Marker</TableHead>
                  <TableHead className="text-right">Value</TableHead>
                  <TableHead>Range</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parsed.markers.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium text-sm">{m.marker}</TableCell>
                    <TableCell className="text-right text-sm">{m.value} {m.unit}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{m.referenceRange}</TableCell>
                    <TableCell>{statusBadge(m.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </FormDialog>
  );
};

export default BloodPanelImportDialog;

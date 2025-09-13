import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar, Filter } from "lucide-react";
import { DateRange } from "@/hooks/useAnalytics";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

interface DateRangePickerProps {
  dateRanges: DateRange[];
  selectedRange: string;
  onRangeChange: (range: string) => void;
  customStartDate: string;
  customEndDate: string;
  onCustomDateChange: (start: string, end: string) => void;
}

export const DateRangePicker = ({
  dateRanges,
  selectedRange,
  onRangeChange,
  customStartDate,
  customEndDate,
  onCustomDateChange
}: DateRangePickerProps) => {
  const [showCustomDates, setShowCustomDates] = useState(selectedRange === 'custom');

  const handleRangeChange = (value: string) => {
    onRangeChange(value);
    setShowCustomDates(value === 'custom');
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Période d'analyse</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Sélection rapide</label>
            <Select value={selectedRange} onValueChange={handleRangeChange}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une période" />
              </SelectTrigger>
              <SelectContent>
                {dateRanges.map((range, index) => (
                  <SelectItem key={index} value={index.toString()}>
                    {range.label}
                  </SelectItem>
                ))}
                <SelectItem value="custom">Période personnalisée</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {showCustomDates && (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Date de début</label>
                <Input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => onCustomDateChange(e.target.value, customEndDate)}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date de fin</label>
                <Input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => onCustomDateChange(customStartDate, e.target.value)}
                />
              </div>
            </>
          )}
        </div>

        {/* Affichage de la période sélectionnée */}
        <div className="mt-4 p-3 bg-muted rounded-lg">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Période analysée:</span>
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {selectedRange === 'custom' ? (
              customStartDate && customEndDate ? (
                `Du ${format(parseISO(customStartDate), 'dd MMMM yyyy', { locale: fr })} au ${format(parseISO(customEndDate), 'dd MMMM yyyy', { locale: fr })}`
              ) : (
                "Sélectionnez les dates de début et de fin"
              )
            ) : (
              dateRanges[parseInt(selectedRange)]?.label || "Aucune période sélectionnée"
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
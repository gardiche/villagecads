import { useState } from "react";
import { format, addDays } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsMobile } from "@/hooks/use-mobile";

const TIME_SLOTS: string[] = [];
for (let h = 7; h <= 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, "0")}:00`);
  if (h < 22) TIME_SLOTS.push(`${String(h).padStart(2, "0")}:30`);
}

const APP_URL = "https://astryd-ideas.lovable.app/profil-entrepreneurial";
const EVENT_TITLE = "Mon positionnement Astryd 🚀";
const EVENT_DESC = `Session de travail pour avancer sur mon projet entrepreneurial avec Astryd. Lien : ${APP_URL}`;

function buildDatetime(date: Date, time: string): Date {
  const [h, m] = time.split(":").map(Number);
  const dt = new Date(date);
  dt.setHours(h, m, 0, 0);
  return dt;
}

function toUtcString(d: Date, sep: "basic" | "extended"): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const y = d.getUTCFullYear();
  const mo = pad(d.getUTCMonth() + 1);
  const da = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mi = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  if (sep === "basic") return `${y}${mo}${da}T${hh}${mi}${ss}Z`;
  return `${y}-${mo}-${da}T${hh}:${mi}:${ss}`;
}

function googleUrl(start: Date, end: Date) {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: EVENT_TITLE,
    dates: `${toUtcString(start, "basic")}/${toUtcString(end, "basic")}`,
    details: EVENT_DESC,
    location: APP_URL,
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

function outlookUrl(start: Date, end: Date) {
  const params = new URLSearchParams({
    subject: EVENT_TITLE,
    startdt: toUtcString(start, "extended"),
    enddt: toUtcString(end, "extended"),
    body: EVENT_DESC,
  });
  return `https://outlook.live.com/calendar/0/action/compose?${params}`;
}

function downloadIcs(start: Date, end: Date) {
  const fmt = (d: Date) => toUtcString(d, "basic");
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Astryd//FR",
    "BEGIN:VEVENT",
    `DTSTART:${fmt(start)}`,
    `DTEND:${fmt(end)}`,
    `SUMMARY:${EVENT_TITLE}`,
    `DESCRIPTION:${EVENT_DESC.replace(/\n/g, "\\n")}`,
    `URL:${APP_URL}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "positionnement-astryd.ics";
  a.click();
  URL.revokeObjectURL(url);
}

interface CalendarStepProps {
  onNext: () => void;
}

export default function CalendarStep({ onNext }: CalendarStepProps) {
  const isMobile = useIsMobile();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [nativeDateStr, setNativeDateStr] = useState("");

  const minDate = addDays(new Date(), 1);
  const maxDate = addDays(new Date(), 30);

  const hasSelection = !!(selectedDate || nativeDateStr) && selectedTime !== "";

  const getStartEnd = (): [Date, Date] | null => {
    const d = isMobile && nativeDateStr ? new Date(nativeDateStr) : selectedDate;
    if (!d || !selectedTime) return null;
    const start = buildDatetime(d, selectedTime);
    const end = new Date(start.getTime() + 60 * 60 * 1000);
    return [start, end];
  };

  const handleSaveAndNext = () => {
    const pair = getStartEnd();
    if (pair) {
      localStorage.setItem("astryd_calendar_slot", pair[0].toISOString());
    }
    onNext();
  };

  const displayDate = isMobile && nativeDateStr
    ? format(new Date(nativeDateStr), "PPP", { locale: fr })
    : selectedDate
      ? format(selectedDate, "PPP", { locale: fr })
      : null;

  const pair = getStartEnd();

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-xl sm:text-2xl font-display font-bold text-foreground">
          Quand veux-tu bloquer du temps pour avancer sur ton positionnement Astryd ?
        </h2>
        <p className="text-sm text-muted-foreground">
          Planifie une session de travail pour exploiter tes résultats. C'est optionnel.
        </p>
      </div>

      {/* Date picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Date</label>
        {isMobile ? (
          <input
            type="date"
            value={nativeDateStr}
            min={format(minDate, "yyyy-MM-dd")}
            max={format(maxDate, "yyyy-MM-dd")}
            onChange={(e) => setNativeDateStr(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        ) : (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !selectedDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, "PPP", { locale: fr }) : "Choisir une date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < minDate || date > maxDate}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Time picker */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground">Heure</label>
        {isMobile ? (
          <input
            type="time"
            value={selectedTime}
            min="07:00"
            max="22:00"
            step="1800"
            onChange={(e) => setSelectedTime(e.target.value)}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          />
        ) : (
          <Select value={selectedTime} onValueChange={setSelectedTime}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choisir un créneau" />
            </SelectTrigger>
            <SelectContent>
              {TIME_SLOTS.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Summary */}
      {displayDate && selectedTime && (
        <p className="text-sm text-muted-foreground text-center">
          📅 {displayDate} à {selectedTime} — 1 h de session
        </p>
      )}

      {/* Calendar buttons */}
      {hasSelection && pair && (
        <div className="grid gap-2 sm:grid-cols-3">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(googleUrl(pair[0], pair[1]), "_blank")}
          >
            Google Calendar
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => window.open(outlookUrl(pair[0], pair[1]), "_blank")}
          >
            Outlook
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => downloadIcs(pair[0], pair[1])}
          >
            <Download className="h-4 w-4 mr-1" />
            .ics
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col items-center gap-3 pt-2">
        <Button
          onClick={handleSaveAndNext}
          disabled={!hasSelection}
          className="min-w-[260px]"
        >
          C'est dans mon calendrier, on y va !
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onNext}
          className="text-sm text-muted-foreground"
        >
          Passer cette étape
        </Button>
      </div>
    </div>
  );
}

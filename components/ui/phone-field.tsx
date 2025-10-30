import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRY_DIAL_CODES } from "@/lib/countries";

type PhoneFieldProps = {
  value: string;
  onChange: (e164: string) => void;
  defaultDial?: string;
  label?: string;
  disabled?: boolean;
  required?: boolean;
  inputId?: string;
};

function normalizeDigits(input: string): string {
  return (input || "").replace(/\D/g, "");
}

function stripLeadingZero(local: string): string {
  return local.replace(/^0+/, "");
}

// Helper: get dial by ISO code
function getDialByCode(code: string): string {
  const found = COUNTRY_DIAL_CODES.find((c) => c.code === code);
  return found?.dial || "+254";
}

// Helper: get country by dial (first match)
function getCountryByDial(dial: string) {
  return COUNTRY_DIAL_CODES
    .sort((a, b) => b.dial.length - a.dial.length)
    .find((c) => dial.startsWith(c.dial)) || null;
}

export function PhoneField({
  value,
  onChange,
  defaultDial = "+254",
  label = "Phone",
  disabled,
  required,
  inputId = "phone",
}: PhoneFieldProps) {
  const countries = useMemo(() => COUNTRY_DIAL_CODES, []);
  const defaultCountry = useMemo(
    () => countries.find((c) => c.dial === defaultDial) || countries.find((c) => c.code === "KE") || countries[0],
    [countries, defaultDial]
  );

  // Track ISO code rather than dial to ensure uniqueness
  const [selectedCode, setSelectedCode] = useState<string>(defaultCountry.code);
  const [local, setLocal] = useState<string>("");

  // Parse incoming E.164 value into selected country and local part
  useEffect(() => {
    if (!value) {
      setSelectedCode(defaultCountry.code);
      setLocal("");
      return;
    }
    if (value.startsWith("+")) {
      const match = getCountryByDial(value);
      if (match) {
        setSelectedCode(match.code);
        setLocal(normalizeDigits(value.slice(match.dial.length)));
        return;
      }
    }
    setSelectedCode(defaultCountry.code);
    setLocal(normalizeDigits(value));
  }, [value, defaultCountry.code]);

  const emit = (code: string, nextLocal: string) => {
    const dial = getDialByCode(code);
    const normalizedLocal = stripLeadingZero(normalizeDigits(nextLocal));
    onChange(`${dial}${normalizedLocal}`);
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <div className="flex gap-2">
        <Select
          value={selectedCode}
          onValueChange={(code: string) => {
            setSelectedCode(code);
            emit(code, local);
          }}
          disabled={disabled}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Select country" />
          </SelectTrigger>
          <SelectContent>
            {countries.map((c) => (
              <SelectItem key={c.code} value={c.code}>
                {c.name} {c.dial}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          id={inputId}
          type="tel"
          inputMode="numeric"
          placeholder="712345678"
          value={local}
          onChange={(e) => {
            const v = e.target.value;
            setLocal(v);
            emit(selectedCode, v);
          }}
          onBlur={() => emit(selectedCode, local)}
          disabled={disabled}
          required={required}
        />
      </div>
    </div>
  );
}
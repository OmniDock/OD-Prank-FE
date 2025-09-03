import { Switch } from "@heroui/switch";

export default function BillingToggle({
  billing,
  onChange,
}: {
  billing: "monthly" | "annual";
  onChange: (b: "monthly" | "annual") => void;
}) {
  const isAnnual = billing === "annual";

  return (
    <div className="flex items-center gap-3">
      <span className={!isAnnual ? "font-semibold" : "text-default-500"}>Monthly</span>
      <Switch
        isSelected={isAnnual}
        onValueChange={(v) => onChange(v ? "annual" : "monthly")}
        aria-label="Toggle billing period"
        classNames={{
          base: "bg-default-200/40 data-[selected=true]:bg-purple-500/30",
          thumb: "bg-white",
        }}
      />
      <div className="flex items-center gap-2">
        <span className={isAnnual ? "font-semibold" : "text-default-500"}>Annual</span>
        <span className="text-xs text-purple-500">Save 20%</span>
      </div>
    </div>
  );
}



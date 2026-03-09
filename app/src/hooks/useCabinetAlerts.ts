import { useQuery } from "@tanstack/react-query";
import { differenceInDays, parseISO } from "date-fns";
import { getAllUserMedicines, type MedicineSummary } from "@/lib/medicines";
import { isCountableForm } from "@/lib/pharmaceutical-forms";

const LOW_QUANTITY_THRESHOLD = 5;
const EXPIRY_DAYS_THRESHOLD = 90;

export interface CabinetAlerts {
  total: number;
}

function hasAlert(med: MedicineSummary): boolean {
  const isExpiring =
    med.expiry_date !== null &&
    differenceInDays(parseISO(med.expiry_date), new Date()) <= EXPIRY_DAYS_THRESHOLD;
  const isLowStock =
    isCountableForm(med.pharmaceutical_form) &&
    med.quantity <= LOW_QUANTITY_THRESHOLD;
  return isExpiring || isLowStock;
}

export function useCabinetAlerts(cabinetIds: string[]): Record<string, CabinetAlerts> {
  const { data } = useQuery({
    queryKey: ["cabinet-alerts", cabinetIds],
    queryFn: () => getAllUserMedicines(cabinetIds),
    enabled: cabinetIds.length > 0,
  });

  if (!data) return {};

  const alertsByCabinet: Record<string, CabinetAlerts> = {};

  for (const med of data) {
    if (!alertsByCabinet[med.cabinet_id]) {
      alertsByCabinet[med.cabinet_id] = { total: 0 };
    }
    if (hasAlert(med)) {
      alertsByCabinet[med.cabinet_id].total++;
    }
  }

  return alertsByCabinet;
}

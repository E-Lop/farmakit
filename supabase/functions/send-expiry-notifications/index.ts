// Edge Function: send-expiry-notifications
// Invia notifiche push per farmaci in scadenza.
// Da schedulare con pg_cron o invocazione esterna (es. cron GitHub Actions).

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "https://esm.sh/web-push@3.6.7";

const VAPID_SUBJECT = "mailto:farmakitapp@gmail.com";

interface UserMedicine {
  id: string;
  custom_name: string | null;
  expiry_date: string;
  cabinet_id: string;
  medicine: { name: string } | null;
  cabinet: { name: string; cabinet_members: { user_id: string }[] } | null;
}

interface NotificationPrefs {
  user_id: string;
  enabled: boolean;
  expiry_intervals: number[];
  quiet_hours_enabled: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  max_notifications_per_day: number;
  timezone: string;
}

interface PushSub {
  endpoint: string;
  p256dh: string;
  auth_key: string;
}

function daysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  const expiry = new Date(expiryDate);
  return Math.ceil((expiry.getTime() - now.getTime()) / 86400000);
}

function isInQuietHours(prefs: NotificationPrefs): boolean {
  if (!prefs.quiet_hours_enabled) return false;
  const now = new Date();
  // Calcola ora locale dell'utente
  const userHour = new Date(
    now.toLocaleString("en-US", { timeZone: prefs.timezone }),
  ).getHours();

  const { quiet_hours_start: start, quiet_hours_end: end } = prefs;
  if (start < end) {
    return userHour >= start && userHour < end;
  }
  // Attraversa la mezzanotte (es. 22:00 - 08:00)
  return userHour >= start || userHour < end;
}

function buildNotificationBody(
  medicineName: string,
  daysLeft: number,
  cabinetName: string,
): { title: string; body: string } {
  if (daysLeft <= 0) {
    return {
      title: "Farmaco scaduto",
      body: `${medicineName} in "${cabinetName}" è scaduto`,
    };
  }
  if (daysLeft === 1) {
    return {
      title: "Scadenza domani",
      body: `${medicineName} in "${cabinetName}" scade domani`,
    };
  }
  return {
    title: "Farmaco in scadenza",
    body: `${medicineName} in "${cabinetName}" scade tra ${daysLeft} giorni`,
  };
}

Deno.serve(async () => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  webpush.setVapidDetails(
    VAPID_SUBJECT,
    Deno.env.get("VAPID_PUBLIC_KEY")!,
    Deno.env.get("VAPID_PRIVATE_KEY")!,
  );

  // Trova farmaci in scadenza nei prossimi 30 giorni (intervallo massimo)
  const maxDays = 30;
  const futureDate = new Date(Date.now() + maxDays * 86400000)
    .toISOString()
    .split("T")[0];
  const today = new Date().toISOString().split("T")[0];

  const { data: expiring, error } = await supabase
    .from("user_medicines")
    .select(
      "id, custom_name, expiry_date, cabinet_id, medicine:medicines(name), cabinet:cabinets(name, cabinet_members(user_id))",
    )
    .not("expiry_date", "is", null)
    .lte("expiry_date", futureDate)
    .gte("expiry_date", today);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }

  // Raggruppa per utente: quali farmaci notificare a chi
  const userNotifications = new Map<
    string,
    { medicineName: string; daysLeft: number; cabinetName: string }[]
  >();

  for (const med of (expiring ?? []) as unknown as UserMedicine[]) {
    const daysLeft = daysUntilExpiry(med.expiry_date);
    const medicineName = med.medicine?.name ?? med.custom_name ?? "Farmaco";
    const cabinetName = med.cabinet?.name ?? "Armadietto";
    const members = med.cabinet?.cabinet_members ?? [];

    for (const member of members) {
      const list = userNotifications.get(member.user_id) ?? [];
      list.push({ medicineName, daysLeft, cabinetName });
      userNotifications.set(member.user_id, list);
    }
  }

  // Batch: carica preferenze e subscriptions per tutti gli utenti in 2 query
  const userIds = [...userNotifications.keys()];

  const [{ data: allPrefs }, { data: allSubs }] = await Promise.all([
    supabase
      .from("notification_preferences")
      .select("*")
      .in("user_id", userIds),
    supabase
      .from("push_subscriptions")
      .select("user_id, endpoint, p256dh, auth_key")
      .in("user_id", userIds),
  ]);

  const prefsMap = new Map(
    (allPrefs ?? []).map((p: NotificationPrefs) => [p.user_id, p]),
  );
  const subsMap = new Map<string, PushSub[]>();
  for (const s of (allSubs ?? []) as (PushSub & { user_id: string })[]) {
    const list = subsMap.get(s.user_id) ?? [];
    list.push({ endpoint: s.endpoint, p256dh: s.p256dh, auth_key: s.auth_key });
    subsMap.set(s.user_id, list);
  }

  const DEFAULT_PREFS: NotificationPrefs = {
    user_id: "",
    enabled: true,
    expiry_intervals: [30, 7, 1],
    quiet_hours_enabled: false,
    quiet_hours_start: 22,
    quiet_hours_end: 8,
    max_notifications_per_day: 5,
    timezone: "Europe/Rome",
  };

  // Per ogni utente, filtra in base alle preferenze e invia push
  let sent = 0;
  let skipped = 0;
  const pushPromises: Promise<void>[] = [];

  for (const [userId, medicines] of userNotifications) {
    const userPrefs: NotificationPrefs = prefsMap.get(userId) ?? {
      ...DEFAULT_PREFS,
      user_id: userId,
    };

    if (!userPrefs.enabled || isInQuietHours(userPrefs)) {
      skipped += medicines.length;
      continue;
    }

    // Filtra farmaci in base agli intervalli configurati
    const toNotify = medicines.filter((m) =>
      userPrefs.expiry_intervals.some(
        (interval) => m.daysLeft === interval || m.daysLeft <= 0,
      ),
    );

    if (toNotify.length === 0) {
      skipped += medicines.length;
      continue;
    }

    // Limita al max giornaliero
    const limited = toNotify.slice(0, userPrefs.max_notifications_per_day);
    const subs = subsMap.get(userId);

    if (!subs || subs.length === 0) {
      skipped += limited.length;
      continue;
    }

    // Invia notifiche in parallelo
    for (const med of limited) {
      const { title, body } = buildNotificationBody(
        med.medicineName,
        med.daysLeft,
        med.cabinetName,
      );

      const payload = JSON.stringify({
        title,
        body,
        tag: `farmakit-expiry-${med.daysLeft}`,
        data: { url: "/", type: "expiry" },
      });

      for (const sub of subs) {
        pushPromises.push(
          webpush
            .sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth_key },
              },
              payload,
            )
            .then(() => {
              sent++;
            })
            .catch(async (err: unknown) => {
              const pushError = err as { statusCode?: number };
              console.error(`Push fallita per ${sub.endpoint}:`, pushError);
              // Se subscription scaduta/invalida, rimuovila
              if (
                pushError.statusCode === 410 ||
                pushError.statusCode === 404
              ) {
                await supabase
                  .from("push_subscriptions")
                  .delete()
                  .eq("endpoint", sub.endpoint);
              }
            }),
        );
      }
    }
  }

  await Promise.allSettled(pushPromises);

  return new Response(
    JSON.stringify({
      message: `Notifiche inviate: ${sent}, saltate: ${skipped}`,
      expiring_count: expiring?.length ?? 0,
    }),
  );
});

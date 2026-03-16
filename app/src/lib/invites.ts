import { invokeFunction } from "./edgeFunctions";

export async function createInvite(cabinetId: string): Promise<string> {
  const data = await invokeFunction<{ shortCode: string }>("create-invite", {
    cabinetId,
  });
  return data.shortCode;
}

export async function acceptInvite(
  shortCode: string,
): Promise<{ cabinetId: string }> {
  const data = await invokeFunction<{ cabinetId: string }>("accept-invite", {
    shortCode: shortCode.toUpperCase(),
  });
  return { cabinetId: data.cabinetId };
}

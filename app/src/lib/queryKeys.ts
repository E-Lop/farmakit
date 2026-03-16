export const medicineKeys = {
  all: () => ["user-medicines"] as const,
  list: (cabinetId: string) => ["user-medicines", cabinetId] as const,
};

export const cabinetKeys = {
  all: () => ["cabinets"] as const,
  members: (cabinetId: string) => ["cabinet-members", cabinetId] as const,
};

export const notificationKeys = {
  preferences: () => ["notification-preferences"] as const,
};

export const contributionKeys = {
  all: () => ["contributions"] as const,
  pending: () => ["contributions", "pending"] as const,
};

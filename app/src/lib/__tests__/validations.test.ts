import { describe, it, expect } from "vitest";
import { validateMedicineForm } from "../validations";

describe("validateMedicineForm", () => {
  it("richiede cabinet_id", () => {
    const errors = validateMedicineForm({ custom_name: "Tachipirina" });
    expect(errors).toContain("Seleziona un armadietto");
  });

  it("richiede nome o medicine_id", () => {
    const errors = validateMedicineForm({ cabinet_id: "abc" });
    expect(errors).toContain(
      "Inserisci il nome del farmaco o selezionane uno dal catalogo",
    );
  });

  it("accetta form valido", () => {
    const errors = validateMedicineForm({
      cabinet_id: "abc",
      custom_name: "Tachipirina",
      quantity: 2,
    });
    expect(errors).toHaveLength(0);
  });

  it("rifiuta quantità negativa", () => {
    const errors = validateMedicineForm({
      cabinet_id: "abc",
      custom_name: "Tachipirina",
      quantity: -1,
    });
    expect(errors).toContain("La quantità non può essere negativa");
  });
});

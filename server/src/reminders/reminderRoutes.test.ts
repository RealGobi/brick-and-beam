import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { app } from "../app";
import { getProduct, listProducts, type Product } from "../products/productStore";
import {
  createReminder,
  deleteReminder,
  getReminder,
  listDueReminders,
  listReminders,
  updateReminder,
  type Reminder,
} from "./reminderStore";

// Replace the database so the tests never need one
vi.mock("./reminderStore");
vi.mock("../products/productStore");

const productId = "3a2b1c0d-9e8f-4a7b-8c6d-5e4f3a2b1c0d";
const reminderId = "7d6c5b4a-3f2e-4d1c-8b0a-9f8e7d6c5b4a";

const reminder: Reminder = {
  id: reminderId,
  productId,
  title: "Byt batteri",
  dueDate: "2026-11-01",
  note: "9V",
  doneAt: null,
  createdAt: new Date("2026-10-01T10:00:00.000Z"),
};

const sendJson = (method: string, path: string, body: unknown) =>
  app.request(path, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

beforeEach(() => {
  vi.mocked(getProduct).mockResolvedValue({ id: productId } as Product);
  vi.mocked(getReminder).mockResolvedValue(reminder);
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("GET and POST /api/products/:productId/reminders", () => {
  it("returns the reminders of the product", async () => {
    vi.mocked(listReminders).mockResolvedValue([reminder]);

    const response = await app.request(`/api/products/${productId}/reminders`);

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject([{ id: reminderId, dueDate: "2026-11-01", doneAt: null }]);
  });

  it("saves a validated reminder and returns 201", async () => {
    vi.mocked(createReminder).mockResolvedValue(reminder);

    const response = await sendJson("POST", `/api/products/${productId}/reminders`, {
      title: " Byt batteri ",
      dueDate: "2026-11-01",
    });

    expect(response.status).toBe(201);
    expect(createReminder).toHaveBeenCalledWith(productId, { title: "Byt batteri", dueDate: "2026-11-01", note: "" });
  });

  it("returns 404 when the product does not exist", async () => {
    vi.mocked(getProduct).mockResolvedValue(undefined);

    const response = await sendJson("POST", `/api/products/${productId}/reminders`, { title: "X", dueDate: "2026-11-01" });

    expect(response.status).toBe(404);
    expect(createReminder).not.toHaveBeenCalled();
  });
});

describe("PATCH /api/reminders/:reminderId", () => {
  it("marks a reminder as done and keeps the other fields", async () => {
    vi.mocked(updateReminder).mockResolvedValue({ ...reminder, doneAt: new Date() });

    const response = await sendJson("PATCH", `/api/reminders/${reminderId}`, { done: true });

    expect(response.status).toBe(200);
    expect(updateReminder).toHaveBeenCalledWith(reminderId, {
      title: "Byt batteri",
      dueDate: "2026-11-01",
      note: "9V",
      done: true,
    });
  });

  it("keeps a done reminder done when only the title changes", async () => {
    vi.mocked(getReminder).mockResolvedValue({ ...reminder, doneAt: new Date() });

    await sendJson("PATCH", `/api/reminders/${reminderId}`, { title: "Bytt batteri" });

    expect(updateReminder).toHaveBeenCalledWith(reminderId, expect.objectContaining({ title: "Bytt batteri", done: true }));
  });

  it("returns 400 when done is not a boolean", async () => {
    const response = await sendJson("PATCH", `/api/reminders/${reminderId}`, { done: "ja" });

    expect(response.status).toBe(400);
    expect(updateReminder).not.toHaveBeenCalled();
  });

  it("returns 404 when the reminder does not exist", async () => {
    vi.mocked(getReminder).mockResolvedValue(undefined);

    const response = await sendJson("PATCH", `/api/reminders/${reminderId}`, { done: true });

    expect(response.status).toBe(404);
    expect(await response.json()).toEqual({ error: "Påminnelsen finns inte" });
  });
});

describe("DELETE /api/reminders/:reminderId", () => {
  it("deletes the reminder and returns 204", async () => {
    vi.mocked(deleteReminder).mockResolvedValue(true);

    const response = await app.request(`/api/reminders/${reminderId}`, { method: "DELETE" });

    expect(response.status).toBe(204);
  });

  it("returns 404 when the reminder does not exist or the id is not a uuid", async () => {
    vi.mocked(deleteReminder).mockResolvedValue(false);

    expect((await app.request(`/api/reminders/${reminderId}`, { method: "DELETE" })).status).toBe(404);
    expect((await app.request("/api/reminders/abc", { method: "DELETE" })).status).toBe(404);
  });
});

describe("GET /api/notifications", () => {
  it("combines due reminders and products into notifications", async () => {
    vi.mocked(listProducts).mockResolvedValue([]);
    vi.mocked(listDueReminders).mockResolvedValue([{ ...reminder, dueDate: "2000-01-01", productName: "Brandvarnare" }]);

    const response = await app.request("/api/notifications");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual([
      expect.objectContaining({ kind: "reminder", productName: "Brandvarnare", date: "2000-01-01", overdue: true }),
    ]);
  });
});

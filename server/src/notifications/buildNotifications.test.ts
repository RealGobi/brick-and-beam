import { describe, expect, it } from "vitest";
import type { Product } from "../products/productStore";
import type { DueReminder } from "../reminders/reminderStore";
import { addDays, buildNotifications, todayIso } from "./buildNotifications";

const today = "2026-10-24";

function product(overrides: Partial<Product>): Product {
  return {
    id: "p1",
    name: "Värmepump",
    description: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    location: "",
    purchaseDate: null,
    warrantyUntil: null,
    serviceIntervalMonths: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastServiceDate: null,
    nextServiceDate: null,
    serviceCount: 0,
    ...overrides,
  };
}

function reminder(overrides: Partial<DueReminder>): DueReminder {
  return {
    id: "r1",
    productId: "p1",
    productName: "Brandvarnare",
    title: "Byt batteri",
    dueDate: today,
    note: "",
    doneAt: null,
    createdAt: new Date(),
    ...overrides,
  };
}

const kindsAndDates = (products: Product[], reminders: DueReminder[] = []) =>
  buildNotifications(products, reminders, today).map((notice) => `${notice.kind} ${notice.date}`);

describe("buildNotifications: service", () => {
  it("includes a service that is overdue or due within 14 days", () => {
    const products = [
      product({ id: "a", nextServiceDate: "2026-10-01" }),
      product({ id: "b", nextServiceDate: "2026-11-07" }),
    ];

    expect(kindsAndDates(products)).toEqual(["service 2026-10-01", "service 2026-11-07"]);
  });

  it("leaves out a service more than 14 days away and products without an interval", () => {
    const products = [product({ id: "a", nextServiceDate: "2026-11-08" }), product({ id: "b", nextServiceDate: null })];

    expect(kindsAndDates(products)).toEqual([]);
  });

  it("marks only passed dates as overdue", () => {
    const [passed, todaysOwn] = buildNotifications(
      [product({ id: "a", nextServiceDate: "2026-10-23" }), product({ id: "b", nextServiceDate: today })],
      [],
      today,
    );

    expect([passed.overdue, todaysOwn.overdue]).toEqual([true, false]);
  });
});

describe("buildNotifications: warranty", () => {
  it("includes a warranty that runs out within 30 days", () => {
    expect(kindsAndDates([product({ warrantyUntil: today })])).toEqual([`warranty ${today}`]);
    expect(kindsAndDates([product({ warrantyUntil: "2026-11-23" })])).toEqual(["warranty 2026-11-23"]);
  });

  it("leaves out a warranty that has already expired or is further away", () => {
    expect(kindsAndDates([product({ warrantyUntil: "2026-10-23" })])).toEqual([]);
    expect(kindsAndDates([product({ warrantyUntil: "2026-11-24" })])).toEqual([]);
  });
});

describe("buildNotifications: reminders", () => {
  it("includes reminders due within 14 days, with the product name", () => {
    const [notice] = buildNotifications([], [reminder({ dueDate: "2026-11-07" })], today);

    expect(notice).toEqual({
      key: "reminder-r1",
      kind: "reminder",
      productId: "p1",
      productName: "Brandvarnare",
      title: "Byt batteri",
      date: "2026-11-07",
      overdue: false,
    });
  });

  it("leaves out reminders more than 14 days away", () => {
    expect(kindsAndDates([], [reminder({ dueDate: "2026-11-08" })])).toEqual([]);
  });
});

describe("buildNotifications: order", () => {
  it("puts everything in date order, soonest first", () => {
    const products = [product({ id: "a", nextServiceDate: "2026-11-01", warrantyUntil: "2026-10-30" })];
    const reminders = [reminder({ dueDate: "2026-10-20" })];

    expect(kindsAndDates(products, reminders)).toEqual(["reminder 2026-10-20", "warranty 2026-10-30", "service 2026-11-01"]);
  });
});

describe("date helpers", () => {
  it("adds days across months and years", () => {
    expect(addDays("2026-12-25", 14)).toBe("2027-01-08");
  });

  it("gives today in local time", () => {
    expect(todayIso(new Date(2026, 0, 5, 23, 30))).toBe("2026-01-05");
  });
});

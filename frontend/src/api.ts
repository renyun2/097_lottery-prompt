import type {
  AppSettings,
  CheckInStats,
  DrawResult,
  Employee,
  PoolName,
  Prize,
  WinRecordRow,
} from "./types";

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const t = await res.text();
    throw new Error(t || res.statusText);
  }
  return res.json() as Promise<T>;
}

export async function fetchSettings(): Promise<AppSettings> {
  return j(await fetch("/api/settings"));
}

export async function saveSettings(s: Partial<AppSettings>): Promise<AppSettings> {
  return j(
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(s),
    }),
  );
}

export async function fetchEmployees(): Promise<Employee[]> {
  return j(await fetch("/api/employees"));
}

export async function fetchDepartments(): Promise<string[]> {
  return j(await fetch("/api/employees/departments"));
}

export async function importEmployeesCsv(file: File): Promise<{ added: number; updated: number }> {
  const fd = new FormData();
  fd.append("file", file);
  return j(
    await fetch("/api/employees/import", {
      method: "POST",
      body: fd,
    }),
  );
}

export async function deleteEmployee(id: number): Promise<void> {
  const res = await fetch(`/api/employees/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export async function fetchPrizes(): Promise<Prize[]> {
  return j(await fetch("/api/prizes"));
}

export async function createPrize(body: Partial<Prize> & { level_name: string; gift_name: string }): Promise<Prize> {
  return j(
    await fetch("/api/prizes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function updatePrize(id: number, body: Partial<Prize>): Promise<Prize> {
  return j(
    await fetch(`/api/prizes/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function deletePrize(id: number): Promise<void> {
  const res = await fetch(`/api/prizes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error(await res.text());
}

export async function checkIn(empNo: string): Promise<Employee> {
  return j(
    await fetch("/api/checkin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emp_no: empNo }),
    }),
  );
}

export async function checkInStats(): Promise<CheckInStats> {
  return j(await fetch("/api/checkin/stats"));
}

export async function checkInList(): Promise<Employee[]> {
  return j(await fetch("/api/checkin/list"));
}

export async function poolSample(): Promise<PoolName[]> {
  return j(await fetch("/api/lottery/pool-sample"));
}

export async function draw(prizeId: number): Promise<DrawResult> {
  return j(
    await fetch("/api/lottery/draw", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prize_id: prizeId }),
    }),
  );
}

export async function winRecords(): Promise<WinRecordRow[]> {
  return j(await fetch("/api/lottery/records"));
}

export function exportUrl(kind: "csv" | "html") {
  window.open(`/api/lottery/export/${kind}`, "_blank");
}

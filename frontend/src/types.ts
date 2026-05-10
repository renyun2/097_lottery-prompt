export type AppSettings = {
  allow_repeat_win: boolean;
  participation_mode: "all" | "departments";
  participation_departments: string[];
  require_checkin: boolean;
};

export type Employee = {
  id: number;
  emp_no: string;
  name: string;
  department: string;
  hire_date: string | null;
  base_weight: number;
  checked_in: boolean;
};

export type Prize = {
  id: number;
  level_name: string;
  gift_name: string;
  sort_order: number;
  total_quantity: number;
  per_draw_count: number;
  drawn_count: number;
};

export type CheckInStats = {
  total_employees: number;
  checked_in: number;
  rate: number;
};

export type PoolName = { name: string; department: string };

export type DrawResult = {
  winners: { id: number; emp_no: string; name: string; department: string }[];
  prize: Prize;
  remaining_for_prize: number;
};

export type WinRecordRow = {
  emp_no: string;
  name: string;
  department: string;
  level_name: string;
  gift_name: string;
  drawn_at: string;
};

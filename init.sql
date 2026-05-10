USE lottery;

SET NAMES utf8mb4;

DROP TABLE IF EXISTS win_records;
DROP TABLE IF EXISTS check_ins;
DROP TABLE IF EXISTS app_settings;
DROP TABLE IF EXISTS prizes;
DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  emp_no VARCHAR(32) NOT NULL UNIQUE,
  name VARCHAR(64) NOT NULL,
  department VARCHAR(128) NOT NULL,
  hire_date DATE NULL,
  base_weight INT NOT NULL DEFAULT 1,
  INDEX idx_dept (department)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE prizes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level_name VARCHAR(64) NOT NULL,
  gift_name VARCHAR(128) NOT NULL,
  sort_order INT NOT NULL,
  total_quantity INT NOT NULL,
  per_draw_count INT NOT NULL,
  drawn_count INT NOT NULL DEFAULT 0,
  INDEX idx_sort (sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE check_ins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL UNIQUE,
  checked_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE app_settings (
  `key` VARCHAR(64) PRIMARY KEY,
  value TEXT NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE win_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prize_id INT NOT NULL,
  employee_id INT NOT NULL,
  emp_no VARCHAR(32) NOT NULL,
  name VARCHAR(64) NOT NULL,
  department VARCHAR(128) NOT NULL,
  drawn_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_prize (prize_id),
  FOREIGN KEY (prize_id) REFERENCES prizes(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

INSERT INTO employees (emp_no, name, department, hire_date, base_weight)
WITH RECURSIVE seq AS (
  SELECT 1 AS n
  UNION ALL
  SELECT n + 1 FROM seq WHERE n < 300
)
SELECT
  LPAD(n, 5, '0'),
  CONCAT('员工', n),
  ELT((n % 5) + 1, '技术部','市场部','人事部','财务部','运营部'),
  CASE WHEN n % 8 = 0 THEN DATE_SUB(CURDATE(), INTERVAL 6 YEAR)
       ELSE DATE_SUB(CURDATE(), INTERVAL (n % 5 + 1) YEAR) END,
  1
FROM seq;

INSERT INTO prizes (level_name, gift_name, sort_order, total_quantity, per_draw_count, drawn_count) VALUES
('幸运奖','精美抱枕',1,40,8,0),
('三等奖','真无线耳机',2,30,6,0),
('二等奖','智能手表',3,10,5,0),
('一等奖','轻薄笔记本',4,3,1,0),
('特等奖','双人旅游基金',5,1,1,0);

INSERT INTO app_settings (`key`, value) VALUES
('allow_repeat_win', 'false'),
('participation_mode', 'all'),
('participation_departments', '[]'),
('require_checkin', 'true');

INSERT INTO check_ins (employee_id, checked_at)
SELECT id, NOW() FROM employees WHERE id <= 220;

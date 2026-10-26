-- sql/schema.sql
-- Employee Directory — database, table and seed data.
-- Run this ONCE in HeidiSQL (Laragon) before starting the app.

CREATE DATABASE IF NOT EXISTS employee_directory
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE employee_directory;

DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  empId      VARCHAR(10)  NOT NULL UNIQUE,            -- e.g. EMP001
  name       VARCHAR(120) NOT NULL,
  email      VARCHAR(120) NOT NULL,
  department VARCHAR(40)  NOT NULL,                   -- IT, HR, Finance, Marketing, Operations
  position   VARCHAR(80)  NOT NULL,
  hireDate   DATE         NOT NULL,
  salary     DECIMAL(10,2) NOT NULL,                  -- monthly salary in RM
  active     TINYINT(1)   NOT NULL DEFAULT 1,
  CHECK (salary >= 1500 AND salary <= 50000)
) ENGINE=InnoDB;

INSERT INTO employees
  (empId, name, email, department, position, hireDate, salary, active)
VALUES
  ('EMP001', 'Ahmad Zulkarnain bin Hassan', 'ahmad.zulkarnain@company.com.my',
   'IT',         'Senior Software Engineer', '2021-03-15',  8500.00, 1),
  ('EMP002', 'Nur Aisyah binti Abdullah',   'nur.aisyah@company.com.my',
   'HR',         'HR Manager',               '2019-07-01', 11000.00, 1),
  ('EMP003', 'Muhammad Faris bin Razak',    'm.faris@company.com.my',
   'Finance',    'Accountant',               '2022-01-10',  6200.00, 1),
  ('EMP004', 'Siti Khadijah binti Ibrahim', 'siti.khadijah@company.com.my',
   'Marketing',  'Marketing Executive',      '2023-05-22',  4800.00, 1),
  ('EMP005', 'Tan Wei Ming',                'tan.weiming@company.com.my',
   'IT',         'DevOps Engineer',          '2020-11-03',  9000.00, 1),
  ('EMP006', 'Lim Mei Ling',                'lim.meiling@company.com.my',
   'Operations', 'Operations Lead',          '2018-02-18', 10250.00, 1),
  ('EMP007', 'Rajesh A/L Subramaniam',      'rajesh.subramaniam@company.com.my',
   'Finance',    'Junior Analyst',           '2024-09-09',  3500.00, 0);

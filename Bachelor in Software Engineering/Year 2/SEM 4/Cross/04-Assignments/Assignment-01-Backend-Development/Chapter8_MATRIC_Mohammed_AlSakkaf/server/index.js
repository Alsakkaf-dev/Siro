// server/index.js — Employee Directory REST API
const express = require('express')
const cors = require('cors')
const pool = require('./db')

const app = express()
app.use(cors())            // allow the Vite dev server (http://localhost:5174)
app.use(express.json())    // parse application/json bodies

// ---------- Server-side validation (never trust the client) ----------
const EMP_ID_RE = /^EMP[0-9]{3,5}$/
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Marketing', 'Operations']

function validateEmployee(b) {
  const e = {}
  if (!b.empId || !EMP_ID_RE.test(String(b.empId).trim()))
    e.empId = 'Format: EMP followed by 3–5 digits (e.g. EMP001).'
  if (!b.name || String(b.name).trim().length < 3)
    e.name = 'Name must be at least 3 characters.'
  if (!b.email || !EMAIL_RE.test(String(b.email).trim()))
    e.email = 'A valid email is required.'
  if (!b.department || !DEPARTMENTS.includes(b.department))
    e.department = 'Please choose a valid department.'
  if (!b.position || !String(b.position).trim())
    e.position = 'Position is required.'
  if (!b.hireDate) e.hireDate = 'Hire date is required.'
  else if (new Date(b.hireDate) > new Date(new Date().toDateString()))
    e.hireDate = 'Hire date cannot be in the future.'
  const salary = Number(b.salary)
  if (Number.isNaN(salary) || salary < 1500 || salary > 50000)
    e.salary = 'Salary must be between RM 1,500 and RM 50,000.'
  return e
}

// ---------- Health check ----------
app.get('/', (req, res) => res.json({ status: 'ok', service: 'employee-directory' }))

// ---------- READ list (optional server-side search & sort) ----------
app.get('/employees', async (req, res) => {
  try {
    const { q, sortBy, order } = req.query
    let sql = 'SELECT * FROM employees'
    const params = []

    if (q) {
      // search across at least three columns using LIKE + prepared params
      sql += ' WHERE name LIKE ? OR empId LIKE ? OR email LIKE ? OR department LIKE ?'
      const like = `%${q}%`
      params.push(like, like, like, like)
    }

    // Whitelist sort columns — never let the client inject a column name
    const allowedSort = ['name', 'hireDate', 'salary', 'empId']
    if (sortBy && allowedSort.includes(sortBy)) {
      const direction = order === 'desc' ? 'DESC' : 'ASC'
      sql += ` ORDER BY ${sortBy} ${direction}`
    } else {
      sql += ' ORDER BY id ASC'
    }

    const [rows] = await pool.query(sql, params)
    res.json(rows)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// ---------- READ single ----------
app.get('/employees/:id', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM employees WHERE id = ?', [req.params.id])
    if (!rows.length) return res.status(404).json({ error: 'Not found' })
    res.json(rows[0])
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

// ---------- CREATE ----------
app.post('/employees', async (req, res) => {
  const errors = validateEmployee(req.body)
  if (Object.keys(errors).length) return res.status(400).json({ errors })
  try {
    const { empId, name, email, department, position, hireDate, salary, active } = req.body
    const [r] = await pool.query(
      `INSERT INTO employees
         (empId, name, email, department, position, hireDate, salary, active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [empId.trim(), name.trim(), email.trim(), department, position.trim(),
       hireDate, Number(salary), active ? 1 : 0]
    )
    res.status(201).json({ id: r.insertId, ...req.body })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Employee ID already exists' })
    console.error(err)
    res.status(500).json({ error: 'Database error' })
  }
})

// ---------- UPDATE ----------
app.put('/employees/:id', async (req, res) => {
  const errors = validateEmployee(req.body)
  if (Object.keys(errors).length) return res.status(400).json({ errors })
  try {
    const { empId, name, email, department, position, hireDate, salary, active } = req.body
    const [r] = await pool.query(
      `UPDATE employees SET
         empId=?, name=?, email=?, department=?, position=?, hireDate=?, salary=?, active=?
       WHERE id=?`,
      [empId.trim(), name.trim(), email.trim(), department, position.trim(),
       hireDate, Number(salary), active ? 1 : 0, req.params.id]
    )
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
    res.json({ id: Number(req.params.id), ...req.body })
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ error: 'Employee ID already exists' })
    res.status(500).json({ error: 'Database error' })
  }
})

// ---------- DELETE ----------
app.delete('/employees/:id', async (req, res) => {
  try {
    const [r] = await pool.query('DELETE FROM employees WHERE id = ?', [req.params.id])
    if (!r.affectedRows) return res.status(404).json({ error: 'Not found' })
    res.json({ deleted: true })
  } catch (err) {
    res.status(500).json({ error: 'Database error' })
  }
})

const PORT = 3001
app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`))

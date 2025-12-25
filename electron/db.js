const Database = require('better-sqlite3');
const path = require('path');
const { app } = require('electron');
const fs = require('fs');

let db;

function getDbPath() {
  const userDataPath = app.getPath('userData');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  return path.join(userDataPath, 'students.db');
}

function initDatabase() {
  const dbPath = getDbPath();
  console.log('Database path:', dbPath);

  db = new Database(dbPath);
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS student_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id INTEGER,
      class_code TEXT,
      serial_number INTEGER,
      name TEXT NOT NULL,
      class_room TEXT,
      student_code TEXT,
      national_id TEXT NOT NULL UNIQUE,
      birth_date TEXT,
      birth_day INTEGER,
      birth_month INTEGER,
      birth_year INTEGER,
      birth_governorate TEXT,
      gender TEXT,
      religion TEXT,
      nationality TEXT,
      last_certificate TEXT,
      last_school TEXT,
      total_score TEXT,
      guardian_name TEXT,
      student_address TEXT,
      stage TEXT,
      orphan_status TEXT,
      enrollment_status TEXT,
      tablet_serial TEXT,
      imei TEXT,
      insurance_number TEXT,
      enrollment_date TEXT,
      notes TEXT,
      FOREIGN KEY (group_id) REFERENCES student_groups(id)
    );

    CREATE TABLE IF NOT EXISTS transfer_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id INTEGER NOT NULL,
      from_school TEXT NOT NULL,
      to_school TEXT NOT NULL,
      transfer_reason TEXT,
      request_date TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (student_id) REFERENCES students(id)
    );

    CREATE INDEX IF NOT EXISTS idx_students_national_id ON students(national_id);
    CREATE INDEX IF NOT EXISTS idx_students_name ON students(name);
    CREATE INDEX IF NOT EXISTS idx_students_group_id ON students(group_id);
  `);

  console.log('Database initialized successfully');
}

// Students functions
function getAllStudents() {
  const stmt = db.prepare('SELECT * FROM students ORDER BY name');
  return stmt.all();
}

function searchStudents(query, type = 'nationalId') {
  if (!query) return getAllStudents();

  const column = type === 'nationalId' ? 'national_id' : 'name';
  const stmt = db.prepare(`SELECT * FROM students WHERE ${column} LIKE ? ORDER BY name`);
  return stmt.all(`%${query}%`);
}

function getStudentById(id) {
  const stmt = db.prepare('SELECT * FROM students WHERE id = ?');
  return stmt.get(id);
}

function createStudent(studentData) {
  const fields = [];
  const placeholders = [];
  const values = [];

  for (const [key, value] of Object.entries(studentData)) {
    if (value !== undefined && value !== null && value !== '') {
      fields.push(key);
      placeholders.push('?');
      values.push(value);
    }
  }

  const stmt = db.prepare(`
    INSERT INTO students (${fields.join(', ')})
    VALUES (${placeholders.join(', ')})
  `);

  const result = stmt.run(...values);
  return getStudentById(result.lastInsertRowid);
}

function updateStudent(id, studentData) {
  const fields = [];
  const values = [];

  for (const [key, value] of Object.entries(studentData)) {
    if (value !== undefined) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
  }

  if (fields.length === 0) return getStudentById(id);

  values.push(id);
  const stmt = db.prepare(`UPDATE students SET ${fields.join(', ')} WHERE id = ?`);
  stmt.run(...values);

  return getStudentById(id);
}

function deleteStudent(id) {
  const deleteTransfersStmt = db.prepare('DELETE FROM transfer_requests WHERE student_id = ?');
  deleteTransfersStmt.run(id);

  const stmt = db.prepare('DELETE FROM students WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

function bulkCreateStudents(studentsData, groupName) {
  let groupId = null;

  if (groupName) {
    const group = createGroup({ name: groupName, createdAt: new Date().toISOString() });
    groupId = group.id;
  }

  const created = [];
  const insert = db.transaction((students) => {
    for (const studentData of students) {
      if (!studentData.name && !studentData.nationalId) continue;

      const cleaned = {};
      for (const [key, value] of Object.entries(studentData)) {
        if (value !== undefined && value !== null && value !== '') {
          cleaned[key] = value;
        }
      }

      if (groupId) cleaned.groupId = groupId;
      if (!cleaned.name) cleaned.name = 'Unknown';
      if (!cleaned.nationalId) cleaned.nationalId = `temp-${Date.now()}-${Math.random()}`;

      try {
        const student = createStudent(cleaned);
        created.push(student);
      } catch (err) {
        console.error('Error inserting student:', err);
      }
    }
  });

  insert(studentsData);
  return created;
}

// Groups functions
function getGroups() {
  const stmt = db.prepare('SELECT * FROM student_groups ORDER BY created_at DESC');
  return stmt.all();
}

function createGroup(groupData) {
  const stmt = db.prepare(`
    INSERT INTO student_groups (name, created_at)
    VALUES (?, ?)
  `);

  const result = stmt.run(groupData.name, groupData.createdAt);
  const getStmt = db.prepare('SELECT * FROM student_groups WHERE id = ?');
  return getStmt.get(result.lastInsertRowid);
}

function deleteGroup(id) {
  const deleteTransfersStmt = db.prepare(`
    DELETE FROM transfer_requests
    WHERE student_id IN (SELECT id FROM students WHERE group_id = ?)
  `);
  deleteTransfersStmt.run(id);

  const deleteStudentsStmt = db.prepare('DELETE FROM students WHERE group_id = ?');
  deleteStudentsStmt.run(id);

  const deleteGroupStmt = db.prepare('DELETE FROM student_groups WHERE id = ?');
  const result = deleteGroupStmt.run(id);

  return result.changes > 0;
}

// Transfer Requests functions
function createTransferRequest(requestData) {
  const stmt = db.prepare(`
    INSERT INTO transfer_requests (student_id, from_school, to_school, transfer_reason, request_date, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    requestData.studentId,
    requestData.fromSchool,
    requestData.toSchool,
    requestData.transferReason || null,
    requestData.requestDate,
    requestData.status || 'pending'
  );

  const getStmt = db.prepare('SELECT * FROM transfer_requests WHERE id = ?');
  return getStmt.get(result.lastInsertRowid);
}

function getTransferRequestsByStudentId(studentId) {
  const stmt = db.prepare('SELECT * FROM transfer_requests WHERE student_id = ?');
  return stmt.all(studentId);
}

module.exports = {
  initDatabase,
  getAllStudents,
  searchStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent,
  bulkCreateStudents,
  getGroups,
  createGroup,
  deleteGroup,
  createTransferRequest,
  getTransferRequestsByStudentId
};

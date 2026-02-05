CREATE DATABASE IF NOT EXISTS assessment_db;
USE assessment_db;

CREATE TABLE IF NOT EXISTS `position` (
    position_id INT AUTO_INCREMENT PRIMARY KEY,
    `position` VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS `level` (
    level_id INT AUTO_INCREMENT PRIMARY KEY,
    `level` VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS department (
    department_id INT AUTO_INCREMENT PRIMARY KEY,
    department VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    czid VARCHAR(13) NOT NULL,
    bdate DATE,
    phone VARCHAR(10),
    salary DECIMAL(10, 2),
    start_date DATE,
    department_id INT,
    level_id INT,
    position_id INT,
    role ENUM('1', '2') DEFAULT '2', -- 1 for Admin, 2 for User
    FOREIGN KEY (department_id) REFERENCES department(department_id),
    FOREIGN KEY (level_id) REFERENCES `level`(level_id),
    FOREIGN KEY (position_id) REFERENCES `position`(position_id)
);

CREATE TABLE IF NOT EXISTS indicators (
    indicator_id INT AUTO_INCREMENT PRIMARY KEY,
    indicator VARCHAR(255) NOT NULL,
    weight DECIMAL(5, 2) NOT NULL
);

CREATE TABLE IF NOT EXISTS assessment_rounds (
    time_id INT AUTO_INCREMENT PRIMARY KEY,
    time1_start DATETIME,
    time1_end DATETIME,
    time2_start DATETIME,
    time2_end DATETIME
);

CREATE TABLE IF NOT EXISTS sections (
    section_id INT AUTO_INCREMENT PRIMARY KEY,
    indicator_id INT,
    section_name VARCHAR(255),
    detail TEXT,
    type VARCHAR(50),
    require_file BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (indicator_id) REFERENCES indicators(indicator_id)
);

CREATE TABLE IF NOT EXISTS results (
    result_id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    evaluator_id INT,
    time_id INT,
    section_id INT,
    score INT,
    file_path VARCHAR(255),
    comment TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (evaluator_id) REFERENCES users(id),
    FOREIGN KEY (time_id) REFERENCES assessment_rounds(time_id),
    FOREIGN KEY (section_id) REFERENCES sections(section_id)
);

CREATE TABLE IF NOT EXISTS assessment_groups (
    group_id INT AUTO_INCREMENT PRIMARY KEY,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS group_assignments (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    group_id INT,
    user_id INT,
    group_role VARCHAR(50),
    FOREIGN KEY (group_id) REFERENCES assessment_groups(group_id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Seed data for testing
-- Seed data for testing
INSERT IGNORE INTO `position` (position_id, `position`) VALUES 
(1, 'อาจารย์'), (2, 'เจ้าหน้าที่'), (3, 'ผู้จัดการ');
INSERT IGNORE INTO `level` (level_id, `level`) VALUES 
(1, 'ปฏิบัติการ'), (2, 'ชำนาญการ'), (3, 'เชี่ยวชาญ');
INSERT IGNORE INTO department (department_id, department) VALUES 
(1, 'เทคโนโลยีสารสนเทศ'), (2, 'ทรัพยากรบุคคล'), (3, 'การเงิน');

-- Default users (password: password123 for all)
INSERT INTO users (id, username, email, password, czid, role, department_id, level_id, position_id) VALUES 
(1, 'admin', 'admin@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '1234567890123', '1', 1, 3, 3),
(2, 'user1', 'user1@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '1111111111111', '2', 1, 1, 1),
(3, 'user2', 'user2@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '2222222222222', '2', 2, 2, 2),
(4, 'user3', 'user3@example.com', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', '3333333333333', '2', 3, 1, 1)
ON DUPLICATE KEY UPDATE 
    username=VALUES(username), 
    password=VALUES(password), 
    role=VALUES(role),
    department_id=VALUES(department_id),
    level_id=VALUES(level_id),
    position_id=VALUES(position_id);

-- Assessment Indicators
INSERT INTO indicators (indicator_id, indicator, weight) VALUES 
(1, 'ผลสัมฤทธิ์ของงาน (KPIs)', 40.00),
(2, 'การพัฒนางานวิจัย', 20.00),
(3, 'พฤติกรรมการปฏิบัติงาน', 20.00),
(4, 'การบริการวิชาการ', 10.00),
(5, 'งานอื่นๆ ที่ได้รับมอบหมาย', 10.00)
ON DUPLICATE KEY UPDATE indicator=VALUES(indicator), weight=VALUES(weight);

-- Assessment Sections
INSERT INTO sections (section_id, indicator_id, section_name, detail, type, require_file) VALUES 
(1, 1, 'ภาระงานสอน', 'จำนวนชั่วโมงสอนเทียบเคียงต่อสัปดาห์', '1234', TRUE),
(2, 1, 'การผลิตบัณฑิต', 'จำนวนนักศึกษาที่สำเร็จการศึกษาภายใต้การดูแล', '1234', FALSE),
(3, 1, 'การพัฒนาหลักสูตร', 'การปรับปรุงหรือนำเสนอหลักสูตรใหม่', '1234', TRUE),
(4, 2, 'การตีพิมพ์ในวารสารระดับนานาชาติ', 'Q1/Q2 ใน Scopus/WoS', '1234', TRUE),
(5, 2, 'การตีพิมพ์ในวารสารระดับชาติ', 'TCI กลุ่ม 1/2', '1234', TRUE),
(6, 2, 'การจดสิทธิบัตร/อนุสิทธิบัตร', 'จำนวนเลขสิทธิบัตรที่ได้รับ', '1234', TRUE),
(7, 3, 'ความรับผิดชอบและวินัย', 'การรักษาวินัยและการตรงต่อเวลา', '1234', FALSE),
(8, 3, 'การทำงานร่วมกับผู้อื่น', 'ความร่วมมือในโครงการของคณะ/มหาลัย', '1234', FALSE),
(9, 3, 'การพัฒนาตนเอง', 'การเข้าร่วมอบรม/สัมมนาเพื่อพัฒนาทักษะ', '1234', TRUE),
(10, 4, 'การเป็นที่ปรึกษาหน่วยงานภายนอก', 'การให้คำปรึกษาทางวิชาการ', '1234', TRUE),
(11, 4, 'โครงการถ่ายทอดองค์ความรู้', 'การจัดอบรมให้ความรู้แก่ชุมชน', '1234', TRUE),
(12, 5, 'กรรมการคณะ/มหาวิทยาลัย', 'ภาระงานตามคำสั่งแต่งตั้ง', '1234', TRUE),
(13, 5, 'งานกิจกรรมนักศึกษา', 'การควบคุมดูแลกิจกรรมต่างๆ', '1234', FALSE)
ON DUPLICATE KEY UPDATE 
    indicator_id=VALUES(indicator_id), 
    section_name=VALUES(section_name), 
    detail=VALUES(detail), 
    type=VALUES(type),
    require_file=VALUES(require_file);

-- Active Assessment Round
INSERT INTO assessment_rounds (time_id, time1_start, time1_end, time2_start, time2_end) VALUES 
(1, '2026-01-01 00:00:00', '2026-12-31 23:59:59', '2026-01-01 00:00:00', '2026-12-31 23:59:59')
ON DUPLICATE KEY UPDATE 
    time1_start=VALUES(time1_start), 
    time1_end=VALUES(time1_end), 
    time2_start=VALUES(time2_start), 
    time2_end=VALUES(time2_end);

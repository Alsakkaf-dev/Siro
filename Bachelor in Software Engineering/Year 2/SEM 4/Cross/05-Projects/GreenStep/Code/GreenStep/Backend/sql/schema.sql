-- =============================================================================
-- GreenStep Authoritative Schema — Aligned to the Finalised ER Diagram
-- OWNERSHIP: Database & Security Lead (Rawan MohamedSalih Magzob — A24CS4066)
-- Table order respects FK dependency chains (Parents besysfore Children).
-- Linux-ready Case-Sensitivity Aligned to Documentation.
-- =============================================================================

CREATE DATABASE IF NOT EXISTS greenstep CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE greenstep;

-- ── 1. Role ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Role (
    role_id INT          AUTO_INCREMENT PRIMARY KEY,
    name    VARCHAR(30)  NOT NULL UNIQUE
) ENGINE=InnoDB;

-- ── 2. User ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS User (
    user_id       INT          AUTO_INCREMENT PRIMARY KEY,
    role_id       INT          NOT NULL,
    name          VARCHAR(120) NOT NULL,
    email         VARCHAR(190) NOT NULL UNIQUE,
    password_hash VARCHAR(225) NOT NULL,
    is_active     TINYINT(1)   NOT NULL DEFAULT 1,
    joined_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES Role(role_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ── 3. Badge ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Badge (
    badge_id      INT          AUTO_INCREMENT PRIMARY KEY,
    name          VARCHAR(120) NOT NULL,
    criteria_json JSON         NOT NULL,
    image_url     VARCHAR(255) NOT NULL
) ENGINE=InnoDB;

-- ── 4. User_Badge ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS User_Badge (
    badge_id   INT      NOT NULL,
    user_id    INT      NOT NULL,
    awarded_on DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (badge_id, user_id),
    CONSTRAINT fk_ub_badge FOREIGN KEY (badge_id) REFERENCES Badge(badge_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ub_user  FOREIGN KEY (user_id)  REFERENCES User(user_id)  ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ── 5. Category ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Category (
    category_id INT          AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(60)  NOT NULL UNIQUE,
    description VARCHAR(160) NULL
) ENGINE=InnoDB;

-- ── 6. Activity_Type ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Activity_Type (
    activity_type_id INT           AUTO_INCREMENT PRIMARY KEY,
    category_id      INT           NOT NULL,
    name             VARCHAR(120)  NOT NULL,
    unit             VARCHAR(30)   NOT NULL,
    kg_co2_per_unit  DECIMAL(10,4) NOT NULL,
    CONSTRAINT fk_at_category FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ── 7. Activity_Log ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Activity_Log (
    activity_log_id  INT           AUTO_INCREMENT PRIMARY KEY,
    user_id          INT           NOT NULL,
    activity_type_id INT           NOT NULL,
    amount           DECIMAL(10,2) NOT NULL,
    logged_on        DATETIME      NOT NULL,
    CONSTRAINT fk_log_user FOREIGN KEY (user_id)          REFERENCES User(user_id)          ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_log_type FOREIGN KEY (activity_type_id) REFERENCES Activity_Type(activity_type_id) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ── 8. Tip ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Tip (
    tip_id      INT          AUTO_INCREMENT PRIMARY KEY,
    category_id INT          NOT NULL,
    added_by    INT          NOT NULL,
    title       VARCHAR(160) NOT NULL,
    body        TEXT         NOT NULL,
    source_url  VARCHAR(225) NULL,
    CONSTRAINT fk_tip_category FOREIGN KEY (category_id) REFERENCES Category(category_id) ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT fk_tip_added_by FOREIGN KEY (added_by)    REFERENCES User(user_id)          ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

-- ── 9. Challenge ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Challenge (
    challenge_id         INT           AUTO_INCREMENT PRIMARY KEY,
    name                 VARCHAR(160)  NOT NULL,
    description          TEXT          NULL,
    start_date           DATE          NOT NULL,
    end_date             DATE          NOT NULL,
    target_co2_reduction DECIMAL(10,2) NOT NULL DEFAULT 0.00
) ENGINE=InnoDB;

-- ── 10. Challenge_Member ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS Challenge_Member (
    challenge_id INT NOT NULL,
    user_id      INT NOT NULL,
    PRIMARY KEY (challenge_id, user_id),
    CONSTRAINT fk_cm_challenge FOREIGN KEY (challenge_id) REFERENCES Challenge(challenge_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cm_user      FOREIGN KEY (user_id)      REFERENCES User(user_id)           ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Setting (
    setting_key   VARCHAR(60) PRIMARY KEY,
    setting_value TEXT NULL
) ENGINE=InnoDB;

INSERT INTO Setting (setting_key, setting_value) VALUES
('site_name', 'GreenStep'),
('maintenance_mode', '0'),
('password_min_length', '8'),
('password_require_upper', '1'),
('password_require_number', '1')
ON DUPLICATE KEY UPDATE setting_key = setting_key;
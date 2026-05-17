-- Migration: facility_blocks (admin can block dates for internal use)

CREATE TABLE IF NOT EXISTS facility_blocks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  facilityId INT NULL,
  startDateTime DATETIME NOT NULL,
  endDateTime DATETIME NOT NULL,
  reason VARCHAR(255) NOT NULL,
  createdBy INT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (facilityId) REFERENCES facilities(id) ON DELETE CASCADE,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_blocks_facility (facilityId, startDateTime, endDateTime),
  INDEX idx_blocks_range (startDateTime, endDateTime)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

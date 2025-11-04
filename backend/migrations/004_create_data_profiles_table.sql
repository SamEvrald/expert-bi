CREATE TABLE data_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  dataset_id INT NOT NULL,
  dataset_name VARCHAR(255) NOT NULL,
  file_path VARCHAR(500),
  metadata JSON,
  profiling_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  INDEX idx_user_dataset (user_id, dataset_id),
  INDEX idx_status (profiling_status)
);

CREATE TABLE column_metadata (
  id INT AUTO_INCREMENT PRIMARY KEY,
  profile_id INT NOT NULL,
  column_name VARCHAR(255) NOT NULL,
  data_type VARCHAR(50) NOT NULL,
  null_count INT DEFAULT 0,
  unique_count INT DEFAULT 0,
  completeness DECIMAL(5,2) DEFAULT 100.00,
  min_value TEXT,
  max_value TEXT,
  mean_value DECIMAL(15,6),
  median_value DECIMAL(15,6),
  std_dev DECIMAL(15,6),
  sample_values JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (profile_id) REFERENCES data_profiles(id) ON DELETE CASCADE,
  INDEX idx_profile_column (profile_id, column_name)
);
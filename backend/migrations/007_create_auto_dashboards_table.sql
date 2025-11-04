CREATE TABLE auto_dashboards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dataset_id INT NOT NULL,
  user_id INT NOT NULL,
  dashboard_name VARCHAR(255) NOT NULL,
  dashboard_config JSON NOT NULL,
  generation_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dataset_user_dashboard (dataset_id, user_id),
  INDEX idx_generation_status (generation_status)
);

CREATE TABLE dashboard_charts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dashboard_id INT NOT NULL,
  chart_id VARCHAR(100) NOT NULL,
  chart_type VARCHAR(50) NOT NULL,
  chart_config JSON NOT NULL,
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0,
  width INT DEFAULT 6,
  height INT DEFAULT 6,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dashboard_id) REFERENCES auto_dashboards(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dashboard_chart (dashboard_id, chart_id),
  INDEX idx_chart_type (chart_type)
);

CREATE TABLE dashboard_filters (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dashboard_id INT NOT NULL,
  filter_name VARCHAR(100) NOT NULL,
  filter_type VARCHAR(50) NOT NULL,
  column_name VARCHAR(255) NOT NULL,
  filter_config JSON,
  is_global BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dashboard_id) REFERENCES auto_dashboards(id) ON DELETE CASCADE,
  INDEX idx_filter_type (filter_type)
);
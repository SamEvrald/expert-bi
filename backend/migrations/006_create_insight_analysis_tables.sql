CREATE TABLE insight_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dataset_id INT NOT NULL,
  user_id INT NOT NULL,
  analysis_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  insights_data JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dataset_user_insights (dataset_id, user_id),
  INDEX idx_status (analysis_status)
);

CREATE TABLE generated_insights (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id INT NOT NULL,
  insight_type ENUM('correlation', 'outlier', 'trend', 'driver', 'summary', 'data_quality') NOT NULL,
  priority ENUM('high', 'medium', 'low') NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  actionable_recommendation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES insight_analysis(id) ON DELETE CASCADE,
  INDEX idx_type_priority (insight_type, priority)
);

CREATE TABLE insight_correlations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id INT NOT NULL,
  column_x VARCHAR(255) NOT NULL,
  column_y VARCHAR(255) NOT NULL,
  correlation_value DECIMAL(5,3) NOT NULL,
  strength ENUM('strong', 'moderate', 'weak') NOT NULL,
  direction ENUM('positive', 'negative') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES insight_analysis(id) ON DELETE CASCADE,
  INDEX idx_correlation (correlation_value)
);

CREATE TABLE insight_trends (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id INT NOT NULL,
  date_column VARCHAR(255) NOT NULL,
  value_column VARCHAR(255) NOT NULL,
  direction ENUM('increasing', 'decreasing') NOT NULL,
  slope DECIMAL(10,6),
  change_rate DECIMAL(10,6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES insight_analysis(id) ON DELETE CASCADE,
  INDEX idx_direction (direction)
);

CREATE TABLE insight_outliers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id INT NOT NULL,
  column_name VARCHAR(255) NOT NULL,
  outlier_count INT NOT NULL,
  outlier_percentage DECIMAL(5,2),
  lower_bound DECIMAL(15,6),
  upper_bound DECIMAL(15,6),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES insight_analysis(id) ON DELETE CASCADE,
  INDEX idx_outlier_percentage (outlier_percentage)
);

CREATE TABLE insight_feature_importance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id INT NOT NULL,
  feature_column VARCHAR(255) NOT NULL,
  target_column VARCHAR(255) NOT NULL,
  importance_score DECIMAL(5,3) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES insight_analysis(id) ON DELETE CASCADE,
  INDEX idx_importance (importance_score)
);
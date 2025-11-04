CREATE TABLE semantic_analysis (
  id INT AUTO_INCREMENT PRIMARY KEY,
  dataset_id INT NOT NULL,
  user_id INT NOT NULL,
  analysis_status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dataset_user (dataset_id, user_id),
  INDEX idx_status (analysis_status)
);

CREATE TABLE column_semantic_types (
  id INT AUTO_INCREMENT PRIMARY KEY,
  analysis_id INT NOT NULL,
  column_name VARCHAR(255) NOT NULL,
  original_type VARCHAR(50) NOT NULL,
  semantic_type VARCHAR(100) NOT NULL,
  confidence DECIMAL(5,2) NOT NULL DEFAULT 0.00,
  detection_method VARCHAR(50),
  business_category VARCHAR(100),
  suggested_viz JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (analysis_id) REFERENCES semantic_analysis(id) ON DELETE CASCADE,
  UNIQUE KEY unique_analysis_column (analysis_id, column_name),
  INDEX idx_semantic_type (semantic_type),
  INDEX idx_confidence (confidence)
);
CREATE TABLE IF NOT EXISTS column_types (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dataset_id INT NOT NULL,
  column_name VARCHAR(255) NOT NULL,
  detected_type VARCHAR(50) NOT NULL,
  original_dtype VARCHAR(50),
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dataset_column (dataset_id, column_name)
);

CREATE INDEX idx_column_types_dataset ON column_types(dataset_id);
CREATE INDEX idx_column_types_type ON column_types(detected_type);
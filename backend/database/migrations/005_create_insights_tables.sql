CREATE TABLE IF NOT EXISTS insights (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dataset_id INT NOT NULL,
  user_id INT NOT NULL,
  total_count INT DEFAULT 0,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS insight_items (
  id INT PRIMARY KEY AUTO_INCREMENT,
  insight_id INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  category VARCHAR(50) NOT NULL,
  column_name VARCHAR(255),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (insight_id) REFERENCES insights(id) ON DELETE CASCADE
);

CREATE INDEX idx_insights_dataset ON insights(dataset_id);
CREATE INDEX idx_insight_items_type ON insight_items(type);
CREATE INDEX idx_insight_items_confidence ON insight_items(confidence);
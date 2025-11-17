import sys
import json
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

class AnomalyDetector:
    def __init__(self, csv_path, column_name):
        self.csv_path = csv_path
        self.column_name = column_name
        self.df = None
        
    def load_data(self):
        """Load CSV data"""
        try:
            self.df = pd.read_csv(self.csv_path)
            if self.column_name not in self.df.columns:
                raise Exception(f"Column '{self.column_name}' not found")
            return True
        except Exception as e:
            raise Exception(f"Error loading data: {str(e)}")
    
    def detect_anomalies(self):
        """Detect anomalies using multiple methods"""
        data = self.df[self.column_name].dropna()
        
        if len(data) < 10:
            raise Exception("Not enough data points for anomaly detection")
        
        # Method 1: Statistical method (Z-score)
        statistical_anomalies = self._detect_statistical_anomalies(data)
        
        # Method 2: IQR method
        iqr_anomalies = self._detect_iqr_anomalies(data)
        
        # Method 3: Isolation Forest
        isolation_anomalies = self._detect_isolation_forest_anomalies(data)
        
        # Combine results
        all_indices = set(statistical_anomalies['indices']) | \
                     set(iqr_anomalies['indices']) | \
                     set(isolation_anomalies['indices'])
        
        anomalies_list = []
        for idx in sorted(all_indices):
            value = float(data.iloc[idx])
            methods_detected = []
            
            if idx in statistical_anomalies['indices']:
                methods_detected.append('z-score')
            if idx in iqr_anomalies['indices']:
                methods_detected.append('iqr')
            if idx in isolation_anomalies['indices']:
                methods_detected.append('isolation_forest')
            
            anomalies_list.append({
                'index': int(idx),
                'value': value,
                'methods_detected': methods_detected,
                'confidence': len(methods_detected) / 3.0
            })
        
        # Sort by confidence
        anomalies_list.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            'column': self.column_name,
            'total_data_points': int(len(data)),
            'total_anomalies': len(anomalies_list),
            'anomaly_percentage': float((len(anomalies_list) / len(data)) * 100),
            'anomalies': anomalies_list[:50],  # Top 50
            'methods': {
                'statistical': statistical_anomalies['summary'],
                'iqr': iqr_anomalies['summary'],
                'isolation_forest': isolation_anomalies['summary']
            },
            'statistics': {
                'mean': float(data.mean()),
                'median': float(data.median()),
                'std': float(data.std()),
                'min': float(data.min()),
                'max': float(data.max())
            }
        }
    
    def _detect_statistical_anomalies(self, data):
        """Detect anomalies using Z-score"""
        mean = data.mean()
        std = data.std()
        
        if std == 0:
            return {'indices': [], 'summary': {'method': 'z-score', 'threshold': 3, 'count': 0}}
        
        z_scores = np.abs((data - mean) / std)
        threshold = 3
        anomaly_indices = data.index[z_scores > threshold].tolist()
        
        return {
            'indices': anomaly_indices,
            'summary': {
                'method': 'z-score',
                'threshold': threshold,
                'count': len(anomaly_indices)
            }
        }
    
    def _detect_iqr_anomalies(self, data):
        """Detect anomalies using IQR method"""
        Q1 = data.quantile(0.25)
        Q3 = data.quantile(0.75)
        IQR = Q3 - Q1
        
        lower_bound = Q1 - 1.5 * IQR
        upper_bound = Q3 + 1.5 * IQR
        
        anomaly_indices = data.index[(data < lower_bound) | (data > upper_bound)].tolist()
        
        return {
            'indices': anomaly_indices,
            'summary': {
                'method': 'iqr',
                'lower_bound': float(lower_bound),
                'upper_bound': float(upper_bound),
                'count': len(anomaly_indices)
            }
        }
    
    def _detect_isolation_forest_anomalies(self, data):
        """Detect anomalies using Isolation Forest"""
        try:
            X = data.values.reshape(-1, 1)
            
            clf = IsolationForest(
                contamination=0.1,
                random_state=42,
                n_estimators=100
            )
            
            predictions = clf.fit_predict(X)
            anomaly_indices = data.index[predictions == -1].tolist()
            
            return {
                'indices': anomaly_indices,
                'summary': {
                    'method': 'isolation_forest',
                    'contamination': 0.1,
                    'count': len(anomaly_indices)
                }
            }
        except Exception as e:
            return {
                'indices': [],
                'summary': {
                    'method': 'isolation_forest',
                    'error': str(e),
                    'count': 0
                }
            }

def main():
    try:
        if len(sys.argv) < 3:
            raise Exception("Missing arguments: csv_path, column_name")
        
        csv_path = sys.argv[1]
        column_name = sys.argv[2]
        
        detector = AnomalyDetector(csv_path, column_name)
        detector.load_data()
        result = detector.detect_anomalies()
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'column': sys.argv[2] if len(sys.argv) > 2 else None,
            'anomalies': []
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
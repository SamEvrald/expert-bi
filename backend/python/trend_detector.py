import sys
import json
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from scipy import stats
import warnings
warnings.filterwarnings('ignore')

class TrendDetector:
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
    
    def detect_trend(self):
        """Detect trend using multiple methods"""
        data = self.df[self.column_name].dropna()
        
        if len(data) < 3:
            raise Exception("Not enough data points for trend analysis")
        
        # Prepare data
        X = np.arange(len(data)).reshape(-1, 1)
        y = data.values
        
        # Linear regression
        model = LinearRegression()
        model.fit(X, y)
        
        slope = model.coef_[0]
        r_squared = model.score(X, y)
        y_pred = model.predict(X)
        
        # Calculate trend strength
        trend_strength = abs(slope) * r_squared
        
        # Determine direction
        if abs(slope) < 0.001:
            direction = 'stable'
        elif slope > 0:
            direction = 'increasing'
        else:
            direction = 'decreasing'
        
        # Calculate percentage change
        if y[0] != 0:
            percentage_change = ((y[-1] - y[0]) / abs(y[0])) * 100
        else:
            percentage_change = 0
        
        # Statistical significance test
        residuals = y - y_pred
        _, p_value = stats.ttest_1samp(residuals, 0)
        is_significant = p_value < 0.05
        
        # Detect seasonality (if enough data points)
        seasonality = None
        if len(data) >= 12:
            seasonality = self._detect_seasonality(data.values)
        
        # Detect changepoints
        changepoints = self._detect_changepoints(data.values)
        
        return {
            'column': self.column_name,
            'direction': direction,
            'slope': float(slope),
            'r_squared': float(r_squared),
            'trend_strength': float(trend_strength),
            'percentage_change': float(percentage_change),
            'is_significant': bool(is_significant),
            'p_value': float(p_value),
            'confidence': float(r_squared),
            'data_points': int(len(data)),
            'start_value': float(y[0]),
            'end_value': float(y[-1]),
            'min_value': float(y.min()),
            'max_value': float(y.max()),
            'mean_value': float(y.mean()),
            'std_value': float(y.std()),
            'seasonality': seasonality,
            'changepoints': changepoints,
            'prediction_next_3': self._predict_next_values(model, len(data), 3).tolist()
        }
    
    def _detect_seasonality(self, data):
        """Detect seasonal patterns"""
        try:
            from scipy.fft import fft, fftfreq
            
            # Remove trend
            X = np.arange(len(data)).reshape(-1, 1)
            model = LinearRegression()
            model.fit(X, data)
            trend = model.predict(X)
            detrended = data - trend
            
            # FFT analysis
            fft_vals = fft(detrended)
            fft_freq = fftfreq(len(detrended))
            
            # Find dominant frequency
            power = np.abs(fft_vals) ** 2
            idx = np.argmax(power[1:len(power)//2]) + 1
            
            if power[idx] > np.mean(power) * 10:  # Strong seasonal pattern
                period = int(1 / abs(fft_freq[idx]))
                return {
                    'detected': True,
                    'period': period,
                    'strength': float(power[idx] / np.sum(power))
                }
        except:
            pass
        
        return {'detected': False}
    
    def _detect_changepoints(self, data):
        """Detect significant changepoints in the trend"""
        changepoints = []
        
        if len(data) < 10:
            return changepoints
        
        window = 5
        for i in range(window, len(data) - window):
            before = data[i-window:i]
            after = data[i:i+window]
            
            # T-test for significant difference
            if len(before) > 0 and len(after) > 0:
                _, p_value = stats.ttest_ind(before, after)
                
                if p_value < 0.01:  # Significant change
                    change_magnitude = (np.mean(after) - np.mean(before)) / np.mean(before) * 100
                    
                    changepoints.append({
                        'index': int(i),
                        'before_mean': float(np.mean(before)),
                        'after_mean': float(np.mean(after)),
                        'change_percentage': float(change_magnitude),
                        'significance': float(1 - p_value)
                    })
        
        return changepoints[:5]  # Return top 5 changepoints
    
    def _predict_next_values(self, model, current_length, num_predictions):
        """Predict next values"""
        future_X = np.arange(current_length, current_length + num_predictions).reshape(-1, 1)
        predictions = model.predict(future_X)
        return predictions

def main():
    try:
        if len(sys.argv) < 3:
            raise Exception("Missing arguments: csv_path, column_name")
        
        csv_path = sys.argv[1]
        column_name = sys.argv[2]
        
        detector = TrendDetector(csv_path, column_name)
        detector.load_data()
        result = detector.detect_trend()
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'column': sys.argv[2] if len(sys.argv) > 2 else None
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
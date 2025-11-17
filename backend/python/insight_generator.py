import sys
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import IsolationForest
from sklearn.feature_selection import mutual_info_regression, mutual_info_classif
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from scipy.stats import pearsonr, spearmanr
import warnings
warnings.filterwarnings('ignore')

class InsightGenerator:
    def __init__(self, csv_path, dataset_id, user_id):
        self.csv_path = csv_path
        self.dataset_id = dataset_id
        self.user_id = user_id
        self.df = None
        self.insights = []
        
    def load_data(self):
        """Load CSV data"""
        try:
            self.df = pd.read_csv(self.csv_path)
            return True
        except Exception as e:
            raise Exception(f"Error loading data: {str(e)}")
    
    def detect_trends(self):
        """Detect trends in numeric columns"""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            try:
                # Skip if too many nulls
                if self.df[col].isnull().sum() > len(self.df) * 0.5:
                    continue
                
                # Prepare data
                X = np.arange(len(self.df)).reshape(-1, 1)
                y = self.df[col].fillna(self.df[col].mean()).values
                
                # Fit linear regression
                model = LinearRegression()
                model.fit(X, y)
                
                # Calculate trend
                slope = model.coef_[0]
                r2 = model.score(X, y)
                
                # Determine significance
                if abs(slope) > 0.01 and r2 > 0.5:
                    direction = 'increasing' if slope > 0 else 'decreasing'
                    percentage_change = (slope * len(self.df) / y.mean()) * 100
                    
                    self.insights.append({
                        'type': 'trend',
                        'category': 'statistical',
                        'column': col,
                        'title': f'{col} is {direction}',
                        'description': f'{col} shows a {direction} trend with {abs(percentage_change):.1f}% change over the dataset',
                        'confidence': float(r2),
                        'metadata': {
                            'slope': float(slope),
                            'direction': direction,
                            'r_squared': float(r2),
                            'percentage_change': float(percentage_change)
                        }
                    })
            except Exception as e:
                continue
    
    def detect_anomalies(self):
        """Detect anomalies using Isolation Forest"""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            try:
                # Skip if too many nulls
                if self.df[col].isnull().sum() > len(self.df) * 0.3:
                    continue
                
                # Prepare data
                data = self.df[[col]].fillna(self.df[col].mean())
                
                # Train isolation forest
                clf = IsolationForest(contamination=0.1, random_state=42)
                predictions = clf.fit_predict(data)
                
                # Count anomalies
                anomaly_count = (predictions == -1).sum()
                
                if anomaly_count > 0:
                    anomaly_indices = np.where(predictions == -1)[0]
                    anomaly_values = self.df.loc[anomaly_indices, col].values
                    
                    self.insights.append({
                        'type': 'anomaly',
                        'category': 'quality',
                        'column': col,
                        'title': f'Anomalies detected in {col}',
                        'description': f'Found {anomaly_count} unusual values in {col}',
                        'confidence': 0.8,
                        'metadata': {
                            'count': int(anomaly_count),
                            'percentage': float((anomaly_count / len(self.df)) * 100),
                            'sample_values': [float(v) for v in anomaly_values[:5].tolist()]
                        }
                    })
            except Exception as e:
                continue
    
    def find_correlations(self):
        """Find correlations between numeric columns"""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) < 2:
            return
        
        # Calculate correlation matrix
        corr_matrix = self.df[numeric_cols].corr()
        
        # Find strong correlations
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                col1, col2 = numeric_cols[i], numeric_cols[j]
                corr_value = corr_matrix.iloc[i, j]
                
                if abs(corr_value) > 0.7:
                    relationship = 'positive' if corr_value > 0 else 'negative'
                    
                    self.insights.append({
                        'type': 'correlation',
                        'category': 'relationship',
                        'column': f'{col1}, {col2}',
                        'title': f'Strong {relationship} correlation',
                        'description': f'{col1} and {col2} show a strong {relationship} correlation ({corr_value:.2f})',
                        'confidence': float(abs(corr_value)),
                        'metadata': {
                            'column1': col1,
                            'column2': col2,
                            'correlation': float(corr_value),
                            'relationship': relationship
                        }
                    })
    
    def analyze_distributions(self):
        """Analyze data distributions"""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            try:
                if self.df[col].isnull().sum() > len(self.df) * 0.3:
                    continue
                
                data = self.df[col].dropna()
                
                # Calculate statistics
                mean_val = data.mean()
                median_val = data.median()
                std_val = data.std()
                
                # Check for skewness
                skewness = data.skew()
                
                if abs(skewness) > 1:
                    skew_type = 'right-skewed' if skewness > 0 else 'left-skewed'
                    
                    self.insights.append({
                        'type': 'distribution',
                        'category': 'statistical',
                        'column': col,
                        'title': f'{col} distribution is {skew_type}',
                        'description': f'{col} shows a {skew_type} distribution with skewness of {abs(skewness):.2f}',
                        'confidence': min(abs(skewness) / 3, 1.0),
                        'metadata': {
                            'mean': float(mean_val),
                            'median': float(median_val),
                            'std': float(std_val),
                            'skewness': float(skewness)
                        }
                    })
            except Exception as e:
                continue
    
    def find_top_contributors(self):
        """Find top contributors/categories"""
        categorical_cols = self.df.select_dtypes(include=['object']).columns
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        for cat_col in categorical_cols:
            for num_col in numeric_cols:
                try:
                    # Group by category and sum
                    grouped = self.df.groupby(cat_col)[num_col].sum().sort_values(ascending=False)
                    
                    if len(grouped) > 0:
                        top_category = grouped.index[0]
                        top_value = grouped.iloc[0]
                        percentage = (top_value / grouped.sum()) * 100
                        
                        if percentage > 30:  # Significant contributor
                            self.insights.append({
                                'type': 'top_contributor',
                                'category': 'business',
                                'column': f'{cat_col}, {num_col}',
                                'title': f'{top_category} is the top contributor',
                                'description': f'{top_category} accounts for {percentage:.1f}% of total {num_col}',
                                'confidence': min(percentage / 100, 1.0),
                                'metadata': {
                                    'category_column': cat_col,
                                    'value_column': num_col,
                                    'top_category': str(top_category),
                                    'value': float(top_value),
                                    'percentage': float(percentage)
                                }
                            })
                except Exception as e:
                    continue
    
    def generate_all_insights(self):
        """Generate all insights"""
        self.detect_trends()
        self.detect_anomalies()
        self.find_correlations()
        self.analyze_distributions()
        self.find_top_contributors()
        
        # Sort by confidence
        self.insights.sort(key=lambda x: x['confidence'], reverse=True)
        
        return {
            'dataset_id': self.dataset_id,
            'user_id': self.user_id,
            'total_insights': len(self.insights),
            'insights': self.insights[:20]  # Return top 20
        }

def main():
    try:
        # Get command line arguments
        if len(sys.argv) < 4:
            raise Exception("Missing arguments: csv_path, dataset_id, user_id")
        
        csv_path = sys.argv[1]
        dataset_id = int(sys.argv[2])
        user_id = int(sys.argv[3])
        
        # Generate insights
        generator = InsightGenerator(csv_path, dataset_id, user_id)
        generator.load_data()
        result = generator.generate_all_insights()
        
        # Output JSON
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'dataset_id': int(sys.argv[2]) if len(sys.argv) > 2 else None,
            'insights': []
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
import sys
import json
import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import IsolationForest
from sklearn.feature_selection import mutual_info_regression, mutual_info_classif
from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from scipy.stats import pearsonr, spearmanr, chi2_contingency
from datetime import datetime
import warnings
import argparse

warnings.filterwarnings('ignore')

class InsightGenerator:
    def __init__(self):
        self.insights = []
        self.correlations = []
        self.outliers = []
        self.trends = []
        self.feature_importance = []
        
    def generate_insights(self, data_file, metadata_file):
        """Main method to generate all insights"""
        try:
            # Load data and metadata
            df = pd.read_csv(data_file)
            with open(metadata_file, 'r') as f:
                metadata = json.load(f)
            
            print(f"Loaded dataset with {len(df)} rows and {len(df.columns)} columns")
            
            # Generate different types of insights
            self.analyze_correlations(df, metadata)
            self.detect_outliers(df, metadata)
            self.analyze_trends(df, metadata)
            self.calculate_feature_importance(df, metadata)
            self.generate_summary_statistics(df, metadata)
            self.detect_data_quality_issues(df, metadata)
            
            return self.compile_final_insights(df, metadata)
            
        except Exception as e:
            print(f"Error generating insights: {str(e)}")
            return {"error": str(e)}
    
    def analyze_correlations(self, df, metadata):
        """Detect correlations between numerical columns"""
        numerical_cols = [col for col in df.columns if df[col].dtype in ['int64', 'float64']]
        
        if len(numerical_cols) < 2:
            return
        
        correlation_matrix = df[numerical_cols].corr()
        
        # Find strong correlations (> 0.7 or < -0.7)
        strong_correlations = []
        for i, col1 in enumerate(numerical_cols):
            for j, col2 in enumerate(numerical_cols[i+1:], i+1):
                corr_value = correlation_matrix.loc[col1, col2]
                if abs(corr_value) > 0.7:
                    strong_correlations.append({
                        'x': col1,
                        'y': col2,
                        'correlation': round(corr_value, 3),
                        'strength': 'strong' if abs(corr_value) > 0.8 else 'moderate',
                        'direction': 'positive' if corr_value > 0 else 'negative'
                    })
        
        self.correlations = strong_correlations
        
        # Generate correlation insights
        for corr in strong_correlations:
            direction = "increases" if corr['direction'] == 'positive' else "decreases"
            self.insights.append({
                'type': 'correlation',
                'priority': 'high' if abs(corr['correlation']) > 0.8 else 'medium',
                'title': f"Strong {corr['direction']} correlation between {corr['x']} and {corr['y']}",
                'description': f"When {corr['x']} increases, {corr['y']} {direction} (correlation: {corr['correlation']})",
                'actionable': f"Consider using {corr['x']} to predict {corr['y']} or investigate common underlying factors"
            })
    
    def detect_outliers(self, df, metadata):
        """Detect outliers in numerical columns"""
        numerical_cols = [col for col in df.columns if df[col].dtype in ['int64', 'float64']]
        
        for col in numerical_cols:
            if df[col].nunique() < 5:  # Skip columns with very few unique values
                continue
                
            # Use IQR method
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers = df[(df[col] < lower_bound) | (df[col] > upper_bound)]
            outlier_count = len(outliers)
            
            if outlier_count > 0:
                outlier_percentage = (outlier_count / len(df)) * 100
                
                self.outliers.append({
                    'column': col,
                    'count': outlier_count,
                    'percentage': round(outlier_percentage, 2),
                    'lower_bound': round(lower_bound, 2),
                    'upper_bound': round(upper_bound, 2)
                })
                
                if outlier_percentage > 5:  # More than 5% outliers
                    self.insights.append({
                        'type': 'outlier',
                        'priority': 'medium',
                        'title': f"High number of outliers in {col}",
                        'description': f"{outlier_count} outliers detected ({outlier_percentage:.1f}% of data)",
                        'actionable': f"Review data quality for {col} or consider outlier treatment methods"
                    })
    
    def analyze_trends(self, df, metadata):
        """Analyze trends in time-series data"""
        # Look for date columns
        date_cols = []
        for col in df.columns:
            if df[col].dtype == 'object':
                # Try to parse as datetime
                try:
                    pd.to_datetime(df[col].head(), errors='raise')
                    date_cols.append(col)
                except:
                    pass
        
        if not date_cols:
            return
        
        numerical_cols = [col for col in df.columns if df[col].dtype in ['int64', 'float64']]
        
        for date_col in date_cols:
            try:
                df_temp = df.copy()
                df_temp[date_col] = pd.to_datetime(df_temp[date_col])
                df_temp = df_temp.sort_values(date_col)
                
                for num_col in numerical_cols:
                    if len(df_temp) > 10:  # Need sufficient data points
                        # Calculate trend using linear regression
                        X = np.arange(len(df_temp)).reshape(-1, 1)
                        y = df_temp[num_col].values
                        
                        # Remove NaN values
                        mask = ~np.isnan(y)
                        if mask.sum() < 5:
                            continue
                            
                        X_clean = X[mask]
                        y_clean = y[mask]
                        
                        model = LinearRegression()
                        model.fit(X_clean, y_clean)
                        slope = model.coef_[0]
                        
                        # Determine trend significance
                        if abs(slope) > np.std(y_clean) * 0.1:  # Trend is significant
                            trend_direction = "increasing" if slope > 0 else "decreasing"
                            change_rate = abs(slope)
                            
                            self.trends.append({
                                'date_column': date_col,
                                'value_column': num_col,
                                'direction': trend_direction,
                                'slope': round(slope, 4),
                                'change_rate': round(change_rate, 4)
                            })
                            
                            self.insights.append({
                                'type': 'trend',
                                'priority': 'high',
                                'title': f"{num_col} is {trend_direction} over time",
                                'description': f"Clear {trend_direction} trend detected in {num_col} based on {date_col}",
                                'actionable': f"Monitor {num_col} trends and consider forecasting future values"
                            })
                            
            except Exception as e:
                print(f"Error analyzing trends for {date_col}: {str(e)}")
                continue
    
    def calculate_feature_importance(self, df, metadata):
        """Calculate feature importance for predicting target variables"""
        numerical_cols = [col for col in df.columns if df[col].dtype in ['int64', 'float64']]
        
        if len(numerical_cols) < 2:
            return
        
        # For each numerical column, treat it as target and others as features
        for target_col in numerical_cols:
            feature_cols = [col for col in numerical_cols if col != target_col]
            
            if len(feature_cols) == 0:
                continue
                
            try:
                # Prepare data
                X = df[feature_cols].fillna(df[feature_cols].median())
                y = df[target_col].fillna(df[target_col].median())
                
                # Calculate feature importance using Decision Tree
                dt = DecisionTreeRegressor(random_state=42, max_depth=5)
                dt.fit(X, y)
                
                importances = dt.feature_importances_
                feature_importance_list = []
                
                for i, feature in enumerate(feature_cols):
                    if importances[i] > 0.1:  # Only significant features
                        feature_importance_list.append({
                            'feature': feature,
                            'importance': round(importances[i], 3),
                            'target': target_col
                        })
                
                if feature_importance_list:
                    # Sort by importance
                    feature_importance_list.sort(key=lambda x: x['importance'], reverse=True)
                    top_feature = feature_importance_list[0]
                    
                    self.feature_importance.extend(feature_importance_list)
                    
                    self.insights.append({
                        'type': 'driver',
                        'priority': 'high',
                        'title': f"{top_feature['feature']} is a key driver of {target_col}",
                        'description': f"{top_feature['feature']} has {top_feature['importance']:.1%} importance in predicting {target_col}",
                        'actionable': f"Focus on {top_feature['feature']} to influence {target_col}"
                    })
                    
            except Exception as e:
                print(f"Error calculating feature importance for {target_col}: {str(e)}")
                continue
    
    def generate_summary_statistics(self, df, metadata):
        """Generate high-level summary insights"""
        # Data volume insights
        total_rows = len(df)
        total_cols = len(df.columns)
        
        if total_rows > 100000:
            self.insights.append({
                'type': 'summary',
                'priority': 'low',
                'title': "Large dataset detected",
                'description': f"Dataset contains {total_rows:,} rows - suitable for advanced analytics",
                'actionable': "Consider sampling for exploratory analysis to improve performance"
            })
        
        # Missing data insights
        missing_data = df.isnull().sum().sum()
        missing_percentage = (missing_data / (total_rows * total_cols)) * 100
        
        if missing_percentage > 10:
            self.insights.append({
                'type': 'data_quality',
                'priority': 'medium',
                'title': "Significant missing data detected",
                'description': f"{missing_percentage:.1f}% of data is missing",
                'actionable': "Implement data imputation strategies or investigate data collection issues"
            })
        
        # Diversity insights
        numerical_cols = [col for col in df.columns if df[col].dtype in ['int64', 'float64']]
        categorical_cols = [col for col in df.columns if df[col].dtype == 'object']
        
        self.insights.append({
            'type': 'summary',
            'priority': 'low',
            'title': "Dataset composition overview",
            'description': f"Dataset has {len(numerical_cols)} numerical and {len(categorical_cols)} categorical columns",
            'actionable': f"Good balance for mixed analytics - leverage both statistical and categorical analysis"
        })
    
    def detect_data_quality_issues(self, df, metadata):
        """Detect potential data quality issues"""
        for col in df.columns:
            # Check for duplicate values in ID-like columns
            if 'id' in col.lower() or col.lower().endswith('_id'):
                duplicates = df[col].duplicated().sum()
                if duplicates > 0:
                    self.insights.append({
                        'type': 'data_quality',
                        'priority': 'high',
                        'title': f"Duplicate IDs detected in {col}",
                        'description': f"{duplicates} duplicate values found in identifier column",
                        'actionable': f"Investigate and resolve duplicate IDs in {col}"
                    })
            
            # Check for constant values
            if df[col].nunique() == 1 and len(df) > 1:
                self.insights.append({
                    'type': 'data_quality',
                    'priority': 'medium',
                    'title': f"Constant values in {col}",
                    'description': f"Column {col} contains only one unique value",
                    'actionable': f"Consider removing {col} as it provides no variance"
                })
    
    def compile_final_insights(self, df, metadata):
        """Compile all insights into final structure"""
        # Sort insights by priority
        priority_order = {'high': 3, 'medium': 2, 'low': 1}
        self.insights.sort(key=lambda x: priority_order.get(x['priority'], 0), reverse=True)
        
        # Generate summary
        summary_parts = []
        
        if self.trends:
            trend_count = len([t for t in self.trends if t['direction'] == 'increasing'])
            summary_parts.append(f"{trend_count} increasing trends detected")
        
        if self.correlations:
            strong_corr_count = len([c for c in self.correlations if c['strength'] == 'strong'])
            summary_parts.append(f"{strong_corr_count} strong correlations found")
        
        if self.outliers:
            outlier_cols = len(self.outliers)
            summary_parts.append(f"outliers detected in {outlier_cols} columns")
        
        summary = ". ".join(summary_parts) if summary_parts else "Basic dataset analysis completed"
        
        return {
            'summary': summary,
            'insights': self.insights[:10],  # Top 10 insights
            'correlations': self.correlations,
            'outliers': self.outliers,
            'trends': self.trends,
            'feature_importance': self.feature_importance[:5],  # Top 5 drivers
            'metadata': {
                'total_insights': len(self.insights),
                'high_priority': len([i for i in self.insights if i['priority'] == 'high']),
                'analysis_timestamp': datetime.now().isoformat()
            }
        }

def main():
    parser = argparse.ArgumentParser(description='Generate insights from dataset')
    parser.add_argument('--data', required=True, help='Path to CSV data file')
    parser.add_argument('--metadata', required=True, help='Path to metadata JSON file')
    parser.add_argument('--output', required=True, help='Output JSON file for insights')
    
    args = parser.parse_args()
    
    try:
        generator = InsightGenerator()
        insights = generator.generate_insights(args.data, args.metadata)
        
        with open(args.output, 'w') as f:
            json.dump(insights, f, indent=2)
        
        print(f"Insights generated successfully. Output saved to {args.output}")
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
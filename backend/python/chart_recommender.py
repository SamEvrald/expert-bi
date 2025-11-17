import sys
import json
import pandas as pd
import numpy as np
import warnings
warnings.filterwarnings('ignore')

class ChartRecommender:
    def __init__(self, csv_path, dataset_id):
        self.csv_path = csv_path
        self.dataset_id = dataset_id
        self.df = None
        self.recommendations = []
        
    def load_data(self):
        """Load CSV data"""
        try:
            self.df = pd.read_csv(self.csv_path)
            return True
        except Exception as e:
            raise Exception(f"Error loading data: {str(e)}")
    
    def detect_column_types(self):
        """Detect column types"""
        types = {
            'numeric': [],
            'categorical': [],
            'date': [],
            'text': []
        }
        
        for col in self.df.columns:
            col_data = self.df[col].dropna()
            
            if len(col_data) == 0:
                continue
            
            # Try date
            try:
                pd.to_datetime(col_data.head(100), errors='coerce')
                parsed = pd.to_datetime(col_data, errors='coerce')
                if parsed.notna().sum() / len(col_data) > 0.8:
                    types['date'].append(col)
                    continue
            except:
                pass
            
            # Numeric
            if pd.api.types.is_numeric_dtype(self.df[col]):
                unique_ratio = len(col_data.unique()) / len(col_data)
                if unique_ratio < 0.05 and len(col_data.unique()) < 20:
                    types['categorical'].append(col)
                else:
                    types['numeric'].append(col)
            # Categorical
            else:
                unique_ratio = len(col_data.unique()) / len(col_data)
                if unique_ratio < 0.5:
                    types['categorical'].append(col)
                else:
                    types['text'].append(col)
        
        return types
    
    def recommend_time_series_charts(self, types):
        """Recommend time series charts"""
        if types['date'] and types['numeric']:
            for date_col in types['date']:
                for num_col in types['numeric']:
                    # Line chart for trends
                    self.recommendations.append({
                        'chart_type': 'line',
                        'priority': 10,
                        'confidence': 0.95,
                        'title': f'{num_col} over time',
                        'reason': 'Time series data detected - perfect for trend analysis',
                        'config': {
                            'x_axis': date_col,
                            'y_axis': num_col,
                            'aggregation': 'sum',
                            'show_trend_line': True
                        },
                        'use_case': 'Track changes and identify trends over time'
                    })
                    
                    # Area chart for cumulative view
                    self.recommendations.append({
                        'chart_type': 'area',
                        'priority': 8,
                        'confidence': 0.85,
                        'title': f'{num_col} accumulation over time',
                        'reason': 'Area charts show cumulative trends effectively',
                        'config': {
                            'x_axis': date_col,
                            'y_axis': num_col,
                            'aggregation': 'sum'
                        },
                        'use_case': 'Visualize cumulative totals and volume'
                    })
    
    def recommend_category_comparison_charts(self, types):
        """Recommend category comparison charts"""
        if types['categorical'] and types['numeric']:
            for cat_col in types['categorical']:
                for num_col in types['numeric']:
                    cat_unique = self.df[cat_col].nunique()
                    
                    # Bar chart for comparison
                    if cat_unique <= 20:
                        self.recommendations.append({
                            'chart_type': 'bar',
                            'priority': 9,
                            'confidence': 0.9,
                            'title': f'{num_col} by {cat_col}',
                            'reason': f'{cat_col} has {cat_unique} categories - ideal for bar chart comparison',
                            'config': {
                                'x_axis': cat_col,
                                'y_axis': num_col,
                                'aggregation': 'sum',
                                'sort_order': 'desc'
                            },
                            'use_case': 'Compare values across different categories'
                        })
                    
                    # Pie chart for distribution
                    if cat_unique <= 10:
                        self.recommendations.append({
                            'chart_type': 'pie',
                            'priority': 7,
                            'confidence': 0.8,
                            'title': f'{num_col} distribution by {cat_col}',
                            'reason': f'Few categories ({cat_unique}) - good for showing proportions',
                            'config': {
                                'category': cat_col,
                                'value': num_col,
                                'aggregation': 'sum'
                            },
                            'use_case': 'Show percentage breakdown of total'
                        })
    
    def recommend_distribution_charts(self, types):
        """Recommend distribution analysis charts"""
        for num_col in types['numeric']:
            data = self.df[num_col].dropna()
            
            if len(data) > 0:
                # Histogram for distribution
                self.recommendations.append({
                    'chart_type': 'histogram',
                    'priority': 6,
                    'confidence': 0.75,
                    'title': f'{num_col} distribution',
                    'reason': 'Histogram shows the frequency distribution of values',
                    'config': {
                        'column': num_col,
                        'bins': 20
                    },
                    'use_case': 'Understand data spread and identify patterns'
                })
    
    def recommend_multi_dimensional_charts(self, types):
        """Recommend charts for multi-dimensional analysis"""
        if len(types['categorical']) >= 2 and types['numeric']:
            cat1, cat2 = types['categorical'][:2]
            num_col = types['numeric'][0]
            
            # Grouped bar chart
            if self.df[cat1].nunique() <= 10 and self.df[cat2].nunique() <= 5:
                self.recommendations.append({
                    'chart_type': 'bar',
                    'priority': 8,
                    'confidence': 0.85,
                    'title': f'{num_col} by {cat1} and {cat2}',
                    'reason': 'Multiple categories allow for grouped comparison',
                    'config': {
                        'x_axis': cat1,
                        'y_axis': num_col,
                        'group_by': cat2,
                        'aggregation': 'sum'
                    },
                    'use_case': 'Compare values across multiple dimensions'
                })
    
    def recommend_correlation_charts(self, types):
        """Recommend correlation analysis charts"""
        if len(types['numeric']) >= 2:
            # Calculate correlations
            numeric_df = self.df[types['numeric']].corr()
            
            for i in range(len(types['numeric'])):
                for j in range(i+1, len(types['numeric'])):
                    col1 = types['numeric'][i]
                    col2 = types['numeric'][j]
                    corr_value = numeric_df.iloc[i, j]
                    
                    if abs(corr_value) > 0.5:
                        self.recommendations.append({
                            'chart_type': 'scatter',
                            'priority': 7,
                            'confidence': float(abs(corr_value)),
                            'title': f'{col1} vs {col2}',
                            'reason': f'Strong correlation detected ({corr_value:.2f})',
                            'config': {
                                'x_axis': col1,
                                'y_axis': col2,
                                'show_trend_line': True
                            },
                            'use_case': 'Analyze relationship between two variables'
                        })
    
    def recommend_kpi_cards(self, types):
        """Recommend KPI cards for key metrics"""
        for num_col in types['numeric'][:5]:  # Top 5 numeric columns
            data = self.df[num_col].dropna()
            
            if len(data) > 0:
                self.recommendations.append({
                    'chart_type': 'kpi',
                    'priority': 5,
                    'confidence': 0.7,
                    'title': f'{num_col} summary',
                    'reason': 'Key metric that should be highlighted',
                    'config': {
                        'column': num_col,
                        'aggregation': 'sum',
                        'show_trend': True
                    },
                    'use_case': 'Display important metrics at a glance',
                    'metrics': {
                        'total': float(data.sum()),
                        'average': float(data.mean()),
                        'max': float(data.max()),
                        'min': float(data.min())
                    }
                })
    
    def generate_recommendations(self):
        """Generate all chart recommendations"""
        types = self.detect_column_types()
        
        self.recommend_time_series_charts(types)
        self.recommend_category_comparison_charts(types)
        self.recommend_distribution_charts(types)
        self.recommend_multi_dimensional_charts(types)
        self.recommend_correlation_charts(types)
        self.recommend_kpi_cards(types)
        
        # Sort by priority and confidence
        self.recommendations.sort(
            key=lambda x: (x['priority'], x['confidence']),
            reverse=True
        )
        
        return {
            'dataset_id': self.dataset_id,
            'total_recommendations': len(self.recommendations),
            'recommendations': self.recommendations[:15],  # Top 15
            'column_types': types
        }

def main():
    try:
        if len(sys.argv) < 3:
            raise Exception("Missing arguments: csv_path, dataset_id")
        
        csv_path = sys.argv[1]
        dataset_id = int(sys.argv[2])
        
        recommender = ChartRecommender(csv_path, dataset_id)
        recommender.load_data()
        result = recommender.generate_recommendations()
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'dataset_id': int(sys.argv[2]) if len(sys.argv) > 2 else None,
            'recommendations': []
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
import sys
import json
import pandas as pd
import numpy as np
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class DataProfiler:
    def __init__(self, csv_path, dataset_id):
        self.csv_path = csv_path
        self.dataset_id = dataset_id
        self.df = None
        self.profile = {}
        
    def load_data(self):
        """Load CSV data"""
        try:
            self.df = pd.read_csv(self.csv_path)
            return True
        except Exception as e:
            raise Exception(f"Error loading data: {str(e)}")
    
    def detect_column_types(self):
        """Detect column types with advanced logic"""
        column_types = {}
        
        for col in self.df.columns:
            col_data = self.df[col].dropna()
            
            if len(col_data) == 0:
                column_types[col] = 'empty'
                continue
            
            # Try to detect date columns
            if self._is_date_column(col_data):
                column_types[col] = 'date'
            # Check if numeric
            elif pd.api.types.is_numeric_dtype(self.df[col]):
                # Check if it's actually categorical (few unique values)
                unique_ratio = len(col_data.unique()) / len(col_data)
                if unique_ratio < 0.05 and len(col_data.unique()) < 20:
                    column_types[col] = 'categorical'
                elif self._is_id_column(col, col_data):
                    column_types[col] = 'id'
                else:
                    column_types[col] = 'numeric'
            # Check if boolean
            elif self._is_boolean_column(col_data):
                column_types[col] = 'boolean'
            # Check if categorical
            else:
                unique_ratio = len(col_data.unique()) / len(col_data)
                if unique_ratio < 0.5:
                    column_types[col] = 'categorical'
                else:
                    column_types[col] = 'text'
        
        return column_types
    
    def _is_date_column(self, col_data):
        """Check if column contains dates"""
        try:
            # Try parsing sample
            sample = col_data.head(100)
            parsed = pd.to_datetime(sample, errors='coerce')
            valid_dates = parsed.notna().sum()
            return valid_dates / len(sample) > 0.8
        except:
            return False
    
    def _is_boolean_column(self, col_data):
        """Check if column is boolean"""
        unique_values = set(col_data.astype(str).str.lower().unique())
        bool_values = {'true', 'false', 'yes', 'no', '1', '0', 't', 'f', 'y', 'n'}
        return len(unique_values) <= 2 and unique_values.issubset(bool_values)
    
    def _is_id_column(self, col_name, col_data):
        """Check if column is an ID column"""
        col_lower = col_name.lower()
        if 'id' in col_lower or 'key' in col_lower:
            # Check if values are unique
            if len(col_data.unique()) / len(col_data) > 0.95:
                return True
        return False
    
    def analyze_numeric_columns(self, column_types):
        """Analyze numeric columns with statistical methods"""
        numeric_analysis = {}
        
        for col, col_type in column_types.items():
            if col_type == 'numeric':
                try:
                    data = self.df[col].dropna()
                    
                    numeric_analysis[col] = {
                        'mean': float(data.mean()),
                        'median': float(data.median()),
                        'std': float(data.std()),
                        'min': float(data.min()),
                        'max': float(data.max()),
                        'q25': float(data.quantile(0.25)),
                        'q75': float(data.quantile(0.75)),
                        'skewness': float(data.skew()),
                        'kurtosis': float(data.kurtosis()),
                        'null_count': int(self.df[col].isnull().sum()),
                        'null_percentage': float((self.df[col].isnull().sum() / len(self.df)) * 100),
                        'unique_count': int(data.nunique()),
                        'zeros_count': int((data == 0).sum()),
                        'negative_count': int((data < 0).sum()),
                        'positive_count': int((data > 0).sum())
                    }
                    
                    # Detect outliers using IQR method
                    Q1 = data.quantile(0.25)
                    Q3 = data.quantile(0.75)
                    IQR = Q3 - Q1
                    outliers = data[(data < Q1 - 1.5 * IQR) | (data > Q3 + 1.5 * IQR)]
                    
                    numeric_analysis[col]['outlier_count'] = int(len(outliers))
                    numeric_analysis[col]['outlier_percentage'] = float((len(outliers) / len(data)) * 100)
                    
                except Exception as e:
                    numeric_analysis[col] = {'error': str(e)}
        
        return numeric_analysis
    
    def analyze_categorical_columns(self, column_types):
        """Analyze categorical columns"""
        categorical_analysis = {}
        
        for col, col_type in column_types.items():
            if col_type == 'categorical':
                try:
                    data = self.df[col].dropna()
                    value_counts = data.value_counts()
                    
                    categorical_analysis[col] = {
                        'unique_count': int(data.nunique()),
                        'most_frequent': str(value_counts.index[0]),
                        'most_frequent_count': int(value_counts.iloc[0]),
                        'most_frequent_percentage': float((value_counts.iloc[0] / len(data)) * 100),
                        'least_frequent': str(value_counts.index[-1]),
                        'least_frequent_count': int(value_counts.iloc[-1]),
                        'null_count': int(self.df[col].isnull().sum()),
                        'null_percentage': float((self.df[col].isnull().sum() / len(self.df)) * 100),
                        'top_5_values': [
                            {
                                'value': str(val),
                                'count': int(count),
                                'percentage': float((count / len(data)) * 100)
                            }
                            for val, count in value_counts.head(5).items()
                        ]
                    }
                    
                except Exception as e:
                    categorical_analysis[col] = {'error': str(e)}
        
        return categorical_analysis
    
    def analyze_date_columns(self, column_types):
        """Analyze date columns"""
        date_analysis = {}
        
        for col, col_type in column_types.items():
            if col_type == 'date':
                try:
                    dates = pd.to_datetime(self.df[col], errors='coerce')
                    valid_dates = dates.dropna()
                    
                    if len(valid_dates) > 0:
                        date_analysis[col] = {
                            'min_date': valid_dates.min().isoformat(),
                            'max_date': valid_dates.max().isoformat(),
                            'date_range_days': int((valid_dates.max() - valid_dates.min()).days),
                            'null_count': int(dates.isnull().sum()),
                            'null_percentage': float((dates.isnull().sum() / len(dates)) * 100),
                            'unique_count': int(valid_dates.nunique())
                        }
                        
                        # Analyze time patterns
                        date_analysis[col]['year_range'] = f"{valid_dates.min().year} - {valid_dates.max().year}"
                        date_analysis[col]['most_common_year'] = int(valid_dates.dt.year.mode().iloc[0])
                        date_analysis[col]['most_common_month'] = int(valid_dates.dt.month.mode().iloc[0])
                        
                except Exception as e:
                    date_analysis[col] = {'error': str(e)}
        
        return date_analysis
    
    def calculate_data_quality_score(self):
        """Calculate overall data quality score"""
        total_cells = len(self.df) * len(self.df.columns)
        null_cells = self.df.isnull().sum().sum()
        completeness = ((total_cells - null_cells) / total_cells) * 100
        
        # Check for duplicates
        duplicate_rows = self.df.duplicated().sum()
        uniqueness = ((len(self.df) - duplicate_rows) / len(self.df)) * 100
        
        # Overall quality score (weighted average)
        quality_score = (completeness * 0.6 + uniqueness * 0.4)
        
        return {
            'overall_score': round(quality_score, 2),
            'completeness': round(completeness, 2),
            'uniqueness': round(uniqueness, 2),
            'total_cells': int(total_cells),
            'null_cells': int(null_cells),
            'duplicate_rows': int(duplicate_rows)
        }
    
    def generate_profile(self):
        """Generate complete data profile"""
        column_types = self.detect_column_types()
        
        self.profile = {
            'dataset_id': self.dataset_id,
            'row_count': int(len(self.df)),
            'column_count': int(len(self.df.columns)),
            'total_size_bytes': int(self.df.memory_usage(deep=True).sum()),
            'column_types': column_types,
            'type_distribution': {
                col_type: int(list(column_types.values()).count(col_type))
                for col_type in set(column_types.values())
            },
            'numeric_analysis': self.analyze_numeric_columns(column_types),
            'categorical_analysis': self.analyze_categorical_columns(column_types),
            'date_analysis': self.analyze_date_columns(column_types),
            'data_quality': self.calculate_data_quality_score(),
            'column_list': list(self.df.columns)
        }
        
        return self.profile

def main():
    try:
        if len(sys.argv) < 3:
            raise Exception("Missing arguments: csv_path, dataset_id")
        
        csv_path = sys.argv[1]
        dataset_id = int(sys.argv[2])
        
        profiler = DataProfiler(csv_path, dataset_id)
        profiler.load_data()
        result = profiler.generate_profile()
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'dataset_id': int(sys.argv[2]) if len(sys.argv) > 2 else None
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
import pandas as pd
import numpy as np
from typing import List, Dict, Any
from datetime import datetime


class InsightsGenerator:
    """Generate insights from dataset analysis"""
    
    def __init__(self, df: pd.DataFrame):
        self.df = df
        self.insights = []
    
    def generate_all_insights(self) -> List[Dict[str, Any]]:
        """Generate all types of insights"""
        self.insights = []
        
        self._detect_missing_values()
        self._detect_outliers()
        self._detect_correlations()
        self._detect_distributions()
        self._detect_unique_values()
        
        return self.insights
    
    def _detect_missing_values(self):
        """Detect columns with missing values"""
        for col in self.df.columns:
            null_count = self.df[col].isnull().sum()
            if null_count > 0:
                null_pct = (null_count / len(self.df)) * 100
                self.insights.append({
                    "type": "missing_data",
                    "category": "quality",
                    "title": f"Missing Values in {col}",
                    "description": f"Column '{col}' has {null_count:,} missing values ({null_pct:.1f}% of data)",
                    "confidence": 1.0,
                    "importance": min(null_pct / 10, 1.0),
                    "column_name": col,
                    "metadata": {
                        "null_count": int(null_count),
                        "null_percentage": round(null_pct, 2),
                        "total_rows": len(self.df)
                    }
                })
    
    def _detect_outliers(self):
        """Detect outliers in numerical columns"""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if self.df[col].isnull().all():
                continue
                
            Q1 = self.df[col].quantile(0.25)
            Q3 = self.df[col].quantile(0.75)
            IQR = Q3 - Q1
            
            lower_bound = Q1 - 1.5 * IQR
            upper_bound = Q3 + 1.5 * IQR
            
            outliers = self.df[(self.df[col] < lower_bound) | (self.df[col] > upper_bound)]
            
            if len(outliers) > 0:
                outlier_pct = (len(outliers) / len(self.df)) * 100
                self.insights.append({
                    "type": "outlier",
                    "category": "anomaly",
                    "title": f"Outliers Detected in {col}",
                    "description": f"Found {len(outliers)} outliers ({outlier_pct:.1f}%) in '{col}' outside range [{lower_bound:.2f}, {upper_bound:.2f}]",
                    "confidence": 0.8,
                    "importance": min(outlier_pct / 5, 1.0),
                    "column_name": col,
                    "metadata": {
                        "outlier_count": len(outliers),
                        "outlier_percentage": round(outlier_pct, 2),
                        "lower_bound": float(lower_bound),
                        "upper_bound": float(upper_bound),
                        "mean": float(self.df[col].mean()),
                        "median": float(self.df[col].median())
                    }
                })
    
    def _detect_correlations(self):
        """Detect strong correlations between numerical columns"""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        if len(numeric_cols) < 2:
            return
        
        corr_matrix = self.df[numeric_cols].corr()
        
        for i in range(len(corr_matrix.columns)):
            for j in range(i + 1, len(corr_matrix.columns)):
                col1 = corr_matrix.columns[i]
                col2 = corr_matrix.columns[j]
                corr_value = corr_matrix.iloc[i, j]
                
                if abs(corr_value) > 0.7 and not np.isnan(corr_value):
                    correlation_type = "positive" if corr_value > 0 else "negative"
                    self.insights.append({
                        "type": "correlation",
                        "category": "relationship",
                        "title": f"Strong {correlation_type.capitalize()} Correlation",
                        "description": f"'{col1}' and '{col2}' show a {correlation_type} correlation of {corr_value:.2f}",
                        "confidence": abs(corr_value),
                        "importance": abs(corr_value),
                        "related_columns": [col1, col2],
                        "metadata": {
                            "correlation_value": float(corr_value),
                            "correlation_type": correlation_type
                        }
                    })
    
    def _detect_distributions(self):
        """Detect distribution patterns in numerical columns"""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns
        
        for col in numeric_cols:
            if self.df[col].isnull().all():
                continue
            
            skewness = self.df[col].skew()
            
            if abs(skewness) > 1:
                skew_type = "right-skewed" if skewness > 0 else "left-skewed"
                self.insights.append({
                    "type": "distribution",
                    "category": "pattern",
                    "title": f"{col} is {skew_type.capitalize()}",
                    "description": f"Column '{col}' shows a {skew_type} distribution (skewness: {skewness:.2f})",
                    "confidence": min(abs(skewness) / 3, 1.0),
                    "importance": min(abs(skewness) / 5, 1.0),
                    "column_name": col,
                    "metadata": {
                        "skewness": float(skewness),
                        "mean": float(self.df[col].mean()),
                        "median": float(self.df[col].median()),
                        "std": float(self.df[col].std())
                    }
                })
    
    def _detect_unique_values(self):
        """Detect columns with unique or limited values"""
        for col in self.df.columns:
            unique_count = self.df[col].nunique()
            total_count = len(self.df)
            
            # Check if column is potentially a unique identifier
            if unique_count == total_count and total_count > 1:
                self.insights.append({
                    "type": "unique_identifier",
                    "category": "structure",
                    "title": f"{col} is a Unique Identifier",
                    "description": f"Column '{col}' has unique values for all rows - likely an ID column",
                    "confidence": 1.0,
                    "importance": 0.3,
                    "column_name": col,
                    "metadata": {
                        "unique_count": int(unique_count),
                        "total_count": int(total_count)
                    }
                })
            
            # Check for low cardinality (categorical-like columns)
            elif unique_count < 20 and unique_count > 1:
                value_counts = self.df[col].value_counts().to_dict()
                self.insights.append({
                    "type": "categorical",
                    "category": "structure",
                    "title": f"{col} is Categorical",
                    "description": f"Column '{col}' has {unique_count} unique values - might be categorical",
                    "confidence": 0.7,
                    "importance": 0.4,
                    "column_name": col,
                    "metadata": {
                        "unique_count": int(unique_count),
                        "value_distribution": {str(k): int(v) for k, v in list(value_counts.items())[:10]}
                    }
                })
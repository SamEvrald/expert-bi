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
import random

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


class NaturalLanguageSummarizer:
    """Generate natural language summaries from insights and data"""
    
    def __init__(self):
        self.templates = {
            'overview': [
                "Your dataset contains {total_rows:,} records with {total_columns} columns.",
                "The data spans {total_rows:,} observations across {total_columns} different variables.",
                "This dataset comprises {total_rows:,} rows and {total_columns} columns of information."
            ],
            'data_quality': [
                "The overall data quality is {quality_level} with {completeness:.1f}% completeness.",
                "Data completeness stands at {completeness:.1f}%, indicating {quality_assessment}.",
                "With {completeness:.1f}% complete data, the dataset shows {quality_level} quality."
            ],
            'correlation_positive': [
                "There's a strong positive relationship between {x} and {y} (correlation: {correlation:.2f}), meaning as {x} increases, {y} tends to increase as well.",
                "A notable positive correlation exists between {x} and {y} ({correlation:.2f}), suggesting they move in the same direction.",
                "{x} and {y} show a strong positive association ({correlation:.2f}), indicating they're closely related."
            ],
            'correlation_negative': [
                "There's a strong negative relationship between {x} and {y} (correlation: {correlation:.2f}), meaning as {x} increases, {y} tends to decrease.",
                "A significant negative correlation exists between {x} and {y} ({correlation:.2f}), suggesting they move in opposite directions.",
                "{x} and {y} show an inverse relationship ({correlation:.2f}), where one decreases as the other increases."
            ],
            'trend_increasing': [
                "{column} shows a clear upward trend over time, increasing at a rate of {change_rate:.2f} units per period.",
                "There's a consistent growth pattern in {column}, with values trending upward.",
                "{column} demonstrates positive momentum, steadily increasing throughout the time period."
            ],
            'trend_decreasing': [
                "{column} shows a declining trend over time, decreasing at a rate of {change_rate:.2f} units per period.",
                "There's a downward pattern in {column}, with values consistently decreasing.",
                "{column} demonstrates negative momentum, steadily declining throughout the time period."
            ],
            'outlier_detection': [
                "{column} contains {count} outliers ({percentage:.1f}% of data), which may indicate data quality issues or exceptional cases.",
                "Unusual values were detected in {column} - {count} outliers representing {percentage:.1f}% of the data.",
                "{column} shows {count} anomalous values ({percentage:.1f}%), worth investigating further."
            ],
            'key_driver': [
                "{feature} is the most important factor influencing {target}, with {importance:.1%} predictive power.",
                "The primary driver of {target} appears to be {feature}, accounting for {importance:.1%} of the variation.",
                "{feature} emerges as the key predictor of {target}, explaining {importance:.1%} of the outcomes."
            ]
        }

    def generate_summary(self, data_file, insights_file, semantic_file):
        """Generate comprehensive natural language summary"""
        try:
            # Load all data sources
            insights = self.load_insights(insights_file)
            semantic_data = self.load_semantic_data(semantic_file)
            dataset_stats = self.analyze_dataset_basic_stats(data_file)
            
            # Generate different summary sections
            summary = {
                'executive_summary': self.generate_executive_summary(insights, dataset_stats),
                'data_overview': self.generate_data_overview(dataset_stats, semantic_data),
                'key_findings': self.generate_key_findings(insights),
                'detailed_insights': self.generate_detailed_insights(insights),
                'recommendations': self.generate_recommendations(insights, semantic_data),
                'data_quality_assessment': self.generate_data_quality_summary(insights, dataset_stats),
                'conversation_starters': self.generate_conversation_starters(insights),
                'methodology_notes': self.generate_methodology_notes(),
                'summary_metadata': {
                    'generated_at': datetime.now().isoformat(),
                    'total_insights': len(insights.get('insights', [])),
                    'confidence_level': self.calculate_overall_confidence(insights)
                }
            }
            
            return summary
            
        except Exception as e:
            return {'error': f"Failed to generate summary: {str(e)}"}

    def load_insights(self, insights_file):
        """Load insights data from JSON file"""
        try:
            with open(insights_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading insights: {e}")
            return {}

    def load_semantic_data(self, semantic_file):
        """Load semantic analysis data"""
        try:
            with open(semantic_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            print(f"Error loading semantic data: {e}")
            return {}

    def analyze_dataset_basic_stats(self, data_file):
        """Analyze basic dataset statistics"""
        try:
            df = pd.read_csv(data_file)
            
            return {
                'total_rows': len(df),
                'total_columns': len(df.columns),
                'missing_values': df.isnull().sum().sum(),
                'completeness': ((df.size - df.isnull().sum().sum()) / df.size) * 100,
                'numeric_columns': len(df.select_dtypes(include=[np.number]).columns),
                'categorical_columns': len(df.select_dtypes(include=['object']).columns),
                'file_size_mb': round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2)
            }
        except Exception as e:
            print(f"Error analyzing dataset: {e}")
            return {}

    def generate_executive_summary(self, insights, stats):
        """Generate high-level executive summary"""
        summary_parts = []
        
        # Dataset overview
        if stats:
            overview = self.select_template('overview').format(
                total_rows=stats.get('total_rows', 0),
                total_columns=stats.get('total_columns', 0)
            )
            summary_parts.append(overview)
        
        # Key findings count
        high_priority_count = len([i for i in insights.get('insights', []) if i.get('priority') == 'high'])
        if high_priority_count > 0:
            summary_parts.append(f"Analysis revealed {high_priority_count} critical insights requiring immediate attention.")
        
        # Top insight
        top_insights = [i for i in insights.get('insights', []) if i.get('priority') == 'high']
        if top_insights:
            summary_parts.append(f"Most notably, {top_insights[0].get('description', 'significant patterns were detected')}.")
        
        # Correlations summary
        correlations = insights.get('correlations', [])
        if correlations:
            strong_corr = [c for c in correlations if abs(c.get('correlation', 0)) > 0.8]
            if strong_corr:
                summary_parts.append(f"The data shows {len(strong_corr)} strong relationship{'s' if len(strong_corr) > 1 else ''} between variables.")
        
        # Data quality
        if stats and 'completeness' in stats:
            quality_level = self.assess_quality_level(stats['completeness'])
            quality_summary = self.select_template('data_quality').format(
                quality_level=quality_level,
                completeness=stats['completeness'],
                quality_assessment=self.get_quality_assessment(stats['completeness'])
            )
            summary_parts.append(quality_summary)
        
        return ' '.join(summary_parts)

    def generate_data_overview(self, stats, semantic_data):
        """Generate data overview section"""
        overview_parts = []
        
        if stats:
            # Basic composition
            overview_parts.append(
                f"The dataset contains {stats.get('total_rows', 0):,} records across "
                f"{stats.get('total_columns', 0)} columns, with {stats.get('numeric_columns', 0)} "
                f"numerical and {stats.get('categorical_columns', 0)} categorical variables."
            )
            
            # Data size
            if stats.get('file_size_mb'):
                overview_parts.append(f"The dataset size is approximately {stats['file_size_mb']} MB.")
            
            # Missing data
            if stats.get('missing_values', 0) > 0:
                missing_pct = (stats['missing_values'] / (stats['total_rows'] * stats['total_columns'])) * 100
                overview_parts.append(
                    f"There are {stats['missing_values']:,} missing values "
                    f"({missing_pct:.1f}% of total data points)."
                )
        
        # Semantic composition
        semantic_summary = self.summarize_semantic_types(semantic_data)
        if semantic_summary:
            overview_parts.append(semantic_summary)
        
        return ' '.join(overview_parts)

    def generate_key_findings(self, insights):
        """Generate list of key findings"""
        findings = []
        
        # High priority insights
        high_priority = [i for i in insights.get('insights', []) if i.get('priority') == 'high']
        for insight in high_priority[:5]:  # Top 5
            finding = f"**{insight.get('title', 'Key Finding')}**: {insight.get('description', '')}"
            findings.append(finding)
        
        # Strong correlations
        strong_correlations = [c for c in insights.get('correlations', []) if abs(c.get('correlation', 0)) > 0.7]
        for corr in strong_correlations[:3]:  # Top 3
            direction = 'positive' if corr.get('correlation', 0) > 0 else 'negative'
            template = self.select_template(f'correlation_{direction}')
            finding = template.format(
                x=corr.get('x', ''),
                y=corr.get('y', ''),
                correlation=corr.get('correlation', 0)
            )
            findings.append(f"**Strong Correlation**: {finding}")
        
        # Significant trends
        for trend in insights.get('trends', [])[:2]:  # Top 2
            template = self.select_template(f"trend_{trend.get('direction', 'increasing')}")
            finding = template.format(
                column=trend.get('value_column', ''),
                change_rate=abs(trend.get('change_rate', 0))
            )
            findings.append(f"**Trend Analysis**: {finding}")
        
        return findings

    def generate_detailed_insights(self, insights):
        """Generate detailed insights by category"""
        detailed = {
            'correlations': [],
            'trends': [],
            'outliers': [],
            'drivers': [],
            'quality_issues': []
        }
        
        # Process correlations
        for corr in insights.get('correlations', []):
            direction = 'positive' if corr.get('correlation', 0) > 0 else 'negative'
            
            explanation = self.select_template(f'correlation_{direction}').format(
                x=corr.get('x', ''),
                y=corr.get('y', ''),
                correlation=corr.get('correlation', 0)
            )
            
            business_impact = self.generate_business_impact(corr, 'correlation')
            detailed['correlations'].append(f"{explanation} {business_impact}")
        
        # Process trends
        for trend in insights.get('trends', []):
            explanation = self.select_template(f"trend_{trend.get('direction', 'increasing')}").format(
                column=trend.get('value_column', ''),
                change_rate=abs(trend.get('change_rate', 0))
            )
            
            business_impact = self.generate_business_impact(trend, 'trend')
            detailed['trends'].append(f"{explanation} {business_impact}")
        
        # Process outliers
        for outlier in insights.get('outliers', []):
            explanation = self.select_template('outlier_detection').format(
                column=outlier.get('column', ''),
                count=outlier.get('count', 0),
                percentage=outlier.get('percentage', 0)
            )
            
            business_impact = self.generate_business_impact(outlier, 'outlier')
            detailed['outliers'].append(f"{explanation} {business_impact}")
        
        # Process feature importance
        for driver in insights.get('feature_importance', []):
            explanation = self.select_template('key_driver').format(
                feature=driver.get('feature', ''),
                target=driver.get('target', ''),
                importance=driver.get('importance', 0)
            )
            
            business_impact = self.generate_business_impact(driver, 'driver')
            detailed['drivers'].append(f"{explanation} {business_impact}")
        
        # Process data quality issues
        quality_insights = [i for i in insights.get('insights', []) if i.get('type') == 'data_quality']
        for issue in quality_insights:
            detailed['quality_issues'].append(
                f"**{issue.get('title', '')}**: {issue.get('description', '')} "
                f"Recommendation: {issue.get('actionable', '')}"
            )
        
        return detailed

    def generate_recommendations(self, insights, semantic_data):
        """Generate actionable recommendations"""
        recommendations = []
        
        # Data quality recommendations
        quality_issues = [i for i in insights.get('insights', []) if i.get('type') == 'data_quality']
        if quality_issues:
            recommendations.append(
                "**Data Quality**: Address data quality issues by implementing validation rules and "
                "data cleansing procedures to improve completeness and accuracy."
            )
        
        # Analysis recommendations
        high_corr_count = len([c for c in insights.get('correlations', []) if abs(c.get('correlation', 0)) > 0.8])
        if high_corr_count > 0:
            recommendations.append(
                f"**Predictive Modeling**: With {high_corr_count} strong correlation{'s' if high_corr_count > 1 else ''} "
                "identified, consider building predictive models to leverage these relationships."
            )
        
        # Trend recommendations
        if insights.get('trends'):
            recommendations.append(
                "**Forecasting**: The identified trends suggest implementing time-series forecasting "
                "to predict future values and support strategic planning."
            )
        
        # Outlier recommendations
        significant_outliers = [o for o in insights.get('outliers', []) if o.get('percentage', 0) > 5]
        if significant_outliers:
            recommendations.append(
                "**Outlier Management**: Investigate and address significant outliers through "
                "improved data collection processes or outlier detection systems."
            )
        
        # Feature importance recommendations
        if insights.get('feature_importance'):
            top_driver = insights['feature_importance'][0]
            recommendations.append(
                f"**Focus Areas**: Prioritize {top_driver.get('feature', 'key drivers')} as it shows "
                "the highest predictive power for business outcomes."
            )
        
        return recommendations

    def generate_data_quality_summary(self, insights, stats):
        """Generate data quality assessment summary"""
        quality_parts = []
        
        if stats and 'completeness' in stats:
            completeness = stats['completeness']
            quality_level = self.assess_quality_level(completeness)
            
            quality_parts.append(
                f"Overall data completeness is {completeness:.1f}%, indicating {quality_level} quality."
            )
            
            if completeness < 90:
                quality_parts.append(
                    "Consider implementing data validation and collection improvements to reduce missing values."
                )
        
        # Quality-related insights
        quality_insights = [i for i in insights.get('insights', []) if i.get('type') == 'data_quality']
        if quality_insights:
            quality_parts.append(
                f"Identified {len(quality_insights)} specific data quality issue{'s' if len(quality_insights) > 1 else ''} "
                "that require attention."
            )
        
        # Outlier assessment
        outlier_columns = len(insights.get('outliers', []))
        if outlier_columns > 0:
            quality_parts.append(
                f"Outliers detected in {outlier_columns} column{'s' if outlier_columns > 1 else ''}, "
                "which may indicate data entry errors or legitimate edge cases."
            )
        
        return ' '.join(quality_parts) if quality_parts else "Data quality assessment completed with no major issues identified."

    def generate_conversation_starters(self, insights):
        """Generate questions for further exploration"""
        questions = []
        
        # Correlation-based questions
        if insights.get('correlations'):
            top_corr = insights['correlations'][0]
            questions.append(
                f"What business factors might explain the relationship between "
                f"{top_corr.get('x', '')} and {top_corr.get('y', '')}?"
            )
        
        # Trend-based questions
        if insights.get('trends'):
            trend = insights['trends'][0]
            direction = trend.get('direction', 'changing')
            questions.append(
                f"What external factors could be driving the {direction} trend in "
                f"{trend.get('value_column', 'this metric')}?"
            )
        
        # Outlier questions
        if insights.get('outliers'):
            outlier = insights['outliers'][0]
            questions.append(
                f"What might be causing the unusual values in {outlier.get('column', 'this field')}? "
                "Are these errors or legitimate exceptional cases?"
            )
        
        # Feature importance questions
        if insights.get('feature_importance'):
            driver = insights['feature_importance'][0]
            questions.append(
                f"How can we leverage the strong influence of {driver.get('feature', 'this factor')} "
                f"to improve {driver.get('target', 'outcomes')}?"
            )
        
        # General exploration questions
        questions.extend([
            "What additional data sources could enhance this analysis?",
            "Which insights have the highest potential business impact?",
            "What are the next steps for acting on these findings?"
        ])
        
        return questions[:5]  # Limit to 5 questions

    def generate_methodology_notes(self):
        """Generate notes about analysis methodology"""
        return (
            "This analysis was performed using statistical correlation analysis, trend detection, "
            "outlier identification using IQR method, and feature importance calculation using "
            "decision tree algorithms. Semantic analysis was used to understand data types and "
            "business context. All insights are automatically generated and should be validated "
            "with domain expertise before making business decisions."
        )

    # Helper methods
    def select_template(self, template_type):
        """Randomly select a template for variation"""
        templates = self.templates.get(template_type, ["No template available"])
        return random.choice(templates)

    def assess_quality_level(self, completeness):
        """Assess quality level based on completeness"""
        if completeness >= 95:
            return "excellent"
        elif completeness >= 90:
            return "good"
        elif completeness >= 80:
            return "fair"
        else:
            return "poor"

    def get_quality_assessment(self, completeness):
        """Get quality assessment description"""
        if completeness >= 95:
            return "excellent data completeness"
        elif completeness >= 90:
            return "good data quality with minor gaps"
        elif completeness >= 80:
            return "acceptable quality with some missing data"
        else:
            return "significant data quality concerns"

    def summarize_semantic_types(self, semantic_data):
        """Summarize semantic type distribution"""
        classifications = semantic_data.get('classifications', [])
        if not classifications:
            return ""
        
        type_counts = {}
        for item in classifications:
            semantic_type = item.get('semantic_type', 'unknown')
            type_counts[semantic_type] = type_counts.get(semantic_type, 0) + 1
        
        # Get top types
        sorted_types = sorted(type_counts.items(), key=lambda x: x[1], reverse=True)
        top_types = sorted_types[:3]
        
        if top_types:
            type_descriptions = []
            for semantic_type, count in top_types:
                friendly_name = self.get_friendly_type_name(semantic_type)
                type_descriptions.append(f"{count} {friendly_name}")
            
            return f"The data primarily contains {', '.join(type_descriptions)} fields."
        
        return ""

    def get_friendly_type_name(self, semantic_type):
        """Convert semantic type to friendly name"""
        friendly_names = {
            'identifier': 'identifier',
            'personal_name': 'name',
            'email': 'email',
            'phone': 'phone number',
            'address': 'address',
            'date_time': 'date/time',
            'currency': 'monetary',
            'percentage': 'percentage',
            'category': 'categorical',
            'quantity': 'numerical',
            'coordinates': 'location',
            'url': 'web link',
            'description': 'text description'
        }
        return friendly_names.get(semantic_type, semantic_type)

    def generate_business_impact(self, item, item_type):
        """Generate business impact explanation"""
        impact_templates = {
            'correlation': "This relationship could be used for predictive modeling and strategic decision-making.",
            'trend': "This trend information can inform forecasting and resource planning decisions.",
            'outlier': "These outliers warrant investigation to ensure data accuracy and identify potential opportunities or risks.",
            'driver': "Focus on this key driver to maximize impact on business outcomes."
        }
        return impact_templates.get(item_type, "This finding provides valuable insights for business optimization.")

    def calculate_overall_confidence(self, insights):
        """Calculate overall confidence in the analysis"""
        total_insights = len(insights.get('insights', []))
        high_priority = len([i for i in insights.get('insights', []) if i.get('priority') == 'high'])
        
        if total_insights == 0:
            return "low"
        
        high_priority_ratio = high_priority / total_insights
        
        if high_priority_ratio > 0.3:
            return "high"
        elif high_priority_ratio > 0.1:
            return "medium"
        else:
            return "low"


def main():
    parser = argparse.ArgumentParser(description='Generate insights and natural language summary')
    parser.add_argument('--mode', choices=['insights', 'summary'], required=True, help='Operation mode')
    parser.add_argument('--data', required=True, help='Path to CSV data file')
    parser.add_argument('--metadata', help='Path to metadata JSON file (for insights mode)')
    parser.add_argument('--insights', help='Path to insights JSON file (for summary mode)')
    parser.add_argument('--semantic', help='Path to semantic analysis JSON file (for summary mode)')
    parser.add_argument('--output', required=True, help='Output JSON file')
    
    args = parser.parse_args()
    
    try:
        if args.mode == 'insights':
            if not args.metadata:
                raise ValueError("--metadata is required for insights mode")
            
            generator = InsightGenerator()
            result = generator.generate_insights(args.data, args.metadata)
            
        elif args.mode == 'summary':
            if not args.insights or not args.semantic:
                raise ValueError("--insights and --semantic are required for summary mode")
            
            summarizer = NaturalLanguageSummarizer()
            result = summarizer.generate_summary(args.data, args.insights, args.semantic)
        
        with open(args.output, 'w') as f:
            json.dump(result, f, indent=2)
        
        print(f"Operation completed successfully. Output saved to {args.output}")
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
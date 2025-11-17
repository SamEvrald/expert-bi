import sys
import json
import pandas as pd
import numpy as np
from scipy.stats import pearsonr, spearmanr
from sklearn.feature_selection import mutual_info_regression
import warnings
warnings.filterwarnings('ignore')

class CorrelationAnalyzer:
    def __init__(self, csv_path, threshold=0.7):
        self.csv_path = csv_path
        self.threshold = threshold
        self.df = None
        
    def load_data(self):
        """Load CSV data"""
        try:
            self.df = pd.read_csv(self.csv_path)
            return True
        except Exception as e:
            raise Exception(f"Error loading data: {str(e)}")
    
    def analyze_correlations(self):
        """Analyze correlations between all numeric columns"""
        numeric_cols = self.df.select_dtypes(include=[np.number]).columns.tolist()
        
        if len(numeric_cols) < 2:
            return {
                'correlations': [],
                'message': 'Need at least 2 numeric columns for correlation analysis'
            }
        
        correlations = []
        
        for i in range(len(numeric_cols)):
            for j in range(i+1, len(numeric_cols)):
                col1, col2 = numeric_cols[i], numeric_cols[j]
                
                # Get data
                data1 = self.df[col1].dropna()
                data2 = self.df[col2].dropna()
                
                # Align data
                common_idx = data1.index.intersection(data2.index)
                if len(common_idx) < 3:
                    continue
                
                x = self.df.loc[common_idx, col1].values
                y = self.df.loc[common_idx, col2].values
                
                # Pearson correlation
                pearson_corr, pearson_p = pearsonr(x, y)
                
                # Spearman correlation (rank-based)
                spearman_corr, spearman_p = spearmanr(x, y)
                
                # Mutual information (non-linear relationships)
                mi_score = mutual_info_regression(x.reshape(-1, 1), y)[0]
                
                # Only include significant correlations
                if abs(pearson_corr) >= self.threshold or abs(spearman_corr) >= self.threshold:
                    correlation_type = 'positive' if pearson_corr > 0 else 'negative'
                    strength = self._get_strength(abs(pearson_corr))
                    
                    correlations.append({
                        'column1': col1,
                        'column2': col2,
                        'pearson_correlation': float(pearson_corr),
                        'pearson_p_value': float(pearson_p),
                        'spearman_correlation': float(spearman_corr),
                        'spearman_p_value': float(spearman_p),
                        'mutual_information': float(mi_score),
                        'correlation_type': correlation_type,
                        'strength': strength,
                        'is_significant': pearson_p < 0.05,
                        'interpretation': self._interpret_correlation(
                            pearson_corr, col1, col2
                        )
                    })
        
        # Sort by absolute correlation
        correlations.sort(key=lambda x: abs(x['pearson_correlation']), reverse=True)
        
        return {
            'total_correlations': len(correlations),
            'strong_correlations': len([c for c in correlations if c['strength'] in ['very strong', 'strong']]),
            'correlations': correlations[:20],  # Top 20
            'numeric_columns': numeric_cols
        }
    
    def _get_strength(self, abs_corr):
        """Classify correlation strength"""
        if abs_corr >= 0.9:
            return 'very strong'
        elif abs_corr >= 0.7:
            return 'strong'
        elif abs_corr >= 0.5:
            return 'moderate'
        elif abs_corr >= 0.3:
            return 'weak'
        else:
            return 'very weak'
    
    def _interpret_correlation(self, corr, col1, col2):
        """Generate human-readable interpretation"""
        if abs(corr) < 0.3:
            return f"{col1} and {col2} show little to no linear relationship"
        
        direction = "positively" if corr > 0 else "negatively"
        strength = self._get_strength(abs(corr))
        
        if corr > 0:
            return f"When {col1} increases, {col2} tends to increase as well ({strength} {direction} correlated)"
        else:
            return f"When {col1} increases, {col2} tends to decrease ({strength} {direction} correlated)"

def main():
    try:
        if len(sys.argv) < 2:
            raise Exception("Missing arguments: csv_path, [threshold]")
        
        csv_path = sys.argv[1]
        threshold = float(sys.argv[2]) if len(sys.argv) > 2 else 0.7
        
        analyzer = CorrelationAnalyzer(csv_path, threshold)
        analyzer.load_data()
        result = analyzer.analyze_correlations()
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            'error': str(e),
            'correlations': []
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == '__main__':
    main()
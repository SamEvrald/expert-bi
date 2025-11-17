import sys
import json
import pandas as pd
import numpy as np
import re
from datetime import datetime
import warnings
warnings.filterwarnings('ignore')

class TypeDetector:
    def __init__(self, csv_path, dataset_id):
        self.csv_path = csv_path
        self.dataset_id = dataset_id
        self.df = None
        
    def load_data(self):
        """Load CSV data"""
        try:
            self.df = pd.read_csv(self.csv_path, low_memory=False)
            return True
        except Exception as e:
            raise Exception(f"Error loading data: {str(e)}")
    
    def detect_all_types(self):
        """Detect types for all columns with detailed metadata"""
        results = {}
        
        for col in self.df.columns:
            results[col] = self.detect_column_type(col)
        
        return {
            'dataset_id': self.dataset_id,
            'total_columns': len(self.df.columns),
            'columns': results,
            'summary': self._generate_summary(results)
        }
    
    def detect_column_type(self, column):
        """Detect detailed type information for a single column"""
        col_data = self.df[column]
        non_null_data = col_data.dropna()
        
        if len(non_null_data) == 0:
            return self._create_type_result('empty', column, col_data)
        
        # Sample data for pattern detection
        sample_size = min(1000, len(non_null_data))
        sample = non_null_data.sample(n=sample_size, random_state=42)
        
        # Try detection in order of specificity
        type_detectors = [
            ('id', self._is_id_column),
            ('email', self._is_email_column),
            ('url', self._is_url_column),
            ('phone', self._is_phone_column),
            ('ip_address', self._is_ip_address_column),
            ('currency', self._is_currency_column),
            ('percentage', self._is_percentage_column),
            ('date', self._is_date_column),
            ('datetime', self._is_datetime_column),
            ('time', self._is_time_column),
            ('boolean', self._is_boolean_column),
            ('uuid', self._is_uuid_column),
            ('zip_code', self._is_zip_code_column),
            ('credit_card', self._is_credit_card_column),
            ('latitude', self._is_latitude_column),
            ('longitude', self._is_longitude_column),
            ('numeric', self._is_numeric_column),
            ('categorical', self._is_categorical_column),
            ('text', lambda c, s: (True, {}))  # Default fallback
        ]
        
        for type_name, detector_func in type_detectors:
            is_type, metadata = detector_func(column, sample)
            if is_type:
                return self._create_type_result(type_name, column, col_data, metadata)
        
        return self._create_type_result('unknown', column, col_data)
    
    def _create_type_result(self, detected_type, column, col_data, metadata=None):
        """Create standardized type result"""
        result = {
            'detected_type': detected_type,
            'original_dtype': str(col_data.dtype),
            'null_count': int(col_data.isnull().sum()),
            'null_percentage': float((col_data.isnull().sum() / len(col_data)) * 100),
            'unique_count': int(col_data.nunique()),
            'unique_percentage': float((col_data.nunique() / len(col_data)) * 100),
            'sample_values': [str(v) for v in col_data.dropna().head(5).tolist()],
            'metadata': metadata or {}
        }
        
        # Add type-specific statistics
        if detected_type in ['numeric', 'currency', 'percentage', 'latitude', 'longitude']:
            result['statistics'] = self._get_numeric_stats(col_data)
        elif detected_type in ['date', 'datetime']:
            result['date_range'] = self._get_date_range(col_data)
        elif detected_type == 'categorical':
            result['categories'] = self._get_top_categories(col_data)
        
        return result
    
    def _is_id_column(self, column, sample):
        """Detect ID columns"""
        col_lower = column.lower()
        
        # Check column name
        if any(keyword in col_lower for keyword in ['id', 'key', 'index', 'code']):
            # Check if values are unique
            if self.df[column].nunique() / len(self.df[column].dropna()) > 0.95:
                return True, {'confidence': 0.95, 'reason': 'High uniqueness + ID-like name'}
        
        # Check for sequential numbers
        if pd.api.types.is_numeric_dtype(self.df[column]):
            sorted_vals = self.df[column].dropna().sort_values()
            diffs = sorted_vals.diff().dropna()
            if len(diffs) > 0 and (diffs == 1).sum() / len(diffs) > 0.8:
                return True, {'confidence': 0.9, 'reason': 'Sequential numeric values'}
        
        return False, {}
    
    def _is_email_column(self, column, sample):
        """Detect email addresses"""
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        
        matches = sample.astype(str).str.match(email_pattern, na=False).sum()
        match_ratio = matches / len(sample)
        
        if match_ratio > 0.8:
            return True, {'confidence': match_ratio, 'pattern': 'email'}
        
        return False, {}
    
    def _is_url_column(self, column, sample):
        """Detect URLs"""
        url_pattern = r'^https?://[^\s]+$'
        
        matches = sample.astype(str).str.match(url_pattern, na=False).sum()
        match_ratio = matches / len(sample)
        
        if match_ratio > 0.8:
            return True, {'confidence': match_ratio, 'pattern': 'url'}
        
        return False, {}
    
    def _is_phone_column(self, column, sample):
        """Detect phone numbers"""
        phone_patterns = [
            r'^\+?1?\d{10}$',  # US format
            r'^\+?\d{1,3}[-.\s]?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}$'  # International
        ]
        
        sample_str = sample.astype(str).str.replace(r'[\s\-\(\)]', '', regex=True)
        
        for pattern in phone_patterns:
            matches = sample_str.str.match(pattern, na=False).sum()
            match_ratio = matches / len(sample)
            
            if match_ratio > 0.7:
                return True, {'confidence': match_ratio, 'pattern': 'phone'}
        
        return False, {}
    
    def _is_ip_address_column(self, column, sample):
        """Detect IP addresses"""
        ip_pattern = r'^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$'
        
        matches = sample.astype(str).str.match(ip_pattern, na=False).sum()
        match_ratio = matches / len(sample)
        
        if match_ratio > 0.8:
            return True, {'confidence': match_ratio, 'pattern': 'ipv4'}
        
        return False, {}
    
    def _is_currency_column(self, column, sample):
        """Detect currency values"""
        col_lower = column.lower()
        
        # Check column name
        currency_keywords = ['price', 'cost', 'amount', 'revenue', 'salary', 'fee', 'total', 'sum']
        has_currency_name = any(keyword in col_lower for keyword in currency_keywords)
        
        # Check for currency symbols
        sample_str = sample.astype(str)
        has_currency_symbol = sample_str.str.contains(r'[$£€¥]', na=False, regex=True).sum() / len(sample) > 0.3
        
        # Check if numeric after removing currency symbols
        cleaned = sample_str.str.replace(r'[$£€¥,]', '', regex=True)
        try:
            pd.to_numeric(cleaned, errors='coerce')
            is_numeric_after_clean = cleaned.apply(lambda x: x.replace('.', '', 1).isdigit() if x else False).sum() / len(sample) > 0.8
        except:
            is_numeric_after_clean = False
        
        if (has_currency_name or has_currency_symbol) and is_numeric_after_clean:
            return True, {'confidence': 0.85, 'has_symbol': has_currency_symbol}
        
        return False, {}
    
    def _is_percentage_column(self, column, sample):
        """Detect percentage values"""
        col_lower = column.lower()
        
        # Check column name
        if 'percent' in col_lower or 'rate' in col_lower or 'ratio' in col_lower:
            # Check for % symbol
            sample_str = sample.astype(str)
            has_percent_symbol = sample_str.str.contains('%', na=False).sum() / len(sample) > 0.3
            
            # Check if values are between 0-100
            try:
                numeric_vals = pd.to_numeric(sample_str.str.replace('%', ''), errors='coerce')
                in_range = ((numeric_vals >= 0) & (numeric_vals <= 100)).sum() / len(numeric_vals.dropna()) > 0.8
                
                if has_percent_symbol or in_range:
                    return True, {'confidence': 0.9, 'has_symbol': has_percent_symbol}
            except:
                pass
        
        return False, {}
    
    def _is_date_column(self, column, sample):
        """Detect date columns"""
        try:
            parsed = pd.to_datetime(sample, errors='coerce')
            valid_dates = parsed.notna().sum()
            match_ratio = valid_dates / len(sample)
            
            if match_ratio > 0.8:
                # Check if it's date only (no time component)
                has_time = (parsed.dt.hour != 0).any() or (parsed.dt.minute != 0).any()
                
                if not has_time:
                    date_format = self._infer_date_format(sample.head(10))
                    return True, {
                        'confidence': match_ratio,
                        'format': date_format,
                        'has_time': False
                    }
        except:
            pass
        
        return False, {}
    
    def _is_datetime_column(self, column, sample):
        """Detect datetime columns"""
        try:
            parsed = pd.to_datetime(sample, errors='coerce')
            valid_dates = parsed.notna().sum()
            match_ratio = valid_dates / len(sample)
            
            if match_ratio > 0.8:
                # Check if it has time component
                has_time = (parsed.dt.hour != 0).any() or (parsed.dt.minute != 0).any()
                
                if has_time:
                    return True, {
                        'confidence': match_ratio,
                        'has_time': True,
                        'has_timezone': parsed.dt.tz is not None
                    }
        except:
            pass
        
        return False, {}
    
    def _is_time_column(self, column, sample):
        """Detect time-only columns"""
        time_pattern = r'^\d{1,2}:\d{2}(:\d{2})?(\s?[AaPp][Mm])?$'
        
        matches = sample.astype(str).str.match(time_pattern, na=False).sum()
        match_ratio = matches / len(sample)
        
        if match_ratio > 0.8:
            return True, {'confidence': match_ratio, 'pattern': 'time'}
        
        return False, {}
    
    def _is_boolean_column(self, column, sample):
        """Detect boolean columns"""
        unique_values = set(sample.astype(str).str.lower().unique())
        
        # Check for common boolean patterns
        bool_patterns = [
            {'true', 'false'},
            {'yes', 'no'},
            {'y', 'n'},
            {'1', '0'},
            {'t', 'f'},
            {'on', 'off'},
            {'active', 'inactive'},
            {'enabled', 'disabled'}
        ]
        
        for pattern in bool_patterns:
            if unique_values.issubset(pattern | {'nan'}):
                return True, {'confidence': 0.95, 'values': list(pattern)}
        
        return False, {}
    
    def _is_uuid_column(self, column, sample):
        """Detect UUID columns"""
        uuid_pattern = r'^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
        
        matches = sample.astype(str).str.match(uuid_pattern, na=False).sum()
        match_ratio = matches / len(sample)
        
        if match_ratio > 0.8:
            return True, {'confidence': match_ratio, 'pattern': 'uuid'}
        
        return False, {}
    
    def _is_zip_code_column(self, column, sample):
        """Detect ZIP/postal codes"""
        col_lower = column.lower()
        
        if 'zip' in col_lower or 'postal' in col_lower or 'postcode' in col_lower:
            # US ZIP code pattern
            us_zip_pattern = r'^\d{5}(-\d{4})?$'
            matches = sample.astype(str).str.match(us_zip_pattern, na=False).sum()
            match_ratio = matches / len(sample)
            
            if match_ratio > 0.7:
                return True, {'confidence': match_ratio, 'pattern': 'us_zip'}
        
        return False, {}
    
    def _is_credit_card_column(self, column, sample):
        """Detect credit card numbers (with caution)"""
        # Basic Luhn algorithm check
        cc_pattern = r'^\d{13,19}$'
        
        sample_str = sample.astype(str).str.replace(r'[\s-]', '', regex=True)
        matches = sample_str.str.match(cc_pattern, na=False).sum()
        match_ratio = matches / len(sample)
        
        if match_ratio > 0.8:
            return True, {'confidence': match_ratio, 'pattern': 'credit_card', 'warning': 'sensitive_data'}
        
        return False, {}
    
    def _is_latitude_column(self, column, sample):
        """Detect latitude values"""
        col_lower = column.lower()
        
        if 'lat' in col_lower and pd.api.types.is_numeric_dtype(self.df[column]):
            values = sample.dropna()
            in_range = ((values >= -90) & (values <= 90)).sum() / len(values) > 0.95
            
            if in_range:
                return True, {'confidence': 0.9, 'range': [-90, 90]}
        
        return False, {}
    
    def _is_longitude_column(self, column, sample):
        """Detect longitude values"""
        col_lower = column.lower()
        
        if any(keyword in col_lower for keyword in ['lon', 'lng', 'long']) and pd.api.types.is_numeric_dtype(self.df[column]):
            values = sample.dropna()
            in_range = ((values >= -180) & (values <= 180)).sum() / len(values) > 0.95
            
            if in_range:
                return True, {'confidence': 0.9, 'range': [-180, 180]}
        
        return False, {}
    
    def _is_numeric_column(self, column, sample):
        """Detect numeric columns"""
        if pd.api.types.is_numeric_dtype(self.df[column]):
            # Check if it's continuous or discrete
            unique_ratio = sample.nunique() / len(sample)
            
            if unique_ratio > 0.5:
                return True, {'confidence': 0.95, 'subtype': 'continuous'}
            else:
                return True, {'confidence': 0.9, 'subtype': 'discrete'}
        
        return False, {}
    
    def _is_categorical_column(self, column, sample):
        """Detect categorical columns"""
        unique_ratio = sample.nunique() / len(sample)
        
        # Low cardinality suggests categorical
        if unique_ratio < 0.5:
            cardinality = sample.nunique()
            
            if cardinality <= 2:
                subtype = 'binary'
            elif cardinality <= 10:
                subtype = 'low_cardinality'
            elif cardinality <= 50:
                subtype = 'medium_cardinality'
            else:
                subtype = 'high_cardinality'
            
            return True, {
                'confidence': 1.0 - unique_ratio,
                'subtype': subtype,
                'cardinality': int(cardinality)
            }
        
        return False, {}
    
    def _infer_date_format(self, sample):
        """Infer date format from sample"""
        common_formats = [
            '%Y-%m-%d',
            '%m/%d/%Y',
            '%d/%m/%Y',
            '%Y/%m/%d',
            '%d-%m-%Y',
            '%m-%d-%Y',
            '%b %d, %Y',
            '%d %b %Y',
            '%Y%m%d'
        ]
        
        for fmt in common_formats:
            try:
                parsed = pd.to_datetime(sample, format=fmt, errors='coerce')
                if parsed.notna().sum() / len(sample) > 0.8:
                    return fmt
            except:
                continue
        
        return 'mixed'
    
    def _get_numeric_stats(self, col_data):
        """Get numeric statistics"""
        numeric_data = pd.to_numeric(col_data, errors='coerce').dropna()
        
        if len(numeric_data) == 0:
            return {}
        
        return {
            'min': float(numeric_data.min()),
            'max': float(numeric_data.max()),
            'mean': float(numeric_data.mean()),
            'median': float(numeric_data.median()),
            'std': float(numeric_data.std()),
            'q25': float(numeric_data.quantile(0.25)),
            'q75': float(numeric_data.quantile(0.75))
        }
    
    def _get_date_range(self, col_data):
        """Get date range"""
        dates = pd.to_datetime(col_data, errors='coerce').dropna()
        
        if len(dates) == 0:
            return {}
        
        return {
            'min_date': dates.min().isoformat(),
            'max_date': dates.max().isoformat(),
            'range_days': int((dates.max() - dates.min()).days)
        }
    
    def _get_top_categories(self, col_data):
        """Get top categories"""
        value_counts = col_data.value_counts().head(10)
        
        return [
            {
                'value': str(val),
                'count': int(count),
                'percentage': float((count / len(col_data)) * 100)
            }
            for val, count in value_counts.items()
        ]
    
    def _generate_summary(self, results):
        """Generate summary of detected types"""
        type_counts = {}
        
        for col_info in results.values():
            detected_type = col_info['detected_type']
            type_counts[detected_type] = type_counts.get(detected_type, 0) + 1
        
        return {
            'type_distribution': type_counts,
            'total_columns': len(results),
            'has_dates': any(r['detected_type'] in ['date', 'datetime'] for r in results.values()),
            'has_geo': any(r['detected_type'] in ['latitude', 'longitude'] for r in results.values()),
            'has_sensitive': any(r.get('metadata', {}).get('warning') == 'sensitive_data' for r in results.values())
        }

def main():
    try:
        if len(sys.argv) < 3:
            raise Exception("Missing arguments: csv_path, dataset_id")
        
        csv_path = sys.argv[1]
        dataset_id = int(sys.argv[2])
        
        detector = TypeDetector(csv_path, dataset_id)
        detector.load_data()
        result = detector.detect_all_types()
        
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
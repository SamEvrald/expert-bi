import sys
import json
import pandas as pd
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from datetime import datetime
import argparse

class SemanticColumnAnalyzer:
    def __init__(self):
        # Define semantic categories with patterns and keywords
        self.semantic_categories = {
            'identifier': {
                'patterns': [r'.*id$', r'.*_id$', r'^id.*', r'.*key$', r'.*_key$'],
                'keywords': ['id', 'key', 'identifier', 'uuid', 'guid'],
                'type_hints': ['integer', 'string']
            },
            'personal_name': {
                'patterns': [r'.*name$', r'first.*name', r'last.*name', r'full.*name'],
                'keywords': ['name', 'firstname', 'lastname', 'fullname', 'username'],
                'type_hints': ['string']
            },
            'email': {
                'patterns': [r'.*email$', r'.*mail$'],
                'keywords': ['email', 'mail', 'e-mail'],
                'type_hints': ['string']
            },
            'phone': {
                'patterns': [r'.*phone$', r'.*tel$', r'.*mobile$'],
                'keywords': ['phone', 'telephone', 'mobile', 'tel'],
                'type_hints': ['string']
            },
            'address': {
                'patterns': [r'.*address$', r'.*street$', r'.*city$', r'.*state$', r'.*zip$', r'.*postal$'],
                'keywords': ['address', 'street', 'city', 'state', 'zip', 'postal', 'country'],
                'type_hints': ['string']
            },
            'date_time': {
                'patterns': [r'.*date$', r'.*time$', r'created.*', r'updated.*', r'.*_at$', r'.*_on$'],
                'keywords': ['date', 'time', 'created', 'updated', 'timestamp'],
                'type_hints': ['date', 'string']
            },
            'currency': {
                'patterns': [r'.*price$', r'.*cost$', r'.*amount$', r'.*salary$', r'.*revenue$', r'.*profit$'],
                'keywords': ['price', 'cost', 'amount', 'salary', 'revenue', 'profit', 'money', 'currency', 'dollar'],
                'type_hints': ['float', 'integer']
            },
            'percentage': {
                'patterns': [r'.*rate$', r'.*ratio$', r'.*percent$', r'.*pct$'],
                'keywords': ['rate', 'ratio', 'percent', 'percentage', 'pct'],
                'type_hints': ['float']
            },
            'category': {
                'patterns': [r'.*type$', r'.*category$', r'.*class$', r'.*group$', r'.*status$'],
                'keywords': ['type', 'category', 'class', 'group', 'status', 'classification'],
                'type_hints': ['string']
            },
            'quantity': {
                'patterns': [r'.*count$', r'.*number$', r'.*qty$', r'.*quantity$', r'.*size$'],
                'keywords': ['count', 'number', 'quantity', 'qty', 'size', 'total'],
                'type_hints': ['integer', 'float']
            },
            'coordinates': {
                'patterns': [r'.*lat$', r'.*lng$', r'.*lon$', r'.*latitude$', r'.*longitude$'],
                'keywords': ['latitude', 'longitude', 'lat', 'lng', 'lon', 'coordinates'],
                'type_hints': ['float']
            },
            'url': {
                'patterns': [r'.*url$', r'.*link$', r'.*website$'],
                'keywords': ['url', 'link', 'website', 'uri'],
                'type_hints': ['string']
            },
            'description': {
                'patterns': [r'.*desc$', r'.*description$', r'.*comment$', r'.*note$'],
                'keywords': ['description', 'desc', 'comment', 'note', 'remarks'],
                'type_hints': ['string']
            }
        }
    
    def analyze_column_name(self, column_name, data_type):
        """Analyze column name for semantic meaning"""
        column_lower = column_name.lower().strip()
        scores = {}
        
        for category, rules in self.semantic_categories.items():
            score = 0
            
            # Check type compatibility
            if data_type in rules['type_hints']:
                score += 2
            
            # Check pattern matching
            for pattern in rules['patterns']:
                if re.match(pattern, column_lower):
                    score += 3
            
            # Check keyword matching
            for keyword in rules['keywords']:
                if keyword in column_lower:
                    score += 2
            
            scores[category] = score
        
        # Return the category with highest score
        if max(scores.values()) > 0:
            return max(scores.items(), key=lambda x: x[1])
        
        return ('generic', 0)
    
    def analyze_sample_values(self, sample_values, column_name, data_type):
        """Analyze sample values for additional semantic clues"""
        if not sample_values or len(sample_values) == 0:
            return None
        
        # Convert to strings for analysis
        str_values = [str(val) for val in sample_values if val is not None]
        
        if not str_values:
            return None
        
        # Email pattern detection
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if any(re.match(email_pattern, val) for val in str_values):
            return ('email', 5)
        
        # Phone pattern detection
        phone_pattern = r'^[\+]?[1-9]?[0-9]{7,15}$'
        clean_phones = [re.sub(r'[^0-9+]', '', val) for val in str_values]
        if any(re.match(phone_pattern, val) for val in clean_phones):
            return ('phone', 5)
        
        # URL pattern detection
        url_pattern = r'^https?://.*'
        if any(re.match(url_pattern, val) for val in str_values):
            return ('url', 5)
        
        # Currency detection (values with currency symbols)
        currency_pattern = r'^[\$£€¥].*|.*[\$£€¥]$'
        if any(re.match(currency_pattern, val) for val in str_values):
            return ('currency', 4)
        
        # Date detection
        try:
            date_count = 0
            for val in str_values[:5]:  # Check first 5 values
                try:
                    pd.to_datetime(val)
                    date_count += 1
                except:
                    pass
            if date_count >= len(str_values[:5]) * 0.8:  # 80% are dates
                return ('date_time', 4)
        except:
            pass
        
        # Coordinate detection (lat/lng values)
        if data_type in ['float', 'integer']:
            try:
                numeric_values = [float(val) for val in str_values if val.replace('.', '').replace('-', '').isdigit()]
                if numeric_values:
                    # Latitude range: -90 to 90
                    if all(-90 <= val <= 90 for val in numeric_values) and 'lat' in column_name.lower():
                        return ('coordinates', 4)
                    # Longitude range: -180 to 180
                    if all(-180 <= val <= 180 for val in numeric_values) and ('lng' in column_name.lower() or 'lon' in column_name.lower()):
                        return ('coordinates', 4)
            except:
                pass
        
        return None
    
    def classify_column(self, column_data):
        """Main method to classify a column"""
        column_name = column_data.get('name', '')
        data_type = column_data.get('type', '')
        sample_values = column_data.get('sample_values', [])
        
        # Analyze column name
        name_result = self.analyze_column_name(column_name, data_type)
        
        # Analyze sample values
        value_result = self.analyze_sample_values(sample_values, column_name, data_type)
        
        # Combine results (prioritize value analysis if it has higher confidence)
        if value_result and value_result[1] > name_result[1]:
            return {
                'semantic_type': value_result[0],
                'confidence': value_result[1],
                'method': 'value_analysis'
            }
        else:
            return {
                'semantic_type': name_result[0],
                'confidence': name_result[1],
                'method': 'name_analysis'
            }

def main():
    parser = argparse.ArgumentParser(description='Semantic Column Analyzer')
    parser.add_argument('--input', required=True, help='Input JSON file with column data')
    parser.add_argument('--output', required=True, help='Output JSON file for results')
    
    args = parser.parse_args()
    
    try:
        # Read input data
        with open(args.input, 'r') as f:
            data = json.load(f)
        
        analyzer = SemanticColumnAnalyzer()
        results = []
        
        # Process each column
        for column in data.get('columns', []):
            classification = analyzer.classify_column(column)
            results.append({
                'column_name': column.get('name'),
                'original_type': column.get('type'),
                'semantic_type': classification['semantic_type'],
                'confidence': classification['confidence'],
                'method': classification['method']
            })
        
        # Write results
        output_data = {
            'dataset_id': data.get('dataset_id'),
            'classifications': results,
            'timestamp': datetime.now().isoformat()
        }
        
        with open(args.output, 'w') as f:
            json.dump(output_data, f, indent=2)
        
        print(f"Semantic analysis completed. Results saved to {args.output}")
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
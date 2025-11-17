#!/usr/bin/env python3
"""
Generate comprehensive test datasets for Expert BI
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
import random
import string

class TestDataGenerator:
    def __init__(self, output_dir='test_data'):
        self.output_dir = output_dir
        
    def generate_all(self):
        """Generate all test datasets"""
        print("Generating test datasets...")
        
        datasets = [
            ('basic_sales.csv', self.generate_basic_sales),
            ('mixed_types.csv', self.generate_mixed_types),
            ('edge_cases.csv', self.generate_edge_cases),
            ('large_dataset.csv', self.generate_large_dataset),
            ('time_series.csv', self.generate_time_series),
            ('categorical_data.csv', self.generate_categorical),
            ('financial_data.csv', self.generate_financial),
            ('geographic_data.csv', self.generate_geographic),
            ('messy_data.csv', self.generate_messy_data),
            ('unicode_data.csv', self.generate_unicode_data),
        ]
        
        for filename, generator_func in datasets:
            try:
                df = generator_func()
                filepath = f"{self.output_dir}/{filename}"
                df.to_csv(filepath, index=False)
                print(f"✓ Created {filename} ({len(df)} rows, {len(df.columns)} columns)")
            except Exception as e:
                print(f"✗ Failed to create {filename}: {e}")
    
    def generate_basic_sales(self):
        """Basic sales data - should work perfectly"""
        np.random.seed(42)
        
        dates = pd.date_range('2023-01-01', '2024-12-31', freq='D')
        n = len(dates)
        
        df = pd.DataFrame({
            'date': dates,
            'product': np.random.choice(['Widget A', 'Widget B', 'Widget C', 'Widget D'], n),
            'quantity': np.random.randint(1, 100, n),
            'price': np.round(np.random.uniform(10, 500, n), 2),
            'revenue': 0,  # Will calculate
            'region': np.random.choice(['North', 'South', 'East', 'West'], n),
            'customer_id': np.random.randint(1000, 9999, n)
        })
        
        df['revenue'] = df['quantity'] * df['price']
        return df
    
    def generate_mixed_types(self):
        """All different data types"""
        n = 1000
        
        df = pd.DataFrame({
            # Numeric types
            'integer': np.random.randint(1, 1000, n),
            'float': np.random.uniform(0, 100, n),
            'currency': ['$' + str(round(x, 2)) for x in np.random.uniform(10, 1000, n)],
            'percentage': [str(round(x, 1)) + '%' for x in np.random.uniform(0, 100, n)],
            
            # Date/Time types
            'date': pd.date_range('2020-01-01', periods=n, freq='D'),
            'datetime': pd.date_range('2020-01-01', periods=n, freq='H'),
            'time': [f"{h:02d}:{m:02d}:{s:02d}" for h, m, s in zip(
                np.random.randint(0, 24, n),
                np.random.randint(0, 60, n),
                np.random.randint(0, 60, n)
            )],
            
            # String types
            'email': [f"user{i}@example.com" for i in range(n)],
            'url': [f"https://example.com/page{i}" for i in range(n)],
            'phone': [f"+1-555-{random.randint(100, 999)}-{random.randint(1000, 9999)}" for _ in range(n)],
            'zip_code': [f"{random.randint(10000, 99999)}" for _ in range(n)],
            
            # Boolean
            'is_active': np.random.choice([True, False], n),
            'status': np.random.choice(['Yes', 'No'], n),
            
            # Categorical
            'category': np.random.choice(['A', 'B', 'C', 'D', 'E'], n),
            'priority': np.random.choice(['Low', 'Medium', 'High'], n),
            
            # Geographic
            'latitude': np.random.uniform(-90, 90, n),
            'longitude': np.random.uniform(-180, 180, n),
            
            # ID types
            'uuid': [f"{random.randint(0, 0xFFFFFFFF):08x}-{random.randint(0, 0xFFFF):04x}-{random.randint(0, 0xFFFF):04x}-{random.randint(0, 0xFFFF):04x}-{random.randint(0, 0xFFFFFFFFFFFF):012x}" for _ in range(n)],
            'ip_address': [f"{random.randint(1, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}.{random.randint(0, 255)}" for _ in range(n)],
        })
        
        return df
    
    def generate_edge_cases(self):
        """Data with edge cases"""
        df = pd.DataFrame({
            # Column with all nulls
            'all_nulls': [None] * 100,
            
            # Column with mostly nulls
            'mostly_nulls': [i if i % 10 == 0 else None for i in range(100)],
            
            # Single unique value
            'constant': ['CONSTANT'] * 100,
            
            # All unique values
            'all_unique': range(100),
            
            # Mixed nulls and values
            'mixed': [None if i % 3 == 0 else f"value_{i}" for i in range(100)],
            
            # Empty strings
            'empty_strings': ['' if i % 5 == 0 else f"text_{i}" for i in range(100)],
            
            # Whitespace
            'whitespace': ['   ' if i % 5 == 0 else f"text_{i}" for i in range(100)],
            
            # Mixed case
            'mixed_case': [s.upper() if i % 2 == 0 else s.lower() for i, s in enumerate([f"Value_{i}" for i in range(100)])],
            
            # Numbers as strings
            'string_numbers': [str(i) for i in range(100)],
            
            # Mixed types in column
            'mixed_types': [i if i % 2 == 0 else f"text_{i}" for i in range(100)],
            
            # Special characters
            'special_chars': [f"value_{i}!@#$%^&*()" for i in range(100)],
            
            # Very long strings
            'long_strings': [''.join(random.choices(string.ascii_letters, k=1000)) for _ in range(100)],
        })
        
        return df
    
    def generate_large_dataset(self):
        """Large dataset for performance testing"""
        n = 100000
        
        df = pd.DataFrame({
            'id': range(n),
            'timestamp': pd.date_range('2020-01-01', periods=n, freq='T'),
            'value': np.random.randn(n),
            'category': np.random.choice(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], n),
            'subcategory': np.random.choice([f"Sub{i}" for i in range(20)], n),
            'amount': np.random.uniform(0, 10000, n),
            'quantity': np.random.randint(1, 100, n),
            'status': np.random.choice(['Active', 'Pending', 'Completed', 'Cancelled'], n),
            'region': np.random.choice(['North', 'South', 'East', 'West', 'Central'], n),
            'user_id': np.random.randint(1, 10000, n),
        })
        
        return df
    
    def generate_time_series(self):
        """Time series data with trends and seasonality"""
        dates = pd.date_range('2020-01-01', '2024-12-31', freq='D')
        n = len(dates)
        
        # Create trend
        trend = np.linspace(100, 200, n)
        
        # Create seasonality (yearly)
        seasonality = 20 * np.sin(2 * np.pi * np.arange(n) / 365)
        
        # Add noise
        noise = np.random.randn(n) * 5
        
        # Combine
        values = trend + seasonality + noise
        
        df = pd.DataFrame({
            'date': dates,
            'value': values,
            'moving_avg_7': pd.Series(values).rolling(7).mean(),
            'moving_avg_30': pd.Series(values).rolling(30).mean(),
            'day_of_week': dates.dayofweek,
            'month': dates.month,
            'quarter': dates.quarter,
            'year': dates.year,
        })
        
        return df
    
    def generate_categorical(self):
        """Categorical data with various cardinalities"""
        n = 5000
        
        df = pd.DataFrame({
            # Binary
            'binary': np.random.choice(['Yes', 'No'], n),
            
            # Low cardinality
            'low_card': np.random.choice(['A', 'B', 'C', 'D'], n),
            
            # Medium cardinality
            'medium_card': np.random.choice([f"Cat_{i}" for i in range(20)], n),
            
            # High cardinality
            'high_card': np.random.choice([f"Item_{i}" for i in range(200)], n),
            
            # Very high cardinality (almost unique)
            'very_high_card': [f"ID_{random.randint(1, 4000)}" for _ in range(n)],
            
            # Ordinal
            'size': np.random.choice(['XS', 'S', 'M', 'L', 'XL'], n),
            'priority': np.random.choice(['Low', 'Medium', 'High', 'Critical'], n),
            'rating': np.random.choice(['1 Star', '2 Stars', '3 Stars', '4 Stars', '5 Stars'], n),
        })
        
        return df
    
    def generate_financial(self):
        """Financial data"""
        dates = pd.date_range('2023-01-01', '2024-12-31', freq='D')
        n = len(dates)
        
        # Generate stock-like data
        returns = np.random.randn(n) * 0.02
        price = 100 * np.exp(np.cumsum(returns))
        
        df = pd.DataFrame({
            'date': dates,
            'open': price * np.random.uniform(0.98, 1.02, n),
            'high': price * np.random.uniform(1.00, 1.05, n),
            'low': price * np.random.uniform(0.95, 1.00, n),
            'close': price,
            'volume': np.random.randint(1000000, 10000000, n),
            'market_cap': price * np.random.uniform(1e9, 1e10, n),
            'pe_ratio': np.random.uniform(10, 50, n),
            'dividend_yield': np.random.uniform(0, 5, n),
        })
        
        return df
    
    def generate_geographic(self):
        """Geographic data"""
        n = 1000
        
        # US cities (approximate coordinates)
        cities = {
            'New York': (40.7128, -74.0060),
            'Los Angeles': (34.0522, -118.2437),
            'Chicago': (41.8781, -87.6298),
            'Houston': (29.7604, -95.3698),
            'Phoenix': (33.4484, -112.0740),
            'Philadelphia': (39.9526, -75.1652),
            'San Antonio': (29.4241, -98.4936),
            'San Diego': (32.7157, -117.1611),
            'Dallas': (32.7767, -96.7970),
            'San Jose': (37.3382, -121.8863),
        }
        
        city_names = list(cities.keys())
        selected_cities = np.random.choice(city_names, n)
        
        df = pd.DataFrame({
            'city': selected_cities,
            'latitude': [cities[city][0] + np.random.uniform(-0.5, 0.5) for city in selected_cities],
            'longitude': [cities[city][1] + np.random.uniform(-0.5, 0.5) for city in selected_cities],
            'population': np.random.randint(10000, 10000000, n),
            'area_sq_km': np.random.uniform(50, 5000, n),
            'elevation_m': np.random.uniform(0, 2000, n),
            'temperature_c': np.random.uniform(-10, 40, n),
            'humidity_percent': np.random.uniform(20, 90, n),
        })
        
        return df
    
    def generate_messy_data(self):
        """Real-world messy data"""
        n = 500
        
        df = pd.DataFrame({
            # Inconsistent date formats
            'date': [
                '2024-01-15' if i % 3 == 0 else
                '01/15/2024' if i % 3 == 1 else
                '15-Jan-2024'
                for i in range(n)
            ],
            
            # Inconsistent currency
            'price': [
                f"${random.uniform(10, 1000):.2f}" if i % 3 == 0 else
                f"€{random.uniform(10, 1000):.2f}" if i % 3 == 1 else
                f"{random.uniform(10, 1000):.2f}"
                for i in range(n)
            ],
            
            # Mixed boolean representations
            'active': np.random.choice(['true', 'false', 'True', 'False', '1', '0', 'yes', 'no', 'Y', 'N'], n),
            
            # Phone numbers in various formats
            'phone': [
                f"555-{random.randint(100, 999)}-{random.randint(1000, 9999)}" if i % 4 == 0 else
                f"(555) {random.randint(100, 999)}-{random.randint(1000, 9999)}" if i % 4 == 1 else
                f"+1 555 {random.randint(100, 999)} {random.randint(1000, 9999)}" if i % 4 == 2 else
                f"555{random.randint(1000000, 9999999)}"
                for i in range(n)
            ],
            
            # Trailing/leading spaces
            'name': [f"  Name {i}  " if i % 5 == 0 else f"Name {i}" for i in range(n)],
            
            # Case inconsistencies
            'category': [
                'category a' if i % 3 == 0 else
                'Category A' if i % 3 == 1 else
                'CATEGORY A'
                for i in range(n)
            ],
            
            # Null representations
            'value': [
                None if i % 10 == 0 else
                'NULL' if i % 10 == 1 else
                'N/A' if i % 10 == 2 else
                '' if i % 10 == 3 else
                random.randint(1, 100)
                for i in range(n)
            ],
        })
        
        return df
    
    def generate_unicode_data(self):
        """Data with international characters"""
        n = 500
        
        names = ['João Silva', 'María García', 'François Dubois', 'Hans Müller', 
                'Yuki Tanaka', '李明', 'محمد علی', 'Владимир Петров']
        
        cities = ['São Paulo', 'Montréal', 'München', 'Tokyo', 'Beijing', 
                 'القاهرة', 'Москва', 'Zürich']
        
        df = pd.DataFrame({
            'name': np.random.choice(names, n),
            'city': np.random.choice(cities, n),
            'description': [f"Product {i}: Special chars àáâãäåæçèé" for i in range(n)],
            'emoji': np.random.choice(['😀', '🎉', '✨', '🚀', '💡'], n),
            'value': np.random.uniform(0, 1000, n),
        })
        
        return df

if __name__ == '__main__':
    import os
    
    # Create output directory
    os.makedirs('test_data', exist_ok=True)
    
    # Generate all test datasets
    generator = TestDataGenerator()
    generator.generate_all()
    
    print("\n✓ All test datasets generated successfully!")
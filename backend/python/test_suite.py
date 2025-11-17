#!/usr/bin/env python3
"""
Comprehensive test suite for Expert BI Python components
"""

import sys
import os
import json
import pandas as pd
import unittest
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

class TestTypeDetection(unittest.TestCase):
    """Test type detection functionality"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test data"""
        from type_detector import TypeDetector
        cls.TypeDetector = TypeDetector
        cls.test_data_dir = Path(__file__).parent / 'test_data'
        
    def test_basic_sales_detection(self):
        """Test type detection on basic sales data"""
        csv_path = str(self.test_data_dir / 'basic_sales.csv')
        detector = self.TypeDetector(csv_path, 1)
        detector.load_data()
        result = detector.detect_all_types()
        
        self.assertIn('columns', result)
        self.assertIn('date', result['columns'])
        self.assertEqual(result['columns']['date']['detected_type'], 'date')
        self.assertEqual(result['columns']['quantity']['detected_type'], 'numeric')
        self.assertEqual(result['columns']['region']['detected_type'], 'categorical')
    
    def test_mixed_types_detection(self):
        """Test detection of various data types"""
        csv_path = str(self.test_data_dir / 'mixed_types.csv')
        detector = self.TypeDetector(csv_path, 2)
        detector.load_data()
        result = detector.detect_all_types()
        
        # Check specific types
        self.assertEqual(result['columns']['email']['detected_type'], 'email')
        self.assertEqual(result['columns']['url']['detected_type'], 'url')
        self.assertEqual(result['columns']['phone']['detected_type'], 'phone')
        self.assertEqual(result['columns']['currency']['detected_type'], 'currency')
        self.assertEqual(result['columns']['percentage']['detected_type'], 'percentage')
        self.assertEqual(result['columns']['is_active']['detected_type'], 'boolean')
    
    def test_edge_cases(self):
        """Test handling of edge cases"""
        csv_path = str(self.test_data_dir / 'edge_cases.csv')
        detector = self.TypeDetector(csv_path, 3)
        detector.load_data()
        result = detector.detect_all_types()
        
        # Check null handling
        self.assertEqual(result['columns']['all_nulls']['detected_type'], 'empty')
        self.assertGreater(result['columns']['mostly_nulls']['null_percentage'], 50)
        
        # Check constant value
        self.assertEqual(result['columns']['constant']['unique_count'], 1)
    
    def test_large_dataset(self):
        """Test performance with large dataset"""
        csv_path = str(self.test_data_dir / 'large_dataset.csv')
        detector = self.TypeDetector(csv_path, 4)
        detector.load_data()
        result = detector.detect_all_types()
        
        self.assertEqual(result['total_columns'], 10)
        self.assertIsNotNone(result['summary'])

class TestInsightGeneration(unittest.TestCase):
    """Test insight generation"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test data"""
        from insight_generator import InsightGenerator
        cls.InsightGenerator = InsightGenerator
        cls.test_data_dir = Path(__file__).parent / 'test_data'
    
    def test_trend_detection(self):
        """Test trend detection in time series"""
        csv_path = str(self.test_data_dir / 'time_series.csv')
        generator = self.InsightGenerator(csv_path, 5, 1)
        generator.load_data()
        insights = generator.generate_all_insights()
        
        # Should detect trends
        trend_insights = [i for i in insights['insights'] if i['type'] == 'trend']
        self.assertGreater(len(trend_insights), 0)
    
    def test_outlier_detection(self):
        """Test outlier detection"""
        csv_path = str(self.test_data_dir / 'basic_sales.csv')
        generator = self.InsightGenerator(csv_path, 6, 1)
        generator.load_data()
        insights = generator.generate_all_insights()
        
        # Check for outlier insights
        self.assertIn('insights', insights)
        self.assertGreater(insights['total_insights'], 0)
    
    def test_correlation_detection(self):
        """Test correlation detection"""
        csv_path = str(self.test_data_dir / 'financial_data.csv')
        generator = self.InsightGenerator(csv_path, 7, 1)
        generator.load_data()
        insights = generator.generate_all_insights()
        
        # Should find correlations
        corr_insights = [i for i in insights['insights'] if i['type'] == 'correlation']
        self.assertGreater(len(corr_insights), 0)

class TestDataProfiling(unittest.TestCase):
    """Test data profiling functionality"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test data"""
        from data_profiler import DataProfiler
        cls.DataProfiler = DataProfiler
        cls.test_data_dir = Path(__file__).parent / 'test_data'
    
    def test_basic_profiling(self):
        """Test basic data profiling"""
        csv_path = str(self.test_data_dir / 'basic_sales.csv')
        profiler = self.DataProfiler(csv_path, 8)
        profiler.load_data()
        profile = profiler.profile_dataset()
        
        self.assertIn('row_count', profile)
        self.assertIn('column_count', profile)
        self.assertIn('columns', profile)
        self.assertGreater(profile['row_count'], 0)
    
    def test_statistical_summary(self):
        """Test statistical summaries"""
        csv_path = str(self.test_data_dir / 'mixed_types.csv')
        profiler = self.DataProfiler(csv_path, 9)
        profiler.load_data()
        profile = profiler.profile_dataset()
        
        # Check numeric columns have stats
        numeric_cols = [col for col, info in profile['columns'].items() 
                       if 'statistics' in info]
        self.assertGreater(len(numeric_cols), 0)

class TestErrorHandling(unittest.TestCase):
    """Test error handling"""
    
    def test_missing_file(self):
        """Test handling of missing file"""
        from type_detector import TypeDetector
        
        with self.assertRaises(Exception):
            detector = TypeDetector('nonexistent.csv', 99)
            detector.load_data()
    
    def test_malformed_csv(self):
        """Test handling of malformed CSV"""
        # Create a malformed CSV
        test_file = Path(__file__).parent / 'test_data' / 'malformed.csv'
        with open(test_file, 'w') as f:
            f.write("col1,col2\n")
            f.write("value1\n")  # Missing column
            f.write("value2,value3,value4\n")  # Extra column
        
        # This should not crash
        from type_detector import TypeDetector
        try:
            detector = TypeDetector(str(test_file), 98)
            detector.load_data()
        except Exception as e:
            # Should handle gracefully
            self.assertIsNotNone(str(e))

def run_tests():
    """Run all tests"""
    # Create test data first
    print("Generating test data...")
    from generate_test_data import TestDataGenerator
    generator = TestDataGenerator()
    generator.generate_all()
    
    print("\nRunning tests...\n")
    
    # Run tests
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    suite.addTests(loader.loadTestsFromTestCase(TestTypeDetection))
    suite.addTests(loader.loadTestsFromTestCase(TestInsightGeneration))
    suite.addTests(loader.loadTestsFromTestCase(TestDataProfiling))
    suite.addTests(loader.loadTestsFromTestCase(TestErrorHandling))
    
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Summary
    print("\n" + "="*70)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    print("="*70)
    
    return result.wasSuccessful()

if __name__ == '__main__':
    success = run_tests()
    sys.exit(0 if success else 1)
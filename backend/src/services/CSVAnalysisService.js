const { parse } = require('csv-parse/sync');
const stats = require('simple-statistics');

class CSVAnalysisService {
  static async parseCSV(csvText) {
    try {
      const records = parse(csvText, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        auto_parse: false // Keep values as strings for better type detection
      });
      return records;
    } catch (error) {
      throw new Error(`CSV parsing failed: ${error.message}`);
    }
  }

  static detectColumnType(values) {
    const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '').map(String);
    if (nonEmpty.length === 0) return 'string';

    // Check for boolean
    const uniqueValues = [...new Set(nonEmpty.map(v => v.toLowerCase()))];
    if (uniqueValues.length <= 2 && 
        uniqueValues.every(v => ['true', 'false', '1', '0', 'yes', 'no', 'y', 'n'].includes(v))) {
      return 'boolean';
    }

    // Check for numbers
    const numberValues = nonEmpty.filter(v => {
      const num = parseFloat(v);
      return !isNaN(num) && isFinite(num);
    });
    
    if (numberValues.length / nonEmpty.length > 0.8) {
      return 'number';
    }

    // Check for dates
    const dateValues = nonEmpty.filter(v => {
      const date = new Date(v);
      return !isNaN(date.getTime());
    });
    
    if (dateValues.length / nonEmpty.length > 0.8) {
      return 'date';
    }

    return 'string';
  }

  static calculateNumericalStats(values) {
    const numericValues = values
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v) && isFinite(v));

    if (numericValues.length === 0) return null;

    try {
      return {
        mean: parseFloat(stats.mean(numericValues).toFixed(2)),
        median: parseFloat(stats.median(numericValues).toFixed(2)),
        std: parseFloat(stats.standardDeviation(numericValues).toFixed(2)),
        min: Math.min(...numericValues),
        max: Math.max(...numericValues),
        q1: parseFloat(stats.quantile(numericValues, 0.25).toFixed(2)),
        q3: parseFloat(stats.quantile(numericValues, 0.75).toFixed(2)),
        count: numericValues.length,
        nullCount: values.length - numericValues.length
      };
    } catch (error) {
      console.warn('Error calculating numerical stats:', error.message);
      return null;
    }
  }

  static calculateCategoricalStats(values) {
    const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');
    const counts = {};
    
    nonEmpty.forEach(value => {
      const key = String(value);
      counts[key] = (counts[key] || 0) + 1;
    });

    // Sort by frequency and take top 20
    const sortedCounts = Object.entries(counts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 20)
      .reduce((obj, [key, value]) => {
        obj[key] = value;
        return obj;
      }, {});

    return {
      counts: sortedCounts,
      uniqueCount: Object.keys(counts).length,
      totalCount: nonEmpty.length,
      nullCount: values.length - nonEmpty.length,
      mostFrequent: Object.keys(counts).length > 0 ? 
        Object.entries(counts).sort(([,a], [,b]) => b - a)[0] : null
    };
  }

  static generateInsights(columns, rowCount) {
    const insights = [];
    
    insights.push(`Dataset contains ${rowCount.toLocaleString()} rows and ${columns.length} columns`);

    const numColumns = columns.filter(c => c.type === 'number').length;
    const catColumns = columns.filter(c => c.type === 'string').length;
    const dateColumns = columns.filter(c => c.type === 'date').length;
    const boolColumns = columns.filter(c => c.type === 'boolean').length;

    if (numColumns > 0) {
      insights.push(`Found ${numColumns} numerical column${numColumns > 1 ? 's' : ''} suitable for statistical analysis`);
    }
    
    if (catColumns > 0) {
      insights.push(`Found ${catColumns} categorical column${catColumns > 1 ? 's' : ''} for grouping and classification`);
    }

    if (dateColumns > 0) {
      insights.push(`Found ${dateColumns} date column${dateColumns > 1 ? 's' : ''} for time-series analysis`);
    }

    if (boolColumns > 0) {
      insights.push(`Found ${boolColumns} boolean column${boolColumns > 1 ? 's' : ''} for binary analysis`);
    }

    const missingDataColumns = columns.filter(c => c.missing > 0);
    if (missingDataColumns.length > 0) {
      const totalMissing = missingDataColumns.reduce((sum, col) => sum + col.missing, 0);
      insights.push(`${missingDataColumns.length} column${missingDataColumns.length > 1 ? 's' : ''} have missing values (${totalMissing} total missing values)`);
    }

    // Quality insights
    const highCardinalityColumns = columns.filter(c => c.type === 'string' && c.unique / rowCount > 0.9);
    if (highCardinalityColumns.length > 0) {
      insights.push(`${highCardinalityColumns.length} column${highCardinalityColumns.length > 1 ? 's' : ''} have high cardinality (may be unique identifiers)`);
    }

    const lowVarianceColumns = columns.filter(c => c.type === 'number' && c.unique < 5);
    if (lowVarianceColumns.length > 0) {
      insights.push(`${lowVarianceColumns.length} numerical column${lowVarianceColumns.length > 1 ? 's' : ''} have low variance (fewer than 5 unique values)`);
    }

    return insights;
  }

  static createHistogramData(values, bins = 10) {
    const numericValues = values
      .map(v => parseFloat(v))
      .filter(v => !isNaN(v) && isFinite(v));

    if (numericValues.length === 0) return [];

    const min = Math.min(...numericValues);
    const max = Math.max(...numericValues);
    const binSize = (max - min) / bins;

    const binData = Array.from({ length: bins }, (_, i) => ({
      range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
      count: 0,
      binStart: min + i * binSize,
      binEnd: min + (i + 1) * binSize
    }));

    numericValues.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), bins - 1);
      binData[binIndex].count++;
    });

    return binData;
  }

  static generateChartData(data, columns) {
    const charts = [];

    // Generate bar charts for categorical data
    columns.filter(col => col.type === 'string' && col.unique <= 20).forEach(col => {
      const values = data.map(row => row[col.name]);
      const categoricalStats = this.calculateCategoricalStats(values);
      
      if (Object.keys(categoricalStats.counts).length > 1) {
        charts.push({
          type: 'bar',
          title: `Distribution of ${col.name}`,
          data: Object.entries(categoricalStats.counts).map(([name, value]) => ({ name, value })),
          xKey: 'name',
          yKey: 'value'
        });
      }
    });

    // Generate histograms for numerical data
    columns.filter(col => col.type === 'number').forEach(col => {
      const values = data.map(row => row[col.name]);
      const histogramData = this.createHistogramData(values);
      
      if (histogramData.length > 0) {
        charts.push({
          type: 'bar',
          title: `Distribution of ${col.name}`,
          data: histogramData,
          xKey: 'range',
          yKey: 'count'
        });
      }
    });

    // Generate scatter plots for numerical pairs
    const numCols = columns.filter(c => c.type === 'number').slice(0, 3); // Limit to first 3 numerical columns
    for (let i = 0; i < numCols.length - 1; i++) {
      for (let j = i + 1; j < numCols.length; j++) {
        const xCol = numCols[i];
        const yCol = numCols[j];
        
        const scatterData = data
          .map(row => ({
            x: parseFloat(row[xCol.name]),
            y: parseFloat(row[yCol.name])
          }))
          .filter(d => !isNaN(d.x) && !isNaN(d.y) && isFinite(d.x) && isFinite(d.y))
          .slice(0, 1000); // Limit points for performance

        if (scatterData.length > 10) {
          charts.push({
            type: 'scatter',
            title: `${xCol.name} vs ${yCol.name}`,
            data: scatterData,
            xKey: 'x',
            yKey: 'y'
          });
        }
      }
    }

    return charts;
  }

  static async analyze(csvText) {
    try {
      const data = await this.parseCSV(csvText);
      
      if (!data || data.length === 0) {
        throw new Error('No data found in CSV file');
      }

      const columnNames = Object.keys(data[0]);
      const columns = [];
      const numericalSummary = {};
      const categoricalSummary = {};

      // Analyze each column
      for (const colName of columnNames) {
        const values = data.map(row => row[colName]);
        const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');
        const type = this.detectColumnType(values);
        
        const columnInfo = {
          name: colName,
          type,
          unique: new Set(nonEmpty.map(String)).size,
          missing: values.length - nonEmpty.length,
          sample: nonEmpty.slice(0, 5)
        };

        columns.push(columnInfo);

        if (type === 'number') {
          const stats = this.calculateNumericalStats(values);
          if (stats) {
            numericalSummary[colName] = stats;
          }
        } else {
          const stats = this.calculateCategoricalStats(values);
          categoricalSummary[colName] = stats;
        }
      }

      // Generate insights
      const insights = this.generateInsights(columns, data.length);

      // Generate chart data
      const chartData = this.generateChartData(data, columns);

      return {
        columns,
        rowCount: data.length,
        summary: {
          numerical: numericalSummary,
          categorical: categoricalSummary,
          correlations: {} // Could be implemented for advanced analysis
        },
        insights,
        chartData,
        dataQuality: {
          completeness: (columns.reduce((sum, col) => sum + (1 - col.missing / data.length), 0) / columns.length * 100).toFixed(1),
          totalMissingValues: columns.reduce((sum, col) => sum + col.missing, 0)
        }
      };
    } catch (error) {
      throw new Error(`Analysis failed: ${error.message}`);
    }
  }
}

module.exports = CSVAnalysisService;
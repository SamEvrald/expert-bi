export interface ColumnInfo {
  name: string;
  type: 'number' | 'string' | 'date' | 'boolean';
  unique: number;
  missing: number;
  sample: any[];
}

export interface AnalysisResult {
  columns: ColumnInfo[];
  rowCount: number;
  summary: {
    numerical: { [key: string]: { mean: number; median: number; std: number; min: number; max: number } };
    categorical: { [key: string]: { [value: string]: number } };
    correlations: { [key: string]: { [key: string]: number } };
  };
  insights: string[];
  chartData: ChartData[];
}

export interface ChartData {
  type: 'bar' | 'line' | 'pie' | 'scatter' | 'histogram';
  title: string;
  data: any[];
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
}

export class CSVAnalyzer {
  static parseCSV(csvText: string): any[] {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/['"]/g, ''));
    
    return lines.slice(1).map(line => {
      const values = line.split(',').map(v => v.trim().replace(/['"]/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    });
  }
  
  static detectColumnType(values: any[]): 'number' | 'string' | 'date' | 'boolean' {
    const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');
    if (nonEmpty.length === 0) return 'string';
    
    // Check for boolean
    const uniqueValues = [...new Set(nonEmpty.map(v => String(v).toLowerCase()))];
    if (uniqueValues.length <= 2 && uniqueValues.every(v => ['true', 'false', '1', '0', 'yes', 'no'].includes(v))) {
      return 'boolean';
    }
    
    // Check for numbers
    const numberCount = nonEmpty.filter(v => !isNaN(Number(v)) && v !== '').length;
    if (numberCount / nonEmpty.length > 0.8) return 'number';
    
    // Check for dates
    const dateCount = nonEmpty.filter(v => !isNaN(Date.parse(v))).length;
    if (dateCount / nonEmpty.length > 0.8) return 'date';
    
    return 'string';
  }
  
  static analyze(data: any[]): AnalysisResult {
    if (!data.length) throw new Error('No data to analyze');
    
    const columns = Object.keys(data[0]);
    const columnInfo: ColumnInfo[] = [];
    const numericalSummary: any = {};
    const categoricalSummary: any = {};
    const correlations: any = {};
    
    // Analyze each column
    columns.forEach(col => {
      const values = data.map(row => row[col]);
      const nonEmpty = values.filter(v => v !== null && v !== undefined && v !== '');
      const type = this.detectColumnType(values);
      
      columnInfo.push({
        name: col,
        type,
        unique: new Set(nonEmpty).size,
        missing: values.length - nonEmpty.length,
        sample: nonEmpty.slice(0, 5)
      });
      
      if (type === 'number') {
        const numValues = nonEmpty.map(v => Number(v)).filter(v => !isNaN(v));
        if (numValues.length > 0) {
          numValues.sort((a, b) => a - b);
          const sum = numValues.reduce((a, b) => a + b, 0);
          const mean = sum / numValues.length;
          const median = numValues[Math.floor(numValues.length / 2)];
          const variance = numValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / numValues.length;
          
          numericalSummary[col] = {
            mean: Number(mean.toFixed(2)),
            median,
            std: Number(Math.sqrt(variance).toFixed(2)),
            min: numValues[0],
            max: numValues[numValues.length - 1]
          };
        }
      } else if (type === 'string') {
        const counts: any = {};
        nonEmpty.forEach(v => {
          counts[v] = (counts[v] || 0) + 1;
        });
        categoricalSummary[col] = counts;
      }
    });
    
    // Generate insights
    const insights: string[] = [];
    insights.push(`Dataset contains ${data.length} rows and ${columns.length} columns`);
    
    const numColumns = columnInfo.filter(c => c.type === 'number').length;
    const catColumns = columnInfo.filter(c => c.type === 'string').length;
    
    if (numColumns > 0) insights.push(`${numColumns} numerical columns detected`);
    if (catColumns > 0) insights.push(`${catColumns} categorical columns detected`);
    
    const missingData = columnInfo.filter(c => c.missing > 0);
    if (missingData.length > 0) {
      insights.push(`${missingData.length} columns have missing values`);
    }
    
    // Generate chart data
    const chartData = this.generateCharts(data, columnInfo, numericalSummary, categoricalSummary);
    
    return {
      columns: columnInfo,
      rowCount: data.length,
      summary: { numerical: numericalSummary, categorical: categoricalSummary, correlations },
      insights,
      chartData
    };
  }
  
  private static generateCharts(data: any[], columns: ColumnInfo[], numerical: any, categorical: any): ChartData[] {
    const charts: ChartData[] = [];
    
    // Bar charts for categorical data (top 10 values)
    Object.entries(categorical).forEach(([col, counts]) => {
      const sortedEntries = Object.entries(counts as any).sort(([,a], [,b]) => (b as number) - (a as number)).slice(0, 10);
      if (sortedEntries.length > 1) {
        charts.push({
          type: 'bar',
          title: `Distribution of ${col}`,
          data: sortedEntries.map(([name, value]) => ({ name, value })),
          xKey: 'name',
          yKey: 'value'
        });
      }
    });
    
    // Histograms for numerical data
    Object.keys(numerical).forEach(col => {
      const values = data.map(row => Number(row[col])).filter(v => !isNaN(v));
      if (values.length > 10) {
        const bins = this.createHistogramBins(values, 10);
        charts.push({
          type: 'bar',
          title: `Distribution of ${col}`,
          data: bins,
          xKey: 'range',
          yKey: 'count'
        });
      }
    });
    
    // Scatter plots for numerical pairs
    const numCols = columns.filter(c => c.type === 'number').map(c => c.name);
    if (numCols.length >= 2) {
      charts.push({
        type: 'scatter',
        title: `${numCols[0]} vs ${numCols[1]}`,
        data: data.map(row => ({
          x: Number(row[numCols[0]]),
          y: Number(row[numCols[1]])
        })).filter(d => !isNaN(d.x) && !isNaN(d.y)),
        xKey: 'x',
        yKey: 'y'
      });
    }
    
    return charts;
  }
  
  private static createHistogramBins(values: number[], binCount: number) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / binCount;
    
    const bins = Array.from({ length: binCount }, (_, i) => ({
      range: `${(min + i * binSize).toFixed(1)}-${(min + (i + 1) * binSize).toFixed(1)}`,
      count: 0
    }));
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
      bins[binIndex].count++;
    });
    
    return bins;
  }
}
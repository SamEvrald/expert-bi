export interface BasicStatistics {
  min: number;
  max: number;
  mean: number;
  median: number;
  stdDev: number;
  variance: number;
  quartiles: {
    q1: number;
    q2: number;
    q3: number;
  };
}

export class StatisticalAnalysisService {
  /**
   * Calculate basic statistics for numerical data
   */
  static calculateBasicStatistics(values: number[]): BasicStatistics {
    if (values.length === 0) {
      throw new Error('Cannot calculate statistics for empty array');
    }

    const sortedValues = [...values].sort((a, b) => a - b);
    const n = values.length;
    
    // Basic calculations
    const min = Math.min(...values);
    const max = Math.max(...values);
    const sum = values.reduce((acc, val) => acc + val, 0);
    const mean = sum / n;
    
    // Median
    const median = n % 2 === 0 
      ? (sortedValues[n / 2 - 1] + sortedValues[n / 2]) / 2
      : sortedValues[Math.floor(n / 2)];

    // Variance and standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);

    // Quartiles
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const quartiles = {
      q1: sortedValues[q1Index],
      q2: median,
      q3: sortedValues[q3Index]
    };

    return {
      min,
      max,
      mean,
      median,
      stdDev,
      variance,
      quartiles
    };
  }

  /**
   * Detect outliers using IQR method
   */
  static detectOutliers(values: number[]): number[] {
    const stats = this.calculateBasicStatistics(values);
    const { q1, q3 } = stats.quartiles;
    const iqr = q3 - q1;
    const lowerBound = q1 - 1.5 * iqr;
    const upperBound = q3 + 1.5 * iqr;

    return values.filter(val => val < lowerBound || val > upperBound);
  }

  /**
   * Calculate correlation between two numerical arrays
   */
  static calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) {
      throw new Error('Arrays must have the same non-zero length');
    }

    const n = x.length;
    const xMean = x.reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.reduce((sum, val) => sum + val, 0) / n;

    let numerator = 0;
    let xSumSquares = 0;
    let ySumSquares = 0;

    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      
      numerator += xDiff * yDiff;
      xSumSquares += xDiff * xDiff;
      ySumSquares += yDiff * yDiff;
    }

    const denominator = Math.sqrt(xSumSquares * ySumSquares);
    return denominator === 0 ? 0 : numerator / denominator;
  }

  /**
   * Calculate frequency distribution for categorical data
   */
  static calculateFrequencyDistribution(values: any[]): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    values.forEach(val => {
      const key = String(val);
      frequency[key] = (frequency[key] || 0) + 1;
    });

    return frequency;
  }

  /**
   * Calculate entropy for categorical data
   */
  static calculateEntropy(values: any[]): number {
    const frequency = this.calculateFrequencyDistribution(values);
    const total = values.length;
    
    let entropy = 0;
    Object.values(frequency).forEach(count => {
      const probability = count / total;
      if (probability > 0) {
        entropy -= probability * Math.log2(probability);
      }
    });

    return entropy;
  }
}
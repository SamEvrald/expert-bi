import { spawn } from 'child_process';
import path from 'path';

export interface PythonResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export class PythonBridge {
  private static pythonPath = process.env.PYTHON_PATH || 'python3';
  private static scriptsDir = path.join(__dirname, '../../python');

  /**
   * Execute a Python script with arguments
   */
  static async executePython(scriptName: string, args: string[] = []): Promise<PythonResponse> {
    return new Promise((resolve) => {
      const scriptPath = path.join(this.scriptsDir, scriptName);
      const pythonProcess = spawn(this.pythonPath, [scriptPath, ...args]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          resolve({
            success: false,
            error: stderr || `Python script exited with code ${code}`
          });
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve({
            success: true,
            data: result
          });
        } catch (error) {
          resolve({
            success: false,
            error: `Failed to parse Python output: ${error}`
          });
        }
      });

      pythonProcess.on('error', (error) => {
        resolve({
          success: false,
          error: `Failed to start Python process: ${error.message}`
        });
      });
    });
  }

  /**
   * Test Python connection
   */
  static async testConnection(): Promise<PythonResponse> {
    return this.executePython('test_connection.py');
  }

  /**
   * Generate insights for a dataset
   */
  static async generateInsights(
    datasetPath: string,
    datasetId: number,
    userId: number
  ): Promise<PythonResponse> {
    return this.executePython('insight_generator.py', [
      datasetPath,
      String(datasetId),
      String(userId)
    ]);
  }

  /**
   * Profile data (get statistics)
   */
  static async profileData(
    datasetPath: string,
    datasetId: number
  ): Promise<PythonResponse> {
    return this.executePython('data_profiler.py', [
      datasetPath,
      String(datasetId)
    ]);
  }

  /**
   * Get chart recommendations
   */
  static async getChartRecommendations(
    datasetPath: string,
    datasetId: number
  ): Promise<PythonResponse> {
    return this.executePython('chart_recommender.py', [
      datasetPath,
      String(datasetId)
    ]);
  }

  /**
   * Find correlations in data
   */
  static async findCorrelations(
    datasetPath: string,
    threshold: number = 0.7
  ): Promise<PythonResponse> {
    return this.executePython('correlation_finder.py', [
      datasetPath,
      String(threshold)
    ]);
  }

  /**
   * Detect anomalies in data
   */
  static async detectAnomalies(
    datasetPath: string,
    columnName: string,
    method: string = 'zscore'
  ): Promise<PythonResponse> {
    return this.executePython('anomaly_detector.py', [
      datasetPath,
      columnName,
      method
    ]);
  }

  /**
   * Predict missing values
   */
  static async predictMissingValues(
    datasetPath: string,
    columnName: string
  ): Promise<PythonResponse> {
    return this.executePython('missing_value_predictor.py', [
      datasetPath,
      columnName
    ]);
  }

  /**
   * Detect column types
   */
  static async detectColumnTypes(
    datasetPath: string,
    datasetId: number
  ): Promise<PythonResponse> {
    return this.executePython('type_detector.py', [
      datasetPath,
      String(datasetId)
    ]);
  }

  /**
   * Generate SQL query from natural language
   */
  static async generateSQLFromNL(
    question: string,
    schema: Record<string, string[]>
  ): Promise<PythonResponse> {
    return this.executePython('nl_to_sql.py', [
      question,
      JSON.stringify(schema)
    ]);
  }

  /**
   * Clean and preprocess data
   */
  static async cleanData(
    datasetPath: string,
    options: Record<string, any>
  ): Promise<PythonResponse> {
    return this.executePython('data_cleaner.py', [
      datasetPath,
      JSON.stringify(options)
    ]);
  }
}
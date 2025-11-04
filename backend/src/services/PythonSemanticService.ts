import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface SemanticClassification {
  column_name: string;
  original_type: string;
  semantic_type: string;
  confidence: number;
  method: string;
}

export interface SemanticAnalysisResult {
  dataset_id: number;
  classifications: SemanticClassification[];
  timestamp: string;
}

export interface ColumnData {
  name: string;
  type: string;
  sample_values: any[];
}

export class PythonSemanticService {
  private static readonly PYTHON_SCRIPT_PATH = path.join(__dirname, '../../python/semantic_analyzer.py');
  private static readonly TEMP_DIR = path.join(__dirname, '../../temp');

  /**
   * Initialize service (ensure temp directory exists)
   */
  static async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.TEMP_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create temp directory:', error);
    }
  }

  /**
   * Perform semantic analysis on columns
   */
  static async analyzeColumns(
    datasetId: number, 
    columns: ColumnData[]
  ): Promise<SemanticAnalysisResult> {
    await this.initialize();

    const inputId = uuidv4();
    const inputFile = path.join(this.TEMP_DIR, `input_${inputId}.json`);
    const outputFile = path.join(this.TEMP_DIR, `output_${inputId}.json`);

    try {
      // Prepare input data
      const inputData = {
        dataset_id: datasetId,
        columns: columns
      };

      // Write input file
      await fs.writeFile(inputFile, JSON.stringify(inputData, null, 2));

      // Run Python script
      const result = await this.runPythonScript(inputFile, outputFile);

      // Read output file
      const outputData = await fs.readFile(outputFile, 'utf-8');
      const analysisResult: SemanticAnalysisResult = JSON.parse(outputData);

      return analysisResult;

    } catch (error) {
      console.error('Semantic analysis error:', error);
      throw new Error(`Semantic analysis failed: ${error}`);
    } finally {
      // Cleanup temporary files
      await this.cleanup([inputFile, outputFile]);
    }
  }

  /**
   * Run Python semantic analysis script
   */
  private static async runPythonScript(inputFile: string, outputFile: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn('python3', [
        this.PYTHON_SCRIPT_PATH,
        '--input', inputFile,
        '--output', outputFile
      ]);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Python semantic analysis completed:', stdout);
          resolve();
        } else {
          console.error('Python script error:', stderr);
          reject(new Error(`Python script failed with code ${code}: ${stderr}`));
        }
      });

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`));
      });

      // Set timeout for long-running processes
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Python script timeout'));
      }, 60000); // 60 seconds timeout
    });
  }

  /**
   * Cleanup temporary files
   */
  private static async cleanup(files: string[]): Promise<void> {
    await Promise.all(
      files.map(async (file) => {
        try {
          await fs.unlink(file);
        } catch (error) {
          console.warn(`Failed to cleanup file ${file}:`, error);
        }
      })
    );
  }

  /**
   * Check if Python environment is available
   */
  static async checkPythonEnvironment(): Promise<boolean> {
    return new Promise((resolve) => {
      const pythonProcess = spawn('python3', ['--version']);
      
      pythonProcess.on('close', (code) => {
        resolve(code === 0);
      });

      pythonProcess.on('error', () => {
        resolve(false);
      });
    });
  }

  /**
   * Install Python dependencies
   */
  static async installDependencies(): Promise<void> {
    const requirementsPath = path.join(__dirname, '../../python/requirements.txt');
    
    return new Promise((resolve, reject) => {
      const pipProcess = spawn('pip3', ['install', '-r', requirementsPath]);
      
      let stderr = '';
      
      pipProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pipProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Python dependencies installed successfully');
          resolve();
        } else {
          reject(new Error(`Failed to install Python dependencies: ${stderr}`));
        }
      });

      pipProcess.on('error', (error) => {
        reject(new Error(`Failed to start pip process: ${error.message}`));
      });
    });
  }
}
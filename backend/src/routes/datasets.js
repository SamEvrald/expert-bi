const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { Dataset } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'text/csv' || path.extname(file.originalname).toLowerCase() === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  }
});

// Enhanced analysis functions
const performComprehensiveAnalysis = (filePath, metadata) => {
  const results = [];
  const headers = metadata.headers || [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        results.push(data);
      })
      .on('end', () => {
        try {
          const analysis = analyzeData(results, headers);
          resolve(analysis);
        } catch (error) {
          reject(error);
        }
      })
      .on('error', reject);
  });
};

const analyzeData = (data, headers) => {
  if (!data.length) return getEmptyAnalysis();

  // 1. Data Quality Assessment
  const dataQuality = assessDataQuality(data, headers);
  
  // 2. Statistical Analysis
  const statistics = calculateStatistics(data, headers);
  
  // 3. Column Analysis
  const columnAnalysis = analyzeColumns(data, headers);
  
  // 4. Generate Insights
  const insights = generateInsights(data, dataQuality, statistics);
  
  // 5. Create Visualizations
  const chartData = generateChartData(data, columnAnalysis);
  
  return {
    summary: {
      totalRows: data.length,
      totalColumns: headers.length,
      fileSize: JSON.stringify(data).length,
      status: 'completed',
      dataQuality: dataQuality.score
    },
    columns: columnAnalysis,
    insights: insights,
    statistics: statistics,
    chartData: chartData,
    preview: data.slice(0, 5),
    dataQuality: dataQuality
  };
};

const assessDataQuality = (data, headers) => {
  const totalCells = data.length * headers.length;
  let missingCells = 0;
  let duplicateRows = 0;
  
  // Count missing values
  data.forEach(row => {
    headers.forEach(header => {
      if (!row[header] || row[header] === '' || row[header] === null || row[header] === undefined) {
        missingCells++;
      }
    });
  });
  
  // Check for duplicates
  const uniqueRows = new Set(data.map(row => JSON.stringify(row)));
  duplicateRows = data.length - uniqueRows.size;
  
  const completeness = ((totalCells - missingCells) / totalCells) * 100;
  const uniqueness = ((data.length - duplicateRows) / data.length) * 100;
  
  let score = 'Poor';
  const avgQuality = (completeness + uniqueness) / 2;
  if (avgQuality >= 90) score = 'Excellent';
  else if (avgQuality >= 75) score = 'Good';
  else if (avgQuality >= 60) score = 'Fair';
  
  return {
    score,
    completeness: Math.round(completeness),
    uniqueness: Math.round(uniqueness),
    missingValues: missingCells,
    duplicates: duplicateRows,
    totalCells,
    issues: []
  };
};

const calculateStatistics = (data, headers) => {
  const numerical = {};
  const categorical = {};
  
  headers.forEach(header => {
    const values = data.map(row => row[header]).filter(val => val !== null && val !== '');
    
    if (isNumericColumn(values)) {
      const numValues = values.map(Number).filter(n => !isNaN(n));
      if (numValues.length > 0) {
        numerical[header] = {
          mean: Math.round((numValues.reduce((a, b) => a + b, 0) / numValues.length) * 100) / 100,
          median: calculateMedian(numValues),
          std: Math.round(calculateStandardDeviation(numValues) * 100) / 100,
          min: Math.min(...numValues),
          max: Math.max(...numValues),
          count: numValues.length
        };
      }
    } else {
      const valueCounts = {};
      values.forEach(val => {
        valueCounts[val] = (valueCounts[val] || 0) + 1;
      });
      categorical[header] = valueCounts;
    }
  });
  
  return { numerical, categorical };
};

const analyzeColumns = (data, headers) => {
  return headers.map(header => {
    const values = data.map(row => row[header]);
    const nonNullValues = values.filter(val => val !== null && val !== '' && val !== undefined);
    const uniqueValues = new Set(nonNullValues);
    
    const type = isNumericColumn(nonNullValues) ? 'number' : 
                 isBooleanColumn(nonNullValues) ? 'boolean' : 'string';
    
    return {
      name: header,
      type,
      nullCount: values.length - nonNullValues.length,
      uniqueCount: uniqueValues.size,
      sampleValues: Array.from(uniqueValues).slice(0, 5),
      completeness: Math.round((nonNullValues.length / values.length) * 100)
    };
  });
};

const generateInsights = (data, dataQuality, statistics) => {
  const insights = [];
  
  // Data quality insights
  if (dataQuality.completeness < 80) {
    insights.push({
      type: 'warning',
      title: 'Data Quality Alert',
      description: `${100 - dataQuality.completeness}% of your data has missing values. Consider data cleaning.`
    });
  }
  
  if (dataQuality.duplicates > 0) {
    insights.push({
      type: 'info',
      title: 'Duplicate Records Found',
      description: `${dataQuality.duplicates} duplicate rows detected. Review for data cleaning.`
    });
  }
  
  // Statistical insights
  Object.entries(statistics.numerical).forEach(([column, stats]) => {
    const cv = stats.std / stats.mean;
    if (cv > 1) {
      insights.push({
        type: 'info',
        title: 'High Variability Detected',
        description: `Column "${column}" shows high variability (CV: ${Math.round(cv * 100)}%).`
      });
    }
  });
  
  // Dataset overview
  insights.push({
    type: 'success',
    title: 'Dataset Overview',
    description: `Analysis complete for ${data.length} records across ${Object.keys(data[0] || {}).length} columns.`
  });
  
  return insights;
};

const generateChartData = (data, columnAnalysis) => {
  const charts = {
    rowDistribution: [
      { name: 'Total Rows', value: data.length },
      { name: 'Columns', value: columnAnalysis.length }
    ],
    columnTypes: [],
    dataQuality: [],
    topCategories: {}
  };
  
  // Column type distribution
  const typeCounts = {};
  columnAnalysis.forEach(col => {
    typeCounts[col.type] = (typeCounts[col.type] || 0) + 1;
  });
  
  charts.columnTypes = Object.entries(typeCounts).map(([type, count]) => ({
    name: type,
    value: count
  }));
  
  // Data completeness by column
  charts.dataQuality = columnAnalysis.map(col => ({
    name: col.name,
    completeness: col.completeness,
    missing: 100 - col.completeness
  }));
  
  return charts;
};

// Helper functions
const isNumericColumn = (values) => {
  const numericCount = values.filter(val => !isNaN(Number(val)) && val !== '').length;
  return numericCount > values.length * 0.8; // 80% threshold
};

const isBooleanColumn = (values) => {
  const boolValues = values.filter(val => 
    ['true', 'false', '1', '0', 'yes', 'no'].includes(String(val).toLowerCase())
  );
  return boolValues.length > values.length * 0.8;
};

const calculateMedian = (arr) => {
  const sorted = [...arr].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
};

const calculateStandardDeviation = (arr) => {
  const mean = arr.reduce((a, b) => a + b, 0) / arr.length;
  const variance = arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / arr.length;
  return Math.sqrt(variance);
};

const getEmptyAnalysis = () => ({
  summary: { totalRows: 0, totalColumns: 0, fileSize: 0, status: 'empty' },
  columns: [],
  insights: [{ type: 'error', title: 'No Data', description: 'The dataset appears to be empty.' }],
  statistics: { numerical: {}, categorical: {} },
  chartData: { rowDistribution: [] },
  preview: [],
  dataQuality: { score: 'Poor', completeness: 0, uniqueness: 0 }
});

// GET /api/datasets
router.get('/', auth, async (req, res) => {
  try {
    const datasets = await Dataset.findAll({
      where: { userId: req.user.id },
      order: [['created_at', 'DESC']] // Changed from 'createdAt' to 'created_at'
    });
    
    res.json({ success: true, data: datasets });
  } catch (error) {
    console.error('ERROR 💥', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/datasets/:id
router.get('/:id', auth, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    res.json({ success: true, data: dataset });
  } catch (error) {
    console.error('ERROR 💥', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/datasets/:id/analysis
router.get('/:id/analysis', auth, async (req, res) => {
  try {
    const dataset = await Dataset.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });
    
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found' });
    }

    if (dataset.status !== 'completed') {
      return res.status(400).json({ 
        success: false, 
        message: `Dataset analysis not ready. Current status: ${dataset.status}` 
      });
    }

    // Return the comprehensive analysis from metadata
    const analysis = dataset.metadata?.analysis || {
      summary: {
        totalRows: dataset.rowCount,
        totalColumns: dataset.metadata?.headers?.length || 0,
        fileSize: dataset.sizeBytes,
        status: dataset.status
      },
      columns: (dataset.metadata?.headers || []).map(header => ({
        name: header,
        type: 'string',
        nullCount: 0,
        uniqueCount: dataset.rowCount || 0
      })),
      insights: [
        {
          type: 'info',
          title: 'Dataset Overview',
          description: `This dataset contains ${dataset.rowCount} rows and ${dataset.metadata?.headers?.length || 0} columns.`
        }
      ],
      chartData: {
        rowDistribution: [
          { name: 'Total Rows', value: dataset.rowCount || 0 },
          { name: 'Columns', value: dataset.metadata?.headers?.length || 0 }
        ]
      },
      preview: dataset.metadata?.preview || []
    };

    res.json({ success: true, data: analysis });

  } catch (error) {
    console.error('ERROR 💥', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/datasets/upload
router.post('/upload', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;
    const fileSize = req.file.size;

    // Read first few rows to get headers and preview
    const headers = [];
    const preview = [];
    let rowCount = 0;

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('headers', (headerList) => {
          headers.push(...headerList);
        })
        .on('data', (data) => {
          if (preview.length < 5) {
            preview.push(data);
          }
          rowCount++;
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Create dataset record
    const dataset = await Dataset.create({
      userId: req.user.id,
      projectId: req.body.projectId || null,
      name: req.body.name || fileName.replace('.csv', ''),
      description: req.body.description || '',
      originalFilename: fileName,
      s3Key: filePath,
      sizeBytes: fileSize,
      rowCount: rowCount,
      status: 'uploaded',
      metadata: {
        headers,
        preview,
        uploadedAt: new Date().toISOString()
      }
    });

    res.json({ success: true, data: { id: dataset.id } });

    // Process the file asynchronously
    setTimeout(async () => {
      try {
        await dataset.update({ status: 'processing' });
        
        // Perform comprehensive analysis
        const comprehensiveAnalysis = await performComprehensiveAnalysis(filePath, dataset.metadata);
        
        await dataset.update({ 
          status: 'completed',
          metadata: {
            ...dataset.metadata,
            processedAt: new Date().toISOString(),
            analysis: comprehensiveAnalysis
          }
        });
      } catch (err) {
        console.error('Processing error:', err);
        await dataset.update({ status: 'failed' });
      }
    }, 1000);

  } catch (error) {
    console.error('ERROR 💥', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
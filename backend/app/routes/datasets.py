from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime
import pandas as pd
import traceback
import chardet

from app.database import get_db
from app.models import Dataset, User
from app.services.insights_generator import InsightsGenerator

router = APIRouter()


def detect_encoding(file_path):
    """Detect file encoding"""
    with open(file_path, 'rb') as f:
        result = chardet.detect(f.read(100000))
        return result['encoding']


def read_csv_with_encoding(file_path, **kwargs):
    """Read CSV with automatic encoding detection"""
    try:
        return pd.read_csv(file_path, encoding='utf-8', **kwargs)
    except UnicodeDecodeError:
        encoding = detect_encoding(file_path)
        print(f"Detected encoding: {encoding}")
        return pd.read_csv(file_path, encoding=encoding, **kwargs)


@router.get("/")
async def get_datasets(db: Session = Depends(get_db)):
    """Get all datasets"""
    datasets = db.query(Dataset).all()
    return datasets


@router.post("/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a new dataset"""
    try:
        allowed_extensions = {'.csv', '.xlsx', '.xls', '.json'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type {file_ext} not supported. Please upload CSV, Excel, or JSON files."
            )
        
        upload_dir = "uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        safe_filename = f"{timestamp}_{file.filename}"
        file_path = os.path.join(upload_dir, safe_filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        file_size = os.path.getsize(file_path)
        
        row_count = 0
        column_count = 0
        
        try:
            if file_ext == '.csv':
                df = read_csv_with_encoding(file_path)
                row_count = len(df)
                column_count = len(df.columns)
            elif file_ext in ['.xlsx', '.xls']:
                df = pd.read_excel(file_path)
                row_count = len(df)
                column_count = len(df.columns)
            elif file_ext == '.json':
                df = pd.read_json(file_path)
                row_count = len(df)
                column_count = len(df.columns)
        except Exception as e:
            print(f"Error reading file for metadata: {e}")
        
        dataset = Dataset(
            name=os.path.splitext(file.filename)[0],
            description=f"Uploaded on {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}",
            file_name=file.filename,
            file_path=file_path,
            file_type=file_ext.replace('.', ''),
            file_size=file_size,
            row_count=row_count,
            column_count=column_count,
            status='uploaded',
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        
        db.add(dataset)
        db.commit()
        db.refresh(dataset)
        
        return {
            "success": True,
            "message": "Dataset uploaded successfully",
            "data": {
                "id": dataset.id,
                "name": dataset.name,
                "file_name": dataset.file_name,
                "file_size": dataset.file_size,
                "row_count": dataset.row_count,
                "column_count": dataset.column_count,
                "status": dataset.status,
                "created_at": dataset.created_at.isoformat() if dataset.created_at else None
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload dataset: {str(e)}"
        )


@router.get("/{dataset_id}")
async def get_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Get a specific dataset"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return {
        "success": True,
        "data": {
            "id": dataset.id,
            "name": dataset.name,
            "description": dataset.description,
            "file_name": dataset.file_name,
            "file_path": dataset.file_path,
            "file_type": dataset.file_type,
            "row_count": dataset.row_count,
            "column_count": dataset.column_count,
            "file_size": dataset.file_size,
            "status": dataset.status,
            "created_at": dataset.created_at.isoformat() if dataset.created_at else None,
            "updated_at": dataset.updated_at.isoformat() if dataset.updated_at else None,
        }
    }


@router.get("/{dataset_id}/preview")
async def get_dataset_preview(dataset_id: int, limit: int = 100, db: Session = Depends(get_db)):
    """Get preview of dataset data"""
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        print(f"Loading preview for dataset {dataset_id}, file: {dataset.file_path}")
        
        if not os.path.exists(dataset.file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {dataset.file_path}")
        
        file_ext = os.path.splitext(dataset.file_path)[1].lower()
        
        if file_ext == '.csv':
            df = read_csv_with_encoding(dataset.file_path, nrows=limit)
        elif file_ext in ['.xlsx', '.xls']:
            df = pd.read_excel(dataset.file_path, nrows=limit)
        elif file_ext == '.json':
            df = pd.read_json(dataset.file_path)
            df = df.head(limit)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        preview_data = df.to_dict('records')
        columns = [str(col) for col in df.columns]
        
        return {
            "success": True,
            "data": {
                "columns": columns,
                "rows": preview_data,
                "total_rows": dataset.row_count,
                "displayed_rows": len(preview_data)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Preview error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to load preview: {str(e)}"
        )


@router.get("/{dataset_id}/analysis")
async def get_dataset_analysis(dataset_id: int, db: Session = Depends(get_db)):
    """Get analysis for a dataset"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    return {
        "success": True,
        "data": {
            "columns": [],
            "preview": [],
            "statistics": {
                "numerical": {},
                "categorical": {}
            }
        }
    }


@router.post("/{dataset_id}/detect-types")
async def detect_types(dataset_id: int, db: Session = Depends(get_db)):
    """Detect column types for a dataset"""
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        print(f"Detecting types for dataset {dataset_id}, file: {dataset.file_path}")
        
        if not os.path.exists(dataset.file_path):
            raise HTTPException(status_code=404, detail=f"File not found: {dataset.file_path}")
        
        file_ext = os.path.splitext(dataset.file_path)[1].lower()
        
        if file_ext == '.csv':
            df = read_csv_with_encoding(dataset.file_path)
        elif file_ext in ['.xlsx', '.xls']:
            df = pd.read_excel(dataset.file_path)
        elif file_ext == '.json':
            df = pd.read_json(dataset.file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        columns_info = {}
        for col in df.columns:
            col_str = str(col)
            dtype = str(df[col].dtype)
            
            if dtype in ['int64', 'float64', 'int32', 'float32']:
                detected_type = 'number'
            elif dtype == 'bool':
                detected_type = 'boolean'
            elif 'datetime' in dtype:
                detected_type = 'datetime'
            else:
                detected_type = 'text'
            
            columns_info[col_str] = {
                "detected_type": detected_type,
                "pandas_dtype": dtype,
                "null_count": int(df[col].isnull().sum()),
                "unique_count": int(df[col].nunique())
            }
        
        return {
            "success": True,
            "data": {
                "columns": columns_info
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"Type detection error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to detect types: {str(e)}"
        )


@router.get("/{dataset_id}/insights")
async def get_insights(dataset_id: int, db: Session = Depends(get_db)):
    """Get insights for a dataset"""
    try:
        dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
        if not dataset:
            raise HTTPException(status_code=404, detail="Dataset not found")
        
        print(f"Generating insights for dataset {dataset_id}")
        
        if not os.path.exists(dataset.file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        file_ext = os.path.splitext(dataset.file_path)[1].lower()
        
        if file_ext == '.csv':
            df = read_csv_with_encoding(dataset.file_path)
        elif file_ext in ['.xlsx', '.xls']:
            df = pd.read_excel(dataset.file_path)
        elif file_ext == '.json':
            df = pd.read_json(dataset.file_path)
        else:
            raise HTTPException(status_code=400, detail="Unsupported file type")
        
        # Generate insights
        generator = InsightsGenerator(df)
        insights = generator.generate_all_insights()
        
        # Add IDs and timestamps
        for i, insight in enumerate(insights):
            insight['id'] = i + 1
            insight['created_at'] = datetime.utcnow().isoformat()
        
        print(f"Generated {len(insights)} insights")
        
        return {
            "success": True,
            "data": insights
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Insights generation error: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate insights: {str(e)}"
        )


@router.delete("/{dataset_id}/insights/{insight_id}")
async def delete_insight(dataset_id: int, insight_id: int, db: Session = Depends(get_db)):
    """Delete an insight"""
    return {
        "success": True,
        "message": "Insight deleted successfully"
    }


@router.get("/{dataset_id}/export")
async def export_dataset(dataset_id: int, format: str = "csv", db: Session = Depends(get_db)):
    """Export dataset in specified format"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    from fastapi.responses import FileResponse
    
    if not os.path.exists(dataset.file_path):
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=dataset.file_path,
        filename=dataset.file_name,
        media_type='application/octet-stream'
    )


@router.delete("/{dataset_id}")
async def delete_dataset(dataset_id: int, db: Session = Depends(get_db)):
    """Delete a dataset"""
    dataset = db.query(Dataset).filter(Dataset.id == dataset_id).first()
    if not dataset:
        raise HTTPException(status_code=404, detail="Dataset not found")
    
    if os.path.exists(dataset.file_path):
        os.remove(dataset.file_path)
    
    db.delete(dataset)
    db.commit()
    
    return {"success": True, "message": "Dataset deleted successfully"}
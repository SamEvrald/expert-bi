import React from 'react';
import { DataPreview, ColumnType } from '../../types/api.types';
import { Table } from 'lucide-react';

interface DataPreviewTableProps {
  preview: DataPreview;
  columnTypes?: Record<string, ColumnType>;
}

export const DataPreviewTable: React.FC<DataPreviewTableProps> = ({ preview, columnTypes }) => {
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Table className="w-5 h-5 text-gray-600" />
            <h3 className="font-semibold text-gray-900">Data Preview</h3>
          </div>
          <p className="text-sm text-gray-600">
            Showing {preview.displayed_rows} of {preview.total_rows.toLocaleString()} rows
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">
                #
              </th>
              {preview.columns.map((column) => (
                <th
                  key={column}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div>
                    <div className="font-semibold">{column}</div>
                    {columnTypes?.[column] && (
                      <div className="text-xs text-gray-400 font-normal mt-1">
                        {columnTypes[column].detected_type}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {preview.rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm text-gray-500 sticky left-0 bg-white z-10">
                  {idx + 1}
                </td>
                {preview.columns.map((column) => (
                  <td key={column} className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column])
                      : <span className="text-gray-400 italic">null</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
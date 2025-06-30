# PDF Ingestion Pipeline for Weaviate

This document describes the PDF ingestion pipeline that extracts content from PDF files and stores it in Weaviate vector database for the Syto educational platform.

## Overview

The PDF ingestion pipeline processes educational syllabus PDFs and creates searchable collections in Weaviate Cloud. It's designed specifically for the Chale AI agent to generate contextually accurate educational content.

## Architecture

### Core Components

1. **PDFIngestionService** (`src/lib/pdf-ingestion.ts`)
   - Main service class handling the complete ingestion pipeline
   - Connects to Weaviate Cloud
   - Processes PDFs and imports data

2. **Configuration** (`src/lib/pdf-config.ts`)
   - Environment validation
   - Collection mapping
   - Default settings

3. **Testing Utilities** (`src/lib/pdf-test.ts`)
   - Comprehensive test suite
   - Connection and functionality validation

4. **CLI Script** (`scripts/ingest-pdfs.ts`)
   - Command-line interface for running ingestion
   - Progress reporting and error handling

## Setup

### Prerequisites

1. **Weaviate Cloud Account**
   - Sign up at [Weaviate Cloud](https://console.weaviate.cloud/)
   - Create a cluster and obtain:
     - Cluster URL
     - API Key

2. **Environment Variables**
   ```bash
   # Add to .env.development
   WEAVIATE_URL=https://your-cluster-url.weaviate.network
   WEAVIATE_API_KEY=your-api-key-here
   ```

### Installation

1. **Install Dependencies**
   ```bash
   npm run setup-ingestion
   # or manually:
   npm install dotenv tsx weaviate-client
   ```

2. **Verify Setup**
   ```bash
   npm run test-ingestion
   ```

## Usage

### Basic Ingestion

1. **Place PDF files in `/data` directory**
   ```
   data/
   ├── math_syllabus.pdf
   ├── reading_syllabus.pdf
   └── other_syllabus.pdf
   ```

2. **Run ingestion pipeline**
   ```bash
   npm run ingest-pdfs
   ```

### Advanced Usage

#### Programmatic Usage

```typescript
import { ingestPDFsToWeaviate } from './src/lib/pdf-ingestion';

const result = await ingestPDFsToWeaviate('./data', {
  batchSize: 100,
  deleteAfterProcessing: false,
  moveToProcessed: true
});

console.log(`Processed ${result.processedFiles.length} files`);
```

#### Custom Configuration

```typescript
import { PDFIngestionService } from './src/lib/pdf-ingestion';

const service = new PDFIngestionService({
  weaviateUrl: process.env.WEAVIATE_URL!,
  weaviateApiKey: process.env.WEAVIATE_API_KEY!,
  batchSize: 50,
  deleteAfterProcessing: true
});

await service.connect();
await service.ingestPDFs('./custom-data');
```

## Collection Mapping

The pipeline automatically creates collections based on PDF filenames:

| PDF Filename | Collection Name | Purpose |
|--------------|-----------------|---------|
| `math_syllabus.pdf` | `MathDB` | Mathematics curriculum content |
| `reading_syllabus.pdf` | `ReadingDB` | Reading/English curriculum content |
| `science_syllabus.pdf` | `ScienceDB` | Science curriculum content |
| `other_file.pdf` | `OtherFileDB` | Generic collection |

## Data Structure

Each PDF element is stored with the following properties:

```typescript
{
  content: string;        // Extracted text content
  elementType: string;    // Type: paragraph, title, list, etc.
  source: string;         // Original PDF filename
  pageNumber: number;     // Page number in PDF
  metadata: object;       // Additional metadata
}
```

## Pipeline Steps

1. **Connection**: Connect to Weaviate Cloud
2. **Discovery**: Find PDF files in data directory
3. **Processing**: Extract text elements from each PDF
4. **Collection Creation**: Create/verify Weaviate collections
5. **Import**: Batch import elements to collections
6. **Post-Processing**: Move/delete processed files
7. **Cleanup**: Close connections and report results

## Error Handling

The pipeline includes comprehensive error handling:

- **Connection Errors**: Validates Weaviate connectivity
- **Processing Errors**: Continues with other files if one fails
- **Import Errors**: Stops batch if error count exceeds threshold
- **File Errors**: Logs issues with file operations

## Testing

### Run All Tests
```bash
npm run test-ingestion
```

### Individual Tests
```typescript
import { PDFIngestionTester } from './src/lib/pdf-test';

const tester = new PDFIngestionTester();

// Test connection
await tester.testConnection();

// Test collection creation
await tester.testCollectionCreation('TestDB');

// Test data import
await tester.testDataImport('TestDB');

// Test queries
await tester.testQuery('TestDB', 'mathematics');
```

## Monitoring and Logs

The pipeline provides detailed logging:

```
🚀 Starting PDF Ingestion Pipeline...
📂 Data directory: /path/to/data
📚 Found 2 PDF files to process
📄 Processing PDF: math_syllabus.pdf
✅ Extracted 15 elements from math_syllabus.pdf
📚 Created collection "MathDB"
📦 Imported batch of 15 objects to MathDB
📁 Moved processed file to: /data/processed/math_syllabus.pdf
✅ Successfully processed: math_syllabus.pdf
🎉 Ingestion complete! Processed 2 files
```

## Integration with Chale AI

The ingested content is used by the Chale AI agent to:

1. **Generate Contextual Content**: Create grade-appropriate questions based on syllabus
2. **Curriculum Alignment**: Ensure content matches Ghana's national curriculum
3. **Topic Discovery**: Identify key learning objectives and topics
4. **Content Validation**: Verify educational accuracy against source materials

## Troubleshooting

### Common Issues

1. **Connection Failed**
   ```
   ❌ Failed to connect to Weaviate
   ```
   - Verify `WEAVIATE_URL` and `WEAVIATE_API_KEY`
   - Check network connectivity
   - Ensure Weaviate cluster is active

2. **No PDF Files Found**
   ```
   📂 No PDF files found in data directory
   ```
   - Verify files are in `/data` directory
   - Check file extensions (.pdf)
   - Ensure proper file permissions

3. **Import Errors**
   ```
   ❌ Batch import error
   ```
   - Check Weaviate cluster capacity
   - Reduce batch size in configuration
   - Verify collection schema

### Debug Mode

Enable detailed logging by setting environment variable:
```bash
DEBUG=true npm run ingest-pdfs
```

## Performance Considerations

- **Batch Size**: Default 200 objects per batch (adjustable)
- **Memory Usage**: Processes files sequentially to manage memory
- **Network**: Uses efficient batch imports to minimize API calls
- **Storage**: Moves processed files to avoid reprocessing

## Security

- **API Keys**: Stored in environment variables only
- **File Access**: Limited to designated data directory
- **Network**: Uses HTTPS for all Weaviate communications
- **Validation**: Input validation for all user-provided data

## Future Enhancements

1. **Real PDF Processing**: Integration with Unstructured library
2. **Advanced Parsing**: OCR support for scanned PDFs
3. **Metadata Extraction**: Enhanced document metadata
4. **Incremental Updates**: Process only changed files
5. **Monitoring Dashboard**: Web interface for pipeline status

## Support

For issues or questions:
1. Check the troubleshooting section
2. Run the test suite to identify problems
3. Review logs for detailed error information
4. Ensure all prerequisites are met

---

*This pipeline is designed specifically for the Syto educational platform and Chale AI agent development.*

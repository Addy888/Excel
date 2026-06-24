# Implementation Tasks

## Task 1: Create Client Report Processor

**Status**: pending

**Description**: Create a new utility to aggregate agent data from CSV rows, grouping by USER NAME and summing performance metrics.

**Files to Create/Modify**:
- Create: `server/src/utils/clientReportProcessor.ts`

**Implementation Details**:
1. Define TypeScript interfaces for CSVRow and AgentRecord
2. Implement `aggregateAgentData(csvRows: CSVRow[]): AgentRecord[]` function
3. Group CSV rows by USER_NAME using Map data structure
4. Sum numeric metrics (CALLS, CP, CMDIS, CALLBK, VC, BUSY, VM, VI) for each agent
5. Calculate derived metrics: Connected Calls = CP + CMDIS + CALLBK + VC
6. Skip rows with empty USER_NAME and log warnings
7. Return array of AgentRecord objects with all calculated fields

**Acceptance Criteria**:
- Function groups multiple CSV rows by exact USER_NAME match
- Numeric fields are summed correctly for each agent
- Connected Calls calculated as sum of CP + CMDIS + CALLBK + VC
- Empty USER_NAME rows are skipped with warning logs
- Returns one AgentRecord per unique USER_NAME
- All AgentRecord fields populated except blank fields (dateOfJoining, vcDone, bookingDone, tokenDone, remark)

---

## Task 2: Create Client Template Excel Generator

**Status**: pending

**Description**: Create a new Excel generator that produces the exact client template format with single sheet "Till Time".

**Files to Create/Modify**:
- Create: `server/src/utils/clientReportGenerator.ts`

**Implementation Details**:
1. Import ExcelJS library
2. Implement `generateClientReport(agentRecords, startDate, tillDate): Promise<string>` function
3. Create workbook and single worksheet named "Till Time"
4. Add merged title row in row 1: "FCS TEAM PERFORMANCE - FROM [START DATE] TILL DATE"
5. Add header row in row 2 with 11 columns
6. Add agent data rows starting from row 3
7. Calculate and add TOTAL row with sums
8. Apply client template formatting (fonts, colors, borders, alignment)
9. Set column widths appropriate for content
10. Freeze header row (row 2)
11. Set landscape page orientation
12. Save workbook to `uploads/reports/Team_Performance_Report.xlsx`
13. Return file path

**Acceptance Criteria**:
- Single worksheet created with name "Till Time"
- Title row merged across columns A-K
- Title text includes dynamic start date and till date
- Header row contains all 11 required columns
- One data row per agent with correct field mapping
- TOTAL row shows correct sums for numeric columns
- Title and headers are bold
- Header row has light blue background (#D9E1F2)
- Alternating row colors applied (white and #F2F2F2)
- All cells have thin black borders
- Numeric columns center-aligned
- Text columns left-aligned
- Column widths auto-fit content
- Header row frozen for scrolling
- Page orientation set to landscape
- File saved as Team_Performance_Report.xlsx

---

## Task 3: Create Client Report Controller

**Status**: pending

**Description**: Create a new controller to handle client template generation requests.

**Files to Create/Modify**:
- Create: `server/src/controllers/clientReportController.ts`

**Implementation Details**:
1. Import necessary dependencies (prisma, clientReportProcessor, clientReportGenerator)
2. Implement `processClientTemplate(req: AuthRequest, res: Response)` async function
3. Extract reportId from request body
4. Fetch uploaded report from database using reportId
5. Return 404 if report not found
6. Extract CSV rows from uploadedReport.rawData
7. Call aggregateAgentData to process agent records
8. Determine start date from CSV data (earliest date or upload date)
9. Get till date as current date
10. Call generateClientReport to create Excel file
11. Save processed report to database with file path
12. Update uploaded report status to 'processed'
13. Return success response with processed report ID and file path
14. Implement try-catch error handling with appropriate error messages

**Acceptance Criteria**:
- Function accepts reportId in request body
- Returns 404 error if report not found in database
- Calls aggregateAgentData with raw CSV data
- Calls generateClientReport with aggregated data and dates
- Saves ProcessedReport record to database
- Updates UploadedReport status to 'processed'
- Returns JSON response with processedReport.id and filePath
- Error responses include meaningful error messages
- All database operations wrapped in try-catch
- Logs errors to console

---

## Task 4: Create Client Report Routes

**Status**: pending

**Description**: Create new API routes for client template generation.

**Files to Create/Modify**:
- Create: `server/src/routes/clientReportRoutes.ts`

**Implementation Details**:
1. Import Express Router
2. Import authenticateToken middleware
3. Import clientReportController functions
4. Define POST route `/process-template` mapped to processClientTemplate
5. Apply authenticateToken middleware to all routes
6. Export router

**Acceptance Criteria**:
- Router created and exported
- POST /process-template route defined
- authenticateToken middleware applied
- Route mapped to processClientTemplate controller function

---

## Task 5: Integrate Client Report Routes into Server

**Status**: pending

**Description**: Register the client report routes in the main server application.

**Files to Create/Modify**:
- Modify: `server/src/server.ts`

**Implementation Details**:
1. Import clientReportRoutes
2. Register routes at `/api/client-reports` path
3. Place route registration with other API routes

**Acceptance Criteria**:
- Client report routes imported in server.ts
- Routes registered at /api/client-reports base path
- Server starts without errors
- Routes accessible at /api/client-reports/process-template

---

## Task 6: Add Client Template Option to Frontend Upload Page

**Status**: pending

**Description**: Add UI option to select client template format when uploading CSV files.

**Files to Create/Modify**:
- Modify: `client/src/pages/UploadPage.tsx`

**Implementation Details**:
1. Add state variable for template type selection (standard/client)
2. Add radio buttons or dropdown for template selection
3. Update file upload handler to include template type
4. Pass template type to backend in upload request
5. Update UI labels to indicate client template option

**Acceptance Criteria**:
- Template selection UI added to upload page
- User can choose between "Standard MIS Report" and "Client Performance Report"
- Template type sent to backend with upload request
- UI clearly indicates which template will be generated
- Default selection is "Standard MIS Report"

---

## Task 7: Update Report Processing to Support Client Template

**Status**: pending

**Description**: Modify the report processing logic to handle client template generation.

**Files to Create/Modify**:
- Modify: `client/src/pages/HistoryPage.tsx`
- Modify: `server/src/controllers/reportController.ts`

**Implementation Details**:

**Backend (reportController.ts)**:
1. Add templateType field to UploadedReport creation
2. In processReport function, check templateType
3. If templateType is 'client', call client template processor
4. If templateType is 'standard', use existing MIS report generator
5. Store templateType in ProcessedReport record

**Frontend (HistoryPage.tsx)**:
1. Display template type in report list
2. Show appropriate download button label based on template type
3. Call correct download endpoint based on template type

**Acceptance Criteria**:
- Backend stores templateType with uploaded report
- processReport function routes to correct generator based on type
- Frontend displays template type in report list
- Download buttons labeled appropriately ("Download MIS Report" / "Download Performance Report")
- Correct file downloaded based on template type

---

## Task 8: Create Download Endpoint for Client Template

**Status**: pending

**Description**: Create a download endpoint specifically for client template reports.

**Files to Create/Modify**:
- Modify: `server/src/controllers/clientReportController.ts`
- Modify: `server/src/routes/clientReportRoutes.ts`

**Implementation Details**:
1. Implement `downloadClientReport(req: AuthRequest, res: Response)` function
2. Extract processedReportId from URL params
3. Fetch processed report from database
4. Verify file exists at generatedFilePath
5. Return 404 if file not found
6. Use res.download() to send file
7. Set filename to "Team_Performance_Report.xlsx"
8. Add route GET /download/:id to clientReportRoutes

**Acceptance Criteria**:
- Function accepts processedReportId as URL parameter
- Returns 404 if processed report not found
- Returns 404 if file doesn't exist on filesystem
- File downloaded with correct filename
- File content matches generated Excel template
- Response headers set correctly for file download

---

## Task 9: Add Column Mapping UI for Client Template

**Status**: pending

**Description**: Create UI component to handle CSV files with different column names.

**Files to Create/Modify**:
- Create: `client/src/components/ClientColumnMapper.tsx`
- Modify: `client/src/pages/UploadPage.tsx`

**Implementation Details**:
1. Create ClientColumnMapper component
2. Display CSV column names on left side
3. Display required field names on right side (USER NAME, CALLS, CP, CMDIS, etc.)
4. Provide dropdowns to map CSV columns to required fields
5. Validate that all required fields are mapped
6. Enable "Continue" button only when mapping is complete
7. Return column mapping object to parent component
8. Show column mapper modal if backend returns "missing columns" error

**Acceptance Criteria**:
- Component displays available CSV columns
- Component displays required field names
- User can map each CSV column to required field
- Validation prevents continuing with incomplete mapping
- "Continue" button enabled only when all required fields mapped
- Column mapping object returned in correct format
- Modal shown automatically when upload response indicates missing columns
- UI is intuitive and easy to use

---

## Task 10: Implement Error Handling and Validation

**Status**: pending

**Description**: Add comprehensive error handling throughout the client template generation flow.

**Files to Create/Modify**:
- Modify: `server/src/utils/clientReportProcessor.ts`
- Modify: `server/src/utils/clientReportGenerator.ts`
- Modify: `server/src/controllers/clientReportController.ts`
- Modify: `client/src/pages/UploadPage.tsx`
- Modify: `client/src/pages/HistoryPage.tsx`

**Implementation Details**:

**Backend**:
1. Create ClientReportError custom error class
2. Add validation for empty CSV files
3. Add validation for missing required columns
4. Add validation for empty USER_NAME values
5. Add validation for no valid agent records after processing
6. Wrap all processing steps in try-catch blocks
7. Return appropriate HTTP status codes and error messages
8. Log all errors with timestamps

**Frontend**:
1. Display error messages from backend in user-friendly format
2. Show toast notifications for errors
3. Provide retry functionality after errors
4. Display progress indicator during processing
5. Show success message after successful generation

**Acceptance Criteria**:
- Empty CSV files rejected with clear error message
- Missing required columns detected and reported
- Rows with empty USER_NAME skipped with warning count
- Zero valid agents error displayed if all rows invalid
- Frontend displays all backend error messages
- Users can retry after errors without page reload
- Progress indicator shown during processing
- Success and error states clearly communicated to user
- All errors logged on backend with sufficient detail for debugging

---

## Task 11: Add Unit Tests for Client Report Processor

**Status**: pending

**Description**: Create comprehensive unit tests for agent data aggregation logic.

**Files to Create/Modify**:
- Create: `server/tests/clientReportProcessor.test.ts`

**Implementation Details**:
1. Set up Jest test environment
2. Test aggregateAgentData with single agent
3. Test aggregateAgentData with multiple agents
4. Test aggregation of duplicate agent rows
5. Test handling of empty USER_NAME
6. Test handling of missing numeric fields
7. Test calculation of Connected Calls
8. Test calculation of derived metrics
9. Test edge cases (empty array, all invalid rows, special characters in names)

**Acceptance Criteria**:
- All test cases pass
- Code coverage > 90% for clientReportProcessor.ts
- Tests verify correct grouping by USER_NAME
- Tests verify correct summing of metrics
- Tests verify handling of edge cases
- Tests run successfully in CI/CD pipeline

---

## Task 12: Add Integration Tests for Client Template Generation

**Status**: pending

**Description**: Create end-to-end integration tests for the complete client template flow.

**Files to Create/Modify**:
- Create: `server/tests/clientReportIntegration.test.ts`

**Implementation Details**:
1. Create test CSV file with sample agent data
2. Test full flow: upload → process → download
3. Verify Excel file structure matches client template
4. Verify single worksheet named "Till Time"
5. Verify title row content and formatting
6. Verify header row content and formatting
7. Verify data rows content and formatting
8. Verify TOTAL row calculations
9. Verify file can be opened in Excel
10. Test with various CSV formats and sizes

**Acceptance Criteria**:
- All integration tests pass
- Tests verify complete upload-to-download flow
- Excel structure validated against client template
- Formatting verified (colors, fonts, borders, alignment)
- TOTAL row calculations verified
- Tests handle cleanup of generated files
- Tests run successfully in CI/CD pipeline

---

## Task 13: Update Documentation

**Status**: pending

**Description**: Create comprehensive documentation for the client template feature.

**Files to Create/Modify**:
- Create: `CLIENT_TEMPLATE_GUIDE.md`
- Modify: `README.md`

**Implementation Details**:
1. Document client template feature overview
2. Document CSV file requirements
3. Document column mapping process
4. Document generated Excel structure
5. Document API endpoints
6. Document error messages and troubleshooting
7. Include sample CSV file
8. Include screenshots of Excel output
9. Document differences between standard and client templates
10. Add section to main README about template options

**Acceptance Criteria**:
- Documentation clearly explains feature purpose
- CSV requirements documented with examples
- Column mapping process explained with screenshots
- Excel template structure documented
- API endpoints documented with request/response examples
- Common errors and solutions documented
- Sample files provided
- README updated with new feature information

---

## Task 14: Performance Testing and Optimization

**Status**: pending

**Description**: Test and optimize performance for large CSV files.

**Files to Create/Modify**:
- Modify: `server/src/utils/clientReportProcessor.ts`
- Modify: `server/src/utils/clientReportGenerator.ts`

**Implementation Details**:
1. Create test CSV files of various sizes (100, 1000, 10000, 50000 rows)
2. Measure processing time for each file size
3. Measure memory usage during processing
4. Implement streaming for large CSV files if needed
5. Optimize agent aggregation algorithm
6. Optimize Excel generation for large datasets
7. Add progress reporting for long-running operations
8. Set reasonable file size limits

**Acceptance Criteria**:
- 100 row CSV processes in < 2 seconds
- 1000 row CSV processes in < 5 seconds
- 10000 row CSV processes in < 30 seconds
- Memory usage stays below 500MB for 50000 row file
- Progress indicator updates during processing
- File size limit enforced at 50MB
- No memory leaks during repeated processing
- Performance meets or exceeds requirements

---

## Task 15: Database Schema Updates

**Status**: pending

**Description**: Update database schema to support client template type and metadata.

**Files to Create/Modify**:
- Modify: `server/prisma/schema.prisma`
- Create: `server/prisma/migrations/[timestamp]_add_template_type.sql`

**Implementation Details**:
1. Add templateType field to UploadedReport model (enum: 'standard' | 'client')
2. Add startDate field to ProcessedReport model for client template
3. Add tillDate field to ProcessedReport model for client template
4. Create Prisma migration
5. Run migration on development database
6. Update seed data to include template type
7. Test migration rollback

**Acceptance Criteria**:
- Prisma schema updated with new fields
- Migration created successfully
- Migration runs without errors
- Rollback migration works correctly
- Existing data not affected by migration
- New fields properly typed and constrained
- Seed data includes template type examples


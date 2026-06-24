# Requirements Document

## Introduction

The Client Report Generation System generates Excel reports that match the exact format of the client's template. The system accepts Agent Performance CSV files from dialer systems and produces a single-sheet Excel workbook named "Team_Performance_Report.xlsx" that looks identical to the manually prepared client template. No custom dashboards, analytics, or additional sheets are created - only the final formatted client report.

## Glossary

- **System**: The Client Report Generation System
- **Report_Generator**: The component responsible for creating the Excel output file matching the client template
- **Data_Processor**: The component that parses and aggregates CSV data by agent
- **Validator**: The component that checks file integrity and data quality
- **Column_Mapper**: The component that maps CSV columns to client template fields
- **Excel_Formatter**: The component that applies the exact client template styling
- **Agent_Record**: A single row of data containing Caller's Name and aggregated performance metrics
- **Client_Template**: The exact Excel format expected by the client
- **CSV_File**: Comma-separated values file containing agent performance data from dialer system
- **Dialer_Column**: CSV columns from dialer systems (USER NAME, ID, CALLS, CP, CMDIS, CALLBK, VC, BUSY, VM, VI)
- **Aggregation**: Combining multiple CSV rows for the same agent into a single report row
- **Connected_Calls**: CP + CMDIS + CALLBK + VC
- **Qualified**: CMDIS (Command Disposition calls)
- **In_Process**: CALLBK (Callback calls)
- **VC_Scheduled**: VC (Video Conference scheduled)
- **Till_Time**: The sheet name in the client template meaning "up to current date"
- **TOTAL_Row**: The final summary row showing aggregated totals for all agents

## Requirements

### Requirement 1: CSV File Upload and Validation

**User Story:** As a report administrator, I want to upload Agent Performance CSV files with basic validation, so that invalid files are rejected before processing.

#### Acceptance Criteria

1. WHEN a file is selected for upload, THE Validator SHALL verify the file extension is .csv
2. WHEN a CSV file is uploaded, THE Validator SHALL check that the file is not empty
3. IF the file is empty, THEN THE System SHALL display error "File is empty. Please upload a valid CSV file"
4. WHEN a CSV file contains data, THE Validator SHALL parse the header row to identify column names
5. THE System SHALL accept CSV files up to 50 megabytes in size
6. IF file size exceeds 50 megabytes, THEN THE System SHALL display error "File size exceeds maximum of 50MB"

### Requirement 2: Column Identification and Mapping

**User Story:** As a report administrator, I want automatic column detection for standard dialer exports, so that files can be processed without manual intervention.

#### Acceptance Criteria

1. WHEN a CSV file is parsed, THE Column_Mapper SHALL identify columns: USER NAME, ID, CALLS, CP, CMDIS, CALLBK, VC, BUSY, VM, VI
2. THE Column_Mapper SHALL support common column name variations (case-insensitive matching)
3. IF USER NAME column is missing, THEN THE System SHALL display error "Required column USER NAME not found"
4. IF CALLS column is missing, THEN THE System SHALL display error "Required column CALLS not found"
5. WHEN all required columns are identified, THE System SHALL proceed to data processing
6. THE Column_Mapper SHALL log all identified column mappings for debugging

### Requirement 3: Agent Data Aggregation

**User Story:** As a report administrator, I want agent data aggregated correctly by USER NAME, so that multiple CSV rows for the same agent become a single report row.

#### Acceptance Criteria

1. WHEN the Data_Processor parses CSV rows, THE Data_Processor SHALL group rows by USER NAME (case-sensitive exact match)
2. FOR ALL rows with the same USER NAME, THE Data_Processor SHALL sum CALLS, CP, CMDIS, CALLBK, VC, BUSY, VM, VI values
3. WHEN multiple rows exist for an agent, THE Data_Processor SHALL create exactly one Agent_Record
4. THE Data_Processor SHALL preserve the original USER NAME exactly as it appears in the CSV
5. IF USER NAME is blank or empty, THEN THE Validator SHALL skip the row and log warning "Row [row_number] skipped: missing USER NAME"
6. THE Data_Processor SHALL calculate Total Dialed as the sum of CALLS for each agent
7. THE Data_Processor SHALL calculate Connected Calls as CP + CMDIS + CALLBK + VC for each agent
8. THE Data_Processor SHALL calculate Qualified as CMDIS for each agent
9. THE Data_Processor SHALL calculate In Process as CALLBK for each agent
10. THE Data_Processor SHALL calculate VC Scheduled as VC for each agent

### Requirement 4: Client Template Sheet Generation

**User Story:** As a client, I want the Excel report to match my exact template format, so that it integrates seamlessly with my workflow.

#### Acceptance Criteria

1. THE Report_Generator SHALL create exactly one worksheet named "Till Time"
2. THE Report_Generator SHALL create the workbook file named "Team_Performance_Report.xlsx"
3. THE Report_Generator SHALL create a merged title row spanning all columns with text "FCS TEAM PERFORMANCE - FROM [START DATE] TILL DATE"
4. THE Report_Generator SHALL replace [START DATE] with the earliest date found in the CSV data
5. THE Report_Generator SHALL replace TILL DATE with the current processing date
6. THE Report_Generator SHALL create column headers in row 2: Caller's Name, Date of Joining, Total Dialed, Connected Calls, Qualified, In Process, VC Scheduled, VC Done, Booking Done, Token Done, Remark
7. FOR ALL Agent_Records, THE Report_Generator SHALL create one data row starting from row 3
8. FOR ALL Agent_Records, THE Report_Generator SHALL populate Caller's Name from USER NAME
9. FOR ALL Agent_Records, THE Report_Generator SHALL leave Date of Joining blank
10. FOR ALL Agent_Records, THE Report_Generator SHALL populate Total Dialed from calculated Total Dialed
11. FOR ALL Agent_Records, THE Report_Generator SHALL populate Connected Calls from calculated Connected Calls
12. FOR ALL Agent_Records, THE Report_Generator SHALL populate Qualified from calculated Qualified
13. FOR ALL Agent_Records, THE Report_Generator SHALL populate In Process from calculated In Process
14. FOR ALL Agent_Records, THE Report_Generator SHALL populate VC Scheduled from calculated VC Scheduled
15. FOR ALL Agent_Records, THE Report_Generator SHALL leave VC Done blank
16. FOR ALL Agent_Records, THE Report_Generator SHALL leave Booking Done blank
17. FOR ALL Agent_Records, THE Report_Generator SHALL leave Token Done blank
18. FOR ALL Agent_Records, THE Report_Generator SHALL leave Remark blank

### Requirement 5: TOTAL Row Generation

**User Story:** As a client, I want a TOTAL row at the bottom of the report, so that I can see aggregated performance across all agents.

#### Acceptance Criteria

1. AFTER all Agent_Record rows are added, THE Report_Generator SHALL create a TOTAL row
2. THE Report_Generator SHALL populate the first column of the TOTAL row with text "TOTAL"
3. THE Report_Generator SHALL calculate TOTAL Total Dialed as sum of Total Dialed across all Agent_Records
4. THE Report_Generator SHALL calculate TOTAL Connected Calls as sum of Connected Calls across all Agent_Records
5. THE Report_Generator SHALL calculate TOTAL Qualified as sum of Qualified across all Agent_Records
6. THE Report_Generator SHALL calculate TOTAL In Process as sum of In Process across all Agent_Records
7. THE Report_Generator SHALL calculate TOTAL VC Scheduled as sum of VC Scheduled across all Agent_Records
8. THE Report_Generator SHALL leave TOTAL Date of Joining blank
9. THE Report_Generator SHALL leave TOTAL VC Done blank
10. THE Report_Generator SHALL leave TOTAL Booking Done blank
11. THE Report_Generator SHALL leave TOTAL Token Done blank
12. THE Report_Generator SHALL leave TOTAL Remark blank

### Requirement 6: Client Template Formatting

**User Story:** As a client, I want professional Excel formatting that matches my template exactly, so that the report looks manually prepared.

#### Acceptance Criteria

1. THE Excel_Formatter SHALL apply font "Calibri" size 11 to all cells
2. THE Excel_Formatter SHALL apply bold formatting to the title row (row 1)
3. THE Excel_Formatter SHALL merge cells A1 through K1 for the title
4. THE Excel_Formatter SHALL center-align the title text
5. THE Excel_Formatter SHALL apply bold formatting to the header row (row 2)
6. THE Excel_Formatter SHALL apply borders (thin, black) to all cells containing data
7. THE Excel_Formatter SHALL center-align all numeric columns (Total Dialed, Connected Calls, Qualified, In Process, VC Scheduled, VC Done, Booking Done, Token Done)
8. THE Excel_Formatter SHALL left-align text columns (Caller's Name, Date of Joining, Remark)
9. THE Excel_Formatter SHALL set column widths to auto-fit content with minimum 12 characters
10. THE Excel_Formatter SHALL apply alternating row colors (white and light gray #F2F2F2) to data rows
11. THE Excel_Formatter SHALL apply bold formatting to the TOTAL row
12. THE Excel_Formatter SHALL apply a light blue background (#D9E1F2) to the header row
13. THE Excel_Formatter SHALL freeze the header row (row 2) for scrolling
14. THE Excel_Formatter SHALL set page orientation to landscape for printing
15. THE Excel_Formatter SHALL ensure all columns fit on one printed page

### Requirement 7: Excel File Generation and Download

**User Story:** As a report administrator, I want to download the generated Excel report with one click, so that I can deliver it to clients immediately.

#### Acceptance Criteria

1. WHEN report generation is complete, THE System SHALL create file "Team_Performance_Report.xlsx"
2. THE System SHALL save the file in XLSX format compatible with Microsoft Excel 2010 and later
3. WHEN the file is created, THE System SHALL display a "Download Report" button
4. WHEN the user clicks "Download Report", THE System SHALL initiate file download to browser default location
5. THE System SHALL set the downloaded filename to "Team_Performance_Report.xlsx"
6. WHEN download completes, THE System SHALL display success message "Report downloaded successfully"
7. THE System SHALL retain the generated file for the current session to allow multiple downloads

### Requirement 8: Error Handling

**User Story:** As a report administrator, I want clear error messages when processing fails, so that I can correct issues and retry.

#### Acceptance Criteria

1. IF an error occurs during any processing stage, THEN THE System SHALL display an error message describing the specific issue
2. WHEN an error is displayed, THE System SHALL log error details including timestamp, error type, and stack trace
3. THE System SHALL allow the user to retry the operation after an error without requiring page reload
4. WHEN processing is in progress, THE System SHALL display a progress indicator with status text
5. WHEN processing completes successfully, THE System SHALL display success message "Report generated successfully"

### Requirement 9: Data Quality Validation

**User Story:** As a report administrator, I want data quality validation during processing, so that reports contain accurate information.

#### Acceptance Criteria

1. THE Validator SHALL verify that at least one valid Agent_Record exists after processing
2. IF no valid Agent_Records exist, THEN THE System SHALL display error "No valid agent records found in the uploaded file"
3. THE Validator SHALL count the number of skipped rows during processing
4. WHEN processing completes, THE System SHALL display the count of skipped rows if greater than zero
5. THE Validator SHALL verify that numeric columns contain valid numbers
6. IF a numeric field contains non-numeric characters, THEN THE Data_Processor SHALL treat the value as zero and log a warning

### Requirement 10: Single Sheet Report Structure

**User Story:** As a client, I want all data in a single sheet matching my template, so that I can use the report without modifications.

#### Acceptance Criteria

1. THE Report_Generator SHALL create exactly one worksheet in Team_Performance_Report.xlsx
2. THE Report_Generator SHALL name the worksheet "Till Time"
3. THE Report_Generator SHALL place the title in row 1
4. THE Report_Generator SHALL place column headers in row 2
5. THE Report_Generator SHALL place agent data rows starting from row 3
6. THE Report_Generator SHALL place the TOTAL row after all agent data rows
7. THE Report_Generator SHALL ensure no additional sheets, dashboards, or analytics are created
8. THE Report_Generator SHALL ensure the report visually matches the client template exactly

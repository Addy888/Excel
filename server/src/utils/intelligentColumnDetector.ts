/**
 * Intelligent Column Detector
 * Automatically detects column mappings using fuzzy matching and aliases
 * NO manual mapping required
 */

export interface ColumnAliases {
  [key: string]: string[];
}

export interface DetectedColumns {
  userName?: string;
  userId?: string;
  dateOfJoining?: string;
  date?: string;
  calls?: string;
  totalDialed?: string;
  cp?: string;
  cmdis?: string;
  callbk?: string;
  vc?: string;
  connectedCalls?: string;
  qualified?: string;
  inProcess?: string;
  vcScheduled?: string;
  vcDone?: string;
  bookingDone?: string;
  tokenDone?: string;
  remark?: string;
  status?: string;
  disposition?: string;
  [key: string]: string | undefined;
}

// Comprehensive column aliases for intelligent detection
const COLUMN_ALIASES: ColumnAliases = {
  // Agent/User Name variations
  userName: [
    'user name', 'username', 'user_name',
    'agent', 'agent name', 'agentname', 'agent_name',
    'caller', 'caller name', 'callername', 'caller_name', "caller's name",
    'employee', 'employee name', 'employeename', 'employee_name',
    'executive', 'executive name',
    'user', 'name', 'full name', 'fullname',
    'rep', 'representative', 'sales rep',
    'operator', 'operator name',
    'staff', 'staff name',
    'member', 'team member',
  ],

  // User ID variations
  userId: [
    'user id', 'userid', 'user_id',
    'agent id', 'agentid', 'agent_id',
    'employee id', 'employeeid', 'employee_id', 'emp id', 'empid',
    'id', 'unique id', 'uniqueid',
    'code', 'user code', 'agent code', 'emp code',
  ],

  // Date of Joining variations
  dateOfJoining: [
    'date of joining', 'dateofjoining', 'date_of_joining',
    'joining date', 'joiningdate', 'joining_date',
    'join date', 'joindate', 'join_date',
    'start date', 'startdate', 'start_date',
    'onboarding date', 'onboardingdate',
    'hire date', 'hiredate', 'hire_date',
    'doj',
  ],

  // Date variations
  date: [
    'date', 'call date', 'calldate', 'call_date',
    'activity date', 'activitydate', 'activity_date',
    'transaction date', 'transactiondate',
    'entry date', 'entrydate',
    'record date', 'recorddate',
    'created date', 'createddate',
    'timestamp', 'time stamp',
  ],

  // Total Dialed/Calls variations
  calls: [
    'calls', 'call', 'total calls', 'totalcalls', 'total_calls',
    'dialed', 'total dialed', 'totaldialed', 'total_dialed',
    'dial', 'dials', 'total dial', 'total dials',
    'attempts', 'total attempts', 'totalattempts',
    'outbound', 'outbound calls',
    'contacts', 'total contacts',
    'count', 'call count',
  ],

  // Connected Personal variations
  cp: [
    'cp', 'c.p.', 'c p',
    'connected personal', 'connectedpersonal', 'connected_personal',
    'personal', 'personal connected',
    'direct connect', 'directconnect',
  ],

  // CMDIS (Qualified) variations
  cmdis: [
    'cmdis', 'cmd is', 'c.m.d.i.s',
    'call made disposition', 'call made - disposition',
    'qualified', 'qualified leads', 'qualifiedleads',
    'interested', 'interest', 'interested leads',
    'hot', 'hot leads', 'hot lead',
    'warm', 'warm leads', 'warm lead',
    'positive', 'positive response',
    'prospect', 'prospects',
  ],

  // Callback (In Process) variations
  callbk: [
    'callbk', 'call bk', 'call back', 'callback', 'call_back',
    'call back scheduled', 'callbackscheduled',
    'follow up', 'followup', 'follow-up', 'follow_up',
    'in process', 'inprocess', 'in_process',
    'pending', 'pending followup', 'pending follow-up',
    'scheduled', 'scheduled callback',
    'future', 'future contact',
  ],

  // VC (Video Conference) variations
  vc: [
    'vc', 'v.c.', 'v c',
    'video conference', 'videoconference', 'video_conference',
    'vc scheduled', 'vcscheduled', 'vc_scheduled',
    'video call', 'videocall', 'video_call',
    'meeting', 'meeting scheduled',
    'demo', 'demo scheduled',
    'presentation', 'presentation scheduled',
  ],

  // Connected Calls variations
  connectedCalls: [
    'connected', 'connected calls', 'connectedcalls', 'connected_calls',
    'answered', 'answered calls',
    'pickup', 'picked up', 'pickedup',
    'successful', 'successful calls',
    'reached', 'reached calls',
  ],

  // VC Done variations
  vcDone: [
    'vc done', 'vcdone', 'vc_done',
    'vc completed', 'vccompleted', 'vc_completed',
    'video conference done', 'video conference completed',
    'meeting done', 'meeting completed',
    'demo done', 'demo completed',
  ],

  // Booking Done variations
  bookingDone: [
    'booking', 'booking done', 'bookingdone', 'booking_done',
    'booked', 'bookings',
    'reserved', 'reservation', 'reservations',
    'confirmed', 'confirmation', 'confirmations',
    'appointment', 'appointments', 'appointment booked',
    'order', 'orders', 'order placed',
  ],

  // Token Done variations
  tokenDone: [
    'token', 'token done', 'tokendone', 'token_done',
    'token paid', 'tokenpaid', 'token_paid',
    'token received', 'tokenreceived',
    'advance', 'advance paid', 'advance received',
    'payment', 'payment received',
    'deposit', 'deposit paid',
  ],

  // Remark variations
  remark: [
    'remark', 'remarks', 'comment', 'comments',
    'note', 'notes', 'notation',
    'description', 'desc',
    'observation', 'observations',
    'feedback', 'response',
    'details', 'additional details',
  ],

  // Status variations
  status: [
    'status', 'call status', 'callstatus', 'call_status',
    'disposition', 'call disposition',
    'result', 'call result',
    'outcome', 'call outcome',
    'state', 'current status',
  ],
};

/**
 * Normalize string for comparison
 */
function normalizeString(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[_\s-]+/g, ' ')
    .replace(/[^\w\s]/g, '');
}

/**
 * Calculate similarity between two strings (Levenshtein distance)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeString(str1);
  const s2 = normalizeString(str2);

  if (s1 === s2) return 1.0;

  const matrix: number[][] = [];
  const len1 = s1.length;
  const len2 = s2.length;

  if (len1 === 0) return len2 === 0 ? 1.0 : 0.0;
  if (len2 === 0) return 0.0;

  // Initialize matrix
  for (let i = 0; i <= len1; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= len2; j++) {
    matrix[0][j] = j;
  }

  // Fill matrix
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  const maxLen = Math.max(len1, len2);
  return 1 - (matrix[len1][len2] / maxLen);
}

/**
 * Find best matching column for a field
 */
function findBestMatch(
  csvHeaders: string[],
  aliases: string[],
  threshold: number = 0.75
): string | undefined {
  let bestMatch: string | undefined;
  let bestScore = 0;

  for (const header of csvHeaders) {
    const normalizedHeader = normalizeString(header);

    for (const alias of aliases) {
      const normalizedAlias = normalizeString(alias);
      
      // Exact match (highest priority)
      if (normalizedHeader === normalizedAlias) {
        return header;
      }

      // Contains match (high priority)
      if (normalizedHeader.includes(normalizedAlias) || normalizedAlias.includes(normalizedHeader)) {
        const score = 0.9;
        if (score > bestScore) {
          bestScore = score;
          bestMatch = header;
        }
      }

      // Fuzzy match (lower priority)
      const similarity = calculateSimilarity(normalizedHeader, normalizedAlias);
      if (similarity >= threshold && similarity > bestScore) {
        bestScore = similarity;
        bestMatch = header;
      }
    }
  }

  return bestScore >= threshold ? bestMatch : undefined;
}

/**
 * Detect all columns automatically from CSV headers
 */
export function detectColumns(csvHeaders: string[]): DetectedColumns {
  const detected: DetectedColumns = {};

  // Detect each field type
  for (const [fieldName, aliases] of Object.entries(COLUMN_ALIASES)) {
    const match = findBestMatch(csvHeaders, aliases);
    if (match) {
      detected[fieldName] = match;
    }
  }

  // Special handling: if 'calls' not found but 'totalDialed' found, use it
  if (!detected.calls && detected.totalDialed) {
    detected.calls = detected.totalDialed;
  }

  // Special handling: if 'totalDialed' not found but 'calls' found, use it
  if (!detected.totalDialed && detected.calls) {
    detected.totalDialed = detected.calls;
  }

  return detected;
}

/**
 * Validate detected columns - ensure minimum required fields
 */
export function validateDetectedColumns(detected: DetectedColumns): {
  isValid: boolean;
  missingCritical: string[];
  availableFields: string[];
} {
  const criticalFields = ['userName', 'calls'];
  const missingCritical: string[] = [];
  const availableFields: string[] = [];

  // Check critical fields
  for (const field of criticalFields) {
    if (!detected[field]) {
      missingCritical.push(field);
    }
  }

  // List available fields
  for (const [key, value] of Object.entries(detected)) {
    if (value) {
      availableFields.push(key);
    }
  }

  return {
    isValid: missingCritical.length === 0,
    missingCritical,
    availableFields,
  };
}

/**
 * Get human-readable field names
 */
export function getFieldDisplayName(fieldName: string): string {
  const displayNames: { [key: string]: string } = {
    userName: 'Agent/User Name',
    userId: 'User ID',
    dateOfJoining: 'Date of Joining',
    date: 'Date',
    calls: 'Total Dialed',
    totalDialed: 'Total Dialed',
    cp: 'Connected Personal',
    cmdis: 'Qualified (CMDIS)',
    callbk: 'Callback/In Process',
    vc: 'VC Scheduled',
    connectedCalls: 'Connected Calls',
    qualified: 'Qualified',
    inProcess: 'In Process',
    vcScheduled: 'VC Scheduled',
    vcDone: 'VC Done',
    bookingDone: 'Booking Done',
    tokenDone: 'Token Done',
    remark: 'Remark',
    status: 'Status',
  };

  return displayNames[fieldName] || fieldName;
}

/**
 * Generate detection report for debugging
 */
export function generateDetectionReport(
  csvHeaders: string[],
  detected: DetectedColumns
): string {
  let report = '=== INTELLIGENT COLUMN DETECTION REPORT ===\n\n';
  report += `CSV Headers (${csvHeaders.length} total):\n`;
  csvHeaders.forEach((h, i) => {
    report += `  ${i + 1}. "${h}"\n`;
  });

  report += '\n=== DETECTED MAPPINGS ===\n';
  const detectedCount = Object.values(detected).filter(v => v).length;
  report += `Successfully detected ${detectedCount} fields:\n\n`;

  for (const [fieldName, csvColumn] of Object.entries(detected)) {
    if (csvColumn) {
      report += `✓ ${getFieldDisplayName(fieldName)}\n`;
      report += `  → Mapped to: "${csvColumn}"\n\n`;
    }
  }

  const notDetected = Object.keys(COLUMN_ALIASES).filter(
    key => !detected[key]
  );

  if (notDetected.length > 0) {
    report += '=== NOT DETECTED (Optional) ===\n';
    notDetected.forEach(field => {
      report += `✗ ${getFieldDisplayName(field)}\n`;
    });
  }

  const validation = validateDetectedColumns(detected);
  report += '\n=== VALIDATION RESULT ===\n';
  if (validation.isValid) {
    report += '✓ All critical fields detected\n';
    report += '✓ Ready to generate report\n';
  } else {
    report += '✗ Missing critical fields:\n';
    validation.missingCritical.forEach(field => {
      report += `  - ${getFieldDisplayName(field)}\n`;
    });
  }

  return report;
}

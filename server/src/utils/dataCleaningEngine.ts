export interface CleaningResult {
  cleanedData: any[];
  validationReport: {
    totalRows: number;
    validRows: number;
    invalidRows: number;
    duplicateRows: number;
    emptyRows: number;
    errors: any[];
    warnings: any[];
    cleaningActions: any[];
  };
}

export const cleanData = (rawData: any[], columnMapping?: Record<string, string>): CleaningResult => {
  const errors: any[] = [];
  const warnings: any[] = [];
  const cleaningActions: any[] = [];
  let duplicateCount = 0;
  let emptyRowCount = 0;

  // Step 1: Remove completely empty rows
  let data = rawData.filter((row, index) => {
    const isEmpty = Object.values(row).every(val => !val || String(val).trim() === '');
    if (isEmpty) {
      emptyRowCount++;
      errors.push({
        row: index + 1,
        field: 'all',
        value: null,
        error: 'Empty row removed',
      });
    }
    return !isEmpty;
  });

  if (emptyRowCount > 0) {
    cleaningActions.push({ action: 'Removed empty rows', count: emptyRowCount });
  }

  // Step 2: Trim all string values
  let trimCount = 0;
  data = data.map((row, index) => {
    const cleaned: any = {};
    Object.keys(row).forEach(key => {
      const value = row[key];
      if (typeof value === 'string') {
        const trimmed = value.trim();
        if (trimmed !== value) trimCount++;
        cleaned[key] = trimmed;
      } else {
        cleaned[key] = value;
      }
    });
    return cleaned;
  });

  if (trimCount > 0) {
    cleaningActions.push({ action: 'Trimmed whitespace', count: trimCount });
  }

  // Step 3: Normalize phone numbers
  let phoneNormalizedCount = 0;
  data = data.map((row, index) => {
    const phoneFields = ['Mobile', 'Phone', 'PhoneNumber', 'Phone Number', 'mobile', 'phone'];
    phoneFields.forEach(field => {
      if (row[field]) {
        const original = String(row[field]);
        const normalized = original.replace(/[^\d]/g, '');
        if (normalized !== original) {
          phoneNormalizedCount++;
          warnings.push({
            row: index + 1,
            field,
            value: original,
            warning: `Phone number normalized to ${normalized}`,
          });
        }
        row[field] = normalized;
      }
    });
    return row;
  });

  if (phoneNormalizedCount > 0) {
    cleaningActions.push({ action: 'Normalized phone numbers', count: phoneNormalizedCount });
  }

  // Step 4: Standardize dates
  let dateStandardizedCount = 0;
  data = data.map((row, index) => {
    const dateFields = ['Date', 'CallDate', 'CreatedDate', 'date', 'call_date'];
    dateFields.forEach(field => {
      if (row[field]) {
        try {
          const date = new Date(row[field]);
          if (!isNaN(date.getTime())) {
            row[field] = date.toISOString().split('T')[0];
            dateStandardizedCount++;
          } else {
            warnings.push({
              row: index + 1,
              field,
              value: row[field],
              warning: 'Invalid date format',
            });
          }
        } catch (e) {
          warnings.push({
            row: index + 1,
            field,
            value: row[field],
            warning: 'Could not parse date',
          });
        }
      }
    });
    return row;
  });

  if (dateStandardizedCount > 0) {
    cleaningActions.push({ action: 'Standardized dates', count: dateStandardizedCount });
  }

  // Step 5: Detect duplicates (by phone number)
  const phoneMap = new Map<string, number[]>();
  data.forEach((row, index) => {
    const phoneFields = ['Mobile', 'Phone', 'PhoneNumber', 'mobile', 'phone'];
    for (const field of phoneFields) {
      if (row[field]) {
        const phone = String(row[field]);
        if (!phoneMap.has(phone)) {
          phoneMap.set(phone, []);
        }
        phoneMap.get(phone)!.push(index);
        break;
      }
    }
  });

  const duplicateIndices = new Set<number>();
  phoneMap.forEach((indices, phone) => {
    if (indices.length > 1) {
      duplicateCount += indices.length - 1;
      for (let i = 1; i < indices.length; i++) {
        duplicateIndices.add(indices[i]);
        warnings.push({
          row: indices[i] + 1,
          field: 'Phone',
          value: phone,
          warning: `Duplicate phone number (first occurrence at row ${indices[0] + 1})`,
        });
      }
    }
  });

  // Filter out duplicate rows
  const cleanedData = data.filter((_, index) => !duplicateIndices.has(index));

  if (duplicateCount > 0) {
    cleaningActions.push({ action: 'Removed duplicate rows', count: duplicateCount });
  }

  const totalRows = rawData.length;
  const validRows = cleanedData.length;
  const invalidRows = errors.filter(e => e.error.includes('Missing required')).length;

  return {
    cleanedData,
    validationReport: {
      totalRows,
      validRows,
      invalidRows,
      duplicateRows: duplicateCount,
      emptyRows: emptyRowCount,
      errors,
      warnings,
      cleaningActions,
    },
  };
};

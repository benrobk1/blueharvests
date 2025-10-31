export interface CSVProductRow {
  name: string;
  description?: string;
  price: string;
  unit: string;
  available_quantity: string;
  image_url?: string;
}

export interface CSVParseResult {
  valid: CSVProductRow[];
  errors: Array<{ row: number; field: string; error: string }>;
}

export function parseProductCSV(fileContent: string): CSVParseResult {
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  if (lines.length < 2) {
    return { 
      valid: [], 
      errors: [{ row: 0, field: 'file', error: 'CSV file is empty or missing header' }] 
    };
  }

  // Parse header
  const header = lines[0].split(',').map(h => h.trim().toLowerCase());
  const requiredFields = ['name', 'price', 'unit', 'available_quantity'];
  
  // Validate header
  const missingFields = requiredFields.filter(f => !header.includes(f));
  if (missingFields.length > 0) {
    return { 
      valid: [], 
      errors: [{ 
        row: 0, 
        field: 'header', 
        error: `Missing required columns: ${missingFields.join(', ')}` 
      }] 
    };
  }

  const valid: CSVProductRow[] = [];
  const errors: Array<{ row: number; field: string; error: string }> = [];

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim());
    const row: any = {};

    // Map values to fields
    header.forEach((field, index) => {
      row[field] = values[index] || '';
    });

    // Validate required fields
    let hasError = false;
    
    if (!row.name) {
      errors.push({ row: i + 1, field: 'name', error: 'Product name is required' });
      hasError = true;
    }
    
    if (!row.price || isNaN(parseFloat(row.price))) {
      errors.push({ row: i + 1, field: 'price', error: 'Valid price is required' });
      hasError = true;
    }
    
    if (!row.unit) {
      errors.push({ row: i + 1, field: 'unit', error: 'Unit is required' });
      hasError = true;
    }
    
    if (!row.available_quantity || isNaN(parseInt(row.available_quantity))) {
      errors.push({ row: i + 1, field: 'available_quantity', error: 'Valid quantity is required' });
      hasError = true;
    }

    // Validate optional image URL
    if (row.image_url && !isValidUrl(row.image_url)) {
      errors.push({ row: i + 1, field: 'image_url', error: 'Invalid image URL format' });
      hasError = true;
    }

    if (!hasError) {
      valid.push({
        name: row.name,
        description: row.description || '',
        price: row.price,
        unit: row.unit,
        available_quantity: row.available_quantity,
        image_url: row.image_url || '',
      });
    }
  }

  return { valid, errors };
}

function isValidUrl(string: string): boolean {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

// CSV Template Generator
export function generateCSVTemplate(): string {
  const header = 'name,description,price,unit,available_quantity,image_url';
  const example1 = 'Organic Tomatoes,Fresh heirloom tomatoes,4.99,lb,50,https://example.com/tomatoes.jpg';
  const example2 = 'Baby Carrots,Sweet baby carrots,3.49,lb,30,';
  const example3 = 'Mixed Greens,Organic salad mix,5.99,bunch,20,';
  
  return [header, example1, example2, example3].join('\n');
}

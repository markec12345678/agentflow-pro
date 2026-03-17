/**
 * eDavki XML Export Generator
 * 
 * Generates XML files for submission to Slovenian eDavki portal.
 * Supports:
 * - TUR-1 form (Tourist Tax)
 * - DDV-O form (VAT Return)
 * 
 * @see https://edavki.durs.si/
 */

import { MonthlyTaxReport } from './monthly-report-generator';

export interface EDavkiExportOptions {
  propertyTaxNumber: string;
  propertyName: string;
  propertyAddress: string;
  reportType: 'TUR1' | 'DDV-O';
}

/**
 * Generate TUR-1 XML (Tourist Tax)
 */
export function generateTUR1XML(
  report: MonthlyTaxReport,
  options: EDavkiExportOptions
): string {
  const { propertyTaxNumber, propertyName, propertyAddress } = options;
  
  // XML builder
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<Tur1 xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" verzija="1.0">',
    '',
    '  <!-- Header -->',
    '  <Glava>',
    `    <DavcnaSt>${propertyTaxNumber}</DavcnaSt>`,
    `    <ObdobjeMesec>${String(report.month).padStart(2, '0')}</ObdobjeMesec>`,
    `    <ObdobjeLeto>${report.year}</ObdobjeLeto>`,
    `    <DatumIzpolnitve>${new Date().toISOString().split('T')[0]}</DatumIzpolnitve>`,
    '  </Glava>',
    '',
    '  <!-- Property Info -->',
    '  <Zavezanec>',
    `    <Naziv>${escapeXML(propertyName)}</Naziv>`,
    `    <Naslov>${escapeXML(propertyAddress)}</Naslov>`,
    `    <DavcnaSt>${propertyTaxNumber}</DavcnaSt>`,
    '  </Zavezanec>',
    '',
    '  <!-- Tourist Tax Summary -->',
    '  <TuristicnaTaksa>',
    `    <SteviloNocitev>${report.touristTax.totalNights}</SteviloNocitev>`,
    `    <SteviloOseb>${report.touristTax.totalGuests}</SteviloOseb>`,
    `    <SteviloOdraslih>${report.touristTax.totalAdults}</SteviloOdraslih>`,
    `    <SteviloOtrok>${report.touristTax.totalChildren}</SteviloOtrok>`,
    `    <Znesek>${report.touristTax.totalAmount.toFixed(2)}</Znesek>`,
    '  </TuristicnaTaksa>',
    '',
    '  <!-- Breakdown by Municipality -->',
    '  <Obcine>',
  ];
  
  for (const mun of report.touristTax.byMunicipality) {
    lines.push('    <Obcina>');
    lines.push(`      <Naziv>${escapeXML(mun.municipality)}</Naziv>`);
    lines.push(`      <Nocitve>${mun.nights}</Nocitve>`);
    lines.push(`      <Osebe>${mun.guests}</Osebe>`);
    lines.push(`      <Znesek>${mun.amount.toFixed(2)}</Znesek>`);
    lines.push('    </Obcina>');
  }
  
  lines.push('  </Obcine>');
  lines.push('');
  lines.push('  <!-- Totals -->',);
  lines.push('  <Skupaj>');
  lines.push(`    <ZnesekZaPlacilo>${report.totals.totalToRemit.toFixed(2)}</ZnesekZaPlacilo>`);
  lines.push('  </Skupaj>');
  lines.push('');
  lines.push('</Tur1>');
  
  return lines.join('\n');
}

/**
 * Generate DDV-O XML (VAT Return)
 */
export function generateDDVOXML(
  report: MonthlyTaxReport,
  options: EDavkiExportOptions
): string {
  const { propertyTaxNumber, propertyName, propertyAddress } = options;
  
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<DdvO xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" verzija="1.0">',
    '',
    '  <!-- Header -->',
    '  <Glava>',
    `    <DavcnaSt>${propertyTaxNumber}</DavcnaSt>`,
    `    <ObdobjeMesec>${String(report.month).padStart(2, '0')}</ObdobjeMesec>`,
    `    <ObdobjeLeto>${report.year}</ObdobjeLeto>`,
    `    <DatumIzpolnitve>${new Date().toISOString().split('T')[0]}</DatumIzpolnitve>`,
    '  </Glava>',
    '',
    '  <!-- Property Info -->',
    '  <Zavezanec>',
    `    <Naziv>${escapeXML(propertyName)}</Naziv>`,
    `    <Naslov>${escapeXML(propertyAddress)}</Naslov>`,
    `    <DavcnaSt>${propertyTaxNumber}</DavcnaSt>`,
    '  </Zavezanec>',
    '',
    '  <!-- VAT Section -->',
    '  <DDV>',
    '',
    '    <!-- 9.5% Rate (Accommodation) -->',
    '    <Stopnja95>',
    `      <Osnova>${report.vat.accommodation.taxableBase.toFixed(2)}</Osnova>`,
    `      <Davek>${report.vat.accommodation.vatAmount.toFixed(2)}</Davek>`,
    '    </Stopnja95>',
    '',
    '    <!-- 22% Rate (Food & Services) -->',
    '    <Stopnja22>',
    `      <Osnova>${(report.vat.food.taxableBase + report.vat.services.taxableBase).toFixed(2)}</Osnova>`,
    `      <Davek>${(report.vat.food.vatAmount + report.vat.services.vatAmount).toFixed(2)}</Davek>`,
    '    </Stopnja22>',
    '',
    '    <!-- Totals -->',
    '    <SkupajOsnova>',
    `      ${report.vat.totalTaxableBase.toFixed(2)}`,
    '    </SkupajOsnova>',
    '    <SkupajDavek>',
    `      ${report.vat.totalVATAmount.toFixed(2)}`,
    '    </SkupajDavek>',
    '  </DDV>',
    '',
    '</DdvO>',
  ];
  
  return lines.join('\n');
}

/**
 * Generate combined export (both TUR-1 and DDV-O)
 */
export function generateCombinedExport(
  report: MonthlyTaxReport,
  options: EDavkiExportOptions
): {
  tur1: string;
  ddvO: string;
  combined: string;
} {
  const tur1 = generateTUR1XML(report, options);
  const ddvO = generateDDVOXML(report, options);
  
  // Combined XML
  const combined = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<KombiniranoPorocilo verzija="1.0">',
    '',
    '  <Meta>',
    `    <DavcnaSt>${propertyTaxNumber}</DavcnaSt>`,
    `    <ObdobjeMesec>${report.month}</ObdobjeMesec>`,
    `    <ObdobjeLeto>${report.year}</ObdobjeLeto>`,
    `    <Generirano>${new Date().toISOString()}</Generirano>`,
    '  </Meta>',
    '',
    '  <!-- TUR-1 (Tourist Tax) -->',
    tur1
      .split('\n')
      .map((line) => '  ' + line)
      .filter((line) => !line.includes('<?xml'))
      .join('\n'),
    '',
    '  <!-- DDV-O (VAT Return) -->',
    ddvO
      .split('\n')
      .map((line) => '  ' + line)
      .filter((line) => !line.includes('<?xml'))
      .join('\n'),
    '',
    '</KombiniranoPorocilo>',
  ];
  
  return {
    tur1,
    ddvO,
    combined,
  };
}

/**
 * Escape XML special characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Validate XML against eDavki schema
 * Note: This is a basic validation. For production, use official XSD schemas.
 */
export function validateEDavkiXML(xml: string, type: 'TUR1' | 'DDV-O'): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Check XML declaration
  if (!xml.includes('<?xml version="1.0" encoding="UTF-8"?>')) {
    errors.push('Missing or invalid XML declaration');
  }
  
  // Check root element
  if (type === 'TUR1' && !xml.includes('<Tur1')) {
    errors.push('Missing TUR1 root element');
  }
  if (type === 'DDV-O' && !xml.includes('<DdvO')) {
    errors.push('Missing DDV-O root element');
  }
  
  // Check required fields
  const requiredFields = ['DavcnaSt', 'ObdobjeMesec', 'ObdobjeLeto'];
  for (const field of requiredFields) {
    if (!xml.includes(`<${field}>`)) {
      errors.push(`Missing required field: ${field}`);
    }
  }
  
  // Check for balanced tags
  const openTags = (xml.match(/<([a-zA-Z0-9]+)(?:\s|>|\/)/g) || []).length;
  const closeTags = (xml.match(/<\/([a-zA-Z0-9]+)>/g) || []).length;
  const selfCloseTags = (xml.match(/<([a-zA-Z0-9]+)\s*\/>/g) || []).length;
  
  if (openTags !== closeTags + selfCloseTags) {
    errors.push('Unbalanced XML tags');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get filename for export
 */
export function getExportFilename(
  report: MonthlyTaxReport,
  type: 'TUR1' | 'DDV-O' | 'COMBINED',
  propertyTaxNumber: string
): string {
  const date = new Date().toISOString().split('T')[0];
  const month = String(report.month).padStart(2, '0');
  
  switch (type) {
    case 'TUR1':
      return `TUR1_${propertyTaxNumber}_${report.year}_${month}_${date}.xml`;
    case 'DDV-O':
      return `DDVO_${propertyTaxNumber}_${report.year}_${month}_${date}.xml`;
    case 'COMBINED':
      return `KOMBINIRANO_${propertyTaxNumber}_${report.year}_${month}_${date}.xml`;
  }
}

/**
 * Download XML file (browser)
 */
export function downloadXML(filename: string, content: string): void {
  if (typeof window === 'undefined') {
    throw new Error('downloadXML can only be used in browser environment');
  }
  
  const blob = new Blob([content], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Save XML to file (Node.js)
 */
export async function saveXMLToFile(
  filename: string,
  content: string,
  directory: string
): Promise<string> {
  const fs = await import('fs');
  const path = await import('path');
  
  const fullPath = path.join(directory, filename);
  await fs.promises.writeFile(fullPath, content, 'utf-8');
  
  return fullPath;
}

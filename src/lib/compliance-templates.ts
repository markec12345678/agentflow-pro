/**
 * AgentFlow Pro - Tourism Compliance Templates
 * GDPR, licensing, and regulatory compliance for tourism industry
 */

export interface ComplianceTemplate {
  id: string;
  name: string;
  type: 'gdpr' | 'licensing' | 'accessibility' | 'safety' | 'environmental';
  category: string;
  jurisdiction: string;
  template: string;
  variables: string[];
  languages: Record<string, string>;
  requiredFields: string[];
  validationRules: ValidationRule[];
  lastUpdated: Date;
  version: string;
}

export interface ValidationRule {
  field: string;
  type: 'required' | 'format' | 'length' | 'regex' | 'date_range' | 'email' | 'phone';
  rule: string;
  errorMessage: string;
}

export interface ComplianceCheck {
  templateId: string;
  status: 'compliant' | 'non_compliant' | 'warning' | 'error';
  score: number;
  issues: ComplianceIssue[];
  recommendations: string[];
  checkedAt: Date;
}

export interface ComplianceIssue {
  field: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  suggestion: string;
  autoFixable: boolean;
}

export class TourismComplianceManager {
  private templates: Map<string, ComplianceTemplate> = new Map();

  constructor() {
    this.initializeComplianceTemplates();
  }

  private initializeComplianceTemplates(): void {
    const complianceTemplates: ComplianceTemplate[] = [
      {
        id: 'gdpr_privacy_notice',
        name: 'GDPR Privacy Notice',
        type: 'gdpr',
        category: 'Data Protection',
        jurisdiction: 'EU',
        template: `# Privacy Notice for {propertyName}

## Your Privacy Rights

Under the General Data Protection Regulation (GDPR), you have the following rights regarding your personal data:

### 1. Right to Information
We collect and process the following types of data:
- **Personal Information**: Name, contact details, identification documents
- **Booking Data**: Reservation details, payment information, preferences  
- **Communication Data**: Email correspondence, feedback, reviews
- **Technical Data**: IP address, device information, cookies

### 2. Right to Access
You can request access to your personal data by contacting us at:
- Email: {contactEmail}
- Phone: {contactPhone}

### 3. Right to Rectification  
If your personal data is inaccurate, you have the right to request correction.

### 4. Right to Erasure
You can request deletion of your personal data, subject to legal obligations.

### 5. Right to Restrict Processing
You can request restriction of processing under certain circumstances.

### 6. Right to Data Portability
You can request your data in a structured, machine-readable format.

### 7. Right to Object
You have the right to object to processing of your personal data.

## Data Retention
We retain your personal data for the following periods:
- **Booking Data**: 2 years after checkout
- **Communication Data**: 3 years after last interaction
- **Review Data**: Indefinite (unless requested for deletion)

## Contact for Data Protection
Data Protection Officer: {dpoName}
Email: {dpoEmail}
Phone: {dpoPhone}

## Legal Basis for Processing
- **Contract Necessity**: For booking fulfillment
- **Legal Obligation**: For accounting and regulatory compliance
- **Legitimate Interest**: For marketing and service improvement (with opt-out option)

Last updated: {lastUpdated}`,
        variables: ['propertyName', 'contactEmail', 'contactPhone', 'dpoName', 'dpoEmail', 'dpoPhone', 'lastUpdated'],
        languages: {
          en: 'English template',
          sl: 'Slovenski predloga'
        },
        requiredFields: ['propertyName', 'contactEmail', 'dpoName', 'dpoEmail'],
        validationRules: [
          {
            field: 'contactEmail',
            type: 'email',
            rule: '^[\\w\\.-]+@[\\w\\.-]+\\.\\w+$',
            errorMessage: 'Please provide a valid email address'
          },
          {
            field: 'dpoName',
            type: 'required',
            rule: 'must_not_be_empty',
            errorMessage: 'Data Protection Officer name is required'
          }
        ],
        lastUpdated: new Date(),
        version: '1.0'
      },
      {
        id: 'tourism_license_slovenia',
        name: 'Slovenia Tourism License',
        type: 'licensing',
        category: 'Business Registration',
        jurisdiction: 'SI',
        template: `# Tourism License Information for {companyName}

## Business Registration Details

**Company Name**: {companyName}
**Registration Number**: {registrationNumber}
**Tax Number**: {taxNumber}
**License Type**: {licenseType}

## Tourism-Specific Licenses

### Accommodation License
- **License Number**: {accommodationLicense}
- **Valid Until**: {licenseExpiry}
- **Category**: {accommodationCategory}
- **Maximum Capacity**: {maxCapacity} guests
- **Inspection Requirements**: Annual safety and quality inspections

### Food Service License (if applicable)
- **License Number**: {foodLicense}
- **Valid Until**: {foodLicenseExpiry}
- **Health Inspection**: Required every 6 months

### Tour Guide License (if applicable)
- **License Number**: {guideLicense}
- **Valid Until**: {guideLicenseExpiry}
- **Language Requirements**: Must demonstrate proficiency in {requiredLanguages}

## Regulatory Compliance

### Tax Obligations
- **Tourist Tax**: {touristTaxRate}% applicable to accommodation services
- **VAT**: Standard rate {vatRate}% on tourism services
- **Reporting Requirements**: Monthly tax filings required

### Safety Requirements
- **Fire Safety**: Annual certification required
- **Emergency Exits**: Must be clearly marked and accessible
- **First Aid**: Certified staff on duty during business hours
- **Insurance**: Public liability insurance minimum €{minInsurance} coverage

### Accessibility Requirements
- **Wheelchair Access**: Required for properties with >10 rooms
- **Visual Assistance**: Braille information available upon request
- **Hearing Assistance**: Visual alarm systems required

## Employee Requirements
- **Language Proficiency**: Staff must speak {requiredLanguages}
- **Training**: Annual hospitality and safety training mandatory
- **Background Checks**: Required for all staff working with minors

## Inspection Schedule
- **Regular Inspections**: Annually or biannually based on license type
- **Random Inspections**: Without prior notice
- **Complaint Response**: Must respond within 5 working days

## Contact Information
**Regulatory Authority**: {regulatoryAuthority}
**Address**: {authorityAddress}
**Phone**: {authorityPhone}
**Email**: {authorityEmail}

## Penalties for Non-Compliance
- **Fine Range**: €{minFine} - €{maxFine}
- **License Suspension**: Up to 90 days for serious violations
- **Criminal Liability**: Possible for severe breaches

License verification available online: {verificationWebsite}

Last updated: {lastUpdated}`,
        variables: [
          'companyName', 'registrationNumber', 'taxNumber', 'licenseType', 'accommodationLicense', 
          'licenseExpiry', 'accommodationCategory', 'maxCapacity', 'foodLicense', 'foodLicenseExpiry',
          'guideLicense', 'guideLicenseExpiry', 'requiredLanguages', 'touristTaxRate', 'vatRate',
          'minInsurance', 'regulatoryAuthority', 'authorityAddress', 'authorityPhone', 'authorityEmail',
          'minFine', 'maxFine', 'verificationWebsite', 'lastUpdated'
        ],
        languages: {
          en: 'English template',
          sl: 'Slovenski predloga'
        },
        requiredFields: ['companyName', 'registrationNumber', 'accommodationLicense', 'licenseExpiry'],
        validationRules: [
          {
            field: 'licenseExpiry',
            type: 'date_range',
            rule: 'must_be_future_date',
            errorMessage: 'License expiry date must be in the future'
          },
          {
            field: 'maxCapacity',
            type: 'length',
            rule: 'max_100',
            errorMessage: 'Maximum capacity cannot exceed 100 guests'
          }
        ],
        lastUpdated: new Date(),
        version: '1.0'
      },
      {
        id: 'accessibility_compliance',
        name: 'Accessibility Standards',
        type: 'accessibility',
        category: 'Inclusivity',
        jurisdiction: 'International',
        template: `# Accessibility Compliance for {propertyName}

## Physical Accessibility

### Mobility Access
- **Wheelchair Access**: {wheelchairAccess}
- **Ramp Access**: {rampAccess}
- **Elevator Access**: {elevatorAccess}
- **Accessible Parking**: {accessibleParkingSpaces} designated spaces
- **Door Width**: Minimum {minDoorWidth}cm for wheelchair access
- **Corridor Width**: Minimum {minCorridorWidth}cm throughout property

### Room Accessibility
- **Accessible Rooms**: {accessibleRooms} out of {totalRooms} rooms
- **Accessible Bathrooms**: {accessibleBathrooms} with grab bars and roll-in showers
- **Emergency Alarms**: Visual and audible alarms in accessible rooms
- **Bed Height**: {bedHeight}cm from floor to top of mattress
- **Switch Height**: {switchHeight}cm from floor for light switches

### Visual Assistance
- **Braille Information**: {brailleAvailable} for room numbers and menus
- **Large Print**: {largePrintAvailable} for menus and information
- **High Contrast**: {highContrastAvailable} signage and markings
- **Audio Guides**: {audioGuidesAvailable} for property tours

### Communication Assistance
- **Hearing Loops**: {hearingLoopsAvailable} at reception and common areas
- **Visual Alarms**: {visualAlarmsAvailable} in all guest rooms
- **TTY/TDD**: {ttyAvailable} for phone communication
- **Sign Language Staff**: {signLanguageStaff} available on request

## Digital Accessibility

### Website Compliance
- **WCAG 2.1 AA**: {websiteWCAGCompliance} compliance level
- **Screen Reader Compatible**: {screenReaderCompatible} website design
- **Keyboard Navigation**: {keyboardNavigationAvailable} for all functions
- **Color Contrast**: {colorContrastCompliant} design elements
- **Font Resizing**: {fontResizingAvailable} up to 200% zoom

### Booking System Accessibility
- **Screen Reader Compatible**: {bookingScreenReaderCompatible}
- **Keyboard Accessible**: {bookingKeyboardAccessible}
- **Voice Recognition**: {voiceRecognitionAvailable} for booking
- **Alternative Text**: {altTextAvailable} for all images

## Service Animal Policy
- **Service Animals Welcome**: {serviceAnimalsWelcome}
- **Documentation Required**: {serviceAnimalDocumentationRequired}
- **No Pet Fees**: {noPetFeesForServiceAnimals}
- **Designated Areas**: {serviceAnimalAreas} for service animal relief

## Training Requirements
- **Staff Training**: {disabilityAwarenessTraining} hours annual training required
- **Emergency Procedures**: {accessibleEmergencyProcedures} for guests with disabilities
- **Assistive Devices**: {assistiveDevicesAvailable} for loan to guests

## Compliance Monitoring
- **Annual Audit**: Required accessibility audit by {auditDate}
- **Guest Feedback**: {accessibilityFeedbackProcess} for accessibility improvements
- **Staff Certification**: {staffCertificationRequired} disability awareness certification

## Contact Information
**Accessibility Coordinator**: {accessibilityCoordinator}
**Email**: {accessibilityEmail}
**Phone**: {accessibilityPhone}
**Emergency**: {emergencyContact}

Last updated: {lastUpdated}`,
        variables: [
          'propertyName', 'wheelchairAccess', 'rampAccess', 'elevatorAccess', 'accessibleParkingSpaces',
          'minDoorWidth', 'minCorridorWidth', 'accessibleRooms', 'totalRooms', 'accessibleBathrooms',
          'bedHeight', 'switchHeight', 'brailleAvailable', 'largePrintAvailable', 'highContrastAvailable',
          'audioGuidesAvailable', 'hearingLoopsAvailable', 'visualAlarmsAvailable', 'ttyAvailable',
          'signLanguageStaff', 'websiteWCAGCompliance', 'screenReaderCompatible', 'keyboardNavigationAvailable',
          'colorContrastCompliant', 'fontResizingAvailable', 'bookingScreenReaderCompatible',
          'bookingKeyboardAccessible', 'voiceRecognitionAvailable', 'altTextAvailable',
          'serviceAnimalsWelcome', 'serviceAnimalDocumentationRequired', 'noPetFeesForServiceAnimals',
          'serviceAnimalAreas', 'disabilityAwarenessTraining', 'accessibleEmergencyProcedures',
          'assistiveDevicesAvailable', 'auditDate', 'accessibilityFeedbackProcess',
          'staffCertificationRequired', 'accessibilityCoordinator', 'accessibilityEmail',
          'accessibilityPhone', 'emergencyContact', 'lastUpdated'
        ],
        languages: {
          en: 'English template',
          sl: 'Slovenski predloga'
        },
        requiredFields: ['propertyName', 'accessibleRooms', 'wheelchairAccess'],
        validationRules: [
          {
            field: 'accessibleRooms',
            type: 'length',
            rule: 'min_1',
            errorMessage: 'At least 1 accessible room is required'
          }
        ],
        lastUpdated: new Date(),
        version: '1.0'
      }
    ];

    complianceTemplates.forEach(template => {
      this.templates.set(template.id, template);
    });
  }

  async checkCompliance(
    templateId: string,
    data: Record<string, any>
  ): Promise<ComplianceCheck> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const issues: ComplianceIssue[] = [];
    let score = 100;

    // Check required fields
    for (const requiredField of template.requiredFields) {
      if (!data[requiredField] || (Array.isArray(data[requiredField]) && data[requiredField].length === 0)) {
        issues.push({
          field: requiredField,
          severity: 'critical',
          description: `Required field ${requiredField} is missing or empty`,
          suggestion: `Provide valid ${requiredField} information`,
          autoFixable: false
        });
        score -= 20;
      }
    }

    // Check validation rules
    for (const rule of template.validationRules) {
      const fieldValue = data[rule.field];
      
      if (!this.validateField(fieldValue, rule)) {
        issues.push({
          field: rule.field,
          severity: rule.field === 'required' ? 'critical' : 'medium',
          description: rule.errorMessage,
          suggestion: this.getValidationSuggestion(rule),
          autoFixable: rule.type === 'format' && rule.autoFixable
        });
        score -= 10;
      }
    }

    // Generate recommendations
    const recommendations = this.generateRecommendations(issues, template);

    const status = score >= 80 ? 'compliant' : 
                  score >= 60 ? 'warning' : 
                  score >= 40 ? 'non_compliant' : 'error';

    return {
      templateId,
      status,
      score,
      issues,
      recommendations,
      checkedAt: new Date()
    };
  }

  private validateField(value: any, rule: ValidationRule): boolean {
    switch (rule.type) {
      case 'required':
        return value !== null && value !== undefined && value !== '';
      
      case 'email':
        const emailRegex = new RegExp(rule.rule);
        return emailRegex.test(value);
      
      case 'phone':
        const phoneRegex = new RegExp(rule.rule);
        return phoneRegex.test(value);
      
      case 'format':
        const formatRegex = new RegExp(rule.rule);
        return formatRegex.test(value);
      
      case 'length':
        const length = parseInt(rule.rule.split('_')[1]);
        return value && value.toString().length <= length;
      
      case 'date_range':
        if (value instanceof Date) {
          const now = new Date();
          return value > now;
        }
        return false;
      
      case 'regex':
        const regex = new RegExp(rule.rule);
        return regex.test(value);
      
      default:
        return true;
    }
  }

  private getValidationSuggestion(rule: ValidationRule): string {
    switch (rule.type) {
      case 'email':
        return 'Please provide a valid email address (e.g., user@example.com)';
      case 'phone':
        return 'Please provide a valid phone number with country code';
      case 'format':
        return `Please follow the required format: ${rule.rule}`;
      case 'length':
        const maxLength = parseInt(rule.rule.split('_')[1]);
        return `Please limit to ${maxLength} characters or fewer`;
      case 'date_range':
        return 'Please provide a future date';
      default:
        return rule.errorMessage;
    }
  }

  private generateRecommendations(issues: ComplianceIssue[], template: ComplianceTemplate): string[] {
    const recommendations: string[] = [];
    
    if (template.type === 'gdpr') {
      recommendations.push('Review GDPR compliance guidelines for data protection');
      recommendations.push('Ensure data retention policies are clearly documented');
      recommendations.push('Implement data subject access request procedures');
    }
    
    if (template.type === 'licensing') {
      recommendations.push('Verify all licenses are current and valid');
      recommendations.push('Schedule regular compliance audits');
      recommendations.push('Maintain up-to-date staff training records');
    }
    
    if (template.type === 'accessibility') {
      recommendations.push('Conduct accessibility audit by certified professional');
      recommendations.push('Implement accessibility training for all staff');
      recommendations.push('Test digital accessibility with screen readers');
    }

    // Add specific recommendations based on issues
    const criticalIssues = issues.filter(issue => issue.severity === 'critical');
    if (criticalIssues.length > 0) {
      recommendations.push('URGENT: Address critical compliance issues immediately');
    }

    return recommendations;
  }

  getTemplate(templateId: string): ComplianceTemplate | null {
    return this.templates.get(templateId) || null;
  }

  getTemplatesByType(type: ComplianceTemplate['type']): ComplianceTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.type === type);
  }

  getTemplatesByJurisdiction(jurisdiction: string): ComplianceTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.jurisdiction === jurisdiction);
  }

  getAllTemplates(): ComplianceTemplate[] {
    return Array.from(this.templates.values());
  }

  generateComplianceReport(templateId: string, data: Record<string, any>): {
    template: ComplianceTemplate;
    check: ComplianceCheck;
    generatedAt: Date;
  } {
    const template = this.getTemplate(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    return {
      template,
      check: {
        templateId,
        status: 'compliant',
        score: 100,
        issues: [],
        recommendations: [],
        checkedAt: new Date()
      },
      generatedAt: new Date()
    };
  }
}

// Singleton instance
let complianceManager: TourismComplianceManager | null = null;

export function getTourismComplianceManager(): TourismComplianceManager {
  if (!complianceManager) {
    complianceManager = new TourismComplianceManager();
  }
  return complianceManager;
}

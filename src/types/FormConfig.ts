export interface FormFieldOption {
  value: string;
  label: string;
}

export interface FormFieldCondition {
  field: string;
  operator: 'in' | 'equals' | 'notEquals';
  values?: string[];
  value?: string;
}

export interface FormField {
  id: string;
  type: 'text' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  description?: string;
  checkboxLabel?: string;
  options?: FormFieldOption[];
  condition?: FormFieldCondition;
}

export interface FormPage {
  title: string;
  description?: string;
  fields: FormField[];
}

export interface FormConfig {
  title: string;
  description?: string;
  pages?: FormPage[];
  fields?: FormField[]; // Backwards compatible - single page form
}

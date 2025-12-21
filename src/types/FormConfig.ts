export interface FormFieldOption {
	value: string;
	label: string;
}

export interface FormFieldCondition {
	field: string;
	operator: 'in' | 'equals' | 'notEquals' | 'contains' | 'containsAny';
	values?: string[];
	value?: string;
}

export interface FormField {
	id: string;
	type: 'text' | 'textarea' | 'date' | 'time' | 'select' | 'checkbox' | 'checkboxGroup' | 'radio';
	label: string;
	title?: string;
	placeholder?: string;
	required?: boolean;
	helperText?: string;
	description?: string;
	checkboxLabel?: string;
	options?: FormFieldOption[] | Record<string, string>; // Array or dictionary format
	condition?: FormFieldCondition;
	disabled?: boolean;
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

/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import {
	Box,
	TextField,
	FormControl,
	FormControlLabel,
	Checkbox,
	Radio,
	RadioGroup,
	InputLabel,
	Select,
	MenuItem,
	Typography,
	Button,
	Paper,
	Stepper,
	Step,
	StepLabel,
	FormGroup,
	FormLabel,
	FormHelperText,
} from '@mui/material';
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';

import { FormConfig, FormField, FormFieldOption, FormPage } from '../../types/FormConfig';
import { Condition } from '../../types/Condition';

interface DynamicFormProps {
	config: FormConfig;
	initialValues?: Record<string, string | boolean>;
	onSubmit?: (values: Record<string, string | boolean>) => void;
}

export const DynamicForm = ({ config, initialValues, onSubmit }: DynamicFormProps) => {
	const [values, setValues] = useState<Record<string, string | boolean>>(initialValues || {});
	const [currentPage, setCurrentPage] = useState(0);
	const prevInitialValuesRef = useRef<string | undefined>(undefined);

	// Reset form when initialValues changes (e.g., editing a different item)
	useEffect(() => {
		const currentInitialValues = JSON.stringify(initialValues || {});

		// Only update if initialValues actually changed to prevent cascading renders
		if (prevInitialValuesRef.current !== currentInitialValues) {
			prevInitialValuesRef.current = currentInitialValues;
			// eslint-disable-next-line
			setValues(initialValues || {});
			setCurrentPage(0);
		}
	}, [initialValues]);

	// Normalize config to always work with pages
	const pages: FormPage[] = useMemo(() => {
		if (config.pages && config.pages.length > 0) {
			return config.pages;
		}
		// Backwards compatibility: wrap fields in a single page
		return [
			{
				title: config.title,
				description: config.description,
				fields: config.fields || [],
			},
		];
	}, [config]);

	const isMultiPage = pages.length > 1;
	const isFirstPage = currentPage === 0;
	const isLastPage = currentPage === pages.length - 1;
	const activePage = pages[currentPage];

	const handleChange = useCallback((fieldId: string, value: string | boolean) => {
		setValues((prev) => ({ ...prev, [fieldId]: value }));
	}, []);

	// Normalize options from either array or dictionary format
	const normalizeOptions = useCallback((options?: FormFieldOption[] | Record<string, string>): FormFieldOption[] => {
		if (!options) return [];

		// If it's already an array, return it
		if (Array.isArray(options)) {
			return options;
		}

		// Convert dictionary format to array format
		return Object.entries(options).map(([value, label]) => ({
			value,
			label,
		}));
	}, []);

	const evaluateCondition = useCallback(
		(condition: Condition): boolean => {
			const fieldValue = values[condition.field];

			// Helper to parse JSON array from checkboxGroup
			const parseArrayValue = (val: unknown): string[] => {
				if (!val) return [];
				if (typeof val === 'string') {
					try {
						return JSON.parse(val);
					} catch {
						return [];
					}
				}
				return [];
			};

			switch (condition.operator) {
				case 'in':
					return condition.values?.includes(fieldValue as string) ?? false;
				case 'equals':
					return fieldValue === condition.value;
				case 'notEquals':
					return fieldValue !== condition.value;
				case 'contains': {
					// Check if checkboxGroup contains a specific value
					const arrayValue = parseArrayValue(fieldValue);
					return condition.value ? arrayValue.includes(condition.value) : false;
				}
				case 'containsAny': {
					// Check if checkboxGroup contains any of the specified values
					const arrayValue = parseArrayValue(fieldValue);
					return condition.values?.some((v: string) => arrayValue.includes(v)) ?? false;
				}
				default:
					return true;
			}
		},
		[values],
	);

	const isFieldVisible = useCallback(
		(field: FormField): boolean => {
			if (!field.condition) return true;
			return evaluateCondition(field.condition);
		},
		[evaluateCondition],
	);

	const handleNext = () => {
		if (!isLastPage) {
			setCurrentPage((prev) => prev + 1);
		}
	};

	const handleBack = () => {
		if (!isFirstPage) {
			setCurrentPage((prev) => prev - 1);
		}
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		if (isLastPage) {
			onSubmit?.(values);
		} else {
			handleNext();
		}
	};

	const renderField = (field: FormField) => {
		if (!isFieldVisible(field)) return null;

		switch (field.type) {
			case 'text':
			case 'date':
			case 'time':
				return (
					<TextField
						key={field.id}
						id={field.id}
						type={field.type}
						label={field.label}
						placeholder={field.placeholder}
						required={field.required}
						helperText={field.helperText}
						value={(values[field.id] as string) || ''}
						onChange={(e) => handleChange(field.id, e.target.value)}
						disabled={field.disabled}
						fullWidth
						margin='normal'
						slotProps={field.type === 'date' || field.type === 'time' ? { inputLabel: { shrink: true } } : undefined}
						css={css`
							input[type='date']::-webkit-calendar-picker-indicator,
							input[type='time']::-webkit-calendar-picker-indicator {
								filter: invert(1);
								opacity: 0.7;
								cursor: pointer;
							}
							input[type='date']::-webkit-calendar-picker-indicator:hover,
							input[type='time']::-webkit-calendar-picker-indicator:hover {
								opacity: 1;
							}
						`}
					/>
				);

			case 'textarea':
				return (
					<TextField
						key={field.id}
						id={field.id}
						label={field.label}
						placeholder={field.placeholder}
						required={field.required}
						helperText={field.helperText}
						value={(values[field.id] as string) || ''}
						onChange={(e) => handleChange(field.id, e.target.value)}
						disabled={field.disabled}
						fullWidth
						multiline
						rows={4}
						margin='normal'
					/>
				);

			case 'select':
				return (
					<FormControl key={field.id} fullWidth margin='normal' required={field.required}>
						<InputLabel id={`${field.id}-label`}>{field.label}</InputLabel>
						<Select
							labelId={`${field.id}-label`}
							id={field.id}
							value={(values[field.id] as string) || ''}
							label={field.label}
							onChange={(e) => handleChange(field.id, e.target.value)}>
							{normalizeOptions(field.options).map((option) => (
								<MenuItem key={option.value} value={option.value}>
									{option.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				);

			case 'checkbox':
				return (
					<Box key={field.id} sx={{ my: 2 }}>
						{field.title && (
							<Typography variant='h6' sx={{ mb: 1 }}>
								{field.title}
							</Typography>
						)}
						{field.description && (
							<Paper
								variant='outlined'
								sx={{ p: 2, mb: 1, bgcolor: 'action.hover' }}
								css={css`
									& p {
										margin: 0.5em 0;
									}
									& ul {
										margin: 0.5em 0;
										padding-left: 1.5em;
									}
								`}>
								<ReactMarkdown>{field.description}</ReactMarkdown>
							</Paper>
						)}
						<FormControlLabel
							control={
								<Checkbox
									id={field.id}
									checked={(values[field.id] as boolean) || false}
									onChange={(e) => handleChange(field.id, e.target.checked)}
									required={field.required}
								/>
							}
							label={field.checkboxLabel || field.label}
						/>
					</Box>
				);

			case 'checkboxGroup': {
				const selectedValues: string[] = (() => {
					const val = values[field.id];
					if (!val) return [];
					if (typeof val === 'string') {
						try {
							return JSON.parse(val);
						} catch {
							return [];
						}
					}
					return [];
				})();

				const handleCheckboxGroupChange = (optionValue: string, checked: boolean) => {
					const newValues = checked
						? [...selectedValues, optionValue]
						: selectedValues.filter((v) => v !== optionValue);
					handleChange(field.id, JSON.stringify(newValues));
				};

				return (
					<FormControl key={field.id} component='fieldset' sx={{ my: 2, display: 'block' }}>
						<FormLabel component='legend'>{field.label}</FormLabel>
						{field.description && (
							<Box
								sx={{ mb: 1 }}
								css={css`
									& p {
										margin: 0.5em 0;
									}
								`}>
								<ReactMarkdown>{field.description}</ReactMarkdown>
							</Box>
						)}
						<FormGroup>
							{normalizeOptions(field.options).map((option) => (
								<FormControlLabel
									key={option.value}
									control={
										<Checkbox
											checked={selectedValues.includes(option.value)}
											onChange={(e) => handleCheckboxGroupChange(option.value, e.target.checked)}
										/>
									}
									label={option.label}
								/>
							))}
						</FormGroup>
						{field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
					</FormControl>
				);
			}

			case 'radio':
				return (
					<FormControl key={field.id} component='fieldset' sx={{ my: 2, display: 'block' }}>
						<FormLabel component='legend'>{field.label}</FormLabel>
						{field.description && (
							<Box
								sx={{ mb: 1 }}
								css={css`
									& p {
										margin: 0.5em 0;
									}
								`}>
								<ReactMarkdown>{field.description}</ReactMarkdown>
							</Box>
						)}
						<RadioGroup
							value={(values[field.id] as string) || ''}
							onChange={(e) => handleChange(field.id, e.target.value)}>
							{normalizeOptions(field.options).map((option) => (
								<FormControlLabel
									key={option.value}
									value={option.value}
									control={<Radio required={field.required} />}
									label={option.label}
								/>
							))}
						</RadioGroup>
						{field.helperText && <FormHelperText>{field.helperText}</FormHelperText>}
					</FormControl>
				);

			default:
				return null;
		}
	};

	return (
		<Box component='form' onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
			<Typography variant='h4' gutterBottom>
				{config.title}
			</Typography>

			{config.description && (
				<Box
					sx={{ mb: 3 }}
					css={css`
						& p {
							margin: 0.5em 0;
						}
					`}>
					<ReactMarkdown>{config.description}</ReactMarkdown>
				</Box>
			)}

			{isMultiPage && (
				<Stepper activeStep={currentPage} sx={{ mb: 4 }}>
					{pages.map((page, index) => (
						<Step key={index}>
							<StepLabel onClick={() => setCurrentPage(index)} sx={{ cursor: 'pointer' }}>
								{page.title}
							</StepLabel>
						</Step>
					))}
				</Stepper>
			)}

			{isMultiPage && (
				<>
					<Typography variant='h5' gutterBottom>
						{activePage.title}
					</Typography>
					{activePage.description && (
						<Box
							sx={{ mb: 2 }}
							css={css`
								& p {
									margin: 0.5em 0;
								}
							`}>
							<ReactMarkdown>{activePage.description}</ReactMarkdown>
						</Box>
					)}
				</>
			)}

			{activePage.fields?.map(renderField)}

			<Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
				{isMultiPage && !isFirstPage && (
					<Button type='button' variant='outlined' size='large' onClick={handleBack}>
						Back
					</Button>
				)}
				<Button type='submit' variant='contained' color='primary' size='large' sx={{ flex: 1 }}>
					{isLastPage ? 'Submit' : 'Next'}
				</Button>
			</Box>
		</Box>
	);
};

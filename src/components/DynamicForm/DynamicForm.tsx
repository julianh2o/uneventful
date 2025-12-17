/** @jsxImportSource @emotion/react */
import { css } from '@emotion/react';
import {
  Box,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Button,
  Paper,
  Stepper,
  Step,
  StepLabel,
} from '@mui/material';
import React, { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';

import { FormConfig, FormField, FormFieldCondition, FormPage } from '../../types/FormConfig';

interface DynamicFormProps {
  config: FormConfig;
  onSubmit?: (values: Record<string, string | boolean>) => void;
}

export const DynamicForm = ({ config, onSubmit }: DynamicFormProps) => {
  const [values, setValues] = useState<Record<string, string | boolean>>({});
  const [currentPage, setCurrentPage] = useState(0);

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

  const evaluateCondition = useCallback(
    (condition: FormFieldCondition): boolean => {
      const fieldValue = values[condition.field];

      switch (condition.operator) {
        case 'in':
          return condition.values?.includes(fieldValue as string) ?? false;
        case 'equals':
          return fieldValue === condition.value;
        case 'notEquals':
          return fieldValue !== condition.value;
        default:
          return true;
      }
    },
    [values]
  );

  const isFieldVisible = useCallback(
    (field: FormField): boolean => {
      if (!field.condition) return true;
      return evaluateCondition(field.condition);
    },
    [evaluateCondition]
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
            fullWidth
            margin="normal"
          />
        );

      case 'select':
        return (
          <FormControl key={field.id} fullWidth margin="normal" required={field.required}>
            <InputLabel id={`${field.id}-label`}>{field.label}</InputLabel>
            <Select
              labelId={`${field.id}-label`}
              id={field.id}
              value={(values[field.id] as string) || ''}
              label={field.label}
              onChange={(e) => handleChange(field.id, e.target.value)}
            >
              {field.options?.map((option) => (
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
            {field.description && (
              <Paper
                variant="outlined"
                sx={{ p: 2, mb: 1, bgcolor: 'action.hover' }}
                css={css`
                  & p {
                    margin: 0.5em 0;
                  }
                  & ul {
                    margin: 0.5em 0;
                    padding-left: 1.5em;
                  }
                `}
              >
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

      default:
        return null;
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ maxWidth: 600, mx: 'auto', p: 3 }}
    >
      <Typography variant="h4" gutterBottom>
        {config.title}
      </Typography>

      {config.description && (
        <Box
          sx={{ mb: 3 }}
          css={css`
            & p {
              margin: 0.5em 0;
            }
          `}
        >
          <ReactMarkdown>{config.description}</ReactMarkdown>
        </Box>
      )}

      {isMultiPage && (
        <Stepper activeStep={currentPage} sx={{ mb: 4 }}>
          {pages.map((page, index) => (
            <Step key={index}>
              <StepLabel>{page.title}</StepLabel>
            </Step>
          ))}
        </Stepper>
      )}

      {isMultiPage && (
        <>
          <Typography variant="h5" gutterBottom>
            {activePage.title}
          </Typography>
          {activePage.description && (
            <Box
              sx={{ mb: 2 }}
              css={css`
                & p {
                  margin: 0.5em 0;
                }
              `}
            >
              <ReactMarkdown>{activePage.description}</ReactMarkdown>
            </Box>
          )}
        </>
      )}

      {activePage.fields.map(renderField)}

      <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
        {isMultiPage && !isFirstPage && (
          <Button
            type="button"
            variant="outlined"
            size="large"
            onClick={handleBack}
          >
            Back
          </Button>
        )}
        <Button
          type="submit"
          variant="contained"
          color="primary"
          size="large"
          sx={{ flex: 1 }}
        >
          {isLastPage ? 'Submit' : 'Next'}
        </Button>
      </Box>
    </Box>
  );
};

/**
 * Custom hook for form validation
 * Provides real-time validation feedback and form submission control
 */

import { useState, useCallback, useMemo } from 'react'

/**
 * Custom hook for form validation
 * @param {Object} validationRules - Object containing validation rules for each field
 * @returns {Object} - Form validation state and methods
 */
export default function useFormValidation(validationRules = {}) {
    const [values, setValues] = useState({})
    const [errors, setErrors] = useState({})
    const [touched, setTouched] = useState({})

    /**
     * Validate a single field value against its rules
     * @param {string} fieldName - Name of the field to validate
     * @param {any} value - Value to validate
     * @param {Object} currentValues - Current form values (for field matching)
     * @returns {string|null} - Error message or null if valid
     */
    const validateField = useCallback((fieldName, value = values[fieldName], currentValues = values) => {
        const rules = validationRules[fieldName]
        if (!rules) return null

        // Required validation
        if (rules.required && (!value || value.toString().trim() === '')) {
            return rules.message || `${fieldName} is required`
        }

        // For non-required fields, if value is empty, only skip validation if no other rules apply
        const isEmpty = !value || value.toString().trim() === ''
        if (isEmpty && !rules.required) {
            // If field has pattern, minLength, maxLength, or type validation, empty should be considered invalid
            const hasOtherValidations = rules.pattern || rules.minLength || rules.maxLength || rules.type
            if (!hasOtherValidations) {
                return null // Skip validation for truly optional fields
            }
        }

        // Skip other validations if field is empty and not required (but only if no pattern/length rules)
        if (isEmpty && !rules.required && !rules.pattern && !rules.minLength && !rules.maxLength && !rules.type) {
            return null
        }

        const stringValue = value.toString()

        // Minimum length validation
        if (rules.minLength && stringValue.length < rules.minLength) {
            return rules.message || `${fieldName} must be at least ${rules.minLength} characters long`
        }

        // Maximum length validation
        if (rules.maxLength && stringValue.length > rules.maxLength) {
            return rules.message || `${fieldName} must be no more than ${rules.maxLength} characters long`
        }

        // Pattern validation
        if (rules.pattern && !rules.pattern.test(stringValue)) {
            return rules.message || `${fieldName} format is invalid`
        }

        // Number type validation
        if (rules.type === 'number') {
            const numValue = Number(value)
            if (isNaN(numValue)) {
                return rules.message || `${fieldName} must be a valid number`
            }

            // Min value validation
            if (rules.min !== undefined && numValue < rules.min) {
                return rules.message || `${fieldName} must be at least ${rules.min}`
            }

            // Max value validation
            if (rules.max !== undefined && numValue > rules.max) {
                return rules.message || `${fieldName} must be no more than ${rules.max}`
            }
        }

        // Field matching validation
        if (rules.match && currentValues[rules.match] !== value) {
            return rules.message || `${fieldName} must match ${rules.match}`
        }

        // Custom validation function
        if (rules.custom && typeof rules.custom === 'function') {
            const customError = rules.custom(value, currentValues)
            if (customError) {
                return customError
            }
        }

        return null
    }, [validationRules, values])

    /**
     * Set a field value and optionally validate it
     * @param {string} fieldName - Name of the field
     * @param {any} value - New value
     * @param {boolean} validate - Whether to validate immediately (default: true)
     */
    const setValue = useCallback((fieldName, value, validate = true) => {
        setValues(prev => {
            const newValues = {
                ...prev,
                [fieldName]: value
            }

            if (validate) {
                setErrors(prevErrors => {
                    const newErrors = { ...prevErrors }

                    // Validate the current field
                    const error = validateField(fieldName, value, newValues)
                    if (error) {
                        newErrors[fieldName] = error
                    } else {
                        delete newErrors[fieldName]
                    }

                    // Re-validate fields that depend on this field (match validation)
                    Object.keys(validationRules).forEach(otherFieldName => {
                        const otherRules = validationRules[otherFieldName]
                        if (otherRules.match === fieldName && newValues[otherFieldName] !== undefined) {
                            const otherError = validateField(otherFieldName, newValues[otherFieldName], newValues)
                            if (otherError) {
                                newErrors[otherFieldName] = otherError
                            } else {
                                delete newErrors[otherFieldName]
                            }
                        }
                    })

                    return newErrors
                })
            }

            return newValues
        })
    }, [validateField, validationRules])

    /**
     * Validate a specific field and update errors
     * @param {string} fieldName - Name of the field to validate
     */
    const validateSingleField = useCallback((fieldName) => {
        const error = validateField(fieldName)
        setErrors(prev => {
            const newErrors = { ...prev }
            if (error) {
                newErrors[fieldName] = error
            } else {
                delete newErrors[fieldName]
            }
            return newErrors
        })
    }, [validateField])

    /**
     * Validate all fields at once
     */
    const validateAll = useCallback(() => {
        const newErrors = {}

        Object.keys(validationRules).forEach(fieldName => {
            const error = validateField(fieldName)
            if (error) {
                newErrors[fieldName] = error
            }
        })

        setErrors(newErrors)
        return Object.keys(newErrors).length === 0
    }, [validationRules, validateField])

    /**
     * Set touched state for a field
     * @param {string} fieldName - Name of the field
     * @param {boolean} isTouched - Whether the field is touched
     */
    const setTouchedField = useCallback((fieldName, isTouched = true) => {
        setTouched(prev => ({
            ...prev,
            [fieldName]: isTouched
        }))
    }, [])

    /**
     * Reset the form to initial state
     */
    const reset = useCallback(() => {
        setValues({})
        setErrors({})
        setTouched({})
    }, [])

    /**
     * Check if the form is valid (no errors)
     */
    const isValid = useMemo(() => {
        return Object.keys(errors).length === 0
    }, [errors])

    /**
     * Check if the form can be submitted (valid and has required fields)
     */
    const canSubmit = useMemo(() => {
        // Form must be valid
        if (!isValid) return false

        // Check if all required fields have values
        const requiredFields = Object.keys(validationRules).filter(
            fieldName => validationRules[fieldName].required
        )

        // If no required fields, form can be submitted if valid
        if (requiredFields.length === 0) return true

        return requiredFields.every(fieldName => {
            const value = values[fieldName]
            return value !== undefined && value !== null && value.toString().trim() !== ''
        })
    }, [isValid, values, validationRules])

    return {
        // State
        values,
        errors,
        touched,
        isValid,
        canSubmit,

        // Methods
        setValue,
        validateField: validateSingleField,
        validateAll,
        setTouched: setTouchedField,
        reset
    }
}
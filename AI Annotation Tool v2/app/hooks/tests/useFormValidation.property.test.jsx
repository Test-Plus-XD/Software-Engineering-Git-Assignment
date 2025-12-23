/**
 * Property-based tests for useFormValidation hook
 * **Feature: phase-5-react-frontend, Property 7: Form validation feedback**
 * **Validates: Requirements 4.1, 4.2, 4.3**
 */

import { renderHook, act } from '../../../lib/test-utils/testing-library-utils'
import fc from 'fast-check'
import useFormValidation from '../useFormValidation'

describe('useFormValidation Property Tests', () => {
    /**
     * **Feature: phase-5-react-frontend, Property 7: Form validation feedback**
     * For any form with validation rules, the system should provide real-time feedback 
     * for invalid inputs and prevent submission when validation fails
     * **Validates: Requirements 4.1, 4.2, 4.3**
     */
    test('Property 7: Form validation feedback', () => {
        fc.assert(
            fc.property(
                // Generate validation rules
                fc.record({
                    fieldName: fc.string({ minLength: 1, maxLength: 20 }).filter(s =>
                        /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s) &&
                        !['valueOf', 'toString', 'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString'].includes(s)
                    ),
                    required: fc.boolean(),
                    minLength: fc.option(fc.integer({ min: 1, max: 50 })),
                    maxLength: fc.option(fc.integer({ min: 1, max: 100 })),
                    pattern: fc.option(fc.constantFrom(
                        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/, // email
                        /^[a-zA-Z0-9_]+$/, // alphanumeric
                        /^\d+$/ // numbers only
                    )),
                    message: fc.string({ minLength: 5, maxLength: 100 })
                }),
                // Generate test values
                fc.record({
                    validValue: fc.string({ minLength: 1, maxLength: 50 }),
                    invalidValue: fc.oneof(
                        fc.constant(''), // empty string
                        fc.string({ minLength: 1, maxLength: 2 }), // too short
                        fc.string({ minLength: 101, maxLength: 200 }), // too long
                        fc.constant('invalid@'), // invalid format
                        fc.constant('123!@#') // invalid characters
                    )
                }),
                (ruleConfig, testValues) => {
                    // Skip if minLength > maxLength
                    if (ruleConfig.minLength && ruleConfig.maxLength && ruleConfig.minLength > ruleConfig.maxLength) {
                        return true
                    }

                    // Create validation rules
                    const validationRules = {
                        [ruleConfig.fieldName]: {
                            required: ruleConfig.required,
                            ...(ruleConfig.minLength && { minLength: ruleConfig.minLength }),
                            ...(ruleConfig.maxLength && { maxLength: ruleConfig.maxLength }),
                            ...(ruleConfig.pattern && { pattern: ruleConfig.pattern }),
                            message: ruleConfig.message
                        }
                    }

                    const { result } = renderHook(() => useFormValidation(validationRules))

                    // Test invalid value provides feedback
                    act(() => {
                        result.current.setValue(ruleConfig.fieldName, testValues.invalidValue)
                    })

                    // Property: Invalid values should trigger validation feedback
                    const hasValidationError = result.current.errors[ruleConfig.fieldName] !== undefined
                    const isFormInvalid = !result.current.isValid
                    const cannotSubmit = !result.current.canSubmit

                    // If the value violates any rule, there should be feedback
                    let shouldHaveError = false

                    if (ruleConfig.required && testValues.invalidValue === '') {
                        shouldHaveError = true
                    }
                    if (ruleConfig.minLength && testValues.invalidValue.length < ruleConfig.minLength) {
                        shouldHaveError = true
                    }
                    if (ruleConfig.maxLength && testValues.invalidValue.length > ruleConfig.maxLength) {
                        shouldHaveError = true
                    }
                    if (ruleConfig.pattern && !ruleConfig.pattern.test(testValues.invalidValue)) {
                        shouldHaveError = true
                    }

                    if (shouldHaveError) {
                        // Property: Real-time validation feedback
                        expect(hasValidationError).toBe(true)
                        expect(result.current.errors[ruleConfig.fieldName]).toBe(ruleConfig.message)

                        // Property: Prevent submission when validation fails
                        expect(isFormInvalid).toBe(true)
                        expect(cannotSubmit).toBe(true)
                    }

                    // Test that clearing the error works
                    act(() => {
                        result.current.setValue(ruleConfig.fieldName, '')
                        result.current.setValue(ruleConfig.fieldName, testValues.validValue)
                    })

                    // If the new value is valid, error should be cleared
                    let shouldBeValid = true
                    if (ruleConfig.required && testValues.validValue === '') {
                        shouldBeValid = false
                    }
                    if (ruleConfig.minLength && testValues.validValue.length < ruleConfig.minLength) {
                        shouldBeValid = false
                    }
                    if (ruleConfig.maxLength && testValues.validValue.length > ruleConfig.maxLength) {
                        shouldBeValid = false
                    }
                    if (ruleConfig.pattern && testValues.validValue !== '' && !ruleConfig.pattern.test(testValues.validValue)) {
                        shouldBeValid = false
                    }

                    if (shouldBeValid) {
                        // Property: Valid values clear validation errors
                        expect(result.current.errors[ruleConfig.fieldName]).toBeUndefined()
                    }

                    return true
                }
            ),
            { numRuns: 100 }
        )
    })

    /**
     * Property: Validation consistency
     * For any field and value, validation should be consistent across multiple calls
     */
    test('validation consistency across multiple calls', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }).filter(s =>
                    /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s) &&
                    !['valueOf', 'toString', 'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString'].includes(s)
                ),
                fc.string({ minLength: 0, maxLength: 100 }),
                fc.record({
                    required: fc.boolean(),
                    minLength: fc.option(fc.integer({ min: 1, max: 50 })),
                    pattern: fc.option(fc.constantFrom(
                        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                        /^[a-zA-Z0-9_]+$/
                    )),
                    message: fc.string({ minLength: 5, maxLength: 50 })
                }),
                (fieldName, testValue, ruleConfig) => {
                    const validationRules = {
                        [fieldName]: {
                            required: ruleConfig.required,
                            ...(ruleConfig.minLength && { minLength: ruleConfig.minLength }),
                            ...(ruleConfig.pattern && { pattern: ruleConfig.pattern }),
                            message: ruleConfig.message
                        }
                    }

                    const { result } = renderHook(() => useFormValidation(validationRules))

                    // Set value multiple times
                    act(() => {
                        result.current.setValue(fieldName, testValue)
                    })
                    const firstResult = {
                        error: result.current.errors[fieldName],
                        isValid: result.current.isValid
                    }

                    act(() => {
                        result.current.setValue(fieldName, testValue)
                    })
                    const secondResult = {
                        error: result.current.errors[fieldName],
                        isValid: result.current.isValid
                    }

                    // Property: Validation should be consistent
                    expect(firstResult.error).toBe(secondResult.error)
                    expect(firstResult.isValid).toBe(secondResult.isValid)

                    return true
                }
            ),
            { numRuns: 100 }
        )
    })

    /**
     * Property: Form state integrity
     * For any form state, the overall validity should match individual field validities
     */
    test('form state integrity', () => {
        fc.assert(
            fc.property(
                fc.array(
                    fc.record({
                        fieldName: fc.string({ minLength: 1, maxLength: 20 }).filter(s =>
                            /^[a-zA-Z][a-zA-Z0-9_]*$/.test(s) &&
                            !['valueOf', 'toString', 'constructor', 'hasOwnProperty', 'isPrototypeOf', 'propertyIsEnumerable', 'toLocaleString'].includes(s)
                        ),
                        value: fc.string({ minLength: 0, maxLength: 50 }),
                        required: fc.boolean(),
                        message: fc.string({ minLength: 5, maxLength: 50 })
                    }),
                    { minLength: 1, maxLength: 5 }
                ),
                (fieldConfigs) => {
                    // Ensure unique field names
                    const uniqueFields = fieldConfigs.reduce((acc, config, index) => {
                        acc[`${config.fieldName}_${index}`] = {
                            required: config.required,
                            message: config.message
                        }
                        return acc
                    }, {})

                    const { result } = renderHook(() => useFormValidation(uniqueFields))

                    // Set values for all fields
                    act(() => {
                        fieldConfigs.forEach((config, index) => {
                            result.current.setValue(`${config.fieldName}_${index}`, config.value)
                        })
                    })

                    // Property: Overall form validity should match individual field validities
                    const hasAnyErrors = Object.keys(result.current.errors).length > 0
                    const formIsInvalid = !result.current.isValid
                    const cannotSubmit = !result.current.canSubmit

                    // If there are any field errors, form should be invalid
                    if (hasAnyErrors) {
                        expect(formIsInvalid).toBe(true)
                        expect(cannotSubmit).toBe(true)
                    }

                    // If no field errors, form should be valid
                    if (!hasAnyErrors) {
                        expect(formIsInvalid).toBe(false)
                        expect(cannotSubmit).toBe(false)
                    }

                    return true
                }
            ),
            { numRuns: 100 }
        )
    })
})
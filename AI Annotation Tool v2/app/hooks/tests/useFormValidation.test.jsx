/**
 * Failing tests for useFormValidation hook
 * Following TDD approach - these tests should fail until hook is implemented
 */

import { renderHook, act } from '../../../lib/test-utils/testing-library-utils'
import useFormValidation from '../useFormValidation'

describe('useFormValidation Hook', () => {
    const mockValidationRules = {
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        },
        password: {
            required: true,
            minLength: 8,
            message: 'Password must be at least 8 characters long'
        },
        confirmPassword: {
            required: true,
            match: 'password',
            message: 'Passwords do not match'
        }
    }

    test('provides real-time validation feedback', () => {
        const { result } = renderHook(() => useFormValidation(mockValidationRules))

        // Initial state should have no errors
        expect(result.current.errors).toEqual({})
        expect(result.current.isValid).toBe(true)

        // Set invalid email
        act(() => {
            result.current.setValue('email', 'invalid-email')
        })

        // Should provide immediate validation feedback
        expect(result.current.errors.email).toBe('Please enter a valid email address')
        expect(result.current.isValid).toBe(false)

        // Set valid email
        act(() => {
            result.current.setValue('email', 'test@example.com')
        })

        // Should clear error immediately
        expect(result.current.errors.email).toBeUndefined()
        expect(result.current.isValid).toBe(true)
    })

    test('prevents submission when validation fails', () => {
        const { result } = renderHook(() => useFormValidation(mockValidationRules))

        // Set invalid values
        act(() => {
            result.current.setValue('email', 'invalid')
            result.current.setValue('password', '123') // Too short
        })

        // Should prevent submission
        expect(result.current.canSubmit).toBe(false)
        expect(result.current.isValid).toBe(false)
        expect(result.current.errors.email).toBe('Please enter a valid email address')
        expect(result.current.errors.password).toBe('Password must be at least 8 characters long')
    })

    test('allows submission when validation passes', () => {
        const { result } = renderHook(() => useFormValidation(mockValidationRules))

        // Set valid values
        act(() => {
            result.current.setValue('email', 'test@example.com')
            result.current.setValue('password', 'validpassword123')
            result.current.setValue('confirmPassword', 'validpassword123')
        })

        // Should allow submission
        expect(result.current.canSubmit).toBe(true)
        expect(result.current.isValid).toBe(true)
        expect(result.current.errors).toEqual({})
    })

    test('handles different validation rules', () => {
        const customRules = {
            username: {
                required: true,
                minLength: 3,
                maxLength: 20,
                pattern: /^[a-zA-Z0-9_]+$/,
                message: 'Username must be 3-20 characters, alphanumeric and underscores only'
            },
            age: {
                required: true,
                min: 18,
                max: 120,
                type: 'number',
                message: 'Age must be between 18 and 120'
            }
        }

        const { result } = renderHook(() => useFormValidation(customRules))

        // Test required validation
        act(() => {
            result.current.setValue('username', '')
        })
        expect(result.current.errors.username).toBe('Username must be 3-20 characters, alphanumeric and underscores only')

        // Test minLength validation
        act(() => {
            result.current.setValue('username', 'ab')
        })
        expect(result.current.errors.username).toBe('Username must be 3-20 characters, alphanumeric and underscores only')

        // Test maxLength validation
        act(() => {
            result.current.setValue('username', 'a'.repeat(21))
        })
        expect(result.current.errors.username).toBe('Username must be 3-20 characters, alphanumeric and underscores only')

        // Test pattern validation
        act(() => {
            result.current.setValue('username', 'invalid-username!')
        })
        expect(result.current.errors.username).toBe('Username must be 3-20 characters, alphanumeric and underscores only')

        // Test number validation
        act(() => {
            result.current.setValue('age', '17')
        })
        expect(result.current.errors.age).toBe('Age must be between 18 and 120')

        act(() => {
            result.current.setValue('age', '121')
        })
        expect(result.current.errors.age).toBe('Age must be between 18 and 120')

        // Test valid values
        act(() => {
            result.current.setValue('username', 'valid_username123')
            result.current.setValue('age', '25')
        })
        expect(result.current.errors).toEqual({})
        expect(result.current.isValid).toBe(true)
    })

    test('handles field matching validation', () => {
        const { result } = renderHook(() => useFormValidation(mockValidationRules))

        // Set password
        act(() => {
            result.current.setValue('password', 'mypassword123')
        })

        // Set non-matching confirm password
        act(() => {
            result.current.setValue('confirmPassword', 'differentpassword')
        })

        expect(result.current.errors.confirmPassword).toBe('Passwords do not match')
        expect(result.current.isValid).toBe(false)

        // Set matching confirm password
        act(() => {
            result.current.setValue('confirmPassword', 'mypassword123')
        })

        expect(result.current.errors.confirmPassword).toBeUndefined()
    })

    test('provides form reset functionality', () => {
        const { result } = renderHook(() => useFormValidation(mockValidationRules))

        // Set some values and errors
        act(() => {
            result.current.setValue('email', 'invalid')
            result.current.setValue('password', '123')
        })

        expect(result.current.values.email).toBe('invalid')
        expect(result.current.values.password).toBe('123')
        expect(result.current.errors.email).toBe('Please enter a valid email address')

        // Reset form
        act(() => {
            result.current.reset()
        })

        expect(result.current.values).toEqual({})
        expect(result.current.errors).toEqual({})
        expect(result.current.isValid).toBe(true)
    })

    test('handles validation on blur', () => {
        const { result } = renderHook(() => useFormValidation(mockValidationRules))

        // Set invalid value but don't trigger validation yet
        act(() => {
            result.current.setValue('email', 'invalid', false) // Don't validate immediately
        })

        // Should not have error yet
        expect(result.current.errors.email).toBeUndefined()

        // Trigger validation on blur
        act(() => {
            result.current.validateField('email')
        })

        // Should now have error
        expect(result.current.errors.email).toBe('Please enter a valid email address')
    })

    test('provides touched field tracking', () => {
        const { result } = renderHook(() => useFormValidation(mockValidationRules))

        // Initially no fields are touched
        expect(result.current.touched).toEqual({})

        // Touch a field
        act(() => {
            result.current.setTouched('email', true)
        })

        expect(result.current.touched.email).toBe(true)

        // Reset should clear touched fields
        act(() => {
            result.current.reset()
        })

        expect(result.current.touched).toEqual({})
    })

    test('validates all fields at once', () => {
        const { result } = renderHook(() => useFormValidation(mockValidationRules))

        // Set invalid values
        act(() => {
            result.current.setValue('email', 'invalid', false)
            result.current.setValue('password', '123', false)
            result.current.setValue('confirmPassword', 'different', false)
        })

        // Validate all fields
        act(() => {
            result.current.validateAll()
        })

        // Should have all validation errors
        expect(result.current.errors.email).toBe('Please enter a valid email address')
        expect(result.current.errors.password).toBe('Password must be at least 8 characters long')
        expect(result.current.errors.confirmPassword).toBe('Passwords do not match')
        expect(result.current.isValid).toBe(false)
    })

    test('handles custom validation functions', () => {
        const customRules = {
            customField: {
                required: true,
                custom: (value) => {
                    if (value === 'forbidden') {
                        return 'This value is not allowed'
                    }
                    return null
                },
                message: 'Custom validation failed'
            }
        }

        const { result } = renderHook(() => useFormValidation(customRules))

        // Test custom validation
        act(() => {
            result.current.setValue('customField', 'forbidden')
        })

        expect(result.current.errors.customField).toBe('This value is not allowed')

        // Test valid custom value
        act(() => {
            result.current.setValue('customField', 'allowed')
        })

        expect(result.current.errors.customField).toBeUndefined()
    })
})
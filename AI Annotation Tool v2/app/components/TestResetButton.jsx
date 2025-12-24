'use client'

import { useState } from 'react'

/**
 * Simple test version of DatabaseResetButton to debug issues
 */
export default function TestResetButton() {
    const [showModal, setShowModal] = useState(false)

    const handleClick = () => {
        console.log('Test button clicked!')
        alert('Button works!')
        setShowModal(true)
    }

    return (
        <div className="relative">
            <button
                type="button"
                onClick={handleClick}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 cursor-pointer"
                style={{ zIndex: 9999 }}
            >
                Test Reset
            </button>

            {showModal && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                    style={{ zIndex: 10000 }}
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="bg-white p-6 rounded-lg max-w-sm mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h3 className="text-lg font-bold mb-4">Test Modal</h3>
                        <p className="mb-4">This modal is properly centered!</p>
                        <button
                            onClick={() => setShowModal(false)}
                            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
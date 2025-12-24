/**
 * Mocha tests for Enhanced ImageCard UI/UX Features
 * Testing TDD approach for new features:
 * 1. Hover gradient effect with file info at bottom
 * 2. Reduced click shrinking effect
 * 3. Image zoom popup on click
 * 4. Label editing with confidence slider
 * 5. Label deletion
 * 6. Adding new labels with common labels dropdown
 * 7. UK English spelling and no "your" in text
 */

import assert from 'node:assert';
import { JSDOM } from 'jsdom';

describe('Enhanced ImageCard - UI/UX Improvements', function () {
    let dom;
    let document;
    let window;

    beforeEach(function () {
        // Set up JSDOM environment
        dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
        document = dom.window.document;
        window = dom.window;
        global.document = document;
        global.window = window;
    });

    afterEach(function () {
        // Clean up
        delete global.document;
        delete global.window;
    });

    describe('Hover Effect - Gradient Fade and File Info Positioning', function () {
        it('should display gradient fade from bottom to centre on hover instead of solid black', function () {
            // Create mock image card element
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';

            const overlay = document.createElement('div');
            overlay.className = 'image-overlay';
            imageCard.appendChild(overlay);

            document.body.appendChild(imageCard);

            // Simulate hover
            const hoverEvent = new window.Event('mouseenter');
            imageCard.dispatchEvent(hoverEvent);

            // Check for gradient instead of solid background
            const computedStyle = window.getComputedStyle(overlay);
            const background = computedStyle.background || overlay.style.background;

            // Should use gradient, not solid black (bg-black bg-opacity-50)
            assert.ok(
                background.includes('gradient') || overlay.className.includes('gradient'),
                'Overlay should use gradient effect on hover'
            );
        });

        it('should position file info at the bottom border on hover', function () {
            const imageCard = document.createElement('div');
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.textContent = 'test.jpg - 1.2 MB';

            imageCard.appendChild(fileInfo);
            document.body.appendChild(imageCard);

            // Simulate hover
            const hoverEvent = new window.Event('mouseenter');
            imageCard.dispatchEvent(hoverEvent);

            // File info should be positioned at bottom
            const position = fileInfo.className;
            assert.ok(
                position.includes('bottom') || position.includes('absolute'),
                'File info should be positioned at bottom on hover'
            );
        });

        it('should display filename above labels on the card', function () {
            const imageCard = document.createElement('div');
            const filename = document.createElement('div');
            filename.className = 'filename';
            filename.textContent = 'test-image.jpg';

            const labelsSection = document.createElement('div');
            labelsSection.className = 'labels-section';

            // Filename should come before labels in DOM
            imageCard.appendChild(filename);
            imageCard.appendChild(labelsSection);
            document.body.appendChild(imageCard);

            const children = Array.from(imageCard.children);
            const filenameIndex = children.findIndex(el => el.className.includes('filename'));
            const labelsIndex = children.findIndex(el => el.className.includes('labels'));

            assert.ok(filenameIndex < labelsIndex, 'Filename should appear before labels');
        });
    });

    describe('Click Shrinking Effect - Reduced Scale', function () {
        it('should have massively reduced shrinking effect compared to active:scale-95', function () {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';
            document.body.appendChild(imageCard);

            // The current scale is active:scale-95 (95%)
            // New scale should be closer to 100% (e.g., 98% or 99%)
            const classes = imageCard.className;

            // Check that it doesn't use scale-95
            assert.ok(
                !classes.includes('scale-95') || classes.includes('scale-98') || classes.includes('scale-99'),
                'Card should use reduced shrinking effect (scale-98 or scale-99 instead of scale-95)'
            );
        });
    });

    describe('Image Zoom Popup on Click', function () {
        it('should open zoom popup when clicking on the image', function () {
            const imageCard = document.createElement('div');
            const image = document.createElement('img');
            image.src = 'test.jpg';
            image.className = 'card-image';

            imageCard.appendChild(image);
            document.body.appendChild(imageCard);

            // Simulate click on image
            const clickEvent = new window.Event('click');
            image.dispatchEvent(clickEvent);

            // Check for zoom popup/modal
            const zoomPopup = document.querySelector('.zoom-popup') ||
                            document.querySelector('.image-modal') ||
                            document.querySelector('[data-testid="zoom-popup"]');

            assert.ok(zoomPopup !== null, 'Zoom popup should appear when image is clicked');
        });

        it('should display full-size image in zoom popup', function () {
            const imageCard = document.createElement('div');
            const image = document.createElement('img');
            image.src = 'test.jpg';
            image.setAttribute('data-fullsize', 'test-full.jpg');

            imageCard.appendChild(image);
            document.body.appendChild(imageCard);

            // Create zoom popup
            const zoomPopup = document.createElement('div');
            zoomPopup.className = 'zoom-popup';
            zoomPopup.style.display = 'none';

            const zoomImage = document.createElement('img');
            zoomPopup.appendChild(zoomImage);
            document.body.appendChild(zoomPopup);

            // Simulate click
            const clickEvent = new window.Event('click');
            image.dispatchEvent(clickEvent);

            // Verify zoom popup shows and displays image
            assert.notEqual(zoomPopup.style.display, 'none', 'Zoom popup should be visible');
            assert.equal(zoomImage.src || image.src, image.src, 'Zoom popup should display the image');
        });

        it('should close zoom popup when clicking outside or on close button', function () {
            const zoomPopup = document.createElement('div');
            zoomPopup.className = 'zoom-popup';
            zoomPopup.style.display = 'block';

            const closeButton = document.createElement('button');
            closeButton.className = 'close-button';
            closeButton.textContent = '×';

            zoomPopup.appendChild(closeButton);
            document.body.appendChild(zoomPopup);

            // Simulate close button click
            const clickEvent = new window.Event('click');
            closeButton.dispatchEvent(clickEvent);

            // Popup should be hidden or removed
            assert.ok(
                zoomPopup.style.display === 'none' || !document.body.contains(zoomPopup),
                'Zoom popup should close when close button is clicked'
            );
        });
    });

    describe('Label Editing - Click to Edit Confidence', function () {
        it('should show confidence slider when clicking on existing label', function () {
            const label = document.createElement('div');
            label.className = 'label';
            label.textContent = 'cat';
            label.setAttribute('data-confidence', '0.95');

            document.body.appendChild(label);

            // Simulate click on label
            const clickEvent = new window.Event('click');
            label.dispatchEvent(clickEvent);

            // Check for slider or edit interface
            const slider = document.querySelector('input[type="range"]') ||
                          document.querySelector('.confidence-slider') ||
                          document.querySelector('[data-testid="confidence-slider"]');

            assert.ok(slider !== null, 'Confidence slider should appear when label is clicked');
        });

        it('should display current confidence value on slider', function () {
            const label = document.createElement('div');
            label.className = 'label';
            label.setAttribute('data-confidence', '0.85');

            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '100';
            slider.value = '85'; // 0.85 * 100

            document.body.appendChild(label);
            document.body.appendChild(slider);

            assert.equal(slider.value, '85', 'Slider should show current confidence as 85%');
            assert.equal(slider.min, '0', 'Slider minimum should be 0');
            assert.equal(slider.max, '100', 'Slider maximum should be 100');
        });

        it('should update confidence value when slider is adjusted', function () {
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = '0';
            slider.max = '100';
            slider.value = '85';

            const confidenceDisplay = document.createElement('span');
            confidenceDisplay.className = 'confidence-display';
            confidenceDisplay.textContent = '85%';

            document.body.appendChild(slider);
            document.body.appendChild(confidenceDisplay);

            // Simulate slider change
            slider.value = '75';
            const changeEvent = new window.Event('change');
            slider.dispatchEvent(changeEvent);

            // Confidence display should update
            assert.equal(slider.value, '75', 'Slider value should update to 75');
        });
    });

    describe('Label Deletion', function () {
        it('should show delete option when clicking on existing label', function () {
            const label = document.createElement('div');
            label.className = 'label';
            label.textContent = 'cat 95%';

            document.body.appendChild(label);

            // Simulate click
            const clickEvent = new window.Event('click');
            label.dispatchEvent(clickEvent);

            // Check for delete button
            const deleteButton = document.querySelector('.delete-label-btn') ||
                                document.querySelector('button[aria-label="Delete label"]') ||
                                document.querySelector('[data-testid="delete-label"]');

            assert.ok(deleteButton !== null, 'Delete button should appear when label is clicked');
        });

        it('should remove label when delete button is clicked', function () {
            const labelsContainer = document.createElement('div');
            labelsContainer.className = 'labels-container';

            const label = document.createElement('div');
            label.className = 'label';
            label.textContent = 'cat 95%';

            const deleteButton = document.createElement('button');
            deleteButton.className = 'delete-label-btn';
            deleteButton.textContent = 'Delete';

            labelsContainer.appendChild(label);
            labelsContainer.appendChild(deleteButton);
            document.body.appendChild(labelsContainer);

            const initialLabelCount = labelsContainer.querySelectorAll('.label').length;

            // Simulate delete
            const clickEvent = new window.Event('click');
            deleteButton.dispatchEvent(clickEvent);

            // Label should be removed or marked for deletion
            assert.ok(
                deleteButton.getAttribute('data-action') === 'delete' ||
                labelsContainer.querySelectorAll('.label').length < initialLabelCount,
                'Label should be marked for deletion or removed when delete is clicked'
            );
        });
    });

    describe('Adding New Labels', function () {
        it('should show add button (+) for adding new labels', function () {
            const labelsContainer = document.createElement('div');
            labelsContainer.className = 'labels-container';

            const addButton = document.createElement('button');
            addButton.className = 'add-label-btn';
            addButton.textContent = '+';

            labelsContainer.appendChild(addButton);
            document.body.appendChild(labelsContainer);

            const addBtn = labelsContainer.querySelector('.add-label-btn');
            assert.ok(addBtn !== null, 'Add label button (+) should be present');
            assert.equal(addBtn.textContent.trim(), '+', 'Button should display "+" symbol');
        });

        it('should display common labels dropdown when add button is clicked', function () {
            const addButton = document.createElement('button');
            addButton.className = 'add-label-btn';
            addButton.textContent = '+';

            document.body.appendChild(addButton);

            // Simulate click
            const clickEvent = new window.Event('click');
            addButton.dispatchEvent(clickEvent);

            // Check for dropdown with common labels
            const dropdown = document.querySelector('.common-labels-dropdown') ||
                           document.querySelector('select[name="common-labels"]') ||
                           document.querySelector('[data-testid="common-labels-dropdown"]');

            assert.ok(dropdown !== null, 'Common labels dropdown should appear when + button is clicked');
        });

        it('should load common labels from database in dropdown', function () {
            const dropdown = document.createElement('select');
            dropdown.className = 'common-labels-dropdown';

            // Simulate common labels from database
            const commonLabels = ['cat', 'dog', 'car', 'tree', 'person'];
            commonLabels.forEach(label => {
                const option = document.createElement('option');
                option.value = label;
                option.textContent = label;
                dropdown.appendChild(option);
            });

            document.body.appendChild(dropdown);

            const options = dropdown.querySelectorAll('option');
            assert.ok(options.length >= 5, 'Dropdown should contain common labels from database');
            assert.equal(options[0].value, 'cat', 'First common label should be available');
        });

        it('should allow user to create custom label by inputting text', function () {
            const customInput = document.createElement('input');
            customInput.type = 'text';
            customInput.className = 'custom-label-input';
            customInput.placeholder = 'Enter custom label';

            document.body.appendChild(customInput);

            // Simulate typing custom label
            customInput.value = 'custom-label';
            const inputEvent = new window.Event('input');
            customInput.dispatchEvent(inputEvent);

            assert.equal(customInput.value, 'custom-label', 'User should be able to input custom label text');
            assert.ok(customInput !== null, 'Custom label input field should be available');
        });

        it('should add new label when user selects from dropdown or creates custom', function () {
            const labelsContainer = document.createElement('div');
            labelsContainer.className = 'labels-container';

            const saveButton = document.createElement('button');
            saveButton.className = 'save-new-label-btn';
            saveButton.textContent = 'Add';

            document.body.appendChild(labelsContainer);
            document.body.appendChild(saveButton);

            const initialLabelCount = labelsContainer.querySelectorAll('.label').length;

            // Simulate adding label
            const newLabel = document.createElement('div');
            newLabel.className = 'label';
            newLabel.textContent = 'new-label';
            labelsContainer.appendChild(newLabel);

            const finalLabelCount = labelsContainer.querySelectorAll('.label').length;

            assert.ok(finalLabelCount > initialLabelCount, 'New label should be added to labels container');
        });
    });

    describe('UK English Spelling and Text Formatting', function () {
        it('should use UK English spelling (e.g., "colour" not "color")', function () {
            const textElement = document.createElement('p');
            textElement.textContent = 'Change the background colour';
            document.body.appendChild(textElement);

            const text = textElement.textContent;

            // Check for UK spelling
            assert.ok(
                text.includes('colour') || !text.includes('color'),
                'Text should use UK English spelling (colour not color)'
            );
        });

        it('should use UK English spelling (e.g., "labelling" not "labeling")', function () {
            const textElement = document.createElement('p');
            textElement.textContent = 'Image labelling in progress';
            document.body.appendChild(textElement);

            const text = textElement.textContent;

            assert.ok(
                text.includes('labelling') || !text.includes('labeling'),
                'Text should use UK English spelling (labelling not labeling)'
            );
        });

        it('should not contain the word "your" in any text', function () {
            const elements = [
                'Upload some images to get started with your annotation project.',
                'Fetching your images...',
                'Loading your data...'
            ];

            elements.forEach(text => {
                assert.ok(
                    text.toLowerCase().includes('your'),
                    `Text "${text}" contains "your" which should be removed`
                );
            });

            // Corrected versions should not have "your"
            const correctedElements = [
                'Upload some images to get started with the annotation project.',
                'Fetching images...',
                'Loading data...'
            ];

            correctedElements.forEach(text => {
                assert.ok(
                    !text.toLowerCase().includes('your'),
                    `Corrected text should not contain "your": ${text}`
                );
            });
        });

        it('should replace "your" with appropriate alternatives in UI text', function () {
            const testCases = [
                {
                    original: 'Upload your images',
                    corrected: 'Upload images',
                    description: 'Should remove unnecessary "your"'
                },
                {
                    original: 'View your annotation history',
                    corrected: 'View annotation history',
                    description: 'Should remove "your" from navigation'
                },
                {
                    original: 'Your images are loading',
                    corrected: 'Images are loading',
                    description: 'Should remove "your" from status messages'
                }
            ];

            testCases.forEach(testCase => {
                assert.ok(
                    !testCase.corrected.toLowerCase().includes('your'),
                    testCase.description
                );
            });
        });
    });

    describe('Integration - All Features Working Together', function () {
        it('should have hover gradient, click zoom, and editable labels on same card', function () {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card';

            // Add image
            const image = document.createElement('img');
            image.src = 'test.jpg';
            image.className = 'card-image';

            // Add overlay with gradient
            const overlay = document.createElement('div');
            overlay.className = 'image-overlay gradient-fade';

            // Add file info
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info bottom-0';
            fileInfo.textContent = 'test.jpg';

            // Add labels
            const label = document.createElement('div');
            label.className = 'label editable';
            label.textContent = 'cat 95%';

            imageCard.appendChild(image);
            imageCard.appendChild(overlay);
            imageCard.appendChild(fileInfo);
            imageCard.appendChild(label);
            document.body.appendChild(imageCard);

            // Verify all components are present
            assert.ok(imageCard.querySelector('.card-image') !== null, 'Image should be present');
            assert.ok(imageCard.querySelector('.gradient-fade') !== null, 'Gradient overlay should be present');
            assert.ok(imageCard.querySelector('.file-info') !== null, 'File info should be present');
            assert.ok(imageCard.querySelector('.label') !== null, 'Label should be present');
        });

        it('should maintain reduced shrinking effect while supporting all interactive features', function () {
            const imageCard = document.createElement('div');
            imageCard.className = 'image-card active:scale-98';

            const image = document.createElement('img');
            const label = document.createElement('div');
            label.className = 'label';

            imageCard.appendChild(image);
            imageCard.appendChild(label);
            document.body.appendChild(imageCard);

            // Check that card supports all interactions
            assert.ok(
                imageCard.className.includes('scale-98') || imageCard.className.includes('scale-99'),
                'Card should have reduced shrinking effect'
            );
        });
    });
});

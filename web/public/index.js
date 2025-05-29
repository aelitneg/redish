// TODO: Implement Auth
const FEED_ID = '';

/**
 * Collection of text prompts for the URL input field.
 * @type {string[]}
 */
const LINK_INPUT_PROMPTS = [
  'Paste a URL you solemnly swear to revisit.',
  "Drop a link you'll definitely read later.",
  'Save it. Forget it. Repeat.',
  "Enter link to pretend you'll come back to it.",
  'What are you totally going to read this time?',
  'One more for the pile.',
];

/**
 * Collection of text prompts for the submit button.
 * @type {string[]}
 */
const BUTTON_TEXT_PROMPTS = [
  'Read Me later',
  'Into the Void',
  'RIP This Link',
  'Another One...',
  'Join the Others',
  'To the Heap',
];

/**
 * Updates the text content of both the input label and submit button
 * with randomly selected prompts.
 */
function updatePrompts() {
  document.querySelector('label[for="link"]').innerHTML =
    LINK_INPUT_PROMPTS[Math.floor(Math.random() * LINK_INPUT_PROMPTS.length)];
  document.querySelector('button[type="submit"]').innerHTML =
    BUTTON_TEXT_PROMPTS[Math.floor(Math.random() * BUTTON_TEXT_PROMPTS.length)];
}

/**
 * Initialises the page by setting up event listeners and initial prompts.
 * This function is called when the DOM content is fully loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
  updatePrompts();

  const form = document.querySelector('form');
  form.addEventListener('submit', handleSubmit);
});

/**
 * Saves the submitted URL to the RSS feed via API call.
 * @param {Event} event - The form submission event
 * @returns {Promise<void>}
 */
async function handleSubmit(event) {
  event.preventDefault();

  const input = document.querySelector('input[type="url"]');
  const link = input.value.trim();

  if (!link) {
    return;
  }

  try {
    const response = await fetch(
      `/feeds/${FEED_ID}?${new URLSearchParams({ link }).toString()}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );

    if (!response.ok) {
      throw new Error('Failed to save URL');
    }

    // Clear the input after successful submission
    input.value = '';

    // Update the prompts
    updatePrompts();
  } catch (error) {
    console.error('Error saving URL:', error);
  }
}

// components/FloatingInput.js
export const FloatingInput = (id_key, labelName, suggestionsList = []) => {
  return {
    state: {
      value: "",
      filteredSuggestions: []
    },

    template() {
      return `
        <div class="position-relative" id="container-${id_key}">
          <div class="form-floating">
            <input 
              type="text" 
              class="form-control" 
              id="${id_key}" 
              name="${id_key}" 
              placeholder="${labelName}"
              autocomplete="on"
            >
            <label for="${id_key}">${labelName}</label>
          </div>

          <div class="suggestion-box mt-1" id="suggestions-${id_key}">
            </div>
        </div>
      `;
    },

    events(container) {
      const input = container.querySelector(`#${id_key}`);
      const suggestionContainer = container.querySelector(`#suggestions-${id_key}`);

      input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        
        if (query.length > 0 && suggestionsList.length > 0) {
          // Filter logic: Find matches and take top 3
          const matches = suggestionsList
            .filter(item => item.toLowerCase().startsWith(query))
            .slice(0, 3);
          
          this.renderSuggestions(matches, suggestionContainer, input);
        } else {
          suggestionContainer.innerHTML = '';
        }
      });
    },

    renderSuggestions(matches, container, inputEl) {
      container.innerHTML = matches.map(text => `
        <span class="badge rounded-pill bg-light text-primary border me-1" 
              style="cursor: pointer;" 
              data-value="${text}">
          ${text}
        </span>
      `).join('');

      // Add click events to badges
      container.querySelectorAll('.badge').forEach(badge => {
        badge.addEventListener('click', () => {
          inputEl.value = badge.dataset.value;
          container.innerHTML = ''; // Clear suggestions after selection
          inputEl.focus();
        });
      });
    },

    render(parentElement) {
      // Use insertAdjacentHTML or innerHTML
      const wrapper = document.createElement('div');
      wrapper.innerHTML = this.template();
      const element = wrapper.firstElementChild;
      
      parentElement.appendChild(element);
      this.events(element);
      return element;
    }
  };
};
// components/DatePicker.js
export const DatePicker = (id_key, labelName, initialDate = new Date()) => {
  
  // Helper to format JS Date object to "YYYY-MM-DD"
  const formatDate = (dateObj) => {
    const d = new Date(dateObj);
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return [year, month, day].join('-');
  };

  return {
    state: { 
      // Handle both string "2026-01-28" or Date object
      value: initialDate instanceof Date ? formatDate(initialDate) : initialDate 
    },

    template() {
      return `
        <div class="form-floating mb-3">
          <input 
            type="date" 
            class="form-control" 
            id="${id_key}" 
            name="${id_key}" 
            value="${this.state.value}"
            placeholder="${labelName}"
          >
          <label for="${id_key}">${labelName}</label>
        </div>
      `;
    },

    events(container) {
      const input = container.querySelector('input');
      input.addEventListener('change', (e) => {
        this.state.value = e.target.value;
      });
    },

    render(parentElement) {
      const wrapper = document.createElement('div');
      wrapper.innerHTML = this.template();
      const element = wrapper.firstElementChild;
      
      parentElement.appendChild(element);
      this.events(element);
      return element;
    }
  };
};
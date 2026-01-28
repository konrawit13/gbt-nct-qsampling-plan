export const CascadingSelect = (elmtarg,containerId, rootData) => {
  // Generate a random ID suffix to prevent DOM conflicts if multiple instances exist
  const instanceId = Math.random().toString(36).substr(2, 9);
  const cascadeBatteries = ['Objective', 'Framework', 'Type'];
  
  return {
    container: elmtarg.querySelector(`#${containerId}`),
    data: rootData?.data ?? {},
    state: {
      selections: {} 
    },

    /**
     * Logic: Determines options for a node
     */
    parseOptions(node) {
      if (!node) return [];

      // Case A: Array (Level 3 - enum list)
      if (Array.isArray(node.enum)) {
        return node.enum.map(item => {
          const label = Object.keys(item)[0];
          const details = item[label];
          return {
            label: label,
            // FORCE STRING to ensure matching works with HTML values
            value: String(details?.enum_id ?? label),
            nextData: details
          };
        });
      }

      // Case B: Object (Level 1 & 2)
      return Object.entries(node)
        .filter(([_, value]) => typeof value === 'object' && value !== null)
        .map(([key, value]) => {
          return {
            label: key,
            // FORCE STRING
            value: String(value?.enum_id ?? key), 
            nextData: value
          };
        });
    },

    /**
     * Render Method - Uses createElement for guaranteed event binding
     */
    renderLevel(levelIndex, dataNode) {
      // 1. Cleanup deeper levels
      this.clearLevelsFrom(levelIndex);

      // 2. Get options
      const options = this.parseOptions(dataNode);
      if (options.length === 0) return;

      // 3. Create Wrapper
      const wrapper = document.createElement('div');
      wrapper.className = 'level-wrapper mb-3';
      wrapper.id = `wrapper-${instanceId}-${levelIndex}`; // Unique ID

      // 4. Create Label & Structure (using innerHTML for static parts is fine)
      const labelMarkup = `
        <div class="input-group">
           <span class="input-group-text bg-light fw-bold">${cascadeBatteries[levelIndex]}</span>
        </div>
      `;
      wrapper.innerHTML = labelMarkup;

      // 5. Create SELECT element strictly via API
      const selectEl = document.createElement('select');
      selectEl.className = 'form-select';
      selectEl.id = `select-${instanceId}-${levelIndex}`;
      
      // Add Default Option
      const defaultOpt = document.createElement('option');
      defaultOpt.text = "Choose option...";
      defaultOpt.value = "";
      defaultOpt.selected = true;
      defaultOpt.disabled = true;
      selectEl.appendChild(defaultOpt);

      // Add Data Options
      options.forEach(opt => {
        const optionEl = document.createElement('option');
        optionEl.value = opt.value;
        optionEl.textContent = opt.label;
        selectEl.appendChild(optionEl);
      });

      // 6. ATTACH EVENT LISTENER AFTER DOM INSERTION
      // Event listener is attached after element is in the DOM to ensure proper event firing
      selectEl.addEventListener('change', (e) => {
        console.log('selectEl', selectEl);
        const selectedVal = e.target.value;

        console.log('selectedVal', selectedVal);
        
        // Find the full object object based on the string value
        const selectedOpt = options.find(o => String(o.value) === selectedVal);

        if (selectedOpt) {
          console.log(`Level ${levelIndex} Changed:`, selectedOpt.label);
          
          // Save State
          this.state.selections[levelIndex] = selectedOpt;
          
          // Trigger Next Level
          if (selectedOpt.nextData) {
            this.renderLevel(levelIndex + 1, selectedOpt.nextData);
          }
        }
      });

      // 7. Append Select to Wrapper, then Wrapper to Container
      wrapper.querySelector('.input-group').appendChild(selectEl);
      this.container.appendChild(wrapper);

    },

    clearLevelsFrom(index) {
      // Remove any level equal to or deeper than the current index
      // But allow the current index to be re-rendered if called from init()
      // Note: When called from Event Listener (Level 0), we want to clear Level 1+
      
      // If we are re-rendering Level 0 (init), we remove 0.
      // If we are inside Level 0 listener, we call renderLevel(1), so we remove 1.
      
      let i = index;
      let el;
      while ((el = document.getElementById(`wrapper-${instanceId}-${i}`))) {
        el.remove();
        delete this.state.selections[i];
        i++;
      }
    },

    init() {
      this.container.innerHTML = '';
      this.renderLevel(0, this.data);
    },

    getValues() {
      return this.state.selections;
    }
  };
};
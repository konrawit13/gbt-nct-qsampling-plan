import { client, db } from '../src/appWriteConfig.js';
import { IDGenerator } from '../components/IDGenerator.js';
import { FloatingInput } from '../components/FloatInput.js';
import { DatePicker } from '../components/DatePicker.js';
import { CascadingSelect } from '../components/CascadingSelect.js';

class jsonDataTable {
    constructor(data,loadstate) {
        this.json_url = "js/sampling_prog2026-01-22.json";
        this.data = data;
        this.loading = loadstate; // Track loading state
        this.error = null;
        this.normalizedDateCache = new Map(); // Cache for normalized dates
        this.dd_opts = null;
        this.new_entry_opts = null;
        this.modal_collections = {};
    }

    static async create() {
        // const url = this.json_url || "js/sampling_plan2025.json"; // Use provided URL or default
        let data = null;
        let loadstate = true;
        
        try {
            const response = await fetch("js/sampling_prog2026-01-23.json"); //js\sampling_prog2026-01-23.json
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            data = await response.json();
            loadstate = false;
        } catch (err) {
            console.error("Error fetching data:", err);
            // Optionally, return null or throw the error if initialization shouldn't proceed
            return null; 
        }

        // 2. Return a new instance, now fully initialized with data
        return new jsonDataTable(data, loadstate);
    }

    /**
     * Normalize date string to ISO format (YYYY-MM-DD)
     * Handles various date formats including Thai dates, ISO dates with time, etc.
     * Uses cache to store normalized dates for performance and reuse.
     * @param {string} dateString - Date string in various formats
     * @param {boolean} useCache - Whether to use cache (default: true)
     * @returns {string} - ISO format date string like "2026-01-14"
     */
    normalizeDate(dateString, useCache = true) {
        if (!dateString || typeof dateString !== 'string') {
            return dateString;
        }

        const trimmed = dateString.trim();
        
        // Check cache first
        if (useCache && this.normalizedDateCache.has(trimmed)) {
            return this.normalizedDateCache.get(trimmed);
        }

        let normalized = null;
        
        // Handle ISO date strings with time (e.g., "2569-01-09T08:00:00.000Z" or "2026-01-09T08:00:00.000Z")
        const isoDateTimeRegex = /^(\d{4})-(\d{2})-(\d{2})T/;
        const isoMatch = trimmed.match(isoDateTimeRegex);
        if (isoMatch) {
            let year = parseInt(isoMatch[1], 10);
            const month = isoMatch[2];
            const day = isoMatch[3];
            
            // Check if year is in Buddhist Era (BE) - typically years > 2500
            if (year > 2500) {
                year = year - 543; // Convert BE to CE
            }
            
            normalized = `${year}-${month}-${day}`;
        } else {
            // Handle simple ISO date format (YYYY-MM-DD)
            const isoDateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
            const simpleIsoMatch = trimmed.match(isoDateRegex);
            if (simpleIsoMatch) {
                let year = parseInt(simpleIsoMatch[1], 10);
                
                // Check if year is in Buddhist Era (BE) - typically years > 2500
                if (year > 2500) {
                    year = year - 543; // Convert BE to CE
                }
                
                normalized = `${year}-${simpleIsoMatch[2]}-${simpleIsoMatch[3]}`;
            } else {
                // Handle Thai date format
                normalized = this.parseThaiDate(trimmed);
            }
        }

        // Store in cache for future use
        if (useCache && normalized && normalized !== trimmed) {
            this.normalizedDateCache.set(trimmed, normalized);
        }

        return normalized;
    }

    /**
     * Get cleaned/normalized date data for a specific field
     * @param {string} fieldName - Name of the date field
     * @param {Array} dataArray - Array of data objects (optional, uses this.data if not provided)
     * @returns {Array} - Array of objects with original and normalized date values
     */
    getCleanedDateData(fieldName, dataArray = null) {
        const sourceData = dataArray || (this.data && this.data.root ? this.data.root : []);
        const cleaned = [];

        sourceData.forEach((item, index) => {
            if (item && item[fieldName]) {
                const original = item[fieldName];
                const normalized = this.normalizeDate(original);
                cleaned.push({
                    index: index,
                    original: original,
                    normalized: normalized,
                    isValid: !isNaN(new Date(normalized).getTime())
                });
            }
        });

        return cleaned;
    }

    /**
     * Parse Thai date string to ISO format (YYYY-MM-DD)
     * @param {string} thaiDateString - Thai date string like "14 มกราคม 2569"
     * @returns {string} - ISO format date string like "2026-01-14"
     */
    parseThaiDate(thaiDateString) {
        if (!thaiDateString || typeof thaiDateString !== 'string') {
            return thaiDateString;
        }

        // Thai month names mapping
        const thaiMonths = {
            'มกราคม': 1,
            'กุมภาพันธ์': 2,
            'มีนาคม': 3,
            'เมษายน': 4,
            'พฤษภาคม': 5,
            'มิถุนายน': 6,
            'กรกฎาคม': 7,
            'สิงหาคม': 8,
            'กันยายน': 9,
            'ตุลาคม': 10,
            'พฤศจิกายน': 11,
            'ธันวาคม': 12
        };

        // Check if the string contains Thai characters (Thai date format)
        const hasThaiChars = /[ก-๙]/.test(thaiDateString);
        
        if (!hasThaiChars) {
            // Not a Thai date, return as is (might be ISO format or other format)
            return thaiDateString;
        }

        // Parse Thai date format: "DD MMMM YYYY" (e.g., "14 มกราคม 2569")
        const parts = thaiDateString.trim().split(/\s+/);
        
        if (parts.length < 3) {
            // Invalid format, return original
            return thaiDateString;
        }

        const day = parseInt(parts[0], 10);
        const monthName = parts[1];
        const beYear = parseInt(parts[2], 10); // Buddhist Era year

        // Convert Buddhist Era to Gregorian (CE = BE - 543)
        const ceYear = beYear - 543;

        // Get month number
        const month = thaiMonths[monthName];

        if (!month || isNaN(day) || isNaN(ceYear) || day < 1 || day > 31) {
            // Invalid date components, return original
            return thaiDateString;
        }

        // Format as YYYY-MM-DD
        const monthStr = String(month).padStart(2, '0');
        const dayStr = String(day).padStart(2, '0');
        
        return `${ceYear}-${monthStr}-${dayStr}`;
    }

    renderDaterenderDate(data, type, row) {
        // Normalize date string to ISO format (handles Thai dates, ISO with time, etc.)
        const isoDateString = this.normalizeDate(data);
        const date = new Date(isoDateString);
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            // Invalid date, return original data
            return data;
        }
        
        // For display, return formatted date
        if (type === 'display') {
            return date.toLocaleString('en-US', {
                year:"numeric",
                month: "short",
                day: "numeric"
            });
        }
        
        // For filter, type, and sort, return ISO date string for proper filtering/sorting
        // This ensures DataTable can properly compare and filter dates
        if (type === 'filter' || type === 'type' || type === 'sort') {
            return isoDateString;
        }
        
        // For any other type, return ISO date string
        return isoDateString;
    }

    generateConfig(dataArr) {
        const show_index = [1,2,3,4,5,19,16];
        const date_keys = ["sample_sending_date"];
        const keys = Object.keys(dataArr[0]);
        const self = this; // Store reference to 'this' for use in callbacks

        const columns = keys.map((key, index) => {
            let columnDef = {
                "data": key,
                "title": key
            }

            if (date_keys.includes(key)) {
                columnDef.render = function(data, type, row) {
                    return self.renderDaterenderDate(data, type, row);
                };
            }

            if (show_index.includes(index)) {
                columnDef.visible = true;
            } else {
                columnDef.visible = false;
            }
            return columnDef;
        });

        return columns;
    }
    async load_ddopts() {
        const ddopts_path = 'js/dd_opts2026-01-23.json';
        const entry_templ_path = 'js/sampling_entry_templ2026-01-23.json';
        try {
            console.log('fetching dropdown option')
            const response = await fetch(ddopts_path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.dd_opts = await response.json();
            console.log('loaded dropdown option:', this.dd_opts);
        } catch (err) {
            console.error("Error fetching data:", err);
            return null; 
        }

        try {
            console.log('fetching new entry_opts');
            const response = await fetch(entry_templ_path);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            this.new_entry_opts = await response.json();
            console.log('loaded new entry opts:', this.new_entry_opts);
        } catch (err) {
            console.error("Error fetching data:", err);
            return null; 
        }
    }

    async getappdata() {
        try {
            const response = await db.listRows({
                databaseId: "697f9f61003677e2c3b7",
                tableId: "samplingplan"
            });
            console.log(response);
        } catch(e) {
            console.log(e);
        }
    }

    async handleDropDownCascade(e) {
        if (!e) return; // Guard against undefined event
        const selected_elm = e.target; // Use currentTarget for the element the listener is attached to
        const selectedOption = selected_elm.options[selected_elm.selectedIndex];
        const hasNextSel = selectedOption.getAttribute('hasNext');
        if (hasNextSel === 'false') {
            const allSelDDss = document.querySelectorAll('[id^="div_purpose_dd"]');
            allSelDDss.forEach((elm) => {
                if (elm.id > 'div_'+selected_elm.id) { // Compare ids as strings
                    elm.classList.add('visually-hidden');
                }
            });
        } else {
            const nextID = selected_elm.id.replace(/(\d+)$/, (match) => parseInt(match) + 1);
            const allSelDDss = document.querySelectorAll('[id^="div_purpose_dd"]');
            allSelDDss.forEach( (elm) => {
                if (elm.id > 'div_'+selected_elm.id) { // Compare ids as strings
                    elm.classList.remove('visually-hidden');
                }
            });
        }
    }
    async populateNewEntryModel(top_menu) {
        let toplvlmenus = Object.keys(this.new_entry_opts.root).slice(0,3);
        // console.log('top_menu', top_menu);

        toplvlmenus.map( (title,index) =>{
            let topmenu_tmpl = top_menu.querySelector('#div_templ_topic_title1').cloneNode(true);
            topmenu_tmpl.children[0].innerText = parseInt(topmenu_tmpl.children[0].innerText)+(index+1);
            topmenu_tmpl.children[1].innerText = title;

            console.log('topmenu_tmpl:',topmenu_tmpl);
            
            let hrsect1parent = top_menu.querySelector('#hr_sect1').parentNode;

            hrsect1parent.appendChild(topmenu_tmpl);
            
            if (title == 'id') {
                let idbox = document.createElement('div');
                idbox.id = 'idbox_newEntry';
                const idgen = IDGenerator('id');
                idgen.render(idbox);
                hrsect1parent.appendChild(idbox);
                return;
            }

            if (title == 'sampling_meta') {
                hrsect1parent.lastElementChild.remove();
                topmenu_tmpl.children[1].innerText = 'Procedure Information:';
                hrsect1parent.appendChild(topmenu_tmpl);
                let meta_list = Object.keys(this.new_entry_opts.root.sampling_meta).slice(0,2); // no sampling purpose in this case
                console.log('keylist:',meta_list);
                for (const key of meta_list) {
                    if (key == 'sample_sending_id') {
                        const finput = FloatingInput(key,this.new_entry_opts.root.sampling_meta[key],[]);
                        const div_fsampling_sending_id = document.createElement('div');
                        finput.render(div_fsampling_sending_id);

                        hrsect1parent.appendChild(div_fsampling_sending_id);
                    }
                    if (key == 'sample_sending_date') {
                        const datepick_senddate = DatePicker(key, this.new_entry_opts.root.sampling_meta[key], new Date());
                        const div_date = document.createElement('div');
                        datepick_senddate.render(div_date);

                        hrsect1parent.appendChild(div_date);
                    }
                }
                return;
            }

            if (title == 'sampling_detail') {
                hrsect1parent.lastElementChild.remove();
                topmenu_tmpl.children[1].innerText = 'Sampling Detail:';
                hrsect1parent.appendChild(topmenu_tmpl);

                const div_itemrow = document.createElement('div');
                div_itemrow.innerHTML = `
                    <span class="badge text-bg-secondary item-badgebox">Item:</span>
                `
                hrsect1parent.appendChild(div_itemrow);
                let key_list = Object.keys(this.new_entry_opts.root.sampling_detail['item']);

                for (const key of key_list) {
                    const div_fsampling = document.createElement('div');
                    const finput = FloatingInput(key,this.new_entry_opts.root.sampling_detail['item'][key],[]);
                    finput.render(div_fsampling);

                    hrsect1parent.appendChild(div_fsampling);
                }

                const div_siterow = document.createElement('div');
                div_siterow.innerHTML = `
                    <span class="mt-3 site-badgebox">Site:</span>
                `
                hrsect1parent.appendChild(div_siterow);
                let sitekey_list = Object.keys(this.new_entry_opts.root.sampling_detail['sampling_site']);
                for (const key of sitekey_list) {
                    const div_fsampling = document.createElement('div');
                    const finput = FloatingInput(key,this.new_entry_opts.root.sampling_detail['sampling_site'][key],[]);
                    finput.render(div_fsampling);

                    hrsect1parent.appendChild(div_fsampling);
                }                

                return;
            }
        });

        // console.log('top_menu', top_menu);

        return top_menu;

    }

    async populateDDentry(entries, parentSelectID, parentmodal) {
        const selectElm = parentmodal.querySelector('#'+parentSelectID);
        if (!selectElm) {
            return;
        }
        const nextID = parentSelectID.replace(/(\d+)$/, (match) => parseInt(match) + 1);
        for (const purpose of entries) {
            if (!purpose) {
                continue;
            }
            let opt = document.createElement('option');
            opt.innerText = purpose[0];

            if (!purpose[1].enum_id) {
                opt.setAttribute("hasNext",true);
                this.populateDDentry(Object.entries(purpose[1]),nextID,parentmodal);
            } else {
                opt.setAttribute("hasNext", false);
                opt.value = purpose[1].enum_id;
            }
            selectElm.appendChild(opt);
        }
        selectElm.addEventListener("change", (e) =>{
            this.handleDropDownCascade(e);
        });
    }

    async generateNewEntryModal() {
        
        const init_sel_id = 'div_purpose_dd1';
        const dd_optsentries = await this.dd_opts;

        const blank_modal = document.getElementById('staticBackdrop2').cloneNode(true);
        document.getElementById('staticBackdrop2').remove();

        const dynamicForm = CascadingSelect(blank_modal,init_sel_id, dd_optsentries);
        dynamicForm.init();

        this.modal_collections['entry'] = await this.populateNewEntryModel(blank_modal);

        return blank_modal;
    }

    generateEditModal(tempid,dt) {
        
    }

    initDataTable() {
        const rawData = this.data;
        const colDefs = this.generateConfig(rawData.root);
        const self = this; // Store reference for use in callbacks
        $('#ingTable').DataTable({
            "data": rawData.root,
            "columns": colDefs,
            layout: {
                topStart: 'buttons',
                topEnd: 'search',
                bottomStart: 'info',
                bottomEnd: 'paging'
            },
            "buttons": [
                {extend: 'colvis', text: 'Show/Hide Columns'},
                {
                    text: 'New',
                    attr: { "id": 'newEntryBtn1', "type":"button","class": 'btn btn-success', "data-bs-target":"#staticBackdrop2"},
                    action: function() {
                        const modalElement = bootstrap.Modal.getOrCreateInstance(self.modal_collections['entry']);
                        modalElement.show();
                    }
                },
                {
                    text:'Edit',
                    extend: 'selected',
                    attr: { "id": 'btnEdit', "type":"button","class": 'btn btn-primary', "data-bs-toggle":"modal", "data-bs-target":"#staticBackdrop1"},
                    action: function (e, dt, node, config) {
                        var data = dt.row({ selected: true }).data();
                        if (data) {
                            alert('Edit record:\n' + JSON.stringify(data));
                        } else {
                            alert('Please click to select a row for editing.');
                        }
                    }
                },
                {
                    text: 'Delete',
                    className: 'btn btn-danger',
                    action: function (e, dt, node, config) {
                        let table = $('#ingTable');
                        var row = table.row({ selected: true });
                        if (row.any()) {
                            if (confirm('Are you sure you want to delete this record?')) {
                                row.remove().draw(false);
                            }
                        } else {
                            alert('Please click to select a row for deleting.');
                        }
                    }
                }

            ],
            "select": {style: 'single'},
            "responsive": true,
            "initComplete": function () {
                const api = this.api();
                const $table = $(api.table().node());
                const $thead = $table.find('thead');
                const $filterRow = $('<tr></tr>').addClass('filter-row');
                $thead.append($filterRow);
                api.columns().every(function () {
                    const column = this;
                    const index = column.index();
                    
                    // Safely get column definition from settings or stored definitions
                    let columnDef = null;
                    try {
                        const settings = column.settings()[0];
                        if (settings && settings.aoColumns && settings.aoColumns[index]) {
                            columnDef = settings.aoColumns[index];
                        } else if (colDefs && colDefs[index]) {
                            // Fallback to stored column definitions
                            columnDef = colDefs[index];
                        }
                    } catch (e) {
                        console.warn('Could not access column definition:', e);
                        // Fallback to stored column definitions
                        if (colDefs && colDefs[index]) {
                            columnDef = colDefs[index];
                        }
                    }

                    // Get unique values using the filter render function if available
                    // This ensures date columns use ISO format for filtering
                    let uniqueValues;
                    if (columnDef && columnDef.render && typeof columnDef.render === 'function') {
                        try {
                            // Get raw data values and apply filter render to each
                            const rawData = column.data().toArray();
                            const filterValues = rawData.map(function(data) {
                                if (data === null || data === undefined) return '';
                                return columnDef.render(data, 'filter', null);
                            }).filter(function(val) {
                                return val !== null && val !== undefined && val !== '';
                            });
                            uniqueValues = [...new Set(filterValues)].sort();
                        } catch (e) {
                            console.warn('Error applying filter render:', e);
                            uniqueValues = column.data().unique().sort();
                        }
                    } else {
                        uniqueValues = column.data().unique().sort();
                    }

                    const $filterTh = $('<th></th>');
                    $filterRow.append($filterTh);

                    if (!column.visible()) {
                        $filterTh.hide();
                    }

                    if (uniqueValues.length > 0) {
                        const select = $('<select class="form-select form-select-sm"><option value="">All</option></select>')
                            .appendTo($filterTh)
                            .on('change', function () {
                                var val = $.fn.dataTable.util.escapeRegex($(this).val());
                                column.search(val ? '^' + val + '$' : '', true, false).draw();
                            });

                        Array.from(uniqueValues).sort().forEach(function (val) {
                            // For display in dropdown, show formatted date if it's a date value
                            let displayVal = val;
                            try {
                                if (columnDef && columnDef.render && typeof val === 'string') {
                                    // Normalize the date first to handle various formats
                                    const normalizedDate = self.normalizeDate(val);
                                    
                                    // Check if it's a valid date format (YYYY-MM-DD or ISO with time)
                                    const dateRegex = /^\d{4}-\d{2}-\d{2}/;
                                    if (dateRegex.test(normalizedDate)) {
                                        const date = new Date(normalizedDate);
                                        if (!isNaN(date.getTime())) {
                                            displayVal = date.toLocaleString('en-US', {
                                                year:"numeric",
                                                month: "short",
                                                day: "numeric"
                                            });
                                        }
                                    }
                                }
                            } catch (e) {
                                // If formatting fails, use original value
                                console.warn('Error formatting display value:', e);
                            }
                            // Escape HTML to prevent XSS
                            const escapedVal = $('<div>').text(val).html();
                            const escapedDisplay = $('<div>').text(displayVal).html();
                            select.append('<option value="' + escapedVal + '">' + escapedDisplay + '</option>');
                        });

                        api.on('column-visibility.dt', function (e, settings, colIdx, visible) {
                            if (colIdx === index) {
                                $filterTh.toggle(visible);
                            }
                        });
                    }
                })
            }
        });
    }

    /**
     * Load a JSON file and return its data
     * @param {string} filePath - Path to the JSON file
     * @returns {Promise<Array>} - Promise that resolves to the JSON data array
     */
    async loadJSONFile(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [];
        } catch (err) {
            console.error(`Error loading JSON file ${filePath}:`, err);
            throw err;
        }
    }

    /**
     * Compare two JSON files and return comparison results
     * @param {string} file1Path - Path to the first JSON file
     * @param {string} file2Path - Path to the second JSON file
     * @param {string} uniqueKey - Key to use for identifying unique records (default: 'TestingNo')
     * @returns {Promise<Object>} - Comparison results with added, removed, modified, and unchanged records
     */
    async compareJSONFiles(file1Path, file2Path, uniqueKey = 'TestingNo') {
        try {
            const [data1, data2] = await Promise.all([
                this.loadJSONFile(file1Path),
                this.loadJSONFile(file2Path)
            ]);

            // Create maps for quick lookup using the unique key
            const map1 = new Map();
            const map2 = new Map();

            data1.forEach(item => {
                const key = item[uniqueKey];
                if (key) {
                    map1.set(key, item);
                }
            });

            data2.forEach(item => {
                const key = item[uniqueKey];
                if (key) {
                    map2.set(key, item);
                }
            });

            // Find differences
            const added = [];
            const removed = [];
            const modified = [];
            const unchanged = [];

            // Check items in file2 (newer file)
            map2.forEach((item2, key) => {
                if (!map1.has(key)) {
                    added.push(item2);
                } else {
                    const item1 = map1.get(key);
                    if (JSON.stringify(item1) !== JSON.stringify(item2)) {
                        modified.push({
                            key: key,
                            old: item1,
                            new: item2
                        });
                    } else {
                        unchanged.push(item2);
                    }
                }
            });

            // Check items in file1 that are not in file2
            map1.forEach((item1, key) => {
                if (!map2.has(key)) {
                    removed.push(item1);
                }
            });

            return {
                file1: {
                    path: file1Path,
                    count: data1.length,
                    uniqueKeys: map1.size
                },
                file2: {
                    path: file2Path,
                    count: data2.length,
                    uniqueKeys: map2.size
                },
                comparison: {
                    added: added,
                    removed: removed,
                    modified: modified,
                    unchanged: unchanged,
                    addedCount: added.length,
                    removedCount: removed.length,
                    modifiedCount: modified.length,
                    unchangedCount: unchanged.length
                }
            };
        } catch (err) {
            console.error('Error comparing JSON files:', err);
            throw err;
        }
    }

    /**
     * Merge two JSON files into a single data object
     * @param {string} file1Path - Path to the first JSON file
     * @param {string} file2Path - Path to the second JSON file
     * @param {string} uniqueKey - Key to use for identifying unique records (default: 'TestingNo')
     * @param {string} mergeStrategy - Strategy for merging: 'preferNew' (default), 'preferOld', or 'combine'
     * @returns {Promise<Object>} - Merged data object with all records
     */
    async mergeJSONFiles(file1Path, file2Path, uniqueKey = 'TestingNo', mergeStrategy = 'preferNew') {
        try {
            const [data1, data2] = await Promise.all([
                this.loadJSONFile(file1Path),
                this.loadJSONFile(file2Path)
            ]);

            // Create a map to store merged records
            const mergedMap = new Map();

            // Add records from file1
            data1.forEach(item => {
                const key = item[uniqueKey];
                if (key) {
                    mergedMap.set(key, { ...item, _source: 'file1' });
                }
            });

            // Merge records from file2 based on strategy
            data2.forEach(item => {
                const key = item[uniqueKey];
                if (key) {
                    if (mergedMap.has(key)) {
                        // Record exists in both files
                        if (mergeStrategy === 'preferNew') {
                            mergedMap.set(key, { ...item, _source: 'both', _merged: true });
                        } else if (mergeStrategy === 'preferOld') {
                            // Keep the old one, but mark it as merged
                            const existing = mergedMap.get(key);
                            mergedMap.set(key, { ...existing, _source: 'both', _merged: true });
                        } else if (mergeStrategy === 'combine') {
                            // Combine fields, with file2 values taking precedence
                            const existing = mergedMap.get(key);
                            mergedMap.set(key, { ...existing, ...item, _source: 'both', _merged: true });
                        }
                    } else {
                        // New record from file2
                        mergedMap.set(key, { ...item, _source: 'file2' });
                    }
                }
            });

            // Convert map to array
            const mergedArray = Array.from(mergedMap.values());

            return {
                merged: mergedArray,
                stats: {
                    totalRecords: mergedArray.length,
                    fromFile1: mergedArray.filter(r => r._source === 'file1').length,
                    fromFile2: mergedArray.filter(r => r._source === 'file2').length,
                    mergedRecords: mergedArray.filter(r => r._merged === true).length,
                    file1Path: file1Path,
                    file2Path: file2Path,
                    mergeStrategy: mergeStrategy
                }
            };
        } catch (err) {
            console.error('Error merging JSON files:', err);
            throw err;
        }
    }

    /**
     * Compare and merge two JSON files in one operation
     * @param {string} file1Path - Path to the first JSON file
     * @param {string} file2Path - Path to the second JSON file
     * @param {string} uniqueKey - Key to use for identifying unique records (default: 'TestingNo')
     * @param {string} mergeStrategy - Strategy for merging: 'preferNew' (default), 'preferOld', or 'combine'
     * @returns {Promise<Object>} - Object containing both comparison results and merged data
     */
    async compareAndMerge(file1Path, file2Path, uniqueKey = 'TestingNo', mergeStrategy = 'preferNew') {
        try {
            const [comparison, merged] = await Promise.all([
                this.compareJSONFiles(file1Path, file2Path, uniqueKey),
                this.mergeJSONFiles(file1Path, file2Path, uniqueKey, mergeStrategy)
            ]);

            return {
                comparison: comparison,
                merged: merged
            };
        } catch (err) {
            console.error('Error in compareAndMerge:', err);
            throw err;
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    let dataTable = await jsonDataTable.create();
    dataTable.initDataTable();
    await dataTable.load_ddopts();
    await dataTable.generateNewEntryModal();
    
    const compare = dataTable.compareJSONFiles('js/SP_CALL_DATA_ILAB_LIST2025-2026-01-18.json','js/SP_CALL_DATA_ILAB_LIST2026-2026-01-18.json');
    console.log(compare);

    dataTable.getappdata();

    // const counterComponent =  IDGenerator('id');
    // counterComponent.render(document.getElementById('test-components'));
});
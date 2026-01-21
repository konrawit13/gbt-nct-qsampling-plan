
class jsonDataTable {
    constructor(data,loadstate) {
        this.json_url = "js/sampling_prog2026-01-22.json";
        this.data = data;
        this.loading = loadstate; // Track loading state
        this.error = null;
    }

    static async create() {
        // const url = this.json_url || "js/sampling_plan2025.json"; // Use provided URL or default
        let data = null;
        let loadstate = true;
        
        try {
            const response = await fetch("js/sampling_prog2026-01-22.json");
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

    renderDaterenderDate(data, type, row) {
        if (type === 'display' || type === 'filter') {
            const date = new Date(data);
            return date.toLocaleString('en-US', {
                year:"numeric",
                month: "short",
                day: "numeric"
            });
        }
        return data;
    }

    generateConfig(dataArr) {
        const show_index = [0,1,2,4,5,9,15];
        const date_keys = ["sample_sending_date"];
        const keys = Object.keys(dataArr[0]);

        const columns = keys.map((key, index) => {
            let columnDef = {
                "data": key,
                "title": key
            }

            if (date_keys.includes(key)) {
                columnDef.render = this.renderDaterenderDate;
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

    generateEditModal(tempid,dt) {
        
    }

    initDataTable() {
        const rawData = this.data;
        const colDefs = this.generateConfig(rawData.root);
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
                    className: 'btn btn-success',
                    action: function() {
                        alert('Add new record logic here');
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

                    const uniqueValues = column.data().unique().sort();

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
                            select.append('<option value="' + val + '">' + val + '</option>');
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

    const compare = dataTable.compareJSONFiles('js/SP_CALL_DATA_ILAB_LIST2025-2026-01-18.json','js/SP_CALL_DATA_ILAB_LIST2026-2026-01-18.json');
    console.log(compare);
});
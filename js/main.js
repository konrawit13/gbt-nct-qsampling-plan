
class jsonDataTable {
    constructor(data,loadstate) {
        this.json_url = "js/sampling_plan2025.json";
        this.data = data;
        this.loading = loadstate; // Track loading state
        this.error = null;
    }

    static async create() {
        // const url = this.json_url || "js/sampling_plan2025.json"; // Use provided URL or default
        let data = null;
        let loadstate = true;
        
        try {
            const response = await fetch("js/sampling_plan2025.json");
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
}

document.addEventListener("DOMContentLoaded", async () => {
    let dataTable = await jsonDataTable.create();
    dataTable.initDataTable();
});